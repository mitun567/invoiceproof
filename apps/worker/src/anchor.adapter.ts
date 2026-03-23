import { Injectable } from "@nestjs/common";
import crypto from "crypto";
import {
  Contract,
  JsonRpcProvider,
  TransactionReceipt,
  Wallet,
  id,
  isHexString,
} from "ethers";

const ANCHOR_REGISTRY_ABI = [
  "event BatchAnchored(bytes32 indexed batchId, bytes32 indexed merkleRoot, uint256 anchoredAt)",
  "function anchorBatch(bytes32 batchId, bytes32 merkleRoot) external",
  "function getBatchRoot(bytes32 batchId) external view returns (bytes32 merkleRoot, uint256 anchoredAt)",
] as const;

@Injectable()
export class AnchorAdapter {
  private normalizeRoot(value: string) {
    if (isHexString(value, 32)) return value;
    const prefixed = value.startsWith("0x") ? value : `0x${value}`;
    if (!isHexString(prefixed, 32)) {
      throw new Error(`Invalid Merkle root format: ${value}`);
    }
    return prefixed;
  }

  private normalizeBatchId(value: string) {
    if (isHexString(value, 32)) return value;
    return id(value);
  }

  private buildProviders() {
    return [process.env.RPC_PRIMARY_URL, process.env.RPC_FALLBACK_URL]
      .filter((url): url is string => Boolean(url))
      .map((url) => new JsonRpcProvider(url));
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableSendError(error: any) {
    const code = String(
      error?.code ?? error?.error?.code ?? error?.info?.error?.code ?? ""
    );
    const shortMessage = String(error?.shortMessage ?? "").toLowerCase();
    const message = String(error?.message ?? "").toLowerCase();
    const rpcMessage = String(
      error?.error?.message ?? error?.info?.error?.message ?? ""
    ).toLowerCase();
    const method = String(
      error?.payload?.method ?? error?.info?.payload?.method ?? ""
    );

    return (
      method === "eth_getTransactionCount" ||
      code === "UNKNOWN_ERROR" ||
      code === "-32603" ||
      shortMessage.includes("could not coalesce error") ||
      message.includes("internal error") ||
      rpcMessage.includes("internal error") ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("socket") ||
      message.includes("temporarily unavailable") ||
      message.includes("too many requests") ||
      message.includes("429")
    );
  }

  private isRetryableReceiptError(error: any) {
    const code = String(
      error?.code ?? error?.error?.code ?? error?.info?.error?.code ?? ""
    );
    const shortMessage = String(error?.shortMessage ?? "").toLowerCase();
    const message = String(error?.message ?? "").toLowerCase();
    const rpcMessage = String(
      error?.error?.message ?? error?.info?.error?.message ?? ""
    ).toLowerCase();
    const method = String(
      error?.payload?.method ?? error?.info?.payload?.method ?? ""
    );

    return (
      method === "eth_getTransactionReceipt" &&
      (code === "26" ||
        code === "UNKNOWN_ERROR" ||
        shortMessage.includes("could not coalesce error") ||
        message.includes("unknown block") ||
        rpcMessage.includes("unknown block") ||
        message.includes("timeout") ||
        message.includes("network"))
    );
  }

  private async waitForReceiptWithRetry(
    txHash: string,
    confirmations: number,
    providers: JsonRpcProvider[]
  ) {
    const maxAttempts = Number(process.env.ANCHOR_RECEIPT_MAX_ATTEMPTS || 40);
    const delayMs = Number(process.env.ANCHOR_RECEIPT_POLL_MS || 3000);
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      for (const provider of providers) {
        try {
          const receipt = await provider.getTransactionReceipt(txHash);

          if (!receipt) {
            continue;
          }

          if (confirmations <= 1) {
            return receipt;
          }

          const currentBlock = await provider.getBlockNumber();
          const minedConfirmations = currentBlock - receipt.blockNumber + 1;

          if (minedConfirmations >= confirmations) {
            return receipt;
          }
        } catch (error) {
          lastError = error;
          if (!this.isRetryableReceiptError(error)) {
            throw error;
          }
        }
      }

      await this.sleep(delayMs);
    }

    if (
      lastError instanceof Error &&
      !this.isRetryableReceiptError(lastError)
    ) {
      throw lastError;
    }

    throw new Error(`Timed out waiting for transaction receipt for ${txHash}`);
  }

  async anchorBatch(input: {
    batchId: string;
    merkleRoot: string;
    timestamp: number;
  }) {
    const contractAddress = process.env.ANCHOR_CONTRACT_ADDRESS;
    const privateKey = process.env.ANCHOR_PRIVATE_KEY;
    const providers = this.buildProviders();
    const useMock =
      process.env.USE_MOCK_ANCHOR === "true" ||
      !contractAddress ||
      !privateKey ||
      providers.length === 0;

    if (useMock) {
      const txHash = `0x${crypto
        .createHash("sha256")
        .update(`${input.batchId}:${input.merkleRoot}:${input.timestamp}`)
        .digest("hex")}`;

      return {
        batchId: input.batchId,
        chainBatchId: this.normalizeBatchId(input.batchId),
        txHash,
        network: process.env.CHAIN_NETWORK || "mock-local",
        contractAddress: contractAddress || "0xMockAnchorRegistry",
        anchoredAt: new Date(),
        merkleRoot: this.normalizeRoot(input.merkleRoot),
        isMock: true,
      };
    }

    const merkleRoot = this.normalizeRoot(input.merkleRoot);
    const chainBatchId = this.normalizeBatchId(input.batchId);
    const confirmations = Number(process.env.ANCHOR_CONFIRMATIONS || 1);

    let tx: any = null;
    let sendProvider: JsonRpcProvider | null = null;
    let lastSendError: unknown;

    for (const provider of providers) {
      try {
        const wallet = new Wallet(privateKey, provider);
        const contract = new Contract(
          contractAddress,
          ANCHOR_REGISTRY_ABI,
          wallet
        );

        tx = await contract.anchorBatch(chainBatchId, merkleRoot);
        sendProvider = provider;
        break;
      } catch (error) {
        lastSendError = error;
        const isLastProvider = provider === providers[providers.length - 1];

        if (!this.isRetryableSendError(error) || isLastProvider) {
          throw error;
        }
      }
    }

    if (!tx || !sendProvider) {
      throw lastSendError instanceof Error
        ? lastSendError
        : new Error("Failed to submit anchor transaction");
    }

    const receiptProviders = [
      sendProvider,
      ...providers.filter((provider) => provider !== sendProvider),
    ];

    let receipt: TransactionReceipt | null = null;

    try {
      receipt = await tx.wait(confirmations);
    } catch (error) {
      if (!this.isRetryableReceiptError(error)) {
        throw error;
      }
    }

    receipt ||= await this.waitForReceiptWithRetry(
      tx.hash,
      confirmations,
      receiptProviders
    );

    return {
      batchId: input.batchId,
      chainBatchId,
      txHash: receipt.hash || tx.hash,
      network: process.env.CHAIN_NETWORK || "polygon",
      contractAddress,
      anchoredAt: new Date(),
      merkleRoot,
      isMock: false,
    };
  }
}

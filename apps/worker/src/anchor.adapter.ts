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

type ProviderEntry = {
  url: string;
  provider: JsonRpcProvider;
};

type SendAnchorBatchResult = {
  batchId: string;
  chainBatchId: string;
  txHash: string;
  nonce: bigint | null;
  network: string;
  contractAddress: string;
  sentAt: Date;
  merkleRoot: string;
  providerUsed: string;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  isMock: boolean;
};

type ReceiptLookupResult = {
  status: "pending" | "confirmed";
  receipt: TransactionReceipt | null;
  providerUsed: string | null;
  anchoredAt: Date | null;
};

type OnChainBatchState = {
  exists: boolean;
  merkleRoot: string | null;
  anchoredAt: Date | null;
  providerUsed: string | null;
};

@Injectable()
export class AnchorAdapter {
  private readonly zeroRoot = `0x${"00".repeat(32)}`;

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

  private buildProviders(): ProviderEntry[] {
    return [process.env.RPC_PRIMARY_URL, process.env.RPC_FALLBACK_URL]
      .filter((url): url is string => Boolean(url))
      .map((url) => ({
        url,
        provider: new JsonRpcProvider(url),
      }));
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
        message.includes("network") ||
        message.includes("temporarily unavailable") ||
        message.includes("429"))
    );
  }

  private isRetryableReadError(error: any) {
    const code = String(
      error?.code ?? error?.error?.code ?? error?.info?.error?.code ?? ""
    );
    const message = String(error?.message ?? "").toLowerCase();
    const rpcMessage = String(
      error?.error?.message ?? error?.info?.error?.message ?? ""
    ).toLowerCase();

    return (
      code === "UNKNOWN_ERROR" ||
      code === "-32603" ||
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("temporarily unavailable") ||
      message.includes("429") ||
      rpcMessage.includes("timeout") ||
      rpcMessage.includes("network")
    );
  }

  async getBatchState(input: { batchId: string }): Promise<OnChainBatchState> {
    const contractAddress = process.env.ANCHOR_CONTRACT_ADDRESS;
    const providers = this.buildProviders();

    if (
      process.env.USE_MOCK_ANCHOR === "true" ||
      !contractAddress ||
      providers.length === 0
    ) {
      return {
        exists: false,
        merkleRoot: null,
        anchoredAt: null,
        providerUsed: null,
      };
    }

    const chainBatchId = this.normalizeBatchId(input.batchId);

    for (const entry of providers) {
      try {
        const contract = new Contract(
          contractAddress,
          ANCHOR_REGISTRY_ABI,
          entry.provider
        );
        const result: any = await contract.getBatchRoot(chainBatchId);
        const merkleRoot = String(
          result?.[0] ?? result?.merkleRoot ?? this.zeroRoot
        );
        const anchoredAtRaw = result?.[1] ?? result?.anchoredAt ?? 0n;
        const anchoredAtSeconds =
          typeof anchoredAtRaw === "bigint"
            ? anchoredAtRaw
            : BigInt(anchoredAtRaw?.toString?.() ?? "0");

        if (merkleRoot !== this.zeroRoot && anchoredAtSeconds > 0n) {
          return {
            exists: true,
            merkleRoot,
            anchoredAt: new Date(Number(anchoredAtSeconds) * 1000),
            providerUsed: entry.url,
          };
        }

        return {
          exists: false,
          merkleRoot: null,
          anchoredAt: null,
          providerUsed: entry.url,
        };
      } catch (error) {
        if (!this.isRetryableReadError(error)) {
          throw error;
        }
      }
    }

    return {
      exists: false,
      merkleRoot: null,
      anchoredAt: null,
      providerUsed: null,
    };
  }

  async sendAnchorBatch(input: {
    batchId: string;
    merkleRoot: string;
    timestamp: number;
  }): Promise<SendAnchorBatchResult> {
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
        nonce: 0n,
        network: process.env.CHAIN_NETWORK || "mock-local",
        contractAddress: contractAddress || "0xMockAnchorRegistry",
        sentAt: new Date(),
        merkleRoot: this.normalizeRoot(input.merkleRoot),
        providerUsed: "mock-local",
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        isMock: true,
      };
    }

    const merkleRoot = this.normalizeRoot(input.merkleRoot);
    const chainBatchId = this.normalizeBatchId(input.batchId);
    let lastSendError: unknown;

    for (const entry of providers) {
      try {
        const wallet = new Wallet(privateKey, entry.provider);
        const contract = new Contract(
          contractAddress,
          ANCHOR_REGISTRY_ABI,
          wallet
        );
        const tx: any = await contract.anchorBatch(chainBatchId, merkleRoot);

        return {
          batchId: input.batchId,
          chainBatchId,
          txHash: tx.hash,
          nonce: typeof tx.nonce === "number" ? BigInt(tx.nonce) : null,
          network: process.env.CHAIN_NETWORK || "polygon",
          contractAddress,
          sentAt: new Date(),
          merkleRoot,
          providerUsed: entry.url,
          maxFeePerGas: tx.maxFeePerGas?.toString?.() ?? null,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString?.() ?? null,
          isMock: false,
        };
      } catch (error) {
        lastSendError = error;
        const isLastProvider = entry === providers[providers.length - 1];

        if (!this.isRetryableSendError(error) || isLastProvider) {
          throw error;
        }
      }
    }

    throw lastSendError instanceof Error
      ? lastSendError
      : new Error("Failed to submit anchor transaction");
  }

  async getTransactionReceiptSafe(input: {
    txHash: string;
    confirmations?: number;
  }): Promise<ReceiptLookupResult> {
    const providers = this.buildProviders();
    const confirmations = Number(input.confirmations || 1);
    const useMock =
      process.env.USE_MOCK_ANCHOR === "true" || providers.length === 0;

    if (useMock) {
      return {
        status: "confirmed",
        receipt: null,
        providerUsed: "mock-local",
        anchoredAt: new Date(),
      };
    }

    for (const entry of providers) {
      try {
        const receipt = await entry.provider.getTransactionReceipt(
          input.txHash
        );

        if (!receipt) {
          continue;
        }

        if (confirmations > 1) {
          const currentBlock = await entry.provider.getBlockNumber();
          const minedConfirmations = currentBlock - receipt.blockNumber + 1;

          if (minedConfirmations < confirmations) {
            return {
              status: "pending",
              receipt,
              providerUsed: entry.url,
              anchoredAt: null,
            };
          }
        }

        return {
          status: "confirmed",
          receipt,
          providerUsed: entry.url,
          anchoredAt: new Date(),
        };
      } catch (error) {
        if (!this.isRetryableReceiptError(error)) {
          throw error;
        }
      }
    }

    return {
      status: "pending",
      receipt: null,
      providerUsed: null,
      anchoredAt: null,
    };
  }

  async anchorBatch(input: {
    batchId: string;
    merkleRoot: string;
    timestamp: number;
  }) {
    return this.sendAnchorBatch(input);
  }
}

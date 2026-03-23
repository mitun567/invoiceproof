import { Injectable } from "@nestjs/common";
import crypto from "crypto";
import { Contract, JsonRpcProvider, Wallet, id, isHexString } from "ethers";

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

  private isRetryableRpcError(error: any) {
    const code = String(error?.code ?? error?.error?.code ?? "");
    const shortMessage = String(error?.shortMessage ?? "").toLowerCase();
    const message = String(error?.message ?? "").toLowerCase();
    const rpcMessage = String(error?.error?.message ?? "").toLowerCase();
    const payloadMethod = String(
      error?.payload?.method ?? error?.info?.payload?.method ?? ""
    );

    return (
      payloadMethod === "eth_getTransactionCount" ||
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

    let lastError: unknown;

    for (const provider of providers) {
      try {
        const wallet = new Wallet(privateKey, provider);
        const contract = new Contract(
          contractAddress,
          ANCHOR_REGISTRY_ABI,
          wallet
        );

        const tx = await contract.anchorBatch(chainBatchId, merkleRoot);
        const receipt = await tx.wait(confirmations);

        return {
          batchId: input.batchId,
          chainBatchId,
          txHash: receipt?.hash || tx.hash,
          network: process.env.CHAIN_NETWORK || "polygon",
          contractAddress,
          anchoredAt: new Date(),
          merkleRoot,
          isMock: false,
        };
      } catch (error) {
        lastError = error;

        const isLastProvider = provider === providers[providers.length - 1];
        if (!this.isRetryableRpcError(error) || isLastProvider) {
          throw error;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Anchor submission failed");
  }
}

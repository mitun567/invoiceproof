import crypto from 'crypto';

export interface AnchorResult {
  batchId: string;
  txHash?: string;
  network?: string;
  contractAddress?: string;
  anchoredAt?: number;
}

export interface ProofAnchor {
  anchorBatch(input: {
    batchId: string;
    merkleRoot: string;
    timestamp: number;
  }): Promise<AnchorResult>;
}

export class MockAnchorAdapter implements ProofAnchor {
  async anchorBatch(input: { batchId: string; merkleRoot: string; timestamp: number }): Promise<AnchorResult> {
    const txHash = `0x${crypto
      .createHash('sha256')
      .update(`${input.batchId}:${input.merkleRoot}:${input.timestamp}`)
      .digest('hex')}`;

    return {
      batchId: input.batchId,
      txHash,
      network: process.env.CHAIN_NETWORK || 'mock-local',
      contractAddress: process.env.ANCHOR_CONTRACT_ADDRESS || '0xMockAnchorRegistry',
      anchoredAt: Date.now(),
    };
  }
}

export const ANCHOR_REGISTRY_ABI = [
  'event BatchAnchored(string indexed batchId, bytes32 indexed merkleRoot, uint256 anchoredAt)',
  'function anchorBatch(string calldata batchId, bytes32 merkleRoot) external',
  'function getBatchRoot(string calldata batchId) external view returns (bytes32 merkleRoot, uint256 anchoredAt)',
] as const;

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AnchorRegistry
/// @notice Minimal contract for anchoring Merkle roots for invoice proof batches.
/// @dev Keep this contract intentionally tiny. No invoice business logic should live here.
contract AnchorRegistry {
    struct BatchInfo {
        bytes32 merkleRoot;
        uint256 anchoredAt;
    }

    mapping(string => BatchInfo) private batches;

    event BatchAnchored(string indexed batchId, bytes32 indexed merkleRoot, uint256 anchoredAt);

    error BatchAlreadyAnchored();
    error EmptyBatchId();
    error EmptyMerkleRoot();

    function anchorBatch(string calldata batchId, bytes32 merkleRoot) external {
        if (bytes(batchId).length == 0) revert EmptyBatchId();
        if (merkleRoot == bytes32(0)) revert EmptyMerkleRoot();
        if (batches[batchId].anchoredAt != 0) revert BatchAlreadyAnchored();

        batches[batchId] = BatchInfo({
            merkleRoot: merkleRoot,
            anchoredAt: block.timestamp
        });

        emit BatchAnchored(batchId, merkleRoot, block.timestamp);
    }

    function getBatchRoot(string calldata batchId) external view returns (bytes32 merkleRoot, uint256 anchoredAt) {
        BatchInfo memory batch = batches[batchId];
        return (batch.merkleRoot, batch.anchoredAt);
    }
}

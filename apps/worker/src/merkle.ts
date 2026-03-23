import crypto from 'crypto';

export type MerkleProofNode = {
  position: 'left' | 'right';
  hash: string;
};

function sha256String(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashPair(left: string, right: string) {
  return sha256String(`${left}:${right}`);
}

export function buildMerkleTree(leafHashes: string[]) {
  if (leafHashes.length === 0) {
    throw new Error('Cannot build a Merkle tree with zero leaves.');
  }

  const levels: string[][] = [leafHashes];
  let currentLevel = leafHashes;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];

    for (let index = 0; index < currentLevel.length; index += 2) {
      const left = currentLevel[index];
      const right = currentLevel[index + 1] || left;
      nextLevel.push(hashPair(left, right));
    }

    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  const proofs = leafHashes.map((leafHash, leafIndex) => {
    const proof: MerkleProofNode[] = [];
    let index = leafIndex;

    for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex += 1) {
      const level = levels[levelIndex];
      const isRightNode = index % 2 === 1;
      const pairIndex = isRightNode ? index - 1 : index + 1;
      const siblingHash = level[pairIndex] || level[index];

      proof.push({
        position: isRightNode ? 'left' : 'right',
        hash: siblingHash,
      });

      index = Math.floor(index / 2);
    }

    return { leafHash, proof };
  });

  return {
    root: levels[levels.length - 1][0],
    proofs,
  };
}

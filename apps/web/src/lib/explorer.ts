export function getExplorerBaseUrl(network?: string | null) {
  const normalized = (network || '').toLowerCase();

  if (normalized.includes('polygon')) return 'https://polygonscan.com';
  if (normalized.includes('base-sepolia')) return 'https://sepolia.basescan.org';
  if (normalized === 'base' || normalized.includes('base mainnet')) return 'https://basescan.org';

  return null;
}

export function getTransactionUrl(txHash?: string | null, network?: string | null) {
  const baseUrl = getExplorerBaseUrl(network);
  if (!baseUrl || !txHash) return null;
  return `${baseUrl}/tx/${txHash}`;
}

export function getAddressUrl(address?: string | null, network?: string | null) {
  const baseUrl = getExplorerBaseUrl(network);
  if (!baseUrl || !address) return null;
  return `${baseUrl}/address/${address}`;
}

export function shortenHash(value?: string | null, start = 10, end = 8) {
  if (!value) return 'Not available yet';
  if (value.length <= start + end) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

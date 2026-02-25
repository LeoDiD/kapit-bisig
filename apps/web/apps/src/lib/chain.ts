const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
const DEFAULT_TX_EXPLORER_BASE = 'https://sepolia.etherscan.io/tx/';

export const chainConfig = {
  chainId: DEFAULT_CHAIN_ID,
  txExplorerBaseUrl:
    process.env.NEXT_PUBLIC_TX_EXPLORER_BASE_URL || DEFAULT_TX_EXPLORER_BASE,
};

export function getTxExplorerUrl(txHash: string): string {
  if (!txHash) return '';
  const normalized = txHash.trim();
  if (!normalized) return '';

  const base = chainConfig.txExplorerBaseUrl.endsWith('/')
    ? chainConfig.txExplorerBaseUrl
    : `${chainConfig.txExplorerBaseUrl}/`;
  return `${base}${normalized}`;
}

/** Map API `blockchain` to EIP-155 chain id for `wallet_switchEthereumChain`. */
const BLOCKCHAIN_TO_CHAIN_ID: Record<string, number> = {
  eth: 1,
  arb: 42161,
  base: 8453,
  bsc: 56,
  pol: 137,
  op: 10,
  avax: 43114,
  gnosis: 100,
  bera: 80094,
  pharos: 1672,
};

export function getChainIdForTokenBlockchain(blockchain: string): number | undefined {
  return BLOCKCHAIN_TO_CHAIN_ID[blockchain];
}

export async function ensureEthereumChain(chainId: number): Promise<void> {
  const eth = (typeof window !== 'undefined' ? window : undefined) as
    | (Window & { ethereum?: { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> } })
    | undefined;
  const provider = eth?.ethereum;
  if (!provider?.request) return;
  const chainIdHex = `0x${chainId.toString(16)}`;
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (e: unknown) {
    const err = e as { code?: number };
    if (err?.code === 4902) {
      throw new Error(`Add network for chain id ${chainId} in your wallet, then retry.`);
    }
    throw e;
  }
}

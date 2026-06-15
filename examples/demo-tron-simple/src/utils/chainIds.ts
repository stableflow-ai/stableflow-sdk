import { TokenResponse } from '@stableflow/core';

export const PLASMA_CHAIN_ID = 9745;

/** Map API `blockchain` to EIP-155 chain id for `wallet_switchEthereumChain`. */
const BLOCKCHAIN_TO_CHAIN_ID: Partial<Record<TokenResponse.blockchain, number>> & Record<string, number> = {
  [TokenResponse.blockchain.ETH]: 1,
  [TokenResponse.blockchain.ARB]: 42161,
  [TokenResponse.blockchain.BASE]: 8453,
  [TokenResponse.blockchain.BSC]: 56,
  [TokenResponse.blockchain.POL]: 137,
  [TokenResponse.blockchain.OP]: 10,
  [TokenResponse.blockchain.AVAX]: 43114,
  [TokenResponse.blockchain.GNOSIS]: 100,
  [TokenResponse.blockchain.BERA]: 80094,
  plasma: PLASMA_CHAIN_ID,
};

export function getChainIdForTokenBlockchain(blockchain: TokenResponse.blockchain | string): number | undefined {
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

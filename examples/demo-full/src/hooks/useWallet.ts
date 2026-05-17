import { useMemo } from 'react';
import useWalletsStore from '@/stores/use-wallets';
import type { TokenConfig } from '@stableflow/core';
import { useSwitchChain } from 'wagmi';

interface WalletSlice {
  account: string | null;
  wallet?: unknown;
  connect: () => void;
  disconnect: () => void;
}

interface UseWalletResult {
  address?: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  chainType: string | null;
  wallet?: WalletSlice;
  switchNetwork: (fromChain: TokenConfig) => void;
}

export const useWallet = (chain?: TokenConfig | null): UseWalletResult => {
  const wallets = useWalletsStore();

  const wallet = useMemo((): WalletSlice | undefined => {
    if (!chain) return undefined;
    switch (chain.chainType) {
      case 'evm':
        return wallets.evm;
      case 'aptos':
        return wallets.aptos;
      case 'sol':
        return wallets.sol;
      case 'near':
        return wallets.near;
      case 'sui':
        return wallets.sui;
      case 'ton':
        return wallets.ton;
      case 'tron':
        return wallets.tron;
      default:
        return undefined;
    }
  }, [chain, wallets]);

  const [address, isConnected] = useMemo(() => [wallet?.account, !!wallet?.account], [wallet]);

  const connect = async () => {
    if (!chain || !wallet) {
      throw new Error(`${chain?.chainType ?? 'unknown'} wallet provider not found`);
    }
    wallet.connect();
  };

  const disconnect = async () => {
    if (!chain || !wallet) {
      throw new Error(`${chain?.chainType ?? 'unknown'} wallet provider not found`);
    }
    wallet.disconnect();
  };

  const { switchChain } = useSwitchChain();
  const switchNetwork = (fromChain: TokenConfig) => {
    if (fromChain?.chainType !== 'evm' || !fromChain.chainId) return;
    switchChain({ chainId: fromChain.chainId });
  };

  return {
    wallet: wallet as UseWalletResult['wallet'],
    address,
    isConnected,
    connect,
    disconnect,
    chainType: chain?.chainType || null,
    switchNetwork,
  };
};

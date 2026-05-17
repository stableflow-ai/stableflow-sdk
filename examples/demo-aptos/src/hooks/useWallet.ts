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
    if (chain.chainType === 'evm') return wallets.evm;
    if (chain.chainType === 'aptos') return wallets.aptos;
    return undefined;
  }, [chain, wallets.evm, wallets.aptos]);

  const [address, isConnected] = useMemo(() => {
    return [wallet?.account, !!wallet?.account];
  }, [wallet]);

  const connect = async () => {
    if (!chain) return;
    if (!wallet) {
      throw new Error(`${chain.chainType} wallet provider not found`);
    }
    wallet.connect();
  };

  const disconnect = async () => {
    if (!chain) return;
    if (!wallet) {
      throw new Error(`${chain.chainType} wallet provider not found`);
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

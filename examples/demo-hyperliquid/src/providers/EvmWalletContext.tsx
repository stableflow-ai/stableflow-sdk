import React, { createContext, useContext, useState } from 'react';
import type { EVMWallet } from '@stableflow/wallet-evm';
import { useAccount, useSwitchChain } from 'wagmi';

interface EvmWalletState {
  account?: string | null;
  chainId?: number;
  wallet?: EVMWallet | null;
  connect?: () => void;
  disconnect?: () => void;
}

interface EvmWalletContextValue {
  wallet: EvmWalletState;
  setWallet: React.Dispatch<React.SetStateAction<EvmWalletState>>;
  currentChainId?: number;
  onSwitchChain?: (params: { chainId: number }) => Promise<unknown>;
}

const EvmWalletContext = createContext<EvmWalletContextValue>({
  wallet: {},
  setWallet: () => {},
});

export function EvmWalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<EvmWalletState>({});
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  return (
    <EvmWalletContext.Provider
      value={{
        wallet,
        setWallet,
        currentChainId: chainId,
        onSwitchChain: switchChainAsync,
      }}
    >
      {children}
    </EvmWalletContext.Provider>
  );
}

export function useEvmWalletContext() {
  return useContext(EvmWalletContext);
}

import { create } from 'zustand';

interface EvmWalletSlice {
  account: string | null;
  chainId: number | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
}

interface AptosWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface WalletsState {
  evm: EvmWalletSlice;
  aptos: AptosWalletSlice;
  set: (params: {
    evm?: Partial<EvmWalletSlice>;
    aptos?: Partial<AptosWalletSlice>;
  } & Partial<Omit<WalletsState, 'set' | 'evm' | 'aptos'>>) => void;
}

const useWalletsStore = create<WalletsState>((set) => ({
  evm: {
    account: null,
    wallet: null,
    chainId: null,
    connect: () => {},
    disconnect: () => {},
    walletIcon: null,
  },
  aptos: {
    account: null,
    wallet: null,
    connect: () => {},
    disconnect: () => {},
    walletIcon: null,
    walletName: null,
  },
  set: (params) =>
    set((state) => ({
      ...state,
      ...params,
      evm: params.evm !== undefined ? { ...state.evm, ...params.evm } : state.evm,
      aptos: params.aptos !== undefined ? { ...state.aptos, ...params.aptos } : state.aptos,
    })),
}));

export default useWalletsStore;

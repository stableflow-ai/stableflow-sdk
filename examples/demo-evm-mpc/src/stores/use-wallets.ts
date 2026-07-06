import { create } from 'zustand';

interface EvmWalletSlice {
  account: string | null;
  chainId: number | null;
  wallet: any;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
}

interface WalletsState {
  evm: EvmWalletSlice;
  set: (params: { evm?: Partial<EvmWalletSlice> } & Partial<Omit<WalletsState, 'set' | 'evm'>>) => void;
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
  set: (params) =>
    set((state) => ({
      ...state,
      ...params,
      evm: params.evm !== undefined ? { ...state.evm, ...params.evm } : state.evm,
    })),
}));

export default useWalletsStore;

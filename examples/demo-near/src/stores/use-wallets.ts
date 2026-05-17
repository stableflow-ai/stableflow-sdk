import { create } from 'zustand';

interface EvmWalletSlice {
  account: string | null;
  chainId: number | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
}

interface NearWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface WalletsState {
  evm: EvmWalletSlice;
  near: NearWalletSlice;
  set: (params: {
    evm?: Partial<EvmWalletSlice>;
    near?: Partial<NearWalletSlice>;
  }) => void;
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
  near: {
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
      evm: params.evm !== undefined ? { ...state.evm, ...params.evm } : state.evm,
      near: params.near !== undefined ? { ...state.near, ...params.near } : state.near,
    })),
}));

export default useWalletsStore;

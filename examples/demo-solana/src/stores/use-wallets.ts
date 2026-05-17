import { create } from 'zustand';

interface EvmWalletSlice {
  account: string | null;
  chainId: number | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
}

interface SolWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface WalletsState {
  evm: EvmWalletSlice;
  sol: SolWalletSlice;
  set: (params: { evm?: Partial<EvmWalletSlice>; sol?: Partial<SolWalletSlice> }) => void;
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
  sol: {
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
      sol: params.sol !== undefined ? { ...state.sol, ...params.sol } : state.sol,
    })),
}));

export default useWalletsStore;

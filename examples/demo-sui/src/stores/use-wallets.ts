import { create } from 'zustand';

interface EvmWalletSlice {
  account: string | null;
  chainId: number | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
}

interface SuiWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface WalletsState {
  evm: EvmWalletSlice;
  sui: SuiWalletSlice;
  set: (params: { evm?: Partial<EvmWalletSlice>; sui?: Partial<SuiWalletSlice> }) => void;
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
  sui: {
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
      sui: params.sui !== undefined ? { ...state.sui, ...params.sui } : state.sui,
    })),
}));

export default useWalletsStore;

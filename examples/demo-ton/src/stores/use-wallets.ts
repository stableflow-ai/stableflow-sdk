import { create } from 'zustand';

interface EvmWalletSlice {
  account: string | null;
  chainId: number | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
}

interface TonWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface WalletsState {
  evm: EvmWalletSlice;
  ton: TonWalletSlice;
  set: (params: { evm?: Partial<EvmWalletSlice>; ton?: Partial<TonWalletSlice> }) => void;
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
  ton: {
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
      ton: params.ton !== undefined ? { ...state.ton, ...params.ton } : state.ton,
    })),
}));

export default useWalletsStore;

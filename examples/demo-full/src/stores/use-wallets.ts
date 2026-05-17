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

interface SolWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface NearWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface SuiWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface TonWalletSlice {
  account: string | null;
  wallet: unknown;
  connect: () => void;
  disconnect: () => void;
  walletIcon: string | null;
  walletName: string | null;
}

interface TronWalletSlice {
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
  sol: SolWalletSlice;
  near: NearWalletSlice;
  sui: SuiWalletSlice;
  ton: TonWalletSlice;
  tron: TronWalletSlice;
  set: (params: {
    evm?: Partial<EvmWalletSlice>;
    aptos?: Partial<AptosWalletSlice>;
    sol?: Partial<SolWalletSlice>;
    near?: Partial<NearWalletSlice>;
    sui?: Partial<SuiWalletSlice>;
    ton?: Partial<TonWalletSlice>;
    tron?: Partial<TronWalletSlice>;
  }) => void;
}

const emptySlice = {
  account: null,
  wallet: null,
  connect: () => {},
  disconnect: () => {},
  walletIcon: null,
  walletName: null,
};

const useWalletsStore = create<WalletsState>((set) => ({
  evm: {
    account: null,
    wallet: null,
    chainId: null,
    connect: () => {},
    disconnect: () => {},
    walletIcon: null,
  },
  aptos: { ...emptySlice },
  sol: { ...emptySlice },
  near: { ...emptySlice },
  sui: { ...emptySlice },
  ton: { ...emptySlice },
  tron: { ...emptySlice },
  set: (params) =>
    set((state) => ({
      ...state,
      evm: params.evm !== undefined ? { ...state.evm, ...params.evm } : state.evm,
      aptos: params.aptos !== undefined ? { ...state.aptos, ...params.aptos } : state.aptos,
      sol: params.sol !== undefined ? { ...state.sol, ...params.sol } : state.sol,
      near: params.near !== undefined ? { ...state.near, ...params.near } : state.near,
      sui: params.sui !== undefined ? { ...state.sui, ...params.sui } : state.sui,
      ton: params.ton !== undefined ? { ...state.ton, ...params.ton } : state.ton,
      tron: params.tron !== undefined ? { ...state.tron, ...params.tron } : state.tron,
    })),
}));

export default useWalletsStore;

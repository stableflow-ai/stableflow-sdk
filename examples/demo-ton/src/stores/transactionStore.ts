import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Transaction } from '../types';

interface TransactionStore {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [tx, ...state.transactions],
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),
      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: 'stableflow-demo-ton-transactions',
      storage: createJSONStorage(() => localStorage, {
        replacer: (_key, value) =>
          typeof value === 'bigint' ? value.toString() : value,
      }),
      partialize: (state) => ({ transactions: state.transactions }),
    }
  )
);

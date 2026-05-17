import { useEffect } from 'react';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupIntearWallet } from '@near-wallet-selector/intear-wallet';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupMeteorWalletApp } from '@near-wallet-selector/meteor-wallet-app';
import { setupHotWallet } from '@near-wallet-selector/hot-wallet';
import NearWallet from '@stableflow/wallet-near';
import useWalletsStore from '@/stores/use-wallets';
import '@near-wallet-selector/modal-ui/styles.css';

export default function NearAdapterProvider({ children }: { children: React.ReactNode }) {
  const setWallets = useWalletsStore((state) => state.set);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const selector = await setupWalletSelector({
          network: 'mainnet',
          debug: false,
          modules: [
            setupMyNearWallet(),
            setupHotWallet() as never,
            setupMeteorWallet(),
            setupIntearWallet(),
            setupMeteorWalletApp({ contractId: '' }),
          ],
        });

        if (cancelled) return;

        const modal = setupModal(selector, { contractId: '' });

        const syncAccount = async () => {
          const state = selector.store.getState();
          const accountId =
            state.accounts.find((account) => account.active)?.accountId || null;
          let walletIcon: string | null = null;
          let walletName: string | null = null;
          try {
            const w = await selector.wallet();
            walletIcon = w.metadata?.iconUrl ?? null;
            walletName = w.metadata?.name ?? null;
          } catch {
            /* not connected */
          }

          setWallets({
            near: {
              account: accountId,
              wallet: accountId ? new NearWallet(selector) : null,
              walletIcon,
              walletName,
              connect: () => modal.show(),
              disconnect: async () => {
                try {
                  const w = await selector.wallet();
                  await w.signOut();
                } catch {
                  /* ignore */
                }
                setWallets({
                  near: {
                    account: null,
                    wallet: null,
                    walletIcon: null,
                    walletName: null,
                  },
                });
              },
            },
          });
        };

        await syncAccount();
        selector.store.observable.subscribe(() => {
          void syncAccount();
        });
      } catch (error) {
        console.error('NEAR wallet init failed:', error);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [setWallets]);

  return <>{children}</>;
}

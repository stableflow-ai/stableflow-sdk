import { useEffect, useState } from 'react';
import { TonConnectUIProvider, useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import TonWallet from '@stableflow/wallet-ton';
import useWalletsStore from '@/stores/use-wallets';
import { useDebounceFn } from '@/hooks/useDebounceFn';

const manifestUrl = `https://stableflow-sdk-demo-full.pages.dev/tonconnect-manifest.json`;
const apiKey = import.meta.env.VITE_TON_RPC_API_KEY;

function TonWalletSync() {
  const [mounted, setMounted] = useState(false);
  const setWallets = useWalletsStore((state) => state.set);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const address = useTonAddress();

  const { run: sync } = useDebounceFn(
    () => {
      if (!mounted) return;
      const tonWallet = address
        ? new TonWallet({ tonConnectUI, account: address, apiKey })
        : null;
      setWallets({
        ton: {
          account: address || null,
          wallet: tonWallet,
          // @ts-ignore
          walletIcon: wallet?.imageUrl ?? null,
          // @ts-ignore
          walletName: wallet?.name ?? null,
          connect: () => tonConnectUI.openModal(),
          disconnect: () => {
            tonConnectUI.disconnect();
            setWallets({
              ton: {
                connect: () => tonConnectUI.openModal(),
                account: null,
                wallet: null,
                walletIcon: null,
                walletName: null,
              }
            });
          },
        },
      });
    },
    { wait: 500 }
  );

  useEffect(() => {
    sync();
  }, [address, wallet, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return null;
}

export default function TonAdapterProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
      <TonWalletSync />
    </TonConnectUIProvider>
  );
}

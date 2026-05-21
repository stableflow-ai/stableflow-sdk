import { useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { getChainRpcUrl } from '@stableflow/core';
import SolanaWallet from '@stableflow/wallet-solana';
import { getAvailableSolanaRpcUrl } from '@stableflow/utils-solana';
import useWalletsStore from '@/stores/use-wallets';
import { useDebounceFn } from '@/hooks/useDebounceFn';
import '@solana/wallet-adapter-react-ui/styles.css';

const wallets = [new SolflareWalletAdapter(), new PhantomWalletAdapter()];

function SolanaWalletSync() {
  const [mounted, setMounted] = useState(false);
  const setWallets = useWalletsStore((state) => state.set);
  const walletAdapter = useWallet();
  const { setVisible } = useWalletModal();
  const { publicKey, disconnect, connect, wallet } = walletAdapter;

  const { run: sync } = useDebounceFn(
    () => {
      if (!mounted) return;
      const solWallet = new SolanaWallet({ publicKey, signer: walletAdapter });
      setWallets({
        sol: {
          account: publicKey?.toString() ?? null,
          wallet: publicKey ? solWallet : null,
          walletIcon: wallet?.adapter.icon ?? null,
          walletName: wallet?.adapter.name ?? null,
          connect: () => {
            if (wallet) connect();
            else setVisible(true);
          },
          disconnect: () => {
            disconnect();
            setWallets({ sol: { account: null, wallet: null, walletIcon: null, walletName: null } });
          },
        },
      });
    },
    { wait: 500 }
  );

  useEffect(() => {
    sync();
  }, [publicKey, wallet, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return null;
}

export default function SolanaAdapterProvider({ children }: { children: React.ReactNode }) {
  const [endpoint, setEndpoint] = useState(getChainRpcUrl("sol").rpcUrls[0]);

  useEffect(() => {
    const resolveEndpoint = async () => {
      try {
        const availableRpcUrl = await getAvailableSolanaRpcUrl();
        setEndpoint(availableRpcUrl);
      } catch (_error) {
        // keep default primary rpc url
      }
    };

    resolveEndpoint();
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
          <SolanaWalletSync />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

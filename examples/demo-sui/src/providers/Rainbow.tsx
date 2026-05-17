import React, { useEffect, useState } from 'react';
import {
  mainnet,
  polygon,
  arbitrum,
  bsc,
  base,
  avalanche,
  optimism,
  gnosis,
  berachain,
  xLayer,
  plasma,
  mantle,
  megaeth,
  ink,
  stable,
  celo,
  sei,
  flare,
  fraxtal,
  katana,
} from 'wagmi/chains';
import {
  WagmiProvider,
  useAccount,
  useDisconnect,
  usePublicClient,
  useWalletClient,
  cookieToInitialState,
  http,
  createConfig,
} from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  connectorsForWallets,
  useConnectModal,
} from '@rainbow-me/rainbowkit';
import { ethers } from 'ethers';
import { EVMWallet } from '@stableflow/wallet-evm';
import { getChainRpcUrl } from '@stableflow/core';
import '@rainbow-me/rainbowkit/styles.css';
import useWalletsStore from '@/stores/use-wallets';
import { useDebounceFn } from '../hooks/useDebounceFn';
import { fallback } from 'viem';
import {
  metaMaskWallet,
  okxWallet,
  bitgetWallet,
  binanceWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID as string;

export const metadata = {
  name: 'StableFlow Demo-Sui',
  description: 'Sui + EVM StableFlow bridge example.',
  url: 'https://app.stableflow.ai',
  icons: ['/logo-stableflow.svg'],
};

const RpcUrls: Record<number, any> = {
  [mainnet.id]: fallback(getChainRpcUrl("eth").rpcUrls.map((rpc) => http(rpc))),
  [polygon.id]: fallback(getChainRpcUrl("pol").rpcUrls.map((rpc) => http(rpc))),
  [arbitrum.id]: fallback(getChainRpcUrl("arb").rpcUrls.map((rpc) => http(rpc))),
  [optimism.id]: fallback(getChainRpcUrl("op").rpcUrls.map((rpc) => http(rpc))),
  [bsc.id]: fallback(getChainRpcUrl("bsc").rpcUrls.map((rpc) => http(rpc))),
  [base.id]: fallback(getChainRpcUrl("base").rpcUrls.map((rpc) => http(rpc))),
  [avalanche.id]: fallback(getChainRpcUrl("avax").rpcUrls.map((rpc) => http(rpc))),
  [gnosis.id]: fallback(getChainRpcUrl("gnosis").rpcUrls.map((rpc) => http(rpc))),
  [berachain.id]: fallback(getChainRpcUrl("bera").rpcUrls.map((rpc) => http(rpc))),
  [xLayer.id]: fallback(getChainRpcUrl("xlayer").rpcUrls.map((rpc) => http(rpc))),
  [plasma.id]: fallback(getChainRpcUrl("plasma").rpcUrls.map((rpc) => http(rpc))),
  [mantle.id]: fallback(getChainRpcUrl("mantle").rpcUrls.map((rpc) => http(rpc))),
  [megaeth.id]: fallback(getChainRpcUrl("megaeth").rpcUrls.map((rpc) => http(rpc))),
  [ink.id]: fallback(getChainRpcUrl("ink").rpcUrls.map((rpc) => http(rpc))),
  [stable.id]: fallback(getChainRpcUrl("stable").rpcUrls.map((rpc) => http(rpc))),
  [celo.id]: fallback(getChainRpcUrl("celo").rpcUrls.map((rpc) => http(rpc))),
  [sei.id]: fallback(getChainRpcUrl("sei").rpcUrls.map((rpc) => http(rpc))),
  [flare.id]: fallback(getChainRpcUrl("flare").rpcUrls.map((rpc) => http(rpc))),
  [fraxtal.id]: fallback(getChainRpcUrl("frax").rpcUrls.map((rpc) => http(rpc))),
  [katana.id]: fallback(getChainRpcUrl("katana").rpcUrls.map((rpc) => http(rpc))),
};

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        okxWallet,
        metaMaskWallet,
        bitgetWallet,
        binanceWallet,
        walletConnectWallet,
      ],
    },
  ],
  {
    appName: metadata.name,
    appDescription: metadata.description,
    appUrl: metadata.url,
    appIcon: metadata.icons[0],
    projectId,
  }
);

const wagmiConfig = createConfig({
  connectors,
  chains: [
    mainnet,
    polygon,
    arbitrum,
    bsc,
    base,
    avalanche,
    optimism,
    gnosis,
    berachain,
    xLayer,
    plasma,
    mantle,
    megaeth,
    ink,
    stable,
    celo,
    sei,
    flare,
    fraxtal,
    katana,
  ],
  transports: {
    [mainnet.id]: RpcUrls[mainnet.id] || http(),
    [polygon.id]: RpcUrls[polygon.id] || http(),
    [arbitrum.id]: RpcUrls[arbitrum.id] || http(),
    [bsc.id]: RpcUrls[bsc.id] || http(),
    [base.id]: RpcUrls[base.id] || http(),
    [avalanche.id]: RpcUrls[avalanche.id] || http(),
    [optimism.id]: RpcUrls[optimism.id] || http(),
    [gnosis.id]: RpcUrls[gnosis.id] || http(),
    [berachain.id]: RpcUrls[berachain.id] || http(),
    [xLayer.id]: RpcUrls[xLayer.id] || http(),
    [plasma.id]: RpcUrls[plasma.id] || http(),
    [mantle.id]: RpcUrls[mantle.id] || http(),
    [megaeth.id]: RpcUrls[megaeth.id] || http(),
    [ink.id]: RpcUrls[ink.id] || http(),
    [stable.id]: RpcUrls[stable.id] || http(),
    [celo.id]: RpcUrls[celo.id] || http(),
    [sei.id]: RpcUrls[sei.id] || http(),
    [flare.id]: RpcUrls[flare.id] || http(),
    [fraxtal.id]: RpcUrls[fraxtal.id] || http(),
    [katana.id]: RpcUrls[katana.id] || http(),
  },
});

const queryClient = new QueryClient();

export default function RainbowProvider({ children }: { children: React.ReactNode }) {
  const initialState = cookieToInitialState(wagmiConfig);

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" locale="en-US">
          {children}
          <Content />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Content() {
  const { disconnect } = useDisconnect();
  const account = useAccount();
  const { openConnectModal } = useConnectModal();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [mounted, setMounted] = useState(false);
  const setWallets = useWalletsStore((state) => state.set);

  const { run: debouncedSync } = useDebounceFn(
    async () => {
      if (!publicClient || !mounted) return;
      const provider = new ethers.BrowserProvider(publicClient);
      const signer = walletClient
        ? await new ethers.BrowserProvider(walletClient).getSigner()
        : null;
      const wallet = new EVMWallet(provider, signer);

      setWallets({
        evm: {
          account: account.address || null,
          chainId: account.chainId ?? null,
          wallet,
          connect: () => {
            openConnectModal?.();
          },
          disconnect: () => {
            disconnect?.();
            setWallets({
              evm: {
                account: null,
                wallet: null,
              },
            });
          },
          walletIcon: null,
        },
      });
    },
    { wait: 500 }
  );

  useEffect(() => {
    debouncedSync();
  }, [account, publicClient, walletClient, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return null;
}

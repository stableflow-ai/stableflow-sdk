import { useEffect, useState } from 'react';
import {
  createDAppKit,
  DAppKitProvider,
  useCurrentAccount,
  useCurrentWallet,
  useDAppKit,
  useWallets,
} from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { getChainRpcUrl } from '@stableflow/core';
import { SuiWallet } from '@stableflow/wallet-sui';
import useWalletsStore from '@/stores/use-wallets';
import { useDebounceFn } from '@/hooks/useDebounceFn';

const dAppKit = createDAppKit({
  networks: ['mainnet'],
  defaultNetwork: 'mainnet',
  createClient: (network) =>
    new SuiGrpcClient({
      network,
      baseUrl: getChainRpcUrl('sui').rpcUrl ?? getJsonRpcFullnodeUrl('mainnet'),
    }),
  autoConnect: true,
  enableBurnerWallet: false,
  storage: typeof window !== 'undefined' ? localStorage : undefined,
  storageKey: 'stableflow_demo_sui_dapp_kit',
});

function SuiWalletSync() {
  const [mounted, setMounted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const setWallets = useWalletsStore((state) => state.set);
  const account = useCurrentAccount();
  const currentWallet = useCurrentWallet();
  const dappKit = useDAppKit();
  const wallets = useWallets();
  const { signAndExecuteTransaction, connectWallet, disconnectWallet } = dappKit;

  const { run: sync } = useDebounceFn(
    () => {
      if (!mounted) return;
      const suiWallet = new SuiWallet({ account: account ?? null, signAndExecuteTransaction });
      setWallets({
        sui: {
          account: account?.address ?? null,
          wallet: account ? suiWallet : null,
          walletIcon: currentWallet?.icon ?? null,
          walletName: currentWallet?.name ?? null,
          connect: () => {
            if (currentWallet) {
              void connectWallet({ wallet: currentWallet });
            } else {
              setPickerOpen(true);
            }
          },
          disconnect: () => {
            disconnectWallet();
            setWallets({ sui: { account: null, wallet: null, walletIcon: null, walletName: null } });
          },
        },
      });
    },
    { wait: 500 }
  );

  useEffect(() => {
    sync();
  }, [account, currentWallet, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!pickerOpen) return null;

  return (
    <div className="aptos-wallet-modal-overlay" role="presentation" onClick={() => setPickerOpen(false)}>
      <div
        className="aptos-wallet-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aptos-wallet-modal-header">
          <h3 id="sui-wallet-title">Select Sui Wallet</h3>
          <button type="button" className="btn-remove" onClick={() => setPickerOpen(false)}>
            Close
          </button>
        </div>
        <div className="aptos-wallet-list">
          {wallets.length === 0 ? (
            <p className="empty-state">No Sui wallets detected.</p>
          ) : (
            wallets.map((w) => (
              <button
                key={w.name}
                type="button"
                className="aptos-wallet-item"
                onClick={() => void connectWallet({ wallet: w }).then(() => setPickerOpen(false))}
              >
                {w.icon && <img src={w.icon} alt="" width={28} height={28} />}
                <span>{w.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuiAdapterProvider({ children }: { children: React.ReactNode }) {
  return (
    <DAppKitProvider dAppKit={dAppKit}>
      {children}
      <SuiWalletSync />
    </DAppKitProvider>
  );
}

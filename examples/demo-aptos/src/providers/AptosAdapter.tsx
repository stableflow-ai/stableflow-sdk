import React, { useEffect, useMemo, useState } from 'react';
import { AptosWalletAdapterProvider, useWallet } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';
import { AptosWallet } from '@stableflow/wallet-aptos';
import useWalletsStore from '@/stores/use-wallets';
import { useDebounceFn } from '@/hooks/useDebounceFn';

export default function AptosAdapterProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect
      dappConfig={{ network: Network.MAINNET }}
      onError={(error) => {
        console.error('AptosProvider error:', error);
      }}
      optInWallets={[
        'OKX Wallet',
        'Petra',
        'Nightly',
        'Backpack',
        'MSafe',
        'Bitget Wallet',
        'Gate Wallet',
      ]}
    >
      {children}
      <AptosWalletSync />
    </AptosWalletAdapterProvider>
  );
}

function AptosWalletSync() {
  const [mounted, setMounted] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const setWallets = useWalletsStore((state) => state.set);
  const {
    account,
    connect,
    disconnect,
    signAndSubmitTransaction,
    wallet,
    wallets,
    notDetectedWallets,
    connected,
  } = useWallet();

  const allWallets = useMemo(
    () => [...wallets, ...notDetectedWallets],
    [wallets, notDetectedWallets]
  );

  const { run: syncAptosWallet } = useDebounceFn(
    () => {
      if (!mounted) return;

      const aptosWallet = account
        ? new AptosWallet({
            account,
            signAndSubmitTransaction,
          })
        : null;

      setWallets({
        aptos: {
          account: account?.address.toString() ?? null,
          wallet: aptosWallet,
          walletIcon: wallet?.icon ?? null,
          walletName: wallet?.name ?? null,
          connect: () => {
            if (!connected) {
              setPickerOpen(true);
            }
          },
          disconnect: () => {
            disconnect();
            setWallets({
              aptos: {
                account: null,
                wallet: null,
                walletIcon: null,
                walletName: null,
              },
            });
          },
        },
      });
    },
    { wait: 500 }
  );

  useEffect(() => {
    syncAptosWallet();
  }, [account, signAndSubmitTransaction, wallet, mounted, connected]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setPickerOpen(false);
    } catch (error) {
      console.error('Aptos connect error:', error);
    }
  };

  if (!pickerOpen) {
    return null;
  }

  return (
    <div className="aptos-wallet-modal-overlay" role="presentation" onClick={() => setPickerOpen(false)}>
      <div
        className="aptos-wallet-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aptos-wallet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aptos-wallet-modal-header">
          <h3 id="aptos-wallet-title">Select Aptos Wallet</h3>
          <button type="button" className="btn-remove" onClick={() => setPickerOpen(false)}>
            Close
          </button>
        </div>
        <div className="aptos-wallet-list">
          {allWallets.length === 0 ? (
            <p className="empty-state">No Aptos wallets detected. Install Petra or OKX Wallet.</p>
          ) : (
            allWallets.map((w) => (
              <button
                key={w.name}
                type="button"
                className="aptos-wallet-item"
                onClick={() => void handleConnect(w.name)}
              >
                {w.icon && <img src={w.icon} alt="" width={28} height={28} />}
                <span>{w.name}</span>
                <span className="aptos-wallet-ready">{w.readyState}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

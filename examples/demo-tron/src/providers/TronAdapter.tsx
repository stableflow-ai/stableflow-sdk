import { useEffect, useMemo, useRef, useState } from 'react';
import { TronLinkAdapter, OkxWalletAdapter } from '@tronweb3/tronwallet-adapters';
import { TronWeb } from 'tronweb';
import { getChainRpcUrl } from '@stableflow/core';
import TronWallet from '@stableflow/wallet-tron';
import useWalletsStore from '@/stores/use-wallets';

const adapters = [new TronLinkAdapter(), new OkxWalletAdapter()];

export default function TronAdapterProvider({ children }: { children: React.ReactNode }) {
  const setWallets = useWalletsStore((state) => state.set);
  const [adapter, setAdapter] = useState<TronLinkAdapter | OkxWalletAdapter | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const walletRef = useRef<TronWallet | null>(null);

  const installedWallets = useMemo(
    () => adapters.filter((w) => w.readyState === 'Found' || w.readyState === 'Loading'),
    []
  );

  const rebuildTronWallet = (activeAdapter: typeof adapter, address?: string) => {
    const addr = address || activeAdapter?.address;
    const tronWeb = new TronWeb({
      fullHost: getChainRpcUrl('tron').rpcUrl,
      headers: {},
      privateKey: '',
    });
    if (addr) tronWeb.setAddress(addr);

    walletRef.current = new TronWallet({
      address: addr || '',
      signAndSendTransaction: async (transaction: unknown) => {
        if (!activeAdapter) return '';
        const signedTx = await activeAdapter.signTransaction(transaction as never);
        return tronWeb.trx.sendRawTransaction(signedTx);
      },
    });
  };

  useEffect(() => {
    rebuildTronWallet(adapter);

    if (!adapter?.address) {
      setWallets({
        tron: {
          account: null,
          wallet: walletRef.current,
          walletIcon: null,
          walletName: null,
          connect: () => setPickerOpen(true),
          disconnect: () => {},
        },
      });
      return;
    }

    setWallets({
      tron: {
        account: adapter.address,
        wallet: walletRef.current,
        walletIcon: adapter.icon ?? null,
        walletName: adapter.name ?? null,
        connect: () => setPickerOpen(true),
        disconnect: async () => {
          try {
            await adapter.disconnect();
          } catch {
            /* ignore */
          }
          setAdapter(null);
          setWallets({ tron: { account: null, wallet: null, walletIcon: null, walletName: null } });
        },
      },
    });
  }, [adapter, setWallets]);

  const handleConnect = async (wallet: TronLinkAdapter | OkxWalletAdapter) => {
    try {
      await wallet.connect();
      setAdapter(wallet);
      setPickerOpen(false);
    } catch (error) {
      console.error('Tron connect failed:', error);
    }
  };

  return (
    <>
      {children}
      {pickerOpen && (
        <div className="aptos-wallet-modal-overlay" role="presentation" onClick={() => setPickerOpen(false)}>
          <div className="aptos-wallet-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="aptos-wallet-modal-header">
              <h3>Select Tron Wallet</h3>
              <button type="button" className="btn-remove" onClick={() => setPickerOpen(false)}>
                Close
              </button>
            </div>
            <div className="aptos-wallet-list">
              {installedWallets.length === 0 ? (
                <p className="empty-state">Install TronLink or OKX Wallet extension.</p>
              ) : (
                installedWallets.map((w) => (
                  <button
                    key={w.name}
                    type="button"
                    className="aptos-wallet-item"
                    onClick={() => void handleConnect(w)}
                  >
                    {w.icon && <img src={w.icon} alt="" width={28} height={28} />}
                    <span>{w.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

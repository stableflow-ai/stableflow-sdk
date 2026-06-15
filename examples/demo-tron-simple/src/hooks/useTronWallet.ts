import { useCallback, useEffect, useRef, useState } from 'react';
import { TronLinkAdapter, OkxWalletAdapter } from '@tronweb3/tronwallet-adapters';
import { TronWeb } from 'tronweb';
import { getChainRpcUrl } from '@stableflow/core';
import TronWallet from '@stableflow/wallet-tron';

type TronAdapter = TronLinkAdapter | OkxWalletAdapter;

const adapters = [new TronLinkAdapter(), new OkxWalletAdapter()];

export function useTronWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [wallet, setWallet] = useState<TronWallet | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const adapterRef = useRef<TronAdapter | null>(null);

  const rebuildTronWallet = useCallback((activeAdapter: TronAdapter | null, address?: string) => {
    const addr = address || activeAdapter?.address;
    const tronWeb = new TronWeb({
      fullHost: getChainRpcUrl('tron').rpcUrl,
      headers: {},
      privateKey: '',
    });
    if (addr) tronWeb.setAddress(addr);

    const instance = new TronWallet({
      address: addr || '',
      signAndSendTransaction: async (transaction: unknown) => {
        if (!activeAdapter) return '';
        const signedTx = await activeAdapter.signTransaction(transaction as never);
        return tronWeb.trx.sendRawTransaction(signedTx);
      },
    });

    setWallet(instance);
    return instance;
  }, []);

  useEffect(() => {
    rebuildTronWallet(adapterRef.current, account ?? undefined);
  }, [account, rebuildTronWallet]);

  const installedWallets = adapters.filter(
    (w) => w.readyState === 'Found' || w.readyState === 'Loading'
  );

  const connectWithAdapter = useCallback(
    async (selected: TronAdapter) => {
      setConnecting(true);
      try {
        await selected.connect();
        adapterRef.current = selected;
        setAccount(selected.address ?? null);
        setPickerOpen(false);
      } catch (err) {
        console.error('Tron connect failed:', err);
        throw err;
      } finally {
        setConnecting(false);
      }
    },
    []
  );

  const connect = useCallback(async () => {
    if (installedWallets.length === 1) {
      await connectWithAdapter(installedWallets[0]);
      return;
    }
    setPickerOpen(true);
  }, [connectWithAdapter, installedWallets]);

  const disconnect = useCallback(async () => {
    try {
      await adapterRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    adapterRef.current = null;
    setAccount(null);
    setWallet(null);
  }, []);

  return {
    account,
    wallet,
    connecting,
    pickerOpen,
    setPickerOpen,
    installedWallets,
    connect,
    connectWithAdapter,
    disconnect,
  };
}

import { useCallback, useState } from 'react';
import { BrowserProvider, type Eip1193Provider } from 'ethers';
import EVMWallet from '@stableflow/wallet-evm';
import { ensureEthereumChain, PLASMA_CHAIN_ID } from '../utils/chainIds';

function getEthereumProvider(): Eip1193Provider | undefined {
  const eth = window.ethereum as Eip1193Provider | undefined;
  return eth?.request ? eth : undefined;
}

export function useEvmWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [wallet, setWallet] = useState<EVMWallet | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    const eth = getEthereumProvider();
    if (!eth) {
      throw new Error('No EVM wallet (window.ethereum). Install MetaMask or similar.');
    }

    setConnecting(true);
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      const address = accounts[0] ?? null;
      if (!address) {
        throw new Error('No EVM account returned from wallet.');
      }

      await ensureEthereumChain(PLASMA_CHAIN_ID);

      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const instance = new EVMWallet(provider, signer);

      setAccount(address);
      setWallet(instance);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setWallet(null);
  }, []);

  return {
    account,
    wallet,
    connecting,
    connect,
    disconnect,
  };
}

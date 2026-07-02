import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import type { TokenConfig } from '@stableflow/core';

interface WalletConnectorProps {
  chain: TokenConfig;
  onAddressChange?: (address?: string | null) => void;
  children?: React.ReactNode;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({
  chain,
  onAddressChange,
  children,
}) => {
  const { address, isConnected, connect, disconnect } = useWallet(chain);
  const [connecting, setConnecting] = useState(false);
  const onAddressChangeRef = React.useRef(onAddressChange);

  React.useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
  }, [onAddressChange]);

  React.useEffect(() => {
    onAddressChangeRef.current?.(address);
  }, [address]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  };

  return (
    <div className="wallet-connector">
      {isConnected && address ? (
        <div className="wallet-connected">
          <span className="wallet-address">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <button type="button" onClick={handleDisconnect} className="btn-disconnect">
            Disconnect
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="btn-connect"
        >
          {connecting ? 'Connecting...' : `Connect ${chain.chainName} Wallet`}
        </button>
      )}
      {children}
    </div>
  );
};

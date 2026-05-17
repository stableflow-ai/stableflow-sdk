import React from 'react';
import RainbowProvider from './Rainbow';
import AptosAdapterProvider from './AptosAdapter';
import SolanaAdapterProvider from './SolanaAdapter';
import NearAdapterProvider from './NearAdapter';
import SuiAdapterProvider from './SuiAdapter';
import TonAdapterProvider from './TonAdapter';
import TronAdapterProvider from './TronAdapter';

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <AptosAdapterProvider>
        <SolanaAdapterProvider>
          <NearAdapterProvider>
            <SuiAdapterProvider>
              <TonAdapterProvider>
                <TronAdapterProvider>{children}</TronAdapterProvider>
              </TonAdapterProvider>
            </SuiAdapterProvider>
          </NearAdapterProvider>
        </SolanaAdapterProvider>
      </AptosAdapterProvider>
    </RainbowProvider>
  );
}

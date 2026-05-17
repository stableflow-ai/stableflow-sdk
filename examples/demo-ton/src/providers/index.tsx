import React from 'react';
import RainbowProvider from './Rainbow';
import TonAdapterProvider from './TonAdapter';

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <TonAdapterProvider>{children}</TonAdapterProvider>
    </RainbowProvider>
  );
}

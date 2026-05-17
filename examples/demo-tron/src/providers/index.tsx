import React from 'react';
import RainbowProvider from './Rainbow';
import TronAdapterProvider from './TronAdapter';

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <TronAdapterProvider>{children}</TronAdapterProvider>
    </RainbowProvider>
  );
}

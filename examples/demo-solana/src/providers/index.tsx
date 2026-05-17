import React from 'react';
import RainbowProvider from './Rainbow';
import SolanaAdapterProvider from './SolanaAdapter';

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <SolanaAdapterProvider>{children}</SolanaAdapterProvider>
    </RainbowProvider>
  );
}

import React from 'react';
import RainbowProvider from './Rainbow';
import AptosAdapterProvider from './AptosAdapter';

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <AptosAdapterProvider>{children}</AptosAdapterProvider>
    </RainbowProvider>
  );
}

import React from 'react';
import RainbowProvider from './Rainbow';
import NearAdapterProvider from './NearAdapter';

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <NearAdapterProvider>{children}</NearAdapterProvider>
    </RainbowProvider>
  );
}

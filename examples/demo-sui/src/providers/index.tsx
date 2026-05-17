import React from 'react';
import RainbowProvider from './Rainbow';
import SuiAdapterProvider from './SuiAdapter';

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return (
    <RainbowProvider>
      <SuiAdapterProvider>{children}</SuiAdapterProvider>
    </RainbowProvider>
  );
}

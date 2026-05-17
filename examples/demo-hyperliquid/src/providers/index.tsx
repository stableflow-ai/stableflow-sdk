import React from 'react';
import RainbowProvider from './Rainbow';

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return <RainbowProvider>{children}</RainbowProvider>;
}

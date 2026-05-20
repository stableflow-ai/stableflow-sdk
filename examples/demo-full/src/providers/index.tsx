import React, { lazy, Suspense } from 'react';

const RainbowProvider = lazy(() => import("./Rainbow"));
const AptosAdapterProvider = lazy(() => import("./AptosAdapter"));
const SolanaAdapterProvider = lazy(() => import("./SolanaAdapter"));
const NearAdapterProvider = lazy(() => import("./NearAdapter"));
const SuiAdapterProvider = lazy(() => import("./SuiAdapter"));
const TonAdapterProvider = lazy(() => import("./TonAdapter"));
const TronAdapterProvider = lazy(() => import("./TronAdapter"));

export default function WalletsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="text-center text-white w-screen h-screen flex items-center justify-center">Loading...</div>}>
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
    </Suspense>
  );
}

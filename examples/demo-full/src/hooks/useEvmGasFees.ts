import { useEffect, useState } from 'react';
import { tokens, type TokenConfig } from '@stableflow/core';
import { evmRpcFallbackProvider } from '@stableflow/utils-evm';

const POLL_MS = 30 * 60 * 1000;

export interface EvmChainGasFee {
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  lastUpdated: number;
}

function getEvmChains(): TokenConfig[] {
  const byChainId = new Map<number, TokenConfig>();
  for (const token of tokens) {
    if (token.chainType !== 'evm' || typeof token.chainId !== 'number') {
      continue;
    }
    if (!byChainId.has(token.chainId)) {
      byChainId.set(token.chainId, token);
    }
  }
  return Array.from(byChainId.values());
}

async function fetchFeeForChain(chain: TokenConfig) {
  const provider = evmRpcFallbackProvider(chain);
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas;
  const legacyGasPrice = feeData.gasPrice;
  const effective = maxFeePerGas ?? legacyGasPrice;
  if (effective == null) {
    throw new Error('no gas price from getFeeData');
  }
  return {
    chainId: chain.chainId!,
    gasPrice: effective.toString(),
    maxFeePerGas: maxFeePerGas != null ? maxFeePerGas.toString() : undefined,
    maxPriorityFeePerGas:
      feeData.maxPriorityFeePerGas != null
        ? feeData.maxPriorityFeePerGas.toString()
        : undefined,
    lastUpdated: Date.now(),
  };
}

export function useEvmGasFees() {
  const [byChainId, setByChainId] = useState<Record<string, EvmChainGasFee>>({});

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const list = getEvmChains();
      const settled = await Promise.allSettled(list.map((c) => fetchFeeForChain(c)));
      if (cancelled) {
        return;
      }
      const patch: Record<string, EvmChainGasFee> = {};
      for (let i = 0; i < settled.length; i++) {
        const r = settled[i]!;
        const chain = list[i]!;
        if (r.status === 'fulfilled') {
          const v = r.value;
          patch[String(v.chainId)] = {
            gasPrice: v.gasPrice,
            maxFeePerGas: v.maxFeePerGas,
            maxPriorityFeePerGas: v.maxPriorityFeePerGas,
            lastUpdated: v.lastUpdated,
          };
        } else {
          console.warn(`[evm-gas-fees] ${chain.chainName} getFeeData failed:`, r.reason);
        }
      }
      setByChainId((prev) => ({ ...prev, ...patch }));
    };

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return { byChainId };
}

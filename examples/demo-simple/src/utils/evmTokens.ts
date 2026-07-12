import { TokenResponse } from '@stableflow/core';

const EVM_BLOCKCHAINS = new Set<string>([
  'eth',
  'base',
  'arb',
  'bsc',
  'pol',
  'op',
  'avax',
  'bera',
  'gnosis',
  'pharos',
]);

export function isEvmToken(token: TokenResponse): boolean {
  return EVM_BLOCKCHAINS.has(token.blockchain);
}

export function isStableToken(token: TokenResponse): boolean {
   return [/^USDT$/i, /^USDC$/i, /^USDC.e$/i, /^USD.e$/i, /^EURe$/i].some((reg) => reg.test(token.symbol));
}

export function filterEvmTokens(tokens: TokenResponse[]): TokenResponse[] {
  return tokens.filter(isEvmToken).filter(isStableToken);
}

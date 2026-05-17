import { TokenResponse } from '@stableflow/core';

const EVM_BLOCKCHAINS = new Set<string>([
  TokenResponse.blockchain.ETH,
  TokenResponse.blockchain.BASE,
  TokenResponse.blockchain.ARB,
  TokenResponse.blockchain.BSC,
  TokenResponse.blockchain.POL,
  TokenResponse.blockchain.OP,
  TokenResponse.blockchain.AVAX,
  TokenResponse.blockchain.BERA,
  TokenResponse.blockchain.GNOSIS,
]);

export function isEvmToken(token: TokenResponse): boolean {
  return EVM_BLOCKCHAINS.has(token.blockchain);
}

export function isStableToken(token: TokenResponse): boolean {
   return [/^USDT$/i, /^USDC$/i, /^USDC.e$/i, /^USD.e$/i].some((reg) => reg.test(token.symbol));
}

export function filterEvmTokens(tokens: TokenResponse[]): TokenResponse[] {
  return tokens.filter(isEvmToken).filter(isStableToken);
}

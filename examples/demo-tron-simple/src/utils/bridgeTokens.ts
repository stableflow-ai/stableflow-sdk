import { TokenResponse } from '@stableflow/core';

const TRON_USDT_ASSET_ID =
  'nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near';
const PLASMA_USDT0_ASSET_ID =
  'nep141:plasma-0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb.omft.near';

export function isStableToken(token: TokenResponse): boolean {
  return [/^USDT$/i, /^USDC$/i, /^USDC\.e$/i, /^USD\.e$/i, /^USD₮0$/i, /^USDT0$/i].some(
    (reg) => reg.test(token.symbol)
  );
}

export function filterTronTokens(tokens: TokenResponse[]): TokenResponse[] {
  return tokens.filter((t) => t.blockchain === 'tron').filter(isStableToken);
}

export function filterPlasmaTokens(tokens: TokenResponse[]): TokenResponse[] {
  return tokens.filter((t) => String(t.blockchain) === 'plasma').filter(isStableToken);
}

export function findDefaultPair(tokens: TokenResponse[]): {
  originAsset: string;
  destinationAsset: string;
} {
  const tronTokens = filterTronTokens(tokens);
  const plasmaTokens = filterPlasmaTokens(tokens);

  const origin =
    tronTokens.find((t) => /^USDT$/i.test(t.symbol)) ??
    tronTokens.find((t) => t.assetId === TRON_USDT_ASSET_ID) ??
    tronTokens[0];

  const destination =
    plasmaTokens.find((t) => /^USD₮0$/i.test(t.symbol) || /^USDT0$/i.test(t.symbol)) ??
    plasmaTokens.find((t) => /^USDT$/i.test(t.symbol)) ??
    plasmaTokens.find((t) => t.assetId === PLASMA_USDT0_ASSET_ID) ??
    plasmaTokens[0];

  return {
    originAsset: origin?.assetId ?? TRON_USDT_ASSET_ID,
    destinationAsset: destination?.assetId ?? PLASMA_USDT0_ASSET_ID,
  };
}

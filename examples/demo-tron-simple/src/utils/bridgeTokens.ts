import { TokenResponse } from '@stableflow/core';

const TRON_USDT_ASSET_ID =
  'nep141:tron-d28a265909efecdcee7c5028585214ea0b96f015.omft.near';
const PLASMA_USDT_ASSET_ID =
  'nep141:plasma-0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb.omft.near';

/** EVM chains from the SFA token registry (all non-Tron EVM entries). */
const EVM_BLOCKCHAINS = new Set<string>([
  'base',
  'eth',
  'abs',
  'arb',
  'gnosis',
  'bera',
  'bsc',
  'monad',
  'xlayer',
  'plasma',
  'pol',
  'op',
  'avax',
  'adi',
  'scroll',
  'movement',
  'hypercore',
]);

const TRON_BLOCKCHAIN = 'tron';
const PLASMA_BLOCKCHAIN = 'plasma';

/** Stablecoin symbols from the SFA token registry. */
const STABLECOIN_SYMBOLS = new Set([
  'usdc',
  'frax',
  'usdt',
  'dai',
  'usd1',
  'usdt0',
  'xdai',
  'susdc',
  'usad',
  'usdcx',
  'steakusdc',
  'sparkusdc',
  'mwusdc',
  'gtusdcp',
  'nrusdt',
  'usdf',
  'eure',
  'gbpe',
]);

function normalizeTokenSymbol(symbol: string): string {
  return symbol.replace(/₮/g, 'T').toLowerCase();
}

export function isStableToken(token: TokenResponse): boolean {
  const normalized = normalizeTokenSymbol(token.symbol);
  if (STABLECOIN_SYMBOLS.has(normalized)) return true;
  return [/^usdc\.e$/i, /^usd\.e$/i].some((reg) => reg.test(normalized));
}

export function isDeprecatedToken(token: TokenResponse): boolean {
  return /DEPRECATED/i.test(token.symbol);
}

export function isTronBlockchain(blockchain: string): boolean {
  return blockchain === TRON_BLOCKCHAIN;
}

export function isEvmBlockchain(blockchain: string): boolean {
  return EVM_BLOCKCHAINS.has(blockchain);
}

export function isSupportedBlockchain(blockchain: string): boolean {
  return isTronBlockchain(blockchain) || isEvmBlockchain(blockchain);
}

export function filterAvailableTokens(tokens: TokenResponse[]): TokenResponse[] {
  return tokens.filter(
    (t) =>
      !isDeprecatedToken(t) &&
      isSupportedBlockchain(t.blockchain) &&
      isStableToken(t)
  );
}

export function findDefaultPair(tokens: TokenResponse[]): {
  originAsset: string;
  destinationAsset: string;
} {
  const available = filterAvailableTokens(tokens);

  const origin =
    available.find((t) => t.blockchain === TRON_BLOCKCHAIN && /^USDT$/i.test(t.symbol)) ??
    available.find((t) => t.assetId === TRON_USDT_ASSET_ID) ??
    available.find((t) => t.blockchain === TRON_BLOCKCHAIN);

  const destination =
    available.find((t) => t.blockchain === PLASMA_BLOCKCHAIN && /^USDT$/i.test(t.symbol)) ??
    available.find(
      (t) =>
        t.blockchain === PLASMA_BLOCKCHAIN &&
        (/^USD₮0$/i.test(t.symbol) || /^USDT0$/i.test(t.symbol))
    ) ??
    available.find((t) => t.assetId === PLASMA_USDT_ASSET_ID) ??
    available.find((t) => t.blockchain === PLASMA_BLOCKCHAIN);

  return {
    originAsset: origin?.assetId ?? TRON_USDT_ASSET_ID,
    destinationAsset: destination?.assetId ?? PLASMA_USDT_ASSET_ID,
  };
}

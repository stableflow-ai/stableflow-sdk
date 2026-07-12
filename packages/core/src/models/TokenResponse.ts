/* StableFlow AI SDK */
/* tslint:disable */
/* eslint-disable */
export type TokenResponse = {
  /**
   * Unique asset identifier
   */
  assetId: string;
  /**
   * Number of decimals for the token
   */
  decimals: number;
  /**
   * Blockchain associated with the token (API chain key, e.g. eth, arb, tron, pharos)
   */
  blockchain: string;
  /**
   * Token symbol (e.g. BTC, ETH)
   */
  symbol: string;
  /**
   * Current price of the token in USD
   */
  price: number;
  /**
   * Date when the token price was last updated
   */
  priceUpdatedAt: string;
  /**
   * Contract address of the token
   */
  contractAddress?: string;
};

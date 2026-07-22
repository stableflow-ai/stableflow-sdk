/**
 * Look up a token's USD price from a trusted price map (case-insensitive).
 *
 * The `prices` map is populated internally by the SDK from the built-in price
 * source (see `getPrices`), so a missing entry means we cannot safely value the
 * token. In that case we throw rather than falling back to a distorted default,
 * to avoid computing fees / on-chain amounts with a wrong price.
 *
 * `USDT0` / `USD₮0` / `USD₮` are normalized to `USDT` since the price feed keys
 * plain `USDT`.
 *
 * @throws when no price is found for the given symbol.
 */
export function getPrice(prices: Record<string, string>, symbol: string): string {
  let _symbol = symbol;
  if (symbol === "USDT0" || symbol === "USD₮0" || symbol === "USD₮") {
    _symbol = "USDT";
  }

  if (prices?.[_symbol] && prices[_symbol] !== "0") {
    return prices[_symbol];
  }
  if (prices?.[_symbol.toLowerCase()] && prices[_symbol.toLowerCase()] !== "0") {
    return prices[_symbol.toLowerCase()];
  }
  if (prices?.[_symbol.toUpperCase()] && prices[_symbol.toUpperCase()] !== "0") {
    return prices[_symbol.toUpperCase()];
  }

  throw new Error(`Missing price for token: ${symbol}`);
}

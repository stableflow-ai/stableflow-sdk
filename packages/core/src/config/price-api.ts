/**
 * Configuration for the built-in token price source.
 *
 * The SDK fetches trusted USD prices from this endpoint and uses them
 * internally for fee/appFee computation, so integrators do not have to
 * (and can no longer) supply their own `prices` map. This prevents wrong
 * caller-supplied prices from causing on-chain losses.
 *
 * The endpoint mirrors the one used by the StableFlow web interface:
 * `GET https://api.dapdap.net/get-token-price-by-dapdap`
 * Response shape: `{ code: 0, msg: "success", data: Record<string, string> }`
 * where `data` maps token symbol -> USD price (as a decimal string).
 *
 * The endpoint URL is fixed and cannot be changed by integrators; only the
 * cache TTL can be tuned at runtime via `setPriceCacheTtl`.
 */
export const PriceApiConfig = {
  /** Full URL of the price endpoint (no query params, GET). Not user-configurable. */
  URL: "https://api.dapdap.net/get-token-price-by-dapdap",
  /** In-memory cache TTL in milliseconds. */
  CACHE_TTL: 60_000,
};

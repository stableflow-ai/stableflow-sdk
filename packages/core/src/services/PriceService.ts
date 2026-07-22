import axios from "axios";
import { PriceApiConfig } from "../config/price-api";

/**
 * Raw response shape returned by the DapDap price endpoint.
 */
interface PriceApiResponse {
  code: number;
  msg: string;
  data: Record<string, string>;
}

// Module-level TTL cache so repeated quotes within a short window do not
// hammer the price endpoint.
let priceCache: Record<string, string> | null = null;
let priceCacheAt = 0;
let inflight: Promise<Record<string, string>> | null = null;

/**
 * Override the in-memory price cache TTL (milliseconds).
 */
export function setPriceCacheTtl(ms: number): void {
  PriceApiConfig.CACHE_TTL = ms;
}

/**
 * Fetch token USD prices directly from the configured price endpoint.
 *
 * Always performs a network request (no caching). Throws when the request
 * fails or the response is malformed, so callers never proceed with missing
 * or untrusted prices.
 *
 * @returns Map of token symbol -> USD price (decimal string).
 */
export async function fetchPrices(): Promise<Record<string, string>> {
  let res;
  try {
    res = await axios.get<PriceApiResponse>(PriceApiConfig.URL, { timeout: 30000 });
  } catch (error) {
    throw new Error(`Failed to fetch token prices: ${(error as Error)?.message || error}`);
  }

  if (res.status !== 200 || res.data?.code !== 0 || !res.data?.data) {
    throw new Error(`Failed to fetch token prices: unexpected response (code=${res.data?.code})`);
  }

  return res.data.data;
}

/**
 * Get token USD prices with a short-lived in-memory cache.
 *
 * The SDK calls this internally when generating quotes. Within the cache TTL
 * (`PriceApiConfig.CACHE_TTL`) the cached map is returned without a network
 * request; otherwise a fresh fetch is performed. Pass `{ force: true }` to
 * bypass the cache.
 *
 * Throws when a fresh fetch is required but fails and no cache is available,
 * ensuring quotes are never computed with stale/missing prices.
 */
export async function getPrices(opts?: { force?: boolean }): Promise<Record<string, string>> {
  const now = Date.now();
  const isFresh = priceCache && now - priceCacheAt < PriceApiConfig.CACHE_TTL;

  if (!opts?.force && isFresh) {
    return priceCache as Record<string, string>;
  }

  // De-duplicate concurrent refreshes.
  if (!inflight) {
    inflight = fetchPrices()
      .then((prices) => {
        priceCache = prices;
        priceCacheAt = Date.now();
        return prices;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

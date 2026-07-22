---
"@stableflow/core": minor
"@stableflow/bridges": minor
"@stableflow/hyperliquid": minor
---

Built-in token prices, `OneClickSwapType`, and EXACT_OUTPUT amount fix.

- `@stableflow/core`: the SDK now fetches trusted token USD prices internally from `https://api.dapdap.net/get-token-price-by-dapdap` and uses them for fee/gas estimation. New exports: `getPrices`, `fetchPrices`, `PriceApiConfig`, `setPriceCacheTtl`. `getPrices()` caches in memory (TTL `PriceApiConfig.CACHE_TTL`, default 60s). The price endpoint is fixed and not user-configurable. **Breaking**: `getPrice(prices, symbol)` now throws when a price is missing instead of silently returning `"1"` (it also normalizes `USDT0`/`USD₮0`/`USD₮` to `USDT`). New `OneClickSwapType` const/type (`Input`/`Output`/`Flex`).

- `@stableflow/bridges` & `@stableflow/hyperliquid`: `BridgeSFA.getAllQuote` and `Hyperliquid.quote` now fetch and use trusted prices internally. The `prices` field on `GetAllQuoteParams` / `HyperliquidQuoteParams` is **deprecated** and ignored (any value is overridden), preventing wrong caller-supplied prices from causing incorrect `appFees` and on-chain losses. Scattered `"EXACT_INPUT"`/`"EXACT_OUTPUT"`/`"FLEX_INPUT"` literals are replaced with `OneClickSwapType`.

- **EXACT_OUTPUT fix**: approve and on-chain deposit amounts now use `amountIn` (which includes a slippage buffer) instead of `minAmountIn`, so the first step can no longer fail due to slippage; any excess input is refunded to `refundTo`.

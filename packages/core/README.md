# @stableflow/core

StableFlow core: HTTP client, API models, token/chain configuration, and shared utilities.

## Installation

```bash
pnpm add @stableflow/core
```

## When to use

- You need direct access to the StableFlow HTTP API (`SFA`).
- You need shared types (`TokenConfig`, `WalletConfig`), bridge `Service` enums, or chain/token registries.
- You are building on top of `@stableflow/bridges` or `@stableflow/wallet-*` (they depend on this package).

For full cross-chain bridge flows (multi-route quote, send, status), use [`@stableflow/bridges`](../bridges/README.md) instead of calling `SFA` alone.

## Main exports

| Category | Symbols |
|----------|---------|
| HTTP API | `SFA`, `OpenAPI`, `request`, `ApiError`, `CancelablePromise` |
| Bridge types | `Service`, `ServiceBackend`, `TransactionStatus`, `SendType` |
| Models | `QuoteRequest`, `QuoteResponse`, `TokenResponse`, `TokenConfig`, `WalletConfig`, … |
| Token / chain config | `tokens`, `usdtChains`, `usdcChains`, `frxusdChains`, `usdt0Chains` |
| RPC | `setRpcUrls`, `getRpcUrls`, `getChainRpcUrl`, `NetworkRpcUrlsMap` |
| Utilities | `numberRemoveEndZero`, `getRouteStatus`, `getPrice`, `Csl`, `ExecTime`, … |

See `dist/index.d.ts` after running `pnpm build`.

## Authentication

Required for API access:

```ts
import { OpenAPI } from '@stableflow/core';

OpenAPI.TOKEN = 'your-jwt-token';
```

**👉 [Apply for JWT Token](https://docs.google.com/forms/u/3/d/e/1FAIpQLSdTeV7UaZ1MiFxdJ2jH_PU60PIN3iqYJ1WXEOFY45TsAy6O5g/viewform)**

Optional for OneClick routes(SFA.getQuote) — pass your NearIntents JWT for authenticated OneClick API access and fee-free swaps:

```ts
OpenAPI.NEARINTENTS_TOKEN = 'your-nearintents-jwt-token';
```

**👉 [Apply for NearIntents JWT Token](https://partners.near-intents.org/home)**

## RPC configuration (optional)

Override or extend chain RPC URLs when the built-in defaults are insufficient:

```ts
import { setRpcUrls } from '@stableflow/core';

setRpcUrls({
  eth: ['https://your-eth-rpc.example.com'],
  arb: ['https://your-arb-rpc.example.com'],
});
```

Use `getChainRpcUrl(chainKey)` to read the active URL or URLs for a chain.

## Debug Logs (optional)

```typescript
import { OpenAPI } from "@stableflow/core";

OpenAPI.DEBUG = true;
```

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [@stableflow/bridges](../bridges/README.md)

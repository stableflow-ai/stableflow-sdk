# @stableflow/bridges

StableFlow bridge services: OneClick, CCTP, USDT0, FraxZero, Native, and composite routes.

## Installation

```bash
pnpm add @stableflow/bridges @stableflow/core
```

Also install the wallet adapter(s) for the chains you support (e.g. `@stableflow/wallet-evm`).

## When to use

Use this package when you need:

- **Multi-route quotes** across all supported bridge services (`BridgeSFA.getAllQuote`)
- **Unified send and status** for a selected route (`BridgeSFA.send`, `BridgeSFA.getStatus`)
- Low-level access to individual bridge implementations via `ServiceMap`

For HTTP-only quote/status without wallet orchestration, [`@stableflow/core`](../core/README.md) `SFA` may be enough.

## Main exports

| Export | Description |
|--------|-------------|
| `BridgeSFA` | Multi-route quote, send, and status |
| `GetAllQuoteParams` | Parameters for `getAllQuote` |
| `ServiceMap` | Per-service `quote` / `send` / `getStatus` implementations |
| `getQuoteModes` | Helpers to interpret quote shape (OneClick, exact output, etc.) |
| Utilities | `formatQuoteError`, `addressToBytes32`, `quoteSignature`, `formatNumber` |
| USDT0 / FraxZero | `USDT0_CONFIG`, `OFT_ABI`, `getHopMsgFee`, `FRAXZERO_MIDDLE_TOKEN_*`, … |

Supported `Service` values (from `@stableflow/core`): `oneclick`, `usdt0`, `cctp`, `fraxzero`, composite routes (`usdt0-oneclick`, `oneclick-usdt0`, `fraxzero-oneclick`, `oneclick-fraxzero`), and `native`.

See `dist/index.d.ts` after `pnpm build`.

## Quick example

```ts
import { BridgeSFA } from '@stableflow/bridges';
import { EVMWallet } from '@stableflow/wallet-evm';

const wallet = new EVMWallet(/* provider */);

const results = await BridgeSFA.getAllQuote({
  dry: true, // fast comparison; use dry: false before send
  prices: { ETH: '3000', BNB: '900' },
  fromToken,
  toToken,
  wallet: wallet.wallet,
  recipient: '0x...',
  refundTo: '0x...',
  amountWei: '1000000',
  slippageTolerance: 0.5,
});

const txHash = await BridgeSFA.send(serviceType, { wallet: wallet.wallet, quote });
```

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md) — `dry` flag, wallet integration, Hyperliquid
- [@stableflow/core](../core/README.md)

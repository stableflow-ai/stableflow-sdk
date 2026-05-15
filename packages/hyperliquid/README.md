# @stableflow/hyperliquid

Hyperliquid deposit helpers for the StableFlow SDK: quote via OneClick, transfer on source chain, permit + deposit to Hyperliquid, and status polling.

## Installation

```bash
pnpm add @stableflow/hyperliquid @stableflow/core @stableflow/bridges
```

Install wallet adapters for the source chain (e.g. `@stableflow/wallet-evm`, `@stableflow/wallet-solana`) and an EVM wallet on Arbitrum for USDC permit signing.

## Main exports

| Export | Description |
|--------|-------------|
| `Hyperliquid` | Service instance: `quote`, `transfer`, `deposit`, `getStatus` |
| `HyperliquidFromTokens` | Supported source tokens |
| `HyperliuquidToToken` | Destination token (USDC on Arbitrum) — note typo in export name |
| `HyperliuquidMinAmount` | Minimum `amountWei` for quotes — note typo in export name |

Types: `HyperliquidQuoteParams`, `HyperliquidTransferParams`, `HyperliquidDepositParams`, `HyperliquidGetStatusParams`, …

## Flow

1. `Hyperliquid.quote({ dry: true, ... })` — fast estimate (default `dry: true`)
2. `Hyperliquid.quote({ dry: false, ... })` — obtain deposit address before transfer
3. `Hyperliquid.transfer({ wallet, quote })` — source-chain deposit tx
4. `Hyperliquid.deposit({ evmWallet, evmWalletAddress, quote, txhash })` — Arbitrum USDC permit + API deposit
5. `Hyperliquid.getStatus({ depositId })` — poll deposit status

See [Developer Guide](../../DEVELOPER_GUIDE.md#hyperliquid) for details.

## See also

- [@stableflow/bridges](../bridges/README.md)
- [@stableflow/core](../core/README.md)

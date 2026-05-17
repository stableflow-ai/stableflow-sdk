# demo-hyperliquid

Hyperliquid deposit example using `@stableflow/hyperliquid`, `@stableflow/wallet-evm`, and RainbowKit. Migrated from the legacy `hyperliquid-demo` Next.js app.

## Flow

1. `Hyperliquid.quote({ dry: true })` — preview
2. `Hyperliquid.quote({ dry: false })` — deposit address
3. `Hyperliquid.transfer` — source-chain deposit
4. `Hyperliquid.deposit` — Arbitrum USDC permit + register
5. `Hyperliquid.getStatus` — poll by `depositId`

Minimum amount: `HyperliuquidMinAmount` (see package export).

## Run

```bash
pnpm dev:demo-hyperliquid
```

Open **`http://localhost:3010`**.

## Environment

```env
VITE_STABLEFLOW_JWT_TOKEN=your-jwt
VITE_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id
```

## See also

- [Developer Guide — Hyperliquid](../../DEVELOPER_GUIDE.md#hyperliquid)

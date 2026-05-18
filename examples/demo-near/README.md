# demo-near

Reference React application demonstrating StableFlow cross-chain quotes and transfers with **NEAR** and **EVM** source chains.

**Stack:** Vite 7, React, NEAR Wallet Selector, `@stableflow/wallet-near`, wagmi, RainbowKit, `@stableflow/wallet-evm`. All `@stableflow/*` packages use the **beta** dist-tag.

## What it demonstrates

- Connecting NEAR wallets via `@near-wallet-selector` and `NearWallet`
- Connecting EVM wallets via RainbowKit / `EVMWallet`
- Multi-route quotes with `BridgeSFA.getAllQuote` when **From** is NEAR or EVM
- Route selection and `BridgeSFA.send`
- Transaction history with `BridgeSFA.getStatus`

## Prerequisites

- Node.js 18+
- pnpm 10.x

From the **monorepo root** (`stableflow/`):

```bash
pnpm install
pnpm build
```

## Environment variables

Create `examples/demo-near/.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_STABLEFLOW_JWT_TOKEN` | No | JWT for authenticated API calls |
| `VITE_WALLET_CONNECT_PROJECT_ID` | Yes (for EVM) | WalletConnect project ID for RainbowKit |

```env
VITE_STABLEFLOW_JWT_TOKEN=your-jwt-here
VITE_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id
```

## Run

```bash
pnpm dev:demo-near
```

Open **`http://localhost:3004`**.

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [demo-evm](../demo-evm/README.md)

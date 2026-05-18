# demo-full

Reference React application demonstrating StableFlow cross-chain quotes and transfers across **all supported bridge chains**: EVM, Aptos, NEAR, Solana, Sui, TON, and Tron.

Does **not** include [demo-simple](../demo-simple/README.md) (SFA HTTP only) or [demo-hyperliquid](../demo-hyperliquid/README.md) (Hyperliquid deposit).

**Stack:** Vite 7, React, RainbowKit/wagmi, Aptos/Solana/NEAR/Sui/TON/Tron wallet adapters, `@stableflow/bridges`. All `@stableflow/*` packages use the **beta** dist-tag.

## What it demonstrates

- Connecting wallets for every bridge chain type in one app
- Full token list from `@stableflow/core` (`getBridgeTokens`)
- Multi-route quotes with `BridgeSFA.getAllQuote` and `BridgeSFA.send`
- Animated gradient background UI
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

Create `examples/demo-full/.env.local` (not committed):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_STABLEFLOW_JWT_TOKEN` | No | JWT for authenticated API calls. |
| `VITE_WALLET_CONNECT_PROJECT_ID` | Yes (for EVM) | WalletConnect project ID for RainbowKit. |

Example:

```env
VITE_STABLEFLOW_JWT_TOKEN=your-jwt-here
VITE_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id
```

**Security:** Never commit `.env.local` or share JWT tokens in version control.

## Run

From the monorepo root:

```bash
pnpm dev:demo-full
```

Dev server: **http://localhost:3011**

Or from this directory:

```bash
pnpm dev
```

## Wallets

| Chain | Wallets |
|-------|---------|
| EVM | RainbowKit (MetaMask, OKX, etc.) |
| Aptos | Petra, OKX, Nightly, Backpack, … |
| NEAR | MyNearWallet, Meteor, Hot, Intear |
| Solana | Phantom, Solflare |
| Sui | Sui wallet picker (dApp Kit) |
| TON | TonConnect |
| Tron | TronLink, OKX |

TON requires `public/tonconnect-manifest.json` (included).

## Related demos

Per-chain focused examples:

- [demo-evm](../demo-evm/README.md)
- [demo-aptos](../demo-aptos/README.md)
- [demo-near](../demo-near/README.md)
- [demo-solana](../demo-solana/README.md)
- [demo-sui](../demo-sui/README.md)
- [demo-ton](../demo-ton/README.md)
- [demo-tron](../demo-tron/README.md)

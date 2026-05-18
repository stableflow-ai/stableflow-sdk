# demo-aptos

Reference React application demonstrating StableFlow cross-chain quotes and transfers with **Aptos** and **EVM** source chains.

**Stack:** Vite 7, React, Aptos Wallet Adapter, `@stableflow/wallet-aptos`, wagmi, RainbowKit, `@stableflow/wallet-evm`. All `@stableflow/*` packages use the **beta** dist-tag.

## What it demonstrates

- Connecting Aptos wallets (Petra, OKX, etc.) via `@aptos-labs/wallet-adapter-react` and `AptosWallet`
- Connecting EVM wallets via RainbowKit / `EVMWallet`
- Multi-route quotes with `BridgeSFA.getAllQuote` when **From** is Aptos or EVM
- Route selection and `BridgeSFA.send` (including Aptos OneClick proxy path)
- Transaction history with `BridgeSFA.getStatus`
- Optional JWT authentication for the StableFlow API

## Prerequisites

- Node.js 18+
- pnpm 10.x

From the **monorepo root** (`stableflow/`):

```bash
pnpm install
pnpm build   # or build only what demo needs: core, bridges, wallet-evm, wallet-aptos
```

## Environment variables

Create `examples/demo-aptos/.env.local` (not committed):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_STABLEFLOW_JWT_TOKEN` | No | JWT for authenticated API calls. If unset, requests run without `OpenAPI.TOKEN`. |
| `VITE_WALLET_CONNECT_PROJECT_ID` | Yes (for EVM) | WalletConnect project ID for RainbowKit. |

The SDK talks to **`https://api.stableflow.ai`** by default. No API URL configuration is needed.

Example:

```env
VITE_STABLEFLOW_JWT_TOKEN=your-jwt-here
VITE_WALLET_CONNECT_PROJECT_ID=your-walletconnect-project-id
```

**Security:** Never commit `.env.local` or share JWT tokens in version control.

## Run

From the monorepo root:

```bash
pnpm dev:demo-aptos
```

Or from this directory:

```bash
pnpm dev
```

Open the URL printed by Vite (default **`http://localhost:3003`**).

## Build

```bash
pnpm build
# or from monorepo root:
pnpm --filter demo-aptos build
```

Preview production build:

```bash
pnpm preview
```

## RPC configuration

`src/main.tsx` calls `setRpcUrls` with public RPC endpoints for several EVM chains. Aptos mainnet RPC is handled by `@aptos-labs/ts-sdk` / `@stableflow/core` defaults. Adjust EVM RPCs if you hit rate limits or need private endpoints. See [Developer Guide](../../DEVELOPER_GUIDE.md#configuration).

## `dry` flag note

The demo calls `BridgeSFA.getAllQuote` with **`dry: false`** in [`src/App.tsx`](src/App.tsx) so deposit addresses appear on the first quote request.

For production integrations, prefer:

1. `dry: true` — compare all routes quickly
2. `dry: false` with `singleService` — final quote before approve/send

See [Developer Guide — Quote performance](../../DEVELOPER_GUIDE.md#quote-performance-the-dry-flag).

## Project structure

| Path | Role |
|------|------|
| `src/main.tsx` | `OpenAPI.TOKEN`, `setRpcUrls`, app bootstrap |
| `src/App.tsx` | Quote and send flow (Aptos + EVM) |
| `src/providers/AptosAdapter.tsx` | Aptos Wallet Adapter + `AptosWallet` wiring |
| `src/providers/Rainbow.tsx` | wagmi + `EVMWallet` wiring |
| `src/providers/index.tsx` | Combined wallet providers |
| `src/hooks/useWallet.ts` | Wallet adapter per selected chain type |
| `src/utils/chains.ts` | Aptos + EVM token list from `@stableflow/core` |
| `src/stores/use-wallets.ts` | Zustand store for `evm` and `aptos` slices |

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [Monorepo README](../../README.md)
- [@stableflow/wallet-aptos](../../packages/wallet-aptos/README.md)
- [@stableflow/wallet-evm](../../packages/wallet-evm/README.md)
- [demo-evm](../demo-evm/README.md)

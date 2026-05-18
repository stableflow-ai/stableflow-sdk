# demo-evm

Reference React application demonstrating StableFlow cross-chain quotes and transfers on EVM (and other chains via the shared token registry).

**Stack:** Vite 7, React, wagmi, RainbowKit, `@stableflow/core`, `@stableflow/bridges`, `@stableflow/wallet-evm`.

## What it demonstrates

- Connecting a source-chain wallet via RainbowKit / `EVMWallet`
- Multi-route quotes with `BridgeSFA.getAllQuote`
- Route selection, token approval, and `BridgeSFA.send`
- Transaction history with `BridgeSFA.getStatus`
- Optional JWT authentication for the StableFlow API

## Prerequisites

- Node.js 18+
- pnpm 10.x

From the **monorepo root** (`stableflow/`):

```bash
pnpm install
pnpm build   # or build only what demo needs: core, bridges, wallet-evm
```

## Environment variables

Create `examples/demo-evm/.env.local` (not committed):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_STABLEFLOW_JWT_TOKEN` | No | JWT for authenticated API calls. If unset, requests run without `OpenAPI.TOKEN`. |

The SDK talks to **`https://api.stableflow.ai`** by default. No API URL configuration is needed.

Example:

```env
VITE_STABLEFLOW_JWT_TOKEN=your-jwt-here
```

**Security:** Never commit `.env.local` or share JWT tokens in version control.

## Run

From the monorepo root:

```bash
pnpm dev:demo-evm
```

Or from this directory:

```bash
pnpm dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

## Build

```bash
pnpm build
# or from monorepo root:
pnpm --filter demo-evm build
```

Preview production build:

```bash
pnpm preview
```

## RPC configuration

`src/main.tsx` calls `setRpcUrls` with public RPC endpoints for several EVM chains. Adjust these if you hit rate limits or need private RPCs. See [Developer Guide](../../DEVELOPER_GUIDE.md#configuration).

## `dry` flag note

The demo calls `BridgeSFA.getAllQuote` with **`dry: false`** in [`src/App.tsx`](src/App.tsx) (around line 73) so deposit addresses appear on the first quote request.

For production integrations, prefer:

1. `dry: true` — compare all routes quickly
2. `dry: false` with `singleService` — final quote before approve/send

See [Developer Guide — Quote performance](../../DEVELOPER_GUIDE.md#quote-performance-the-dry-flag).

## Project structure

| Path | Role |
|------|------|
| `src/main.tsx` | `OpenAPI.TOKEN`, `setRpcUrls`, app bootstrap |
| `src/App.tsx` | Quote and send flow |
| `src/providers/Rainbow.tsx` | wagmi + `EVMWallet` wiring |
| `src/hooks/useWallet.ts` | Wallet adapter per selected chain |
| `src/utils/chains.ts` | Token list from `@stableflow/core` |

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [Monorepo README](../../README.md)
- [@stableflow/wallet-evm](../../packages/wallet-evm/README.md)

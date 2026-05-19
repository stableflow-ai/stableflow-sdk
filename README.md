# StableFlow SDK

TypeScript monorepo for cross-chain stablecoin transfers via the [StableFlow](https://app.stableflow.ai) API. Build quotes, compare bridge routes, sign transactions with multi-chain wallets, and track execution status.

## Requirements

- **Node.js** 18+
- **pnpm** 10.x (see `packageManager` in `package.json`)

## Quick start

```bash
pnpm install
pnpm build
```

Run the EVM demo:

```bash
pnpm dev:demo-evm
```

See [examples/demo-evm/README.md](examples/demo-evm/README.md) for environment variables and usage.

Run the All-chain cross-chain bridge demo:

```bash
pnpm dev:demo-full
```

See [examples/demo-full/README.md](examples/demo-full/README.md) for environment variables and usage.

Other examples (each uses `@stableflow/*` **latest** packages):

| Command | Demo |
|---------|------|
| `pnpm dev:demo-aptos` | [demo-near](examples/demo-aptos/README.md) — Aptos + EVM (port 3003) |
| `pnpm dev:demo-near` | [demo-near](examples/demo-near/README.md) — NEAR + EVM (port 3004) |
| `pnpm dev:demo-solana` | [demo-solana](examples/demo-solana/README.md) — Solana + EVM (3005) |
| `pnpm dev:demo-sui` | [demo-sui](examples/demo-sui/README.md) — Sui + EVM (3006) |
| `pnpm dev:demo-ton` | [demo-ton](examples/demo-ton/README.md) — TON + EVM (3007) |
| `pnpm dev:demo-tron` | [demo-tron](examples/demo-tron/README.md) — Tron + EVM (3008) |
| `pnpm dev:demo-simple` | [demo-simple](examples/demo-simple/README.md) — `SFA` HTTP only (3009) |
| `pnpm dev:demo-hyperliquid` | [demo-hyperliquid](examples/demo-hyperliquid/README.md) — Hyperliquid deposit (3010) |

## Documentation

| Document | Description |
|----------|-------------|
| [**Developer Guide**](DEVELOPER_GUIDE.md) | Integration guide, which covers how to integrate StableFlow |
| [Examples index](DEVELOPER_GUIDE.md#examples) | Links to every demo README |

## Repository layout

### Packages

| Package | Directory | Description |
|---------|-----------|-------------|
| `@stableflow/core` | [packages/core](packages/core) | API client, models, token/chain config, `SFA` |
| `@stableflow/bridges` | [packages/bridges](packages/bridges) | `BridgeSFA`, `ServiceMap`, bridge implementations |
| `@stableflow/utils-evm` | [packages/utils-evm](packages/utils-evm) | EVM RPC fallback, LayerZero helpers |
| `@stableflow/utils-solana` | [packages/utils-solana](packages/utils-solana) | Solana RPC fallback, ATA helpers |
| `@stableflow/wallet-evm` | [packages/wallet-evm](packages/wallet-evm) | EVM wallet adapter |
| `@stableflow/wallet-solana` | [packages/wallet-solana](packages/wallet-solana) | Solana wallet adapter |
| `@stableflow/wallet-near` | [packages/wallet-near](packages/wallet-near) | NEAR wallet adapter |
| `@stableflow/wallet-ton` | [packages/wallet-ton](packages/wallet-ton) | TON wallet adapter |
| `@stableflow/wallet-aptos` | [packages/wallet-aptos](packages/wallet-aptos) | Aptos wallet adapter |
| `@stableflow/wallet-tron` | [packages/wallet-tron](packages/wallet-tron) | Tron wallet adapter |
| `@stableflow/wallet-sui` | [packages/wallet-sui](packages/wallet-sui) | Sui wallet adapter |
| `@stableflow/hyperliquid` | [packages/hyperliquid](packages/hyperliquid) | Hyperliquid deposit flow |

Each package has its own README with installation and exports.

### Examples

| Example | Directory | Description |
|---------|-----------|-------------|
| `demo-evm` | [examples/demo-evm](examples/demo-evm) | EVM-only `BridgeSFA` (port 3002) |
| `demo-aptos` | [examples/demo-aptos](examples/demo-aptos) | Aptos + EVM |
| `demo-near` | [examples/demo-near](examples/demo-near) | NEAR + EVM |
| `demo-solana` | [examples/demo-solana](examples/demo-solana) | Solana + EVM |
| `demo-sui` | [examples/demo-sui](examples/demo-sui) | Sui + EVM |
| `demo-ton` | [examples/demo-ton](examples/demo-ton) | TON + EVM |
| `demo-tron` | [examples/demo-tron](examples/demo-tron) | Tron + EVM |
| `demo-simple` | [examples/demo-simple](examples/demo-simple) | `@stableflow/core` / `SFA` only |
| `demo-hyperliquid` | [examples/demo-hyperliquid](examples/demo-hyperliquid) | `@stableflow/hyperliquid` deposit |
| `demo-full` | [examples/demo-full](examples/demo-full) | All bridge chains (EVM, Aptos, NEAR, Solana, Sui, TON, Tron) |

## Build scripts

From the monorepo root:

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages and examples (ordered: core → utils → bridges → wallets → hyperliquid → demo) |
| `pnpm build:pub` | Build all packages (ordered: core → utils → bridges → wallets → hyperliquid) |
| `pnpm build:core` | Build `@stableflow/core` only |
| `pnpm build:utils` | Build `@stableflow/utils-*` only |
| `pnpm build:bridges` | Build `@stableflow/bridges` |
| `pnpm build:wallets` | Build all wallet packages |
| `pnpm build:hyperliquid` | Build `@stableflow/hyperliquid` |
| `pnpm build:examples` | Build all examples under `examples/*` |
| `pnpm dev:demo-*` | Start a specific example (see table above) |

## Minimal integration example

```ts
import { BridgeSFA } from '@stableflow/bridges';
import { tokens } from '@stableflow/core';
import { EVMWallet } from '@stableflow/wallet-evm';
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const wallet = new EVMWallet(provider, signer);
const fromToken = tokens.find((t) => t.chainName === 'Ethereum' && t.symbol === 'USDT')!;
const toToken = tokens.find((t) => t.chainName === 'Arbitrum' && t.symbol === 'USDC')!;

// Fast route comparison
const quotes = await BridgeSFA.getAllQuote({
  dry: true,
  prices: { ETH: '3000' },
  fromToken,
  toToken,
  wallet: wallet.wallet,
  recipient: '0x...',
  refundTo: '0x...',
  amountWei: '100000000',
  slippageTolerance: 0.5,
});
```

Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for a guide to integrating StableFlow.

## License

MIT — see package `license` fields and [GitHub repository](https://github.com/stableflow-ai/stableflow-sdk).

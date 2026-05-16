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

## Documentation

| Document | Description |
|----------|-------------|
| [**Developer Guide**](DEVELOPER_GUIDE.md) | Integration guide: `dry` quotes, `SFA`, `BridgeSFA`, wallets, Hyperliquid |
| [demo-evm](examples/demo-evm/README.md) | React + wagmi reference app |

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
| `demo-evm` | [examples/demo-evm](examples/demo-evm) | Vite + React + RainbowKit; `BridgeSFA` multi-route quotes and send |

## Build scripts

From the monorepo root:

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages and examples (ordered: core → utils → bridges → wallets → hyperliquid → demo) |
| `pnpm build:core` | Build `@stableflow/core` only |
| `pnpm build:bridges` | Build `@stableflow/bridges` |
| `pnpm build:wallets` | Build all wallet packages |
| `pnpm build:hyperliquid` | Build `@stableflow/hyperliquid` |
| `pnpm dev:demo-evm` | Start the EVM demo dev server |

The root `build:shell` script builds the separate `stableflow-ai-sdk` umbrella package when present in the parent workspace.

## Minimal integration example

```ts
import { BridgeSFA } from '@stableflow/bridges';
import { tokens } from '@stableflow/core';
import { EVMWallet } from '@stableflow/wallet-evm';

const wallet = new EVMWallet(/* your signer */);
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

Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for the full `dry: false` → approve → `send` flow.

## License

MIT — see package `license` fields and [GitHub repository](https://github.com/stableflow-ai/stableflow-ai-sdk).

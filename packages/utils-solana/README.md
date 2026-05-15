# @stableflow/utils-solana

Solana utilities for the StableFlow SDK: RPC fallback connections and associated-token-account helpers.

## Installation

```bash
pnpm add @stableflow/utils-solana @stableflow/core
```

**Peer dependencies** (install in your app):

- `@solana/spl-token` ^0.4.14
- `@solana/web3.js` ^1.98.4

This package is primarily used by `@stableflow/wallet-solana` and some cross-chain wallet paths. Application code rarely imports it directly.

## Main exports

| Export | Description |
|--------|-------------|
| `createSolanaFallbackConnection` | `Connection` proxy with automatic RPC failover |
| `getAvailableSolanaRpcUrl` | Health-check and return a working RPC URL |
| `getDestinationAssociatedTokenAddress` | Resolve or detect need to create recipient ATA |

See `dist/index.d.ts` after `pnpm build`.

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [@stableflow/wallet-solana](../wallet-solana/README.md)

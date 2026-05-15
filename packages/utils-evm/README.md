# @stableflow/utils-evm

EVM utilities for the StableFlow SDK: RPC fallback providers and LayerZero compose helpers.

## Installation

```bash
pnpm add @stableflow/utils-evm @stableflow/core
```

This package is primarily used internally by `@stableflow/bridges` and `@stableflow/wallet-evm`. Application code rarely imports it directly.

## Main exports

| Export | Description |
|--------|-------------|
| `evmRpcFallbackProvider` | EVM JSON-RPC provider with fallback URLs |
| `buildEndpointV2LzComposePayload` | LayerZero v2 compose payload builder |
| `encodeUint`, `normalizeHex`, `toBytes32` | Encoding helpers |
| `NATIVE_MSG_FEE_BUFFER` | Native message fee buffer constant |

See `dist/index.d.ts` after `pnpm build`.

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [@stableflow/wallet-evm](../wallet-evm/README.md)

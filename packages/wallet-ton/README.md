# @stableflow/wallet-ton

TON wallet adapter for the StableFlow SDK.

## Installation

```bash
pnpm add @stableflow/wallet-ton @stableflow/core @stableflow/bridges
```

**Peer dependencies:**

- `@ton/ton` ^16.2.4
- `@layerzerolabs/lz-ton-sdk-v2` ^3.0.168
- `@layerzerolabs/lz-v2-utilities` ^3.0.151

## When to use

TON as source or destination in USDT0 and related LayerZero routes.

## Main exports

```ts
import TonWallet, { TonWallet as Named } from '@stableflow/wallet-ton';
```

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [@stableflow/bridges](../bridges/README.md)

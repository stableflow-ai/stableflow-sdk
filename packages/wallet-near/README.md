# @stableflow/wallet-near

NEAR wallet adapter for the StableFlow SDK.

## Installation

```bash
pnpm add @stableflow/wallet-near @stableflow/core @stableflow/bridges
```

**Peer dependencies:**

- `@near-js/transactions` ^2.5.1

## When to use

NEAR Intents and other NEAR-based routes. Pass `wallet.wallet` into `BridgeSFA` quote/send parameters.

## Main exports

```ts
import NearWallet, { NearWallet as Named } from '@stableflow/wallet-near';
```

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [@stableflow/bridges](../bridges/README.md)

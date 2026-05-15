# @stableflow/wallet-solana

Solana wallet adapter for the StableFlow SDK.

## Installation

```bash
pnpm add @stableflow/wallet-solana @stableflow/core @stableflow/bridges
```

**Peer dependencies:**

- `@solana/web3.js` ^1.98.4
- `@solana/spl-token` ^0.4.14
- `@layerzerolabs/lz-v2-utilities` ^3.0.151
- `@layerzerolabs/lz-solana-sdk-v2` ^3.0.154
- `@layerzerolabs/oft-v2-solana-sdk` ^3.0.168
- `@coral-xyz/anchor` ^0.29.0
- `@metaplex-foundation/umi` ^1.5.1 (and related Metaplex packages — see `package.json`)

## When to use

Solana as source or destination chain in `BridgeSFA` flows. Pass the adapter’s `wallet` (`WalletConfig`) into quote and send calls.

## Main exports

```ts
import SolanaWallet, { SolanaWallet as Named } from '@stableflow/wallet-solana';
```

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [@stableflow/bridges](../bridges/README.md)

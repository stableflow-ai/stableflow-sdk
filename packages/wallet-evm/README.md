# @stableflow/wallet-evm

EVM wallet adapter for the StableFlow SDK. Implements `WalletConfig` methods used by `BridgeSFA` and `ServiceMap` routes (approve, transfer, sign, quote simulation).

## Installation

```bash
pnpm add @stableflow/wallet-evm @stableflow/core @stableflow/bridges
```

**Peer dependencies:**

- `@layerzerolabs/lz-v2-utilities` ^3.0.151

## When to use

Connect any EVM-compatible wallet (MetaMask, WalletConnect via wagmi/ethers, etc.) and pass `wallet.wallet` (`WalletConfig`) into `BridgeSFA.getAllQuote` / `BridgeSFA.send`.

For routes that require a separate EVM signer (e.g. permit on another chain), also pass `evmWallet` and `evmAddress` in `GetAllQuoteParams`.

## Main exports

```ts
import EVMWallet, { EVMWallet as Named } from '@stableflow/wallet-evm';

const adapter = new EVMWallet(/* ethers signer or wagmi client */);
const walletConfig = adapter.wallet; // WalletConfig
```

See `dist/index.d.ts` after `pnpm build`.

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [demo-evm example](../../examples/demo-evm/README.md)
- [@stableflow/bridges](../bridges/README.md)

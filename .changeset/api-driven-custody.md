---
"@stableflow/bridges": minor
---

Add API-driven custody support for MPC wallets (e.g. Fireblocks).

`BridgeSFA.buildTransaction(serviceType, { quote })` returns serializable, unsigned EVM transaction data (`approveTx`/`approveResetTx`/`tx`) and EIP-712 `permitTypedData` without requiring a signer. `BridgeSFA.report(serviceType, { quote, hash, permitSignature })` submits an externally signed & broadcast transaction back to StableFlow. New exports: `buildSendTx`, `buildApproveTx`, `buildPermitTypedData`, and types `EvmTxData`, `PermitTypedData`, `BuildTransactionResult`, `PermitSignature`.

EVM source chains only for now; non-EVM chains throw. Existing `send`/`getAllQuote`/`getStatus` are unchanged (backward compatible).

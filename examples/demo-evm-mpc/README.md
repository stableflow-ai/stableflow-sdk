# demo-evm-mpc

Reference React application demonstrating StableFlow **API-driven custody** for MPC wallets (e.g. Fireblocks) on EVM chains.

Unlike [`demo-evm`](../demo-evm), this demo never lets the SDK sign or broadcast. Instead:

- StableFlow only produces **quote + route + unsigned transaction data / EIP-712 typed data** (`BridgeSFA.buildTransaction`).
- An **external MPC signer** signs and broadcasts. In this demo the connected browser wallet stands in for Fireblocks / your MPC infrastructure.
- The resulting hash (and permit signature, if any) is reported back with `BridgeSFA.report` so StableFlow can execute the destination leg.

**Source chain is restricted to EVM.**

**Stack:** Vite 7, React, wagmi, RainbowKit, `@stableflow/core`, `@stableflow/bridges`, `@stableflow/wallet-evm`.

## The API-driven flow

The full flow runs end-to-end and is visualized as a step panel in the UI:

1. **Sign approve** — broadcast `build.approveTx` (on Ethereum, `build.approveResetTx` first). Skipped when not required.
2. **Sign permit** — sign `build.permitTypedData` (EIP-712) off-chain, split into `v/r/s`. Skipped when not required.
3. **Sign calldata** — broadcast `build.tx` to get the source-chain hash.
4. **Report transaction** — `BridgeSFA.report(serviceType, { quote, hash, permitSignature })`.

See [`src/App.tsx`](src/App.tsx) `handleSubmitTransaction`.

```ts
// Stableflow builds unsigned data (no signer)
const build = await BridgeSFA.buildTransaction(serviceType, { quote });

// External MPC signer (here: browser wallet) signs & broadcasts
if (build.approveTx) {
  if (build.approveResetTx) await (await signer.sendTransaction(build.approveResetTx)).wait();
  await (await signer.sendTransaction(build.approveTx)).wait();
}
let permitSignature;
if (build.permitTypedData) {
  const { domain, types, values, deadline, nonce, owner } = build.permitTypedData;
  const sig = ethers.Signature.from(await signer.signTypedData(domain, types, values));
  permitSignature = { amount: values.value, deadline, nonce: String(nonce), owner, r: sig.r, s: sig.s, v: sig.v };
}
const { hash } = await signer.sendTransaction(build.tx);

// Report back to Stableflow
await BridgeSFA.report(serviceType, { quote, hash, permitSignature });
```

## Prerequisites

- Node.js 18+
- pnpm 10.x

From the **monorepo root** (`stableflow/`):

```bash
pnpm install
pnpm build   # or build only what the demo needs: core, utils, bridges, wallet-evm
```

## Environment variables

Create `examples/demo-evm-mpc/.env.local` (not committed):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_STABLEFLOW_JWT_TOKEN` | No | JWT for authenticated API calls. If unset, requests run without `OpenAPI.TOKEN`. |
| `VITE_WALLET_CONNECT_PROJECT_ID` | No | WalletConnect project id used by RainbowKit. |

The SDK talks to **`https://api.stableflow.ai`** by default.

**Security:** Never commit `.env.local` or share JWT tokens in version control.

## Run

From the monorepo root:

```bash
pnpm dev:demo-evm-mpc
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
pnpm --filter demo-evm-mpc build
```

## Notes

- The browser wallet is only a stand-in for the external MPC signer. In production, hand `build.approveTx` / `build.tx` (and `build.permitTypedData`) to Fireblocks (or similar) to sign & broadcast, then call `BridgeSFA.report`.
- Non-EVM source chains are intentionally unsupported by `BridgeSFA.buildTransaction` and will throw.
- The demo calls `BridgeSFA.getAllQuote` with `dry: false` so deposit addresses appear on the first request. For production prefer `dry: true` to compare routes, then `dry: false` with `singleService` before building the transaction.

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)
- [demo-evm (signer-based)](../demo-evm/README.md)
- [@stableflow/bridges](../../packages/bridges/README.md)

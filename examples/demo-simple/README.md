# demo-simple

Minimal example: **`@stableflow/core`** for `SFA` HTTP API; **`ethers`** for a one-click ERC20 `transfer` to the quote `depositAddress`.

## Flow

1. `SFA.getTokens()` — filter to EVM `blockchain` values only
2. `SFA.getQuote()` — with **dry run off**, obtain `depositAddress` and `amountIn`
3. **Browser wallet** — connect MetaMask (or any `window.ethereum` wallet), switch to the correct EVM network when possible, call ERC20 `transfer(depositAddress, amountIn)`
4. `SFA.submitDepositTx()` — report deposit tx hash
5. `SFA.getExecutionStatus()` — get transaction status by `depositAddress`

## Run

```bash
pnpm dev:demo-simple
```

Open **`http://localhost:3009`**.

## Environment

```env
VITE_STABLEFLOW_JWT_TOKEN=your-jwt
# optional:
# VITE_STABLEFLOW_API_URL=https://api.stableflow.ai
```

## See also

- [Developer Guide — SFA](../../DEVELOPER_GUIDE.md#sfa--direct-http-api)

# demo-ton

TON + EVM cross-chain bridge example using TonConnect and `@stableflow/wallet-ton`. All `@stableflow/*` packages use **beta**.

## Run

```bash
pnpm dev:demo-ton
```

Open **`http://localhost:3007`**.

Update `public/tonconnect-manifest.json` `url` if you use a different dev host/port.

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_STABLEFLOW_JWT_TOKEN` | Optional API JWT |
| `VITE_WALLET_CONNECT_PROJECT_ID` | WalletConnect for EVM |

## See also

- [Developer Guide](../../DEVELOPER_GUIDE.md)

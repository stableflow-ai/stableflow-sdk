import React from 'react';
import ReactDOM from 'react-dom/client';
import WalletsProvider from './providers';
import App from './App';
import { OpenAPI, setRpcUrls, NetworkRpcUrlsMap } from '@stableflow/core';

OpenAPI.BASE = import.meta.env.VITE_STABLEFLOW_API_URL || 'https://api.stableflow.ai';
OpenAPI.DEBUG = true;
const JWT_TOKEN = import.meta.env.VITE_STABLEFLOW_JWT_TOKEN;
if (JWT_TOKEN) {
  OpenAPI.TOKEN = JWT_TOKEN;
}

const CustomRpcHost = import.meta.env.VITE_CUSTOM_RPC_HOST;
setRpcUrls({
  eth: ['https://0xrpc.io/eth'],
  xlayer: ['https://rpc.xlayer.tech'],
  plasma: ['https://rpc.plasma.to'],
  sol: [`${CustomRpcHost}/solana`],
  pol: ['https://polygon-bor-rpc.publicnode.com'],
  tron: [`${CustomRpcHost}/tron`],
});

console.log(NetworkRpcUrlsMap);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletsProvider>
      <App />
    </WalletsProvider>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import WalletsProvider from './providers';
import App from './App';
import { OpenAPI, setRpcUrls, NetworkRpcUrlsMap } from '@stableflow/core';

OpenAPI.BASE = import.meta.env.VITE_STABLEFLOW_API_URL || 'https://api.stableflow.ai';
OpenAPI.DEBUG = true;
const JWT_TOKEN = import.meta.env.VITE_STABLEFLOW_JWT_TOKEN;
const nearintentsJwt = import.meta.env.VITE_STABLEFLOW_NEARINTENTS_JWT_TOKEN;
if (JWT_TOKEN) {
  OpenAPI.TOKEN = JWT_TOKEN;
}
if (nearintentsJwt) {
  OpenAPI.NEARINTENTS_TOKEN = nearintentsJwt;
}

setRpcUrls({
  eth: ['https://0xrpc.io/eth'],
  xlayer: ['https://rpc.xlayer.tech'],
  plasma: ['https://rpc.plasma.to'],
});

console.log(NetworkRpcUrlsMap);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletsProvider>
      <App />
    </WalletsProvider>
  </React.StrictMode>
);

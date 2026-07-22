import React from 'react';
import ReactDOM from 'react-dom/client';
import WalletsProvider from './providers';
import App from './App';
import { OpenAPI, setRpcUrls, NetworkRpcUrlsMap } from '@stableflow/core';
import { getStableflowApiConfig } from './utils/stableflow-config';

const { apiUrl, jwtToken } = getStableflowApiConfig();
OpenAPI.BASE = apiUrl;
OpenAPI.DEBUG = true;
const nearintentsJwt = import.meta.env.VITE_STABLEFLOW_NEARINTENTS_JWT_TOKEN;
if (jwtToken) {
  OpenAPI.TOKEN = jwtToken;
}
if (nearintentsJwt) {
  OpenAPI.NEARINTENTS_TOKEN = nearintentsJwt;
}

const CustomRpcHost = import.meta.env.VITE_CUSTOM_RPC_HOST;
setRpcUrls({
  eth: [`${CustomRpcHost}/ethereum`],
  plasma: [`${CustomRpcHost}/plasma`],
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

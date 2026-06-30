import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { OpenAPI } from '@stableflow/core';
import './App.css';

OpenAPI.BASE = import.meta.env.VITE_STABLEFLOW_API_URL || 'https://api.stableflow.ai';
const jwt = import.meta.env.VITE_STABLEFLOW_JWT_TOKEN;
const nearintentsJwt = import.meta.env.VITE_STABLEFLOW_NEARINTENTS_JWT_TOKEN;
if (jwt) {
  OpenAPI.TOKEN = jwt;
}
if (nearintentsJwt) {
  OpenAPI.NEARINTENTS_TOKEN = nearintentsJwt;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

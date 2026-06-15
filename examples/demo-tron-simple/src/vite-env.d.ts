/// <reference types="vite/client" />

import type { Eip1193Provider } from 'ethers';

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }

  interface ImportMetaEnv {
    readonly VITE_STABLEFLOW_JWT_TOKEN?: string;
    readonly VITE_STABLEFLOW_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};

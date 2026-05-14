import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: [
    '@stableflow/core',
    '@stableflow/wallet-solana',
    'ethers',
    'big.js',
    'tronweb',
    '@layerzerolabs/lz-v2-utilities',
  ],
});

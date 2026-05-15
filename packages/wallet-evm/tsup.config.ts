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
    '@stableflow/bridges',
    '@stableflow/utils-evm',
    '@stableflow/utils-solana',
    'ethers',
    'big.js',
    '@layerzerolabs/lz-v2-utilities',
  ],
});

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
    '@stableflow/utils-solana',
    'big.js',
    '@ton/ton',
    '@layerzerolabs/lz-ton-sdk-v2',
    '@layerzerolabs/lz-v2-utilities',
    'bigint-buffer',
  ],
});

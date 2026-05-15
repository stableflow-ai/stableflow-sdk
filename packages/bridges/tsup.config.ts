import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  external: [
    '@stableflow/core',
    '@stableflow/utils-evm',
    'axios',
    'big.js',
    'ethers',
  ],
});

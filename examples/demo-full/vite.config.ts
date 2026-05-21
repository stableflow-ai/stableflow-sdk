import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    port: 3011,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
      { find: 'buffer', replacement: 'buffer' },
    ],
  },
  define: {
    'process.env': {},
    'process.browser': 'true',
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'stream', 'util', 'near-api-js'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
        'process.env': '{}',
        'process.browser': 'true',
      },
    },
    force: true,
  },
});

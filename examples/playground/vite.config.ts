import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@graph-state/core', '@graph-state/react'],
  },
  resolve: {
    alias: {
      '@graph-state/core': path.resolve(
        __dirname,
        '../../packages/core/dist/index.js'
      ),
      '@graph-state/react': path.resolve(
        __dirname,
        '../../packages/react/dist/index.js'
      ),
      '@graph-state/plugin-logger': path.resolve(
        __dirname,
        '../../plugins/logger/dist/index.js'
      ),
      '@graph-state/plugin-extend': path.resolve(
        __dirname,
        '../../plugins/extend/dist/index.js'
      ),
    },
  },
});

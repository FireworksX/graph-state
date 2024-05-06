import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    minify: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    format: ['esm', 'cjs'],
    dts: true,
  },
])

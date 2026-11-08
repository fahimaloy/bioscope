import { defineConfig } from 'vitest/config'
import path from 'path'

// Named const + default export (the same shape as tailwind.config.ts) so the
// config object is an indexed symbol: GitNexus `detect-changes` maps diff hunks
// onto symbol line spans, and an anonymous `export default defineConfig({...})`
// leaves the file with no symbol at all.
const config = defineConfig({
  // Component tests are .tsx and must use the same automatic JSX runtime as
  // Next (`react/jsx-runtime`), otherwise esbuild emits classic
  // `React.createElement` calls into files that never import React.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/actions/**', 'src/lib/server/**'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
})

export default config

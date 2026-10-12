import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@ui/core': path.resolve(__dirname, 'src/index.ts'),
      '@ui/tokens': path.resolve(__dirname, '../tokens/src/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/types.ts'],
    },
  },
});
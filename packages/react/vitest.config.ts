import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@element-works/components': path.resolve(__dirname, '../components/src/index.ts'),
      '@element-works/motion': path.resolve(__dirname, '../motion/src/index.ts'),
      '@element-works/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@element-works/tokens': path.resolve(__dirname, '../tokens/src/index.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['test/**/*.test.tsx'],
    setupFiles: ['../components/test/setup.ts'],
  },
});

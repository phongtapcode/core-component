import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const tokensRoot = fileURLToPath(new URL('../packages/tokens', import.meta.url));
const coreRoot = fileURLToPath(new URL('../packages/core', import.meta.url));
const motionRoot = fileURLToPath(new URL('../packages/motion', import.meta.url));
const componentsRoot = fileURLToPath(new URL('../packages/components', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // CSS subpaths resolve to the package root + the requested file.
      '@element-works/tokens/css/tokens.css': `${tokensRoot}/css/tokens.css`,
      '@element-works/motion/css/motion.css': `${motionRoot}/css/motion.css`,
      '@element-works/components/css/components.css': `${componentsRoot}/css/components.css`,
      // JS subpaths resolve to the package source.
      '@element-works/tokens': `${tokensRoot}/src/index.ts`,
      '@element-works/tokens/': `${tokensRoot}/src/`,
      '@element-works/core': `${coreRoot}/src/index.ts`,
      '@element-works/core/': `${coreRoot}/src/`,
      '@element-works/motion': `${motionRoot}/src/index.ts`,
      '@element-works/motion/': `${motionRoot}/src/`,
      '@element-works/components': `${componentsRoot}/src/index.ts`,
      '@element-works/components/': `${componentsRoot}/src/`,
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  server: {
    port: 5173,
    open: true,
  },
});
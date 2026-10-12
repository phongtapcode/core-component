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
      '@ui/tokens/css/tokens.css': `${tokensRoot}/css/tokens.css`,
      '@ui/motion/css/motion.css': `${motionRoot}/css/motion.css`,
      '@ui/components/css/components.css': `${componentsRoot}/css/components.css`,
      // JS subpaths resolve to the package source.
      '@ui/tokens': `${tokensRoot}/src/index.ts`,
      '@ui/tokens/': `${tokensRoot}/src/`,
      '@ui/core': `${coreRoot}/src/index.ts`,
      '@ui/core/': `${coreRoot}/src/`,
      '@ui/motion': `${motionRoot}/src/index.ts`,
      '@ui/motion/': `${motionRoot}/src/`,
      '@ui/components': `${componentsRoot}/src/index.ts`,
      '@ui/components/': `${componentsRoot}/src/`,
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
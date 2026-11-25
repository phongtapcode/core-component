import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const files = [
  '../tokens/css/tokens.css',
  '../motion/css/motion.css',
  '../components/css/components.css',
];
const contents = files.map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'));
writeFileSync(new URL('./dist/styles.css', import.meta.url), contents.join('\n\n'));

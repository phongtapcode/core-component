import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packages = ['tokens', 'core', 'motion', 'components'];
const versions = new Map(packages.map((name) => {
  const manifest = JSON.parse(readFileSync(join(root, 'packages', name, 'package.json'), 'utf8'));
  return [manifest.name, manifest.version];
}));
const destination = mkdtempSync(join(tmpdir(), 'ui-pack-check-'));

try {
  for (const name of packages) {
    const directory = join(root, 'packages', name);
    const output = execFileSync('pnpm', ['pack', '--pack-destination', destination, '--json'], {
      cwd: directory,
      encoding: 'utf8',
    });
    const packed = JSON.parse(output);
    const manifest = JSON.parse(execFileSync('tar', ['-xOzf', packed.filename, 'package/package.json'], {
      encoding: 'utf8',
    }));
    const files = new Set(packed.files.map((file) => file.path));

    if (manifest.private || manifest.publishConfig?.access !== 'public') {
      throw new Error(`${manifest.name}: package is not configured for public publishing`);
    }

    for (const path of ['dist/index.js', 'dist/index.d.ts']) {
      if (!files.has(path)) throw new Error(`${manifest.name}: missing ${path}`);
    }
    if (name !== 'core' && !files.has(`css/${name}.css`)) {
      throw new Error(`${manifest.name}: missing CSS export`);
    }

    for (const [dependency, range] of Object.entries(manifest.dependencies ?? {})) {
      if (range.startsWith('workspace:')) {
        throw new Error(`${manifest.name}: unresolved workspace dependency ${dependency}`);
      }
      if (versions.has(dependency) && range !== versions.get(dependency)) {
        throw new Error(`${manifest.name}: ${dependency} must match its packed version`);
      }
    }

    for (const target of Object.values(manifest.exports ?? {})) {
      const paths = typeof target === 'string' ? [target] : Object.values(target);
      for (const path of paths) {
        if (!files.has(path.replace(/^\.\//, ''))) {
          throw new Error(`${manifest.name}: export ${path} is absent from the tarball`);
        }
      }
    }

    console.log(`${manifest.name}@${manifest.version}: package contents and dependencies OK`);
  }
} finally {
  rmSync(destination, { recursive: true, force: true });
}

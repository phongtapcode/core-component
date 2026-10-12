/**
 * Dev-mode detection. Centralised so that dev-only behaviour can be removed
 * by a future bundler dead-code-elimination pass.
 *
 * Rules:
 *   - `NODE_ENV !== 'production'` → dev mode.
 *   - `import.meta.env?.DEV === true` (Vite) → dev mode.
 *   - Otherwise → production.
 */

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const importMeta = import.meta as { env?: { DEV?: unknown; MODE?: unknown } };

export function isDevMode(): boolean {
  const nodeEnv = env?.['NODE_ENV'];
  if (nodeEnv && nodeEnv !== 'production') return true;
  if (importMeta.env?.['DEV'] === true) return true;
  const mode = importMeta.env?.['MODE'];
  if (mode && mode !== 'production') return true;
  return false;
}
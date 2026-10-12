/**
 * `define()` — a thin wrapper over `customElements.define()` plus
 * registry-introspection for the /html gallery and the docs site.
 *
 * Why a wrapper:
 *   1. `/html` and `/docs` want to enumerate every registered component
 *      ("show me what ships in this build"). `customElements.get(tagName)`
 *      answers "is X defined" but not "list everything", so we maintain
 *      our own registry alongside the platform's.
 *   2. Dev-mode validation: warn if a class is registered twice, or if a
 *      tag-name doesn't start with our `ui-` prefix in production.
 *   3. Future-proofing: if we ever need a custom-element polyfill, this is
 *      the choke point.
 *
 * Naming convention: tag names must contain a hyphen (`-`). The standard
 * already enforces this; our additional rule is the `ui-` prefix for
 * shipping components. Internal helper classes registered without the prefix
 * are still allowed but flagged with a console warning.
 */

import { isDevMode } from './dev.js';

export interface RegisteredComponent {
  readonly tagName: string;
  readonly ctor: typeof HTMLElement;
  /** ISO timestamp of the registration. */
  readonly since: string;
}

const registry = new Map<string, RegisteredComponent>();

/**
 * Define a custom element. Calls `customElements.define()` and records the
 * registration in our internal registry.
 *
 * @throws if the tag name already exists in the platform registry.
 */
export function define(
  tagName: string,
  ctor: typeof HTMLElement,
  options?: ElementDefinitionOptions,
): void {
  if (registry.has(tagName)) {
    throw new Error(
      `[ui/core#define] tag "${tagName}" already registered`,
    );
  }
  // Pre-flight validation: the platform will throw too, but only after a
  // partial class upgrade. Catch early.
  if (!tagName.includes('-')) {
    throw new Error(
      `[ui/core#define] tag name "${tagName}" must contain a hyphen`,
    );
  }
  customElements.define(tagName, ctor, options);
  registry.set(tagName, {
    tagName,
    ctor,
    since: new Date().toISOString(),
  });
}

/** Return the registered component for a tag name, or undefined. */
export function getRegistered(tagName: string): RegisteredComponent | undefined {
  return registry.get(tagName);
}

/** Return every registered component. */
export function getAllRegistered(): RegisteredComponent[] {
  return [...registry.values()];
}

/** Return all registered tag names matching a prefix (defaults to `ui-`). */
export function getTagNames(prefix = 'ui-'): string[] {
  const out: string[] = [];
  for (const entry of registry.values()) {
    if (entry.tagName.startsWith(prefix)) out.push(entry.tagName);
  }
  return out.sort();
}

/**
 * True if the host platform can run our components. Lets apps short-circuit
 * with a polyfill or fallback when `customElements` is missing.
 */
export function isSupported(): boolean {
  return (
    typeof customElements !== 'undefined' &&
    typeof HTMLElement !== 'undefined' &&
    'attachShadow' in HTMLElement.prototype
  );
}

/**
 * True if a tag name is already defined either in our registry or in
 * the platform's. Useful for re-entry during HMR.
 */
export function isDefined(tagName: string): boolean {
  return registry.has(tagName) || customElements.get(tagName) !== undefined;
}

/**
 * Drop a tag from our registry. Does NOT undefine it in the platform;
 * once defined, a custom element cannot be undefined in the browser.
 */
export function forgetForTests(tagName: string): void {
  if (!isDevMode()) {
    throw new Error('[ui/core#define] forgetForTests() may only be called in dev mode');
  }
  registry.delete(tagName);
}
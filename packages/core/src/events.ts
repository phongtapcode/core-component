/**
 * Event helpers used by every component. All listeners registered via these
 * helpers are routed through the host's CleanupRegistry and never leak.
 *
 * Conventions:
 *  - All custom events are emitted with `composed: true` so they cross
 *    Shadow DOM boundaries.
 *  - All custom events bubble unless explicitly opted out.
 *  - Public events are typed via the `CustomEvent<T>` factory.
 */

import type { CleanupRegistry, Disposer } from './index.js';

/**
 * Add a typed event listener and register its removal with the registry.
 * Returns the same registry for fluent chaining.
 */
export function on<K extends keyof HTMLElementEventMap>(
  target: EventTarget,
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean,
  registry?: CleanupRegistry,
): () => void;
export function on(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions | boolean,
  registry?: CleanupRegistry,
): () => void;
export function on(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options: AddEventListenerOptions | boolean = {},
  registry?: CleanupRegistry,
): () => void {
  target.addEventListener(type, listener, options);
  const off: Disposer = () => target.removeEventListener(type, listener, options);
  registry?.add(off);
  return off;
}

/**
 * Add a one-shot listener that auto-removes itself on first invocation.
 */
export function once<K extends keyof HTMLElementEventMap>(
  target: EventTarget,
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean,
  registry?: CleanupRegistry,
): () => void;
export function once(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions | boolean,
  registry?: CleanupRegistry,
): () => void;
export function once(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options: AddEventListenerOptions | boolean = {},
  registry?: CleanupRegistry,
): () => void {
  let fired = false;
  const wrapper: EventListener = (ev) => {
    if (fired) return;
    fired = true;
    target.removeEventListener(type, wrapper, options);
    registry?.add(() => {
      /* already removed; nothing to do */
    });
    listener(ev);
  };
  target.addEventListener(type, wrapper, options);
  registry?.add(() => target.removeEventListener(type, wrapper, options));
  return () => {
    if (fired) return;
    fired = true;
    target.removeEventListener(type, wrapper, options);
  };
}

/**
 * Dispatch a typed custom event. Always `composed: true`, default `bubbles: true`,
 * `cancelable: false`. Pass an explicit `{ bubbles: false }` in options to override.
 */
export function emit<T = unknown>(
  target: EventTarget,
  type: string,
  detail?: T,
  options: CustomEventInit<T> = {},
): boolean {
  // Build the init object lazily so we never assign `undefined` to `detail`
  // (which `exactOptionalPropertyTypes: true` forbids).
  const init: CustomEventInit<T> = {
    bubbles: options.bubbles ?? true,
    composed: options.composed ?? true,
    cancelable: options.cancelable ?? false,
  };
  const finalDetail = options.detail !== undefined ? options.detail : detail;
  if (finalDetail !== undefined) {
    init.detail = finalDetail;
  }
  const event = new CustomEvent<T>(type, init);
  return target.dispatchEvent(event);
}
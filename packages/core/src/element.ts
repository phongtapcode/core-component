/**
 * BaseElement — the foundation every <ui-*> element extends.
 *
 * Lifecycle contract (see CORE_ARCHITECTURE.md §7):
 *   constructor ──► field initialisation only (no DOM, no observers)
 *   connectedCallback ─► onConnect()
 *   then first animation frame ─► onReady() (once)
 *   disconnectedCallback ─► $cleanup.run() + onDisconnect()
 *   adoptedCallback ─► cleanup + onAdopted() + onConnect() equivalent
 *   attributeChangedCallback ─► reflect property; onAttributeChanged()
 *
 * Rules enforced by the constructor:
 *   - No DOM reads, no observer creation, no setTimeout. Only field
 *     assignment. Anything that touches the document must wait for
 *     `connectedCallback`. The `ui/no-side-effects-in-constructor` ESLint
 *     rule (planned in Phase 9 hardening) will catch violations statically.
 *
 * Re-insertion safety:
 *   - `disconnectedCallback` calls `$cleanup.run()`. Every addEventListener,
 *     IntersectionObserver subscription, timer, and rAF handle held by the
 *     element is released. The element is then safe to GC.
 *   - On the next `connectedCallback`, `onConnect()` re-runs as if the element
 *     were new. The element is fully idempotent.
 */

import { applyDefaults, camel, coerce, getParser, kebab, observedAttrsFor, reflect } from './attributes.js';
import { CleanupRegistry } from './cleanup.js';
import { emit, on, once } from './events.js';
import { getObserverManager, type IntersectionObserveOptions, type ResizeObserveOptions } from './observer.js';
import type { Disposer, PropertyDef, PropertyDefMap } from './types.js';

/** Snapshot of the BaseElement surface components are allowed to call. */
export interface BaseElementType extends HTMLElement {
  /** Per-element teardown registry. */
  readonly $cleanup: CleanupRegistry;
  /** Whether `onConnect()` has run at least once. */
  readonly $isConnected: boolean;
  /** Whether `onReady()` has been invoked. */
  readonly $isReady: boolean;
}

/**
 * Abstract base class. Subclasses provide `static properties = {...}` and
 * override `onConnect/onDisconnect/onReady/onAdopted/onAttributeChanged` as
 * needed.
 */
export abstract class BaseElement extends HTMLElement {
  /** Component-declared reflection table. Subclasses may override. */
  static properties?: PropertyDefMap;

  /** Tell the platform which attributes to forward to `attributeChangedCallback`. */
  static get observedAttributes(): string[] {
    return observedAttrsFor((this as unknown as { properties?: PropertyDefMap }).properties);
  }

  // ───── instance state ─────
  readonly $cleanup = new CleanupRegistry();
  #ready = false;
  #constructed = false;
  $isConnected = false;
  $isReady = false;

  constructor() {
    super();
    // Field-only initialisation. NO DOM work, NO observer creation, NO timers.
    // Tests for the rule live in element.test.ts.
    const properties = (this.constructor as { properties?: PropertyDefMap }).properties;
    applyDefaults(this as unknown as HTMLElement & Record<string, unknown>, properties);
    // Construction complete: subsequent attributeChangedCallback calls will
    // fire onAttributeChanged. The synchronous setAttribute() above does not
    // (we're not yet a "full" subclass instance, so calling subclass methods
    // here throws in V8).
    this.#constructed = true;
  }

  // ───── lifecycle ─────

  connectedCallback(): void {
    if (this.$isConnected) return; // already connected (re-entrant calls are no-ops)
    this.$isConnected = true;
    try {
      this.onConnect?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[ui/core#${this.localName}] onConnect threw:`, err);
    }
    // Schedule `onReady` for the first paint after the FIRST connect.
    if (!this.#ready) {
      this.#ready = true;
      const handle = requestAnimationFrame(() => {
        // The element might have been disconnected before the frame fired.
        if (!this.$isConnected) return;
        this.$isReady = true;
        try {
          this.onReady?.();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[ui/core#${this.localName}] onReady threw:`, err);
        }
      });
      this.$cleanup.add(() => cancelAnimationFrame(handle));
    }
  }

  disconnectedCallback(): void {
    if (!this.$isConnected) return;
    this.$isConnected = false;
    // Tear down every listener, observer, timer, rAF before invoking the
    // subclass hook — subclass code should be able to assume the document
    // is clean.
    this.$cleanup.run();
    try {
      this.onDisconnect?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[ui/core#${this.localName}] onDisconnect threw:`, err);
    }
  }

  adoptedCallback(): void {
    this.disconnectedCallback();
    try {
      this.onAdopted?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[ui/core#${this.localName}] onAdopted threw:`, err);
    }
    this.connectedCallback();
  }

  attributeChangedCallback(
    attrName: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (oldValue === newValue) return;
    const def = this.#findDefForAttr(attrName);
    if (def) {
      const typed = coerce(def, newValue);
      if (def.readonly) {
        Object.defineProperty(this, def.name, {
          value: typed,
          writable: false,
          configurable: true,
          enumerable: true,
        });
      } else {
        (this as unknown as Record<string, unknown>)[def.name] = typed;
      }
    }
    // Don't invoke subclass hooks during construction — the subclass fields
    // and methods are not fully bound yet, and V8 enforces strict "this"
    // typing on override methods.
    if (!this.#constructed) return;
    try {
      this.onAttributeChanged?.(attrName, oldValue, newValue);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[ui/core#${this.localName}] onAttributeChanged threw:`, err);
    }
  }

  // ───── subclass hooks ─────

  protected onConnect?(): void;
  protected onDisconnect?(): void;
  protected onReady?(): void;
  protected onAdopted?(): void;
  protected onAttributeChanged?(name: string, oldValue: string | null, newValue: string | null): void;

  // ───── helpers (the `$`-prefixed fluent surface) ─────

  /** Register an event listener that is auto-removed on disconnect. */
  $on<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean,
  ): Disposer;
  $on(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions | boolean,
  ): Disposer;
  $on(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options: AddEventListenerOptions | boolean = {},
  ): Disposer {
    return on(target, type, listener, options, this.$cleanup);
  }

  /** Register a one-shot listener. */
  $once<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean,
  ): Disposer;
  $once(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions | boolean,
  ): Disposer;
  $once(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options: AddEventListenerOptions | boolean = {},
  ): Disposer {
    return once(target, type, listener, options, this.$cleanup);
  }

  /** Dispatch a typed custom event. */
  $emit<T = unknown>(
    type: string,
    detail?: T,
    options: CustomEventInit<T> = {},
  ): boolean {
    return emit(this, type, detail, options);
  }

  /** Subscribe to the host element's intersection with the viewport. */
  $observeIntersection(
    cb: (entry: IntersectionObserverEntry) => void,
    opts: IntersectionObserveOptions = {},
  ): Disposer {
    const manager = getObserverManager(this.ownerDocument ?? document);
    return manager.observeIntersection(this, cb, opts);
  }

  /** Subscribe to the host element's size changes. */
  $observeResize(
    cb: (entry: ResizeObserverEntry) => void,
    opts: ResizeObserveOptions = {},
  ): Disposer {
    const manager = getObserverManager(this.ownerDocument ?? document);
    return manager.observeResize(this, cb, opts);
  }

  /** Programmatic attribute change that ALSO triggers reflection. */
  $set<T>(propName: string, value: T): void {
    const def = this.#findDefForProp(propName);
    if (!def) {
      throw new Error(`[ui/core#${this.localName}] property "${propName}" is not declared in static properties`);
    }
    if (def.readonly) {
      throw new Error(`[ui/core#${this.localName}] property "${propName}" is readonly`);
    }
    (this as unknown as Record<string, unknown>)[propName] = value;
    if (def.reflect) {
      reflect(this, def as unknown as PropertyDef<unknown>, value as unknown);
    }
  }

  // ───── internals ─────

  #findDefForAttr(attrName: string): PropertyDef<unknown> | undefined {
    const properties = (this.constructor as { properties?: PropertyDefMap }).properties;
    if (!properties) return undefined;
    for (const key of Object.keys(properties)) {
      const def = properties[key]!;
      const expected = def.attr ?? kebab(key);
      if (expected === attrName) {
        return def as PropertyDef<unknown>;
      }
    }
    return undefined;
  }

  #findDefForProp(propName: string): PropertyDef<unknown> | undefined {
    const properties = (this.constructor as { properties?: PropertyDefMap }).properties;
    if (!properties) return undefined;
    const def = properties[propName];
    return def ? (def as PropertyDef<unknown>) : undefined;
  }

  /**
   * Walk every reflected property and call `applyDefaults` again. Useful
   * for subclasses that dynamically add properties at runtime (uncommon but
   * supported).
   */
  protected reapplyDefaults(): void {
    const properties = (this.constructor as { properties?: PropertyDefMap }).properties;
    applyDefaults(this as unknown as HTMLElement & Record<string, unknown>, properties);
  }

  /**
   * Read the camelCase property name for an attribute. Convenience for
   * subclass code that wants to react to attribute changes by JS name.
   */
  protected propNameFor(attrName: string): string | undefined {
    const def = this.#findDefForAttr(attrName);
    return def?.name ?? camel(attrName);
  }

  /** Build a parser bound to this element's ownerDocument. */
  protected parserFor(propName: string): ((raw: string | null) => unknown) | undefined {
    const def = this.#findDefForProp(propName);
    if (!def) return undefined;
    return (raw) => coerce(def, raw);
  }

  // Silence "unused" warnings for utilities exported via the getParser re-export.
  // These are referenced indirectly through coerce(); keep them for clarity.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected _getParser = getParser;
}

// Inject a `defined` static so subclasses can introspect their own registration.
// The `customElements.define` wrapper lives in ./define.ts.
declare global {
  interface Window {}
}
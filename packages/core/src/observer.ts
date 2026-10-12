/**
 * ObserverManager — shares IntersectionObserver / ResizeObserver instances
 * across components when their configs match. See CORE_ARCHITECTURE.md §9.
 *
 * Why share:
 *   - Multiple <ui-animate threshold="0.2"> on a page = ONE IntersectionObserver.
 *   - On long pages with hundreds of reveals, the difference between N=100
 *     observers and N=1 is the difference between a smooth scroll and a stutter.
 *
 * Lifetime:
 *   - One manager per `document` (lazy). Components call `observersFor(doc)`
 *     (handled internally by BaseElement) to get the right instance.
 *   - Each manager holds a map of "groups". A group is one underlying
 *     IntersectionObserver (or ResizeObserver) plus the per-element callbacks.
 *   - When the last subscriber on a group leaves, the group is torn down
 *     and the underlying observer is disconnected.
 *
 * Testing:
 *   - `setObserverConstructors({ io, ro })` lets tests inject fakes.
 *     Defaults use the global `IntersectionObserver` / `ResizeObserver`.
 */

import type { Disposer } from './types.js';

/* ---------- Configuration injection ---------- */

let IO_CTOR: typeof IntersectionObserver | undefined;
let RO_CTOR: typeof ResizeObserver | undefined;

/** Replace the underlying observer constructors. Tests only — never call this in production. */
export function setObserverConstructors(opts: {
  io?: typeof IntersectionObserver;
  ro?: typeof ResizeObserver;
}): void {
  if (opts.io !== undefined) IO_CTOR = opts.io;
  if (opts.ro !== undefined) RO_CTOR = opts.ro;
}

function IntersectionObserverCtor(): typeof IntersectionObserver {
  if (IO_CTOR) return IO_CTOR;
  const ctor = (globalThis as { IntersectionObserver?: typeof IntersectionObserver })
    .IntersectionObserver;
  if (!ctor) {
    throw new Error(
      '[ui/core#observer] IntersectionObserver is not available in this environment',
    );
  }
  return ctor;
}

function ResizeObserverCtor(): typeof ResizeObserver {
  if (RO_CTOR) return RO_CTOR;
  const ctor = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
  if (!ctor) {
    throw new Error(
      '[ui/core#observer] ResizeObserver is not available in this environment',
    );
  }
  return ctor;
}

/* ---------- Public observe options ---------- */

export interface IntersectionObserveOptions {
  /** Margin around the root used to compute intersections. */
  rootMargin?: string;
  /**
   * Threshold(s) at which the observer fires.
   * Pass an array for fine-grained control; the manager passes it through to IO.
   */
  threshold?: number | number[];
  /**
   * Optional scrollable ancestor. Defaults to the viewport. We re-create the
   * underlying observer if the root changes.
   */
  root?: Element | Document | null;
  /** Fire only on enter (intersection ratio goes 0 → >0). Default false. */
  enter?: boolean;
  /** Fire only on leave (intersection ratio goes >0 → 0). Default false. */
  leave?: boolean;
  /** Disconnect after the first `enter` event. Default false. */
  once?: boolean;
}

export interface ResizeObserveOptions {
  /** Box model observed. Defaults to `content-box`. */
  box?: ResizeObserverBoxOptions;
}

/* ---------- Manager ---------- */

const managers = new WeakMap<object, ObserverManager>();

/** Get (or lazily create) the manager for a given document. */
export function getObserverManager(doc: Document | ShadowRoot): ObserverManager {
  let m = managers.get(doc);
  if (!m) {
    m = new ObserverManager();
    managers.set(doc, m);
  }
  return m;
}

/* ---------- Intersection group ---------- */

type IOCallback = (entry: IntersectionObserverEntry) => void;

interface IOSubscriber {
  cb: IOCallback;
  once: boolean;
  done: boolean;
  lastWasIntersecting: boolean;
}

function rootMarginKey(o: IntersectionObserveOptions): string {
  return `${o.rootMargin ?? ''}|${JSON.stringify(o.threshold ?? 0)}|${o.enter ? 1 : 0}|${
    o.leave ? 1 : 0
  }`;
}

class IntersectionGroup {
  readonly observer: IntersectionObserver;
  readonly subs = new Map<Element, IOSubscriber>();
  readonly opts: IntersectionObserveOptions;

  constructor(opts: IntersectionObserveOptions) {
    this.opts = opts;
    const IO = IntersectionObserverCtor();
    const init: IntersectionObserverInit = { root: opts.root ?? null };
    if (opts.rootMargin !== undefined) init.rootMargin = opts.rootMargin;
    if (opts.threshold !== undefined) init.threshold = opts.threshold;
    this.observer = new IO(
      (entries) => this.#onEntries(entries),
      init,
    );
  }

  #onEntries(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      const sub = this.subs.get(entry.target);
      if (!sub || sub.done) continue;

      const isIntersecting = entry.isIntersecting;
      const wasIntersecting = sub.lastWasIntersecting;

      if (this.opts.enter && isIntersecting && !wasIntersecting) {
        sub.cb(entry);
        if (sub.once) {
          sub.done = true;
          this.subs.delete(entry.target);
          this.observer.unobserve(entry.target);
        }
      } else if (this.opts.leave && !isIntersecting && wasIntersecting) {
        sub.cb(entry);
      } else if (!this.opts.enter && !this.opts.leave) {
        sub.cb(entry);
      }

      sub.lastWasIntersecting = isIntersecting;
    }
  }

  add(el: Element, cb: IOCallback, once: boolean): Disposer {
    let sub = this.subs.get(el);
    if (sub) {
      // Replace the callback but keep state.
      sub.cb = cb;
      sub.once = sub.once || once;
      return () => this.remove(el);
    }
    sub = {
      cb,
      once,
      done: false,
      lastWasIntersecting: false,
    };
    this.subs.set(el, sub);
    this.observer.observe(el);
    return () => this.remove(el);
  }

  remove(el: Element): void {
    if (!this.subs.delete(el)) return;
    this.observer.unobserve(el);
  }

  disconnect(): void {
    this.observer.disconnect();
    this.subs.clear();
  }
}

/* ---------- Resize group ---------- */

type ROCallback = (entry: ResizeObserverEntry) => void;

interface ROSubscriber {
  cb: ROCallback;
}

function resizeKey(o: ResizeObserveOptions): string {
  return `${o.box ?? 'content-box'}`;
}

class ResizeGroup {
  readonly observer: ResizeObserver;
  readonly subs = new Map<Element, ROCallback>();
  readonly opts: ResizeObserveOptions;

  constructor(opts: ResizeObserveOptions) {
    this.opts = opts;
    const RO = ResizeObserverCtor();
    this.observer = new RO((entries) => {
      for (const entry of entries) {
        const cb = this.subs.get(entry.target);
        if (cb) cb(entry);
      }
    });
  }

  add(el: Element, cb: ROCallback): Disposer {
    if (this.subs.has(el)) {
      this.subs.set(el, cb);
      return () => this.remove(el);
    }
    this.subs.set(el, cb);
    this.observer.observe(el, this.opts);
    return () => this.remove(el);
  }

  remove(el: Element): void {
    if (!this.subs.delete(el)) return;
    this.observer.unobserve(el);
  }

  disconnect(): void {
    this.observer.disconnect();
    this.subs.clear();
  }
}

/* ---------- Manager ---------- */

export class ObserverManager {
  readonly #ioGroups = new Map<string, IntersectionGroup>();
  readonly #roGroups = new Map<string, ResizeGroup>();

  /**
   * Observe an element's intersection with the viewport (or a scrollable
   * ancestor). Returns a Disposer that unobserves and tears down the group
   * if it was the last subscriber.
   */
  observeIntersection(
    el: Element,
    cb: IOCallback,
    opts: IntersectionObserveOptions = {},
  ): Disposer {
    const key = rootMarginKey(opts);
    let group = this.#ioGroups.get(key);
    if (!group) {
      group = new IntersectionGroup(opts);
      this.#ioGroups.set(key, group);
    }
    const once = opts.once === true;
    const disposer = group.add(el, cb, once);
    return () => {
      disposer();
      if (group && group.subs.size === 0) {
        group.disconnect();
        this.#ioGroups.delete(key);
      }
    };
  }

  /**
   * Observe an element's size. Returns a Disposer that unobserves and tears
   * down the group if it was the last subscriber.
   */
  observeResize(
    el: Element,
    cb: ROCallback,
    opts: ResizeObserveOptions = {},
  ): Disposer {
    const key = resizeKey(opts);
    let group = this.#roGroups.get(key);
    if (!group) {
      group = new ResizeGroup(opts);
      this.#roGroups.set(key, group);
    }
    const disposer = group.add(el, cb);
    return () => {
      disposer();
      if (group && group.subs.size === 0) {
        group.disconnect();
        this.#roGroups.delete(key);
      }
    };
  }

  /** Tear down every observer. Called automatically when the document is torn down. */
  disconnectAll(): void {
    for (const g of this.#ioGroups.values()) g.disconnect();
    for (const g of this.#roGroups.values()) g.disconnect();
    this.#ioGroups.clear();
    this.#roGroups.clear();
  }
}

/** Drop the cached ObserverManager for a given document. Tests only. */
export function _resetObserverManagerForTests(doc: Document | ShadowRoot): void {
  managers.delete(doc);
}
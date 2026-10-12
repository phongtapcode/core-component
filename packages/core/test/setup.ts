/**
 * Vitest setup. Wires a mock IntersectionObserver / ResizeObserver into the
 * observer manager and makes the mock instances inspectable from tests via
 * `globalThis.__uiMocks`.
 */

import { setObserverConstructors } from '@ui/core';

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: ReadonlyArray<number> = [];
  private readonly cb: IntersectionObserverCallback;
  readonly observed = new Set<Element>();

  constructor(cb: IntersectionObserverCallback, init?: IntersectionObserverInit) {
    this.cb = cb;
    this.root = init?.root ?? null;
    this.rootMargin = init?.rootMargin ?? '0px';
    this.thresholds = init?.threshold === undefined
      ? [0]
      : Array.isArray(init.threshold)
      ? init.threshold
      : [init.threshold];
    instances.intersection.add(this);
  }

  observe(target: Element): void {
    this.observed.add(target);
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.observed.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  __fire(entries: Partial<IntersectionObserverEntry>[]): void {
    const full: IntersectionObserverEntry[] = entries.map((e) => ({
      isIntersecting: false,
      intersectionRatio: 0,
      target: null as unknown as Element,
      time: 0,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      ...e,
    })) as IntersectionObserverEntry[];
    this.cb(full, this);
  }
}

class MockResizeObserver implements ResizeObserver {
  private readonly cb: ResizeObserverCallback;
  readonly observed = new Map<Element, ResizeObserverOptions>();

  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
    instances.resize.add(this);
  }

  observe(target: Element, options?: ResizeObserverOptions): void {
    this.observed.set(target, options ?? {});
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.observed.clear();
  }

  __fire(entries: { target: Element }[]): void {
    const full = entries.map((e) => ({
      target: e.target,
      contentRect: {} as DOMRectReadOnly,
      borderBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      contentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      devicePixelContentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
    })) as ResizeObserverEntry[];
    this.cb(full, this);
  }
}

const instances = {
  intersection: new Set<MockIntersectionObserver>(),
  resize: new Set<MockResizeObserver>(),
};

// happy-dom swaps the global object between modules, so we export the set
// directly instead of stashing it on `globalThis`. Test files import from
// './setup.js' to read the live instances.
export const mocks = instances;

setObserverConstructors({
  io: MockIntersectionObserver as unknown as typeof IntersectionObserver,
  ro: MockResizeObserver as unknown as typeof ResizeObserver,
});
/**
 * Vitest setup for @ui/motion. Wires a mock IntersectionObserver into the
 * observer manager so Animate/Reveal can be unit-tested in happy-dom.
 *
 * Exports `instances` so test files can read the live mock list — happy-dom
 * swaps the global object between modules, so storing on `globalThis` is
 * unreliable. Import the set directly from this module.
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
    instances.add(this);
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

export const instances = new Set<MockIntersectionObserver>();

setObserverConstructors({
  io: MockIntersectionObserver as unknown as typeof IntersectionObserver,
});
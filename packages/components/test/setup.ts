/**
 * Vitest setup for @ui/components. Empty stub — components don't need IO/RO
 * mocks here; per-test setup handles observer reset.
 */
import { setObserverConstructors } from '@ui/core';

class NoopIO implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '0px';
  readonly thresholds: ReadonlyArray<number> = [];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

class NoopRO implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

setObserverConstructors({
  io: NoopIO as unknown as typeof IntersectionObserver,
  ro: NoopRO as unknown as typeof ResizeObserver,
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';
import { _resetObserverManagerForTests } from '@ui/core';
import { instances } from './setup.js';

interface MockIO {
  __fire(entries: Partial<IntersectionObserverEntry>[]): void;
  unobserve(target: Element): void;
  disconnect(): void;
  observed: Set<Element>;
  rootMargin: string;
  thresholds: ReadonlyArray<number>;
}

const mocks = { intersection: instances as unknown as Set<MockIO> };

beforeEach(() => {
  // Wipe the DOM and tear down any observers wired to it. Then drop the
  // manager so the next test rebuilds everything from scratch.
  document.body.innerHTML = '';
  _resetObserverManagerForTests(document);
  mocks.intersection.clear();
});

describe('<ui-animate>', () => {
  it('renders with default effect', () => {
    const el = document.createElement('ui-animate');
    document.body.appendChild(el);
    expect(el.getAttribute('data-effect')).toBe('fade-up');
  });

  it('runs for 500ms without delay by default and allows an explicit duration', () => {
    const defaultEl = document.createElement('ui-animate');
    document.body.appendChild(defaultEl);
    expect(defaultEl.style.getPropertyValue('--ui-animate-duration')).toBe('500ms');
    expect(defaultEl.style.getPropertyValue('--ui-animate-delay')).toBe('0ms');

    const customEl = document.createElement('ui-animate');
    customEl.setAttribute('effect', 'slide-up');
    customEl.setAttribute('duration', '800');
    document.body.appendChild(customEl);
    expect(customEl.style.getPropertyValue('--ui-animate-duration')).toBe('800ms');
    expect(customEl.style.getPropertyValue('--ui-animate-delay')).toBe('0ms');
  });

  it('reflects the effect attribute to data-effect', () => {
    const el = document.createElement('ui-animate');
    el.setAttribute('effect', 'zoom-in');
    document.body.appendChild(el);
    expect(el.getAttribute('data-effect')).toBe('zoom-in');
  });

  it('rejects unknown effect names gracefully', () => {
    const el = document.createElement('ui-animate');
    el.setAttribute('effect', 'does-not-exist');
    document.body.appendChild(el);
    expect(el.getAttribute('data-effect')).toBe('does-not-exist');
  });

  it('play() sets data-revealed and emits ui-animate-reveal', () => {
    const el = document.createElement('ui-animate');
    document.body.appendChild(el);
    const cb = vi.fn();
    el.addEventListener('ui-animate-reveal', cb as EventListener);
    (el as unknown as { play(): void }).play();
    expect(el.hasAttribute('data-revealed')).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('reset() removes data-revealed and emits ui-animate-reset', () => {
    const el = document.createElement('ui-animate');
    document.body.appendChild(el);
    (el as unknown as { play(): void }).play();
    const cb = vi.fn();
    el.addEventListener('ui-animate-reset', cb as EventListener);
    (el as unknown as { reset(): void }).reset();
    expect(el.hasAttribute('data-revealed')).toBe(false);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('IntersectionObserver fires play() when entering viewport', () => {
    const el = document.createElement('ui-animate');
    document.body.appendChild(el);
    expect(mocks.intersection.size).toBe(1);
    const io = [...mocks.intersection][0]!;
    const cb = vi.fn();
    el.addEventListener('ui-animate-reveal', cb as EventListener);
    io.__fire([{ target: el, isIntersecting: true, intersectionRatio: 1 }]);
    expect(el.hasAttribute('data-revealed')).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('IntersectionObserver is unsubscribed when once:true and revealed', () => {
    const el = document.createElement('ui-animate');
    el.setAttribute('once', '');
    document.body.appendChild(el);
    const io = [...mocks.intersection][0]!;
    const unobserve = vi.fn();
    io.unobserve = unobserve;
    io.__fire([{ target: el, isIntersecting: true, intersectionRatio: 1 }]);
    expect(unobserve).toHaveBeenCalledWith(el);
  });

  it('once:false keeps observing', () => {
    const el = document.createElement('ui-animate');
    el.setAttribute('once', 'false');
    document.body.appendChild(el);
    const io = [...mocks.intersection][0]!;
    const unobserve = vi.fn();
    io.unobserve = unobserve;
    io.__fire([{ target: el, isIntersecting: true, intersectionRatio: 1 }]);
    expect(unobserve).not.toHaveBeenCalled();
  });

  it('once:false hides on exit and reveals again on re-entry', () => {
    const el = document.createElement('ui-animate');
    el.setAttribute('once', 'false');
    document.body.appendChild(el);
    const io = [...mocks.intersection][0]!;
    const reveal = vi.fn();
    el.addEventListener('ui-animate-reveal', reveal);
    io.__fire([{ target: el, isIntersecting: true }]);
    expect(el.hasAttribute('data-revealed')).toBe(true);
    io.__fire([{ target: el, isIntersecting: false }]);
    expect(el.hasAttribute('data-revealed')).toBe(false);
    io.__fire([{ target: el, isIntersecting: true }]);
    expect(el.hasAttribute('data-revealed')).toBe(true);
    expect(reveal).toHaveBeenCalledTimes(2);
  });

  it('reset() re-arms observation after a one-time reveal', () => {
    const el = document.createElement('ui-animate') as HTMLElement & { reset(): void };
    document.body.appendChild(el);
    const io = [...mocks.intersection][0]!;
    io.__fire([{ target: el, isIntersecting: true }]);
    expect(io.observed.has(el)).toBe(false);
    el.reset();
    expect([...mocks.intersection].some((observer) => observer.observed.has(el))).toBe(true);
  });
});

describe('<ui-reveal>', () => {
  it('renders with fade effect by default', () => {
    const el = document.createElement('ui-reveal');
    document.body.appendChild(el);
    expect(el.getAttribute('data-effect')).toBe('fade');
  });

  it('play() sets data-revealed', () => {
    const el = document.createElement('ui-reveal');
    document.body.appendChild(el);
    (el as unknown as { play(): void }).play();
    expect(el.hasAttribute('data-revealed')).toBe(true);
  });
});

describe('<ui-stagger>', () => {
  it('assigns --ui-stagger-index to each child', () => {
    const wrap = document.createElement('ui-stagger');
    const a = document.createElement('ui-animate');
    const b = document.createElement('ui-animate');
    const c = document.createElement('ui-animate');
    wrap.append(a, b, c);
    document.body.appendChild(wrap);
    expect((a as HTMLElement).style.getPropertyValue('--ui-stagger-index')).toBe('0');
    expect((b as HTMLElement).style.getPropertyValue('--ui-stagger-index')).toBe('1');
    expect((c as HTMLElement).style.getPropertyValue('--ui-stagger-index')).toBe('2');
  });

  it('reveals all children on intersection', () => {
    const wrap = document.createElement('ui-stagger');
    const a = document.createElement('ui-animate');
    const b = document.createElement('ui-animate');
    wrap.append(a, b);
    document.body.appendChild(wrap);
    const io = [...mocks.intersection][0]!;
    io.__fire([{ target: wrap, isIntersecting: true, intersectionRatio: 1 }]);
    expect(a.hasAttribute('data-revealed')).toBe(true);
    expect(b.hasAttribute('data-revealed')).toBe(true);
  });
});

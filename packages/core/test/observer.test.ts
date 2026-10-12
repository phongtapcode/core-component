import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObserverManager, getObserverManager } from '@ui/core';
import type { Disposer } from '@ui/core';
import { mocks } from './setup.js';

/**
 * The test setup installs mock IO/RO via setObserverConstructors and exposes
 * the live instances through `mocks`. We use them to simulate viewport
 * intersections.
 */

interface MockIO extends IntersectionObserver {
  __fire(entries: Partial<IntersectionObserverEntry>[]): void;
}
interface MockRO extends ResizeObserver {
  __fire(entries: { target: Element }[]): void;
}

beforeEach(() => {
  // Each test starts with fresh mock instances.
  mocks.intersection.clear();
  mocks.resize.clear();
});

describe('ObserverManager — intersection', () => {
  it('shares an observer across components with matching config', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    const b = document.createElement('div');
    doc.body.append(a, b);
    const opts = { rootMargin: '0px', threshold: 0.2 };
    mgr.observeIntersection(a, () => {}, opts);
    expect(mocks.intersection.size).toBe(1);
    mgr.observeIntersection(b, () => {}, opts);
    // Same config → same underlying IO.
    expect(mocks.intersection.size).toBe(1);
  });

  it('creates a new IO when rootMargin differs', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    const b = document.createElement('div');
    doc.body.append(a, b);
    mgr.observeIntersection(a, () => {}, { rootMargin: '0px' });
    mgr.observeIntersection(b, () => {}, { rootMargin: '10px' });
    expect(mocks.intersection.size).toBe(2);
  });

  it('disconnects the underlying observer when last subscriber leaves', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    doc.body.append(a);
    const opts = { rootMargin: '0px' };
    const off: Disposer = mgr.observeIntersection(a, () => {}, opts);
    expect(mocks.intersection.size).toBe(1);
    const io = [...mocks.intersection][0]!;
    const disconnect = vi.spyOn(io, 'disconnect');
    off();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('enter mode: only fires when ratio goes from 0 to >0', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    doc.body.append(a);
    const cb = vi.fn();
    mgr.observeIntersection(a, cb, { enter: true });
    const io = [...mocks.intersection][0]!;
    io.__fire([{ target: a, isIntersecting: true, intersectionRatio: 1 }]);
    io.__fire([{ target: a, isIntersecting: true, intersectionRatio: 1 }]);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('leave mode: only fires when ratio goes from >0 to 0', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    doc.body.append(a);
    const cb = vi.fn();
    mgr.observeIntersection(a, cb, { leave: true });
    const io = [...mocks.intersection][0]!;
    io.__fire([{ target: a, isIntersecting: false, intersectionRatio: 0 }]);
    expect(cb).not.toHaveBeenCalled();
    io.__fire([{ target: a, isIntersecting: true, intersectionRatio: 1 }]);
    io.__fire([{ target: a, isIntersecting: false, intersectionRatio: 0 }]);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('once mode: auto-unobserves after first enter', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    doc.body.append(a);
    const cb = vi.fn();
    mgr.observeIntersection(a, cb, { enter: true, once: true });
    const io = [...mocks.intersection][0]!;
    const unobserve = vi.spyOn(io, 'unobserve');
    io.__fire([{ target: a, isIntersecting: true, intersectionRatio: 1 }]);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(unobserve).toHaveBeenCalledWith(a);
  });
});

describe('ObserverManager — resize', () => {
  it('shares a ResizeObserver when box matches', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    const b = document.createElement('div');
    doc.body.append(a, b);
    mgr.observeResize(a, () => {}, { box: 'content-box' });
    mgr.observeResize(b, () => {}, { box: 'content-box' });
    expect(mocks.resize.size).toBe(1);
  });

  it('forwards fire events to the right subscriber', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    const b = document.createElement('div');
    doc.body.append(a, b);
    const cbA = vi.fn();
    const cbB = vi.fn();
    mgr.observeResize(a, cbA);
    mgr.observeResize(b, cbB);
    const ro = [...mocks.resize][0]!;
    ro.__fire([{ target: a }]);
    expect(cbA).toHaveBeenCalledTimes(1);
    expect(cbB).not.toHaveBeenCalled();
  });

  it('disconnects the underlying observer when the last subscriber leaves', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = getObserverManager(doc);
    const a = document.createElement('div');
    doc.body.append(a);
    const off = mgr.observeResize(a, () => {});
    const ro = [...mocks.resize][0]!;
    const disconnect = vi.spyOn(ro, 'disconnect');
    off();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('ObserverManager.disconnectAll', () => {
  it('tears down every group', () => {
    const doc = document.implementation.createHTMLDocument('test');
    const mgr = new ObserverManager();
    const a = document.createElement('div');
    doc.body.append(a);
    mgr.observeIntersection(a, () => {}, {});
    mgr.observeResize(a, () => {});
    expect(mocks.intersection.size).toBeGreaterThanOrEqual(1);
    expect(mocks.resize.size).toBeGreaterThanOrEqual(1);
    // Spy on disconnect on every captured instance to confirm.
    const allIO = [...mocks.intersection];
    const allRO = [...mocks.resize];
    const disconnectsIO = allIO.map((io) => vi.spyOn(io, 'disconnect'));
    const disconnectsRO = allRO.map((ro) => vi.spyOn(ro, 'disconnect'));
    mgr.disconnectAll();
    for (const d of disconnectsIO) expect(d).toHaveBeenCalled();
    for (const d of disconnectsRO) expect(d).toHaveBeenCalled();
  });
});
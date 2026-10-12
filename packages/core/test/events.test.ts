import { describe, expect, it, vi } from 'vitest';
import { CleanupRegistry, emit, on, once } from '@ui/core';

describe('on()', () => {
  it('attaches a listener and registers removal with the registry', () => {
    const r = new CleanupRegistry();
    const t = new EventTarget();
    const cb = vi.fn();
    on(t, 'foo', cb, {}, r);
    t.dispatchEvent(new Event('foo'));
    expect(cb).toHaveBeenCalledTimes(1);
    r.run();
    t.dispatchEvent(new Event('foo'));
    expect(cb).toHaveBeenCalledTimes(1); // not called again
  });

  it('returns a manual disposer', () => {
    const r = new CleanupRegistry();
    const t = new EventTarget();
    const cb = vi.fn();
    const off = on(t, 'foo', cb, {}, r);
    t.dispatchEvent(new Event('foo'));
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    t.dispatchEvent(new Event('foo'));
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('once()', () => {
  it('fires at most once', () => {
    const r = new CleanupRegistry();
    const t = new EventTarget();
    const cb = vi.fn();
    once(t, 'foo', cb, {}, r);
    t.dispatchEvent(new Event('foo'));
    t.dispatchEvent(new Event('foo'));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('returns a manual cancel disposer', () => {
    const r = new CleanupRegistry();
    const t = new EventTarget();
    const cb = vi.fn();
    const off = once(t, 'foo', cb, {}, r);
    off();
    t.dispatchEvent(new Event('foo'));
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('emit()', () => {
  it('dispatches a CustomEvent that bubbles and is composed', () => {
    const el = document.createElement('div');
    const cb = vi.fn();
    el.addEventListener('ui-test', cb);
    emit(el, 'ui-test', { hello: 1 });
    const ev = cb.mock.calls[0]?.[0] as CustomEvent<{ hello: number }>;
    expect(ev).toBeInstanceOf(CustomEvent);
    expect(ev.detail?.hello).toBe(1);
    expect(ev.bubbles).toBe(true);
    expect(ev.composed).toBe(true);
  });

  it('respects explicit bubbles:false override', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    const cb = vi.fn();
    parent.addEventListener('ui-test', cb);
    emit(child, 'ui-test', undefined, { bubbles: false });
    expect(cb).not.toHaveBeenCalled();
  });
});
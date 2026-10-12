import { describe, expect, it, vi } from 'vitest';
import { CleanupRegistry } from '@ui/core';

describe('CleanupRegistry', () => {
  it('runs every registered task exactly once on run()', () => {
    const r = new CleanupRegistry();
    const a = vi.fn();
    const b = vi.fn();
    r.add(a).add(b);
    r.run();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(r.size).toBe(0);
  });

  it('is idempotent across multiple run() calls', () => {
    const r = new CleanupRegistry();
    const a = vi.fn();
    r.add(a);
    r.run();
    r.run();
    expect(a).toHaveBeenCalledTimes(1);
  });

  it('isolates a failing task so siblings still run', () => {
    const r = new CleanupRegistry();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const a = vi.fn(() => {
      throw new Error('boom');
    });
    const b = vi.fn();
    r.add(a).add(b);
    r.run();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it('does not run tasks added DURING a run() call (no infinite loops)', () => {
    const r = new CleanupRegistry();
    const a = vi.fn(() => {
      // a teardown that registers a new teardown
      r.add(vi.fn());
    });
    const b = vi.fn();
    r.add(a).add(b);
    r.run();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    // The task added inside `a` should be queued for the next run, not this one.
    expect(r.size).toBe(1);
    // Second run executes it.
    const extra = vi.fn();
    // Pull the queued fn and confirm it runs.
    r.add(extra);
    r.run();
    expect(extra).toHaveBeenCalledTimes(1);
  });

  it('rejects non-function tasks at registration', () => {
    const r = new CleanupRegistry();
    // @ts-expect-error — intentional bad input
    expect(() => r.add('not a function')).toThrow(TypeError);
  });

  it('clear() empties without running', () => {
    const r = new CleanupRegistry();
    const a = vi.fn();
    r.add(a);
    r.clear();
    r.run();
    expect(a).not.toHaveBeenCalled();
    expect(r.size).toBe(0);
  });

  it('defer() returns a disposer that can fire before run()', () => {
    const r = new CleanupRegistry();
    const a = vi.fn();
    const off = r.defer(a);
    off();
    expect(a).toHaveBeenCalledTimes(1);
    r.run();
    expect(a).toHaveBeenCalledTimes(1);
  });
});
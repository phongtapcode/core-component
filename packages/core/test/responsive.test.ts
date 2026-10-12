import { describe, expect, it, vi } from 'vitest';
import { CleanupRegistry, getBreakpointState } from '@ui/core';
import { currentBreakpoint, onBreakpointChange } from '@ui/core';

interface Mql {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function buildTarget(state: { sm: boolean; md: boolean; lg: boolean; xl: boolean }): {
  matchMedia: (q: string) => Mql;
  addEventListener: () => void;
  removeEventListener: () => void;
} {
  return {
    matchMedia: (q: string): Mql => {
      let matches = false;
      if (q.includes('1280')) matches = state.xl;
      else if (q.includes('1024')) matches = state.lg;
      else if (q.includes('768')) matches = state.md;
      else if (q.includes('640')) matches = state.sm;
      return {
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

describe('responsive utilities', () => {
  it('getBreakpointState maps matchMedia output', () => {
    const target = buildTarget({ sm: true, md: false, lg: false, xl: false });
    const state = getBreakpointState(target as unknown as { matchMedia: (q: string) => MediaQueryList });
    expect(state.sm).toBe(true);
    expect(state.md).toBe(false);
    expect(state.lg).toBe(false);
    expect(state.xl).toBe(false);
  });

  it('currentBreakpoint returns the largest matching named breakpoint', () => {
    const t1 = buildTarget({ sm: true, md: false, lg: false, xl: false });
    expect(currentBreakpoint(t1 as unknown as { matchMedia: (q: string) => MediaQueryList })).toBe('sm');
    const t2 = buildTarget({ sm: true, md: true, lg: false, xl: false });
    expect(currentBreakpoint(t2 as unknown as { matchMedia: (q: string) => MediaQueryList })).toBe('md');
    const t3 = buildTarget({ sm: true, md: true, lg: true, xl: true });
    expect(currentBreakpoint(t3 as unknown as { matchMedia: (q: string) => MediaQueryList })).toBe('xl');
    const t4 = buildTarget({ sm: false, md: false, lg: false, xl: false });
    expect(currentBreakpoint(t4 as unknown as { matchMedia: (q: string) => MediaQueryList })).toBeNull();
  });

  it('onBreakpointChange fires immediately and registers listeners', () => {
    const target = buildTarget({ sm: true, md: false, lg: false, xl: false });
    const r = new CleanupRegistry();
    const cb = vi.fn();
    onBreakpointChange(cb, r, target as unknown as Window);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenLastCalledWith({ sm: true, md: false, lg: false, xl: false });
  });
});
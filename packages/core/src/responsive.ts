/**
 * Breakpoint / responsive utilities. Wraps `matchMedia` and routes every
 * listener through a CleanupRegistry so component teardown is automatic.
 *
 * The breakpoint values come from @ui/tokens — do not duplicate them here.
 */

import { breakpointQueries, breakpoints, type Breakpoint } from '@ui/tokens';
import type { CleanupRegistry, Disposer } from './index.js';

/** Snapshot of which named breakpoints are currently matching. */
export interface BreakpointState {
  readonly sm: boolean;
  readonly md: boolean;
  readonly lg: boolean;
  readonly xl: boolean;
}

function buildState(mql: {
  sm: MediaQueryList;
  md: MediaQueryList;
  lg: MediaQueryList;
  xl: MediaQueryList;
}): BreakpointState {
  return {
    sm: mql.sm.matches,
    md: mql.md.matches,
    lg: mql.lg.matches,
    xl: mql.xl.matches,
  };
}

/** Compute a stable BreakpointState from the given window-like target. */
export function getBreakpointState(target: {
  matchMedia: (q: string) => MediaQueryList;
} = globalThis as unknown as Window): BreakpointState {
  return buildState({
    sm: target.matchMedia(breakpointQueries.sm),
    md: target.matchMedia(breakpointQueries.md),
    lg: target.matchMedia(breakpointQueries.lg),
    xl: target.matchMedia(breakpointQueries.xl),
  });
}

/** Subscribe to breakpoint changes. Cleanup happens automatically. */
export function onBreakpointChange(
  cb: (state: BreakpointState) => void,
  registry: CleanupRegistry,
  target: {
    matchMedia: (q: string) => MediaQueryList;
    addEventListener: (...a: never[]) => void;
    removeEventListener: (...a: never[]) => void;
  } = globalThis as unknown as Window,
): Disposer {
  const mql = {
    sm: target.matchMedia(breakpointQueries.sm),
    md: target.matchMedia(breakpointQueries.md),
    lg: target.matchMedia(breakpointQueries.lg),
    xl: target.matchMedia(breakpointQueries.xl),
  };
  const listener = (): void => cb(buildState(mql));
  for (const k of ['sm', 'md', 'lg', 'xl'] as const) {
    mql[k].addEventListener('change', listener);
  }
  registry.add(() => {
    for (const k of ['sm', 'md', 'lg', 'xl'] as const) {
      mql[k].removeEventListener('change', listener);
    }
  });
  // Fire once with the current state so callers don't need a separate read.
  cb(buildState(mql));
  return () => {
    for (const k of ['sm', 'md', 'lg', 'xl'] as const) {
      mql[k].removeEventListener('change', listener);
    }
  };
}

/** Return the smallest named breakpoint that matches, or null if none. */
export function currentBreakpoint(
  target: {
    matchMedia: (q: string) => MediaQueryList;
  } = globalThis as unknown as Window,
): Breakpoint | null {
  const state = getBreakpointState(target);
  // Walk from xl down so the largest matching one is reported.
  const order: readonly (keyof BreakpointState)[] = ['xl', 'lg', 'md', 'sm'];
  for (const k of order) {
    if (state[k]) return k;
  }
  return null;
}

/** Pixel values, mirrored from @ui/tokens for cases where the consumer wants a number. */
export { breakpoints };
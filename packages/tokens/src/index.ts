/**
 * @ui/tokens — JS-side constants mirrored from css/tokens.css.
 *
 * Why both: CSS variables give consumers runtime rethemeability, but JS code
 * needs concrete values (for IntersectionObserver rootMargin, RAF math,
 * breakpoint comparisons). This file is the *source of truth* for JS;
 * css/tokens.css mirrors it for the cascade. If you change one, change the
 * other.
 *
 * Keep this file dependency-free.
 */

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const breakpointQueries = {
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
} as const;

export const zIndex = {
  hide: -1,
  base: 1,
  sticky: 100,
  overlay: 1000,
  modal: 1100,
  toast: 1200,
  tooltip: 1300,
} as const;

export const motion = {
  duration: {
    instant: 80,
    fast: 150,
    base: 300,
    slow: 600,
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  },
  distance: {
    short: 8,
    base: 16,
    long: 32,
  },
} as const;

export {
  easings,
  easingNames,
  resolveEasing,
  toCssEasing,
  type CubicBezier,
} from './easings.js';
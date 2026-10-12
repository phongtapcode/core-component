/**
 * Parsed cubic-bezier control points for use with Web Animations API and CSS.
 * The CSS string equivalents are in css/tokens.css and in `motion`.
 */

export type CubicBezier = readonly [number, number, number, number];

export const easings: Readonly<Record<string, CubicBezier>> = {
  // Core UI tokens
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0, 1],
  accelerate: [0.3, 0, 1, 1],
  emphasized: [0.2, 0, 0, 1],
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],

  // Quad
  easeInQuad: [0.11, 0, 0.5, 0],
  easeOutQuad: [0.25, 0.46, 0.45, 0.94],
  easeInOutQuad: [0.45, 0, 0.55, 1],

  // Cubic
  easeInCubic: [0.32, 0, 0.67, 0],
  easeOutCubic: [0.33, 1, 0.68, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],

  // Quart
  easeInQuart: [0.5, 0, 0.75, 0],
  easeOutQuart: [0.25, 1, 0.5, 1],
  easeInOutQuart: [0.76, 0, 0.24, 1],

  // Quint
  easeInQuint: [0.64, 0, 0.78, 0],
  easeOutQuint: [0.22, 1, 0.36, 1],
  easeInOutQuint: [0.83, 0, 0.17, 1],

  // Back
  easeInBack: [0.36, 0, 0.66, -0.56],
  easeOutBack: [0.34, 1.56, 0.64, 1],
  easeInOutBack: [0.68, -0.6, 0.32, 1.6],

  // Bounce
  easeInBounce: [0.6, -0.28, 0.735, 0.045],
  easeOutBounce: [0.34, 1.56, 0.64, 1],

  // Elastic & Spring
  easeInElastic: [0.7, -0.4, 0.4, 1.4],
  easeOutElastic: [0.25, 1.4, 0.4, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  spring: [0.175, 0.885, 0.32, 1.275],
  decay: [0.2, 0.8, 0.2, 1],
} as const;

export const easingNames = Object.keys(easings) as readonly (keyof typeof easings)[];

/** Resolve a CSS easing string OR a key into a numeric `ControlPoint` pair. */
export function resolveEasing(input: string | keyof typeof easings): CubicBezier {
  if (input in easings) return easings[input]!;
  const match = /^cubic-bezier\(([\d.\-,\s]+)\)$/.exec(input);
  if (!match || !match[1]) {
    // Fallback to easeOutQuad if unknown named easing
    if (input && easings['easeOutQuad']) return easings['easeOutQuad'];
    throw new Error(`[ui/tokens] invalid easing "${input}"`);
  }
  const parts = match[1].split(',').map((s) => Number(s.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`[ui/tokens] invalid cubic-bezier "${input}"`);
  }
  return parts as unknown as CubicBezier;
}

/** Get CSS cubic-bezier string representation for an easing name. */
export function toCssEasing(name: string): string {
  if (name.startsWith('cubic-bezier(') || name === 'linear' || name === 'ease') {
    return name;
  }
  const pts = resolveEasing(name);
  return `cubic-bezier(${pts[0]}, ${pts[1]}, ${pts[2]}, ${pts[3]})`;
}
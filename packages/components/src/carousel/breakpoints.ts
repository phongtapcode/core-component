/**
 * Breakpoints and responsive configuration manager.
 * Safely parses structured JSON without eval() and supports container width + column-width mode.
 */

import type { BreakpointConfig, BreakpointsMap } from './types.js';

export function parseBreakpoints(raw: string | undefined): BreakpointsMap {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return {};
  try {
    // Accept both strict JSON and the object-literal notation used in HTML examples.
    // This is a text normalization only; user input is never executed.
    const normalized = raw
      .replace(/([{,]\s*)(\d+|[A-Za-z][\w-]*)\s*:/g, '$1"$2":')
      .replace(/'([^']*)'/g, (_, value: string) => JSON.stringify(value))
      .replace(/,\s*([}\]])/g, '$1');
    const parsed = JSON.parse(normalized);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const clean: BreakpointsMap = {};
    for (const [key, val] of Object.entries(parsed)) {
      const width = Number(key);
      if (!Number.isFinite(width) || width <= 0) continue;
      if (!val || typeof val !== 'object') continue;

      const v = val as Record<string, unknown>;
      const config: BreakpointConfig = {};

      const pv = v['perView'] ?? v['per-view'];
      if (typeof pv === 'number' && pv > 0) config.perView = Math.round(pv);

      const pm = v['perMove'] ?? v['per-move'];
      if (typeof pm === 'number' && pm > 0) config.perMove = Math.round(pm);

      const gap = v['gap'];
      if (typeof gap === 'number' && gap >= 0) config.gap = gap;

      const ov = v['overflow'];
      if (ov === 'visible' || ov === 'hidden') config.overflow = ov;

      const vert = v['vertical'];
      if (typeof vert === 'boolean') config.vertical = vert;

      clean[String(width)] = config;
    }
    return clean;
  } catch {
    // Malformed JSON — fail gracefully without crashing
    return {};
  }
}

/**
 * Resolve effective perView, perMove, gap, overflow based on container width & breakpoints.
 */
export function resolveResponsiveConfig(
  width: number,
  base: {
    perView: number;
    perMove: number;
    gap: number;
    overflow: 'visible' | 'hidden';
    vertical: boolean;
    columnWidth: number;
  },
  breakpoints: BreakpointsMap,
): {
  perView: number;
  perMove: number;
  gap: number;
  overflow: 'visible' | 'hidden';
  vertical: boolean;
} {
  // 1. Column-width mode: availableWidth / desiredColumnWidth
  let perView = base.perView;
  if (base.columnWidth > 0 && width > 0) {
    perView = Math.max(1, Math.floor((width + base.gap) / (base.columnWidth + base.gap)));
  }

  let perMove = base.perMove;
  let gap = base.gap;
  let overflow = base.overflow;
  let vertical = base.vertical;

  // 2. Breakpoints: sorted ascending (e.g. mobile-first max-width or min-width)
  const sortedBps = Object.keys(breakpoints)
    .map(Number)
    .sort((a, b) => a - b);

  for (const bp of sortedBps) {
    if (width <= bp) {
      const match = breakpoints[String(bp)];
      if (match) {
        if (match.perView !== undefined) perView = match.perView;
        if (match.perMove !== undefined) perMove = match.perMove;
        if (match.gap !== undefined) gap = match.gap;
        if (match.overflow !== undefined) overflow = match.overflow;
        if (match.vertical !== undefined) vertical = match.vertical;
      }
      break;
    }
  }

  return { perView: Math.max(1, perView), perMove: Math.max(1, perMove), gap, overflow, vertical };
}

export type ParallaxValue = number | string;
export type ParallaxFrame = Record<string, ParallaxValue>;
export type ParallaxKeyframes = Record<string, ParallaxFrame>;
export type ParallaxBreakpoints = Record<string, ParallaxKeyframes>;

/** Accept JSON and the object notation used in HTML attributes, without executing code. */
function parseObject(raw: string): Record<string, unknown> | null {
  try {
    const normalized = raw
      .replace(/([{,]\s*)([A-Za-z_$][\w$-]*|\d+(?:\.\d+)?)\s*:/g, '$1"$2":')
      .replace(/'([^']*)'/g, (_, value: string) => JSON.stringify(value))
      .replace(/,\s*([}\]])/g, '$1');
    const value: unknown = JSON.parse(normalized);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function parseKeyframes(raw: string | null): ParallaxKeyframes {
  const object = raw ? parseObject(raw) : null;
  if (!object) return {};
  const result: ParallaxKeyframes = {};
  for (const [key, frame] of Object.entries(object)) {
    const percent = Number(key.replace(/%$/, ''));
    if (!Number.isFinite(percent) || percent < 0 || percent > 100 || !frame || typeof frame !== 'object' || Array.isArray(frame)) continue;
    const values: ParallaxFrame = {};
    for (const [property, value] of Object.entries(frame)) {
      if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) values[property] = value;
    }
    result[String(percent)] = values;
  }
  return result;
}

export function parseParallaxBreakpoints(raw: string | null): ParallaxBreakpoints {
  const object = raw ? parseObject(raw) : null;
  if (!object) return {};
  const result: ParallaxBreakpoints = {};
  for (const [key, value] of Object.entries(object)) {
    const width = Number(key);
    if (!Number.isFinite(width) || width <= 0) continue;
    result[String(width)] = parseKeyframes(JSON.stringify(value));
  }
  return result;
}

export function resolveKeyframes(base: ParallaxKeyframes, breakpoints: ParallaxBreakpoints, width: number): ParallaxKeyframes {
  const match = Object.keys(breakpoints).map(Number).sort((a, b) => a - b).find((point) => width <= point);
  return match === undefined ? base : breakpoints[String(match)]!;
}

const numericValue = /^(-?(?:\d+\.?\d*|\.\d+))(px|%|vw|vh|deg|rem|em)?$/;

export function interpolateValue(from: ParallaxValue, to: ParallaxValue, fraction: number): ParallaxValue {
  if (typeof from === 'number' && typeof to === 'number') return from + (to - from) * fraction;
  const a = String(from).trim().match(numericValue);
  const b = String(to).trim().match(numericValue);
  if (a && b && a[2] === b[2]) {
    const value = Number(a[1]) + (Number(b[1]) - Number(a[1])) * fraction;
    return `${value}${a[2] ?? ''}`;
  }
  return fraction < 1 ? from : to;
}

export function sampleKeyframes(frames: ParallaxKeyframes, progress: number, stepMode = false): ParallaxFrame {
  const points = Object.keys(frames).map(Number).sort((a, b) => a - b);
  const result: ParallaxFrame = {};
  const position = Math.max(0, Math.min(100, progress * 100));
  for (const property of new Set(points.flatMap((point) => Object.keys(frames[String(point)] ?? {})))) {
    const defined = points.filter((point) => frames[String(point)]?.[property] !== undefined);
    if (!defined.length) continue;
    const before = [...defined].reverse().find((point) => point <= position) ?? defined[0]!;
    const after = defined.find((point) => point >= position) ?? defined[defined.length - 1]!;
    const a = frames[String(before)]![property]!;
    const b = frames[String(after)]![property]!;
    result[property] = stepMode || before === after ? a : interpolateValue(a, b, (position - before) / (after - before));
  }
  return result;
}

/** Arithmetic-only evaluator for scroll start/end. No calls, property access, or globals beyond this list. */
export function resolveScrollPosition(expression: string, container: HTMLElement): number {
  const rect = container.getBoundingClientRect();
  const offset = rect.top + window.scrollY;
  const variables: Record<string, number> = {
    offset,
    'container.offsetTop': offset,
    'container.offsetHeight': rect.height,
    'window.innerHeight': window.innerHeight,
    'window.innerWidth': window.innerWidth,
    'window.scrollY': window.scrollY,
    'document.documentElement.clientHeight': document.documentElement.clientHeight,
    'document.documentElement.scrollHeight': document.documentElement.scrollHeight,
  };
  const source = expression.replace(/\s+/g, '');
  const tokens = source.match(/(?:\d+\.?\d*|\.\d+)|[A-Za-z_$][\w$.]*|[()+*/-]/g);
  if (!tokens || tokens.join('') !== source) throw new Error(`Invalid scroll expression: ${expression}`);
  let index = 0;
  function factor(): number {
    const token = tokens![index++];
    if (token === '+') return factor();
    if (token === '-') return -factor();
    if (token === '(') {
      const value = sum();
      if (tokens![index++] !== ')') throw new Error('Unclosed scroll expression');
      return value;
    }
    if (!token) throw new Error('Incomplete scroll expression');
    if (/^(?:\d|\.)/.test(token)) return Number(token);
    if (!(token in variables)) throw new Error(`Unsupported scroll variable: ${token}`);
    return variables[token]!;
  }
  function product(): number {
    let value = factor();
    while (tokens![index] === '*' || tokens![index] === '/') {
      const operator = tokens![index++];
      const next = factor();
      value = operator === '*' ? value * next : value / next;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (tokens![index] === '+' || tokens![index] === '-') {
      const operator = tokens![index++];
      const next = product();
      value = operator === '+' ? value + next : value - next;
    }
    return value;
  }
  const value = sum();
  if (index !== tokens.length || !Number.isFinite(value)) throw new Error(`Invalid scroll expression: ${expression}`);
  return value;
}

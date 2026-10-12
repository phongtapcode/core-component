/**
 * Attribute ↔ property reflection.
 *
 * Components declare their reflected properties as `static properties = {…}`.
 * BaseElement:
 *   1. Calls `applyDefaults()` on `connectedCallback` to populate properties
 *      from defaults before the first paint.
 *   2. Implements `attributeChangedCallback` to coerce the new attribute value
 *      via the property's parser, write it back to the typed JS property,
 *      and (if `reflect: true`) write the property change back to the attribute.
 *
 * Parsers default to one of: `parseString`, `parseNumber`, `parseBoolean`,
 * `parseObject` (JSON). Components may pass a custom parser/serializer.
 */

import type { Parser, PropertyDef, PropertyDefMap, Serializer } from './types.js';

/* ---------- Case conversion ---------- */

/** `fooBar` → `foo-bar`. */
export function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/** `foo-bar` → `fooBar`. */
export function camel(name: string): string {
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/* ---------- Default parsers ---------- */

export const parseString: Parser<string> = (raw) => (raw ?? '');

export const parseNumber: Parser<number> = (raw) => {
  if (raw === null || raw === '') return Number.NaN;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.NaN;
};

export const parseBoolean: Parser<boolean> = (raw) => {
  if (raw === null) return false;
  // HTML boolean attributes treat presence as truthy, but consumers may want
  // to explicitly opt out. We accept "false" / "0" / "no" as falsy.
  return raw !== 'false' && raw !== '0' && raw !== 'no';
};

export const parseObject = <T>(): Parser<T> => (raw) => {
  if (raw === null || raw === '') return undefined as unknown as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined as unknown as T;
  }
};

/* ---------- Default serializers ---------- */

export const serializeString: Serializer<string> = (v) => String(v);

export const serializeNumber: Serializer<number> = (v) =>
  Number.isFinite(v) ? String(v) : null;

export const serializeBoolean: Serializer<boolean> = (v) => (v ? '' : null);

export const serializeObject =
  <T>(): Serializer<T> =>
  (v) => {
    try {
      return JSON.stringify(v);
    } catch {
      return null;
    }
  };

/* ---------- Resolvers ---------- */

export function getParser<T>(def: PropertyDef<T>): Parser<T> {
  if (def.parse) return def.parse;
  // Heuristic: type derives from default value.
  const sample = def.default;
  if (typeof sample === 'number') return parseNumber as unknown as Parser<T>;
  if (typeof sample === 'boolean') return parseBoolean as unknown as Parser<T>;
  if (sample !== null && typeof sample === 'object') {
    return parseObject<T>();
  }
  return parseString as unknown as Parser<T>;
}

export function getSerializer<T>(def: PropertyDef<T>): Serializer<T> | undefined {
  if (def.serialize) return def.serialize;
  const sample = def.default;
  if (typeof sample === 'number') return serializeNumber as unknown as Serializer<T>;
  if (typeof sample === 'boolean') return serializeBoolean as unknown as Serializer<T>;
  if (sample !== null && typeof sample === 'object') {
    return serializeObject<T>();
  }
  return serializeString as unknown as Serializer<T>;
}

/* ---------- Attribute-name extraction ---------- */

/**
 * Return the list of attribute names a class wants to observe. BaseElement
 * uses this to populate its `static get observedAttributes()` lazily on first
 * instantiation.
 */
export function observedAttrsFor(properties: PropertyDefMap | undefined): string[] {
  if (!properties) return [];
  const out = new Set<string>();
  for (const key of Object.keys(properties)) {
    const def = properties[key]!;
    out.add(def.attr ?? kebab(key));
  }
  return [...out];
}

/**
 * Apply each property's default to the instance, unless the attribute is
 * already present on the element. Called by BaseElement before first paint.
 */
export function applyDefaults(
  instance: HTMLElement & Record<string, unknown>,
  properties: PropertyDefMap | undefined,
): void {
  if (!properties) return;
  for (const key of Object.keys(properties)) {
    const def = properties[key]!;
    const attr = def.attr ?? kebab(key);
    if (instance.hasAttribute(attr)) {
      const parser = getParser(def);
      const value = parser(instance.getAttribute(attr));
      if (def.readonly) {
        Object.defineProperty(instance, key, {
          value,
          writable: false,
          configurable: true,
          enumerable: true,
        });
      } else {
        instance[key] = value;
      }
    } else {
      if (def.readonly) {
        Object.defineProperty(instance, key, {
          value: def.default,
          writable: false,
          configurable: true,
          enumerable: true,
        });
      } else {
        instance[key] = def.default;
      }
      // Reflect default to the attribute so consumers see it in the DOM.
      if (def.reflect) {
        reflect(instance, def as PropertyDef<unknown>, def.default);
      }
    }
  }
}

/**
 * Coerce an attribute string into a typed value. `null` attribute means absent.
 */
export function coerce<T>(def: PropertyDef<T>, raw: string | null): T {
  return getParser(def)(raw);
}

/**
 * Apply a typed value back to the attribute. Only happens for properties
 * marked `reflect: true`. `null` removes the attribute.
 */
export function reflect<T>(
  instance: Element,
  def: PropertyDef<T>,
  value: T,
): void {
  if (!def.reflect) return;
  const attr = def.attr ?? kebab(def.name);
  const serializer = getSerializer(def);
  if (!serializer) return;
  const out = serializer(value);
  if (out === null) {
    instance.removeAttribute(attr);
  } else {
    instance.setAttribute(attr, out);
  }
}

/* ---------- Frame helpers ---------- */

/**
 * Queue a microtask. Always returns a Promise. Useful for batching attribute
 * writes that should land before the next paint but after the current
 * synchronous block.
 */
export function nextTick(): Promise<void> {
  return Promise.resolve();
}

/**
 * Run `cb` on the next animation frame, after the browser has had a chance
 * to apply the latest style/layout. Returns the rAF handle so it can be
 * cancelled by CleanupRegistry.
 */
export function afterPaint(cb: () => void): number {
  return globalThis.requestAnimationFrame(() => {
    // Defer to a microtask after rAF to coalesce multiple same-frame
    // callbacks; this matches what `vue` and `lit` do.
    queueMicrotask(cb);
  });
}

export function cancelAfterPaint(handle: number): void {
  globalThis.cancelAnimationFrame(handle);
}
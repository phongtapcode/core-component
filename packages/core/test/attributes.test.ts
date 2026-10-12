import { describe, expect, it } from 'vitest';
import {
  applyDefaults,
  camel,
  coerce,
  getParser,
  getSerializer,
  kebab,
  observedAttrsFor,
  parseBoolean,
  parseNumber,
  parseObject,
  parseString,
  reflect,
  serializeBoolean,
  serializeNumber,
  serializeString,
} from '@ui/core';

describe('kebab / camel', () => {
  it('kebab() converts camelCase', () => {
    expect(kebab('fooBar')).toBe('foo-bar');
    expect(kebab('rootMargin')).toBe('root-margin');
    expect(kebab('XMLParser')).toBe('-x-m-l-parser');
  });
  it('camel() converts kebab-case', () => {
    expect(camel('foo-bar')).toBe('fooBar');
    expect(camel('root-margin')).toBe('rootMargin');
    expect(camel('a-b-c')).toBe('aBC');
  });
});

describe('default parsers', () => {
  it('parseString', () => {
    expect(parseString('hi')).toBe('hi');
    expect(parseString(null)).toBe('');
  });
  it('parseNumber', () => {
    expect(parseNumber('3.14')).toBeCloseTo(3.14);
    expect(Number.isNaN(parseNumber(''))).toBe(true);
    expect(Number.isNaN(parseNumber('not a number'))).toBe(true);
  });
  it('parseBoolean', () => {
    expect(parseBoolean('')).toBe(true);
    expect(parseBoolean('x')).toBe(true);
    expect(parseBoolean(null)).toBe(false);
  });
  it('parseObject', () => {
    const p = parseObject<{ a: number }>();
    expect(p('{"a":1}')).toEqual({ a: 1 });
    expect(p(null)).toBeUndefined();
    expect(p('not-json')).toBeUndefined();
  });
});

describe('default serializers', () => {
  it('serializeString', () => {
    expect(serializeString('hi')).toBe('hi');
  });
  it('serializeNumber', () => {
    expect(serializeNumber(42)).toBe('42');
    expect(serializeNumber(Number.NaN)).toBeNull();
    expect(serializeNumber(Number.POSITIVE_INFINITY)).toBeNull();
  });
  it('serializeBoolean', () => {
    expect(serializeBoolean(true)).toBe('');
    expect(serializeBoolean(false)).toBeNull();
  });
});

describe('getParser / getSerializer / coerce', () => {
  it('infers parser from default type', () => {
    const def = { name: 'n', default: 1 } as Parameters<typeof getParser>[0];
    const p = getParser(def);
    expect(p('42')).toBe(42);
  });
  it('reflect() writes the attribute when reflect:true, removes when null', () => {
    const el = document.createElement('div');
    const def = {
      name: 'open',
      default: false,
      reflect: true,
    } as Parameters<typeof reflect>[1];
    reflect(el, def, true);
    expect(el.getAttribute('open')).toBe('');
    reflect(el, def, false);
    expect(el.hasAttribute('open')).toBe(false);
  });
  it('reflect() does nothing when reflect:false', () => {
    const el = document.createElement('div');
    const def = { name: 'open', default: false, reflect: false } as Parameters<
      typeof reflect
    >[1];
    reflect(el, def, true);
    expect(el.hasAttribute('open')).toBe(false);
  });
  it('coerce() picks the right one', () => {
    expect(coerce({ name: 'n', default: 1 }, '7')).toBe(7);
    expect(coerce({ name: 'n', default: true }, '')).toBe(true);
    expect(coerce({ name: 'n', default: 'x' }, 'y')).toBe('y');
  });
});

describe('observedAttrsFor()', () => {
  it('derives from properties', () => {
    const attrs = observedAttrsFor({
      rootMargin: { name: 'rootMargin', default: '0px' },
      'aria-label': { name: 'aria-label', default: '' },
    });
    expect(attrs).toEqual(['root-margin', 'aria-label']);
  });
  it('returns [] when no properties', () => {
    expect(observedAttrsFor(undefined)).toEqual([]);
  });
});

describe('applyDefaults()', () => {
  it('applies default when attribute absent', () => {
    const el = document.createElement('div') as HTMLElement & Record<string, unknown>;
    applyDefaults(el, { count: { name: 'count', default: 5 } });
    expect(el.count).toBe(5);
  });
  it('keeps attribute value when present', () => {
    const el = document.createElement('div') as HTMLElement & Record<string, unknown>;
    el.setAttribute('count', '9');
    applyDefaults(el, { count: { name: 'count', default: 5 } });
    expect(el.count).toBe(9);
  });
  it('coerces using the parser inferred from default', () => {
    const el = document.createElement('div') as HTMLElement & Record<string, unknown>;
    el.setAttribute('ratio', '0.5');
    applyDefaults(el, { ratio: { name: 'ratio', default: 0 } });
    expect(el.ratio).toBe(0.5);
  });
});
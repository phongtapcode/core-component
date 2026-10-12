import { describe, expect, it } from 'vitest';
import {
  define as uiDefine,
  getAllRegistered,
  getRegistered,
  getTagNames,
  isDefined,
  isSupported,
} from '@ui/core';

// Each test must use a UNIQUE tag name and a UNIQUE constructor. The platform
// customElements registry can only register a tag once, and a constructor can
// only be associated with one tag — re-using either throws.
let nextId = 0;
function freshTag(): string {
  return `ui-test-define-${++nextId}-${Math.random().toString(36).slice(2, 7)}`;
}
function freshClass(name: string): typeof HTMLElement {
  // Each call returns a brand-new class — registering one constructor twice
  // (even on different tags) throws DOMException in modern browsers / happy-dom.
  return { [name]: class extends HTMLElement {} }[name]!;
}

describe('define()', () => {
  it('isSupported() returns true in jsdom/happy-dom', () => {
    expect(isSupported()).toBe(true);
  });

  it('registers a component in the platform registry AND our registry', () => {
    const tag = freshTag();
    const ctor = freshClass('A');
    uiDefine(tag, ctor);
    expect(isDefined(tag)).toBe(true);
    const entry = getRegistered(tag);
    expect(entry?.tagName).toBe(tag);
    expect(entry?.ctor).toBe(ctor);
    expect(entry?.since).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('rejects tag names without a hyphen', () => {
    expect(() => uiDefine('notavalidtagname', freshClass('X'))).toThrow(
      /must contain a hyphen/,
    );
  });

  it('rejects re-registration of an already-defined tag', () => {
    const tag = freshTag();
    uiDefine(tag, freshClass('R1'));
    expect(() => uiDefine(tag, freshClass('R2'))).toThrow(/already registered/);
  });

  it('getTagNames returns only `ui-` prefixed tags sorted', () => {
    const a = freshTag();
    const b = freshTag();
    uiDefine(a, freshClass('GA'));
    uiDefine(b, freshClass('GB'));
    const names = getTagNames();
    expect(names).toContain(a);
    expect(names).toContain(b);
    expect(names).toEqual([...names].sort());
  });

  it('getTagNames respects a custom prefix', () => {
    const tag = freshTag();
    uiDefine(tag, freshClass('P'));
    expect(getTagNames('ui-')).toContain(tag);
    expect(getTagNames('xx-')).not.toContain(tag);
  });

  it('getAllRegistered returns every entry', () => {
    const a = freshTag();
    const b = freshTag();
    uiDefine(a, freshClass('GA2'));
    uiDefine(b, freshClass('GB2'));
    const all = getAllRegistered();
    const tags = all.map((e) => e.tagName);
    expect(tags).toContain(a);
    expect(tags).toContain(b);
  });
});
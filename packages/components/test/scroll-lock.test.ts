import { afterEach, describe, expect, it, vi } from 'vitest';
import { lockScroll, unlockScroll } from '../src/focus-trap.js';

const root = document.documentElement;
const body = document.body;
const initialRootStyle = root.getAttribute('style');
const initialBodyStyle = body.getAttribute('style');
const initialWidth = window.innerWidth;

afterEach(() => {
  if (initialRootStyle === null) root.removeAttribute('style'); else root.setAttribute('style', initialRootStyle);
  if (initialBodyStyle === null) body.removeAttribute('style'); else body.setAttribute('style', initialBodyStyle);
  Reflect.deleteProperty(root, 'clientWidth');
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: initialWidth });
  vi.unstubAllGlobals();
});

describe('scroll lock', () => {
  it('keeps the page width and original styles through nested locks', () => {
    Object.defineProperty(root, 'clientWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1020 });
    vi.stubGlobal('CSS', { supports: () => true });
    root.style.overflow = 'auto';
    root.style.scrollbarGutter = 'auto';
    body.style.position = 'relative';
    lockScroll();
    lockScroll();
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.scrollbarGutter).toBe('stable');
    expect(body.style.position).toBe('relative');
    unlockScroll();
    expect(root.style.overflow).toBe('hidden');
    unlockScroll();
    expect(root.style.overflow).toBe('auto');
    expect(root.style.scrollbarGutter).toBe('auto');
    expect(body.style.position).toBe('relative');
  });

  it('compensates for the scrollbar when scrollbar-gutter is unavailable', () => {
    Object.defineProperty(root, 'clientWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1020 });
    vi.stubGlobal('CSS', { supports: () => false });
    root.style.paddingRight = '10px';
    lockScroll();
    expect(root.style.paddingRight).toBe('30px');
    unlockScroll();
    expect(root.style.paddingRight).toBe('10px');
  });
});

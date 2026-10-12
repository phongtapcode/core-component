import { beforeEach, describe, expect, it } from 'vitest';
import '../src/index.js';
import type { UiScrollX } from '../src/scroll-x.js';

const bounds = (top: number, height: number, width = 800): DOMRect => ({
  top, bottom: top + height, left: 0, right: width, width, height, x: 0, y: top, toJSON: () => ({}),
});

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
});

function mount() {
  const root = document.createElement('ui-scroll-x') as UiScrollX;
  const first = document.createElement('ui-scroll-x-item');
  const second = document.createElement('ui-scroll-xy-item');
  first.innerHTML = '<div><a href="#first">First</a></div>';
  second.innerHTML = '<div><a href="#second">Second</a></div>';
  root.append(first, second);
  let top = 1000;
  root.getBoundingClientRect = () => bounds(top, 2200);
  document.body.append(root);
  return {
    root, first, second,
    setTop(value: number) { top = value; root.refresh(); },
    scrollTo(value: number) { top = value; window.dispatchEvent(new Event('scroll')); },
  };
}

describe('ui-scroll-x', () => {
  it('creates its sticky shadow wrapper and reveals panels in order', () => {
    const { root, first, second, setTop } = mount();
    expect(root.shadowRoot?.querySelector('ui-scroll-x-inner slot')).not.toBeNull();
    expect(root.style.getPropertyValue('--ui-scroll-x-count')).toBe('2');
    expect(first.style.width).toBe('100%');
    expect(second.inert).toBe(true);

    setTop(200);
    expect(root.progress).toBe(0);
    expect(second.style.width).toBe('0%');
    setTop(0); // The sticky stage starts here.
    expect(root.progress).toBe(0);
    expect(second.style.width).toBe('0%');

    setTop(-600); // Halfway through the sticky travel.
    expect(root.progress).toBe(0.5);
    expect(first.style.width).toBe('100%');
    expect(second.style.width).toBe('50%');

    setTop(-900);
    expect(second.style.width).toBe('75%');
    expect(first.inert).toBe(true);
    expect(second.inert).toBe(false);

    setTop(-1200);
    expect(second.style.width).toBe('100%');
  });

  it('eases toward the scroll position and can be refreshed immediately', async () => {
    const { root, second, scrollTo } = mount();
    scrollTo(200);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(root.progress).toBe(0);
    expect(second.style.width).toBe('0%');
    scrollTo(-600);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(root.progress).toBeGreaterThan(0);
    expect(root.progress).toBeLessThan(0.5);
    expect(parseFloat(second.style.width)).toBeLessThan(50);
    root.refresh();
    expect(root.progress).toBe(0.5);
    expect(second.style.width).toBe('50%');
  });

  it('recounts panels and restores inline state after removal', async () => {
    const { root, first, second } = mount();
    first.style.width = '35%';
    first.inert = true;
    second.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root.style.getPropertyValue('--ui-scroll-x-count')).toBe('1');
    root.remove();
    expect(first.style.width).toBe('');
    expect(first.inert).toBe(false);
  });

  it('shows normal stacked content when reduced motion is requested', () => {
    const original = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) });
    try {
      const { root, first, second } = mount();
      expect(root.progress).toBe(1);
      expect(first.style.width).toBe('');
      expect(second.style.width).toBe('');
      expect(first.inert).toBe(false);
      expect(second.inert).toBe(false);
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: original });
    }
  });

  it('preserves a panel that the author marked inert', () => {
    const root = document.createElement('ui-scroll-x') as UiScrollX;
    const item = document.createElement('ui-scroll-x-item');
    item.inert = true;
    root.append(item);
    root.getBoundingClientRect = () => bounds(0, 1100);
    document.body.append(root);
    expect(item.inert).toBe(true);
    root.remove();
    expect(item.inert).toBe(true);
  });
});

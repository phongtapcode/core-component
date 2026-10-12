import { beforeEach, describe, expect, it } from 'vitest';
import '../src/index.js';
import type { UiScrollY } from '../src/scroll-y.js';

const bounds = (top: number, height: number, width = 800): DOMRect => ({
  top, bottom: top + height, left: 0, right: width, width, height, x: 0, y: top, toJSON: () => ({}),
});

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
});

function mount() {
  const root = document.createElement('ui-scroll-y') as UiScrollY;
  const first = document.createElement('ui-scroll-y-item');
  const second = document.createElement('ui-scroll-xy-item');
  first.innerHTML = '<div>First</div>';
  second.innerHTML = '<div>Second</div>';
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

describe('ui-scroll-y', () => {
  it('pins a shadow stage and slides later panels only after reaching the viewport top', () => {
    const { root, first, second, setTop } = mount();
    expect(root.shadowRoot?.querySelector('ui-scroll-y-inner slot')).not.toBeNull();
    expect(root.style.getPropertyValue('--ui-scroll-y-count')).toBe('2');
    expect(first.style.top).toBe('0%');
    expect(second.style.top).toBe('100%');
    setTop(200);
    expect(root.panelProgress).toBe(0);
    expect(second.style.top).toBe('100%');
    setTop(0);
    expect(second.style.top).toBe('100%');
    setTop(-600);
    expect(root.panelProgress).toBe(0.5);
    expect(second.style.top).toBe('50%');
    expect(first.inert).toBe(true);
    expect(second.inert).toBe(false);
    setTop(-1200);
    expect(second.style.top).toBe('0%');
    setTop(0);
    expect(second.style.top).toBe('100%');
  });

  it('eases toward the scroll target and lets refresh snap to the current position', async () => {
    const { root, second, scrollTo } = mount();
    scrollTo(-600);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(root.panelProgress).toBeGreaterThan(0);
    expect(root.panelProgress).toBeLessThan(0.5);
    expect(parseFloat(second.style.top)).toBeGreaterThan(50);
    root.refresh();
    expect(root.panelProgress).toBe(0.5);
    expect(second.style.top).toBe('50%');
  });

  it('registers nested parallax scroll when ui-parallax is enabled', () => {
    const root = document.createElement('ui-scroll-y') as UiScrollY;
    root.setAttribute('ui-parallax', '');
    root.getBoundingClientRect = () => bounds(0, 2200);
    const panel = document.createElement('ui-scroll-y-item');
    const effect = document.createElement('ui-parallax-scroll');
    effect.setAttribute('ui-keyframes', "{'0%': {opacity: 0}, '100%': {opacity: 1}}");
    effect.setAttribute('ui-lerp-ease', '1');
    panel.append(effect);
    root.append(panel);
    document.body.append(root);
    root.refresh();
    expect(effect.style.opacity).toBe('0.3125');
  });

  it('recounts dynamic panels and restores the original top and inert state', async () => {
    const { root, first, second } = mount();
    first.style.top = '12px';
    first.inert = true;
    second.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root.style.getPropertyValue('--ui-scroll-y-count')).toBe('1');
    root.remove();
    expect(first.style.top).toBe('');
    expect(first.inert).toBe(false);
  });

  it('shows a normal vertical stack for reduced motion and restores original state', () => {
    const original = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) });
    try {
      const { root, first, second } = mount();
      expect(root.panelProgress).toBe(1);
      expect(first.style.top).toBe('');
      expect(second.style.top).toBe('');
      expect(first.inert).toBe(false);
      expect(second.inert).toBe(false);
      root.remove();
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: original });
    }
  });
});

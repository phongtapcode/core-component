import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';
import type { UiScrollScene } from '../src/scroll-scene.js';

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
});

function mount() {
  const root = document.createElement('ui-scroll-scene') as UiScrollScene;
  const inner = document.createElement('ui-scroll-scene-inner');
  const items = Array.from({ length: 3 }, (_, index) => {
    const item = document.createElement('ui-scroll-scene-item');
    item.textContent = `Scene ${index + 1}`;
    inner.append(item);
    return item;
  });
  root.append(inner);
  let top = 800;
  root.getBoundingClientRect = () => ({ top, bottom: top + 2500, height: 2500, width: 800, left: 0, right: 800, x: 0, y: top, toJSON: () => ({}) });
  document.body.append(root);
  return { root, inner, items, setTop(value: number) { top = value; root.refresh(); } };
}

describe('ui-scroll-scene', () => {
  it('holds the first scene until the section reaches the top, then changes at threshold steps', () => {
    const { root, items, setTop } = mount();
    const changes: Array<{ activeIndex: number; previousIndex: number }> = [];
    root.addEventListener('ui:scroll-scene:change', (event) => changes.push((event as CustomEvent).detail));
    expect(root.getAttribute('ui-ready')).toBe('true');
    expect(root.style.getPropertyValue('--ui-scroll-scene-height')).toBe('2500px');
    expect(items[0].hasAttribute('ui-active')).toBe(true);
    expect(items[1].hasAttribute('ui-next')).toBe(true);
    expect(items[1].inert).toBe(true);
    setTop(0);
    expect(root.activeIndex).toBe(0);
    setTop(-499);
    expect(root.activeIndex).toBe(0);
    setTop(-500);
    expect(root.activeIndex).toBe(1);
    expect(items[0].hasAttribute('ui-prev')).toBe(true);
    expect(items[1].inert).toBe(false);
    expect(root.getAttribute('ui-direction')).toBe('down');
    setTop(-1000);
    expect(root.activeIndex).toBe(2);
    setTop(-490);
    expect(root.activeIndex).toBe(0);
    expect(root.getAttribute('ui-direction')).toBe('up');
    expect(changes.map(({ activeIndex }) => activeIndex)).toEqual([1, 2, 0]);
    expect(changes[0].previousIndex).toBe(0);
  });

  it('creates keyboard focus targets and restores original inert state on disconnect', () => {
    const { root, items } = mount();
    expect(items.every((item) => item.querySelector('ui-scroll-scene-item-focus[tabindex="0"]'))).toBe(true);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const focus = items[0].querySelector('ui-scroll-scene-item-focus')!;
    focus.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 1300, behavior: 'smooth' });
    scrollTo.mockRestore();
    root.remove();
    expect(items.every((item) => !item.inert && !item.querySelector('ui-scroll-scene-item-focus'))).toBe(true);
  });

  it('uses a normal stack when mobile disabled and respects threshold changes', () => {
    const { root, items, setTop } = mount();
    root.setAttribute('ui-threshold', '1');
    expect(root.style.getPropertyValue('--ui-scroll-scene-height')).toBe('4000px');
    setTop(-500);
    expect(root.activeIndex).toBe(0);
    root.setAttribute('ui-mobile-breakpoint', '768');
    root.setAttribute('ui-mobile-disabled', '');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 });
    root.refresh();
    expect(root.hasAttribute('data-ui-scroll-scene-disabled')).toBe(true);
    expect(root.activeIndex).toBe(-1);
    expect(items.every((item) => !item.inert && !item.hasAttribute('ui-active'))).toBe(true);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    root.refresh();
    expect(root.activeIndex).toBe(0);
  });

  it('recounts scenes added after mount', async () => {
    const { root, inner } = mount();
    const item = document.createElement('ui-scroll-scene-item');
    item.textContent = 'Fourth scene';
    inner.append(item);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(root.style.getPropertyValue('--ui-scroll-scene-height')).toBe('3000px');
    expect(item.querySelector('ui-scroll-scene-item-focus')).not.toBeNull();
  });

  it('shows all scenes in normal document flow for reduced motion', () => {
    const original = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) });
    try {
      const { root, items } = mount();
      expect(root.hasAttribute('data-ui-scroll-scene-disabled')).toBe(true);
      expect(items.every((item) => !item.inert && !item.hasAttribute('ui-active'))).toBe(true);
      expect(items[0].querySelector('ui-scroll-scene-item-focus')?.getAttribute('tabindex')).toBe('-1');
    } finally {
      Object.defineProperty(window, 'matchMedia', { configurable: true, value: original });
    }
  });
});

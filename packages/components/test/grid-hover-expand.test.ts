import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../src/grid-hover-expand.js';

const originalWidth = window.innerWidth;
const createGrid = (count = 6): HTMLElement => {
  const grid = document.createElement('ui-grid-hover-expand');
  grid.setAttribute('style', '--xs: 1; --sm: 1; --md: 2; --lg: 3');
  grid.innerHTML = Array.from({ length: count }, (_, index) => `<div><button>Card ${index + 1}</button></div>`).join('');
  document.body.append(grid);
  return grid;
};

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
});
afterEach(() => Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth }));

describe('ui-grid-hover-expand', () => {
  it('expands only the hovered row and restores equal widths on leave', () => {
    const grid = createGrid();
    const items = [...grid.children] as HTMLElement[];
    expect(items.every((item) => item.style.getPropertyValue('--ui-grid-hover-width') === `${100 / 3}%`)).toBe(true);
    items[1]!.querySelector('button')!.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect(items[1]!.style.getPropertyValue('--ui-grid-hover-width')).toBe('50%');
    expect(items[0]!.style.getPropertyValue('--ui-grid-hover-width')).toBe('25%');
    expect(items[2]!.style.getPropertyValue('--ui-grid-hover-width')).toBe('25%');
    expect(items[3]!.style.getPropertyValue('--ui-grid-hover-width')).toBe(`${100 / 3}%`);
    expect(items[1]!.hasAttribute('ui-active')).toBe(true);
    grid.dispatchEvent(new Event('pointerleave'));
    expect(grid.querySelector('[ui-active]')).toBeNull();
    expect(items[1]!.style.getPropertyValue('--ui-grid-hover-width')).toBe(`${100 / 3}%`);
  });

  it('adapts to breakpoints and expands a keyboard-focused card', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
    const grid = createGrid();
    const items = [...grid.children] as HTMLElement[];
    items[3]!.querySelector('button')!.focus();
    expect(items[3]!.style.getPropertyValue('--ui-grid-hover-width')).toBe(`${200 / 3}%`);
    expect(items[2]!.style.getPropertyValue('--ui-grid-hover-width')).toBe(`${100 / 3}%`);
    expect(items[0]!.style.getPropertyValue('--ui-grid-hover-width')).toBe('50%');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));
    expect(grid.querySelector('[ui-active]')).toBeNull();
    expect(items.every((item) => item.style.getPropertyValue('--ui-grid-hover-width') === '100%')).toBe(true);
  });

  it('supports an optional initial index and new child cards', async () => {
    const grid = createGrid();
    grid.setAttribute('ui-active-index', '4');
    expect(grid.children[4]!.hasAttribute('ui-active')).toBe(true);
    const child = document.createElement('div');
    grid.append(child);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(child.style.getPropertyValue('--ui-grid-hover-width')).toBe(`${100 / 3}%`);
  });

  it('does not keep a clicked card expanded after the pointer leaves', () => {
    const grid = createGrid();
    const button = grid.children[1]!.querySelector('button')!;
    button.dispatchEvent(new Event('pointerover', { bubbles: true }));
    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    button.focus();
    grid.dispatchEvent(new Event('pointerleave'));
    expect(grid.querySelector('[ui-active]')).toBeNull();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    grid.children[2]!.querySelector('button')!.focus();
    expect(grid.children[2]!.hasAttribute('ui-active')).toBe(true);
  });

  it('supports three cards with no gap and updates the gap attribute', () => {
    const grid = createGrid(3);
    grid.setAttribute('ui-gap', '0');
    expect(grid.style.getPropertyValue('--ui-grid-hover-gap-attr')).toBe('0px');
    grid.children[1]!.querySelector('button')!.dispatchEvent(new Event('pointerover', { bubbles: true }));
    expect((grid.children[1] as HTMLElement).style.getPropertyValue('--ui-grid-hover-width')).toBe('50%');
    grid.setAttribute('ui-gap', '24');
    expect(grid.style.getPropertyValue('--ui-grid-hover-gap-attr')).toBe('24px');
    grid.removeAttribute('ui-gap');
    expect(grid.style.getPropertyValue('--ui-grid-hover-gap-attr')).toBe('');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/expandable-grid.js';

beforeEach(() => { document.body.innerHTML = ''; });

describe('ui-expandable-grid', () => {
  it('opens and switches cards using their buttons and emits the active index', () => {
    const grid = document.createElement('ui-expandable-grid');
    grid.innerHTML = [1, 2, 3].map((number) =>
      `<ui-expandable-grid-item><button ui-expandable-grid-trigger type="button">Card ${number}</button><ui-expandable-grid-detail>Detail</ui-expandable-grid-detail></ui-expandable-grid-item>`,
    ).join('');
    document.body.append(grid);
    const changes = vi.fn();
    grid.addEventListener('ui-expandable-grid-change', changes);
    const buttons = grid.querySelectorAll<HTMLButtonElement>('button');
    buttons[0]!.click();
    expect(grid.children[0]!.hasAttribute('ui-active')).toBe(true);
    expect(buttons[0]!.getAttribute('aria-expanded')).toBe('true');
    buttons[2]!.click();
    expect(grid.children[0]!.hasAttribute('ui-active')).toBe(false);
    expect(grid.children[2]!.hasAttribute('ui-active')).toBe(true);
    expect((changes.mock.calls[1]![0] as CustomEvent).detail.activeIndex).toBe(2);
    buttons[2]!.click();
    expect([...grid.children].some((child) => child.hasAttribute('ui-active'))).toBe(false);
  });

  it('closes on Escape and restores focus to the active trigger', () => {
    const grid = document.createElement('ui-expandable-grid');
    grid.innerHTML = '<ui-expandable-grid-item><button ui-expandable-grid-trigger>Open</button><ui-expandable-grid-detail><a href="#">Link</a></ui-expandable-grid-detail></ui-expandable-grid-item>';
    document.body.append(grid);
    grid.querySelector('button')!.click();
    grid.querySelector('a')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(grid.querySelector('ui-expandable-grid-item')!.hasAttribute('ui-active')).toBe(false);
    expect(document.activeElement).toBe(grid.querySelector('button'));
  });
});

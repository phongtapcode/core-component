import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/swipeable-card-stack.js';
import type { UiSwipeableCardStack } from '../src/swipeable-card-stack.js';

function createStack(count = 4): UiSwipeableCardStack {
  const stack = document.createElement('ui-swipeable-card-stack') as UiSwipeableCardStack;
  stack.setAttribute('ui-speed', '0');
  stack.innerHTML = Array.from({ length: count }, (_, index) => `<article><span>Card ${index + 1}</span></article>`).join('');
  document.body.append(stack);
  return stack;
}

function pointer(type: string, x: number, y = 0): PointerEvent {
  return new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, clientX: x, clientY: y });
}

beforeEach(() => { document.body.innerHTML = ''; });

describe('ui-swipeable-card-stack', () => {
  it('advances in DOM order, emits a change event, and wraps around', async () => {
    const stack = createStack(3);
    const items = stack.items;
    const changes: Array<{ activeIndex: number; previousIndex: number; direction: string }> = [];
    stack.addEventListener('ui:swipeable-card-stack:change', (event) => {
      changes.push((event as CustomEvent).detail);
    });

    expect(items[0]!.hasAttribute('ui-active')).toBe(true);
    expect(items[1]!.inert).toBe(true);
    await stack.swipeRight();
    expect(stack.activeIndex).toBe(1);
    expect(items[1]!.hasAttribute('ui-active')).toBe(true);
    expect(items[0]!.getAttribute('aria-hidden')).toBe('true');
    expect([...stack.children]).toEqual(items);
    expect(changes[0]).toMatchObject({ activeIndex: 1, previousIndex: 0, direction: 'right' });

    await stack.goTo(0);
    expect(stack.activeIndex).toBe(0);
    expect(changes).toHaveLength(3);
  });

  it('moves with the pointer, returns after a short drag, and commits a long drag', () => {
    const stack = createStack();
    const first = stack.items[0]!;
    first.dispatchEvent(pointer('pointerdown', 100));
    window.dispatchEvent(pointer('pointermove', 115));
    expect(stack.hasAttribute('data-dragging')).toBe(true);
    expect(first.style.transform).toContain('15px');
    window.dispatchEvent(pointer('pointerup', 115));
    expect(stack.activeIndex).toBe(0);
    expect(stack.hasAttribute('data-dragging')).toBe(false);

    first.dispatchEvent(pointer('pointerdown', 200));
    window.dispatchEvent(pointer('pointermove', 70));
    window.dispatchEvent(pointer('pointerup', 70));
    expect(stack.activeIndex).toBe(1);
    expect(stack.items[1]!.hasAttribute('ui-active')).toBe(true);
  });

  it('sends the released card straight to the back from its dragged position', () => {
    vi.useFakeTimers();
    try {
      const stack = createStack();
      stack.setAttribute('ui-speed', '600');
      stack.items[0]!.dispatchEvent(pointer('pointerdown', 200));
      window.dispatchEvent(pointer('pointermove', 70));
      expect(stack.items[0]!.style.transform).toContain('-130px');
      window.dispatchEvent(pointer('pointerup', 70));

      expect(stack.activeIndex).toBe(1);
      expect(stack.items[0]!.hasAttribute('data-retiring')).toBe(true);
      expect(stack.items[0]!.style.transform).toContain('translate3d(90px, 0px, 0)');
      expect(Number(stack.items[0]!.style.zIndex)).toBeLessThan(Number(stack.items[1]!.style.zIndex));
      expect(stack.style.getPropertyValue('--ui-stack-duration')).toBe('600ms');
      vi.advanceTimersByTime(600);
      expect(stack.activeIndex).toBe(1);
      expect(stack.items[1]!.hasAttribute('ui-active')).toBe(true);
      expect(stack.items[0]!.hasAttribute('data-retiring')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('supports arrow keys, style variants, and visible layer limits', () => {
    const stack = createStack(5);
    stack.setAttribute('ui-items-to-show', '2');
    expect(stack.items[2]!.style.opacity).toBe('0');
    stack.setAttribute('ui-style', '2');
    expect(stack.items[1]!.style.transform).toContain('0px, 40px');
    stack.setAttribute('ui-style', '3');
    expect(stack.items[1]!.style.transform).toContain('rotate(5deg)');
    stack.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    expect(stack.activeIndex).toBe(1);
  });

  it('reacts to added cards and restores authored card styles on disconnect', async () => {
    const stack = createStack(2);
    const card = document.createElement('article');
    card.style.transform = 'rotate(2deg)';
    card.setAttribute('aria-hidden', 'false');
    stack.append(card);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(stack.items).toHaveLength(3);
    expect(card.style.getPropertyValue('--ui-layer')).toBe('2');
    stack.remove();
    expect(card.style.transform).toBe('rotate(2deg)');
    expect(card.getAttribute('aria-hidden')).toBe('false');
  });
});

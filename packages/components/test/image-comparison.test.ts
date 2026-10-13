import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';
import type { UiImageComparison } from '../src/image-comparison.js';

beforeEach(() => { document.body.innerHTML = ''; });

function mount() {
  const element = document.createElement('ui-image-comparison') as UiImageComparison;
  element.setAttribute('ui-default-percent', '40');
  element.innerHTML = `
    <ui-image-comparison-before><img src="before.jpg" alt="Before"></ui-image-comparison-before>
    <ui-image-comparison-after><img src="after.jpg" alt="After"></ui-image-comparison-after>
    <ui-image-comparison-handle></ui-image-comparison-handle>`;
  element.getBoundingClientRect = () => ({ left: 100, right: 300, top: 0, bottom: 150, width: 200, height: 150, x: 100, y: 0, toJSON: () => ({}) });
  document.body.append(element);
  return element;
}

function pointer(type: string, x: number, pointerType = 'mouse') {
  return new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, pointerId: 7, pointerType, button: 0 });
}

describe('ui-image-comparison', () => {
  it('initializes split position and slider semantics without clipping the host', () => {
    const element = mount();
    expect(element.value).toBe(40);
    expect(element.getAttribute('ui-value')).toBe('40');
    expect(element.style.getPropertyValue('--ui-value')).toBe('40');
    expect(element.style.getPropertyValue('--ui-image-comparison-position')).toBe('40%');
    expect(element.style.clipPath).toBe('');
    expect(element.getAttribute('role')).toBe('slider');
    expect(element.getAttribute('aria-valuenow')).toBe('40');
  });

  it('supports click, mouse drag, and releases the gesture on pointerup', () => {
    const element = mount();
    const onChange = vi.fn();
    element.addEventListener('ui-image-comparison-change', onChange);
    element.dispatchEvent(pointer('pointerdown', 150));
    expect(element.value).toBe(25);
    element.dispatchEvent(pointer('pointermove', 260));
    expect(element.value).toBe(80);
    element.dispatchEvent(pointer('pointerup', 300));
    expect(element.value).toBe(100);
    element.dispatchEvent(pointer('pointermove', 100));
    expect(element.value).toBe(100);
    expect(onChange).toHaveBeenCalled();
    expect((onChange.mock.calls.at(-1)?.[0] as CustomEvent).detail).toEqual({ value: 100 });
  });

  it('supports touch pointers and keyboard steps', () => {
    const element = mount();
    element.dispatchEvent(pointer('pointerdown', 120, 'touch'));
    element.dispatchEvent(pointer('pointermove', 220, 'touch'));
    element.dispatchEvent(pointer('pointerup', 220, 'touch'));
    expect(element.value).toBe(60);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(element.value).toBe(55);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
    expect(element.value).toBe(65);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(element.value).toBe(0);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(element.value).toBe(100);
  });

  it('accepts external values and resets when ui-observed changes', () => {
    const element = mount();
    element.setAttribute('ui-value', '75');
    expect(element.style.getPropertyValue('--ui-value')).toBe('75');
    expect(element.getAttribute('aria-valuenow')).toBe('75');
    element.setAttribute('ui-value', '110');
    expect(element.getAttribute('ui-value')).toBe('100');
    expect(element.getAttribute('aria-valuenow')).toBe('100');
    element.setAttribute('ui-observed', 'reload-1');
    expect(element.value).toBe(40);
  });

  it('starts the spring on viewport entry and lets pointer input take over', () => {
    let deliver: IntersectionObserverCallback = () => {};
    const frames: FrameRequestCallback[] = [];
    class MockObserver {
      constructor(callback: IntersectionObserverCallback) { deliver = callback; }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('IntersectionObserver', MockObserver);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    try {
      const element = document.createElement('ui-image-comparison') as UiImageComparison;
      element.setAttribute('ui-animate', '');
      element.setAttribute('ui-default-percent', '60');
      element.getBoundingClientRect = () => ({ left: 0, right: 200, top: 0, bottom: 150, width: 200, height: 150, x: 0, y: 0, toJSON: () => ({}) });
      document.body.append(element);
      expect(element.style.getPropertyValue('--ui-value')).toBe('0');
      deliver([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      while (frames.length && element.style.getPropertyValue('--ui-value') === '0') frames.shift()!(0);
      expect(Number(element.style.getPropertyValue('--ui-value'))).toBeGreaterThan(0);
      element.dispatchEvent(pointer('pointerdown', 150));
      expect(element.value).toBe(75);
      expect(element.style.getPropertyValue('--ui-value')).toBe('75');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

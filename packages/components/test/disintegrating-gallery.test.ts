import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { directionalTileProgress } from '../src/disintegrating-gallery.js';

const context = { setTransform: vi.fn(), clearRect: vi.fn(), drawImage: vi.fn(), globalAlpha: 1 };
let frames: FrameRequestCallback[];

beforeEach(() => {
  document.body.innerHTML = '';
  frames = [];
  context.drawImage.mockReset();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { frames.push(callback); return frames.length; });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn() }));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
});

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.innerHTML = ''; });

function gallery(): HTMLElement & { moveBy(pixels: number): void } {
  const element = document.createElement('ui-disintegrating-gallery') as HTMLElement & { moveBy(pixels: number): void };
  Object.defineProperty(element, 'clientWidth', { value: 900 });
  Object.defineProperty(element, 'clientHeight', { value: 480 });
  const item = document.createElement('ui-disintegrating-gallery-item');
  const image = document.createElement('img');
  image.alt = 'Coast';
  Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 800 }, naturalHeight: { value: 600 } });
  item.append(image);
  element.append(item);
  document.body.append(element);
  return element;
}

describe('ui-disintegrating-gallery', () => {
  it('advances the dissolve across the image from the outer edge', () => {
    expect(directionalTileProgress(.5, 0, 10, -1)).toBeGreaterThan(.9);
    expect(directionalTileProgress(.5, 9, 10, -1)).toBe(0);
    expect(directionalTileProgress(.5, 9, 10, 1)).toBeGreaterThan(.9);
    expect(directionalTileProgress(.5, 0, 10, 1)).toBe(0);
    for (let col = 0; col < 10; col++) {
      expect(directionalTileProgress(1, col, 10, -1, .5)).toBe(1);
      expect(directionalTileProgress(1, col, 10, 1, -.5)).toBe(1);
    }
  });

  it('shrinks and fades individual image tiles while they scatter', () => {
    const draws: { width: number; alpha: number }[] = [];
    context.drawImage.mockImplementation((...args: unknown[]) => {
      draws.push({ width: Number(args[7]), alpha: context.globalAlpha });
    });
    gallery();
    expect(draws.some(({ width, alpha }) => width > 0 && width < 12 && alpha > 0 && alpha < 1)).toBe(true);
  });

  it('advances automatically across successive animation frames', () => {
    gallery();
    const fullCardX = () => context.drawImage.mock.calls.find((call) => call[7] === 280 && call[8] === 360)?.[5] as number;
    const initialX = fullCardX();
    expect(frames).toHaveLength(1);
    frames.shift()?.(1000);
    context.drawImage.mockClear();
    frames.shift()?.(1016);
    expect(fullCardX()).toBeLessThan(initialX);
    expect(frames).toHaveLength(1);
  });

  it('keeps source images accessible while drawing the assembled center image', () => {
    const element = gallery();
    expect(element.hasAttribute('data-ready')).toBe(true);
    expect(element.querySelector('img')?.alt).toBe('Coast');
    expect(element.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(context.drawImage).toHaveBeenCalled();
    expect(element.tabIndex).toBe(0);
  });

  it('allows manual movement and cleans up generated canvas and animation on disconnect', () => {
    const element = gallery();
    const initial = context.drawImage.mock.calls.length;
    element.moveBy(120);
    expect(context.drawImage.mock.calls.length).toBeGreaterThan(initial);
    element.remove();
    expect(element.querySelector('canvas')).toBeNull();
    expect(element.hasAttribute('data-ready')).toBe(false);
    expect(element.hasAttribute('tabindex')).toBe(false);
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('uses the mouse wheel to scroll the gallery', () => {
    const element = gallery();
    const before = context.drawImage.mock.calls.length;
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 80 });
    expect(element.dispatchEvent(wheel)).toBe(false);
    expect(context.drawImage.mock.calls.length).toBeGreaterThan(before);
  });

  it('turns off autoplay for reduced motion while preserving keyboard movement', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn() }));
    const element = gallery();
    expect(frames).toHaveLength(0);
    const before = context.drawImage.mock.calls.length;
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(context.drawImage.mock.calls.length).toBeGreaterThan(before);
    expect(frames).toHaveLength(0);
  });

  it('keeps the native image fallback and avoids an animation loop when an image fails', () => {
    const element = document.createElement('ui-disintegrating-gallery');
    Object.defineProperty(element, 'clientWidth', { value: 900 });
    Object.defineProperty(element, 'clientHeight', { value: 480 });
    const item = document.createElement('ui-disintegrating-gallery-item');
    const image = document.createElement('img');
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 0 } });
    item.append(image); element.append(item); document.body.append(element);
    expect(element.hasAttribute('data-ready')).toBe(false);
    expect(element.querySelector('img')).toBe(image);
    expect(frames).toHaveLength(0);
  });
});

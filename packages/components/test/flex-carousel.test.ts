import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/flex-carousel.js';
import type { UiFlexCarousel } from '../src/flex-carousel.js';

const disconnectResize = vi.fn();
const disconnectIntersection = vi.fn();
const disconnectMutation = vi.fn();
let motionChange: ((event: MediaQueryListEvent) => void) | null = null;
let reduced = true;

beforeEach(() => {
  reduced = true;
  motionChange = null;
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    get matches() { return reduced; },
    addEventListener: vi.fn((_type: string, handler: (event: MediaQueryListEvent) => void) => { motionChange = handler; }),
    removeEventListener: vi.fn(),
  })));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() { disconnectResize(); } });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() { disconnectIntersection(); } });
  vi.stubGlobal('MutationObserver', class { observe() {} disconnect() { disconnectMutation(); } });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 800, bottom: 500, width: 800, height: 500, toJSON: () => ({}) });
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); disconnectResize.mockClear(); disconnectIntersection.mockClear(); disconnectMutation.mockClear(); });

function make(): UiFlexCarousel {
  const element = document.createElement('ui-flex-carousel') as UiFlexCarousel;
  for (const [title, alt] of [['First', 'First photo'], ['Second', 'Second photo'], ['Third', 'Third photo']]) {
    const item = document.createElement('ui-flex-carousel-item');
    item.setAttribute('ui-title', title!);
    const image = document.createElement('img'); image.src = `/images/${title}.jpg`; image.alt = alt!;
    item.append(image); element.append(item);
  }
  document.body.append(element);
  return element;
}

describe('ui-flex-carousel', () => {
  it('keeps the image row readable when motion is reduced and normalizes enum values', () => {
    const carousel = make();
    expect(carousel.hasAttribute('data-ready')).toBe(false);
    expect(carousel.length).toBe(3);
    expect(carousel.preset).toBe('liquid');
    carousel.setAttribute('ui-preset', 'unknown');
    expect(carousel.preset).toBe('liquid');
    carousel.fit = 'square';
    expect(carousel.fit).toBe('square');
    expect(carousel.getAttribute('role')).toBe('region');
    expect(carousel.getAttribute('aria-roledescription')).toBe('carousel');
    expect(carousel.querySelectorAll('ui-flex-carousel-item img')).toHaveLength(3);
  });

  it('updates authored items, supports navigation and emits selection detail', () => {
    const carousel = make();
    const selected: number[] = [];
    carousel.addEventListener('ui:flex-carousel:select', event => selected.push((event as CustomEvent<{index: number}>).detail.index));
    carousel.goTo(2);
    expect(carousel.index).toBe(2);
    carousel.open();
    expect(selected).toEqual([2]);
    expect(carousel.hasAttribute('data-focused')).toBe(true);
    carousel.close();
    expect(carousel.hasAttribute('data-focused')).toBe(false);
    const item = document.createElement('ui-flex-carousel-item');
    item.innerHTML = '<img src="/images/new.jpg" alt="New">';
    carousel.append(item);
    carousel.refresh();
    expect(carousel.length).toBe(4);
  });

  it('keeps the current card centered when its real image ratio arrives', () => {
    const carousel = make();
    const internal = carousel as unknown as {
      width: number; height: number; pos: number; goal: number;
      slides: { image: HTMLImageElement }[];
      metrics(): { centers: number[] };
    };
    internal.width = 800;
    internal.height = 500;
    internal.pos = internal.goal = internal.metrics().centers[0]!;
    const image = internal.slides[0]!.image;
    Object.defineProperties(image, {
      naturalWidth: { configurable: true, value: 800 },
      naturalHeight: { configurable: true, value: 1108 },
    });
    image.onload?.(new Event('load'));
    expect(internal.pos).toBeCloseTo(internal.metrics().centers[0]!);
    expect(internal.goal).toBeCloseTo(internal.pos);
  });

  it('releases observers, image handlers and generated state on disconnect, then reconnects', () => {
    const carousel = make();
    const images = (carousel as unknown as { slides: { image: HTMLImageElement }[] }).slides.map(slide => slide.image);
    carousel.remove();
    expect(disconnectResize).toHaveBeenCalledTimes(1);
    expect(disconnectIntersection).toHaveBeenCalledTimes(1);
    expect(disconnectMutation).toHaveBeenCalledTimes(1);
    expect(images.every(image => image.onload === null && image.onerror === null)).toBe(true);
    document.body.append(carousel);
    expect(carousel.length).toBe(3);
  });

  it('switches into fallback when reduced motion turns on', () => {
    const carousel = make();
    reduced = false;
    motionChange?.({ matches: true } as MediaQueryListEvent);
    expect(carousel.hasAttribute('data-ready')).toBe(false);
    expect(carousel.querySelectorAll('ui-flex-carousel-item')).toHaveLength(3);
  });

  it('moves continuously after the drag threshold and accumulates small wheel deltas', () => {
    const carousel = make();
    const internal = carousel as unknown as {
      gpu: object | null; width: number; height: number; pos: number; goal: number; visible: boolean;
      metrics(): { centers: number[] }; requestFrame(): void;
      onPointerDown(event: PointerEvent): void; onPointerMove(event: PointerEvent): void;
      onWheel(event: WheelEvent): void;
    };
    internal.gpu = {};
    internal.width = 800; internal.height = 500;
    internal.pos = internal.goal = internal.metrics().centers[0]!;
    vi.spyOn(internal, 'requestFrame').mockImplementation(() => {});
    const start = internal.pos;
    internal.onPointerDown({ button: 0, pointerId: 1, clientX: 400, clientY: 250 } as PointerEvent);
    internal.onPointerMove({ pointerId: 1, pointerType: 'mouse', clientX: 394, clientY: 250 } as PointerEvent);
    expect(internal.pos).toBeCloseTo(start + 1);
    internal.onPointerMove({ pointerId: 1, pointerType: 'mouse', clientX: 390, clientY: 250 } as PointerEvent);
    expect(internal.pos).toBeCloseTo(start + 5);
    internal.onWheel({ deltaX: 0, deltaY: 8, deltaMode: 0, preventDefault: vi.fn() } as unknown as WheelEvent);
    internal.onWheel({ deltaX: 0, deltaY: 8, deltaMode: 0, preventDefault: vi.fn() } as unknown as WheelEvent);
    expect(internal.goal).toBeCloseTo(start + 21);
    internal.visible = false;
    carousel.goTo(1);
    expect(carousel.index).toBe(1);
    expect(internal.pos).toBeCloseTo(internal.goal);
    internal.gpu = null;
  });
});

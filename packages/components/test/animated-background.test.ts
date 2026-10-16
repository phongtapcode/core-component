import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backgroundItems } from '../src/animated-background.js';
import { UiAnimatedBackground, UiBackground } from '../src/animated-background.js';

const fillText = vi.fn();
const fill = vi.fn();

class VisibleObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
  disconnect(): void {}
  unobserve(): void {}
}

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  vi.stubGlobal('IntersectionObserver', VisibleObserver);
  vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
    clearRect: () => undefined, setTransform: () => undefined, save: () => undefined, restore: () => undefined,
    measureText: () => ({ width: 170 }), fillText, fill, beginPath: () => undefined, arc: () => undefined,
    getImageData: (_x: number, _y: number, width: number, height: number) => {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) data[(y * width + x) * 4 + 3] = 255;
      return { data };
    },
  })) as HTMLCanvasElement['getContext']);
});

afterEach(() => {
  document.body.innerHTML = '';
  Reflect.deleteProperty(document, 'hidden');
  fillText.mockClear();
  fill.mockClear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ui-animated-background particle morph', () => {
  it('registers both names with the same API and preserves the legacy canvas hook', () => {
    expect(customElements.get('ui-animated-background')).toBe(UiAnimatedBackground);
    expect(customElements.get('ui-background')).toBe(UiBackground);
    const current = document.createElement('ui-animated-background') as UiAnimatedBackground;
    const legacy = document.createElement('ui-background') as UiBackground;
    expect(current).toBeInstanceOf(UiAnimatedBackground);
    expect(legacy).toBeInstanceOf(UiAnimatedBackground);
    legacy.texts = ['OLD'];
    document.body.append(current, legacy);
    expect(legacy.texts).toEqual(['OLD']);
    expect(legacy.querySelectorAll('canvas')).toHaveLength(1);
    expect(legacy.querySelector('.ui-background__canvas')).not.toBeNull();
    expect(current.querySelector('.ui-animated-background__canvas')).not.toBeNull();
  });

  it('parses JSON and sample-style single-quoted arrays', () => {
    expect(backgroundItems('["Hello","World"]', [])).toEqual(['Hello', 'World']);
    expect(backgroundItems("['M 0,0 Z', 'M 1,1 Z']", [])).toEqual(['M 0,0 Z', 'M 1,1 Z']);
    expect(backgroundItems(String.raw`['John\'s notes', 'World']`, [])).toEqual(["John's notes", 'World']);
    expect(backgroundItems('["Designer\'s notes","World"]', [])).toEqual(["Designer's notes", 'World']);
    expect(backgroundItems(null, ['default'])).toEqual(['default']);
  });

  it('reflects typed arrays to the legacy attributes and accepts attribute updates', () => {
    const background = document.createElement('ui-animated-background') as UiAnimatedBackground;
    background.texts = ["Designer's notes", 'MOTION'];
    background.svgPaths = ['M 0,0 H 100 V 100 H 0 Z'];
    background.colors = ['#ffffff', '#ffeb3b'];
    expect(JSON.parse(background.getAttribute('ui-texts')!)).toEqual(background.texts);
    expect(JSON.parse(background.getAttribute('ui-svg-paths')!)).toEqual(background.svgPaths);
    expect(JSON.parse(background.getAttribute('ui-colors')!)).toEqual(background.colors);
    expect(() => { background.texts = ['valid', 1] as unknown as string[]; }).toThrow(TypeError);
    background.setAttribute('ui-texts', '["OLD","MARKUP"]');
    expect(background.texts).toEqual(['OLD', 'MARKUP']);
    background.texts = [];
    expect(background.texts).toEqual([]);
    background.colors.push('#000000');
    expect(background.colors).toEqual(['#ffffff', '#ffeb3b']);
  });

  it('samples text into one canvas layer, tracks the chosen mouse area, and cleans up', () => {
    const section = document.createElement('section');
    section.className = 'scene';
    const background = document.createElement('ui-animated-background') as UiAnimatedBackground;
    background.setAttribute('ui-texts', '["HELLO","WORLD"]');
    background.setAttribute('ui-particle-count', '120');
    background.setAttribute('ui-mouse-container', '.scene');
    vi.spyOn(background, 'getBoundingClientRect').mockReturnValue({ left: 20, top: 30, width: 400, height: 240 } as DOMRect);
    section.append(background);
    document.body.append(section);

    const state = background as unknown as { particles: unknown[]; mouse: { x: number; y: number } };
    expect(background.querySelectorAll('canvas')).toHaveLength(1);
    expect(background.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(state.particles).toHaveLength(120);
    expect(fillText).toHaveBeenCalledTimes(2);

    section.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 90, pointerType: 'mouse' }));
    expect(state.mouse).toEqual({ x: 80, y: 60 });
    section.dispatchEvent(new PointerEvent('pointerleave'));
    expect(state.mouse.x).toBe(-10000);

    background.remove();
    expect(background.querySelector('canvas')).toBeNull();
    expect(state.particles).toHaveLength(0);
  });

  it('changes target words after the configured morph interval', () => {
    const background = document.createElement('ui-animated-background') as UiAnimatedBackground;
    background.setAttribute('ui-texts', '["ONE","TWO"]');
    background.setAttribute('ui-particle-count', '50');
    background.setAttribute('ui-morph-duration', '.3');
    vi.spyOn(background, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 200 } as DOMRect);
    document.body.append(background);
    const state = background as unknown as { currentIndex: number; morphStart: number; paint(time: number): void };
    expect(state.currentIndex).toBe(0);
    state.paint(state.morphStart + 301);
    expect(state.currentIndex).toBe(1);
  });

  it('updates motion and colors without rebuilding particles while sliders move', () => {
    const background = document.createElement('ui-animated-background') as UiAnimatedBackground;
    background.setAttribute('ui-texts', '["TEST"]');
    background.setAttribute('ui-particle-count', '50');
    vi.spyOn(background, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 200 } as DOMRect);
    document.body.append(background);
    const state = background as unknown as { particles: Array<{ color: string }> };
    const original = state.particles;
    background.setAttribute('ui-turbulence', '1.4');
    background.setAttribute('ui-influence-radius', '260');
    background.setAttribute('ui-morph-duration', '5');
    expect(state.particles).toBe(original);
    background.setAttribute('ui-colors', '["#ff0000"]');
    expect(state.particles).toBe(original);
    expect(state.particles.every((particle) => particle.color === '#ff0000')).toBe(true);
    background.setAttribute('ui-particle-count', '100');
    expect(state.particles).not.toBe(original);
    expect(state.particles).toHaveLength(100);
  });

  it('switches reduced motion live and releases the preference listener on disconnect', () => {
    const preference = Object.assign(new EventTarget(), { matches: false }) as MediaQueryList & { matches: boolean };
    const removeListener = vi.spyOn(preference, 'removeEventListener');
    vi.stubGlobal('matchMedia', vi.fn(() => preference));
    const background = document.createElement('ui-animated-background') as UiAnimatedBackground;
    background.texts = ['TEST'];
    vi.spyOn(background, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 200 } as DOMRect);
    document.body.append(background);
    const frames = vi.mocked(requestAnimationFrame);
    const framesBeforeReduce = frames.mock.calls.length;
    preference.matches = true;
    preference.dispatchEvent(new Event('change'));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(frames.mock.calls.length).toBe(framesBeforeReduce);
    preference.matches = false;
    preference.dispatchEvent(new Event('change'));
    expect(frames.mock.calls.length).toBeGreaterThan(framesBeforeReduce);
    background.remove();
    expect(removeListener).toHaveBeenCalledWith('change', expect.any(Function));
    document.body.append(background);
    expect(background.querySelectorAll('canvas')).toHaveLength(1);
  });

  it('resamples on resize without recreating particles or replaying the intro', () => {
    const background = document.createElement('ui-animated-background') as UiAnimatedBackground;
    background.texts = ['ONE', 'TWO'];
    background.setAttribute('ui-particle-count', '50');
    let width = 300;
    vi.spyOn(background, 'getBoundingClientRect').mockImplementation(() =>
      ({ left: 0, top: 0, width, height: 200 } as DOMRect));
    document.body.append(background);
    const state = background as unknown as {
      particles: Array<{ fromX: number }>;
      introStart: number;
      morphStart: number;
      measure(): void;
    };
    const particles = state.particles;
    const initialX = particles[0]!.fromX;
    const introStart = state.introStart;
    const morphStart = state.morphStart;
    width = 450;
    state.measure();
    expect(state.particles).toBe(particles);
    expect(particles[0]!.fromX).toBeCloseTo(initialX * 1.5);
    expect(state.introStart).toBe(introStart);
    expect(state.morphStart).toBe(morphStart);
    expect(background.hasShapes).toBe(true);
    expect(fillText).toHaveBeenCalledTimes(4);
  });

  it('coalesces resize notifications and reports an empty shape set', () => {
    let notifyResize: ResizeObserverCallback | undefined;
    class ControlledResizeObserver {
      constructor(callback: ResizeObserverCallback) { notifyResize = callback; }
      observe(): void {}
      disconnect(): void {}
    }
    vi.stubGlobal('ResizeObserver', ControlledResizeObserver);
    const frames = new Map<number, FrameRequestCallback>();
    let nextFrame = 0;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
    const background = document.createElement('ui-animated-background') as UiAnimatedBackground;
    background.texts = ['FIRST', 'SECOND'];
    let width = 300;
    vi.spyOn(background, 'getBoundingClientRect').mockImplementation(() =>
      ({ left: 0, top: 0, width, height: 200 } as DOMRect));
    document.body.append(background);
    expect(fillText).toHaveBeenCalledTimes(2);
    width = 420;
    notifyResize?.([], {} as ResizeObserver);
    notifyResize?.([], {} as ResizeObserver);
    const resizeFrame = (background as unknown as { resizeFrame: number }).resizeFrame;
    expect(resizeFrame).toBeGreaterThan(0);
    frames.get(resizeFrame)?.(performance.now());
    expect(fillText).toHaveBeenCalledTimes(4);
    background.texts = [];
    background.svgPaths = [];
    expect(background.hasShapes).toBe(false);
    expect(background.getAttribute('data-state')).toBe('empty');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/dot-morph.js';

type Particle = { x: number; y: number; startX: number; startY: number };
const particlesOf = (element: HTMLElement): Particle[] =>
  (element as unknown as { particles: Particle[] }).particles;

beforeEach(() => {
  document.body.innerHTML = '';
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
    font: '', textAlign: '', textBaseline: '', fillStyle: '', shadowBlur: 0, shadowColor: '',
    measureText: () => ({ width: 120 }),
    fillText: () => undefined,
    setTransform: () => undefined,
    clearRect: () => undefined,
    beginPath: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    getImageData: (_x: number, _y: number, width: number, height: number) => {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y += 3) {
        for (let x = 0; x < width; x += 3) data[(y * width + x) * 4 + 3] = 255;
      }
      return { data };
    },
  })) as HTMLCanvasElement['getContext']);
});

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('ui-dot-morph', () => {
  it('keeps all particles but scatters most beyond the field', () => {
    const morph = document.createElement('ui-dot-morph');
    morph.setAttribute('ui-text', 'HELLO');
    morph.setAttribute('ui-count', '320');
    Object.defineProperties(morph, {
      clientWidth: { value: 240 },
      clientHeight: { value: 100 },
    });
    document.body.append(morph);

    const particles = particlesOf(morph);
    expect(particles).toHaveLength(320);
    expect(morph.querySelectorAll('canvas')).toHaveLength(1);
    expect(morph.querySelectorAll('.ui-dot-morph-dot')).toHaveLength(0);
    expect(morph.getAttribute('aria-label')).toBe('HELLO');
    expect(particles.filter((dot) => dot.startX < 0 || dot.startX > 240 || dot.startY < 0 || dot.startY > 100).length).toBeGreaterThan(200);
    expect(particles.every((dot) => dot.x >= 0 && dot.x <= 240 && dot.y >= 0 && dot.y <= 100)).toBe(true);

    morph.dispatchEvent(new Event('pointerenter'));
    expect(morph.hasAttribute('ui-active')).toBe(true);
    morph.dispatchEvent(new Event('pointerleave'));
    expect(morph.hasAttribute('ui-active')).toBe(false);
  });

  it('updates the word and supports keyboard focus', async () => {
    const morph = document.createElement('ui-dot-morph');
    morph.setAttribute('ui-count', '32');
    document.body.append(morph);
    morph.setAttribute('ui-text', 'WORLD');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(morph.getAttribute('aria-label')).toBe('WORLD');
    expect(morph.querySelector('.ui-dot-morph-fallback')?.textContent).toBe('WORLD');
    morph.focus();
    expect(morph.hasAttribute('ui-active')).toBe(true);
    morph.blur();
    expect(morph.hasAttribute('ui-active')).toBe(false);
  });

  it('adapts particle count to the text area without adding DOM nodes', () => {
    const morph = document.createElement('ui-dot-morph');
    Object.defineProperties(morph, {
      clientWidth: { value: 240 },
      clientHeight: { value: 100 },
    });
    document.body.append(morph);
    expect(particlesOf(morph).length).toBeGreaterThan(800);
    expect(morph.children).toHaveLength(2);
  });

  it('reverses repeated hover changes on one animation loop', () => {
    const morph = document.createElement('ui-dot-morph');
    morph.setAttribute('ui-count', '32');
    document.body.append(morph);
    const frames = vi.spyOn(globalThis, 'requestAnimationFrame');
    for (let index = 0; index < 10; index++) {
      morph.dispatchEvent(new Event('pointerenter'));
      morph.dispatchEvent(new Event('pointerleave'));
    }
    expect(frames).toHaveBeenCalledTimes(1);
    expect(morph.querySelectorAll('canvas')).toHaveLength(1);
    expect(morph.hasAttribute('ui-active')).toBe(false);
  });

  it('cycles an array of words after the hold interval and resets on leave', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const morph = document.createElement('ui-dot-morph');
    morph.setAttribute('ui-text', '["ONE","TWO","THREE"]');
    morph.setAttribute('ui-count', '32');
    morph.setAttribute('ui-duration', '0');
    morph.setAttribute('ui-interval', '100');
    document.body.append(morph);
    const state = morph as unknown as { tick: (time: number) => void; motion: { start: number } | null; wordIndex: number };

    expect(morph.getAttribute('aria-label')).toBe('ONE, TWO, THREE');
    morph.dispatchEvent(new Event('pointerenter'));
    state.tick(state.motion!.start + 2);
    expect(state.wordIndex).toBe(0);
    vi.advanceTimersByTime(100);
    expect(state.wordIndex).toBe(1);
    expect(morph.querySelector('.ui-dot-morph-fallback')?.textContent).toBe('TWO');
    state.tick(state.motion!.start + 2);
    vi.advanceTimersByTime(100);
    expect(state.wordIndex).toBe(2);
    state.tick(state.motion!.start + 2);
    vi.advanceTimersByTime(100);
    expect(state.wordIndex).toBe(0);

    morph.dispatchEvent(new Event('pointerleave'));
    state.tick(state.motion!.start + 2);
    vi.advanceTimersByTime(500);
    expect(state.wordIndex).toBe(0);
    expect(morph.hasAttribute('ui-active')).toBe(false);
  });

  it('shows readable text if Canvas is unavailable', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation((() => null) as HTMLCanvasElement['getContext']);
    const morph = document.createElement('ui-dot-morph');
    morph.setAttribute('ui-text', 'ACCESSIBLE');
    document.body.append(morph);
    expect(morph.hasAttribute('data-ui-dot-fallback')).toBe(true);
    expect(morph.querySelector('.ui-dot-morph-fallback')?.textContent).toBe('ACCESSIBLE');
    expect(particlesOf(morph)).toHaveLength(0);
  });
});

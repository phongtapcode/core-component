import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleLogoPixels } from '../src/logo-assembly.js';
import type { UiLogoAssembly } from '../src/logo-assembly.js';

class FakeImage {
  naturalWidth = 200;
  naturalHeight = 100;
  crossOrigin = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private value = '';
  get src(): string { return this.value; }
  set src(value: string) { this.value = value; queueMicrotask(() => this.onload?.()); }
}

let drawnSource = '';
beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  vi.stubGlobal('Image', FakeImage);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
    setTransform: () => undefined,
    clearRect: () => undefined,
    drawImage: (image: FakeImage) => { drawnSource = image.src; },
    getImageData: (_x: number, _y: number, width: number, height: number) => {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let y = Math.floor(height * .3); y < height * .7; y += 2) {
        for (let x = Math.floor(width * .3); x < width * .7; x += 2) {
          const offset = (y * width + x) * 4;
          data[offset] = drawnSource.includes('second') ? 0 : 255;
          data[offset + 2] = drawnSource.includes('second') ? 255 : 0;
          data[offset + 3] = 255;
        }
      }
      return { data };
    },
    beginPath: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
  })) as HTMLCanvasElement['getContext']);
});

afterEach(() => {
  document.body.innerHTML = '';
  Reflect.deleteProperty(document, 'hidden');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function createLogo(width = 600, height = 360, count = 300): UiLogoAssembly {
  const logo = document.createElement('ui-logo-assembly') as UiLogoAssembly;
  logo.setAttribute('ui-src', '/first.svg');
  logo.setAttribute('ui-auto', 'false');
  logo.setAttribute('ui-count', String(count));
  Object.defineProperties(logo, { clientWidth: { value: width }, clientHeight: { value: height } });
  document.body.append(logo);
  return logo;
}

describe('ui-logo-assembly', () => {
  it('samples only visible pixels and keeps their original colors', () => {
    const data = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 0, 0, 0,
      0, 0, 255, 255, 0, 0, 0, 0,
    ]);
    const points = sampleLogoPixels(data, 2, 2, 12);
    expect(points).toHaveLength(12);
    expect(new Set(points.map((point) => point.color))).toEqual(new Set(['rgb(255 0 0)', 'rgb(0 0 255)']));
    expect(points.every((point) => point.alpha === 1)).toBe(true);
  });

  it('spreads samples across the whole opaque image instead of leaving random empty patches', () => {
    const data = new Uint8ClampedArray(100 * 100 * 4);
    for (let offset = 0; offset < data.length; offset += 4) {
      data[offset] = 64;
      data[offset + 3] = 255;
    }
    const points = sampleLogoPixels(data, 100, 100, 400);
    const occupied = new Set(points.map(({ x, y }) => `${Math.floor(x / 10)},${Math.floor(y / 10)}`));
    expect(points).toHaveLength(400);
    expect(occupied.size).toBe(100);
  });

  it('increases particle footprint for a broad uploaded logo without requiring more particles', async () => {
    const logo = createLogo();
    await logo.setLogo('/first.svg');
    const particles = (logo as unknown as { particles: Array<{ radius: number }> }).particles;
    expect(Math.min(...particles.map(({ radius }) => radius))).toBeGreaterThan(2);
    logo.setAttribute('ui-particle-size', '2.5');
    expect(Math.min(...particles.map(({ radius }) => radius))).toBeGreaterThan(3);
  });

  it('assembles, explodes, and morphs existing particles into a new colored logo', async () => {
    const logo = createLogo();
    await logo.setLogo('/first.svg');
    expect(logo.particleCount).toBe(300);
    expect(logo.state).toBe('scattered');
    const particles = (logo as unknown as { particles: Array<{ color: string; homeX: number; vx: number }> }).particles;
    const firstParticle = particles[0]!;
    expect(firstParticle.color).toBe('rgb(255 0 0)');

    logo.assemble();
    expect(logo.state).toBe('assembling');
    const internals = logo as unknown as { tick: (time: number) => void; assemblyStart: number; explosionUntil: number; visible: boolean };
    internals.visible = true;
    internals.tick(internals.assemblyStart + 2300 * 1.7);
    expect(logo.hasAttribute('ui-assembled')).toBe(true);

    logo.explode();
    expect(logo.state).toBe('exploding');
    expect(particles.some((particle) => Math.abs(particle.vx) > 1)).toBe(true);
    internals.tick(internals.explosionUntil + 1);
    expect(logo.state).toBe('assembling');

    await logo.setLogo('/second.svg');
    expect(logo.particleCount).toBe(300);
    expect(particles[0]).toBe(firstParticle);
    expect(firstParticle.color).toBe('rgb(0 0 255)');
    expect(logo.state).toBe('assembling');
  });

  it('rejects unsupported uploads before creating an object URL', async () => {
    const logo = createLogo();
    await expect(logo.loadFile(new File(['no'], 'bad.gif', { type: 'image/gif' }))).rejects.toThrow('SVG, PNG, or WebP');
  });

  it('caps particles on small screens and accepts a local SVG file', async () => {
    const createUrl = vi.fn(() => 'blob:local-logo');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: createUrl, revokeObjectURL: revokeUrl }));
    const logo = createLogo(420, 280, 6000);
    await logo.setLogo('/first.svg');
    expect(logo.particleCount).toBe(1500);
    await logo.loadFile(new File(['<svg/>'], 'mark.svg', { type: 'image/svg+xml' }));
    expect(logo.getAttribute('ui-src')).toBe('blob:local-logo');
    expect(createUrl).toHaveBeenCalledTimes(1);
    logo.remove();
    expect(revokeUrl).toHaveBeenCalledWith('blob:local-logo');
  });

  it('pushes particles away from the pointer and attracts them home after leave', async () => {
    const logo = createLogo();
    await logo.setLogo('/first.svg');
    const internals = logo as unknown as {
      particles: Array<{ x: number; y: number; homeX: number; homeY: number; vx: number; vy: number }>;
      mode: string;
      visible: boolean;
      tick: (time: number) => void;
    };
    internals.visible = true;
    internals.mode = 'assembled';
    const particle = internals.particles[0]!;
    particle.x = particle.homeX = 100;
    particle.y = particle.homeY = 100;
    particle.vx = 0;
    particle.vy = 0;
    logo.dispatchEvent(new PointerEvent('pointermove', { clientX: 97, clientY: 100 }));
    let time = performance.now();
    internals.tick(time += 16);
    expect(particle.x).toBeGreaterThan(101);
    logo.dispatchEvent(new PointerEvent('pointerleave'));
    for (let index = 0; index < 120; index++) internals.tick(time += 16);
    expect(Math.abs(particle.x - particle.homeX)).toBeLessThan(2);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { traceImageContours, UiImageTrace } from '../src/image-trace.js';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('Image Trace', () => {
  it('follows the boundary of a dark shape on a light image', () => {
    const width = 24, height = 24;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const value = x >= 6 && x < 18 && y >= 6 && y < 18 ? 20 : 240;
      pixels.set([value, value, value, 255], index);
    }
    const contours = traceImageContours(pixels, width, height);
    expect(contours.length).toBeGreaterThan(0);
    expect(contours[0]!.length).toBeGreaterThan(40);
    expect(contours[0]!.d).toContain('L');
  });

  it('retains small details across brightness levels', () => {
    const width = 120, height = 120;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const value = x % 12 < 6 && y % 12 < 6 ? 20 : 240;
      pixels.set([value, value, value, 255], (y * width + x) * 4);
    }
    const contours = traceImageContours(pixels, width, height);
    expect(contours.length).toBeGreaterThan(100);
    expect(contours.length).toBeLessThanOrEqual(320);
  });

  it('skips faint texture while keeping a clear edge', () => {
    const width = 80, height = 80;
    const pixels = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const faint = x % 10 < 5 && y % 10 < 5 ? 174 : 188;
      const value = x >= 20 && x < 60 && y >= 20 && y < 60 ? 20 : faint;
      pixels.set([value, value, value, 255], (y * width + x) * 4);
    }
    const all = traceImageContours(pixels, width, height, 320, 0);
    const clear = traceImageContours(pixels, width, height);
    expect(clear.length).toBeGreaterThan(0);
    expect(clear.length).toBeLessThan(all.length);
    for (const path of clear) {
      for (const match of path.d.matchAll(/[ML]([\d.]+) ([\d.]+)/g)) {
        expect(Number(match[1])).toBeGreaterThanOrEqual(18);
        expect(Number(match[1])).toBeLessThanOrEqual(61);
        expect(Number(match[2])).toBeGreaterThanOrEqual(18);
        expect(Number(match[2])).toBeLessThanOrEqual(61);
      }
    }
  });

  it('reveals the source image if the canvas cannot be read', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const trace = document.createElement('ui-image-trace') as UiImageTrace;
    const image = document.createElement('img');
    image.src = 'data:image/png;base64,AA==';
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 20 }, naturalHeight: { value: 20 } });
    trace.append(image);
    document.body.append(trace);
    expect(trace.getAttribute('data-state')).toBe('complete');
    expect(trace.querySelector('svg')).toBeNull();
  });

  it('draws generated paths before revealing the photo', () => {
    vi.useFakeTimers();
    try {
      const pixels = new Uint8ClampedArray(24 * 24 * 4);
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
        const value = x >= 6 && x < 18 && y >= 6 && y < 18 ? 20 : 240;
        pixels.set([value, value, value, 255], (y * 24 + x) * 4);
      }
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: () => undefined,
        getImageData: () => ({ data: pixels }),
      } as unknown as CanvasRenderingContext2D);
      const trace = document.createElement('ui-image-trace') as UiImageTrace;
      trace.setAttribute('ui-duration', '500');
      const image = document.createElement('img');
      Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 24 }, naturalHeight: { value: 24 } });
      trace.append(image);
      document.body.append(trace);
      expect(trace.getAttribute('data-state')).toBe('drawing');
      expect(trace.querySelectorAll('svg path').length).toBeGreaterThan(0);
      expect(trace.querySelector('svg path')?.getAttribute('pathLength')).toBe('1');
      expect(trace.querySelector('svg path')?.getAttribute('vector-effect')).toBe('non-scaling-stroke');
      vi.advanceTimersByTime(500);
      expect(trace.getAttribute('data-state')).toBe('complete');
      expect(trace.querySelector('svg')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

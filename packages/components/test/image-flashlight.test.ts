import { afterEach, describe, expect, it, vi } from 'vitest';
import { flashlightFrame, UiImageFlashlight } from '../src/image-flashlight.js';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Image Flashlight', () => {
  it('holds a small spotlight before expanding beyond the photo corners', () => {
    const width = 800, height = 450;
    const scanning = flashlightFrame(.5, width, height);
    const lingering = flashlightFrame(.66, width, height);
    const finished = flashlightFrame(1, width, height);
    expect(scanning.radius).toBeCloseTo(height * .26);
    expect(lingering.radius).toBeCloseTo(scanning.radius);
    expect(finished.radius).toBeGreaterThan(Math.hypot(width / 2, height / 2));
    expect(finished.x).toBe(width / 2);
    expect(finished.y).toBe(height / 2);
  });

  it('starts with a dark source, moves the soft reveal, then shows the full image', () => {
    const callbacks: FrameRequestCallback[] = [];
    const timers: Array<() => void> = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(window, 'setTimeout').mockImplementation((callback) => {
      if (typeof callback === 'function') timers.push(callback as () => void);
      return timers.length;
    });
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const viewport = window.innerHeight;
    let sectionBounds = { top: 0, bottom: viewport + 200, height: viewport + 200 };
    const section = document.createElement('section');
    Object.defineProperty(section, 'getBoundingClientRect', { value: () => sectionBounds });
    const flashlight = document.createElement('ui-image-flashlight') as UiImageFlashlight;
    flashlight.setAttribute('ui-loop', '');
    Object.defineProperty(flashlight, 'getBoundingClientRect', { value: () => ({ width: 800, height: 450 }) });
    const image = document.createElement('img');
    image.src = '/sample.jpg';
    image.alt = 'Sample photo';
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 800 }, naturalHeight: { value: 450 } });
    flashlight.append(image);
    section.append(flashlight);
    document.body.append(section);

    expect(flashlight.getAttribute('data-state')).toBe('waiting');
    sectionBounds = { top: -200, bottom: viewport, height: viewport + 200 };
    window.dispatchEvent(new Event('scroll'));
    expect(flashlight.getAttribute('data-state')).toBe('playing');
    const reveal = flashlight.querySelector<HTMLImageElement>('.ui-image-flashlight__reveal');
    expect(reveal?.getAttribute('aria-hidden')).toBe('true');
    expect(reveal?.alt).toBe('');
    callbacks.shift()?.(3150);
    expect(reveal?.style.maskImage).toContain('radial-gradient');
    callbacks.shift()?.(7000);
    expect(flashlight.getAttribute('data-state')).toBe('complete');
    expect(flashlight.querySelector('.ui-image-flashlight__reveal')).toBeNull();
    expect(image.alt).toBe('Sample photo');
    expect(timers).toHaveLength(1);
    timers[0]?.();
    expect(flashlight.getAttribute('data-state')).toBe('playing');
  });

  it('waits until a short section is fully inside the viewport', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const viewport = window.innerHeight;
    let sectionBounds = { top: viewport - 100, bottom: viewport + 350, height: 450 };
    const section = document.createElement('section');
    Object.defineProperty(section, 'getBoundingClientRect', { value: () => sectionBounds });
    const flashlight = document.createElement('ui-image-flashlight') as UiImageFlashlight;
    Object.defineProperty(flashlight, 'getBoundingClientRect', { value: () => ({ width: 800, height: 450 }) });
    const image = document.createElement('img');
    image.src = '/sample.jpg';
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 800 }, naturalHeight: { value: 450 } });
    flashlight.append(image);
    section.append(flashlight);
    document.body.append(section);
    expect(flashlight.getAttribute('data-state')).toBe('waiting');
    sectionBounds = { top: 100, bottom: 550, height: 450 };
    window.dispatchEvent(new Event('scroll'));
    expect(flashlight.getAttribute('data-state')).toBe('playing');
  });
});

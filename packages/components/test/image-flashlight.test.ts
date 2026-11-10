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

  it('follows the pointer in hover mode and restores the automatic scan when disabled', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const flashlight = document.createElement('ui-image-flashlight') as UiImageFlashlight;
    flashlight.setAttribute('ui-hover', '');
    Object.defineProperty(flashlight, 'getBoundingClientRect', { value: () => ({ left: 100, top: 200, width: 800, height: 450, bottom: 650 }) });
    const image = document.createElement('img');
    image.src = '/sample.jpg';
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 800 }, naturalHeight: { value: 450 } });
    flashlight.append(image);
    document.body.append(flashlight);

    expect(flashlight.getAttribute('data-state')).toBe('hover');
    expect(flashlight.tabIndex).toBe(0);
    const reveal = flashlight.querySelector<HTMLImageElement>('.ui-image-flashlight__reveal')!;
    expect(reveal.style.opacity).toBe('0');
    flashlight.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 350 }));
    callbacks.shift()?.(1000);
    expect(reveal.style.maskImage).toContain('at 200.0px 150.0px');
    expect(reveal.style.opacity).toBe('1');
    flashlight.dispatchEvent(new PointerEvent('pointermove', { clientX: 600, clientY: 350 }));
    callbacks.shift()?.(1250);
    const firstStep = Number(reveal.style.maskImage.match(/at ([\d.]+)px/)?.[1]);
    expect(firstStep).toBeGreaterThan(200);
    expect(firstStep).toBeLessThan(500);
    let frameTime = 1250;
    for (let frame = 0; callbacks.length && frame < 120; frame++) {
      frameTime += 17;
      callbacks.shift()?.(frameTime);
    }
    expect(callbacks).toHaveLength(0);
    expect(reveal.style.maskImage).toContain('at 500.0px 150.0px');
    flashlight.setAttribute('ui-hover-inertia', '0');
    flashlight.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 350 }));
    callbacks.shift()?.(frameTime + 17);
    expect(reveal.style.maskImage).toContain('at 300.0px 150.0px');
    flashlight.dispatchEvent(new PointerEvent('pointerleave'));
    expect(reveal.style.opacity).toBe('0');

    flashlight.removeAttribute('ui-hover');
    expect(flashlight.hasAttribute('tabindex')).toBe(false);
    expect(flashlight.getAttribute('data-state')).toBe('playing');
    expect(flashlight.querySelectorAll('.ui-image-flashlight__reveal')).toHaveLength(1);

    flashlight.setAttribute('ui-hover', '');
    flashlight.remove();
    expect(flashlight.querySelector('.ui-image-flashlight__reveal')).toBeNull();
    document.body.append(flashlight);
    expect(flashlight.getAttribute('data-state')).toBe('hover');
    expect(flashlight.querySelectorAll('.ui-image-flashlight__reveal')).toHaveLength(1);
  });

  it('expands from a click to reveal every corner, then returns to the pointer', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    const flashlight = document.createElement('ui-image-flashlight') as UiImageFlashlight;
    flashlight.setAttribute('ui-hover', '');
    flashlight.setAttribute('ui-hover-inertia', '0');
    Object.defineProperty(flashlight, 'getBoundingClientRect', {
      value: () => ({ left: 100, top: 200, width: 800, height: 450, bottom: 650 }),
    });
    const image = document.createElement('img');
    image.src = '/sample.jpg';
    Object.defineProperties(image, { complete: { value: true }, naturalWidth: { value: 800 }, naturalHeight: { value: 450 } });
    flashlight.append(image);
    document.body.append(flashlight);
    const reveal = flashlight.querySelector<HTMLImageElement>('.ui-image-flashlight__reveal')!;
    const radius = (): number => Number(reveal.style.maskImage.match(/radial-gradient\(circle ([\d.]+)px/)?.[1]);

    flashlight.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 350 }));
    callbacks.shift()?.(1000);
    expect(radius()).toBeCloseTo(117);
    flashlight.dispatchEvent(new MouseEvent('click', { clientX: 300, clientY: 350, detail: 1 }));
    callbacks.shift()?.(1300);
    expect(radius()).toBeGreaterThan(117);
    expect(reveal.style.maskImage).toContain('at 200.0px 150.0px');
    callbacks.shift()?.(1700);
    expect(radius()).toBeGreaterThan(Math.hypot(600, 300));
    flashlight.dispatchEvent(new PointerEvent('pointermove', { clientX: 600, clientY: 350 }));
    callbacks.shift()?.(2100);
    expect(radius()).toBeGreaterThan(117);
    callbacks.shift()?.(2350);
    expect(radius()).toBeCloseTo(117);
    expect(reveal.style.maskImage).toContain('at 500.0px 150.0px');
    expect(callbacks).toHaveLength(0);

    vi.mocked(performance.now).mockReturnValue(2500);
    flashlight.dispatchEvent(new MouseEvent('click', { clientX: 600, clientY: 350, detail: 1 }));
    flashlight.dispatchEvent(new PointerEvent('pointerleave'));
    callbacks.shift()?.(3200);
    expect(reveal.style.opacity).toBe('1');
    callbacks.shift()?.(3600);
    expect(radius()).toBeGreaterThan(117);
    callbacks.shift()?.(3850);
    expect(reveal.style.opacity).toBe('0');
    expect(callbacks).toHaveLength(0);
  });

  it('shows the full source image for reduced motion even with hover enabled', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const flashlight = document.createElement('ui-image-flashlight') as UiImageFlashlight;
    flashlight.setAttribute('ui-hover', '');
    const image = document.createElement('img');
    image.src = '/sample.jpg';
    flashlight.append(image);
    document.body.append(flashlight);
    expect(flashlight.getAttribute('data-state')).toBe('complete');
    expect(flashlight.querySelector('.ui-image-flashlight__reveal')).toBeNull();
  });
});

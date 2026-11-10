import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/orbit-gallery.js';

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const pointer = (type: string, x: number, time: number): PointerEvent => {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, isPrimary: true, pointerId: 1, pointerType: 'mouse', button: 0, clientX: x });
  Object.defineProperty(event, 'timeStamp', { value: time });
  return event;
};

describe('ui-orbit-gallery', () => {
  it('distributes cards around the ring and responds to added cards', async () => {
    const gallery = document.createElement('ui-orbit-gallery');
    gallery.innerHTML = '<ui-orbit-gallery-track><ui-orbit-gallery-item></ui-orbit-gallery-item><ui-orbit-gallery-item></ui-orbit-gallery-item></ui-orbit-gallery-track>';
    document.body.append(gallery);
    const track = gallery.querySelector<HTMLElement>('ui-orbit-gallery-track')!;
    expect(track.style.getPropertyValue('--ui-orbit-count')).toBe('2');

    track.append(document.createElement('ui-orbit-gallery-item'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(track.style.getPropertyValue('--ui-orbit-count')).toBe('3');
    expect(track.lastElementChild?.getAttribute('style')).toContain('--ui-orbit-index: 2');
  });

  it('accepts a rotation speed and direction', () => {
    const gallery = document.createElement('ui-orbit-gallery');
    gallery.innerHTML = '<ui-orbit-gallery-track><ui-orbit-gallery-item></ui-orbit-gallery-item></ui-orbit-gallery-track>';
    document.body.append(gallery);
    gallery.setAttribute('ui-duration', '18000');
    gallery.setAttribute('ui-direction', 'reverse');
    expect(gallery.style.getPropertyValue('--ui-orbit-duration')).toBe('18000ms');
    expect(gallery.querySelector<HTMLElement>('ui-orbit-gallery-track')!.style.animationDirection).toBe('reverse');
  });

  it('creates a correctly oriented back face for every card without duplicate accessible content', () => {
    const gallery = document.createElement('ui-orbit-gallery');
    gallery.innerHTML = '<ui-orbit-gallery-track><ui-orbit-gallery-item><img src="photo.jpg" alt="Mountain" /><span>Mountain</span></ui-orbit-gallery-item></ui-orbit-gallery-track>';
    document.body.append(gallery);
    const faces = gallery.querySelectorAll<HTMLElement>('ui-orbit-gallery-item > .ui-orbit-gallery-face');
    expect(faces).toHaveLength(2);
    expect(faces[0]!.querySelector('img')!.alt).toBe('Mountain');
    expect(faces[1]!.querySelector('img')!.alt).toBe('');
    expect(faces[1]!.getAttribute('aria-hidden')).toBe('true');
    expect(faces[1]!.inert).toBe(true);
  });

  it('drags the current rotation, coasts after release, and suppresses a dragged link click', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { callbacks.push(callback); return callbacks.length; });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const gallery = document.createElement('ui-orbit-gallery');
    gallery.innerHTML = '<ui-orbit-gallery-track><ui-orbit-gallery-item><a href="#elsewhere">Photo</a></ui-orbit-gallery-item></ui-orbit-gallery-track>';
    document.body.append(gallery);
    const track = gallery.querySelector<HTMLElement>('ui-orbit-gallery-track')!;
    const animation = { animationName: 'ui-orbit-spin', currentTime: 6000,
      effect: { getComputedTiming: () => ({ duration: 24000 }) } } as unknown as Animation;
    Object.defineProperty(track, 'getAnimations', { value: () => [animation] });
    Object.defineProperty(gallery, 'setPointerCapture', { value: () => undefined });

    gallery.dispatchEvent(pointer('pointerdown', 100, 100));
    gallery.dispatchEvent(pointer('pointermove', 200, 140));
    expect(gallery.hasAttribute('data-dragging')).toBe(true);
    expect(Number(animation.currentTime)).toBeCloseTo(6000 + 100 * .32 / 360 * 24000);
    gallery.querySelector('a')!.dispatchEvent(pointer('lostpointercapture', 200, 142));
    expect(gallery.hasAttribute('data-interacting')).toBe(true);
    gallery.dispatchEvent(pointer('pointerup', 200, 145));
    expect(callbacks).toHaveLength(1);
    const link = gallery.querySelector('a')!;
    expect(link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(false);
    callbacks.shift()?.(1000);
    callbacks.shift()?.(1016);
    expect(Number(animation.currentTime)).toBeGreaterThan(6000 + 100 * .32 / 360 * 24000);
    let now = 1016;
    for (let index = 0; callbacks.length && index < 160; index++) {
      now += 16;
      callbacks.shift()?.(now);
    }
    expect(callbacks).toHaveLength(0);
    expect(gallery.hasAttribute('data-interacting')).toBe(false);
    gallery.dispatchEvent(pointer('pointerdown', 100, 160));
    gallery.dispatchEvent(pointer('pointerup', 100, 165));
    expect(link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(true);
    gallery.setAttribute('ui-direction', 'reverse');
    animation.currentTime = 10000;
    gallery.dispatchEvent(pointer('pointerdown', 100, 200));
    gallery.dispatchEvent(pointer('pointermove', 150, 230));
    expect(Number(animation.currentTime)).toBeCloseTo(10000 - 50 * .32 / 360 * 24000);
    gallery.dispatchEvent(pointer('pointercancel', 150, 235));
    expect(gallery.hasAttribute('data-interacting')).toBe(false);
    gallery.dispatchEvent(pointer('pointerdown', 100, 300));
    gallery.dispatchEvent(pointer('pointermove', 200, 330));
    gallery.dispatchEvent(pointer('pointerup', 200, 335));
    expect(callbacks).toHaveLength(1);
    gallery.remove();
    callbacks.shift()?.(4000);
    expect(callbacks).toHaveLength(0);
    expect(gallery.hasAttribute('tabindex')).toBe(false);
  });

  it('keeps a visible coast after a slower hand drag', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => { callbacks.push(callback); return callbacks.length; });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const gallery = document.createElement('ui-orbit-gallery');
    gallery.innerHTML = '<ui-orbit-gallery-track><ui-orbit-gallery-item></ui-orbit-gallery-item></ui-orbit-gallery-track>';
    document.body.append(gallery);
    const track = gallery.querySelector<HTMLElement>('ui-orbit-gallery-track')!;
    const animation = { animationName: 'ui-orbit-spin', currentTime: 6000,
      effect: { getComputedTiming: () => ({ duration: 24000 }) } } as unknown as Animation;
    Object.defineProperty(track, 'getAnimations', { value: () => [animation] });
    Object.defineProperty(gallery, 'setPointerCapture', { value: () => undefined });

    gallery.dispatchEvent(pointer('pointerdown', 100, 100));
    gallery.dispatchEvent(pointer('pointermove', 140, 400));
    const releasedAt = Number(animation.currentTime);
    gallery.dispatchEvent(pointer('pointerup', 140, 480));
    callbacks.shift()?.(1000);
    for (let now = 1016; now <= 1336; now += 16) callbacks.shift()?.(now);
    expect(Number(animation.currentTime) - releasedAt).toBeGreaterThan(1000);
    expect(gallery.hasAttribute('data-interacting')).toBe(true);
  });

  it('rotates in reverse, supports arrow keys, and skips momentum for reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    const gallery = document.createElement('ui-orbit-gallery');
    gallery.setAttribute('ui-direction', 'reverse');
    gallery.innerHTML = '<ui-orbit-gallery-track><ui-orbit-gallery-item></ui-orbit-gallery-item></ui-orbit-gallery-track>';
    document.body.append(gallery);
    const track = gallery.querySelector<HTMLElement>('ui-orbit-gallery-track')!;
    Object.defineProperty(track, 'getAnimations', { value: () => [] });
    Object.defineProperty(gallery, 'setPointerCapture', { value: () => undefined });

    gallery.dispatchEvent(pointer('pointerdown', 100, 100));
    gallery.dispatchEvent(pointer('pointermove', 150, 130));
    gallery.dispatchEvent(pointer('pointerup', 150, 135));
    expect(track.style.getPropertyValue('--ui-orbit-manual-angle')).toBe('16.00deg');
    expect(raf).not.toHaveBeenCalled();
    gallery.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowLeft' }));
    expect(track.style.getPropertyValue('--ui-orbit-manual-angle')).toBe('-8.00deg');
    expect(gallery.hasAttribute('data-interacting')).toBe(false);
  });
});

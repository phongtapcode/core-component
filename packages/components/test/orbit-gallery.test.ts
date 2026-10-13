import { beforeEach, describe, expect, it } from 'vitest';
import '../src/orbit-gallery.js';

beforeEach(() => { document.body.innerHTML = ''; });

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
});

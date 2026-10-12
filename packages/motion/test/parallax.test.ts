import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';
import { parseKeyframes, parseParallaxBreakpoints, resolveKeyframes, resolveScrollPosition, sampleKeyframes } from '../src/parallax-utils.js';
import type { UiParallax, UiParallaxHover, UiParallaxScroll } from '../src/parallax.js';

const bounds = (top: number, height: number, width = 800): DOMRect => ({
  top, bottom: top + height, left: 0, right: width, width, height, x: 0, y: top, toJSON: () => ({}),
});

beforeEach(() => {
  document.body.innerHTML = '';
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
});

function mount(keyframes = "{'0%': { y: 0, scale: 1, opacity: 0 }, '100%': { y: 200, scale: 2, opacity: 1 }}") {
  const root = document.createElement('ui-parallax') as UiParallax;
  const item = document.createElement('ui-parallax-scroll') as UiParallaxScroll;
  root.getBoundingClientRect = () => bounds(0, 1000);
  item.setAttribute('ui-keyframes', keyframes);
  item.setAttribute('ui-lerp-ease', '1');
  root.appendChild(item);
  document.body.appendChild(root);
  root.refresh();
  return { root, item };
}

describe('ui-parallax keyframes', () => {
  it('parses the documented object syntax and interpolates numeric and unit values', () => {
    const frames = parseKeyframes("{'0%': { y: 0, width: '20vw' }, '100%': { y: 200, width: '100vw' },}");
    expect(sampleKeyframes(frames, 0.5)).toEqual({ y: 100, width: '60vw' });
    expect(sampleKeyframes(frames, 0.5, true)).toEqual({ y: 0, width: '20vw' });
  });

  it('selects the smallest matching max-width breakpoint', () => {
    const base = parseKeyframes("{'0%': {scale: 1}, '100%': {scale: 50}}");
    const points = parseParallaxBreakpoints("{1000: {'0%': {scale: 1}, '100%': {scale: 40}}, 600: {'0%': {scale: 1}, '100%': {scale: 20}}}");
    expect(sampleKeyframes(resolveKeyframes(base, points, 500), 1)['scale']).toBe(20);
    expect(sampleKeyframes(resolveKeyframes(base, points, 800), 1)['scale']).toBe(40);
    expect(sampleKeyframes(resolveKeyframes(base, points, 1200), 1)['scale']).toBe(50);
  });

  it('evaluates only approved arithmetic for start/end expressions', () => {
    const container = document.createElement('div');
    container.getBoundingClientRect = () => bounds(200, 1500);
    expect(resolveScrollPosition('offset - window.innerHeight / 2', container)).toBe(-300);
    expect(() => resolveScrollPosition('fetch("/secret")', container)).toThrow();
    expect(() => resolveScrollPosition('window.location.href', container)).toThrow();
  });

  it('maps container position to styles and restores them when disabled', () => {
    const { root, item } = mount();
    expect(root.progress).toBe(0.5);
    expect(item.style.transform).toContain('translate3d(0px, 100px, 0)');
    expect(item.style.opacity).toBe('0.5');
    item.render(0.5, true, false, true);
    expect(item.style.transform).toBe('');
    expect(item.style.opacity).toBe('');
  });

  it('uses custom start and end positions when calculating scroll progress', () => {
    const { root, item } = mount("{'0%': {opacity: 0}, '100%': {opacity: 1}}");
    item.setAttribute('ui-start', 'offset');
    item.setAttribute('ui-end', 'offset + 1000');
    root.getBoundingClientRect = () => bounds(-250, 1000);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 250 });
    root.refresh();
    expect(root.progress).toBe(0.625);
    expect(item.style.opacity).toBe('0.25');
  });

  it('smooths desktop scroll and uses immediate progress on mobile', () => {
    const { item } = mount("{'0%': {y: 0}, '100%': {y: 200}}");
    item.setAttribute('ui-lerp-ease', '0.5');
    expect(item.render(1, false, false, false)).toBe(true);
    expect(item.style.transform).toContain('translate3d(0px, 150px, 0)');
    expect(item.render(1, false, true, false)).toBe(false);
    expect(item.style.transform).toContain('translate3d(0px, 200px, 0)');
  });

  it('disables on mobile when requested and exposes custom interpolated values', () => {
    const { root, item } = mount("{'0%': {opacityCustom: 0}, '100%': {opacityCustom: 1}}");
    const callback = vi.fn(({ element, createValue }) => element.style.setProperty('opacity', String(createValue('opacityCustom'))));
    item.customEffects(callback);
    expect(callback).toHaveBeenCalled();
    expect(item.style.opacity).toBe('0.5');
    item.setAttribute('ui-mobile-disabled', '');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 });
    root.refresh();
    expect(item.style.opacity).toBe('');
    expect(item.render(0.5, false, true, true)).toBe(false);
  });

  it('clears old inline effects when a breakpoint changes the animated properties', () => {
    const { root, item } = mount("{'0%': {opacity: 0}, '100%': {opacity: 1}}");
    expect(item.style.opacity).toBe('0.5');
    item.setAttribute('ui-breakpoints', "{600: {'0%': {x: 0}, '100%': {x: 100}}}");
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    root.refresh();
    expect(item.style.opacity).toBe('');
    expect(item.style.transform).toContain('translate3d(50px');
  });

  it('restores image visibility after a group image sequence is disabled', () => {
    const { root, item } = mount("{'0%': {groupImg: 0}, '100%': {groupImg: 100}}");
    const first = document.createElement('img');
    const second = document.createElement('img');
    item.append(first, second);
    root.refresh();
    expect(first.hidden).toBe(true);
    expect(second.hidden).toBe(false);
    item.render(0.5, true, false, true);
    expect(first.hidden).toBe(false);
    expect(second.hidden).toBe(false);
  });

  it('maps videoTime percentages to the child video duration', () => {
    const { root, item } = mount("{'0%': {videoTime: 0}, '100%': {videoTime: 100}}");
    const video = document.createElement('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: 10 });
    item.appendChild(video);
    root.refresh();
    expect(video.currentTime).toBe(5);
  });

  it('moves a hover child and resets it when the pointer leaves', () => {
    const root = document.createElement('ui-parallax') as UiParallax;
    const hover = document.createElement('ui-parallax-hover') as UiParallaxHover;
    root.getBoundingClientRect = () => bounds(0, 1000, 800);
    root.appendChild(hover);
    document.body.appendChild(root);
    hover.render({ x: 800, y: 500 }, bounds(0, 1000, 800), false, false);
    expect(hover.style.transform).toContain('translate3d(50px, 0px, 0)');
    hover.render(null, bounds(0, 1000, 800), false, false);
    expect(hover.style.transform).toBe('');
    hover.setAttribute('ui-3d', '');
    hover.render({ x: 800, y: 500 }, bounds(0, 1000, 800), false, false);
    expect(hover.style.transform).toContain('rotateY(12deg)');
  });
});

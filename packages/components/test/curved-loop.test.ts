import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/curved-loop.js';
import type { UiCurvedLoop } from '../src/curved-loop.js';

const pathLengthDescriptor = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getTotalLength');
const tspanPrototype = Object.getPrototypeOf(document.createElementNS('http://www.w3.org/2000/svg', 'tspan')) as object;
const tspanLengthDescriptor = Object.getOwnPropertyDescriptor(tspanPrototype, 'getComputedTextLength');

beforeEach(() => {
  Object.defineProperty(tspanPrototype, 'getComputedTextLength', {
    configurable: true, value: function (this: SVGElement) { return (this.textContent?.length ?? 0) * 20; },
  });
  Object.defineProperty(SVGElement.prototype, 'getTotalLength', { configurable: true, value: () => 900 });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 720, height: 360 } as DOMRect);
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  document.body.replaceChildren();
  if (tspanLengthDescriptor) Object.defineProperty(tspanPrototype, 'getComputedTextLength', tspanLengthDescriptor);
  else Reflect.deleteProperty(tspanPrototype, 'getComputedTextLength');
  if (pathLengthDescriptor) Object.defineProperty(SVGElement.prototype, 'getTotalLength', pathLengthDescriptor);
  else delete (SVGElement.prototype as SVGElement & { getTotalLength?: () => number }).getTotalLength;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function make(text = 'RIDE THE WAVE'): UiCurvedLoop {
  const element = document.createElement('ui-curved-loop') as UiCurvedLoop;
  element.textContent = text;
  document.body.append(element);
  const measure = element.querySelector('svg > text') as SVGTextElement;
  Object.defineProperty(measure, 'getComputedTextLength', { configurable: true, value: () => 300 });
  element.refresh();
  return element;
}

describe('ui-curved-loop', () => {
  it('preserves source text and hides the repeated SVG from screen readers', () => {
    const element = make();
    expect(element.querySelector('.ui-curved-loop__source')?.textContent).toBe('RIDE THE WAVE');
    expect(element.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.hasAttribute('data-ready')).toBe(true);
    expect(element.querySelectorAll('textPath tspan').length).toBeGreaterThan(2);
    element.setAttribute('ui-text', 'NEW TEXT');
    expect(element.querySelector('.ui-curved-loop__source')?.textContent).toBe('NEW TEXT');
  });

  it('keeps the source visible when SVG path measurement is unavailable', () => {
    const element = make();
    const measure = element.querySelector('svg > text')!;
    Object.defineProperty(measure, 'getComputedTextLength', { configurable: true, value: undefined });
    element.refresh();
    expect(element.hasAttribute('data-ready')).toBe(false);
    expect(element.querySelector('.ui-curved-loop__source')?.textContent).toBe('RIDE THE WAVE');
  });

  it('renders all four path shapes and defaults invalid values to arc', () => {
    const element = make();
    const path = element.querySelector('path')!;
    expect(path.getAttribute('d')).toContain(' Q ');
    element.setAttribute('ui-shape', 'wave');
    expect(path.getAttribute('d')?.match(/ C /g)).toHaveLength(4);
    element.setAttribute('ui-shape', 'circle');
    expect(path.getAttribute('d')).toContain(' A ');
    element.setAttribute('ui-shape', 'line');
    expect(path.getAttribute('d')).toContain(' L ');
    element.setAttribute('ui-shape', 'unknown');
    expect(path.getAttribute('d')).toContain(' Q ');
  });

  it('keeps the circle glyphs mounted while the rotation crosses its loop boundary', () => {
    const element = make('AROUND AND');
    element.setAttribute('ui-shape', 'circle');
    const group = element.querySelector('.ui-curved-loop__circle')!;
    const glyphs = group.querySelectorAll('text');
    const period = (element as unknown as { circlePeriod: number }).circlePeriod;
    expect(glyphs.length).toBeGreaterThan(0);
    expect((element.querySelector('textPath')?.parentElement as SVGElement).style.display).toBe('none');
    (element as unknown as { offset: number; applyOffset(): void }).offset = -period + 1;
    (element as unknown as { applyOffset(): void }).applyOffset();
    const before = group.getAttribute('transform');
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(group.getAttribute('transform')).not.toBe(before);
    expect(group.querySelectorAll('text')).toHaveLength(glyphs.length);
    expect(group.textContent).toContain('AROUND');
  });

  it('supports keyboard shifting, pause/play, and reconnect without duplicate SVG', () => {
    const element = make();
    const ribbon = element.querySelector('textPath')!;
    const start = ribbon.getAttribute('startOffset');
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(ribbon.getAttribute('startOffset')).not.toBe(start);
    element.pause();
    expect(element.hasAttribute('ui-paused')).toBe(true);
    element.play();
    expect(element.hasAttribute('ui-paused')).toBe(false);
    element.remove();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    document.body.append(element);
    expect(element.querySelectorAll('svg')).toHaveLength(1);
  });

  it('stops automatic animation for reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const element = make();
    expect(element.hasAttribute('data-ready')).toBe(true);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});

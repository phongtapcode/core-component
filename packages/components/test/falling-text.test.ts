import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/falling-text.js';
import type { UiFallingText } from '../src/falling-text.js';
import { Body } from 'matter-js';

const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
let nextFrame = 1;

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains('ui-falling-text__piece')) {
      const siblings = Array.from(this.parentElement?.querySelectorAll('.ui-falling-text__piece') ?? []);
      return rect(20 + siblings.indexOf(this) * 75, 100, 60, 30);
    }
    return rect(0, 0, 600, 300);
  });
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => nextFrame++));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function make(attributes: Record<string, string> = {}): UiFallingText {
  const element = document.createElement('ui-falling-text') as UiFallingText;
  element.textContent = 'Words can fall';
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  document.body.append(element);
  return element;
}

describe('ui-falling-text', () => {
  it('waits for a click by default, while keyboard activation still works', () => {
    const element = make();
    expect(element.trigger).toBe('click');
    expect(element.getAttribute('data-state')).toBe(null);
    element.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    expect(element.getAttribute('data-state')).toBe(null);
    element.click();
    expect(element.getAttribute('data-state')).toBe('falling');
  });

  it('keeps one accessible source and decorative pieces, and updates text and split', () => {
    const element = make({ 'ui-trigger': 'click' });
    expect(element.querySelector('.ui-falling-text__source')?.textContent).toBe('Words can fall');
    expect(element.querySelector('.ui-falling-text__stage')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelectorAll('.ui-falling-text__piece')).toHaveLength(3);
    element.setAttribute('ui-text', 'A B');
    expect(element.querySelector('.ui-falling-text__source')?.textContent).toBe('A B');
    element.setAttribute('ui-split', 'letters');
    expect(element.querySelectorAll('.ui-falling-text__piece')).toHaveLength(2);
  });

  it('releases finite-mass rigid bodies and moves them under gravity', () => {
    const element = make({ 'ui-trigger': 'click', 'ui-order': 'together' });
    const starts: number[] = [];
    element.addEventListener('ui:falling-text:start', (event) => starts.push((event as CustomEvent<{ count: number }>).detail.count));
    element.start();
    const internal = element as unknown as { startedAt: number; pieces: { body: { mass: number; position: { x: number; y: number } }; released: boolean }[]; tick(time: number): void };
    internal.tick(internal.startedAt + 100);
    expect(starts).toEqual([3]);
    expect(internal.pieces.every((piece) => piece.released && Number.isFinite(piece.body.mass) && Number.isFinite(piece.body.position.x) && Number.isFinite(piece.body.position.y))).toBe(true);
    expect(element.querySelector('.ui-falling-text__piece')?.getAttribute('style')).toContain('translate3d');
  });

  it('resolves a head-on collision instead of letting two words swap sides', () => {
    const element = make({ 'ui-trigger': 'click', 'ui-text': 'A B', 'ui-order': 'together', 'ui-gravity': '0', 'ui-scatter': '0' });
    element.start();
    const internal = element as unknown as { startedAt: number; pieces: { body: Body }[]; tick(time: number): void };
    internal.tick(internal.startedAt + 20);
    const [left, right] = internal.pieces.map((piece) => piece.body);
    Body.setPosition(left!, { x: 245, y: 150 });
    Body.setPosition(right!, { x: 325, y: 150 });
    Body.setVelocity(left!, { x: 13, y: 0 });
    Body.setVelocity(right!, { x: -13, y: 0 });
    for (let i = 0; i < 18; i++) internal.tick(internal.startedAt + 40 + i * 16.7);
    expect(left!.position.x).toBeLessThan(right!.position.x);
    expect(right!.position.x - left!.position.x).toBeGreaterThan(55);
  });

  it('drags through a Matter constraint instead of teleporting a body', () => {
    const element = make({ 'ui-trigger': 'click', 'ui-order': 'together' });
    element.start();
    const internal = element as unknown as { startedAt: number; pieces: { body: Body }[];
      tick(time: number): void; onPointerDown(event: PointerEvent): void;
      onPointerMove(event: PointerEvent): void; onPointerUp(event: PointerEvent): void;
      dragConstraint: unknown };
    internal.tick(internal.startedAt + 20);
    const body = internal.pieces[0]!.body;
    const initialX = body.position.x;
    internal.onPointerDown({ pointerType: 'mouse', button: 0, clientX: initialX, clientY: body.position.y,
      pointerId: 1, preventDefault: vi.fn() } as unknown as PointerEvent);
    expect(internal.dragConstraint).not.toBeNull();
    internal.onPointerMove({ clientX: initialX + 100, clientY: body.position.y - 70,
      pointerId: 1, preventDefault: vi.fn() } as unknown as PointerEvent);
    expect(body.position.x).toBe(initialX);
    for (let i = 0; i < 6; i++) internal.tick(internal.startedAt + 40 + i * 16.7);
    expect(body.position.x).toBeGreaterThan(initialX);
    internal.onPointerUp({ pointerId: 1 } as PointerEvent);
    expect(internal.dragConstraint).toBeNull();
  });

  it('resets, cleans up, and reconnects without duplicating pieces', () => {
    const element = make({ 'ui-trigger': 'click' });
    element.start();
    element.reset();
    expect(element.getAttribute('data-state')).toBe('restoring');
    element.remove();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    document.body.append(element);
    expect(element.querySelectorAll('.ui-falling-text__piece')).toHaveLength(3);
    element.start();
    expect(element.getAttribute('data-state')).toBe('falling');
  });

  it('keeps the sentence static when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    const element = make();
    element.start();
    expect(element.hasAttribute('data-reduced-motion')).toBe(true);
    expect(element.getAttribute('data-state')).toBe(null);
    expect(element.querySelector('.ui-falling-text__source')?.textContent).toBe('Words can fall');
  });
});

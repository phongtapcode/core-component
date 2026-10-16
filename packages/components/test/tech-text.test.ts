import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/tech-text.js';
import type { UiTechText } from '../src/tech-text.js';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

function canvasContext(): CanvasRenderingContext2D {
  return {
    font: '', fillStyle: '', strokeStyle: '', globalAlpha: 1, textBaseline: 'alphabetic',
    measureText: (text: string) => ({
      width: text === ' ' ? 30 : text.length * 80,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text === ' ' ? 30 : text.length * 80,
      actualBoundingBoxAscent: 75,
      actualBoundingBoxDescent: text === 'I' ? 0 : text === 'H' ? -4 : 20,
    }),
    setTransform: vi.fn(), fillText: vi.fn(), strokeText: vi.fn(), clearRect: vi.fn(),
    drawImage: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(), setLineDash: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

async function make(text = 'AB'): Promise<UiTechText> {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext());
  const element = document.createElement('ui-tech-text') as UiTechText;
  element.textContent = text;
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ width: 400, height: 280, left: 0, top: 0 } as DOMRect);
  document.body.append(element);
  await vi.waitFor(() => expect(element.querySelector('.ui-tech-text__source')).not.toBeNull());
  return element;
}

describe('ui-tech-text', () => {
  it('fits selection bounds to glyphs with zero or negative descent', async () => {
    const element = await make('IH');
    const { glyphs, baseline } = element as unknown as {
      glyphs: Array<{ top: number; height: number }>;
      baseline: number;
    };
    expect(glyphs[0]!.top + glyphs[0]!.height).toBe(baseline);
    expect(glyphs[1]!.top + glyphs[1]!.height).toBe(baseline - 4);
  });

  it('keeps the authored text accessible and the canvas decorative', async () => {
    const element = await make('UI Core');
    expect(element.querySelector('.ui-tech-text__source')?.textContent).toBe('UI Core');
    expect(element.querySelector('canvas')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.hasAttribute('data-ready')).toBe(true);
    element.setAttribute('ui-text', 'New text');
    expect(element.querySelector('.ui-tech-text__source')?.textContent).toBe('New text');
  });

  it('keeps the source visible if Canvas 2D is unavailable', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const element = document.createElement('ui-tech-text') as UiTechText;
    element.textContent = 'Fallback';
    document.body.append(element);
    await vi.waitFor(() => expect(element.querySelector('.ui-tech-text__source')).not.toBeNull());
    expect(element.hasAttribute('data-ready')).toBe(false);
    expect(element.querySelector('.ui-tech-text__source')?.textContent).toBe('Fallback');
  });

  it('supports keyboard letter inspection and clears listeners on disconnect', async () => {
    const element = await make();
    const selected = vi.fn();
    element.addEventListener('ui:tech-text:select', selected);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(selected).toHaveBeenCalledOnce();
    expect((selected.mock.calls[0]![0] as CustomEvent).detail).toEqual({ index: 0, char: 'A' });
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Letter A');
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect((selected.mock.calls[1]![0] as CustomEvent).detail).toEqual({ index: 1, char: 'B' });
    element.remove();
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(selected).toHaveBeenCalledTimes(2);
  });

  it('reports pointer release and returns letters on replay', async () => {
    const element = await make();
    const released = vi.fn();
    element.addEventListener('ui:tech-text:release', released);
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: 150, clientY: 150, button: 0 }));
    element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 175, clientY: 155 }));
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: 175, clientY: 155 }));
    expect(released).toHaveBeenCalledOnce();
    expect((released.mock.calls[0]![0] as CustomEvent).detail).toMatchObject({ index: 0, char: 'A' });
    expect(() => element.replay()).not.toThrow();
  });

  it('reconnects without duplicating its canvas or keyboard listeners', async () => {
    const element = await make();
    element.remove();
    document.body.append(element);
    expect(element.querySelectorAll('canvas')).toHaveLength(1);
    const selected = vi.fn();
    element.addEventListener('ui:tech-text:select', selected);
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(selected).toHaveBeenCalledOnce();
  });
});

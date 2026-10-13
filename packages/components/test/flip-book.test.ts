import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiFlipBook } from '../src/flip-book.js';
import '../src/flip-book.js';

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); });

function mount(): UiFlipBook {
  const book = document.createElement('ui-flip-book') as UiFlipBook;
  book.innerHTML = `<ui-flip-book-cover><div>Cover</div><div data-cover-back>Inside cover</div></ui-flip-book-cover>
    <ui-flip-book-page><div data-page-front>One front</div><div data-page-back>One back</div></ui-flip-book-page>
    <ui-flip-book-page><div data-page-front>Two front</div><div data-page-back>Two back</div></ui-flip-book-page>`;
  document.body.append(book);
  return book;
}

describe('ui-flip-book', () => {
  it('opens its cover and turns authored front and back faces', () => {
    const book = mount();
    const cover = book.querySelector('ui-flip-book-cover')!;
    cover.click();
    expect(book.openState).toBe(true);
    expect(book.page).toBe(0);
    expect(book.pages[0]?.querySelector('[data-page-front]')?.hasAttribute('inert')).toBe(false);
    book.next();
    expect(book.page).toBe(1);
    expect(book.pages[0]?.hasAttribute('data-turned')).toBe(true);
    expect(book.pages[0]?.querySelector('[data-page-back]')?.hasAttribute('inert')).toBe(false);
    expect(book.pages[1]?.querySelector('[data-page-front]')?.hasAttribute('inert')).toBe(false);
    expect(cover.tabIndex).toBe(-1);
    book.previous();
    expect(book.page).toBe(0);
    expect(cover.tabIndex).toBe(0);
  });

  it('clamps navigation and returns leaves before closing', () => {
    vi.useFakeTimers();
    const book = mount();
    const changes: number[] = [];
    book.addEventListener('ui:flip-book:change', (event) => changes.push((event as CustomEvent).detail.page));
    book.open();
    expect(book.hasAttribute('data-final-spread')).toBe(false);
    book.goTo(99);
    expect(book.page).toBe(2);
    expect(book.hasAttribute('data-final-spread')).toBe(true);
    book.close();
    expect(book.page).toBe(0);
    expect(book.hasAttribute('data-final-spread')).toBe(false);
    expect(book.openState).toBe(true);
    vi.advanceTimersByTime(680);
    expect(book.openState).toBe(false);
    expect(changes).toEqual([2,0]);
  });

  it('supports keyboard navigation and cancels a pending close when a page turns', () => {
    vi.useFakeTimers();
    const book = mount();
    book.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowRight', bubbles:true }));
    expect(book.openState).toBe(true);
    book.dispatchEvent(new KeyboardEvent('keydown', { key:'End', bubbles:true }));
    expect(book.page).toBe(2);
    book.close();
    book.next();
    vi.advanceTimersByTime(700);
    expect(book.openState).toBe(true);
    expect(book.page).toBe(1);
    book.dispatchEvent(new KeyboardEvent('keydown', { key:'Home', bubbles:true }));
    expect(book.page).toBe(0);
  });

  it('keeps the cover behind leaves when ui-open is set from markup', () => {
    vi.useFakeTimers();
    const book = mount();
    book.setAttribute('ui-open', '');
    vi.advanceTimersByTime(680);
    expect(book.hasAttribute('data-cover-behind')).toBe(true);
    expect(book.querySelector<HTMLElement>('ui-flip-book-cover')?.style.zIndex).toBe('2');
    expect(book.querySelector('ui-flip-book-cover > [data-cover-back]')?.textContent).toBe('Inside cover');
    book.removeAttribute('ui-open');
    expect(book.hasAttribute('data-cover-behind')).toBe(false);
  });

  it('swipes the cover open and turns pages in both directions', () => {
    vi.useFakeTimers();
    const book = mount();
    const gesture = (from: number, to: number, y = 100): void => {
      book.dispatchEvent(new PointerEvent('pointerdown', { pointerId:1, pointerType:'touch', clientX:from, clientY:y, bubbles:true }));
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId:1, pointerType:'touch', clientX:to, clientY:y, bubbles:true }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId:1, pointerType:'touch', clientX:to, clientY:y, bubbles:true }));
      vi.runOnlyPendingTimers();
    };
    expect(book.querySelector('ui-flip-book-cover')?.getAttribute('aria-label')).toBe('Open book');
    expect(book.pages[0]?.querySelector('[data-page-front]')?.getAttribute('aria-hidden')).toBe('true');
    expect(book.hasAttribute('data-final-spread')).toBe(false);
    book.dispatchEvent(new PointerEvent('pointerdown', { pointerId:1, pointerType:'touch', clientX:240, clientY:100, bubbles:true }));
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId:1, pointerType:'touch', clientX:180, clientY:100, bubbles:true }));
    expect(book.hasAttribute('data-dragging')).toBe(true);
    expect(book.hasAttribute('data-final-spread')).toBe(false);
    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId:1, pointerType:'touch', bubbles:true }));
    gesture(240, 110);
    expect(book.openState).toBe(true);
    expect(book.page).toBe(0);
    gesture(240, 100);
    expect(book.page).toBe(1);
    gesture(100, 240);
    expect(book.page).toBe(0);
    gesture(100, 240);
    expect(book.openState).toBe(false);
  });

  it('returns a short or vertical drag without turning a page', () => {
    const book = mount();
    book.open();
    book.dispatchEvent(new PointerEvent('pointerdown', { pointerId:2, pointerType:'touch', clientX:200, clientY:100, bubbles:true }));
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId:2, pointerType:'touch', clientX:185, clientY:160, bubbles:true }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId:2, pointerType:'touch', clientX:185, clientY:160, bubbles:true }));
    expect(book.page).toBe(0);
    book.dispatchEvent(new PointerEvent('pointerdown', { pointerId:3, pointerType:'mouse', clientX:200, clientY:100, bubbles:true }));
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId:3, pointerType:'mouse', clientX:180, clientY:100, bubbles:true }));
    expect(book.pages[0]?.style.transform).toContain('rotateY(');
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId:3, pointerType:'mouse', clientX:180, clientY:100, bubbles:true }));
    expect(book.page).toBe(0);
    expect(book.hasAttribute('data-dragging')).toBe(false);
    expect(book.pages[0]?.style.transform).toBe('');
  });
});

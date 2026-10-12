/**
 * Comprehensive Unit Tests for Core Carousel based on Section 35 Specification.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';
import type { UiCarousel } from '../src/carousel/index.js';
import { parseBreakpoints, resolveResponsiveConfig } from '../src/carousel/breakpoints.js';

describe('<ui-carousel> / <core-carousel> Spec Test Suite', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  function createCarousel(attrs: Record<string, string> = {}, slideCount = 5): UiCarousel {
    const el = document.createElement('ui-carousel') as UiCarousel;
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    for (let i = 0; i < slideCount; i++) {
      const slide = document.createElement('div');
      slide.textContent = `Slide ${i + 1}`;
      el.appendChild(slide);
    }
    container.appendChild(el);
    return el;
  }

  describe('1. Navigation & PerMove', () => {
    it('supports custom per-move', () => {
      const c = createCarousel({ 'per-move': '2', 'per-view': '1', loop: 'false' }, 6);
      expect(c.activeIndex).toBe(0);
      c.next();
      expect(c.activeIndex).toBe(2);
      c.next();
      expect(c.activeIndex).toBe(4);
      c.prev();
      expect(c.activeIndex).toBe(2);
    });

    it('goTo jumps directly to target index', () => {
      const c = createCarousel({}, 5);
      c.goTo(3);
      expect(c.activeIndex).toBe(3);
      expect(c.getAttribute('active-index')).toBe('3');
    });

    it('clamps goTo to boundaries', () => {
      const c = createCarousel({ 'per-view': '2' }, 4);
      // maxIndex is 4 - 2 = 2
      c.goTo(10);
      expect(c.activeIndex).toBe(2);
      c.goTo(-5);
      expect(c.activeIndex).toBe(0);
    });
  });

  describe('2. Boundaries: Loop vs Rewind', () => {
    it('stops at boundaries when loop=false and rewind=false', () => {
      const c = createCarousel({ loop: 'false', rewind: 'false' }, 3);
      expect(c.activeIndex).toBe(0);
      c.prev();
      expect(c.activeIndex).toBe(0); // doesn't move

      c.goTo(2);
      c.next();
      expect(c.activeIndex).toBe(2); // doesn't move
    });

    it('rewind jumps back to start from end, and to end from start', () => {
      const c = createCarousel({ loop: 'false', rewind: 'true' }, 3);
      expect(c.activeIndex).toBe(0);
      c.prev();
      expect(c.activeIndex).toBe(2);
      c.next();
      expect(c.activeIndex).toBe(0);
    });

    it('disables loop when slidesCount <= perView', () => {
      const c = createCarousel({ 'per-view': '3', loop: 'true' }, 3);
      expect(c.isLooping).toBe(false);
      c.next();
      expect(c.activeIndex).toBe(0);
    });
  });

  describe('3. Slide State Attributes', () => {
    it('sets active, visible, prev, next attributes correctly on slides', () => {
      const c = createCarousel({ 'per-view': '2', loop: 'false' }, 5);
      c.goTo(1);
      const slides = [...c.querySelector('[data-carousel-track]')!.children] as HTMLElement[];

      expect(slides[0]!.hasAttribute('prev')).toBe(true);
      expect(slides[1]!.hasAttribute('active')).toBe(true);
      expect(slides[1]!.hasAttribute('visible')).toBe(true);
      expect(slides[2]!.hasAttribute('visible')).toBe(true);
      expect(slides[2]!.hasAttribute('next')).toBe(true);
      expect(slides[3]!.hasAttribute('visible')).toBe(false);
    });
  });

  describe('4. Controls: Prev / Next Buttons', () => {
    it('auto disables prev/next controls at boundaries when not looping', () => {
      const c = createCarousel({ loop: 'false', rewind: 'false', 'per-view': '1' }, 3);
      const prevBtn = document.createElement('ui-carousel-prev');
      const nextBtn = document.createElement('ui-carousel-next');
      c.appendChild(prevBtn);
      c.appendChild(nextBtn);

      c.refresh();

      expect(prevBtn.hasAttribute('disabled')).toBe(true);
      expect(nextBtn.hasAttribute('disabled')).toBe(false);

      c.goTo(2);
      expect(prevBtn.hasAttribute('disabled')).toBe(false);
      expect(nextBtn.hasAttribute('disabled')).toBe(true);
    });

    it('clicking prev/next controls triggers navigation', () => {
      const c = createCarousel({ loop: 'true' }, 3);
      const nextBtn = document.createElement('ui-carousel-next');
      c.appendChild(nextBtn);
      c.refresh();

      expect(c.activeIndex).toBe(0);
      nextBtn.click();
      expect(c.activeIndex).toBe(1);
    });
  });

  describe('5. Pagination & Page/Size', () => {
    it('generates correct total pages and reflects current page', () => {
      const c = createCarousel({ 'per-view': '2' }, 6);
      const pageEl = document.createElement('ui-carousel-page');
      const sizeEl = document.createElement('ui-carousel-size');
      c.appendChild(pageEl);
      c.appendChild(sizeEl);

      c.refresh();

      expect(c.pageCount).toBe(3); // ceil(6 / 2) = 3
      expect(pageEl.textContent).toBe('1');
      expect(sizeEl.textContent).toBe('3');

      c.goTo(2); // page 2
      expect(pageEl.textContent).toBe('2');
    });

    it('pagination syncs active bullet', () => {
      const c = createCarousel({ 'per-view': '1' }, 3);
      const pagination = document.createElement('ui-carousel-pagination');
      c.appendChild(pagination);
      c.refresh();

      const bullets = [...pagination.querySelectorAll('ui-carousel-bullet')];
      expect(bullets.length).toBe(3);
      expect(bullets[0]!.hasAttribute('active')).toBe(true);

      c.next();
      expect(bullets[0]!.hasAttribute('active')).toBe(false);
      expect(bullets[1]!.hasAttribute('active')).toBe(true);
      // Clicking bullet navigates
      bullets[2]!.click();
      expect(c.activeIndex).toBe(2);
    });
  });

  describe('6. Multi-Carousel Synchronization', () => {
    it('synchronizes carousels sharing sync-id without infinite loops', () => {
      const c1 = createCarousel({ 'sync-id': 'gallery-sync' }, 4);
      const c2 = createCarousel({ 'sync-id': 'gallery-sync' }, 4);

      expect(c1.activeIndex).toBe(0);
      expect(c2.activeIndex).toBe(0);

      c1.goTo(2);
      expect(c2.activeIndex).toBe(2);

      c2.prev();
      expect(c1.activeIndex).toBe(1);
    });
  });

  describe('7. Custom Events', () => {
    it('dispatches ui-carousel:change with detailed normalized payload', () => {
      const c = createCarousel({}, 4);
      const listener = vi.fn();
      c.addEventListener('ui-carousel:change', listener as EventListener);

      c.next();

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0]![0] as CustomEvent;
      expect(event.detail).toMatchObject({
        activeIndex: 1,
        previousIndex: 0,
        direction: 'next',
      });
    });
  });

  describe('8. Lifecycle & Cleanup', () => {
    it('cleans up without leaks on disconnect', () => {
      const c = createCarousel({ autoplay: '2000' }, 3);
      expect(c.hasAttribute('initialized')).toBe(true);

      c.remove();
      expect(c.hasAttribute('initialized')).toBe(false);
    });
  });

  describe('9. Pointer Events & Swipe Gestures', () => {
    it('advances to next slide when swiping left with pointer events', () => {
      const c = createCarousel({ loop: 'true' }, 4);
      expect(c.activeIndex).toBe(0);

      // Simulate pointer swipe left: clientX from 200 to 120 (delta = -80px)
      c.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 100, button: 0, pointerId: 1, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 100, pointerId: 1, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 120, clientY: 100, pointerId: 1, bubbles: true }));

      expect(c.activeIndex).toBe(1);
    });

    it('navigates to previous slide when swiping right with pointer events', () => {
      const c = createCarousel({ loop: 'true' }, 4);
      c.goTo(2);
      expect(c.activeIndex).toBe(2);

      // Simulate pointer swipe right: clientX from 100 to 180 (delta = +80px)
      c.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, button: 0, pointerId: 1, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 180, clientY: 100, pointerId: 1, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 180, clientY: 100, pointerId: 1, bubbles: true }));

      expect(c.activeIndex).toBe(1);
    });

    it('does not advance if drag does not meet threshold', () => {
      const c = createCarousel({ loop: 'true' }, 4);
      expect(c.activeIndex).toBe(0);

      // Simulate small jitter: delta = -5px
      c.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, button: 0, pointerId: 1, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 95, clientY: 100, pointerId: 1, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { clientX: 95, clientY: 100, pointerId: 1, bubbles: true }));

      expect(c.activeIndex).toBe(0);
    });
  });

  describe('10. ui-* Attribute Compatibility', () => {
    it('correctly parses ui-* prefixed attributes', () => {
      const c = createCarousel({
        'ui-per-view': '3',
        'ui-gap': '30',
        'ui-speed': '450',
        'ui-type': 'urban',
        'ui-rewind': 'true',
        'ui-draggable': 'true',
      }, 6);

      expect(c.effectivePerView).toBe(3);
      expect(c.effectiveGap).toBe(30);
      expect(c.effectiveSpeed).toBe(450);
      expect(c.effectiveType).toBe('urban');
      expect(c.isRewind).toBe(true);
      expect(c.isDraggable).toBe(true);
    });
  });

  describe('11. Transition Types (7 modes)', () => {
    it('supports urban, nature, water, wind, fade, slide, and none types', () => {
      const types = ['nature', 'water', 'urban', 'wind', 'fade', 'slide', 'none'] as const;

      for (const t of types) {
        const c = createCarousel({ 'type': t }, 3);
        expect(c.effectiveType).toBe(t);

        // Can navigate seamlessly in all transition modes
        c.next();
        expect(c.activeIndex).toBe(1);
        c.next();
        expect(c.activeIndex).toBe(2);
      }
    });

    it('nature transition mode applies depth transform to active and neighboring slides', () => {
      const c = createCarousel({ type: 'nature' }, 3);
      const track = c.querySelector('[data-carousel-track]')!;
      const slides = [...track.children] as HTMLElement[];

      expect(slides[0]!.style.transform).toContain('scale(1)');
      expect(slides[0]!.style.opacity).toBe('1');
      expect(slides[1]!.style.transform).toContain('scale(0.88)');

      c.next();
      expect(slides[1]!.style.transform).toContain('scale(1)');
    });

    it('urban transition mode applies 3D perspective to track and slides', () => {
      const c = createCarousel({ type: 'urban' }, 3);
      const track = c.querySelector('[data-carousel-track]') as HTMLElement;
      const slides = [...track.children] as HTMLElement[];

      expect(track.style.transformStyle).toBe('preserve-3d');
      expect(slides[0]!.style.transform).toContain('rotateY(0deg)');

      c.next();
      expect(slides[1]!.style.transform).toContain('rotateY(0deg)');
    });
  });

  describe('12. Custom Bullet Templates (render-bullet)', () => {
    it('renders custom bullet template with {{index}} and {{page}} replacements', () => {
      const c = createCarousel({ 'ui-render-bullet': '<span class="dot">#{{page}}</span>' }, 3);
      const pagination = document.createElement('ui-carousel-pagination');
      c.appendChild(pagination);
      c.refresh();

      const bullets = [...pagination.querySelectorAll('ui-carousel-bullet')];
      expect(bullets.length).toBe(3);
      expect(bullets[0]!.innerHTML).toBe('<span class="dot">#1</span>');
      expect(bullets[1]!.innerHTML).toBe('<span class="dot">#2</span>');
      expect(bullets[2]!.innerHTML).toBe('<span class="dot">#3</span>');
    });
  });

  describe('13. UI markup and thumbnail navigation', () => {
    it('registers carousel elements only under the UI namespace', () => {
      expect(customElements.get('ui-carousel')).toBeDefined();
      expect(customElements.get('ui-carousel-thumbnail')).toBeDefined();
      expect(customElements.get('xo-carousel')).toBeUndefined();
      expect(customElements.get('xo-carousel-thumbnail')).toBeUndefined();
    });

    it('uses authored inner/list/slide structure and nested controls', () => {
      const el = document.createElement('ui-carousel') as UiCarousel;
      el.setAttribute('ui-per-view', '1');
      el.setAttribute('ui-render-bullet', '<span></span>');
      el.innerHTML = `<ui-carousel-inner><ui-carousel-list>
        <ui-carousel-slide>1</ui-carousel-slide><ui-carousel-slide>2</ui-carousel-slide><ui-carousel-slide>3</ui-carousel-slide>
        </ui-carousel-list></ui-carousel-inner>
        <ui-carousel-prev><button>Prev</button></ui-carousel-prev>
        <ui-carousel-next><button>Next</button></ui-carousel-next>
        <ui-carousel-pagination></ui-carousel-pagination>`;
      container.appendChild(el);

      expect(el.slidesCount).toBe(3);
      expect(el.isLooping).toBe(false);
      expect([...el.children].filter((child) => child.localName === 'ui-carousel-inner')).toHaveLength(1);
      expect(el.querySelector('ui-carousel-inner')?.hasAttribute('data-carousel-viewport')).toBe(true);
      expect(el.querySelector('ui-carousel-list')?.hasAttribute('data-carousel-track')).toBe(true);
      expect(el.querySelectorAll('ui-carousel-pagination ui-carousel-bullet')).toHaveLength(3);
      expect(el.querySelector('ui-carousel-prev button')?.hasAttribute('disabled')).toBe(true);

      el.querySelector<HTMLButtonElement>('ui-carousel-next button')!.click();
      expect(el.activeIndex).toBe(1);
      expect(el.querySelectorAll('ui-carousel-slide')[1]?.hasAttribute('active')).toBe(true);
      expect(el.querySelectorAll('ui-carousel-pagination ui-carousel-bullet')[1]?.hasAttribute('active')).toBe(true);
    });

    it('selects the clicked thumbnail and disables infinite loop', () => {
      const el = document.createElement('ui-carousel') as UiCarousel;
      el.setAttribute('ui-per-view', '4');
      el.setAttribute('ui-loop', '');
      const slides = Array.from({ length: 6 }, (_, i) => `<ui-carousel-slide>${i + 1}</ui-carousel-slide>`).join('');
      el.innerHTML = `<ui-carousel-inner><ui-carousel-list>${slides}</ui-carousel-list></ui-carousel-inner>
        <ui-carousel-thumbnail ui-per-view="7"><ui-carousel-inner><ui-carousel-list>${slides}</ui-carousel-list></ui-carousel-inner></ui-carousel-thumbnail>`;
      container.appendChild(el);

      expect(el.slidesCount).toBe(6);
      expect(el.isLooping).toBe(false);
      expect(el.querySelectorAll('[data-carousel-clone]')).toHaveLength(0);
      const thumbs = el.querySelectorAll('ui-carousel-thumbnail ui-carousel-slide');
      (thumbs[5] as HTMLElement).click();
      expect(el.activeIndex).toBe(2);
      expect(thumbs[5]?.getAttribute('aria-current')).toBe('true');
      expect(thumbs[5]?.hasAttribute('active')).toBe(true);
    });

    it('adds inert end clones for UI infinite looping', () => {
      const el = document.createElement('ui-carousel') as UiCarousel;
      el.setAttribute('ui-loop', '');
      el.innerHTML = `<ui-carousel-inner><ui-carousel-list>
        <ui-carousel-slide>1</ui-carousel-slide><ui-carousel-slide>2</ui-carousel-slide><ui-carousel-slide>3</ui-carousel-slide>
        </ui-carousel-list></ui-carousel-inner>`;
      container.appendChild(el);

      expect(el.isLooping).toBe(true);
      expect(el.slidesCount).toBe(3);
      expect(el.querySelectorAll('[data-carousel-clone]')).toHaveLength(2);
      expect([...el.querySelectorAll<HTMLElement>('[data-carousel-clone]')].every((clone) => clone.inert)).toBe(true);
      el.goTo(2);
      el.next();
      expect(el.activeIndex).toBe(0);
    });

    it('maps the last pagination bullet to the last valid multi-view start', () => {
      const el = document.createElement('ui-carousel') as UiCarousel;
      el.setAttribute('ui-per-view', '4');
      el.innerHTML = `<ui-carousel-inner><ui-carousel-list>${Array.from({ length: 6 }, (_, i) => `<ui-carousel-slide>${i}</ui-carousel-slide>`).join('')}</ui-carousel-list></ui-carousel-inner><ui-carousel-pagination></ui-carousel-pagination>`;
      container.appendChild(el);
      const bullets = el.querySelectorAll<HTMLElement>('ui-carousel-bullet');
      expect(bullets).toHaveLength(2);
      bullets[1]!.click();
      expect(el.activeIndex).toBe(2);
      expect(el.currentPage).toBe(1);
      expect(bullets[1]!.hasAttribute('active')).toBe(true);
      el.setAttribute('ui-per-view', '2');
      expect(el.querySelectorAll('ui-carousel-bullet')).toHaveLength(3);
    });

    it('parses the object-literal breakpoint example without executing it', () => {
      const breakpoints = parseBreakpoints(`{ 600: { perView: 1, perMove: 1, gap: 10, overflow: 'visible' }, 1000: { perView: 2, perMove: 2, }, }`);
      expect(breakpoints).toEqual({
        '600': { perView: 1, perMove: 1, gap: 10, overflow: 'visible' },
        '1000': { perView: 2, perMove: 2 },
      });
      const base = { perView: 4, perMove: 1, gap: 20, overflow: 'hidden' as const, vertical: false, columnWidth: 0 };
      expect(resolveResponsiveConfig(500, base, breakpoints)).toMatchObject({ perView: 1, perMove: 1, gap: 10, overflow: 'visible' });
      expect(resolveResponsiveConfig(800, base, breakpoints)).toMatchObject({ perView: 2, perMove: 2 });
      expect(resolveResponsiveConfig(1200, base, breakpoints)).toMatchObject({ perView: 4, perMove: 1 });
    });

    it('reads and reacts to ui-active-index', () => {
      const el = document.createElement('ui-carousel') as UiCarousel;
      el.setAttribute('ui-active-index', '1');
      el.innerHTML = `<ui-carousel-inner><ui-carousel-list><ui-carousel-slide>1</ui-carousel-slide><ui-carousel-slide>2</ui-carousel-slide><ui-carousel-slide>3</ui-carousel-slide></ui-carousel-list></ui-carousel-inner>`;
      container.appendChild(el);
      expect(el.activeIndex).toBe(1);
      el.setAttribute('ui-active-index', '2');
      expect(el.activeIndex).toBe(2);
    });

    it('moves only the focused UI carousel with arrow keys', () => {
      const markup = `<ui-carousel-inner><ui-carousel-list><ui-carousel-slide>1</ui-carousel-slide><ui-carousel-slide>2</ui-carousel-slide></ui-carousel-list></ui-carousel-inner>`;
      const first = document.createElement('ui-carousel') as UiCarousel;
      const second = document.createElement('ui-carousel') as UiCarousel;
      first.innerHTML = markup;
      second.innerHTML = markup;
      container.append(first, second);
      first.focus();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(first.activeIndex).toBe(1);
      expect(second.activeIndex).toBe(0);
    });
  });
});

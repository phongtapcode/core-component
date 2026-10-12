/**
 * Carousel subcomponents:
 * <ui-carousel-prev>
 * <ui-carousel-next>
 * <ui-carousel-pagination>
 * <ui-carousel-bullet>
 * <ui-carousel-pagination-progress>
 * <ui-carousel-page>
 * <ui-carousel-size>
 * <ui-carousel-thumbnail>
 * <ui-carousel-trigger>
 */

import { BaseElement, define } from '@ui/core';
import type { UiCarousel } from './carousel.js';
import { getCarouselByName } from './sync.js';

function findTargetCarousel(element: HTMLElement, selector?: string, name?: string): UiCarousel | null {
  if (name) {
    const fromReg = getCarouselByName(name);
    if (fromReg) return fromReg as unknown as UiCarousel;
  }
  if (selector) {
    const found = document.querySelector(selector);
    if (found && 'next' in found) return found as unknown as UiCarousel;
  }
  const closest = element.closest('ui-carousel, core-carousel');
  if (closest && 'next' in closest) return closest as unknown as UiCarousel;
  return null;
}

/* ============================================================
   <ui-carousel-prev> / <ui-carousel-next>
   ============================================================ */

export class UiCarouselPrev extends BaseElement {
  static override properties = {
    target: { name: 'target', default: '' },
    name: { name: 'name', default: '' },
  };

  declare target: string;
  declare name: string;

  protected override onConnect(): void {
    const button = this.querySelector('button');
    if (button) {
      if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', 'Previous slide');
    } else {
      if (!this.getAttribute('role')) this.setAttribute('role', 'button');
      if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
      if (!this.getAttribute('aria-label')) this.setAttribute('aria-label', 'Previous slide');
    }

    this.$on(this, 'click', () => {
      const c = findTargetCarousel(this, this.target, this.name);
      if (c && !this.hasAttribute('disabled')) { c.interact(); c.prev(); }
    });

    this.$on(this, 'keydown', ((e: KeyboardEvent) => {
      if (!button && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const c = findTargetCarousel(this, this.target, this.name);
        if (c && !this.hasAttribute('disabled')) { c.interact(); c.prev(); }
      }
    }) as EventListener);
  }

  updateState(disabled: boolean, hidden: boolean): void {
    if (disabled) {
      this.setAttribute('disabled', '');
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('disabled');
      this.removeAttribute('aria-disabled');
    }
    this.hidden = hidden;
    const button = this.querySelector('button');
    if (button) button.disabled = disabled || hidden;
  }
}

export class UiCarouselNext extends BaseElement {
  static override properties = {
    target: { name: 'target', default: '' },
    name: { name: 'name', default: '' },
  };

  declare target: string;
  declare name: string;

  protected override onConnect(): void {
    const button = this.querySelector('button');
    if (button) {
      if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', 'Next slide');
    } else {
      if (!this.getAttribute('role')) this.setAttribute('role', 'button');
      if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
      if (!this.getAttribute('aria-label')) this.setAttribute('aria-label', 'Next slide');
    }

    this.$on(this, 'click', () => {
      const c = findTargetCarousel(this, this.target, this.name);
      if (c && !this.hasAttribute('disabled')) { c.interact(); c.next(); }
    });

    this.$on(this, 'keydown', ((e: KeyboardEvent) => {
      if (!button && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const c = findTargetCarousel(this, this.target, this.name);
        if (c && !this.hasAttribute('disabled')) { c.interact(); c.next(); }
      }
    }) as EventListener);
  }

  updateState(disabled: boolean, hidden: boolean): void {
    if (disabled) {
      this.setAttribute('disabled', '');
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('disabled');
      this.removeAttribute('aria-disabled');
    }
    this.hidden = hidden;
    const button = this.querySelector('button');
    if (button) button.disabled = disabled || hidden;
  }
}

/* ============================================================
   <ui-carousel-bullet>
   ============================================================ */

export class UiCarouselBullet extends BaseElement {
  static override properties = {
    index: { name: 'index', default: 0 },
  };

  declare index: number;

  protected override onConnect(): void {
    this.setAttribute('role', 'button');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    if (!this.getAttribute('aria-label')) {
      this.setAttribute('aria-label', `Go to slide ${Number(this.index) + 1}`);
    }

    this.$on(this, 'click', () => {
      const c = findTargetCarousel(this);
      if (c) { c.interact(); c.goTo(Number(this.index)); }
    });
    this.$on(this, 'keydown', ((event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const carousel = findTargetCarousel(this);
      carousel?.interact();
      carousel?.goTo(Number(this.index));
    }) as EventListener);
  }

  setActive(active: boolean): void {
    if (active) {
      this.setAttribute('active', '');
      this.setAttribute('aria-current', 'true');
    } else {
      this.removeAttribute('active');
      this.removeAttribute('aria-current');
    }
  }
}

/* ============================================================
   <ui-carousel-pagination>
   ============================================================ */

export class UiCarouselPagination extends BaseElement {
  static override properties = {
    perView: { name: 'per-view', default: 0 }, // 0 = show all, >0 = dynamic bullets limit
  };

  declare perView: number;
  #bullets: UiCarouselBullet[] = [];

  protected override onConnect(): void {
    this.setAttribute('role', 'tablist');
    this.setAttribute('aria-label', 'Carousel pagination');
  }

  syncBullets(totalPages: number, activePage: number, pageStarts: number[] = []): void {
    // If user provided custom bullets, bind them
    const existing = [...this.querySelectorAll<UiCarouselBullet>('ui-carousel-bullet, core-carousel-bullet')];
    const custom = existing.length > 0 && existing.some((bullet) => !bullet.hasAttribute('data-carousel-generated'));
    if (custom) {
      this.#bullets = existing;
      this.#bullets.forEach((b, i) => b.setActive(i === activePage));
      return;
    }

    // Auto-generate bullets
    if (existing.length !== totalPages) {
      this.innerHTML = '';
      this.#bullets = [];
      const template =
        this.closest('ui-carousel, core-carousel')?.getAttribute('ui-render-bullet') ??
        this.closest('ui-carousel, core-carousel')?.getAttribute('render-bullet') ??
        this.getAttribute('render-bullet') ??
        this.getAttribute('ui-render-bullet');

      for (let i = 0; i < totalPages; i++) {
        const bullet = document.createElement('ui-carousel-bullet') as UiCarouselBullet;
        bullet.setAttribute('data-carousel-generated', '');
        bullet.setAttribute('index', String(pageStarts[i] ?? i));
        bullet.setAttribute('aria-label', `Page ${i + 1} of ${totalPages}`);

        if (template) {
          bullet.innerHTML = template
            .replace(/\{\{\s*index\s*\}\}/g, String(i))
            .replace(/\{\{\s*page\s*\}\}/g, String(i + 1));
        }

        this.appendChild(bullet);
        this.#bullets.push(bullet);
      }
    } else {
      this.#bullets = existing;
      this.#bullets.forEach((bullet, i) => bullet.setAttribute('index', String(pageStarts[i] ?? i)));
    }

    // Dynamic bullets visibility (if per-view is set)
    const limit = Number(this.perView) > 0 ? Number(this.perView) : totalPages;
    const half = Math.floor(limit / 2);
    let start = Math.max(0, activePage - half);
    if (start + limit > totalPages) {
      start = Math.max(0, totalPages - limit);
    }
    const end = start + limit;

    this.#bullets.forEach((b, i) => {
      b.setActive(i === activePage);
      if (limit < totalPages) {
        b.style.display = i >= start && i < end ? '' : 'none';
      } else {
        b.style.display = '';
      }
    });
  }
}

/* ============================================================
   <ui-carousel-pagination-progress>
   ============================================================ */

export class UiCarouselPaginationProgress extends BaseElement {
  setProgress(progressPercent: number): void {
    const clamped = Math.max(0, Math.min(100, progressPercent));
    this.style.setProperty('--ui-carousel-pagination-progress', `${clamped.toFixed(1)}%`);
    this.style.setProperty('--core-carousel-pagination-progress', `${clamped.toFixed(1)}%`);
    this.style.setProperty('--ui-pagination-progress', `${clamped.toFixed(1)}%`);
    this.setAttribute('aria-valuenow', String(Math.round(clamped)));
  }
}

/* ============================================================
   <ui-carousel-page> & <ui-carousel-size>
   ============================================================ */

export class UiCarouselPage extends BaseElement {
  setPage(currentPage: number): void {
    this.textContent = String(currentPage + 1);
  }
}

export class UiCarouselSize extends BaseElement {
  static override properties = {
    mode: { name: 'mode', default: 'page' }, // 'page' or 'slide'
  };

  declare mode: 'page' | 'slide';

  setSize(totalPages: number, totalSlides: number): void {
    this.textContent = String(this.mode === 'slide' ? totalSlides : totalPages);
  }
}

/* ============================================================
   <ui-carousel-trigger>
   ============================================================ */

export class UiCarouselTrigger extends BaseElement {
  static override properties = {
    index: { name: 'index', default: 0 },
    carouselSelector: { name: 'carousel-selector', default: '' },
    trigger: { name: 'trigger', default: 'click' }, // 'click' | 'hover'
  };

  declare index: number;
  declare carouselSelector: string;
  declare trigger: 'click' | 'hover';

  protected override onConnect(): void {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mode = isTouch && this.trigger === 'hover' ? 'click' : this.trigger;

    const action = (): void => {
      const c = findTargetCarousel(this, this.carouselSelector);
      if (c) c.goTo(Number(this.index));
    };

    if (mode === 'hover') {
      this.$on(this, 'mouseenter', action);
    } else {
      this.$on(this, 'click', action);
    }
  }

  updateActive(targetActiveIndex: number): void {
    if (Number(this.index) === targetActiveIndex) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
  }
}

/** Thumbnail rail nested in a carousel. Slides stay in authored DOM order. */
export class UiCarouselThumbnail extends BaseElement {
  protected override onConnect(): void {
    this.setAttribute('role', 'group');
    this.setAttribute('aria-label', this.getAttribute('aria-label') || 'Carousel thumbnails');
    this.$on(this, 'click', ((event: MouseEvent) => this.#activate(event.target)) as EventListener);
    this.$on(this, 'keydown', ((event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const slide = (event.target as Element)?.closest('ui-carousel-slide, core-carousel-slide');
      if (!slide || !this.contains(slide)) return;
      event.preventDefault();
      this.#activate(slide);
    }) as EventListener);
  }

  setActiveIndex(index: number, total: number): void {
    const slides = this.#slides();
    const perView = Math.max(1, Number(this.getAttribute('ui-per-view') ?? this.getAttribute('per-view') ?? 7) || 7);
    const gap = Math.max(0, Number(this.getAttribute('ui-gap') ?? this.getAttribute('gap') ?? 8) || 0);
    const list = this.querySelector<HTMLElement>('ui-carousel-list, core-carousel-list');
    if (list) list.style.gap = `${gap}px`;
    slides.forEach((slide, slideIndex) => {
      slide.style.flex = `0 0 calc((100% - ${(perView - 1) * gap}px) / ${perView})`;
      slide.setAttribute('role', 'button');
      slide.setAttribute('aria-label', `Show slide ${slideIndex + 1} of ${total}`);
      slide.setAttribute('aria-current', String(slideIndex === index));
      slide.tabIndex = 0;
      slide.toggleAttribute('active', slideIndex === index);
    });
  }

  #slides(): HTMLElement[] {
    const list = this.querySelector('ui-carousel-list, core-carousel-list');
    return list ? [...list.children].filter((element): element is HTMLElement => element instanceof HTMLElement) : [];
  }

  #activate(target: EventTarget | null): void {
    const slide = target instanceof Element ? target.closest('ui-carousel-slide, core-carousel-slide') : null;
    if (!slide || !this.contains(slide)) return;
    const index = this.#slides().indexOf(slide as HTMLElement);
    if (index >= 0) {
      const carousel = findTargetCarousel(this);
      carousel?.interact();
      carousel?.selectThumbnail(index);
    }
  }
}

// Register subcomponents
export class CoreCarouselPrev extends UiCarouselPrev {}
export class CoreCarouselNext extends UiCarouselNext {}
export class CoreCarouselBullet extends UiCarouselBullet {}
export class CoreCarouselPagination extends UiCarouselPagination {}
export class CoreCarouselPaginationProgress extends UiCarouselPaginationProgress {}
export class CoreCarouselPage extends UiCarouselPage {}
export class CoreCarouselSize extends UiCarouselSize {}
export class CoreCarouselTrigger extends UiCarouselTrigger {}
export class UiCarouselInner extends HTMLElement {}
export class UiCarouselList extends HTMLElement {}
export class UiCarouselSlide extends HTMLElement {}

define('ui-carousel-prev', UiCarouselPrev);
define('core-carousel-prev', CoreCarouselPrev);

define('ui-carousel-next', UiCarouselNext);
define('core-carousel-next', CoreCarouselNext);

define('ui-carousel-bullet', UiCarouselBullet);
define('core-carousel-bullet', CoreCarouselBullet);

define('ui-carousel-pagination', UiCarouselPagination);
define('core-carousel-pagination', CoreCarouselPagination);

define('ui-carousel-pagination-progress', UiCarouselPaginationProgress);
define('core-carousel-pagination-progress', CoreCarouselPaginationProgress);

define('ui-carousel-page', UiCarouselPage);
define('core-carousel-page', CoreCarouselPage);

define('ui-carousel-size', UiCarouselSize);
define('core-carousel-size', CoreCarouselSize);

define('ui-carousel-trigger', UiCarouselTrigger);
define('core-carousel-trigger', CoreCarouselTrigger);
define('ui-carousel-thumbnail', UiCarouselThumbnail);
define('ui-carousel-inner', UiCarouselInner);
define('ui-carousel-list', UiCarouselList);
define('ui-carousel-slide', UiCarouselSlide);

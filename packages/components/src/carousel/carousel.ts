/**
 * <ui-carousel> / <core-carousel> — Production-grade Universal Web Component.
 * Implements full Functional Specification:
 * - Responsive breakpoints & column-width mode (ResizeObserver)
 * - Transitions: slide, fade, none
 * - Loop & Rewind distinct modes
 * - Pointer drag & swipe with threshold, RTL, vertical axis & click suppression
 * - Autoplay engine with RAF progress and accessibility pause
 * - Multi-carousel synchronization (sync-id) & named registry
 * - Auto-height adjustment
 * - Media lazy-loading
 * - Subcomponents (prev, next, pagination, bullets, page/size, triggers)
 */

import { BaseElement, define } from '@ui/core';
import { toCssEasing } from '@ui/tokens';
import { AutoplayEngine } from './autoplay.js';
import { parseBreakpoints, resolveResponsiveConfig } from './breakpoints.js';
import { DragController } from './drag.js';
import { registerCarousel, syncWithPeers, updateRegistration } from './sync.js';
import type {
  BreakpointConfig,
  CarouselChangeEventDetail,
  CarouselInstance,
  CarouselType,
} from './types.js';

let carouselUid = 0;

export class UiCarousel extends BaseElement implements CarouselInstance {
  static override properties = {
    name: { name: 'name', attr: 'name', default: '' },
    activeIndex: { name: 'activeIndex', attr: 'active-index', default: 0, reflect: true },
    index: { name: 'index', attr: 'index', default: 0, reflect: true }, // backward-compatibility
    perView: { name: 'perView', attr: 'per-view', default: 1 },
    perMove: { name: 'perMove', attr: 'per-move', default: 1 },
    gap: { name: 'gap', attr: 'gap', default: 20 },
    speed: { name: 'speed', attr: 'speed', default: 200 },
    autoplay: { name: 'autoplay', attr: 'autoplay', default: 0, reflect: true },
    autoHeight: { name: 'autoHeight', attr: 'auto-height', default: false },
    hoverPause: { name: 'hoverPause', attr: 'hover-pause', default: true },
    overflow: { name: 'overflow', attr: 'overflow', default: 'hidden' },
    vertical: { name: 'vertical', attr: 'vertical', default: false },
    rewind: { name: 'rewind', attr: 'rewind', default: false },
    loop: { name: 'loop', attr: 'loop', default: false, reflect: true },
    rtl: { name: 'rtl', attr: 'rtl', default: false },
    draggable: { name: 'draggable', attr: 'draggable', default: true },
    easing: { name: 'easing', attr: 'easing', default: 'easeOutQuad' },
    type: { name: 'type', attr: 'type', default: 'slide' as CarouselType },
    columnWidth: { name: 'columnWidth', attr: 'column-width', default: 0 },
    stopAutoplayOnInteraction: { name: 'stopAutoplayOnInteraction', attr: 'stop-autoplay-on-interaction', default: false },
    progress: { name: 'progress', attr: 'progress', default: false },
    syncId: { name: 'syncId', attr: 'sync-id', default: '' },
    mediaLazyload: { name: 'mediaLazyload', attr: 'media-lazyload', default: true },
    observed: { name: 'observed', attr: 'observed', default: '' },
    breakpoints: { name: 'breakpoints', attr: 'breakpoints', default: '' },
    noArrows: { name: 'noArrows', attr: 'no-arrows', default: false },
    noDots: { name: 'noDots', attr: 'no-dots', default: false },
  };

  static override get observedAttributes() {
    return [
      'name', 'ui-name',
      'active-index', 'ui-active-index', 'index',
      'per-view', 'ui-per-view',
      'per-move', 'ui-per-move',
      'gap', 'ui-gap',
      'speed', 'ui-speed',
      'autoplay', 'ui-autoplay',
      'auto-height', 'ui-autoheight',
      'hover-pause', 'ui-hover-pause',
      'overflow', 'ui-overflow',
      'vertical', 'ui-vertical',
      'rewind', 'ui-rewind',
      'loop', 'ui-loop',
      'rtl', 'ui-rtl',
      'draggable', 'ui-draggable',
      'easing', 'ui-easing',
      'type', 'ui-type',
      'column-width', 'ui-column-width',
      'stop-autoplay-on-interaction', 'ui-stop-autoplay-on-interaction',
      'progress', 'ui-progress',
      'sync-id', 'ui-sync-id',
      'media-lazyload', 'ui-media-lazyload',
      'observed', 'ui-observed',
      'breakpoints', 'ui-breakpoints',
      'render-bullet', 'ui-render-bullet',
      'no-arrows',
      'no-dots',
    ];
  }

  declare name: string;
  declare activeIndex: number;
  declare index: number;
  declare perView: number;
  declare perMove: number;
  declare gap: number;
  declare speed: number;
  declare autoplay: number;
  declare autoHeight: boolean;
  declare hoverPause: boolean;
  declare overflow: 'visible' | 'hidden';
  declare vertical: boolean;
  declare rewind: boolean;
  declare loop: boolean;
  declare rtl: boolean;
  declare draggable: boolean;
  declare easing: string;
  declare type: CarouselType;
  declare columnWidth: number;
  declare stopAutoplayOnInteraction: boolean;
  declare progress: boolean;
  declare syncId: string;
  declare mediaLazyload: boolean;
  declare observed: string;
  declare breakpoints: string;
  declare noArrows: boolean;
  declare noDots: boolean;

  readonly #id = `carousel-${++carouselUid}`;
  #slides: HTMLElement[] = [];
  #track: HTMLElement | null = null;
  #viewport: HTMLElement | null = null;
  #autoplayEngine: AutoplayEngine | null = null;
  #dragController: DragController | null = null;
  #unregisterSync: (() => void) | null = null;
  #resizeObserver: ResizeObserver | null = null;
  #selectedIndex = 0;
  #cloneCount = 0;
  #loopResetTimer: ReturnType<typeof setTimeout> | null = null;

  #currentWidth = 0;
  #effectiveConfig = {
    perView: 1,
    perMove: 1,
    gap: 20,
    overflow: 'hidden' as 'visible' | 'hidden',
    vertical: false,
  };

  get effectiveName(): string {
    return this.getAttribute('ui-name') ?? this.getAttribute('name') ?? this.name ?? '';
  }

  get effectiveSyncId(): string {
    return this.getAttribute('ui-sync-id') ?? this.getAttribute('sync-id') ?? this.syncId ?? '';
  }

  get effectiveType(): CarouselType {
    const raw = (this.getAttribute('ui-type') || this.getAttribute('type') || this.type || 'slide').toLowerCase();
    const valid: CarouselType[] = ['slide', 'fade', 'none', 'nature', 'water', 'urban', 'wind'];
    return (valid.includes(raw as CarouselType) ? raw : 'slide') as CarouselType;
  }

  get effectiveEasing(): string {
    return this.getAttribute('ui-easing') || this.getAttribute('easing') || this.easing || 'easeOutQuad';
  }

  get effectiveSpeed(): number {
    const raw = this.getAttribute('ui-speed') ?? this.getAttribute('speed');
    return raw !== null ? Number(raw) || 0 : (this.speed ?? 200);
  }

  get effectiveAutoplay(): number {
    const raw = this.getAttribute('ui-autoplay') ?? this.getAttribute('autoplay');
    return raw !== null ? Number(raw) || 0 : (Number(this.autoplay) || 0);
  }

  get effectiveGap(): number {
    const raw = this.getAttribute('ui-gap') ?? this.getAttribute('gap');
    return raw !== null ? Number(raw) : (Number(this.gap) >= 0 ? Number(this.gap) : 20);
  }

  get effectivePerView(): number {
    return this.#effectiveConfig.perView;
  }

  get slidesCount(): number {
    return this.#slides.length;
  }

  get pageCount(): number {
    if (this.#slides.length === 0) return 0;
    return Math.ceil(this.#slides.length / this.effectivePerView);
  }

  get currentPage(): number {
    if (this.#slides.length === 0) return 0;
    const starts = this.#pageStarts();
    for (let page = starts.length - 1; page >= 0; page--) {
      if (this.activeIndex >= starts[page]!) return page;
    }
    return 0;
  }

  #pageStarts(): number[] {
    const maxIndex = Math.max(0, this.#slides.length - this.effectivePerView);
    return Array.from({ length: this.pageCount }, (_, page) => Math.min(page * this.effectivePerView, maxIndex));
  }

  get isLooping(): boolean {
    const attr = this.getAttribute('ui-loop') ?? this.getAttribute('loop');
    const loopEnabled = attr !== null ? (attr !== 'false' && attr !== '0') : Boolean(this.loop);
    return loopEnabled && !this.querySelector('ui-carousel-thumbnail') && this.#slides.length > this.effectivePerView;
  }

  get isRewind(): boolean {
    const attr = this.getAttribute('ui-rewind') ?? this.getAttribute('rewind');
    return attr !== null ? (attr !== 'false' && attr !== '0') : Boolean(this.rewind);
  }

  get isAutoHeight(): boolean {
    const attr = this.getAttribute('ui-autoheight') ?? this.getAttribute('auto-height');
    return attr !== null ? (attr !== 'false' && attr !== '0') : Boolean(this.autoHeight);
  }

  get isHoverPause(): boolean {
    const attr = this.getAttribute('ui-hover-pause') ?? this.getAttribute('hover-pause');
    return attr !== null ? (attr !== 'false' && attr !== '0') : (this.hoverPause ?? true);
  }

  get isVertical(): boolean {
    const attr = this.getAttribute('ui-vertical') ?? this.getAttribute('vertical');
    return attr !== null ? (attr !== 'false' && attr !== '0') : Boolean(this.vertical);
  }

  get isDraggable(): boolean {
    const attr = this.getAttribute('ui-draggable') ?? this.getAttribute('draggable');
    if (attr === 'false' || attr === '0') return false;
    return this.draggable !== false;
  }

  get isMediaLazyload(): boolean {
    const attr = this.getAttribute('ui-media-lazyload') ?? this.getAttribute('media-lazyload');
    return attr !== null ? (attr !== 'false' && attr !== '0') : (this.mediaLazyload ?? true);
  }

  get stopsAutoplayOnInteraction(): boolean {
    const attr = this.getAttribute('ui-stop-autoplay-on-interaction') ?? this.getAttribute('stop-autoplay-on-interaction');
    return attr !== null ? (attr !== 'false' && attr !== '0') : Boolean(this.stopAutoplayOnInteraction);
  }

  get isRtl(): boolean {
    const explicit = this.getAttribute('ui-rtl') ?? this.getAttribute('rtl');
    if (explicit !== null) return explicit !== 'false' && explicit !== '0';
    return (
      (this.ownerDocument ?? document).dir === 'rtl' ||
      (this.ownerDocument ?? document).documentElement.getAttribute('dir') === 'rtl'
    );
  }

  get isPlaying(): boolean {
    return this.#autoplayEngine?.isRunning ?? false;
  }

  protected override onConnect(): void {
    this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', 'carousel');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;

    this.#unregisterSync = registerCarousel(this.#id, this, this.effectiveName, this.effectiveSyncId);

    const initial = this.getAttribute('ui-active-index') ?? this.getAttribute('active-index') ?? this.getAttribute('index');
    if (initial !== null && Number.isFinite(Number(initial))) {
      this.activeIndex = Math.max(0, Number(initial));
    }

    this.#initDOM();
    this.#updateResponsiveConfig();
    this.activeIndex = Math.min(this.activeIndex, Math.max(0, this.#slides.length - this.effectivePerView));
    this.#selectedIndex = this.activeIndex;
    this.#render();

    this.#initAutoplay();
    this.#initDrag();
    this.#initResize();
    this.$on(this.#track!, 'transitionend', ((event: TransitionEvent) => {
      if (event.target === this.#track && event.propertyName === 'transform') this.#finishLoopJump();
    }) as EventListener);

    // Keyboard navigation
    this.$on(document, 'keydown', ((e: KeyboardEvent) => {
      if (!this.isConnected) return;
      const active = (this.ownerDocument ?? document).activeElement;
      const isTarget = active === this || this.contains(active) ||
        (this.localName !== 'ui-carousel' && (!active || active === document.body || active === document.documentElement));
      if (!isTarget) return;

      const isVert = this.isVertical;
      if (!isVert) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.isRtl ? this.prev() : this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.isRtl ? this.next() : this.prev();
        }
      } else {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.next();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.prev();
        }
      }
    }) as EventListener);

    this.setAttribute('initialized', '');
    this.$emit('ui-carousel:init', { id: this.#id });
  }

  protected override onDisconnect(): void {
    if (this.#loopResetTimer !== null) clearTimeout(this.#loopResetTimer);
    this.#loopResetTimer = null;
    this.#autoplayEngine?.destroy();
    this.#autoplayEngine = null;
    this.#dragController?.destroy();
    this.#dragController = null;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#unregisterSync?.();
    this.#unregisterSync = null;

    this.removeAttribute('initialized');
    this.$emit('ui-carousel:destroy', { id: this.#id });
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'active-index' || name === 'ui-active-index' || name === 'index') {
      const idx = Number(this.getAttribute(name));
      if (Number.isFinite(idx) && idx !== this.activeIndex) {
        this.goTo(idx);
      }
    } else if (name === 'autoplay' || name === 'ui-autoplay') {
      const ms = this.effectiveAutoplay;
      this.#autoplayEngine?.updateOptions({ interval: ms });
      if (ms > 0) this.#autoplayEngine?.play();
      else this.#autoplayEngine?.pause();
    } else if (name === 'stop-autoplay-on-interaction' || name === 'ui-stop-autoplay-on-interaction') {
      this.#autoplayEngine?.updateOptions({ stopOnInteraction: this.stopsAutoplayOnInteraction });
    } else if (name === 'name' || name === 'ui-name' || name === 'sync-id' || name === 'ui-sync-id') {
      updateRegistration(this.#id, this, this.effectiveName, this.effectiveSyncId);
    } else if (name === 'observed' || name === 'ui-observed') {
      this.refresh();
    } else if ([
      'per-view', 'ui-per-view',
      'per-move', 'ui-per-move',
      'gap', 'ui-gap',
      'speed', 'ui-speed',
      'vertical', 'ui-vertical',
      'overflow', 'ui-overflow',
      'breakpoints', 'ui-breakpoints',
      'column-width', 'ui-column-width',
      'type', 'ui-type',
      'easing', 'ui-easing',
      'loop', 'ui-loop',
      'rewind', 'ui-rewind',
    ].includes(name)) {
      this.#updateResponsiveConfig();
      this.#render();
    }
  }

  /* ============================================================
     Public Navigation API
     ============================================================ */

  next(amount?: number): void {
    const step = amount ?? this.#effectiveConfig.perMove;
    const maxIndex = Math.max(0, this.#slides.length - this.effectivePerView);
    let target = this.activeIndex + step;

    if (this.activeIndex >= maxIndex) {
      if (this.isLooping || this.rewind) {
        target = 0;
      } else {
        return; // at boundary
      }
    } else if (target > maxIndex) {
      target = maxIndex;
    }

    this.#navigate(target, 'next');
  }

  prev(amount?: number): void {
    const step = amount ?? this.#effectiveConfig.perMove;
    const maxIndex = Math.max(0, this.#slides.length - this.effectivePerView);
    let target = this.activeIndex - step;

    if (this.activeIndex <= 0) {
      if (this.isLooping || this.rewind) {
        target = maxIndex;
      } else {
        return; // at boundary
      }
    } else if (target < 0) {
      target = 0;
    }

    this.#navigate(target, 'prev');
  }

  goTo(targetIndex: number): void {
    const maxIndex = Math.max(0, this.#slides.length - this.effectivePerView);
    const clamped = Math.max(0, Math.min(maxIndex, Math.round(targetIndex)));
    const dir = clamped > this.activeIndex ? 'next' : clamped < this.activeIndex ? 'prev' : 'none';
    this.#navigate(clamped, dir);
  }

  goto(targetIndex: number): void {
    this.goTo(targetIndex);
  }

  play(): void {
    this.#autoplayEngine?.play();
  }

  pause(): void {
    this.#autoplayEngine?.pause();
  }

  interact(): void {
    this.#autoplayEngine?.onUserInteraction();
  }

  refresh(): void {
    this.#initDOM();
    this.#updateResponsiveConfig();
    this.activeIndex = Math.min(this.activeIndex, Math.max(0, this.#slides.length - this.effectivePerView));
    this.#render();
  }

  selectThumbnail(index: number): void {
    if (this.#slides.length === 0) return;
    const selected = Math.max(0, Math.min(this.#slides.length - 1, Math.round(index)));
    this.goTo(selected);
    this.#selectedIndex = selected;
    this.#updateSubcomponents();
  }

  destroy(): void {
    this.onDisconnect();
  }

  // ──────────────────────────────────────────────────────────
  // Private internals

  #navigate(newIndex: number, direction: 'next' | 'prev' | 'none'): void {
    if (newIndex === this.activeIndex && direction === 'none') return;
    if (this.#loopResetTimer !== null) this.#finishLoopJump();

    const previousIndex = this.activeIndex;
    const previousPage = this.currentPage;
    const loopingWithClones = this.#cloneCount > 0;
    const isNextWrap = loopingWithClones && direction === 'next' && previousIndex >= Math.max(0, this.#slides.length - this.effectivePerView) && newIndex === 0;
    const isPrevWrap = loopingWithClones && direction === 'prev' && previousIndex === 0 && newIndex > 0;

    this.activeIndex = newIndex;
    this.index = newIndex;
    if (this.#selectedIndex < newIndex || this.#selectedIndex >= newIndex + this.effectivePerView || direction !== 'none') {
      this.#selectedIndex = newIndex;
    }
    this.setAttribute('active-index', String(newIndex));
    this.setAttribute('index', String(newIndex));
    if (this.hasAttribute('ui-active-index')) this.setAttribute('ui-active-index', String(newIndex));

    this.#render(isNextWrap ? this.#cloneCount + this.#slides.length : isPrevWrap ? 0 : undefined);
    if (isNextWrap || isPrevWrap) {
      if (this.#loopResetTimer !== null) clearTimeout(this.#loopResetTimer);
      this.#loopResetTimer = setTimeout(() => this.#finishLoopJump(), this.effectiveSpeed + 30);
    }

    // Broadcast sync to other carousels
    syncWithPeers(this.#id, this.effectiveSyncId, newIndex);

    // Dispatch normalized custom events
    const detail: CarouselChangeEventDetail = {
      activeIndex: newIndex,
      previousIndex,
      page: this.currentPage,
      previousPage,
      direction,
      index: newIndex,
    };

    this.$emit('ui-carousel:change', detail);
    this.$emit('ui-carousel-change', detail); // backward-compatible
  }

  #initDOM(): void {
    const directChildren = [...this.children].filter((element): element is HTMLElement => element instanceof HTMLElement);
    const authoredViewport = directChildren.find((element) => /^(ui|core)-carousel-inner$/.test(element.tagName.toLowerCase())) ?? null;
    let viewport = authoredViewport ?? directChildren.find((element) => element.hasAttribute('data-carousel-viewport')) ?? null;
    let track = viewport
      ? [...viewport.children].find((element): element is HTMLElement => element instanceof HTMLElement &&
          (authoredViewport ? /^(ui|core)-carousel-list$/.test(element.tagName.toLowerCase()) : element.hasAttribute('data-carousel-track'))) ?? null
      : null;
    track?.querySelectorAll('[data-carousel-clone]').forEach((clone) => clone.remove());
    this.#cloneCount = 0;

    if (authoredViewport && track) {
      authoredViewport.setAttribute('data-carousel-viewport', '');
      track.setAttribute('data-carousel-track', '');
      this.#slides = [...track.children].filter((el): el is HTMLElement => el instanceof HTMLElement && /^(ui|core)-carousel-slide$/.test(el.tagName.toLowerCase()));
    }

    if (!viewport || !track) {
      this.#slides = [...this.children].filter((el): el is HTMLElement => {
        if (!(el instanceof HTMLElement)) return false;
        const tag = el.tagName.toLowerCase();
        return (
          !tag.startsWith('core-carousel-') &&
          !tag.startsWith('ui-carousel-') &&
          !el.hasAttribute('data-carousel-ignore')
        );
      });

      viewport = document.createElement('div');
      viewport.setAttribute('data-carousel-viewport', '');
      viewport.style.width = '100%';
      viewport.style.height = '100%';
      viewport.style.position = 'relative';

      track = document.createElement('div');
      track.setAttribute('data-carousel-track', '');
      track.style.display = 'flex';
      track.style.width = '100%';
      track.style.height = '100%';
      track.style.position = 'relative';

      for (const slide of this.#slides) {
        track.appendChild(slide);
      }

      viewport.appendChild(track);
      this.prepend(viewport);
    } else {
      // If viewport & track already exist, move any newly added slide elements into track
      const orphanSlides = [...this.children].filter((el): el is HTMLElement => {
        if (!(el instanceof HTMLElement)) return false;
        if (el === viewport) return false;
        const tag = el.tagName.toLowerCase();
        return (
          !tag.startsWith('core-carousel-') &&
          !tag.startsWith('ui-carousel-') &&
          !el.hasAttribute('data-carousel-ignore')
        );
      });
      for (const s of orphanSlides) {
        track.appendChild(s);
      }
      this.#slides = [...track.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
    }

    this.#viewport = viewport;
    this.#track = track;

    // Apply viewport overflow
    this.#viewport.style.overflow = this.#effectiveConfig.overflow;

    // Apply touch-action for swipe gestures
    const isVertical = this.#effectiveConfig.vertical;
    const touchAction = isVertical ? 'pan-x' : 'pan-y';
    this.style.touchAction = touchAction;
    this.#viewport.style.touchAction = touchAction;
    this.#track.style.touchAction = touchAction;

    // Tag slides with accessibility semantics and gesture support
    this.#slides.forEach((slide, idx) => {
      slide.style.touchAction = touchAction;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${idx + 1} of ${this.#slides.length}`);
    });
  }

  #updateResponsiveConfig(): void {
    const rawBreakpoints = this.getAttribute('ui-breakpoints') ?? this.getAttribute('breakpoints') ?? this.breakpoints;
    const bps = parseBreakpoints(rawBreakpoints);

    const width = this.#currentWidth || this.getBoundingClientRect().width || window.innerWidth;
    const rawColWidth = this.getAttribute('ui-column-width') ?? this.getAttribute('column-width');
    const colWidth = rawColWidth !== null ? Number(rawColWidth) : (Number(this.columnWidth) || 0);

    const rawPerView = this.getAttribute('ui-per-view') ?? this.getAttribute('per-view');
    const basePerView = rawPerView !== null ? Number(rawPerView) : (Number(this.perView) || 1);

    const rawPerMove = this.getAttribute('ui-per-move') ?? this.getAttribute('per-move');
    const basePerMove = rawPerMove !== null ? Number(rawPerMove) : (Number(this.perMove) || 1);

    const rawGap = this.getAttribute('ui-gap') ?? this.getAttribute('gap');
    const baseGap = rawGap !== null ? Number(rawGap) : (Number(this.gap) >= 0 ? Number(this.gap) : 20);

    const rawOverflow = (this.getAttribute('ui-overflow') ?? this.getAttribute('overflow') ?? this.overflow) as 'visible' | 'hidden';

    this.#effectiveConfig = resolveResponsiveConfig(
      width,
      {
        perView: basePerView,
        perMove: basePerMove,
        gap: baseGap,
        overflow: rawOverflow === 'visible' ? 'visible' : 'hidden',
        vertical: this.isVertical,
        columnWidth: colWidth,
      },
      bps,
    );
  }

  #syncLoopClones(): void {
    if (!this.#track) return;
    const desired = this.localName === 'ui-carousel' && this.isLooping && this.effectiveType === 'slide'
      ? Math.min(this.effectivePerView, this.#slides.length) : 0;
    if (desired === this.#cloneCount) return;

    this.#track.querySelectorAll('[data-carousel-clone]').forEach((clone) => clone.remove());
    this.#cloneCount = desired;
    if (desired === 0) return;

    const clone = (slide: HTMLElement): HTMLElement => {
      const copy = slide.cloneNode(true) as HTMLElement;
      copy.setAttribute('data-carousel-clone', '');
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      copy.removeAttribute('id');
      copy.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
      return copy;
    };
    const before = this.#slides.slice(-desired).map(clone);
    const after = this.#slides.slice(0, desired).map(clone);
    this.#track.prepend(...before);
    this.#track.append(...after);
  }

  #finishLoopJump(): void {
    if (this.#loopResetTimer === null || !this.#track) return;
    clearTimeout(this.#loopResetTimer);
    this.#loopResetTimer = null;
    const track = this.#track;
    const { perView, gap, vertical } = this.#effectiveConfig;
    const position = this.activeIndex + this.#cloneCount;
    const percent = position * (100 / perView);
    const gapOffset = position * (gap / perView);
    const sign = this.isRtl ? '' : '-';
    track.style.transition = 'none';
    track.style.transform = vertical
      ? `translateY(calc(-${percent}% - ${gapOffset}px))`
      : `translateX(calc(${sign}${percent}% ${sign} ${gapOffset}px))`;
    requestAnimationFrame(() => {
      if (this.isConnected && this.#track === track) {
        track.style.transition = `transform ${this.effectiveSpeed}ms ${toCssEasing(this.effectiveEasing)}`;
      }
    });
  }

  #render(loopVisualIndex?: number): void {
    if (!this.#track || !this.#viewport) return;

    const { perView, gap, vertical, overflow } = this.#effectiveConfig;
    const transType = this.effectiveType;
    const isNone = transType === 'none';
    const total = this.#slides.length;
    const active = this.activeIndex;

    this.#syncLoopClones();

    this.#viewport.style.overflow = overflow;

    const cssDuration = isNone ? '0ms' : `${this.effectiveSpeed}ms`;
    const cssEasing = toCssEasing(this.effectiveEasing || 'easeOutQuad');

    // Slide step offset formula
    const visualIndex = loopVisualIndex ?? active + this.#cloneCount;
    const offsetPercent = visualIndex * (100 / perView);
    const offsetGapPx = visualIndex * (gap / perView);
    const sign = this.isRtl ? '' : '-';
    const translateValue = vertical
      ? `translateY(calc(-${offsetPercent}% - ${offsetGapPx}px))`
      : `translateX(calc(${sign}${offsetPercent}% ${sign} ${offsetGapPx}px))`;

    const gapTotalPercent = (perView - 1) * gap;
    const slideBasis = perView > 1 ? `calc((100% - ${gapTotalPercent}px) / ${perView})` : '100%';
    this.#track.querySelectorAll<HTMLElement>('[data-carousel-clone]').forEach((clone) => {
      clone.style.flex = `0 0 ${slideBasis}`;
      clone.style.width = vertical ? '100%' : slideBasis;
      if (vertical) clone.style.height = slideBasis;
    });

    if (transType === 'fade') {
      // 1. Cross-fade: opacity & subtle scale
      this.#viewport.style.perspective = 'none';
      this.#track.style.transform = 'none';
      this.#track.style.display = 'block';
      this.#track.style.position = 'relative';

      this.#slides.forEach((slide, idx) => {
        slide.style.position = 'absolute';
        slide.style.top = '0';
        slide.style.left = '0';
        slide.style.width = '100%';
        slide.style.height = '100%';
        slide.style.filter = 'none';
        slide.style.transition = `opacity ${cssDuration} ${cssEasing}, transform ${cssDuration} ${cssEasing}, visibility ${cssDuration}`;

        const isCurrent = idx === active;
        slide.style.opacity = isCurrent ? '1' : '0';
        slide.style.visibility = isCurrent ? 'visible' : 'hidden';
        slide.style.zIndex = isCurrent ? '2' : '1';
        slide.style.transform = isCurrent ? 'scale(1)' : 'scale(1.03)';

        this.#applySlideStates(slide, idx, active, 1);
      });
    } else if (transType === 'nature') {
      // 2. Nature: Organic depth, scale zoom & soft depth-of-field blur
      this.#viewport.style.perspective = '1000px';
      this.#track.style.transform = 'none';
      this.#track.style.display = 'block';
      this.#track.style.position = 'relative';

      this.#slides.forEach((slide, idx) => {
        slide.style.position = 'absolute';
        slide.style.top = '0';
        slide.style.left = '0';
        slide.style.width = '100%';
        slide.style.height = '100%';
        slide.style.transformOrigin = 'center center';
        slide.style.transition = `transform ${cssDuration} ${cssEasing}, opacity ${cssDuration} ${cssEasing}, filter ${cssDuration} ${cssEasing}, visibility ${cssDuration}`;

        const isCurrent = idx === active;
        const isPrev = idx === active - 1 || (active === 0 && idx === total - 1 && this.isLooping);
        const isNext = idx === active + 1 || (active === total - 1 && idx === 0 && this.isLooping);

        if (isCurrent) {
          slide.style.opacity = '1';
          slide.style.visibility = 'visible';
          slide.style.zIndex = '3';
          slide.style.transform = 'scale(1) translateZ(0)';
          slide.style.filter = 'blur(0px)';
        } else if (isPrev) {
          slide.style.opacity = '0.4';
          slide.style.visibility = 'visible';
          slide.style.zIndex = '2';
          slide.style.transform = 'scale(0.88) translateY(-10px)';
          slide.style.filter = 'blur(4px)';
        } else if (isNext) {
          slide.style.opacity = '0.4';
          slide.style.visibility = 'visible';
          slide.style.zIndex = '2';
          slide.style.transform = 'scale(0.88) translateY(10px)';
          slide.style.filter = 'blur(4px)';
        } else {
          slide.style.opacity = '0';
          slide.style.visibility = 'hidden';
          slide.style.zIndex = '1';
          slide.style.transform = 'scale(0.78)';
          slide.style.filter = 'blur(8px)';
        }

        this.#applySlideStates(slide, idx, active, 1);
      });
    } else if (transType === 'urban') {
      // 3. Urban: 3D Architectural Perspective / Cube Coverflow
      this.#viewport.style.perspective = '1200px';
      this.#viewport.style.perspectiveOrigin = '50% 50%';
      this.#track.style.transform = 'none';
      this.#track.style.display = 'block';
      this.#track.style.position = 'relative';
      this.#track.style.transformStyle = 'preserve-3d';

      this.#slides.forEach((slide, idx) => {
        slide.style.position = 'absolute';
        slide.style.top = '0';
        slide.style.left = '0';
        slide.style.width = '100%';
        slide.style.height = '100%';
        slide.style.transformOrigin = '50% 50%';
        slide.style.filter = 'none';
        slide.style.transition = `transform ${cssDuration} ${cssEasing}, opacity ${cssDuration} ${cssEasing}, visibility ${cssDuration}`;

        const isCurrent = idx === active;
        const isPrev = idx === active - 1 || (active === 0 && idx === total - 1 && this.isLooping);
        const isNext = idx === active + 1 || (active === total - 1 && idx === 0 && this.isLooping);

        if (isCurrent) {
          slide.style.opacity = '1';
          slide.style.visibility = 'visible';
          slide.style.zIndex = '3';
          slide.style.transform = 'translate3d(0, 0, 0) rotateY(0deg) scale(1)';
        } else if (isPrev) {
          slide.style.opacity = '0.55';
          slide.style.visibility = 'visible';
          slide.style.zIndex = '2';
          slide.style.transform = 'translate3d(-55%, 0, -180px) rotateY(38deg) scale(0.86)';
        } else if (isNext) {
          slide.style.opacity = '0.55';
          slide.style.visibility = 'visible';
          slide.style.zIndex = '2';
          slide.style.transform = 'translate3d(55%, 0, -180px) rotateY(-38deg) scale(0.86)';
        } else {
          slide.style.opacity = '0';
          slide.style.visibility = 'hidden';
          slide.style.zIndex = '1';
          const dir = idx < active ? '-90%' : '90%';
          const rot = idx < active ? '55deg' : '-55deg';
          slide.style.transform = `translate3d(${dir}, 0, -320px) rotateY(${rot}) scale(0.7)`;
        }

        this.#applySlideStates(slide, idx, active, 1);
      });
    } else if (transType === 'water') {
      // 4. Water: Liquid fluid wave with fluid skew displacement
      this.#viewport.style.perspective = 'none';
      this.#track.style.display = 'flex';
      this.#track.style.position = 'relative';
      this.#track.style.flexDirection = vertical ? 'column' : 'row';
      this.#track.style.gap = `${gap}px`;
      this.#track.style.transition = `transform ${cssDuration} cubic-bezier(0.16, 1, 0.3, 1)`;
      this.#track.style.transform = translateValue;

      this.#slides.forEach((slide, idx) => {
        slide.style.position = 'relative';
        slide.style.flex = `0 0 ${slideBasis}`;
        if (vertical) {
          slide.style.height = slideBasis;
          slide.style.width = '100%';
        } else {
          slide.style.width = slideBasis;
        }
        slide.style.filter = 'none';
        slide.style.transition = `transform ${cssDuration} cubic-bezier(0.16, 1, 0.3, 1), opacity ${cssDuration} ease`;

        const isCurrent = idx === active;
        const isPrev = idx === active - 1;
        const isNext = idx === active + 1;

        if (isCurrent) {
          slide.style.opacity = '1';
          slide.style.visibility = 'visible';
          slide.style.transform = 'skewX(0deg) scale(1)';
        } else if (isPrev) {
          slide.style.opacity = '0.75';
          slide.style.visibility = 'visible';
          slide.style.transform = vertical ? 'skewY(-5deg) scale(0.95)' : 'skewX(-5deg) scale(0.95)';
        } else if (isNext) {
          slide.style.opacity = '0.75';
          slide.style.visibility = 'visible';
          slide.style.transform = vertical ? 'skewY(5deg) scale(0.95)' : 'skewX(5deg) scale(0.95)';
        } else {
          slide.style.opacity = '0.4';
          slide.style.visibility = 'visible';
          slide.style.transform = 'skewX(0deg) scale(0.92)';
        }

        this.#applySlideStates(slide, idx, active, perView);
      });
    } else if (transType === 'wind') {
      // 5. Wind: Aerodynamic slipstream drift with dynamic tilt
      this.#viewport.style.perspective = 'none';
      this.#track.style.display = 'flex';
      this.#track.style.position = 'relative';
      this.#track.style.flexDirection = vertical ? 'column' : 'row';
      this.#track.style.gap = `${gap}px`;
      this.#track.style.transition = `transform ${cssDuration} cubic-bezier(0.25, 1, 0.5, 1)`;
      this.#track.style.transform = translateValue;

      this.#slides.forEach((slide, idx) => {
        slide.style.position = 'relative';
        slide.style.flex = `0 0 ${slideBasis}`;
        if (vertical) {
          slide.style.height = slideBasis;
          slide.style.width = '100%';
        } else {
          slide.style.width = slideBasis;
        }
        slide.style.filter = 'none';
        slide.style.transition = `transform ${cssDuration} cubic-bezier(0.25, 1, 0.5, 1), opacity ${cssDuration} linear`;

        const isCurrent = idx === active;
        const isPrev = idx === active - 1;
        const isNext = idx === active + 1;

        if (isCurrent) {
          slide.style.opacity = '1';
          slide.style.visibility = 'visible';
          slide.style.transform = 'rotate(0deg) scale(1)';
        } else if (isPrev) {
          slide.style.opacity = '0.65';
          slide.style.visibility = 'visible';
          slide.style.transform = 'rotate(-3.5deg) translateY(-6px) scale(0.94)';
        } else if (isNext) {
          slide.style.opacity = '0.65';
          slide.style.visibility = 'visible';
          slide.style.transform = 'rotate(3.5deg) translateY(6px) scale(0.94)';
        } else {
          slide.style.opacity = '0.25';
          slide.style.visibility = 'visible';
          slide.style.transform = 'rotate(0deg) scale(0.88)';
        }

        this.#applySlideStates(slide, idx, active, perView);
      });
    } else {
      // 6. Slide (default) / None
      this.#viewport.style.perspective = 'none';
      this.#track.style.display = 'flex';
      this.#track.style.position = 'relative';
      this.#track.style.flexDirection = vertical ? 'column' : 'row';
      this.#track.style.gap = `${gap}px`;
      this.#track.style.transition = `transform ${cssDuration} ${cssEasing}`;
      this.#track.style.transform = translateValue;

      this.#slides.forEach((slide, idx) => {
        slide.style.position = 'relative';
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
        slide.style.zIndex = '';
        slide.style.filter = 'none';
        slide.style.transform = 'none';
        slide.style.flex = `0 0 ${slideBasis}`;
        if (vertical) {
          slide.style.height = slideBasis;
          slide.style.width = '100%';
        } else {
          slide.style.width = slideBasis;
        }

        this.#applySlideStates(slide, idx, active, perView);
      });
    }

    // Auto-height adjustment
    if (this.isAutoHeight && this.#slides[active]) {
      const h = Math.max(...this.#slides.slice(active, active + perView).map((slide) => slide.offsetHeight));
      if (h > 0) {
        this.#viewport.style.height = `${h}px`;
        this.#viewport.style.transition = `height ${cssDuration} ${cssEasing}`;
      }
    }

    // Media and video lazy load
    if (this.isMediaLazyload) {
      this.#lazyloadMedia(active, perView);
    }

    // Update child subcomponents
    this.#updateSubcomponents();
  }

  #applySlideStates(slide: HTMLElement, idx: number, active: number, perView: number): void {
    const isActive = idx === active;
    const isVisible = idx >= active && idx < active + perView;
    const isPrev = idx === active - 1;
    const isNext = idx === active + 1;
    const isCenter = perView > 1 && idx === active + Math.floor(perView / 2);

    if (isActive) slide.setAttribute('active', '');
    else slide.removeAttribute('active');

    if (isVisible) slide.setAttribute('visible', '');
    else slide.removeAttribute('visible');

    if (isPrev) slide.setAttribute('prev', '');
    else slide.removeAttribute('prev');

    if (isNext) slide.setAttribute('next', '');
    else slide.removeAttribute('next');

    if (isCenter) slide.setAttribute('center', '');
    else slide.removeAttribute('center');

    slide.setAttribute('aria-hidden', String(!isVisible));
  }

  #lazyloadMedia(active: number, perView: number): void {
    const rangeEnd = active + perView + 1;
    for (let i = active; i < Math.min(this.#slides.length, rangeEnd); i++) {
      const slide = this.#slides[i];
      if (!slide) continue;

      // Lazyload images
      const images = slide.querySelectorAll<HTMLImageElement>('img[data-src]');
      images.forEach((img) => {
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
      });

      // Lazyload videos & cover
      const videos = slide.querySelectorAll<HTMLVideoElement>('video[data-src], video');
      videos.forEach((video) => {
        const src = video.getAttribute('data-src');
        if (src) {
          video.src = src;
          video.removeAttribute('data-src');
        }
        video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach((s) => {
          const sSrc = s.getAttribute('data-src');
          if (sSrc) {
            s.src = sSrc;
            s.removeAttribute('data-src');
            video.load();
          }
        });
        const poster = video.getAttribute('data-poster');
        if (poster) {
          video.poster = poster;
          video.removeAttribute('data-poster');
        }
        if (i === active && (video.hasAttribute('data-autoplay') || video.hasAttribute('autoplay'))) {
          video.play().catch(() => {});
        }
      });
    }
  }

  #updateSubcomponents(): void {
    const total = this.#slides.length;
    const perView = this.effectivePerView;
    const active = this.activeIndex;
    const pages = this.pageCount;
    const currentPage = this.currentPage;
    const maxIndex = Math.max(0, total - perView);

    const isPrevDisabled = active <= 0 && !this.isLooping && !this.isRewind;
    const isNextDisabled = active >= maxIndex && !this.isLooping && !this.isRewind;
    const isControlsHidden = total <= perView;

    // Prev / Next controls
    this.querySelectorAll<any>('ui-carousel-prev, core-carousel-prev').forEach((el) => {
      el.updateState?.(isPrevDisabled, isControlsHidden);
    });
    this.querySelectorAll<any>('ui-carousel-next, core-carousel-next').forEach((el) => {
      el.updateState?.(isNextDisabled, isControlsHidden);
    });

    // Pagination
    this.querySelectorAll<any>('ui-carousel-pagination, core-carousel-pagination').forEach((el) => {
      el.syncBullets?.(pages, currentPage, this.#pageStarts());
    });

    this.querySelectorAll<any>('ui-carousel-thumbnail').forEach((el) => {
      el.setActiveIndex?.(this.#selectedIndex, total);
    });

    // Pagination progress (0% to 100%)
    const progressPercent = pages > 1 ? (currentPage / (pages - 1)) * 100 : 100;
    this.querySelectorAll<any>('ui-carousel-pagination-progress, core-carousel-pagination-progress').forEach((el) => {
      el.setProgress?.(progressPercent);
    });

    // Page & Size
    this.querySelectorAll<any>('ui-carousel-page, core-carousel-page').forEach((el) => {
      el.setPage?.(currentPage);
    });
    this.querySelectorAll<any>('ui-carousel-size, core-carousel-size').forEach((el) => {
      el.setSize?.(pages, total);
    });

    // External triggers in document
    const triggers = document.querySelectorAll<any>('ui-carousel-trigger, core-carousel-trigger');
    triggers.forEach((trig) => {
      trig.updateActive?.(active);
    });
  }

  #initAutoplay(): void {
    this.#autoplayEngine = new AutoplayEngine({
      interval: this.effectiveAutoplay,
      hoverPause: this.isHoverPause,
      stopOnInteraction: this.stopsAutoplayOnInteraction,
      exposeProgress: this.progress || this.hasAttribute('ui-progress'),
      host: this,
      onAdvance: () => this.next(),
    });

    if (this.effectiveAutoplay > 0) {
      this.#autoplayEngine.play();
    }
  }

  #initDrag(): void {
    this.#dragController = new DragController({
      host: this,
      enabled: this.isDraggable,
      vertical: this.#effectiveConfig.vertical,
      rtl: this.isRtl,
      onDragStart: () => {
        this.#autoplayEngine?.onUserInteraction();
        if (this.#track) {
          this.#track.style.transition = 'none';
        }
      },
      onDragMove: (deltaPx) => {
        if (!this.#track) return;
        const transType = this.effectiveType;
        const isTrackMode = transType === 'slide' || transType === 'water' || transType === 'wind' || transType === 'none';

        if (isTrackMode) {
          const { perView, gap, vertical } = this.#effectiveConfig;
          const active = this.activeIndex;
          const total = this.#slides.length;
          const maxIndex = Math.max(0, total - perView);

          const basePercent = (active + this.#cloneCount) * (100 / perView);
          const baseGapPx = (active + this.#cloneCount) * (gap / perView);

          let effectiveDelta = deltaPx;
          const isAtStart = active <= 0;
          const isAtEnd = active >= maxIndex;
          const canPassBoundary = this.isLooping || this.isRewind;

          if (!canPassBoundary) {
            if (vertical) {
              if ((isAtStart && deltaPx > 0) || (isAtEnd && deltaPx < 0)) effectiveDelta = deltaPx * 0.35;
            } else if (this.isRtl) {
              if ((isAtStart && deltaPx < 0) || (isAtEnd && deltaPx > 0)) effectiveDelta = deltaPx * 0.35;
            } else {
              if ((isAtStart && deltaPx > 0) || (isAtEnd && deltaPx < 0)) effectiveDelta = deltaPx * 0.35;
            }
          }

          if (vertical) {
            this.#track.style.transform = `translateY(calc(-${basePercent}% - ${baseGapPx}px + ${effectiveDelta}px))`;
          } else if (this.isRtl) {
            this.#track.style.transform = `translateX(calc(${basePercent}% + ${baseGapPx}px + ${effectiveDelta}px))`;
          } else {
            this.#track.style.transform = `translateX(calc(-${basePercent}% - ${baseGapPx}px + ${effectiveDelta}px))`;
          }
        } else if (transType === 'urban') {
          const progress = Math.max(-1, Math.min(1, deltaPx / 250));
          const activeSlide = this.#slides[this.activeIndex];
          if (activeSlide) {
            activeSlide.style.transition = 'none';
            activeSlide.style.transform = `translate3d(${deltaPx}px, 0, ${-Math.abs(deltaPx) * 0.5}px) rotateY(${progress * -35}deg)`;
          }
        } else if (transType === 'nature' || transType === 'fade') {
          const progress = Math.min(1, Math.abs(deltaPx) / 200);
          const activeSlide = this.#slides[this.activeIndex];
          if (activeSlide) {
            activeSlide.style.transition = 'none';
            activeSlide.style.opacity = `${1 - progress * 0.5}`;
            activeSlide.style.transform = `scale(${1 - progress * 0.1}) translateX(${deltaPx * 0.4}px)`;
          }
        }
      },
      onDragEnd: (direction) => {
        if (!this.#track) return;
        const cssDuration = this.effectiveType === 'none' ? '0ms' : `${this.effectiveSpeed}ms`;
        const cssEasing = toCssEasing(this.effectiveEasing || 'easeOutQuad');
        this.#track.style.transition = `transform ${cssDuration} ${cssEasing}`;

        if (direction === 'next') {
          this.next();
        } else if (direction === 'prev') {
          this.prev();
        } else {
          this.#render();
        }
      },
    });
  }

  #initResize(): void {
    if (typeof ResizeObserver === 'undefined') return;

    this.#resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0 && Math.abs(width - this.#currentWidth) >= 2) {
          this.#currentWidth = width;
          this.#updateResponsiveConfig();
          this.#render();
          this.$emit('ui-carousel:resize', { width });
        }
      }
    });

    this.#resizeObserver.observe(this);
  }
}

// Register both <ui-carousel> and <core-carousel>
export class CoreCarousel extends UiCarousel {}
define('ui-carousel', UiCarousel);
define('core-carousel', CoreCarousel);
export const carousel = UiCarousel;

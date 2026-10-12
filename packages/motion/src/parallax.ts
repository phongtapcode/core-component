import { BaseElement, define } from '@ui/core';
import {
  parseKeyframes, parseParallaxBreakpoints, resolveKeyframes, resolveScrollPosition, sampleKeyframes,
  type ParallaxBreakpoints, type ParallaxFrame, type ParallaxKeyframes, type ParallaxValue,
} from './parallax-utils.js';

const TRANSFORM_KEYS = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'skew', 'skewX', 'skewY'];
const FILTER_KEYS = ['brightness', 'hueRotate', 'contrast', 'blur', 'grayscale'];

function boolAttribute(element: Element, name: string, fallback: boolean): boolean {
  const value = element.getAttribute(name);
  return value === null ? fallback : value !== 'false';
}

function cssUnit(value: ParallaxValue | undefined, unit: string, fallback: string): string {
  return value === undefined ? fallback : typeof value === 'number' ? `${value}${unit}` : value;
}

function normalizedProgress(container: HTMLElement): number {
  const rect = container.getBoundingClientRect();
  const travel = window.innerHeight + rect.height;
  return travel > 0 ? Math.max(0, Math.min(1, (window.innerHeight - rect.top) / travel)) : 0;
}

export class UiParallax extends BaseElement {
  #scrollItems = new Set<UiParallaxScroll>();
  #hoverItems = new Set<UiParallaxHover>();
  #frame = 0;
  #pointer: { x: number; y: number } | null = null;
  #reduced: MediaQueryList | null = null;
  progress = 0;

  protected override onConnect(): void {
    this.#reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    this.$on(window, 'scroll', () => this.#schedule(), { passive: true });
    this.$on(window, 'resize', () => this.#schedule(), { passive: true });
    if (this.#reduced) this.$on(this.#reduced, 'change', () => this.#schedule());
    this.$on(this, 'pointermove', ((event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      this.#pointer = { x: event.clientX, y: event.clientY };
      this.#schedule();
    }) as EventListener);
    this.$on(this, 'pointerleave', () => {
      this.#pointer = null;
      this.#schedule();
    });
    this.#schedule();
  }

  protected override onDisconnect(): void {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#pointer = null;
  }

  registerScroll(item: UiParallaxScroll): void { this.#scrollItems.add(item); this.#schedule(); }
  unregisterScroll(item: UiParallaxScroll): void { this.#scrollItems.delete(item); }
  registerHover(item: UiParallaxHover): void { this.#hoverItems.add(item); this.#schedule(); }
  unregisterHover(item: UiParallaxHover): void { this.#hoverItems.delete(item); }

  /** Recalculate synchronously, useful after changing layout or content. */
  refresh(): void { this.#update(true); }

  #schedule(): void {
    if (!this.isConnected || this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      if (this.#update(false)) this.#schedule();
    });
  }

  #update(immediate: boolean): boolean {
    const rect = this.getBoundingClientRect();
    const reduced = this.#reduced?.matches === true;
    const mobile = window.innerWidth <= 767;
    this.progress = normalizedProgress(this);
    let moving = false;
    for (const item of this.#scrollItems) moving = item.render(this.progress, reduced, mobile, immediate) || moving;
    for (const item of this.#hoverItems) item.render(this.#pointer, rect, reduced, mobile);
    return moving;
  }
}

export interface ParallaxCustomEffectsParams {
  element: HTMLElement;
  createValue: (property: string) => ParallaxValue | '';
  EMPTY: '';
}

export class UiParallaxScroll extends BaseElement {
  static override get observedAttributes(): string[] {
    return ['ui-keyframes', 'ui-breakpoints', 'ui-lerp-ease', 'ui-step-mode', 'ui-mobile-disabled', 'ui-start', 'ui-end', 'ui-backface-visibility', 'ui-fit-content'];
  }

  #container: UiParallax | null = null;
  #frames: ParallaxKeyframes = {};
  #breakpoints: ParallaxBreakpoints = {};
  #activeFrames: ParallaxKeyframes | null = null;
  #current = Number.NaN;
  #original = new Map<string, string>();
  #imageVisibility = new Map<HTMLImageElement, boolean>();
  #custom: ((params: ParallaxCustomEffectsParams) => void) | null = null;
  #sample: ParallaxFrame = {};
  #warnedExpression = false;
  #initFrame = 0;

  protected override onConnect(): void {
    if (!this.hasAttribute('ui-fit-content')) this.setAttribute('ui-fit-content', 'true');
    if (!this.hasAttribute('ui-keyframes')) console.warn('[ui-parallax-scroll] ui-keyframes is required');
    this.#parse();
    this.#container = this.closest('ui-parallax, ui-scroll-y[ui-parallax]');
    if (!this.#container) console.warn('[ui-parallax-scroll] A ui-parallax parent is required');
    this.#container?.registerScroll(this);
    this.#initFrame = requestAnimationFrame(() => {
      if (this.isConnected) this.$emit('ui:parallax-scroll:init');
    });
  }

  protected override onDisconnect(): void {
    this.#container?.unregisterScroll(this);
    this.#container = null;
    cancelAnimationFrame(this.#initFrame);
    this.#restore();
    this.#activeFrames = null;
    this.#current = Number.NaN;
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'ui-keyframes' || name === 'ui-breakpoints') this.#parse();
    if (name === 'ui-start' || name === 'ui-end') this.#warnedExpression = false;
    this.#container?.refresh();
  }

  customEffects(callback: (params: ParallaxCustomEffectsParams) => void): void {
    this.#custom = callback;
    this.#container?.refresh();
  }

  render(containerProgress: number, reduced: boolean, mobile: boolean, immediate: boolean): boolean {
    if (reduced || (mobile && boolAttribute(this, 'ui-mobile-disabled', false))) {
      this.#restore();
      this.#activeFrames = null;
      this.#current = Number.NaN;
      return false;
    }
    const frames = resolveKeyframes(this.#frames, this.#breakpoints, window.innerWidth);
    if (!Object.keys(frames).length) { this.#restore(); this.#activeFrames = null; return false; }
    if (frames !== this.#activeFrames) {
      this.#restore();
      this.#activeFrames = frames;
      this.#current = Number.NaN;
    }
    const target = this.#customProgress(containerProgress);
    const ease = mobile ? 1 : Math.max(0.001, Math.min(1, Number(this.getAttribute('ui-lerp-ease') ?? 0.08) || 0.08));
    const current = Number.isNaN(this.#current) || immediate ? target : this.#current + (target - this.#current) * ease;
    this.#current = Math.abs(target - current) < 0.0001 ? target : current;
    this.#sample = sampleKeyframes(frames, this.#current, boolAttribute(this, 'ui-step-mode', false));
    this.#apply(this.#sample);
    if (this.#custom) {
      const properties = () => Array.from({ length: this.style.length }, (_, index) => this.style.item(index));
      const before = new Map(properties().map((property) => [property, this.style.getPropertyValue(property)]));
      this.#custom({ element: this, createValue: (key) => this.#sample[key] ?? '', EMPTY: '' });
      for (const property of new Set([...before.keys(), ...properties()])) {
        if (!this.#original.has(property) && before.get(property) !== this.style.getPropertyValue(property)) {
          this.#original.set(property, before.get(property) ?? '');
        }
      }
    }
    return this.#current !== target;
  }

  #parse(): void {
    this.#frames = parseKeyframes(this.getAttribute('ui-keyframes'));
    this.#breakpoints = parseParallaxBreakpoints(this.getAttribute('ui-breakpoints'));
  }

  #customProgress(fallback: number): number {
    const startRaw = this.getAttribute('ui-start');
    const endRaw = this.getAttribute('ui-end');
    if (!startRaw && !endRaw) return fallback;
    const rect = this.#container!.getBoundingClientRect();
    const offset = rect.top + window.scrollY;
    try {
      const start = startRaw ? resolveScrollPosition(startRaw, this.#container!) : offset - window.innerHeight;
      const end = endRaw ? resolveScrollPosition(endRaw, this.#container!) : offset + rect.height;
      return end === start ? 0 : Math.max(0, Math.min(1, (window.scrollY - start) / (end - start)));
    } catch (error) {
      if (!this.#warnedExpression) console.error('[ui-parallax-scroll] Invalid ui-start/ui-end:', error);
      this.#warnedExpression = true;
      return 0;
    }
  }

  #style(property: string, value: string): void {
    if (!this.#original.has(property)) this.#original.set(property, this.style.getPropertyValue(property));
    this.style.setProperty(property, value);
  }

  #restore(): void {
    for (const [property, value] of this.#original) {
      if (value) this.style.setProperty(property, value);
      else this.style.removeProperty(property);
    }
    this.#original.clear();
    for (const [image, hidden] of this.#imageVisibility) image.hidden = hidden;
    this.#imageVisibility.clear();
  }

  #apply(values: ParallaxFrame): void {
    const has = (keys: string[]) => keys.some((key) => key in values);
    if (has(TRANSFORM_KEYS)) {
      const x = cssUnit(values['x'], 'px', '0px');
      const y = cssUnit(values['y'], 'px', '0px');
      const scale = values['scale'] ?? 1;
      const sx = values['scaleX'] ?? 1;
      const sy = values['scaleY'] ?? 1;
      this.#style('transform', `translate3d(${x}, ${y}, 0) scale(${scale}) scaleX(${sx}) scaleY(${sy}) rotate(${cssUnit(values['rotate'], 'deg', '0deg')}) rotateX(${cssUnit(values['rotateX'], 'deg', '0deg')}) rotateY(${cssUnit(values['rotateY'], 'deg', '0deg')}) skew(${cssUnit(values['skew'], 'deg', '0deg')}) skewX(${cssUnit(values['skewX'], 'deg', '0deg')}) skewY(${cssUnit(values['skewY'], 'deg', '0deg')})`);
    }
    if (has(FILTER_KEYS)) {
      this.#style('filter', `brightness(${cssUnit(values['brightness'], '', '1')}) hue-rotate(${cssUnit(values['hueRotate'], 'deg', '0deg')}) contrast(${cssUnit(values['contrast'], '', '1')}) blur(${cssUnit(values['blur'], 'px', '0px')}) grayscale(${cssUnit(values['grayscale'], '', '0')})`);
    }
    for (const key of ['opacity', 'width', 'height', 'backgroundPositionY', 'borderRadius'] as const) {
      if (key in values) {
        const property = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
        const unit = key === 'opacity' ? '' : key === 'borderRadius' ? 'px' : 'px';
        this.#style(property, cssUnit(values[key], unit, ''));
      }
    }
    if ('backgroundSizeX' in values || 'backgroundSizeY' in values) {
      this.#style('background-size', `${cssUnit(values['backgroundSizeX'], 'px', 'auto')} ${cssUnit(values['backgroundSizeY'], 'px', 'auto')}`);
    }
    this.#style('backface-visibility', this.getAttribute('ui-backface-visibility') ?? 'hidden');
    if ('videoTime' in values) {
      const video = this.querySelector('video');
      const percent = Number(values['videoTime']);
      if (video && Number.isFinite(percent) && Number.isFinite(video.duration) && video.duration > 0) {
        const time = video.duration * Math.max(0, Math.min(100, percent)) / 100;
        if (Math.abs(video.currentTime - time) > 0.03) video.currentTime = time;
      }
    }
    if ('groupImg' in values) {
      const images = [...this.querySelectorAll<HTMLImageElement>('img')];
      const percent = Number(values['groupImg']);
      if (images.length && Number.isFinite(percent)) {
        const active = Math.round(Math.max(0, Math.min(100, percent)) * (images.length - 1) / 100);
        images.forEach((image, index) => {
          if (!this.#imageVisibility.has(image)) this.#imageVisibility.set(image, image.hidden);
          image.hidden = index !== active;
        });
      }
    }
  }
}

export class UiParallaxHover extends BaseElement {
  static override get observedAttributes(): string[] {
    return ['ui-strength', 'ui-reset-position', 'ui-3d', 'ui-inner-width'];
  }

  #container: UiParallax | null = null;
  #originalTransform = '';

  protected override onConnect(): void {
    this.#container = this.closest('ui-parallax, ui-scroll-y[ui-parallax]');
    if (!this.#container) console.warn('[ui-parallax-hover] A ui-parallax parent is required');
    this.#originalTransform = this.style.transform;
    this.#updateWidth();
    this.#container?.registerHover(this);
  }

  protected override onDisconnect(): void {
    this.#container?.unregisterHover(this);
    this.#container = null;
    this.style.transform = this.#originalTransform;
  }

  protected override onAttributeChanged(): void { this.#updateWidth(); this.#container?.refresh(); }

  #updateWidth(): void {
    this.style.setProperty('--ui-parallax-inner-width', this.getAttribute('ui-inner-width') ?? 'fit-content');
  }

  render(pointer: { x: number; y: number } | null, rect: DOMRect, reduced: boolean, mobile: boolean): void {
    if (reduced || mobile || !pointer) {
      if (reduced || mobile || boolAttribute(this, 'ui-reset-position', true)) {
        this.removeAttribute('data-hover-active');
        this.style.transform = this.#originalTransform;
      }
      return;
    }
    const x = rect.width ? Math.max(-1, Math.min(1, (pointer.x - rect.left) / rect.width * 2 - 1)) : 0;
    const y = rect.height ? Math.max(-1, Math.min(1, (pointer.y - rect.top) / rect.height * 2 - 1)) : 0;
    const strength = Math.max(0, Number(this.getAttribute('ui-strength') ?? 100) || 0);
    const transform = boolAttribute(this, 'ui-3d', false)
      ? `perspective(900px) rotateX(${-y * strength * 0.12}deg) rotateY(${x * strength * 0.12}deg)`
      : `translate3d(${x * strength / 2}px, ${y * strength / 2}px, 0)`;
    this.setAttribute('data-hover-active', '');
    this.style.transform = `${this.#originalTransform} ${transform}`.trim();
  }
}

define('ui-parallax', UiParallax);
define('ui-parallax-scroll', UiParallaxScroll);
define('ui-parallax-hover', UiParallaxHover);

export const parallax = UiParallax;
export const parallaxScroll = UiParallaxScroll;
export const parallaxHover = UiParallaxHover;

/**
 * <ui-marquee> / <core-marquee> / <xo-marquee>
 *
 * Enterprise-grade infinite looping marquee component.
 * Features:
 * - Dynamic gapless clone calculation
 * - Multi-directional flow (rtl, ltr, btt, ttb)
 * - Vertical orientation support
 * - Parallax scroll acceleration / scrubbing
 * - Pause on hover
 * - Full support for both standard and xo-* HTML attributes
 */

import { BaseElement, define } from '@ui/core';
import type { MarqueeDirection, MarqueeInstance } from './types.js';

let marqueeUid = 0;

export class UiMarquee extends BaseElement implements MarqueeInstance {
  static override properties = {
    speed: { name: 'speed', attr: 'speed', default: 6 }, // Higher = faster (default: 6)
    direction: { name: 'direction', attr: 'direction', default: 'rtl' },
    pauseOnHover: { name: 'pauseOnHover', attr: 'pause-on-hover', default: false },
    autoRun: { name: 'autoRun', attr: 'auto-run', default: true },
    scrollEnabled: { name: 'scrollEnabled', attr: 'scroll-enabled', default: false },
    scrollSpeed: { name: 'scrollSpeed', attr: 'scroll-speed', default: 1 },
    vertical: { name: 'vertical', attr: 'vertical', default: false },
    observed: { name: 'observed', attr: 'observed', default: '' },
  };

  static override get observedAttributes() {
    return [
      'speed', 'ui-speed', 'xo-speed',
      'direction', 'ui-direction', 'xo-direction',
      'pause-on-hover', 'ui-pause-on-hover', 'xo-pause-on-hover',
      'auto-run', 'ui-auto-run', 'xo-auto-run',
      'scroll-enabled', 'ui-scroll-enabled', 'xo-scroll-enabled',
      'scroll-speed', 'ui-scroll-speed', 'xo-scroll-speed',
      'vertical', 'ui-vertical', 'xo-vertical',
      'observed', 'ui-observed', 'xo-observed',
    ];
  }

  declare speed: number;
  declare direction: MarqueeDirection;
  declare pauseOnHover: boolean;
  declare autoRun: boolean;
  declare scrollEnabled: boolean;
  declare scrollSpeed: number;
  declare vertical: boolean;
  declare observed: string;

  readonly #id = `marquee-${++marqueeUid}`;
  #viewport: HTMLElement | null = null;
  #track: HTMLElement | null = null;
  #originalContent: HTMLElement[] = [];
  #isRunning = true;
  #resizeObserver: ResizeObserver | null = null;
  #scrollCleanup: (() => void) | null = null;
  #scrollOffset = 0;
  #lastScrollY = 0;
  #rafScrollId: number | null = null;

  /* ------------------------------------------------------------
     Attribute Getters (Standard, ui- & xo- compatibility)
     ------------------------------------------------------------ */

  get effectiveSpeed(): number {
    const raw = this.getAttribute('ui-speed') ?? this.getAttribute('speed') ?? this.getAttribute('xo-speed');
    const n = raw !== null ? Number(raw) : Number(this.speed);
    return Number.isFinite(n) && n > 0 ? n : 6;
  }

  get isVertical(): boolean {
    const attr = this.getAttribute('ui-vertical') ?? this.getAttribute('vertical') ?? this.getAttribute('xo-vertical');
    return attr !== null ? (attr !== 'false' && attr !== '0') : Boolean(this.vertical);
  }

  get effectiveDirection(): MarqueeDirection {
    const raw = (this.getAttribute('ui-direction') ?? this.getAttribute('direction') ?? this.getAttribute('xo-direction'))?.trim().toLowerCase();
    if (raw === 'ltr' || raw === 'rtl' || raw === 'ttb' || raw === 'btt') {
      return raw as MarqueeDirection;
    }
    // Default based on orientation and document direction
    if (this.isVertical) return 'btt';
    const isDocRtl = (this.ownerDocument ?? document).dir === 'rtl' || (this.ownerDocument ?? document).documentElement?.getAttribute('dir') === 'rtl';
    return isDocRtl ? 'ltr' : 'rtl';
  }

  get effectivePauseOnHover(): boolean {
    const attr = this.getAttribute('ui-pause-on-hover') ?? this.getAttribute('pause-on-hover') ?? this.getAttribute('xo-pause-on-hover');
    return attr !== null ? (attr !== 'false' && attr !== '0') : Boolean(this.pauseOnHover);
  }

  get isAutoRun(): boolean {
    const attr = this.getAttribute('ui-auto-run') ?? this.getAttribute('auto-run') ?? this.getAttribute('xo-auto-run');
    return attr !== null ? (attr !== 'false' && attr !== '0') : (this.autoRun ?? true);
  }

  get isScrollEnabled(): boolean {
    const attr = this.getAttribute('ui-scroll-enabled') ?? this.getAttribute('scroll-enabled') ?? this.getAttribute('xo-scroll-enabled');
    return attr !== null ? (attr !== 'false' && attr !== '0') : Boolean(this.scrollEnabled);
  }

  get effectiveScrollSpeed(): number {
    const raw = this.getAttribute('ui-scroll-speed') ?? this.getAttribute('scroll-speed') ?? this.getAttribute('xo-scroll-speed');
    const n = raw !== null ? Number(raw) : Number(this.scrollSpeed);
    return Number.isFinite(n) ? n : 1;
  }

  get isRunning(): boolean {
    return this.#isRunning && this.isAutoRun;
  }

  /* ------------------------------------------------------------
     Lifecycle
     ------------------------------------------------------------ */

  protected override onConnect(): void {
    this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', 'marquee');

    this.#initDOM();
    this.#setupListeners();
    this.#setupScrollParallax();
    this.#setupResize();
    this.#render();

    this.setAttribute('initialized', '');
    this.$emit('ui-marquee:init', { id: this.#id });
  }

  protected override onDisconnect(): void {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#scrollCleanup?.();
    this.#scrollCleanup = null;
    if (this.#rafScrollId !== null) {
      cancelAnimationFrame(this.#rafScrollId);
      this.#rafScrollId = null;
    }
    this.removeAttribute('initialized');
    this.$emit('ui-marquee:destroy', { id: this.#id });
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'observed' || name === 'xo-observed') {
      this.refresh();
      return;
    }
    if (name.includes('scroll')) {
      this.#setupScrollParallax();
    }
    this.#render();
  }

  /* ------------------------------------------------------------
     Public API
     ------------------------------------------------------------ */

  play(): void {
    this.#isRunning = true;
    if (this.#track) {
      this.#track.style.animationPlayState = 'running';
    }
    this.$emit('ui-marquee:play', { id: this.#id });
  }

  pause(): void {
    this.#isRunning = false;
    if (this.#track) {
      this.#track.style.animationPlayState = 'paused';
    }
    this.$emit('ui-marquee:pause', { id: this.#id });
  }

  toggle(): void {
    if (this.isRunning) this.pause();
    else this.play();
  }

  refresh(): void {
    this.#initDOM();
    this.#render();
  }

  rebuild(): void {
    this.refresh();
  }

  /* ------------------------------------------------------------
     Internal Logic
     ------------------------------------------------------------ */

  #initDOM(): void {
    // 1. Collect original children if not already cached
    let viewport = this.querySelector('[data-marquee-viewport]') as HTMLElement | null;
    let track = this.querySelector('[data-marquee-track]') as HTMLElement | null;

    if (!viewport || !track) {
      const rawChildren = [...this.childNodes].filter((node) => {
        if (node instanceof HTMLElement && node.hasAttribute('data-marquee-ignore')) return false;
        return true;
      });

      this.#originalContent = rawChildren.map((n) => n.cloneNode(true) as HTMLElement);

      viewport = document.createElement('div');
      viewport.setAttribute('data-marquee-viewport', '');

      track = document.createElement('div');
      track.setAttribute('data-marquee-track', '');

      // Content item wrapper
      const itemGroup = document.createElement('div');
      itemGroup.setAttribute('data-marquee-content', '');
      for (const n of rawChildren) {
        itemGroup.appendChild(n);
      }
      track.appendChild(itemGroup);
      viewport.appendChild(track);
      this.innerHTML = '';
      this.appendChild(viewport);
    }

    this.#viewport = viewport;
    this.#track = track;
  }

  #render(): void {
    if (!this.#track || !this.#viewport) return;

    const vertical = this.isVertical;
    const direction = this.effectiveDirection;
    const speed = this.effectiveSpeed; // higher = faster
    const autoRun = this.isAutoRun;
    const pauseOnHover = this.effectivePauseOnHover;

    // Apply orientation attributes
    if (vertical) {
      this.setAttribute('vertical', '');
      this.#viewport.setAttribute('data-direction', direction);
    } else {
      this.removeAttribute('vertical');
      this.#viewport.setAttribute('data-direction', direction);
    }

    // 1. Measure and ensure gapless clone duplication
    const firstGroup = this.#track.querySelector('[data-marquee-content]') as HTMLElement | null;
    if (firstGroup) {
      const containerSize = vertical
        ? (this.#viewport.clientHeight || this.clientHeight || 200)
        : (this.#viewport.clientWidth || this.clientWidth || 300);

      const contentSize = vertical
        ? (firstGroup.scrollHeight || 100)
        : (firstGroup.scrollWidth || 100);

      // Ensure neededGroups is an even number >= 2 so that -50% translation aligns exactly with cloned groups
      const minMultiplier = Math.max(1, Math.ceil(containerSize / Math.max(1, contentSize)));
      const pairs = Math.max(1, minMultiplier);
      const neededGroups = pairs * 2;

      // Remove existing cloned groups
      const existingClones = this.#track.querySelectorAll('[data-marquee-clone]');
      existingClones.forEach((c) => c.remove());

      for (let i = 1; i < neededGroups; i++) {
        const clone = firstGroup.cloneNode(true) as HTMLElement;
        clone.setAttribute('data-marquee-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        this.#track.appendChild(clone);
      }

      // 2. Duration calculation: higher speed = shorter duration = faster
      // px per second = speed * 16
      // In one loop, track travels 50% of total width (which is pairs * contentSize)
      const distance = (contentSize * neededGroups) / 2;
      const pxPerSec = speed * 16;
      const durationSec = Math.max(0.5, distance / pxPerSec);

      this.style.setProperty('--ui-marquee-duration', `${durationSec.toFixed(2)}s`);
      this.style.setProperty('--xo-marquee-duration', `${durationSec.toFixed(2)}s`);
    }

    // 3. Animation State & Direction
    this.#track.style.animationPlayState = autoRun && this.#isRunning ? 'running' : 'paused';

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#track.style.animation = 'none';
    }
  }

  #setupListeners(): void {
    // Hover pause
    this.$on(this, 'mouseenter', () => {
      if (this.effectivePauseOnHover && this.#track) {
        this.#track.style.animationPlayState = 'paused';
      }
    });

    this.$on(this, 'mouseleave', () => {
      if (this.effectivePauseOnHover && this.#track && this.isRunning) {
        this.#track.style.animationPlayState = 'running';
      }
    });
  }

  #setupScrollParallax(): void {
    this.#scrollCleanup?.();
    this.#scrollCleanup = null;

    if (!this.isScrollEnabled) return;

    this.#lastScrollY = window.scrollY;

    const onScroll = (): void => {
      const currentY = window.scrollY;
      const deltaY = currentY - this.#lastScrollY;
      this.#lastScrollY = currentY;

      const factor = this.effectiveScrollSpeed * 0.4;
      this.#scrollOffset += deltaY * factor;

      if (this.#rafScrollId === null) {
        this.#rafScrollId = requestAnimationFrame(() => {
          this.#rafScrollId = null;
          if (this.#track) {
            this.#track.style.setProperty('--ui-marquee-scroll-offset', `${this.#scrollOffset.toFixed(1)}px`);
          }
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    this.#scrollCleanup = () => {
      window.removeEventListener('scroll', onScroll);
    };
  }

  #setupResize(): void {
    if (typeof ResizeObserver === 'undefined') return;

    this.#resizeObserver = new ResizeObserver(() => {
      this.#render();
    });

    this.#resizeObserver.observe(this);
  }
}

// Custom element tag aliases
export class CoreMarquee extends UiMarquee {}
export class XoMarquee extends UiMarquee {}

define('ui-marquee', UiMarquee);
define('core-marquee', CoreMarquee);
define('xo-marquee', XoMarquee);
export const marquee = UiMarquee;

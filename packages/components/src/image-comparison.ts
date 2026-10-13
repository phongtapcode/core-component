/** Interactive before/after image comparison. */

import { BaseElement, define } from '@ui/core';

const clamp = (value: number) => Math.max(0, Math.min(100, value));

function percent(raw: string | null, fallback = 50): number {
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? clamp(value) : fallback;
}

export class UiImageComparison extends BaseElement {
  static override get observedAttributes(): string[] {
    return ['ui-default-percent', 'ui-value', 'ui-animate', 'ui-observed'];
  }

  #dragPointer: number | null = null;
  #observer: IntersectionObserver | null = null;
  #frame = 0;
  #displayValue = 50;
  #velocity = 0;
  #reduced: MediaQueryList | null = null;

  get value(): number { return percent(this.getAttribute('ui-value'), this.#defaultValue()); }
  set value(next: number) { this.#setValue(next, false); }

  protected override onConnect(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'slider');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) this.setAttribute('aria-label', 'Image comparison');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
    this.#reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    if (this.#reduced) this.$on(this.#reduced, 'change', () => this.#setupAnimation());
    if (!this.hasAttribute('ui-value')) {
      this.setAttribute('ui-value', String(percent(this.getAttribute('value'), this.#defaultValue())));
    }
    this.#syncAria();
    this.$on(this, 'pointerdown', (event) => this.#pointerDown(event));
    this.$on(this, 'pointermove', (event) => this.#pointerMove(event));
    this.$on(this, 'pointerup', (event) => this.#pointerUp(event));
    this.$on(this, 'pointercancel', (event) => this.#pointerCancel(event));
    this.$on(this, 'keydown', (event) => this.#keyDown(event));
    this.#setupAnimation();
  }

  protected override onDisconnect(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#stopSpring();
    this.#dragPointer = null;
  }

  protected override onAttributeChanged(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ui-value') {
      const normalized = String(this.value);
      if (this.getAttribute('ui-value') !== normalized) {
        this.setAttribute('ui-value', normalized);
        return;
      }
      this.#stopSpring();
      this.#syncAria();
      this.#paint(this.value);
    } else if (name === 'ui-observed') {
      this.setAttribute('ui-value', String(this.#defaultValue()));
      this.#setupAnimation();
    } else if (name === 'ui-animate') {
      this.#setupAnimation();
    }
  }

  #defaultValue(): number { return percent(this.getAttribute('ui-default-percent')); }

  #syncAria(): void { this.setAttribute('aria-valuenow', String(this.value)); }

  #paint(value: number): void {
    this.#displayValue = clamp(value);
    this.style.setProperty('--ui-value', String(this.#displayValue));
    this.style.setProperty('--ui-image-comparison-position', `${this.#displayValue}%`);
  }

  #stopSpring(): void {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#velocity = 0;
  }

  #setupAnimation(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#stopSpring();
    if (!this.hasAttribute('ui-animate') || this.getAttribute('ui-animate') === 'false' || this.#reduced?.matches) {
      this.#paint(this.value);
      return;
    }
    if (typeof IntersectionObserver === 'undefined') { this.#paint(this.value); return; }
    this.#paint(0);
    this.#observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      this.#observer?.disconnect();
      this.#observer = null;
      this.#springTo(this.value);
    }, { threshold: 0.35 });
    this.#observer.observe(this);
  }

  #springTo(target: number): void {
    const tick = () => {
      const distance = target - this.#displayValue;
      this.#velocity = (this.#velocity + distance * 0.09) * 0.76;
      const next = this.#displayValue + this.#velocity;
      if (Math.abs(target - next) < 0.05 && Math.abs(this.#velocity) < 0.05) {
        this.#paint(target);
        this.#frame = 0;
        return;
      }
      this.#paint(next);
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  #setValue(next: number, fromInteraction: boolean): void {
    const value = Math.round(clamp(Number.isFinite(next) ? next : this.#defaultValue()) * 100) / 100;
    const changed = this.value !== value;
    this.#observer?.disconnect();
    this.#observer = null;
    this.#stopSpring();
    this.setAttribute('ui-value', String(value));
    this.#syncAria();
    this.#paint(value);
    if (fromInteraction && changed) this.$emit('ui-image-comparison-change', { value }, { bubbles: true });
  }

  #valueAt(clientX: number): number {
    const rect = this.getBoundingClientRect();
    return rect.width > 0 ? (clientX - rect.left) / rect.width * 100 : this.value;
  }

  #pointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select')) return;
    this.#dragPointer = event.pointerId;
    if (typeof this.setPointerCapture === 'function') {
      try { this.setPointerCapture(event.pointerId); } catch { /* Pointer capture may not be available in test DOMs. */ }
    }
    event.preventDefault();
    this.#setValue(this.#valueAt(event.clientX), true);
  }

  #pointerMove(event: PointerEvent): void {
    if (this.#dragPointer !== event.pointerId) return;
    event.preventDefault();
    this.#setValue(this.#valueAt(event.clientX), true);
  }

  #pointerUp(event: PointerEvent): void {
    if (this.#dragPointer !== event.pointerId) return;
    this.#setValue(this.#valueAt(event.clientX), true);
    this.#dragPointer = null;
    if (typeof this.releasePointerCapture === 'function') {
      try { this.releasePointerCapture(event.pointerId); } catch { /* Capture may already be released. */ }
    }
  }

  #pointerCancel(event: PointerEvent): void {
    if (this.#dragPointer === event.pointerId) this.#dragPointer = null;
  }

  #keyDown(event: KeyboardEvent): void {
    let next: number;
    if (event.key === 'ArrowRight') next = this.value + (event.shiftKey ? 10 : 5);
    else if (event.key === 'ArrowLeft') next = this.value - (event.shiftKey ? 10 : 5);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = 100;
    else return;
    event.preventDefault();
    this.#setValue(next, true);
  }
}

export class UiImageComparisonBefore extends HTMLElement {}
export class UiImageComparisonAfter extends HTMLElement {}
export class UiImageComparisonHandle extends HTMLElement {}
export class UiImageComparisonHandleIcon extends HTMLElement {}
export class UiImageComparisonLabel extends HTMLElement {}

define('ui-image-comparison', UiImageComparison);
define('ui-image-comparison-before', UiImageComparisonBefore);
define('ui-image-comparison-after', UiImageComparisonAfter);
define('ui-image-comparison-handle', UiImageComparisonHandle);
define('ui-image-comparison-handle-icon', UiImageComparisonHandleIcon);
define('ui-image-comparison-label', UiImageComparisonLabel);

export const imageComparison = UiImageComparison;
export const imageComparisonBefore = UiImageComparisonBefore;
export const imageComparisonAfter = UiImageComparisonAfter;
export const imageComparisonHandle = UiImageComparisonHandle;
export const imageComparisonHandleIcon = UiImageComparisonHandleIcon;
export const imageComparisonLabel = UiImageComparisonLabel;

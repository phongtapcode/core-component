/**
 * <ui-animate> — reveal content when it scrolls into view.
 *
 * Public attributes:
 *   effect     EffectName (default 'fade-up')
 *   duration   number (ms, default 500)
 *   delay      number (ms, default 0)
 *   threshold  number — IntersectionObserver threshold (default 0.2)
 *   once       boolean — disconnect after first reveal (default true)
 *   root-margin string — passed to IntersectionObserver
 *
 * Events:
 *   ui-animate-reveal  fired on first reveal (or every reveal if once:false)
 *   ui-animate-reset    fired when reset() is called
 *
 * Methods:
 *   play()    trigger  : reveal now (skips viewport)
 *   reset()    method   : hide again, re-arm observer
 */

import { BaseElement, define } from '@ui/core';
import { DEFAULT_DURATIONS, isValidEffect, type EffectName } from './effects.js';

export class UiAnimate extends BaseElement {
  static override properties = {
    effect: { name: 'effect', default: 'fade-up' as EffectName },
    duration: { name: 'duration', default: 500 },
    delay: { name: 'delay', default: 0 },
    threshold: { name: 'threshold', default: 0.2 },
    once: { name: 'once', default: true, reflect: true },
    rootMargin: { name: 'root-margin', default: '0px' },
  };

  static override get observedAttributes() {
    return ['effect', 'duration', 'delay', 'threshold', 'once', 'root-margin'];
  }

  // Type-only declarations — `applyDefaults` populates these in the constructor.
  declare effect: EffectName;
  declare duration: number;
  declare delay: number;
  declare threshold: number;
  declare once: boolean;
  declare rootMargin: string;

  #revealed = false;
  #unsubscribe: (() => void) | null = null;

  protected override onConnect(): void {
    this.setAttribute('data-effect', String(this.effect));
    const dur = this.#resolveDuration();
    this.style.setProperty('--ui-animate-duration', `${dur}ms`);
    this.style.setProperty('--ui-animate-delay', `${this.delay}ms`);

    this.#observe();
  }

  #observe(): void {
    if (this.#unsubscribe) return;
    this.#unsubscribe = this.$observeIntersection(
      (entry) => {
        if (entry.isIntersecting) {
          this.play();
        } else if (!this.once && this.#revealed) {
          this.reset();
        }
      },
      {
        threshold: this.threshold,
        rootMargin: this.rootMargin,
      },
    );
  }

  protected override onDisconnect(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'effect') {
      this.setAttribute('data-effect', String(this.effect));
      const dur = this.#resolveDuration();
      this.style.setProperty('--ui-animate-duration', `${dur}ms`);
    } else if (name === 'duration') {
      this.style.setProperty('--ui-animate-duration', `${this.#resolveDuration()}ms`);
    } else if (name === 'delay') {
      this.style.setProperty('--ui-animate-delay', `${this.delay}ms`);
    }
  }

  /** Public: reveal the content now, ignoring the viewport. */
  play(): void {
    if (this.#revealed) return;
    this.#revealed = true;
    this.setAttribute('data-revealed', '');
    this.$emit('ui-animate-reveal', { entry: null });
    if (this.once && this.#unsubscribe) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
  }

  /** Public: hide again and re-arm the viewport intersection. */
  reset(): void {
    this.#revealed = false;
    this.removeAttribute('data-revealed');
    this.$emit('ui-animate-reset', undefined);
    if (this.isConnected) this.#observe();
  }

  #resolveDuration(): number {
    const explicit = Number(this.duration);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const effect: EffectName = typeof this.effect === 'string' && isValidEffect(this.effect)
      ? this.effect
      : 'fade-up';
    return DEFAULT_DURATIONS[effect];
  }
}

define('ui-animate', UiAnimate);
export const animate = UiAnimate;

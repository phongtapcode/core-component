/**
 * <ui-reveal> — single-shot reveal without the effect taxonomy.
 *
 * A simpler sibling of <ui-animate>: only `fade` is supported, no per-effect
 * overrides, no stagger. Cheaper than <ui-animate> for static reveals.
 */

import { BaseElement, define } from '@ui/core';

export class UiReveal extends BaseElement {
  static override properties = {
    duration: { name: 'duration', default: 400 },
    delay: { name: 'delay', default: 0 },
    threshold: { name: 'threshold', default: 0.2 },
    once: { name: 'once', default: true, reflect: true },
  };

  static override get observedAttributes() {
    return ['duration', 'delay', 'threshold', 'once'];
  }

  declare duration: number;
  declare delay: number;
  declare threshold: number;
  declare once: boolean;

  #unsubscribe: (() => void) | null = null;

  protected override onConnect(): void {
    this.setAttribute('data-effect', 'fade');
    this.style.setProperty('--ui-animate-duration', `${this.duration}ms`);
    this.style.setProperty('--ui-animate-delay', `${this.delay}ms`);
    this.#unsubscribe = this.$observeIntersection(
      (entry) => {
        if (!entry.isIntersecting) return;
        this.setAttribute('data-revealed', '');
        this.$emit('ui-reveal-reveal', undefined);
        if (this.once) this.#unsubscribe?.();
      },
      { threshold: this.threshold },
    );
  }

  protected override onDisconnect(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'duration') {
      this.style.setProperty('--ui-animate-duration', `${this.duration}ms`);
    } else if (name === 'delay') {
      this.style.setProperty('--ui-animate-delay', `${this.delay}ms`);
    }
  }

  play(): void {
    this.setAttribute('data-revealed', '');
    this.$emit('ui-reveal-reveal', undefined);
  }

  reset(): void {
    this.removeAttribute('data-revealed');
  }
}

define('ui-reveal', UiReveal);
export const reveal = UiReveal;
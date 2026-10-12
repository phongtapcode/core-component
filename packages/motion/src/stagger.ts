/**
 * <ui-stagger> — cascade child reveals using CSS custom properties.
 *
 * Wraps any number of <ui-animate> (or <ui-reveal>) children. When the
 * container enters the viewport, every child reveals in sequence. The
 * delay per child is computed by setting `--ui-stagger-index` on each
 * child (CSS reads it and forwards to `--ui-animate-delay`).
 *
 * Why CSS-only:
 *   - Per-child JS animation loops are expensive.
 *   - `--ui-animate-delay` is already respected by the CSS in motion.css,
 *     so we only need to set the index.
 */

import { BaseElement, define } from '@ui/core';

export class UiStagger extends BaseElement {
  static override properties = {
    step: { name: 'step', default: 80 }, // ms between each child
    threshold: { name: 'threshold', default: 0.1 },
    once: { name: 'once', default: true, reflect: true },
  };

  static override get observedAttributes() {
    return ['step', 'threshold', 'once'];
  }

  declare step: number;
  declare threshold: number;
  declare once: boolean;

  #unsubscribe: (() => void) | null = null;
  #children: Element[] = [];

  protected override onConnect(): void {
    this.style.setProperty('--ui-stagger-step', `${this.step}ms`);
    this.#children = [...this.children];
    this.#assignIndices();

    this.#unsubscribe = this.$observeIntersection(
      (entry) => {
        if (!entry.isIntersecting) return;
        for (const child of this.#children) {
          child.setAttribute('data-revealed', '');
          child.dispatchEvent(
            new CustomEvent('ui-stagger-reveal', { bubbles: true, composed: true }),
          );
        }
        this.$emit('ui-stagger-reveal', { count: this.#children.length });
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
    if (name === 'step') {
      this.style.setProperty('--ui-stagger-step', `${this.step}ms`);
    }
  }

  #assignIndices(): void {
    let i = 0;
    for (const child of this.#children) {
      if (child instanceof HTMLElement) {
        child.style.setProperty('--ui-stagger-index', String(i));
      }
      i++;
    }
  }
}

define('ui-stagger', UiStagger);
export const stagger = UiStagger;
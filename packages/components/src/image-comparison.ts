/**
 * <ui-image-comparison> — before/after slider.
 *
 * Markup:
 *   <ui-image-comparison>
 *     <img slot="before" src="a.jpg">
 *     <img slot="after"  src="b.jpg">
 *   </ui-image-comparison>
 */

import { BaseElement, define } from '@ui/core';

export class UiImageComparison extends BaseElement {
  static override properties = {
    value: { name: 'value', default: 50 }, // 0..100, position of the divider
  };

  static override get observedAttributes() {
    return ['value'];
  }

  declare value: number;
  #unsubscribe: (() => void) | null = null;

  protected override onConnect(): void {
    this.tabIndex = 0;
    this.setAttribute('role', 'slider');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', '100');
    this.setAttribute('aria-valuenow', String(this.value));
    this.#render();
    this.#unsubscribe = this.$on(this, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.$set('value', Math.min(100, this.value + 5));
        this.#render();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.$set('value', Math.max(0, this.value - 5));
        this.#render();
      }
    }) as EventListener);
  }

  protected override onDisconnect(): void {
    this.#unsubscribe?.();
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'value') {
      this.setAttribute('aria-valuenow', String(this.value));
      this.#render();
    }
  }

  #render(): void {
    this.style.setProperty('--ui-image-comparison-position', `${this.value}%`);
    this.style.clipPath = `inset(0 0 0 ${this.value}%)`;
    // The "before" image fills the visible region; we use clip-path on the host.
  }
}

define('ui-image-comparison', UiImageComparison);
export const imageComparison = UiImageComparison;
/**
 * <ui-lazyload> — IntersectionObserver-driven lazy image / iframe loader.
 *
 * Usage:
 *   <ui-lazyload>
 *     <img data-src="real.jpg" src="placeholder.jpg" alt="...">
 *   </ui-lazyload>
 *
 * The host watches its first <img>/<iframe> child, swaps `data-src` → `src`
 * when the element enters the viewport, then disconnects.
 */

import { BaseElement, define } from '@ui/core';

export class UiLazyload extends BaseElement {
  static override properties = {
    threshold: { name: 'threshold', default: 0.1 },
    rootMargin: { name: 'root-margin', default: '200px' },
    once: { name: 'once', default: true },
  };

  static override get observedAttributes() {
    return ['threshold', 'root-margin', 'once'];
  }

  declare threshold: number;
  declare rootMargin: string;
  declare once: boolean;

  #unsubscribe: (() => void) | null = null;
  #target: HTMLImageElement | HTMLIFrameElement | null = null;

  protected override onConnect(): void {
    this.#target = (this.querySelector('img, iframe') as HTMLImageElement | HTMLIFrameElement | null);
    if (!this.#target) return;
    this.#unsubscribe = this.$observeIntersection(
      (entry) => {
        if (!entry.isIntersecting) return;
        this.#load();
        if (this.once) this.#unsubscribe?.();
      },
      { threshold: this.threshold, rootMargin: this.rootMargin },
    );
  }

  protected override onDisconnect(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  /** Public: force-load now (skips viewport). */
  load(): void {
    this.#load();
    this.#unsubscribe?.();
  }

  #load(): void {
    if (!this.#target) return;
    const dataSrc = this.#target.getAttribute('data-src');
    const dataSrcSet = this.#target.getAttribute('data-srcset');
    if (dataSrc) {
      this.#target.setAttribute('src', dataSrc);
      this.#target.removeAttribute('data-src');
    }
    if (dataSrcSet) {
      this.#target.setAttribute('srcset', dataSrcSet);
      this.#target.removeAttribute('data-srcset');
    }
    this.$emit('ui-lazyload-loaded', undefined);
  }
}

define('ui-lazyload', UiLazyload);
export const lazyload = UiLazyload;
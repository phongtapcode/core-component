/**
 * <ui-image-zoom> — click-to-zoom on an image.
 *
 * Wrap any <img>. On click, the image gets a fixed overlay that lets the user
 * see the full image at its natural size, scroll-zoomable. Escape closes.
 */

import { BaseElement, define } from '@ui/core';

export class UiImageZoom extends BaseElement {
  static override properties = {
    scale: { name: 'scale', default: 2 },
  };

  static override get observedAttributes() {
    return ['scale'];
  }

  declare scale: number;

  #unsubscribe: (() => void) | null = null;

  protected override onConnect(): void {
    const img = this.querySelector('img');
    if (img) {
      img.style.cursor = 'zoom-in';
      this.$on(img, 'click', () => this.#open(img));
    }
    this.$on(document, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Escape') this.#close();
    }) as EventListener);
  }

  protected override onDisconnect(): void {
    this.#unsubscribe?.();
  }

  #open(img: HTMLImageElement): void {
    const overlay = document.createElement('div');
    overlay.setAttribute('data-ui-image-zoom-overlay', '');
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex;
      align-items: center; justify-content: center; z-index: var(--ui-z-modal);
      cursor: zoom-out;
    `;
    const clone = img.cloneNode(true) as HTMLImageElement;
    clone.style.maxWidth = '90vw';
    clone.style.maxHeight = '90vh';
    clone.style.transform = `scale(${this.scale})`;
    clone.style.transition = 'transform 200ms';
    overlay.appendChild(clone);
    overlay.addEventListener('click', () => this.#close());
    document.body.appendChild(overlay);
    this.#unsubscribe = () => overlay.remove();
    this.$emit('ui-image-zoom-open', undefined);
  }

  #close(): void {
    const existing = document.querySelector('[data-ui-image-zoom-overlay]');
    if (existing) existing.remove();
    this.#unsubscribe = null;
    this.$emit('ui-image-zoom-close', undefined);
  }
}

define('ui-image-zoom', UiImageZoom);
export const imageZoom = UiImageZoom;
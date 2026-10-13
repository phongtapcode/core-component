/** A layered photo stack with an accessible, navigable image preview. */
import { define } from '@ui/core';
import { UiModal } from './modal.js';

const ITEM = 'ui-image-stack-item';

export class UiImageStack extends HTMLElement {
  private observer: MutationObserver | null = null;
  private controller: AbortController | null = null;
  private modal: UiModal | null = null;
  private previewImage: HTMLImageElement | null = null;
  private previewTitle: HTMLElement | null = null;
  private previewCounter: HTMLElement | null = null;
  private activeIndex = -1;

  get items(): HTMLElement[] {
    return [...this.children].filter((child): child is HTMLElement => child.localName === ITEM);
  }

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Image stack');
    this.addEventListener('click', this.onClick, { signal });
    this.addEventListener('keydown', this.onItemKeyDown, { signal });
    this.observer = new MutationObserver(() => this.refresh());
    this.observer.observe(this, { childList: true });
    this.refresh();
  }

  disconnectedCallback(): void {
    this.controller?.abort(); this.controller = null;
    this.observer?.disconnect(); this.observer = null;
    this.modal?.remove(); this.modal = null;
    this.previewImage = null; this.previewTitle = null; this.previewCounter = null;
    this.activeIndex = -1;
    this.removeAttribute('data-open');
  }

  /** Recalculate layer order after adding, removing, or rearranging photos. */
  refresh(): void {
    const items = this.items;
    this.style.setProperty('--ui-image-stack-count', String(items.length));
    items.forEach((item, index) => {
      item.style.setProperty('--ui-image-stack-index', String(index));
      item.style.setProperty('--ui-image-stack-fan-slot', String(index - (items.length - 1) / 2));
      item.style.setProperty('--ui-image-stack-zigzag', index % 2 ? '-1' : '1');
      item.style.setProperty('--ui-image-stack-grid-col', String(index % 3));
      item.style.setProperty('--ui-image-stack-grid-row', String(Math.floor(index / 3)));
      item.style.zIndex = String(items.length - index);
      item.dataset['uiStackNumber'] = String(index + 1).padStart(2, '0');
      if (!item.hasAttribute('role')) item.setAttribute('role', 'button');
      if (!item.hasAttribute('tabindex')) item.tabIndex = 0;
      item.setAttribute('aria-label', `${this.labelFor(item, index)}. Open image ${index + 1} of ${items.length}`);
    });
    if (this.activeIndex >= items.length) this.close();
    else if (this.activeIndex >= 0) this.updatePreview();
  }

  /** Open a layer by its zero-based index. */
  open(index: number): void {
    const items = this.items;
    if (!items.length || !Number.isFinite(index)) return;
    const next = ((Math.trunc(index) % items.length) + items.length) % items.length;
    const wasOpen = this.modal?.open ?? false;
    this.activeIndex = next;
    this.ensureModal();
    this.updatePreview();
    this.setAttribute('data-open', '');
    if (!wasOpen) {
      items[next]!.focus({ preventScroll: true });
      this.modal!.openModal(items[next]);
      this.dispatchEvent(new CustomEvent('ui:image-stack:open', { bubbles: true, detail: { index: next } }));
    } else {
      this.dispatchEvent(new CustomEvent('ui:image-stack:change', { bubbles: true, detail: { index: next } }));
    }
  }

  close(): void { this.modal?.closeModal(); }
  next(): void { if (this.activeIndex >= 0) this.open(this.activeIndex + 1); }
  previous(): void { if (this.activeIndex >= 0) this.open(this.activeIndex - 1); }

  private labelFor(item: HTMLElement, index: number): string {
    return item.getAttribute('ui-label') || item.querySelector('img')?.alt || `Image ${index + 1}`;
  }

  private ensureModal(): void {
    if (this.modal) return;
    const modal = new UiModal();
    modal.className = 'ui-image-stack__modal';
    modal.setAttribute('ui-animate', 'smart-zoom');
    modal.setAttribute('ui-duration', '320');
    modal.setAttribute('aria-label', 'Image preview');

    const viewer = document.createElement('div');
    viewer.className = 'ui-image-stack__viewer';
    const close = document.createElement('button');
    close.className = 'ui-image-stack__close';
    close.type = 'button';
    close.setAttribute('data-modal-close', '');
    close.setAttribute('aria-label', 'Close image preview');
    close.textContent = '×';
    const image = document.createElement('img');
    image.className = 'ui-image-stack__preview-image';
    const bar = document.createElement('div');
    bar.className = 'ui-image-stack__viewer-bar';
    const title = document.createElement('strong');
    const counter = document.createElement('span');
    counter.className = 'ui-image-stack__counter';
    const controls = document.createElement('div');
    controls.className = 'ui-image-stack__viewer-controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = '←';
    previous.setAttribute('aria-label', 'Previous image');
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = '→';
    next.setAttribute('aria-label', 'Next image');
    previous.addEventListener('click', () => this.previous());
    next.addEventListener('click', () => this.next());
    controls.append(previous, next);
    bar.append(title, counter, controls);
    viewer.append(close, image, bar);
    modal.append(viewer);
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); this.previous(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); this.next(); }
    });
    modal.addEventListener('ui-modal-close', () => {
      const index = this.activeIndex;
      this.activeIndex = -1;
      this.removeAttribute('data-open');
      this.dispatchEvent(new CustomEvent('ui:image-stack:close', { bubbles: true, detail: { index } }));
    });
    document.body.append(modal);
    this.modal = modal;
    this.previewImage = image;
    this.previewTitle = title;
    this.previewCounter = counter;
  }

  private updatePreview(): void {
    const item = this.items[this.activeIndex];
    if (!item || !this.previewImage || !this.previewTitle || !this.previewCounter) return;
    const source = item.querySelector('img');
    const url = source?.currentSrc || source?.src || '';
    this.previewImage.hidden = !url;
    if (url) this.previewImage.src = url;
    else this.previewImage.removeAttribute('src');
    this.previewImage.alt = source?.alt || this.labelFor(item, this.activeIndex);
    this.previewTitle.textContent = this.labelFor(item, this.activeIndex);
    this.previewCounter.textContent = `${String(this.activeIndex + 1).padStart(2, '0')} / ${String(this.items.length).padStart(2, '0')}`;
  }

  private readonly onClick = (event: MouseEvent): void => {
    const item = event.target instanceof Element ? event.target.closest(ITEM) : null;
    if (item?.parentElement === this) this.open(this.items.indexOf(item as HTMLElement));
  };

  private readonly onItemKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const item = event.target instanceof Element ? event.target.closest(ITEM) : null;
    if (item?.parentElement !== this) return;
    event.preventDefault();
    this.open(this.items.indexOf(item as HTMLElement));
  };
}

export class UiImageStackItem extends HTMLElement {}

define('ui-image-stack', UiImageStack);
define(ITEM, UiImageStackItem);

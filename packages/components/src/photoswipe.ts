/** PhotoSwipe 5 lightbox, loaded from a pinned CDN only on first use. */
import { define } from '@ui/core';

const VERSION = '5.4.4';
const CDN = `https://unpkg.com/photoswipe@${VERSION}/dist`;
const CSS_URL = `${CDN}/photoswipe.css`;
const LIGHTBOX_URL = `${CDN}/photoswipe-lightbox.esm.js`;
const CORE_URL = `${CDN}/photoswipe.esm.js`;
const SLIDES = 'a[href][data-pswp-width][data-pswp-height]';

interface PhotoSwipeLightboxLike {
  init(): void;
  destroy(): void;
  loadAndOpen(index: number, dataSource?: { gallery: HTMLElement }, point?: { x: number; y: number }): void;
}

type PhotoSwipeLightboxConstructor = new (options: Record<string, unknown>) => PhotoSwipeLightboxLike;
let stylesheetPromise: Promise<void> | null = null;
let lightboxModulePromise: Promise<PhotoSwipeLightboxConstructor> | null = null;

function loadStylesheet(): Promise<void> {
  if (stylesheetPromise) return stylesheetPromise;
  stylesheetPromise = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    link.dataset['uiPhotoswipeCss'] = '';
    link.onload = () => resolve();
    link.onerror = () => {
      link.remove();
      stylesheetPromise = null;
      reject(new Error('PhotoSwipe CSS could not be loaded.'));
    };
    document.head.append(link);
  });
  return stylesheetPromise;
}

function loadLightboxModule(): Promise<PhotoSwipeLightboxConstructor> {
  if (lightboxModulePromise) return lightboxModulePromise;
  lightboxModulePromise = import(/* @vite-ignore */ LIGHTBOX_URL)
    .then((module) => module.default as PhotoSwipeLightboxConstructor)
    .catch((error: unknown) => {
      lightboxModulePromise = null;
      throw error;
    });
  return lightboxModulePromise;
}

/** Parses JSON or the simple object-literal notation used by other ui components. Never evaluates code. */
export function parsePhotoSwipeOptions(raw: string | null): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try {
    const normalized = raw
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'([^']*)'/g, (_, value: string) => JSON.stringify(value))
      .replace(/,\s*([}\]])/g, '$1');
    const value: unknown = JSON.parse(normalized);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an options object.');
    const options = { ...value as Record<string, unknown> };
    // The wrapper always owns its source and loader.
    for (const key of ['gallery', 'children', 'dataSource', 'pswpModule', '__proto__', 'prototype', 'constructor']) delete options[key];
    return options;
  } catch (error) {
    console.warn('[ui-photoswipe] Invalid ui-options; using PhotoSwipe defaults.', error);
    return {};
  }
}

export class UiPhotoSwipe extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-options']; }

  private lightbox: PhotoSwipeLightboxLike | null = null;
  private loading: Promise<PhotoSwipeLightboxLike | null> | null = null;
  private generation = 0;
  private retryNativeClick = false;
  private opening = false;

  connectedCallback(): void {
    this.addEventListener('click', this.onClick);
  }

  disconnectedCallback(): void {
    this.removeEventListener('click', this.onClick);
    this.reset();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.reset();
  }

  private reset(): void {
    this.generation++;
    this.lightbox?.destroy();
    this.lightbox = null;
    this.loading = null;
  }

  private readonly onClick = (event: MouseEvent): void => {
    if (this.retryNativeClick) { this.retryNativeClick = false; return; }
    if (this.lightbox || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest<HTMLAnchorElement>(SLIDES);
    if (!anchor || !this.contains(anchor) || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    if (Number(anchor.dataset['pswpWidth']) <= 0 || Number(anchor.dataset['pswpHeight']) <= 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (this.opening) return;
    this.opening = true;
    void this.openFirst(anchor, { x: event.clientX, y: event.clientY }).finally(() => { this.opening = false; });
  };

  private async openFirst(anchor: HTMLAnchorElement, point: { x: number; y: number }): Promise<void> {
    const lightbox = await this.ensureLightbox();
    if (!lightbox) {
      this.openNative(anchor);
      return;
    }
    if (!this.contains(anchor)) return;
    const index = [...this.querySelectorAll(SLIDES)].indexOf(anchor);
    if (index < 0) return;
    try {
      lightbox.loadAndOpen(index, { gallery: this }, point);
    } catch (error) {
      console.error('[ui-photoswipe] The lightbox could not open; opening the image link instead.', error);
      this.reset();
      this.openNative(anchor);
    }
  }

  private openNative(anchor: HTMLAnchorElement): void {
    if (!this.isConnected || !anchor.isConnected) return;
    this.retryNativeClick = true;
    anchor.click();
  }

  private ensureLightbox(): Promise<PhotoSwipeLightboxLike | null> {
    if (this.lightbox) return Promise.resolve(this.lightbox);
    if (this.loading) return this.loading;
    const generation = this.generation;
    this.loading = loadStylesheet()
      .then(() => loadLightboxModule())
      .then((Lightbox) => {
        if (!this.isConnected || generation !== this.generation) return null;
        const lightbox = new Lightbox({
          ...parsePhotoSwipeOptions(this.getAttribute('ui-options')),
          gallery: this,
          children: SLIDES,
          pswpModule: () => import(/* @vite-ignore */ CORE_URL),
        });
        lightbox.init();
        this.lightbox = lightbox;
        return lightbox;
      })
      .catch((error: unknown) => {
        console.error('[ui-photoswipe] PhotoSwipe could not be loaded; opening the image link instead.', error);
        return null;
      })
      .finally(() => {
        if (generation === this.generation) this.loading = null;
      });
    return this.loading;
  }
}

define('ui-photoswipe', UiPhotoSwipe);

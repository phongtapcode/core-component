import { BaseElement, define } from '@ui/core';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Sticky, full-width panels revealed one by one as the page scrolls vertically. */
export class UiScrollX extends BaseElement {
  static override get observedAttributes(): string[] { return ['ui-lerp-ease']; }

  #items: HTMLElement[] = [];
  #original = new Map<HTMLElement, { width: string; inert: boolean }>();
  #frame = 0;
  #lastFrameTime = 0;
  #current = Number.NaN;
  #reduced: MediaQueryList | null = null;
  progress = 0;

  protected override onConnect(): void {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>
        ui-scroll-x-inner { display: block; position: sticky; top: 0; width: 100%; height: 100vh; height: 100dvh; overflow: hidden; isolation: isolate; background: var(--ui-scroll-x-background, transparent); }
        ::slotted(ui-scroll-x-item), ::slotted(ui-scroll-xy-item) { position: absolute; inset: 0 auto 0 0; height: 100%; overflow: hidden; }
        @media (prefers-reduced-motion: reduce) {
          ui-scroll-x-inner { position: static; height: auto; overflow: visible; }
          ::slotted(ui-scroll-x-item), ::slotted(ui-scroll-xy-item) { position: relative; inset: auto; width: 100% !important; min-height: 100vh; min-height: 100dvh; }
        }
      </style><ui-scroll-x-inner part="inner"><slot></slot></ui-scroll-x-inner>`;
    }
    this.#reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    const observer = new MutationObserver(() => this.refresh());
    observer.observe(this, { childList: true });
    this.$cleanup.add(() => observer.disconnect());
    this.$on(window, 'scroll', () => this.#schedule(), { passive: true });
    this.$on(window, 'resize', () => this.refresh(), { passive: true });
    if (this.#reduced) this.$on(this.#reduced, 'change', () => this.refresh());
    this.refresh();
  }

  protected override onDisconnect(): void {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#lastFrameTime = 0;
    this.#current = Number.NaN;
    for (const item of this.#items) this.#restore(item);
    this.#items = [];
    this.style.removeProperty('--ui-scroll-x-count');
    this.style.removeProperty('--ui-scroll-x-panel-width');
  }

  protected override onAttributeChanged(): void { this.#schedule(); }

  /** Recount panels and update immediately after content or layout changes. */
  refresh(): void {
    const next = Array.from(this.children).filter((child): child is HTMLElement =>
      child.localName === 'ui-scroll-x-item' || child.localName === 'ui-scroll-xy-item');
    for (const item of this.#items) if (!next.includes(item)) this.#restore(item);
    for (const item of next) {
      if (!this.#original.has(item)) this.#original.set(item, { width: item.style.width, inert: item.inert });
    }
    this.#items = next;
    this.style.setProperty('--ui-scroll-x-count', String(Math.max(1, next.length)));
    this.style.setProperty('--ui-scroll-x-panel-width', `${this.getBoundingClientRect().width}px`);
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#lastFrameTime = 0;
    this.#render(true);
  }

  #restore(item: HTMLElement): void {
    const original = this.#original.get(item);
    if (!original) return;
    if (original.width) item.style.width = original.width;
    else item.style.removeProperty('width');
    item.inert = original.inert;
    this.#original.delete(item);
  }

  #schedule(): void {
    if (!this.isConnected || this.#frame) return;
    this.#frame = requestAnimationFrame((time) => {
      this.#frame = 0;
      const elapsed = this.#lastFrameTime ? Math.min(64, Math.max(1, time - this.#lastFrameTime)) : 16.667;
      this.#lastFrameTime = time;
      if (this.#render(false, elapsed)) this.#schedule();
      else this.#lastFrameTime = 0;
    });
  }

  #render(immediate = false, elapsed = 16.667): boolean {
    if (!this.#items.length) { this.progress = 0; this.#current = Number.NaN; return false; }
    if (this.#reduced?.matches) {
      this.progress = 1;
      this.#current = Number.NaN;
      for (const item of this.#items) this.#restore(item);
      // Keep the original values available when reduced motion is switched off.
      for (const item of this.#items) this.#original.set(item, { width: item.style.width, inert: item.inert });
      return false;
    }
    const rect = this.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    // The first panel is visible on entry. Later panels begin opening only
    // after the section reaches the viewport top and its sticky stage pins.
    const target = clamp(-rect.top / travel);
    const configuredEase = Number(this.getAttribute('ui-lerp-ease') ?? 0.12);
    const ease = Number.isFinite(configuredEase) && configuredEase > 0 ? Math.min(1, configuredEase) : 0.12;
    const factor = 1 - Math.pow(1 - ease, elapsed / 16.667);
    const current = immediate || Number.isNaN(this.#current) ? target : this.#current + (target - this.#current) * factor;
    this.#current = Math.abs(target - current) < 0.0001 ? target : current;
    this.progress = this.#current;
    const position = this.progress * Math.max(0, this.#items.length - 1);
    const active = Math.min(this.#items.length - 1, Math.ceil(position));
    this.#items.forEach((item, index) => {
      item.style.width = index === 0 ? '100%' : `${clamp(position - (index - 1)) * 100}%`;
      item.inert = (this.#original.get(item)?.inert ?? false) || index !== active;
    });
    return this.#current !== target;
  }
}

export class UiScrollXInner extends HTMLElement {}
export class UiScrollXItem extends HTMLElement {}
export class UiScrollXYItem extends HTMLElement {}

define('ui-scroll-x', UiScrollX);
define('ui-scroll-x-inner', UiScrollXInner);
define('ui-scroll-x-item', UiScrollXItem);
define('ui-scroll-xy-item', UiScrollXYItem);

export const scrollX = UiScrollX;
export const scrollXInner = UiScrollXInner;
export const scrollXItem = UiScrollXItem;
export const scrollXYItem = UiScrollXYItem;

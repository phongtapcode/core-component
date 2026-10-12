import { define } from '@ui/core';
import { UiParallax } from './parallax.js';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Sticky vertical panels that slide upward as the page scrolls. */
export class UiScrollY extends UiParallax {
  static override get observedAttributes(): string[] { return ['ui-lerp-ease']; }

  #items: HTMLElement[] = [];
  #original = new Map<HTMLElement, { top: string; inert: boolean }>();
  #frame = 0;
  #lastFrameTime = 0;
  #current = Number.NaN;
  #reduced: MediaQueryList | null = null;
  /** Smoothed progress of the panel sequence, from 0 to 1. */
  panelProgress = 0;

  protected override onConnect(): void {
    if (!this.shadowRoot) {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>
        ui-scroll-y-inner { display: block; position: sticky; top: 0; width: 100%; height: 100vh; height: 100dvh; overflow: hidden; isolation: isolate; background: var(--ui-scroll-y-background, transparent); }
        ::slotted(ui-scroll-y-item), ::slotted(ui-scroll-xy-item) { position: absolute; inset: 0 0 auto; width: 100%; height: 100%; overflow: hidden; }
        @media (prefers-reduced-motion: reduce) {
          ui-scroll-y-inner { position: static; height: auto; overflow: visible; }
          ::slotted(ui-scroll-y-item), ::slotted(ui-scroll-xy-item) { position: relative; inset: auto; top: auto !important; min-height: 100vh; min-height: 100dvh; }
        }
      </style><ui-scroll-y-inner part="inner"><slot></slot></ui-scroll-y-inner>`;
    }
    super.onConnect();
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
    super.onDisconnect();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#lastFrameTime = 0;
    this.#current = Number.NaN;
    for (const item of this.#items) this.#restore(item);
    this.#items = [];
    this.style.removeProperty('--ui-scroll-y-count');
  }

  protected override onAttributeChanged(): void { this.#schedule(); }

  /** Recount panels and update both panel and nested parallax effects. */
  override refresh(): void {
    const next = Array.from(this.children).filter((child): child is HTMLElement =>
      child.localName === 'ui-scroll-y-item' || child.localName === 'ui-scroll-xy-item');
    for (const item of this.#items) if (!next.includes(item)) this.#restore(item);
    for (const item of next) {
      if (!this.#original.has(item)) this.#original.set(item, { top: item.style.top, inert: item.inert });
    }
    this.#items = next;
    this.style.setProperty('--ui-scroll-y-count', String(Math.max(1, next.length)));
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#lastFrameTime = 0;
    this.#render(true);
    super.refresh();
  }

  #restore(item: HTMLElement): void {
    const original = this.#original.get(item);
    if (!original) return;
    if (original.top) item.style.top = original.top;
    else item.style.removeProperty('top');
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
    if (!this.#items.length) { this.panelProgress = 0; this.#current = Number.NaN; return false; }
    if (this.#reduced?.matches) {
      this.panelProgress = 1;
      this.#current = Number.NaN;
      for (const item of this.#items) this.#restore(item);
      for (const item of this.#items) this.#original.set(item, { top: item.style.top, inert: item.inert });
      return false;
    }
    const rect = this.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    const target = clamp(-rect.top / travel);
    const configuredEase = Number(this.getAttribute('ui-lerp-ease') ?? 0.12);
    const ease = Number.isFinite(configuredEase) && configuredEase > 0 ? Math.min(1, configuredEase) : 0.12;
    const factor = 1 - Math.pow(1 - ease, elapsed / 16.667);
    const current = immediate || Number.isNaN(this.#current) ? target : this.#current + (target - this.#current) * factor;
    this.#current = Math.abs(target - current) < 0.0001 ? target : current;
    this.panelProgress = this.#current;
    const position = this.panelProgress * Math.max(0, this.#items.length - 1);
    const active = Math.min(this.#items.length - 1, Math.ceil(position));
    this.#items.forEach((item, index) => {
      item.style.top = index === 0 ? '0%' : `${(1 - clamp(position - (index - 1))) * 100}%`;
      item.inert = (this.#original.get(item)?.inert ?? false) || index !== active;
    });
    return this.#current !== target;
  }
}

export class UiScrollYInner extends HTMLElement {}
export class UiScrollYItem extends HTMLElement {}

define('ui-scroll-y', UiScrollY);
define('ui-scroll-y-inner', UiScrollYInner);
define('ui-scroll-y-item', UiScrollYItem);

export const scrollY = UiScrollY;
export const scrollYInner = UiScrollYInner;
export const scrollYItem = UiScrollYItem;

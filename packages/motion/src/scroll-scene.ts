import { BaseElement, define } from '@ui/core';

const VIEWPORT_DEFAULT = 768;

/** Switches sticky scenes after each configured fraction of viewport scroll. */
export class UiScrollScene extends BaseElement {
  static override get observedAttributes(): string[] {
    return ['ui-threshold', 'ui-mobile-disabled', 'ui-mobile-breakpoint'];
  }

  #items: HTMLElement[] = [];
  #originalInert = new Map<HTMLElement, boolean>();
  #generatedFocus = new Set<HTMLElement>();
  #observer: MutationObserver | null = null;
  #frame = 0;
  #activeIndex = -1;
  #lastTop = Number.NaN;
  #disabled = false;
  #pendingFocus = -1;
  #reduced: MediaQueryList | null = null;

  get activeIndex(): number { return this.#activeIndex; }

  protected override onConnect(): void {
    this.#reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    this.#observer = new MutationObserver(() => this.refresh());
    this.#observer.observe(this, { childList: true, subtree: true });
    this.$on(window, 'scroll', () => this.#schedule(), { passive: true });
    this.$on(window, 'resize', () => this.refresh(), { passive: true });
    this.$on(this, 'keydown', (event) => this.#onKeydown(event as KeyboardEvent));
    if (this.#reduced) this.$on(this.#reduced, 'change', () => this.refresh());
    this.refresh();
  }

  protected override onDisconnect(): void {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#observer?.disconnect();
    this.#observer = null;
    for (const item of this.#items) this.#restore(item);
    this.#items = [];
    this.#activeIndex = -1;
    this.#lastTop = Number.NaN;
    this.#disabled = false;
    this.#pendingFocus = -1;
    this.removeAttribute('ui-ready');
    this.removeAttribute('ui-direction');
    this.removeAttribute('data-ui-scroll-scene-disabled');
    this.style.removeProperty('--ui-scroll-scene-height');
  }

  protected override onAttributeChanged(): void {
    if (this.isConnected) this.refresh();
  }

  /** Recount scenes and recalculate the sticky scroll distance. */
  refresh(): void {
    if (!this.isConnected) return;
    const inner = Array.from(this.children).find((child) => child.localName === 'ui-scroll-scene-inner');
    const next = inner ? Array.from(inner.children).filter((child): child is HTMLElement => child.localName === 'ui-scroll-scene-item') : [];
    for (const item of this.#items) if (!next.includes(item)) this.#restore(item);
    this.#items = next;
    next.forEach((item, index) => {
      if (!this.#originalInert.has(item)) this.#originalInert.set(item, item.inert);
      let focus = Array.from(item.children).find((child): child is HTMLElement => child.localName === 'ui-scroll-scene-item-focus');
      if (!focus) {
        focus = document.createElement('ui-scroll-scene-item-focus');
        item.prepend(focus);
        this.#generatedFocus.add(focus);
      }
      focus.setAttribute('tabindex', '0');
      focus.setAttribute('role', 'button');
      focus.setAttribute('aria-label', `Scene ${index + 1} of ${next.length}. Use arrow keys to change scenes.`);
    });
    const breakpoint = Number(this.getAttribute('ui-mobile-breakpoint') ?? 0);
    const mobile = Number.isFinite(breakpoint) && breakpoint > 0
      ? window.innerWidth <= breakpoint
      : (window.matchMedia?.('(pointer: coarse)')?.matches ?? false);
    this.#disabled = Boolean(this.#reduced?.matches || (this.hasAttribute('ui-mobile-disabled') && mobile));
    this.toggleAttribute('data-ui-scroll-scene-disabled', this.#disabled);
    for (const item of next) {
      const focus = Array.from(item.children).find((child): child is HTMLElement => child.localName === 'ui-scroll-scene-item-focus');
      if (focus) focus.setAttribute('tabindex', this.#disabled ? '-1' : '0');
    }
    const viewport = window.innerHeight || VIEWPORT_DEFAULT;
    const step = this.#step(viewport);
    this.style.setProperty('--ui-scroll-scene-height', `${viewport + next.length * step}px`);
    this.#render();
    this.setAttribute('ui-ready', 'true');
  }

  #step(viewport = window.innerHeight || VIEWPORT_DEFAULT): number {
    const raw = Number(this.getAttribute('ui-threshold') ?? 0.5);
    return viewport * (Number.isFinite(raw) && raw > 0 ? raw : 0.5);
  }

  #restore(item: HTMLElement): void {
    item.inert = this.#originalInert.get(item) ?? false;
    this.#originalInert.delete(item);
    item.removeAttribute('ui-active');
    item.removeAttribute('ui-prev');
    item.removeAttribute('ui-next');
    for (const focus of this.#generatedFocus) {
      if (focus.parentElement === item) { focus.remove(); this.#generatedFocus.delete(focus); }
    }
  }

  #schedule(): void {
    if (this.#frame || !this.isConnected) return;
    this.#frame = requestAnimationFrame(() => { this.#frame = 0; this.#render(); });
  }

  #render(): void {
    if (!this.#items.length) { this.#activeIndex = -1; return; }
    const top = this.getBoundingClientRect().top;
    if (!Number.isNaN(this.#lastTop) && Math.abs(top - this.#lastTop) > 0.5) {
      this.setAttribute('ui-direction', top < this.#lastTop ? 'down' : 'up');
    }
    this.#lastTop = top;
    if (this.#disabled) {
      this.#activeIndex = -1;
      for (const item of this.#items) {
        item.removeAttribute('ui-active');
        item.removeAttribute('ui-prev');
        item.removeAttribute('ui-next');
        item.inert = this.#originalInert.get(item) ?? false;
      }
      return;
    }
    const index = Math.min(this.#items.length - 1, Math.max(0, Math.floor(Math.max(0, -top) / this.#step())));
    const previousIndex = this.#activeIndex;
    this.#activeIndex = index;
    this.#items.forEach((item, position) => {
      item.toggleAttribute('ui-active', position === index);
      item.toggleAttribute('ui-prev', position === index - 1);
      item.toggleAttribute('ui-next', position === index + 1);
      item.inert = (this.#originalInert.get(item) ?? false) || position !== index;
    });
    if (this.#pendingFocus === index) {
      const focus = Array.from(this.#items[index]?.children ?? []).find((child): child is HTMLElement => child.localName === 'ui-scroll-scene-item-focus');
      focus?.focus({ preventScroll: true });
      this.#pendingFocus = -1;
    }
    if (previousIndex >= 0 && previousIndex !== index) {
      this.dispatchEvent(new CustomEvent('ui:scroll-scene:change', {
        bubbles: true, composed: true,
        detail: { activeIndex: index, previousIndex, direction: this.getAttribute('ui-direction') },
      }));
    }
  }

  #onKeydown(event: KeyboardEvent): void {
    if (this.#disabled || !(event.target instanceof HTMLElement) || event.target.localName !== 'ui-scroll-scene-item-focus') return;
    const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1
      : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0;
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? this.#items.length - 1 : this.#activeIndex + delta;
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next = Math.max(0, Math.min(this.#items.length - 1, target));
    const sectionTop = window.scrollY + this.getBoundingClientRect().top;
    this.#pendingFocus = next;
    window.scrollTo({ top: sectionTop + next * this.#step(), behavior: this.#reduced?.matches ? 'instant' : 'smooth' });
  }
}

export class UiScrollSceneInner extends HTMLElement {}
export class UiScrollSceneItem extends HTMLElement {}
export class UiScrollSceneItemFocus extends HTMLElement {}

define('ui-scroll-scene', UiScrollScene);
define('ui-scroll-scene-inner', UiScrollSceneInner);
define('ui-scroll-scene-item', UiScrollSceneItem);
define('ui-scroll-scene-item-focus', UiScrollSceneItemFocus);

export const scrollScene = UiScrollScene;
export const scrollSceneInner = UiScrollSceneInner;
export const scrollSceneItem = UiScrollSceneItem;
export const scrollSceneItemFocus = UiScrollSceneItemFocus;

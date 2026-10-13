/** A responsive grid whose cards expand in place while their siblings move with FLIP. */
import { define } from '@ui/core';

const ITEM = 'ui-expandable-grid-item';
const TRIGGER = '[ui-expandable-grid-trigger]';

function duration(host: HTMLElement): number {
  const value = Number(host.getAttribute('ui-duration'));
  return host.hasAttribute('ui-duration') && Number.isFinite(value) ? Math.max(0, value) : 500;
}

export class UiExpandableGrid extends HTMLElement {
  private abort: AbortController | null = null;
  private animations = new Set<Animation>();

  get items(): UiExpandableGridItem[] {
    return [...this.children].filter((child): child is UiExpandableGridItem => child.localName === ITEM);
  }

  get activeIndex(): number { return this.items.findIndex((item) => item.hasAttribute('ui-active')); }

  connectedCallback(): void {
    if (this.abort) return;
    this.abort = new AbortController();
    this.addEventListener('click', this.onClick, { signal: this.abort.signal });
    this.addEventListener('keydown', this.onKeyDown, { signal: this.abort.signal });
    this.syncTriggers();
  }

  disconnectedCallback(): void {
    this.abort?.abort();
    this.abort = null;
    this.animations.forEach((animation) => animation.cancel());
    this.animations.clear();
  }

  open(index: number): void {
    const items = this.items;
    if (!items[index] || index === this.activeIndex) return;
    this.update(index, items);
  }

  close(): void {
    if (this.activeIndex < 0) return;
    this.update(-1, this.items);
  }

  toggle(index: number): void { index === this.activeIndex ? this.close() : this.open(index); }

  private readonly onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest<HTMLElement>(TRIGGER);
    const item = trigger?.closest<UiExpandableGridItem>(ITEM);
    if (!item || !this.contains(item) || item.parentElement !== this || trigger?.closest(ITEM) !== item) return;
    this.toggle(this.items.indexOf(item));
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || this.activeIndex < 0) return;
    const trigger = this.items[this.activeIndex]?.querySelector<HTMLElement>(TRIGGER);
    this.close();
    trigger?.focus();
    event.stopPropagation();
  };

  private syncTriggers(): void {
    this.items.forEach((item) => {
      item.querySelector<HTMLElement>(TRIGGER)?.setAttribute('aria-expanded', String(item.hasAttribute('ui-active')));
    });
  }

  private update(next: number, items: UiExpandableGridItem[]): void {
    const previous = this.activeIndex;
    this.animations.forEach((animation) => animation.cancel());
    this.animations.clear();
    const before = items.map((item) => item.getBoundingClientRect());
    items.forEach((item, index) => item.toggleAttribute('ui-active', index === next));
    this.syncTriggers();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const ms = duration(this);
    if (!reduce && ms > 0) {
      const easing = this.getAttribute('ui-easing') || 'cubic-bezier(.22,1,.36,1)';
      items.forEach((item, index) => {
        const first = before[index]!;
        const last = item.getBoundingClientRect();
        if (!first.width || !last.width || !first.height || !last.height || !item.animate) return;
        const x = first.left - last.left;
        const y = first.top - last.top;
        const scaleX = first.width / last.width;
        const scaleY = first.height / last.height;
        if (Math.abs(x) < .5 && Math.abs(y) < .5 && Math.abs(scaleX - 1) < .005 && Math.abs(scaleY - 1) < .005) return;
        const animation = item.animate(
          [{ transform: `translate(${x}px, ${y}px) scale(${scaleX}, ${scaleY})` }, { transform: 'none' }],
          { duration: ms, easing },
        );
        this.animations.add(animation);
        animation.addEventListener('finish', () => this.animations.delete(animation), { once: true });
        animation.addEventListener('cancel', () => this.animations.delete(animation), { once: true });
      });
    }
    this.dispatchEvent(new CustomEvent('ui-expandable-grid-change', {
      detail: { activeIndex: next, previousIndex: previous, item: next < 0 ? null : items[next] },
      bubbles: true,
    }));
  }
}

export class UiExpandableGridItem extends HTMLElement {}

define('ui-expandable-grid', UiExpandableGrid);
define(ITEM, UiExpandableGridItem);

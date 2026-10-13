/** Expands the hovered item while keeping its siblings in the same row. */
import { define } from '@ui/core';

const readColumn = (styles: CSSStyleDeclaration, name: string, fallback: number): number => {
  const value = Number.parseInt(styles.getPropertyValue(name), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export class UiGridHoverExpand extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-active-index', 'ui-duration', 'ui-gap']; }

  private abort: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private hoveredItem: HTMLElement | null = null;
  private focusedItem: HTMLElement | null = null;
  private pointerFocus = false;
  private columns = 1;

  get items(): HTMLElement[] { return [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement); }
  get activeIndex(): number { return this.items.findIndex((item) => item.hasAttribute('ui-active')); }

  connectedCallback(): void {
    if (this.abort) return;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    this.addEventListener('pointerover', this.onPointerOver, options);
    this.addEventListener('pointerleave', this.onPointerLeave, options);
    this.addEventListener('pointerdown', this.onPointerDown, options);
    this.addEventListener('keydown', this.onKeyDown, options);
    this.addEventListener('focusin', this.onFocusIn, options);
    this.addEventListener('focusout', this.onFocusOut, options);
    window.addEventListener('resize', this.refresh, options);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.refresh);
      this.resizeObserver.observe(this);
    }
    this.mutationObserver = new MutationObserver(this.refresh);
    this.mutationObserver.observe(this, { childList: true });
    this.refresh();
  }

  disconnectedCallback(): void {
    this.abort?.abort();
    this.abort = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.hoveredItem = null;
    this.focusedItem = null;
    this.pointerFocus = false;
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.refresh();
  }

  private readonly onPointerOver = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    const item = this.directItem(event.target);
    if (!item || item === this.hoveredItem) return;
    this.hoveredItem = item;
    this.refresh();
  };

  private readonly onPointerLeave = (): void => {
    this.hoveredItem = null;
    this.refresh();
  };

  private readonly onPointerDown = (): void => {
    this.pointerFocus = true;
    this.focusedItem = null;
  };

  private readonly onKeyDown = (): void => {
    this.pointerFocus = false;
  };

  private readonly onFocusIn = (event: FocusEvent): void => {
    if (this.pointerFocus) return;
    const item = this.directItem(event.target);
    if (item === this.focusedItem) return;
    this.focusedItem = item;
    this.refresh();
  };

  private readonly onFocusOut = (event: FocusEvent): void => {
    this.focusedItem = this.directItem(event.relatedTarget);
    this.refresh();
  };

  private directItem(target: EventTarget | null): HTMLElement | null {
    let element = target instanceof Element ? target : null;
    while (element && element.parentElement !== this) element = element.parentElement;
    return element instanceof HTMLElement && element.parentElement === this ? element : null;
  }

  private currentColumns(): number {
    const styles = getComputedStyle(this);
    const xs = readColumn(styles, '--xs', 1);
    const sm = readColumn(styles, '--sm', xs);
    const md = readColumn(styles, '--md', sm);
    const lg = readColumn(styles, '--lg', md);
    return window.innerWidth >= 992 ? lg : window.innerWidth >= 768 ? md : window.innerWidth >= 576 ? sm : xs;
  }

  private readonly refresh = (): void => {
    const items = this.items;
    this.columns = this.currentColumns();
    const gap = Number(this.getAttribute('ui-gap'));
    if (this.hasAttribute('ui-gap') && Number.isFinite(gap)) {
      this.style.setProperty('--ui-grid-hover-gap-attr', `${Math.max(0, gap)}px`);
    } else this.style.removeProperty('--ui-grid-hover-gap-attr');
    const duration = Number(this.getAttribute('ui-duration'));
    this.style.setProperty('--ui-grid-hover-duration', `${this.hasAttribute('ui-duration') && Number.isFinite(duration) ? Math.max(0, duration) : 200}ms`);
    const defaultIndex = Number(this.getAttribute('ui-active-index'));
    const selected = this.hoveredItem && items.includes(this.hoveredItem) ? this.hoveredItem
      : this.focusedItem && items.includes(this.focusedItem) ? this.focusedItem
        : this.hasAttribute('ui-active-index') && Number.isInteger(defaultIndex) ? items[defaultIndex] : null;
    const activeIndex = this.columns > 1 && selected ? items.indexOf(selected) : -1;
    const rowStart = activeIndex < 0 ? -1 : Math.floor(activeIndex / this.columns) * this.columns;
    const expanded = 200 / (this.columns + 1);
    const contracted = 100 / (this.columns + 1);
    items.forEach((item, index) => {
      const inActiveRow = rowStart >= 0 && index >= rowStart && index < rowStart + this.columns;
      const width = inActiveRow ? (index === activeIndex ? expanded : contracted) : 100 / this.columns;
      item.style.setProperty('--ui-grid-hover-width', `${width}%`);
      item.toggleAttribute('ui-active', index === activeIndex);
    });
  };
}

define('ui-grid-hover-expand', UiGridHoverExpand);

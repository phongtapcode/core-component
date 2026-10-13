/** A small, navigable book whose authored leaves turn in 3D. */
import { define } from '@ui/core';

const PAGE = 'ui-flip-book-page';
const COVER = 'ui-flip-book-cover';
const SWIPE_START = 8;

interface BookGesture {
  pointerId: number;
  startX: number;
  startY: number;
  direction: 'next' | 'previous' | null;
  leaf: HTMLElement | null;
}

export class UiFlipBook extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-open', 'ui-page', 'data-cover-behind']; }

  private controller: AbortController | null = null;
  private observer: MutationObserver | null = null;
  private closeTimer = 0;
  private coverTimer = 0;
  private clickTimer = 0;
  private gesture: BookGesture | null = null;
  private suppressClick = false;

  get pages(): HTMLElement[] {
    return [...this.children].filter((child): child is HTMLElement => child.localName === PAGE);
  }

  get page(): number { return Math.min(this.pages.length, Math.max(0, Number(this.getAttribute('ui-page')) || 0)); }
  get openState(): boolean { return this.hasAttribute('ui-open'); }

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Flip book');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.addEventListener('click', this.onClick, { signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    window.addEventListener('pointermove', this.onPointerMove, { signal });
    window.addEventListener('pointerup', this.onPointerUp, { signal });
    window.addEventListener('pointercancel', this.onPointerCancel, { signal });
    this.observer = new MutationObserver(() => this.refresh());
    this.observer.observe(this, { childList: true });
    this.refresh();
  }

  disconnectedCallback(): void {
    this.controller?.abort(); this.controller = null;
    this.observer?.disconnect(); this.observer = null;
    window.clearTimeout(this.closeTimer);
    window.clearTimeout(this.coverTimer);
    window.clearTimeout(this.clickTimer);
    this.releaseGesture();
  }

  attributeChangedCallback(name: string): void {
    if (name === 'ui-open') {
      window.clearTimeout(this.coverTimer);
      if (this.openState) this.coverTimer = window.setTimeout(() => this.setAttribute('data-cover-behind', ''), 680);
      else this.removeAttribute('data-cover-behind');
    }
    this.refresh();
  }

  refresh(): void {
    const pages = this.pages;
    const page = this.page;
    const isOpen = this.openState;
    this.style.setProperty('--ui-flip-book-count', String(pages.length));
    this.toggleAttribute('data-final-spread', isOpen && page === pages.length);
    if (this.getAttribute('ui-page') !== String(page)) this.setAttribute('ui-page', String(page));
    this.setAttribute('aria-description', isOpen ? `Open at spread ${page + 1} of ${pages.length + 1}` : 'Closed. Activate the cover to open.');
    const cover = [...this.children].find((child): child is HTMLElement => child.localName === COVER);
    if (cover) {
      cover.setAttribute('role', 'button');
      cover.setAttribute('aria-label', isOpen ? 'Close book' : 'Open book');
      cover.tabIndex = isOpen && page > 0 ? -1 : 0;
      cover.style.zIndex = this.hasAttribute('data-cover-behind') ? '2' : '100';
    }
    pages.forEach((leaf, index) => {
      const turned = index < page;
      leaf.style.setProperty('--ui-flip-book-index', String(index));
      leaf.style.zIndex = String(turned ? pages.length + index + 1 : pages.length - index);
      leaf.toggleAttribute('data-turned', turned);
      const sides = [...leaf.children].filter((child): child is HTMLElement => child instanceof HTMLElement);
      const front = sides.find((child) => child.hasAttribute('data-page-front'));
      const back = sides.find((child) => child.hasAttribute('data-page-back'));
      const frontVisible = isOpen && index === page;
      const backVisible = isOpen && index === page - 1;
      front?.toggleAttribute('inert', !frontVisible);
      back?.toggleAttribute('inert', !backVisible);
      front?.setAttribute('aria-hidden', String(!frontVisible));
      back?.setAttribute('aria-hidden', String(!backVisible));
    });
  }

  open(): void {
    window.clearTimeout(this.closeTimer);
    if (this.openState) return;
    this.removeAttribute('data-cover-behind');
    this.setAttribute('ui-open', '');
    this.dispatchEvent(new CustomEvent('ui:flip-book:open', { bubbles: true, detail: { page: this.page } }));
  }

  close(): void {
    window.clearTimeout(this.closeTimer);
    window.clearTimeout(this.coverTimer);
    if (!this.openState) return;
    const finish = (): void => {
      this.removeAttribute('data-cover-behind');
      this.removeAttribute('ui-open');
      this.dispatchEvent(new CustomEvent('ui:flip-book:close', { bubbles: true, detail: { page: 0 } }));
    };
    if (this.page > 0) {
      this.goTo(0);
      this.closeTimer = window.setTimeout(finish, 680);
    } else finish();
  }

  goTo(index: number): void {
    window.clearTimeout(this.closeTimer);
    const next = Math.min(this.pages.length, Math.max(0, Math.trunc(index)));
    if (!Number.isFinite(next) || next === this.page) return;
    if (!this.openState) this.open();
    this.setAttribute('ui-page', String(next));
    this.dispatchEvent(new CustomEvent('ui:flip-book:change', { bubbles: true, detail: { page: next, total: this.pages.length + 1 } }));
  }

  next(): void { if (!this.openState) this.open(); else this.goTo(this.page + 1); }
  previous(): void { if (this.openState) this.goTo(this.page - 1); }

  private readonly onClick = (event: MouseEvent): void => {
    if (this.suppressClick) { event.preventDefault(); event.stopPropagation(); return; }
    const target = event.target instanceof Element ? event.target.closest(COVER) : null;
    if (target?.parentElement === this) {
      if (this.openState) this.close(); else this.open();
    }
  };

  private gestureLeaf(direction: 'next' | 'previous'): HTMLElement | null {
    if (direction === 'next') return this.openState ? this.pages[this.page] ?? null : this.querySelector(COVER);
    return this.openState ? this.page > 0 ? this.pages[this.page - 1] ?? null : this.querySelector(COVER) : null;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.gesture || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if (event.target instanceof Element && event.target.closest('a,button,input,textarea,select,[contenteditable]')) return;
    this.gesture = { pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, direction:null, leaf:null };
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const gesture = this.gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    if (!gesture.direction) {
      if (Math.abs(dx) < SWIPE_START || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      gesture.direction = dx < 0 ? 'next' : 'previous';
      gesture.leaf = this.gestureLeaf(gesture.direction);
      if (!gesture.leaf) return;
      if (gesture.direction === 'previous' && this.openState && this.page === 0) gesture.leaf.style.zIndex = '100';
      gesture.leaf.style.transition = 'none';
      this.setAttribute('data-dragging', '');
    }
    if (!gesture.leaf) return;
    const pageWidth = Math.max(1, this.getBoundingClientRect().width / 2);
    const progress = Math.min(1, Math.max(0, (gesture.direction === 'next' ? -dx : dx) / pageWidth));
    const from = gesture.direction === 'next' ? this.openState ? -1 : 0 : -179;
    const angle = from + (gesture.direction === 'next' ? -1 : 1) * progress * 155;
    gesture.leaf.style.transform = `rotateY(${angle}deg)`;
    if (event.cancelable) event.preventDefault();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const gesture = this.gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;
    const threshold = Math.max(35, this.getBoundingClientRect().width * .075);
    const commit = gesture.leaf && Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.15 &&
      (gesture.direction === 'next' ? dx < 0 : dx > 0);
    if (gesture.leaf) {
      this.suppressClick = true;
      window.clearTimeout(this.clickTimer);
      this.clickTimer = window.setTimeout(() => { this.suppressClick = false; }, 0);
    }
    if (commit) {
      if (gesture.direction === 'next') this.next();
      else if (this.page === 0) this.close();
      else this.previous();
    }
    this.releaseGesture();
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    if (this.gesture?.pointerId === event.pointerId) this.releaseGesture();
  };

  private releaseGesture(): void {
    const leaf = this.gesture?.leaf;
    if (leaf) {
      leaf.style.removeProperty('transition');
      void leaf.offsetWidth;
      leaf.style.removeProperty('transform');
    }
    this.gesture = null;
    this.removeAttribute('data-dragging');
    if (leaf) this.refresh();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') { event.preventDefault(); this.next(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); this.previous(); }
    else if (event.key === 'Home') { event.preventDefault(); this.goTo(0); }
    else if (event.key === 'End') { event.preventDefault(); this.goTo(this.pages.length); }
    else if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof Element && event.target.closest(COVER)?.parentElement === this) {
      event.preventDefault();
      if (this.openState) this.close(); else this.open();
    }
  };
}

export class UiFlipBookCover extends HTMLElement {}
export class UiFlipBookPage extends HTMLElement {}

define('ui-flip-book', UiFlipBook);
define(COVER, UiFlipBookCover);
define(PAGE, UiFlipBookPage);

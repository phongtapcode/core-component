/**
 * <ui-drawer> — slide-in side panel with backdrop overlay and animation.
 *
 * Attributes:
 *   open      boolean
 *   placement 'left' | 'right' (default 'left')
 *
 * Events:
 *   ui-drawer-open
 *   ui-drawer-close
 *
 * Methods:
 *   openDrawer() / closeDrawer() / toggle()
 *
 * Animation:
 *   data-state='entering' | 'open' | 'leaving' drives CSS slide animations.
 *   A .ui-drawer-backdrop is injected into <body> on open and removed on close.
 *
 * IMPORTANT: onAttributeChanged is guarded by $isConnected so that `open`
 * set in static HTML (e.g. the card thumbnail on the home page) never calls
 * lockScroll / creates a backdrop before the user actually opens the drawer.
 */

import { BaseElement, define } from '@ui/core';
import { lockScroll, trapFocus, unlockScroll } from './focus-trap.js';

type DrawerState = 'closed' | 'entering' | 'open' | 'leaving';

const OPEN_DURATION  = 280;
const CLOSE_DURATION = 200;

export class UiDrawer extends BaseElement {
  static override properties = {
    open:      { name: 'open',      default: false, reflect: true },
    placement: { name: 'placement', default: 'left' },
  };

  static override get observedAttributes() {
    return ['open', 'placement'];
  }

  declare open: boolean;
  declare placement: 'left' | 'right';

  #focusRelease: (() => void) | null = null;
  #backdrop:    HTMLElement | null   = null;
  #leaveTimer:  number | null        = null;
  #state:       DrawerState          = 'closed';

  protected override onConnect(): void {
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');

    this.$on(this, 'click', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-drawer-close]') || target.closest('[data-drawer-close]')) {
        this.closeDrawer();
      }
    });

    this.$on(document, 'keydown', ((e: KeyboardEvent) => {
      if (!this.open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeDrawer();
      }
    }) as EventListener);

    // Reflect initial visual state only — no side-effects (no backdrop, no
    // lockScroll). Side-effects only fire when the user opens via openDrawer().
    if (this.open) {
      this.#setState('open');
    }
  }

  protected override onDisconnect(): void {
    this.#cancelLeaveTimer();
    this.#removeBackdrop(true);
    if (this.#state !== 'closed') {
      unlockScroll();
      this.#focusRelease?.();
      this.#focusRelease = null;
    }
    this.#setState('closed');
  }

  protected override onAttributeChanged(name: string): void {
    // Guard: do not run side-effects for attributes present in static HTML
    // (fires before connectedCallback, $isConnected is still false then).
    if (!this.$isConnected) return;

    if (name === 'open') {
      if (this.open) this.#triggerOpen();
      else this.#triggerClose();
    }
  }

  openDrawer(): void {
    if (this.open) return;
    this.$set('open', true);
    this.$emit('ui-drawer-open', undefined);
  }

  closeDrawer(): void {
    if (!this.open) return;
    this.$set('open', false);
    this.$emit('ui-drawer-close', undefined);
  }

  toggle(): void {
    if (this.open) this.closeDrawer();
    else this.openDrawer();
  }

  // ──────────────────────────────────────────────────────────
  // Private

  #setState(state: DrawerState): void {
    this.#state = state;
    if (state === 'closed') this.removeAttribute('data-state');
    else this.setAttribute('data-state', state);
  }

  #triggerOpen(): void {
    this.#cancelLeaveTimer();
    this.#createBackdrop();
    this.#setState('entering');
    this.#onOpen();
    setTimeout(() => {
      if (this.#state === 'entering') this.#setState('open');
    }, OPEN_DURATION);
  }

  #triggerClose(): void {
    if (this.#state === 'closed' || this.#state === 'leaving') return;
    this.#setState('leaving');
    this.#removeBackdrop(false);
    this.#onClose();
    this.#leaveTimer = setTimeout(() => {
      this.#setState('closed');
      this.#leaveTimer = null;
    }, CLOSE_DURATION) as unknown as number;
  }

  #cancelLeaveTimer(): void {
    if (this.#leaveTimer !== null) {
      clearTimeout(this.#leaveTimer);
      this.#leaveTimer = null;
    }
  }

  /** Inject backdrop into body; clicking it closes the drawer. */
  #createBackdrop(): void {
    if (this.#backdrop) return;
    const bd = document.createElement('div');
    bd.className = 'ui-drawer-backdrop';
    bd.setAttribute('aria-hidden', 'true');
    bd.addEventListener('click', () => this.closeDrawer(), { once: true });
    document.body.appendChild(bd);
    this.#backdrop = bd;
  }

  /** Animate backdrop out then remove it from DOM. */
  #removeBackdrop(immediate: boolean): void {
    const bd = this.#backdrop;
    if (!bd) return;
    this.#backdrop = null;
    if (immediate) {
      bd.remove();
      return;
    }
    bd.dataset['leaving'] = '';
    setTimeout(() => bd.remove(), CLOSE_DURATION);
  }

  #onOpen(): void {
    lockScroll();
    requestAnimationFrame(() => {
      this.#focusRelease = trapFocus(this, this.$on.bind(this));
    });
  }

  #onClose(): void {
    unlockScroll();
    this.#focusRelease?.();
    this.#focusRelease = null;
  }
}

define('ui-drawer', UiDrawer);
export const drawer = UiDrawer;
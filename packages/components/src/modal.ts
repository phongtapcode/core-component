/**
 * <ui-modal> — accessible dialog with smooth open/close animation.
 *
 * Markup convention:
 *   <ui-modal>
 *     <div data-modal-overlay></div>
 *     <div data-modal-dialog>
 *       <h2>Title</h2>
 *       <p>Body</p>
 *       <button data-modal-close>Close</button>
 *     </div>
 *   </ui-modal>
 *
 * Attributes:
 *   open        boolean (default false)
 *   dismissable boolean (default true) — click overlay/Escape to close
 *
 * Events:
 *   ui-modal-open
 *   ui-modal-close
 *
 * Methods:
 *   openModal() / closeModal() / toggle()
 *
 * Animation:
 *   data-state='entering' | 'open' | 'leaving' drives CSS keyframe animations.
 *
 * IMPORTANT: onAttributeChanged is guarded by $isConnected so that an `open`
 * attribute set in the static HTML (e.g. a thumbnail) never calls lockScroll
 * before the element is meaningfully part of the document.
 */

import { BaseElement, define } from '@ui/core';
import { lockScroll, trapFocus, unlockScroll } from './focus-trap.js';

type ModalState = 'closed' | 'entering' | 'open' | 'leaving';

const OPEN_DURATION  = 240;
const CLOSE_DURATION = 180;

export class UiModal extends BaseElement {
  static override properties = {
    open:        { name: 'open',        default: false, reflect: true },
    dismissable: { name: 'dismissable', default: true },
  };

  static override get observedAttributes() {
    return ['open', 'dismissable'];
  }

  declare open: boolean;
  declare dismissable: boolean;

  #focusRelease:  (() => void) | null = null;
  #previousFocus: HTMLElement | null  = null;
  #leaveTimer:    number | null       = null;
  #state:         ModalState          = 'closed';

  protected override onConnect(): void {
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');

    // Click handler: overlay or [data-modal-close]
    this.$on(this, 'click', (e) => {
      if (!this.dismissable) return;
      const target = e.target as HTMLElement;
      if (
        target.matches('[data-modal-close]') ||
        target.closest('[data-modal-close]') ||
        target.matches('[data-modal-overlay]')
      ) {
        this.closeModal();
      }
    });

    // Escape key
    this.$on(document, 'keydown', ((e: KeyboardEvent) => {
      if (!this.open) return;
      if (e.key === 'Escape' && this.dismissable) {
        e.preventDefault();
        this.closeModal();
      }
    }) as EventListener);

    // Reflect initial visual state (no side-effects like lockScroll here —
    // those only run when the user explicitly opens the modal via openModal()).
    if (this.open) {
      this.#setState('open');
    }
  }

  protected override onDisconnect(): void {
    this.#cancelLeaveTimer();
    if (this.#state !== 'closed') {
      unlockScroll();
      this.#focusRelease?.();
      this.#focusRelease = null;
    }
    this.#setState('closed');
  }

  protected override onAttributeChanged(name: string): void {
    // Guard: attribute may be set from static HTML before the element is
    // connected; we must not call lockScroll/unlockScroll in that case.
    if (!this.$isConnected) return;
    if (name !== 'open') return;
    if (this.open) this.#triggerOpen();
    else this.#triggerClose();
  }

  openModal(): void {
    if (this.open) return;
    this.$set('open', true);
    this.$emit('ui-modal-open', undefined);
  }

  closeModal(): void {
    if (!this.open) return;
    this.$set('open', false);
    this.$emit('ui-modal-close', undefined);
  }

  toggle(): void {
    if (this.open) this.closeModal();
    else this.openModal();
  }

  // ──────────────────────────────────────────────────────────
  // Private

  #setState(state: ModalState): void {
    this.#state = state;
    if (state === 'closed') this.removeAttribute('data-state');
    else this.setAttribute('data-state', state);
  }

  #triggerOpen(): void {
    this.#cancelLeaveTimer();
    this.#setState('entering');
    this.#onOpen();
    setTimeout(() => {
      if (this.#state === 'entering') this.#setState('open');
    }, OPEN_DURATION);
  }

  #triggerClose(): void {
    if (this.#state === 'closed' || this.#state === 'leaving') return;
    this.#setState('leaving');
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

  #onOpen(): void {
    lockScroll();
    this.#previousFocus = (this.ownerDocument ?? document).activeElement as HTMLElement | null;
    requestAnimationFrame(() => {
      this.#focusRelease = trapFocus(this, this.$on.bind(this));
    });
  }

  #onClose(): void {
    unlockScroll();
    this.#focusRelease?.();
    this.#focusRelease = null;
    this.#previousFocus?.focus?.();
    this.#previousFocus = null;
  }
}

define('ui-modal', UiModal);
export const modal = UiModal;
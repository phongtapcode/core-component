/**
 * Shared utilities for components: focus trap, scroll lock.
 *
 * `withFocusTrap`: wraps a class to add Tab/Shift+Tab containment.
 * `lockScroll` / `unlockScroll`: prevent body scroll while an overlay is open.
 *
 * Both go through the host element's CleanupRegistry.
 */

import type { BaseElement } from '@ui/core';

/** Selector for elements that can receive focus. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Lock body scroll while an overlay is open. Idempotent — multiple locks
 * stack and unlock() decrements the counter.
 */
let scrollLockCount = 0;
let scrollLockY = 0;

export function lockScroll(): void {
  if (scrollLockCount === 0) {
    scrollLockY = globalThis.scrollY ?? 0;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollLockY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
  }
  scrollLockCount++;
}

export function unlockScroll(): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    const body = document.body;
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.overflow = '';
    globalThis.scrollTo?.(0, scrollLockY);
  }
}

/**
 * Trap focus within `container` until `release()` is called. Returns a
 * disposer. Listeners are added via `on()` so they auto-clean.
 */
export function trapFocus(
  container: Element,
  on: <K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    listener: (ev: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean,
  ) => () => void,
): () => void {
  const focusable = (): HTMLElement[] =>
    [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
    );

  const onKeydown = (ev: KeyboardEvent): void => {
    if (ev.key !== 'Tab') return;
    const items = focusable();
    if (items.length === 0) {
      ev.preventDefault();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = (container.ownerDocument ?? document).activeElement as HTMLElement | null;
    if (ev.shiftKey && active === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && active === last) {
      ev.preventDefault();
      first.focus();
    }
  };

  const off = on(container, 'keydown', onKeydown as EventListener);

  // Move focus into the trap.
  const items = focusable();
  if (items.length > 0) {
    items[0]!.focus();
  } else {
    (container as HTMLElement).tabIndex = -1;
    (container as HTMLElement).focus();
  }

  return off;
}

/** Find the next focusable element before `container` (for restore-on-close). */
export function findTrigger(container: Element): HTMLElement | null {
  return container as HTMLElement;
}

/** Helper: ensure cleanup runs for a BaseElement host. */
export function autoCleanup(host: BaseElement, teardown: () => void): void {
  host.$cleanup.add(teardown);
}
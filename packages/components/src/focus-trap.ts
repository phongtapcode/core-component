/**
 * Shared utilities for components: focus trap, scroll lock.
 *
 * `withFocusTrap`: wraps a class to add Tab/Shift+Tab containment.
 * `lockScroll` / `unlockScroll`: prevent page scroll while an overlay is open.
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
 * Lock root scrolling without changing body positioning. The scrollbar gutter
 * stays reserved, so opening a dialog does not move the page underneath it.
 * Multiple overlays share the same lock.
 */
let scrollLockCount = 0;
let previousScrollStyles: { overflow: string; scrollbarGutter: string; paddingRight: string } | null = null;

export function lockScroll(): void {
  if (scrollLockCount === 0) {
    const root = document.documentElement;
    previousScrollStyles = {
      overflow: root.style.overflow,
      scrollbarGutter: root.style.scrollbarGutter,
      paddingRight: root.style.paddingRight,
    };
    const gutter = root.clientWidth > 0 ? Math.max(0, window.innerWidth - root.clientWidth) : 0;
    if (gutter > 0) {
      if (typeof CSS !== 'undefined' && CSS.supports?.('scrollbar-gutter', 'stable')) {
        root.style.scrollbarGutter = 'stable';
      } else {
        const padding = parseFloat(getComputedStyle(root).paddingRight) || 0;
        root.style.paddingRight = `${padding + gutter}px`;
      }
    }
    root.style.overflow = 'hidden';
  }
  scrollLockCount++;
}

export function unlockScroll(): void {
  if (scrollLockCount === 0) return;
  scrollLockCount--;
  if (scrollLockCount !== 0 || !previousScrollStyles) return;
  const root = document.documentElement;
  root.style.overflow = previousScrollStyles.overflow;
  root.style.scrollbarGutter = previousScrollStyles.scrollbarGutter;
  root.style.paddingRight = previousScrollStyles.paddingRight;
  previousScrollStyles = null;
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

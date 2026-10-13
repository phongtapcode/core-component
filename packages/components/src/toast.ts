/** Temporary notifications rendered into one fixed portal per placement. */
import { define } from '@ui/core';

export type ToastPlacement = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastOptions {
  name?: string;
  content?: string | Node;
  placement?: ToastPlacement;
  delay?: number;
  duration?: number;
  easing?: string;
  className?: string;
  closeButtonDisabled?: boolean;
  closeButtonClassName?: string;
  closeButtonPlacement?: string;
}

const placements: ToastPlacement[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const easings: Record<string, string> = {
  decay: 'cubic-bezier(.2,.8,.2,1)',
  spring: 'cubic-bezier(.18,1.3,.4,1)',
  ease: 'ease',
  linear: 'linear',
};
const liveToasts = new Set<UiToast>();

function placement(value: string | null | undefined): ToastPlacement {
  return placements.includes(value as ToastPlacement) ? value as ToastPlacement : 'bottom-center';
}

function milliseconds(value: number | string | null | undefined, fallback: number, allowInfinity = false): number {
  if (value === Infinity || value === 'Infinity') return allowInfinity ? Infinity : fallback;
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function setting<T extends keyof ToastOptions>(options: ToastOptions, key: T, template: UiToast | null, attribute: string): ToastOptions[T] | string | null {
  return options[key] ?? template?.getAttribute(attribute) ?? null;
}

function portalFor(position: ToastPlacement): UiToastPortal {
  let portal = [...document.querySelectorAll<UiToastPortal>('ui-toast-portal')]
    .find((item) => item.getAttribute('ui-placement') === position);
  if (!portal) {
    portal = document.createElement('ui-toast-portal') as UiToastPortal;
    portal.setAttribute('ui-placement', position);
    document.body.append(portal);
  }
  return portal;
}

export class UiToastPortal extends HTMLElement {}

export class UiToastCloseButton extends HTMLElement {
  connectedCallback(): void {
    let button = this.querySelector('button');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', 'Close notification');
      button.textContent = '×';
      this.append(button);
    }
    if (this.className) button.classList.add(...this.className.split(/\s+/).filter(Boolean));
  }
}

export class UiToast extends HTMLElement {
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private removeTimer: ReturnType<typeof setTimeout> | null = null;
  private openFrame: number | null = null;
  private duration = 200;
  private delay = 2000;

  connectedCallback(): void {
    if (!this.hasAttribute('data-toast-live')) return;
    this.addEventListener('click', this.onClick);
  }

  disconnectedCallback(): void {
    this.clearTimers();
    this.removeEventListener('click', this.onClick);
    liveToasts.delete(this);
  }

  private readonly onClick = (event: MouseEvent): void => {
    if ((event.target as Element).closest('ui-toast-close-button')) this.closeToast();
  };

  showToast(duration: number, delay: number): void {
    this.duration = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 0 : duration;
    this.delay = delay;
    this.style.setProperty('--ui-toast-duration', `${this.duration}ms`);
    if (Number.isFinite(this.delay)) this.style.setProperty('--ui-toast-delay', `${this.delay}ms`);
    this.dataset['state'] = 'opening';
    // Force the starting state before activating the transition.
    void this.offsetWidth;
    this.openFrame = requestAnimationFrame(() => {
      this.openFrame = null;
      if (!this.isConnected) return;
      this.dataset['state'] = 'open';
    });
    if (Number.isFinite(this.delay)) this.dismissTimer = setTimeout(() => this.closeToast(), this.delay);
  }

  closeToast(): void {
    if (this.dataset['state'] === 'closing') return;
    this.clearTimers();
    this.dataset['state'] = 'closing';
    if (this.duration === 0) this.remove();
    else this.removeTimer = setTimeout(() => this.remove(), this.duration);
  }

  private clearTimers(): void {
    if (this.dismissTimer !== null) clearTimeout(this.dismissTimer);
    if (this.removeTimer !== null) clearTimeout(this.removeTimer);
    if (this.openFrame !== null) cancelAnimationFrame(this.openFrame);
    this.dismissTimer = this.removeTimer = null;
    this.openFrame = null;
  }
}

function push(input: ToastOptions | string): UiToast | null {
  const options: ToastOptions = typeof input === 'string' ? { content: input } : input;
  const template = options.name ? [...document.querySelectorAll<UiToast>('ui-toast[ui-name]')]
    .find((item) => !item.hasAttribute('data-toast-live') && item.getAttribute('ui-name') === options.name) ?? null : null;
  if (options.name && !template && options.content === undefined) {
    console.warn(`[ui-toast] Template "${options.name}" was not found.`);
    return null;
  }

  const toast = template ? template.cloneNode(true) as UiToast : document.createElement('ui-toast') as UiToast;
  toast.setAttribute('data-toast-live', '');
  const name = options.name ?? template?.getAttribute('ui-name');
  if (name) toast.setAttribute('ui-name', name);
  if (options.content !== undefined) {
    if (typeof options.content === 'string') {
      if (typeof input === 'string') toast.textContent = options.content;
      else toast.innerHTML = options.content;
    } else toast.replaceChildren(options.content);
  }

  const position = placement(setting(options, 'placement', template, 'ui-placement') as string | null);
  const duration = milliseconds(setting(options, 'duration', template, 'ui-duration') as number | string | null, 200);
  const delay = milliseconds(setting(options, 'delay', template, 'ui-delay') as number | string | null, 2000, true);
  const easing = (setting(options, 'easing', template, 'ui-easing') as string | null)?.trim() || 'decay';
  const className = setting(options, 'className', template, 'ui-class-name') as string | null;
  if (className) toast.classList.add(...className.split(/\s+/).filter(Boolean));
  toast.style.setProperty('--ui-toast-easing', easings[easing] ?? easing);
  toast.setAttribute('ui-placement', position);
  toast.setAttribute('role', toast.getAttribute('role') ?? 'status');
  toast.setAttribute('aria-live', toast.getAttribute('aria-live') ?? 'polite');

  const disabled = options.closeButtonDisabled ?? template?.hasAttribute('ui-close-button-disabled') ?? false;
  let closeButton = toast.querySelector<UiToastCloseButton>('ui-toast-close-button');
  if (disabled) closeButton?.remove();
  else {
    if (!closeButton) {
      closeButton = document.createElement('ui-toast-close-button') as UiToastCloseButton;
      toast.append(closeButton);
    }
    const closeClass = setting(options, 'closeButtonClassName', template, 'ui-close-button-class-name') as string | null;
    if (closeClass) closeButton.classList.add(...closeClass.split(/\s+/).filter(Boolean));
    const closePlacement = setting(options, 'closeButtonPlacement', template, 'ui-close-button-placement') as string | null;
    closeButton.setAttribute('ui-placement', closePlacement || 'top-right');
    toast.toggleAttribute('data-close-left', (closePlacement || 'top-right').endsWith('left'));
  }

  portalFor(position).append(toast);
  liveToasts.add(toast);
  toast.showToast(duration, delay);
  return toast;
}

function remove(name?: string): void {
  for (const toast of liveToasts) {
    if (!name || toast.getAttribute('ui-name') === name) toast.closeToast();
  }
}

export const uiToast = Object.assign((content: string) => push(content), { push, remove });

declare global {
  interface Window { uiToast: typeof uiToast }
}

if (typeof window !== 'undefined') window.uiToast = uiToast;

define('ui-toast-portal', UiToastPortal);
define('ui-toast', UiToast);
define('ui-toast-close-button', UiToastCloseButton);

/** A scripted, decorative cursor that travels to a target inside its host. */
import { BaseElement, define } from '@ui/core';

const durationOf = (host: HTMLElement): number => {
  const value = Number(host.getAttribute('ui-duration'));
  return host.hasAttribute('ui-duration') && Number.isFinite(value)
    ? Math.min(30000, Math.max(800, value)) : 3200;
};

export class UiFakeCursor extends BaseElement {
  static override get observedAttributes(): string[] {
    return ['ui-target', 'ui-duration', 'ui-label', 'ui-activate', 'ui-once'];
  }

  #target: HTMLElement | null = null;
  #cursor: HTMLElement | null = null;
  #clickTimer: number | null = null;
  #cycleTimer: number | null = null;
  #observer: ResizeObserver | null = null;
  #paused = false;

  protected override onConnect(): void {
    this.#cursor = this.querySelector<HTMLElement>(':scope > [data-fake-cursor]');
    if (!this.#cursor) {
      this.#cursor = document.createElement('span');
      this.#cursor.setAttribute('data-fake-cursor', '');
      this.#cursor.setAttribute('aria-hidden', 'true');
      this.#cursor.innerHTML = '<svg viewBox="0 0 30 36" width="30" height="36" fill="none" aria-hidden="true"><path d="M3 2 7.8 29l6.5-9.7 10.7-2.4L3 2Z" fill="var(--ui-fake-cursor-color, #2563eb)" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg><span data-fake-cursor-label></span>';
      this.append(this.#cursor);
    }
    if (!this.querySelector(':scope > [data-fake-cursor-pulse]')) {
      const pulse = document.createElement('span');
      pulse.setAttribute('data-fake-cursor-pulse', '');
      pulse.setAttribute('aria-hidden', 'true');
      this.append(pulse);
    }
    if (!this.querySelector(':scope > [data-fake-cursor-focus]')) {
      const focus = document.createElement('span');
      focus.setAttribute('data-fake-cursor-focus', '');
      focus.setAttribute('aria-hidden', 'true');
      focus.innerHTML = '<i></i><i></i><i></i><i></i>';
      this.append(focus);
    }
    this.#cursor.querySelector<HTMLElement>('[data-fake-cursor-label]')!.textContent = this.getAttribute('ui-label') || 'Guide';
    this.#paused = false;
    this.refresh();

    if (typeof ResizeObserver !== 'undefined') {
      this.#observer = new ResizeObserver(() => this.#measure());
      this.#observer.observe(this);
      if (this.#target) this.#observer.observe(this.#target);
      this.$cleanup.add(() => { this.#observer?.disconnect(); this.#observer = null; });
    } else this.$on(window, 'resize', () => this.#measure());

    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (motion) this.$on(motion, 'change', () => this.refresh());
  }

  protected override onDisconnect(): void {
    this.#clearTimers();
    this.removeAttribute('data-running');
    this.#target = null;
  }

  protected override onAttributeChanged(name: string): void {
    if (!this.$isConnected) return;
    if (name === 'ui-label') {
      const label = this.#cursor?.querySelector<HTMLElement>('[data-fake-cursor-label]');
      if (label) label.textContent = this.getAttribute('ui-label') || 'Guide';
    } else this.refresh();
  }

  play(): void { this.#paused = false; this.refresh(); }
  pause(): void { this.#paused = true; this.#clearTimers(); this.removeAttribute('data-running'); }
  replay(): void { this.#paused = false; this.refresh(); }

  refresh(): void {
    this.#clearTimers();
    this.removeAttribute('data-running');
    const selector = this.getAttribute('ui-target') || '[data-cursor-target]';
    let target: HTMLElement | null = null;
    try { target = this.querySelector<HTMLElement>(selector); } catch { /* Invalid selectors have no target. */ }
    if (target?.closest('[data-fake-cursor], [data-fake-cursor-pulse], [data-fake-cursor-focus]')) target = null;
    if (this.#target !== target) {
      if (this.#target) this.#observer?.unobserve(this.#target);
      if (target) this.#observer?.observe(target);
    }
    this.#target = target;
    this.#measure();
    if (this.isConnected && target && !this.#paused && !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      this.#startCycle();
    }
  }

  #measure(): void {
    if (!this.#target) return;
    const host = this.getBoundingClientRect();
    const target = this.#target.getBoundingClientRect();
    this.style.setProperty('--ui-fake-cursor-start-x', `${Math.max(0, host.width - 38)}px`);
    this.style.setProperty('--ui-fake-cursor-start-y', `${Math.max(0, host.height - 48)}px`);
    this.style.setProperty('--ui-fake-cursor-target-x', `${target.left - host.left + target.width / 2}px`);
    this.style.setProperty('--ui-fake-cursor-target-y', `${target.top - host.top + target.height / 2}px`);
    this.style.setProperty('--ui-fake-cursor-target-left', `${target.left - host.left}px`);
    this.style.setProperty('--ui-fake-cursor-target-top', `${target.top - host.top}px`);
    this.style.setProperty('--ui-fake-cursor-target-width', `${target.width}px`);
    this.style.setProperty('--ui-fake-cursor-target-height', `${target.height}px`);
    this.style.setProperty('--ui-fake-cursor-duration', `${durationOf(this)}ms`);
  }

  #startCycle(): void {
    if (!this.#target) return;
    this.removeAttribute('data-running');
    // Restart CSS keyframes at the same instant as the click timer.
    void this.#cursor?.offsetWidth;
    this.setAttribute('data-running', '');
    const duration = durationOf(this);
    this.#clickTimer = window.setTimeout(() => {
      this.#clickTimer = null;
      const target = this.#target;
      if (!target || !this.isConnected || this.#paused) return;
      const event = new CustomEvent('ui-fake-cursor:click', {
        detail: { target }, bubbles: true, cancelable: true,
      });
      if (this.dispatchEvent(event) && this.hasAttribute('ui-activate')) target.click();
    }, duration * 0.65);
    if (!this.hasAttribute('ui-once')) {
      this.#cycleTimer = window.setTimeout(() => {
        this.#cycleTimer = null;
        if (this.isConnected && !this.#paused) this.#startCycle();
      }, duration);
    }
  }

  #clearTimers(): void {
    if (this.#clickTimer !== null) window.clearTimeout(this.#clickTimer);
    if (this.#cycleTimer !== null) window.clearTimeout(this.#cycleTimer);
    this.#clickTimer = null;
    this.#cycleTimer = null;
  }
}

define('ui-fake-cursor', UiFakeCursor);

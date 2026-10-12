/**
 * <ui-counter> — count up to N from 0.
 *
 * Usage:
 *   <ui-counter from="0" to="100" duration="2000"></ui-counter>
 *
 * Uses requestAnimationFrame; respects prefers-reduced-motion (jumps immediately).
 */

import { BaseElement, define } from '@ui/core';

export class UiCounter extends BaseElement {
  static override properties = {
    from: { name: 'from', default: 0 },
    to: { name: 'to', default: 100 },
    duration: { name: 'duration', default: 1500 },
  };

  static override get observedAttributes() {
    return ['from', 'to', 'duration'];
  }

  declare from: number;
  declare to: number;
  declare duration: number;
  #frame: number | null = null;

  protected override onConnect(): void {
    this.#stop();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || this.duration <= 0 || this.from === this.to) {
      this.textContent = String(this.to);
      return;
    }
    this.textContent = String(this.from);
    const tickStart = startTime();
    const tick = (now: number): void => {
      const t = Math.min(1, (now - tickStart) / this.duration);
      const value = this.from + (this.to - this.from) * t;
      this.textContent = String(Math.round(value));
      this.#frame = t < 1 ? requestAnimationFrame(tick) : null;
    };
    this.#frame = requestAnimationFrame(tick);
  }

  protected override onDisconnect(): void {
    this.#stop();
  }

  restart(): void {
    this.onConnect();
  }

  #stop(): void {
    if (this.#frame !== null) cancelAnimationFrame(this.#frame);
    this.#frame = null;
  }
}

/** Local helper to read performance.now() in a test-friendly way. */
function startTime(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

define('ui-counter', UiCounter);
export const counter = UiCounter;

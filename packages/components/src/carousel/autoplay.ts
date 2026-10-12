/**
 * Carousel Autoplay Engine with requestAnimationFrame progress calculation.
 * Respects prefers-reduced-motion, document visibility, focus, and hover.
 */

export interface AutoplayOptions {
  interval: number; // in ms, 0 = disabled
  hoverPause: boolean;
  stopOnInteraction: boolean;
  exposeProgress: boolean;
  host: HTMLElement;
  onAdvance: () => void;
}

export class AutoplayEngine {
  #options: AutoplayOptions;
  #running = false;
  #paused = false;
  #stoppedByInteraction = false;
  #startTime = 0;
  #elapsed = 0;
  #rafId: number | null = null;
  #cleanupListeners: (() => void)[] = [];

  constructor(options: AutoplayOptions) {
    this.#options = options;
    this.#setupListeners();
  }

  get isRunning(): boolean {
    return this.#running && !this.#paused && !this.#stoppedByInteraction;
  }

  updateOptions(options: Partial<AutoplayOptions>): void {
    const wasRunning = this.isRunning;
    this.#options = { ...this.#options, ...options };
    if (this.#options.interval <= 0) {
      this.pause();
    } else if (wasRunning) {
      this.play();
    }
  }

  play(): void {
    if (this.#options.interval <= 0) return;
    if (this.#isReducedMotion()) return;

    if (this.#rafId !== null) cancelAnimationFrame(this.#rafId);
    this.#rafId = null;

    this.#stoppedByInteraction = false;
    this.#paused = false;
    this.#running = true;
    this.#startTime = performance.now() - this.#elapsed;
    this.#loop();
  }

  pause(): void {
    this.#running = false;
    this.#paused = true;
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
  }

  resume(): void {
    if (this.#stoppedByInteraction || this.#options.interval <= 0) return;
    this.play();
  }

  onUserInteraction(): void {
    if (this.#options.stopOnInteraction) {
      this.#stoppedByInteraction = true;
      this.pause();
    } else {
      // Restart the interval after an interaction.
      this.pause();
      this.#elapsed = 0;
      this.play();
    }
  }

  destroy(): void {
    this.pause();
    for (const off of this.#cleanupListeners) off();
    this.#cleanupListeners = [];
    this.#resetProgress();
  }

  #loop = (): void => {
    if (!this.#running || this.#paused) return;

    const now = performance.now();
    this.#elapsed = now - this.#startTime;
    const progress = Math.min(1, Math.max(0, this.#elapsed / this.#options.interval));

    if (this.#options.exposeProgress) {
      const pct = `${(progress * 100).toFixed(1)}%`;
      this.#options.host.style.setProperty('--ui-carousel-autoplay-progress', pct);
      this.#options.host.style.setProperty('--core-carousel-autoplay-progress', pct);
    }

    if (this.#elapsed >= this.#options.interval) {
      this.#elapsed = 0;
      this.#startTime = performance.now();
      this.#options.onAdvance();
    }

    this.#rafId = requestAnimationFrame(this.#loop);
  };

  #resetProgress(): void {
    if (this.#options.exposeProgress) {
      this.#options.host.style.setProperty('--ui-carousel-autoplay-progress', '0%');
      this.#options.host.style.setProperty('--core-carousel-autoplay-progress', '0%');
    }
  }

  #isReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    );
  }

  #setupListeners(): void {
    const host = this.#options.host;

    // Hover pause
    const onEnter = (): void => {
      if (this.#options.hoverPause && this.#running) this.pause();
    };
    const onLeave = (): void => {
      if (this.#options.hoverPause && this.#paused && !this.#stoppedByInteraction) this.resume();
    };
    host.addEventListener('mouseenter', onEnter);
    host.addEventListener('mouseleave', onLeave);
    this.#cleanupListeners.push(() => {
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', onLeave);
    });

    // Visibility change
    const onVisibility = (): void => {
      if (document.hidden) {
        if (this.#running) this.pause();
      } else {
        if (this.#paused && !this.#stoppedByInteraction && this.#options.interval > 0) this.resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    this.#cleanupListeners.push(() => {
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }
}

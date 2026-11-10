import { define } from '@ui/core';

export interface FlashlightFrame { x: number; y: number; radius: number }
type Keyframe = { at: number; x: number; y: number; radius: number };

const ease = (value: number): number => value * value * (3 - 2 * value);
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Spotlight position in image pixels; the last stage expands past every corner. */
export function flashlightFrame(progress: number, width: number, height: number, radiusRatio = .26): FlashlightFrame {
  const spot = Math.min(width, height) * radiusRatio;
  const frames: Keyframe[] = [
    { at: 0, x: .18, y: .62, radius: 0 },
    { at: .09, x: .18, y: .62, radius: spot },
    { at: .28, x: .42, y: .33, radius: spot },
    { at: .48, x: .70, y: .43, radius: spot },
    { at: .61, x: .59, y: .68, radius: spot },
    { at: .70, x: .59, y: .68, radius: spot },
    { at: 1, x: .5, y: .5, radius: Math.hypot(width, height) },
  ];
  const time = clamp(progress, 0, 1);
  const last = frames[frames.length - 1]!;
  if (time >= 1) return { x: last.x * width, y: last.y * height, radius: last.radius };
  const index = frames.findIndex((frame) => frame.at > time);
  const from = frames[Math.max(0, index - 1)]!;
  const to = frames[index]!;
  const amount = ease((time - from.at) / (to.at - from.at));
  return {
    x: (from.x + (to.x - from.x) * amount) * width,
    y: (from.y + (to.y - from.y) * amount) * height,
    radius: from.radius + (to.radius - from.radius) * amount,
  };
}

const numberAttr = (host: Element, name: string, fallback: number, min: number, max: number): number => {
  const value = Number(host.getAttribute(name));
  return host.hasAttribute(name) && Number.isFinite(value) ? clamp(value, min, max) : fallback;
};

/** Reveals one authored image through a moving circle, then illuminates it fully. */
export class UiImageFlashlight extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-duration', 'ui-radius', 'ui-loop', 'ui-loop-delay', 'ui-start-target', 'ui-hover', 'ui-hover-inertia']; }

  private source: HTMLImageElement | null = null;
  private reveal: HTMLImageElement | null = null;
  private loadController: AbortController | null = null;
  private visibilityController: AbortController | null = null;
  private hoverController: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frameId = 0;
  private loopTimer = 0;
  private generation = 0;
  private canLoop = false;
  private startTime = 0;
  private width = 0;
  private height = 0;
  private hoverFramePending = false;
  private hoverPointer: { x: number; y: number } | null = null;
  private hoverNeedsMeasure = false;
  private hoverInitialized = false;
  private hoverLastTime = 0;
  private hoverX = 0;
  private hoverY = 0;
  private hoverTargetX = 0;
  private hoverTargetY = 0;
  private hoverVelocityX = 0;
  private hoverVelocityY = 0;
  private burst: { start: number; x: number; y: number; fromRadius: number } | null = null;
  private displayedRadius = 0;
  private addedTabIndex = false;

  private get hoverEnabled(): boolean {
    const value = this.getAttribute('ui-hover');
    return value !== null && value !== 'false' && value !== '0';
  }

  connectedCallback(): void {
    if (this.loadController) return;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(this);
    }
    this.refresh();
  }

  disconnectedCallback(): void {
    this.loadController?.abort();
    this.loadController = null;
    this.visibilityController?.abort();
    this.visibilityController = null;
    this.hoverController?.abort();
    this.hoverController = null;
    this.hoverPointer = null;
    this.hoverFramePending = false;
    this.hoverInitialized = false;
    this.hoverLastTime = 0;
    this.burst = null;
    this.displayedRadius = 0;
    if (this.addedTabIndex) { this.removeAttribute('tabindex'); this.addedTabIndex = false; }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.generation++;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.loopTimer);
    this.reveal?.remove();
    this.reveal = null;
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if ((name === 'ui-radius' || name === 'ui-hover-inertia') && this.getAttribute('data-state') === 'hover') {
      this.scheduleHoverPaint();
      return;
    }
    if (name === 'ui-loop' || name === 'ui-loop-delay') {
      clearTimeout(this.loopTimer);
      if (this.getAttribute('data-state') === 'complete') this.scheduleLoop();
    } else this.refresh();
  }

  /** Re-read the direct child image after its source changes. */
  refresh(): void {
    if (!this.isConnected) return;
    this.loadController?.abort();
    this.loadController = new AbortController();
    const generation = ++this.generation;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.loopTimer);
    this.visibilityController?.abort();
    this.visibilityController = null;
    this.hoverController?.abort();
    this.hoverController = null;
    this.hoverPointer = null;
    this.hoverFramePending = false;
    this.hoverInitialized = false;
    this.hoverLastTime = 0;
    this.burst = null;
    this.displayedRadius = 0;
    if (!this.hoverEnabled && this.addedTabIndex) { this.removeAttribute('tabindex'); this.addedTabIndex = false; }
    this.canLoop = false;
    this.reveal?.remove();
    this.reveal = null;
    const source = [...this.children].find((child): child is HTMLImageElement =>
      child.localName === 'img' && !child.classList.contains('ui-image-flashlight__reveal')) ?? null;
    this.source = source;
    if (!source) { this.removeAttribute('data-state'); return; }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.complete();
      return;
    }
    this.setAttribute('data-state', 'waiting');
    const run = (): void => {
      if (this.generation !== generation) return;
      if (this.hoverEnabled) this.startHover(source);
      else this.startWhenVisible(source);
    };
    if (source.complete) {
      if (source.naturalWidth && source.naturalHeight) run();
      else this.complete();
    } else {
      source.addEventListener('load', run, { once: true, signal: this.loadController.signal });
      source.addEventListener('error', () => this.complete(), { once: true, signal: this.loadController.signal });
    }
  }

  /** Start the spotlight sequence again. */
  replay(): void { this.refresh(); }

  private measure(): void {
    const rect = this.getBoundingClientRect();
    this.width = rect.width || this.source?.naturalWidth || 1;
    this.height = rect.height || this.source?.naturalHeight || 1;
    if (this.hoverPointer) { this.hoverNeedsMeasure = true; this.scheduleHoverPaint(); }
  }

  private createReveal(source: HTMLImageElement): HTMLImageElement {
    const reveal = source.cloneNode(false) as HTMLImageElement;
    reveal.className = 'ui-image-flashlight__reveal';
    reveal.removeAttribute('srcset');
    reveal.removeAttribute('sizes');
    reveal.src = source.currentSrc || source.src;
    reveal.alt = '';
    reveal.setAttribute('aria-hidden', 'true');
    reveal.draggable = false;
    const style = getComputedStyle(source);
    reveal.style.objectFit = style.objectFit;
    reveal.style.objectPosition = style.objectPosition;
    this.append(reveal);
    this.reveal = reveal;
    return reveal;
  }

  private startHover(source: HTMLImageElement): void {
    this.measure();
    const reveal = this.createReveal(source);
    reveal.style.opacity = '0';
    reveal.style.transition = 'opacity 140ms ease';
    this.setAttribute('data-state', 'hover');
    if (!this.hasAttribute('tabindex')) { this.tabIndex = 0; this.addedTabIndex = true; }

    this.hoverController = new AbortController();
    const signal = this.hoverController.signal;
    const move = (event: PointerEvent): void => {
      this.hoverPointer = { x: event.clientX, y: event.clientY };
      this.hoverNeedsMeasure = true;
      this.scheduleHoverPaint();
    };
    this.addEventListener('pointerenter', move, { signal });
    this.addEventListener('pointermove', move, { signal });
    this.addEventListener('click', (event: MouseEvent) => {
      const rect = this.getBoundingClientRect();
      this.width = rect.width || 1;
      this.height = rect.height || 1;
      const x = event.detail === 0 ? this.width / 2 : clamp(event.clientX - rect.left, 0, this.width);
      const y = event.detail === 0 ? this.height / 2 : clamp(event.clientY - rect.top, 0, this.height);
      const radius = Math.min(this.width, this.height) * numberAttr(this, 'ui-radius', .26, .1, .55);
      this.burst = { start: performance.now(), x, y, fromRadius: this.displayedRadius || radius };
      this.scheduleHoverPaint();
    }, { signal });
    const leave = (): void => {
      this.hoverPointer = null;
      this.hoverInitialized = false;
      this.hoverLastTime = 0;
      if (this.burst) return;
      cancelAnimationFrame(this.frameId);
      this.hoverFramePending = false;
      reveal.style.opacity = '0';
    };
    this.addEventListener('pointerleave', leave, { signal });
    this.addEventListener('pointercancel', leave, { signal });
    const reposition = (): void => {
      if (!this.hoverPointer) return;
      this.hoverNeedsMeasure = true;
      this.scheduleHoverPaint();
    };
    document.addEventListener('scroll', reposition, { capture: true, passive: true, signal });
    window.addEventListener('resize', reposition, { signal });
  }

  private scheduleHoverPaint(): void {
    if (this.hoverFramePending || (!this.hoverPointer && !this.burst)) return;
    this.hoverFramePending = true;
    this.frameId = requestAnimationFrame((now) => {
      this.hoverFramePending = false;
      if (!this.isConnected || (!this.hoverPointer && !this.burst) || !this.reveal) return;
      if (this.hoverNeedsMeasure && this.hoverPointer) {
        const rect = this.getBoundingClientRect();
        this.width = rect.width || 1;
        this.height = rect.height || 1;
        this.hoverTargetX = clamp(this.hoverPointer.x - rect.left, 0, this.width);
        this.hoverTargetY = clamp(this.hoverPointer.y - rect.top, 0, this.height);
        this.hoverNeedsMeasure = false;
      }
      let moving = false;
      if (this.hoverPointer) {
        const inertia = numberAttr(this, 'ui-hover-inertia', .55, 0, 1);
        if (!this.hoverInitialized || inertia === 0 || (this.hoverLastTime && now - this.hoverLastTime > 300)) {
          this.hoverX = this.hoverTargetX;
          this.hoverY = this.hoverTargetY;
          this.hoverVelocityX = 0;
          this.hoverVelocityY = 0;
          this.hoverInitialized = true;
        } else {
          const step = this.hoverLastTime ? clamp((now - this.hoverLastTime) / (1000 / 60), .5, 2) : 1;
          const stiffness = .27 - inertia * .23;
          const damping = Math.pow(.48 + inertia * .25, step);
          this.hoverVelocityX = (this.hoverVelocityX + (this.hoverTargetX - this.hoverX) * stiffness * step) * damping;
          this.hoverVelocityY = (this.hoverVelocityY + (this.hoverTargetY - this.hoverY) * stiffness * step) * damping;
          this.hoverX += this.hoverVelocityX * step;
          this.hoverY += this.hoverVelocityY * step;
          moving = Math.abs(this.hoverTargetX - this.hoverX) + Math.abs(this.hoverTargetY - this.hoverY)
            + Math.abs(this.hoverVelocityX) + Math.abs(this.hoverVelocityY) > .35;
          if (!moving) { this.hoverX = this.hoverTargetX; this.hoverY = this.hoverTargetY; }
        }
      }
      this.hoverLastTime = moving ? now : 0;
      const baseRadius = Math.min(this.width, this.height) * numberAttr(this, 'ui-radius', .26, .1, .55);
      let radius = baseRadius;
      let x = this.hoverX;
      let y = this.hoverY;
      if (this.burst) {
        const burst = this.burst;
        const elapsed = Math.max(0, now - burst.start);
        const maxRadius = Math.hypot(Math.max(burst.x, this.width - burst.x),
          Math.max(burst.y, this.height - burst.y)) + 28;
        if (elapsed < 600) {
          const progress = 1 - (1 - elapsed / 600) ** 3;
          radius = burst.fromRadius + (maxRadius - burst.fromRadius) * progress;
          x = burst.x;
          y = burst.y;
        } else if (elapsed < 800) {
          radius = maxRadius;
          x = burst.x;
          y = burst.y;
        } else if (elapsed < 1350) {
          const progress = ease((elapsed - 800) / 550);
          radius = maxRadius + (baseRadius - maxRadius) * progress;
          x = burst.x + ((this.hoverPointer ? this.hoverX : burst.x) - burst.x) * progress;
          y = burst.y + ((this.hoverPointer ? this.hoverY : burst.y) - burst.y) * progress;
        } else {
          this.burst = null;
          if (!this.hoverPointer) { x = burst.x; y = burst.y; }
        }
      }
      this.displayedRadius = radius;
      this.paintCircle(x, y, radius);
      this.reveal.style.opacity = '1';
      if (this.burst || moving) this.scheduleHoverPaint();
      else if (!this.hoverPointer) this.reveal.style.opacity = '0';
    });
  }

  private startWhenVisible(source: HTMLImageElement): void {
    const selector = this.getAttribute('ui-start-target')?.trim();
    let target: Element = this.closest('section') ?? this;
    if (selector) {
      try { target = this.closest(selector) ?? this; }
      catch { target = this; }
    }
    this.visibilityController = new AbortController();
    const check = (): void => {
      if (!this.isConnected || this.source !== source) return;
      const bounds = target.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const ready = bounds.height <= viewport
        ? bounds.top >= 0 && bounds.bottom <= viewport
        : bounds.bottom > 0 && bounds.bottom <= viewport;
      if (!ready) return;
      this.visibilityController?.abort();
      this.visibilityController = null;
      this.start(source);
    };
    window.addEventListener('scroll', check, { passive: true, signal: this.visibilityController.signal });
    document.addEventListener('scroll', check, { capture: true, passive: true, signal: this.visibilityController.signal });
    window.addEventListener('resize', check, { signal: this.visibilityController.signal });
    check();
  }

  private start(source: HTMLImageElement): void {
    this.canLoop = true;
    this.measure();
    this.createReveal(source);
    this.setAttribute('data-state', 'playing');
    this.startTime = performance.now();
    this.paint(0);
    this.dispatchEvent(new CustomEvent('ui-image-flashlight:start'));
    const generation = this.generation;
    const duration = numberAttr(this, 'ui-duration', 6000, 800, 15000);
    const tick = (now: number): void => {
      if (generation !== this.generation || !this.isConnected) return;
      const progress = clamp((now - this.startTime) / duration, 0, 1);
      this.paint(progress);
      if (progress < 1) this.frameId = requestAnimationFrame(tick);
      else this.complete();
    };
    this.frameId = requestAnimationFrame(tick);
  }

  private paint(progress: number): void {
    if (!this.reveal) return;
    const frame = flashlightFrame(progress, this.width, this.height,
      numberAttr(this, 'ui-radius', .26, .1, .55));
    this.paintCircle(frame.x, frame.y, frame.radius);
  }

  private paintCircle(x: number, y: number, size: number): void {
    if (!this.reveal) return;
    const radius = Math.max(1, size);
    const feather = Math.min(28, Math.max(8, radius * .12));
    const inner = Math.max(0, radius - feather);
    const mask = `radial-gradient(circle ${radius.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, #000 0px, #000 ${inner.toFixed(1)}px, transparent ${radius.toFixed(1)}px)`;
    this.reveal.style.maskImage = mask;
    this.reveal.style.webkitMaskImage = mask;
  }

  private complete(): void {
    cancelAnimationFrame(this.frameId);
    this.setAttribute('data-state', 'complete');
    this.reveal?.remove();
    this.reveal = null;
    this.dispatchEvent(new CustomEvent('ui-image-flashlight:complete'));
    this.scheduleLoop();
  }

  private scheduleLoop(): void {
    if (!this.canLoop || this.hoverEnabled || !this.hasAttribute('ui-loop') || !this.isConnected) return;
    const delay = numberAttr(this, 'ui-loop-delay', 1800, 0, 10000);
    this.loopTimer = window.setTimeout(() => this.refresh(), delay);
  }
}

define('ui-image-flashlight', UiImageFlashlight);

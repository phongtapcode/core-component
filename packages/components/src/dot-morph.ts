/** Particles travel from beyond the field into a readable word. */
import { define } from '@ui/core';

type Point = { x: number; y: number };
type Particle = Point & { startX: number; startY: number; radius: number; delay: number };
type Motion = { from: number; to: number; start: number; duration: number };
const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const ease = (value: number): number => 1 - (1 - value) ** 3;
const numberAttr = (host: HTMLElement, name: string, fallback: number, min: number, max: number): number => {
  const value = Number(host.getAttribute(name));
  return host.hasAttribute(name) && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
};
const parseWords = (value: string | null): string[] => {
  const raw = value?.trim() || '';
  if (!raw) return ['UI'];
  if (raw.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const words = parsed.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
        return words.length ? words : ['UI'];
      }
    } catch { /* Keep a plain string usable even if it begins with '['. */ }
  }
  return [raw];
};

export class UiDotMorph extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-text', 'ui-count', 'ui-duration', 'ui-interval']; }

  private abort: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private words: string[] = ['UI'];
  private wordTargets: Point[][] = [];
  private wordIndex = 0;
  private wordTimer = 0;
  private morphingWord = false;
  private width = 600;
  private height = 260;
  private progress = 0;
  private motion: Motion | null = null;
  private hovered = false;
  private focused = false;
  private touchActive = false;
  private renderFrame = 0;
  private animationFrame = 0;

  connectedCallback(): void {
    if (this.abort) return;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    this.addEventListener('pointerenter', this.onPointerEnter, options);
    this.addEventListener('pointerleave', this.onPointerLeave, options);
    this.addEventListener('pointerdown', this.onPointerDown, options);
    this.addEventListener('focusin', this.onFocusIn, options);
    this.addEventListener('focusout', this.onFocusOut, options);
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
    this.render();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
      this.resizeObserver.observe(this);
    } else window.addEventListener('resize', this.scheduleRender, options);
  }

  disconnectedCallback(): void {
    this.clearWordTimer();
    this.abort?.abort();
    this.abort = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.renderFrame) cancelAnimationFrame(this.renderFrame);
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.renderFrame = 0;
    this.animationFrame = 0;
    this.motion = null;
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ui-interval') {
      this.clearWordTimer();
      this.scheduleNextWord();
    } else if (name !== 'ui-duration') this.scheduleRender();
  }

  private readonly scheduleRender = (): void => {
    if (this.renderFrame) return;
    this.renderFrame = requestAnimationFrame(() => {
      this.renderFrame = 0;
      if (this.isConnected) this.render();
    });
  };

  private readonly onPointerEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    this.hovered = true;
    this.setActive(true);
  };
  private readonly onPointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    this.hovered = false;
    this.setActive(this.focused || this.touchActive);
  };
  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') return;
    this.touchActive = !this.touchActive;
    this.setActive(this.touchActive);
  };
  private readonly onFocusIn = (): void => {
    this.focused = true;
    this.setActive(true);
  };
  private readonly onFocusOut = (): void => {
    this.focused = false;
    this.setActive(this.hovered || this.touchActive);
  };

  private setActive(active: boolean): void {
    if (active === this.hasAttribute('ui-active')) return;
    const now = performance.now();
    this.advance(now);
    if (!active) {
      this.clearWordTimer();
      if (this.morphingWord) {
        // Leave from the current in-between shape, without snapping to either word.
        for (const particle of this.particles) {
          const position = this.positionOf(particle);
          particle.x = position.x;
          particle.y = position.y;
        }
        this.progress = 1;
      }
      if (this.progress === 1) this.scatter();
      this.morphingWord = false;
    }
    this.toggleAttribute('ui-active', active);
    if (active && this.wordIndex !== 0) {
      this.retargetWord(0, now, true);
      return;
    }
    const to = active ? 1 : 0;
    this.startMotion(to, now);
  }

  private startMotion(to: number, now: number): void {
    const duration = numberAttr(this, 'ui-duration', 900, 0, 5000);
    this.motion = { from: this.progress, to, start: now, duration: Math.max(1, duration * Math.abs(to - this.progress)) };
    if (!this.animationFrame) this.animationFrame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number): void => {
    this.animationFrame = 0;
    this.advance(now);
    this.draw();
    if (this.motion && this.isConnected) this.animationFrame = requestAnimationFrame(this.tick);
    else if (this.hasAttribute('ui-active')) {
      this.morphingWord = false;
      this.scheduleNextWord();
    } else this.resetFirstWord();
  };

  private clearWordTimer(): void {
    if (this.wordTimer) window.clearTimeout(this.wordTimer);
    this.wordTimer = 0;
  }

  private scheduleNextWord(): void {
    if (!this.isConnected || !this.hasAttribute('ui-active') || this.motion || this.wordTimer || this.words.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const interval = numberAttr(this, 'ui-interval', 1800, 100, 60000);
    this.wordTimer = window.setTimeout(() => {
      this.wordTimer = 0;
      if (this.hasAttribute('ui-active')) this.retargetWord((this.wordIndex + 1) % this.words.length, performance.now());
    }, interval);
  }

  private retargetWord(index: number, now: number, freezeCurrent = false): void {
    const targets = this.wordTargets[index];
    if (!targets) return;
    this.particles.forEach((particle, particleIndex) => {
      const start = freezeCurrent ? this.positionOf(particle) : particle;
      particle.startX = start.x;
      particle.startY = start.y;
      particle.x = targets[particleIndex]!.x;
      particle.y = targets[particleIndex]!.y;
    });
    this.wordIndex = index;
    this.progress = 0;
    this.morphingWord = true;
    this.updateFallbackWord();
    this.startMotion(1, now);
  }

  private resetFirstWord(): void {
    if (this.wordIndex === 0) return;
    const targets = this.wordTargets[0];
    if (!targets) return;
    this.particles.forEach((particle, index) => {
      particle.x = targets[index]!.x;
      particle.y = targets[index]!.y;
    });
    this.wordIndex = 0;
    this.updateFallbackWord();
  }

  private updateFallbackWord(): void {
    const fallback = this.querySelector('.ui-dot-morph-fallback');
    if (fallback) fallback.textContent = this.words[this.wordIndex] || 'UI';
  }

  private advance(now: number): void {
    if (!this.motion) return;
    const fraction = clamp((now - this.motion.start) / this.motion.duration);
    this.progress = this.motion.from + (this.motion.to - this.motion.from) * ease(fraction);
    if (fraction === 1) {
      this.progress = this.motion.to;
      this.motion = null;
    }
  }

  private positionOf(particle: Particle): Point {
    const amount = ease(clamp((this.progress - particle.delay) / (1 - particle.delay)));
    return {
      x: particle.startX + (particle.x - particle.startX) * amount,
      y: particle.startY + (particle.y - particle.startY) * amount,
    };
  }

  private randomStart(): Point {
    // A few dots stay in the field; the rest travel from beyond its edges.
    if (Math.random() < .1) return { x: this.width * Math.random(), y: this.height * Math.random() };
    const distance = .15 + Math.random() * 1.4;
    switch (Math.floor(Math.random() * 4)) {
      case 0: return { x: -this.width * distance, y: this.height * Math.random() };
      case 1: return { x: this.width * (1 + distance), y: this.height * Math.random() };
      case 2: return { x: this.width * Math.random(), y: -this.height * distance };
      default: return { x: this.width * Math.random(), y: this.height * (1 + distance) };
    }
  }

  private scatter(): void {
    for (const particle of this.particles) {
      const start = this.randomStart();
      particle.startX = start.x;
      particle.startY = start.y;
    }
  }

  private render(): void {
    this.clearWordTimer();
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this.motion = null;
    this.progress = this.hasAttribute('ui-active') ? 1 : 0;
    this.morphingWord = false;
    this.wordIndex = 0;
    this.words = parseWords(this.getAttribute('ui-text'));
    this.setAttribute('aria-label', this.words.join(', '));
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ui-dot-morph-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.append(this.canvas);
    }
    let fallback = [...this.children].find((child): child is HTMLElement => child.classList.contains('ui-dot-morph-fallback'));
    if (!fallback) {
      fallback = document.createElement('span');
      fallback.className = 'ui-dot-morph-fallback';
      fallback.setAttribute('aria-hidden', 'true');
      this.append(fallback);
    }
    fallback.textContent = this.words[0]!;

    this.width = this.clientWidth || 600;
    this.height = this.clientHeight || 260;
    try { this.context = this.canvas.getContext('2d'); } catch { this.context = null; }
    const pointSets = this.context ? this.words.map((word) => this.textPoints(word)) : [];
    const hasPoints = pointSets.length > 0 && pointSets.every((points) => points.length > 0);
    this.toggleAttribute('data-ui-dot-fallback', !hasPoints);
    if (!this.context || !hasPoints) { this.particles = []; this.wordTargets = []; return; }
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const mostPoints = Math.max(...pointSets.map((points) => points.length));
    const count = this.hasAttribute('ui-count')
      ? Math.round(numberAttr(this, 'ui-count', 320, 20, 3200))
      : Math.min(mostPoints, 3200, Math.max(450, Math.round(mostPoints * .34)));
    this.wordTargets = pointSets.map((points) => {
      const targets = Array.from({ length: count }, (_, index) =>
        points[Math.floor((index + .5) * points.length / count) % points.length]!);
      for (let index = targets.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1));
        [targets[index], targets[other]] = [targets[other]!, targets[index]!];
      }
      return targets;
    });
    this.particles = this.wordTargets[0]!.map((point, index) => ({
      ...point, startX: 0, startY: 0,
      radius: index % 23 === 0 ? 3.5 : index % 6 === 0 ? 2.5 : 2,
      delay: Math.random() * .12,
    }));
    this.scatter();
    this.draw();
    this.scheduleNextWord();
  }

  private draw(): void {
    const context = this.context;
    if (!context) return;
    context.clearRect(0, 0, this.width, this.height);
    const styles = getComputedStyle(this);
    context.fillStyle = styles.getPropertyValue('--ui-dot-color').trim() || '#fff';
    context.shadowBlur = 0;
    for (const particle of this.particles) {
      const amount = ease(clamp((this.progress - particle.delay) / (1 - particle.delay)));
      const x = particle.startX + (particle.x - particle.startX) * amount;
      const y = particle.startY + (particle.y - particle.startY) * amount;
      if (x < -4 || x > this.width + 4 || y < -4 || y > this.height + 4) continue;
      context.beginPath();
      context.arc(x, y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    // Only a small subset gets a shadow, avoiding thousands of blur operations.
    context.shadowColor = styles.getPropertyValue('--ui-dot-glow').trim() || '#ffffff8a';
    context.shadowBlur = 7;
    for (let index = 0; index < this.particles.length; index += 23) {
      const particle = this.particles[index]!;
      const amount = ease(clamp((this.progress - particle.delay) / (1 - particle.delay)));
      const x = particle.startX + (particle.x - particle.startX) * amount;
      const y = particle.startY + (particle.y - particle.startY) * amount;
      if (x < -4 || x > this.width + 4 || y < -4 || y > this.height + 4) continue;
      context.beginPath();
      context.arc(x, y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.shadowBlur = 0;
  }

  private textPoints(text: string): Point[] {
    const width = Math.min(1200, Math.max(1, Math.round(this.width)));
    const height = Math.min(500, Math.max(1, Math.round(this.height)));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let context: CanvasRenderingContext2D | null;
    try { context = canvas.getContext('2d'); } catch { return []; }
    if (!context) return [];
    const family = getComputedStyle(this).fontFamily || 'sans-serif';
    let size = Math.min(height * .62, width * .8);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#fff';
    do {
      context.font = `800 ${Math.round(size)}px ${family}`;
      if (context.measureText(text).width <= width * .84) break;
      size *= .9;
    } while (size > 12);
    context.fillText(text, width / 2, height / 2, width * .86);
    let pixels: Uint8ClampedArray;
    try { pixels = context.getImageData(0, 0, width, height).data; } catch { return []; }
    const candidates: Point[] = [];
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        if (pixels[(y * width + x) * 4 + 3]! > 100) {
          candidates.push({ x: x / width * this.width, y: y / height * this.height });
        }
      }
    }
    return candidates;
  }
}

define('ui-dot-morph', UiDotMorph);

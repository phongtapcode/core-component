import { define } from '@ui/core';

type Point = { x: number; y: number };
type Particle = Point & {
  vx: number; vy: number;
  fromX: number; fromY: number;
  toX: number; toY: number;
  seed: number; size: number; alpha: number; color: string; delay: number;
};

const STAR = 'M 50,10 L 61,40 L 95,40 L 68,60 L 79,90 L 50,70 L 21,90 L 32,60 L 5,40 L 39,40 Z';
const CIRCLE = 'M 50,10 A 40,40 0 1,1 49.9,10 Z';
const HEART = 'M 50,30 C 50,20 40,10 30,10 C 20,10 10,20 10,30 C 10,45 30,60 50,90 C 70,60 90,45 90,30 C 90,20 80,10 70,10 C 60,10 50,20 50,30 Z';
const DEFAULT_PATHS = [STAR, CIRCLE, HEART];
const DEFAULT_COLORS = ['#ffffff', '#ffeb3b'];
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const ease = (value: number): number => value * value * (3 - 2 * value);

/** Accepts the JSON array form used in markup, plus a single plain value. */
export function backgroundItems(value: string | null, fallback: string[]): string[] {
  if (value === null) return fallback;
  // Keep the legacy single-quoted array syntax without corrupting apostrophes
  // inside a valid JSON string (or an escaped single-quoted string).
  const singleQuoted = value.replace(/'((?:\\.|[^'\\])*)'/g, (_match, item: string) =>
    JSON.stringify(item.replace(/\\'/g, "'")));
  for (const candidate of [value, singleQuoted]) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
      if (typeof parsed === 'string' && parsed.trim()) return [parsed];
    } catch { /* Try the next supported form. */ }
  }
  if (value.trim()) return [value.trim()];
  return fallback;
}

function numeric(host: Element, name: string, fallback: number, min: number, max: number): number {
  const raw = host.getAttribute(name);
  const value = raw === null ? NaN : Number(raw);
  return Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

/** A decorative background whose particles morph between filled SVG paths or text. */
export class UiAnimatedBackground extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['ui-style', 'ui-texts', 'ui-svg-paths', 'ui-colors', 'ui-particle-count',
      'ui-font-size', 'ui-font-family', 'ui-max-width', 'ui-view-box', 'ui-turbulence',
      'ui-pull-strength', 'ui-flow-speed', 'ui-influence-radius', 'ui-morph-duration', 'ui-mouse-container'];
  }

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private visibilityObserver: IntersectionObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private controller: AbortController | null = null;
  private mouseController: AbortController | null = null;
  private frameId = 0;
  private resizeFrame = 0;
  private visible = false;
  private width = 0;
  private height = 0;
  private pixelRatio = 0;
  private pools: Point[][] = [];
  private particles: Particle[] = [];
  private currentIndex = 0;
  private nextIndex = 0;
  private morphStart = 0;
  private introStart = 0;
  private previousFrame = 0;
  private mouse: Point = { x: -10000, y: -10000 };

  /** Assign a new array to update the words; reflected to the existing JSON attribute. */
  get texts(): string[] { return backgroundItems(this.getAttribute('ui-texts'), []).slice(); }
  set texts(value: string[]) { this.setItems('ui-texts', value); }

  get svgPaths(): string[] { return backgroundItems(this.getAttribute('ui-svg-paths'), DEFAULT_PATHS).slice(); }
  set svgPaths(value: string[]) { this.setItems('ui-svg-paths', value); }

  get colors(): string[] { return backgroundItems(this.getAttribute('ui-colors'), DEFAULT_COLORS).slice(); }
  set colors(value: string[]) { this.setItems('ui-colors', value); }

  /** Whether the current text or paths produced at least one sampleable shape. */
  get hasShapes(): boolean { return this.pools.length > 0; }

  private setItems(attribute: string, value: string[]): void {
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      throw new TypeError(`[${this.localName || 'ui-animated-background'}] ${attribute} must be an array of strings`);
    }
    this.setAttribute(attribute, JSON.stringify(value));
  }

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ui-animated-background__canvas ui-background__canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.append(this.canvas);
    try { this.context = this.canvas.getContext('2d'); } catch { this.context = null; }
    if (!this.context) {
      this.canvas.remove();
      this.canvas = null;
      this.controller.abort();
      this.controller = null;
      return;
    }
    this.bindMouse();
    document.addEventListener('visibilitychange', this.syncAnimation, { signal: this.controller.signal });
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    this.motionQuery?.addEventListener('change', this.syncAnimation);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.resizeFrame) return;
        this.resizeFrame = requestAnimationFrame(() => {
          this.resizeFrame = 0;
          this.measure();
        });
      });
      this.resizeObserver.observe(this);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      this.visibilityObserver = new IntersectionObserver((entries) => {
        this.visible = Boolean(entries[0]?.isIntersecting);
        this.syncAnimation();
      });
      this.visibilityObserver.observe(this);
    } else this.visible = true;
    this.measure();
    this.syncAnimation();
  }

  disconnectedCallback(): void {
    this.stop();
    if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = 0;
    this.motionQuery?.removeEventListener('change', this.syncAnimation);
    this.motionQuery = null;
    this.controller?.abort();
    this.controller = null;
    this.mouseController?.abort();
    this.mouseController = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;
    this.canvas?.remove();
    this.canvas = null;
    this.context = null;
    this.particles = [];
    this.pools = [];
    this.width = 0;
    this.height = 0;
    this.pixelRatio = 0;
  }

  attributeChangedCallback(name: string, oldValue: string | null): void {
    if (!this.isConnected || !this.context) return;
    if (name === 'ui-mouse-container') this.bindMouse();
    else if (name === 'ui-colors') {
      const colors = this.colors;
      const palette = colors.length ? colors : DEFAULT_COLORS;
      this.particles.forEach((particle, index) => { particle.color = palette[index % palette.length]!; });
      if (this.motionQuery?.matches) this.paint(performance.now(), true);
    } else if (name === 'ui-morph-duration') {
      const previous = oldValue !== null && Number.isFinite(Number(oldValue)) ? clamp(Number(oldValue), .3, 30) : 3;
      const next = numeric(this, name, 3, .3, 30);
      const now = performance.now();
      if (this.morphStart <= now) this.morphStart = now - clamp((now - this.morphStart) / (previous * 1000), 0, 1) * next * 1000;
    } else if (['ui-turbulence', 'ui-pull-strength', 'ui-flow-speed', 'ui-influence-radius'].includes(name)) {
      // Physics settings are read on every frame; preserve particle positions while sliders move.
    } else this.refresh();
  }

  /** Re-measure the host and regenerate shapes after programmatic changes. */
  refresh(): void {
    if (!this.context || !this.canvas) return;
    const rect = this.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.width = rect.width;
    this.height = rect.height;
    const ratio = this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(this.width * ratio));
    this.canvas.height = Math.max(1, Math.round(this.height * ratio));
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.pools = this.sampleShapes();
    this.createParticles();
    this.setAttribute('data-state', this.hasShapes ? 'ready' : 'empty');
    this.introStart = performance.now();
    this.morphStart = this.introStart + 1500;
    this.previousFrame = 0;
    this.paint(this.introStart);
    this.syncAnimation();
  }

  private measure(): void {
    const rect = this.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    if (this.width < 1 || this.height < 1) { this.refresh(); return; }
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (Math.abs(rect.width - this.width) <= 1 && Math.abs(rect.height - this.height) <= 1 && ratio === this.pixelRatio) return;
    const scaleX = rect.width / this.width;
    const scaleY = rect.height / this.height;
    const previousCount = this.pools.length;
    this.width = rect.width;
    this.height = rect.height;
    this.pixelRatio = ratio;
    this.canvas!.width = Math.max(1, Math.round(this.width * ratio));
    this.canvas!.height = Math.max(1, Math.round(this.height * ratio));
    this.context!.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.pools = this.sampleShapes();
    this.setAttribute('data-state', this.hasShapes ? 'ready' : 'empty');
    if (this.pools.length && this.pools.length === previousCount && this.particles.length) {
      for (const particle of this.particles) {
        particle.x *= scaleX; particle.fromX *= scaleX; particle.toX *= scaleX; particle.vx *= scaleX;
        particle.y *= scaleY; particle.fromY *= scaleY; particle.toY *= scaleY; particle.vy *= scaleY;
      }
    } else {
      this.createParticles();
      this.introStart = performance.now();
      this.morphStart = this.introStart + 1500;
    }
    this.mouse.x = this.mouse.y = -10000;
    this.previousFrame = 0;
    this.paint(performance.now(), this.motionQuery?.matches ?? false);
    this.syncAnimation();
  }

  private bindMouse(): void {
    this.mouseController?.abort();
    this.mouseController = new AbortController();
    const selector = this.getAttribute('ui-mouse-container');
    let target: Element | null = null;
    if (selector) {
      try { target = this.closest(selector) ?? document.querySelector(selector); } catch { /* Invalid selector: use parent. */ }
    }
    target ??= this.parentElement;
    target ??= this;
    target.addEventListener('pointermove', this.onPointerMove as EventListener, { signal: this.mouseController.signal });
    target.addEventListener('pointerleave', this.onPointerLeave, { signal: this.mouseController.signal });
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    const rect = this.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
  };

  private readonly onPointerLeave = (): void => { this.mouse.x = -10000; this.mouse.y = -10000; };

  private sampleShapes(): Point[][] {
    const texts = this.texts;
    const shapes = texts.length ? texts : this.svgPaths;
    const sampleScale = Math.min(1, 720 / this.width, 440 / this.height);
    const w = Math.max(1, Math.round(this.width * sampleScale));
    const h = Math.max(1, Math.round(this.height * sampleScale));
    const mask = document.createElement('canvas');
    mask.width = w;
    mask.height = h;
    let ctx: CanvasRenderingContext2D | null = null;
    try { ctx = mask.getContext('2d', { willReadFrequently: true }); } catch { /* Canvas unavailable. */ }
    if (!ctx) return [];
    const count = numeric(this, 'ui-particle-count', 2000, 50, 6000);
    const limit = count * 4;
    return shapes.map((shape) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      if (texts.length) this.drawTextMask(ctx, shape, w, h);
      else this.drawPathMask(ctx, shape, w, h);
      let pixels: Uint8ClampedArray;
      try { pixels = ctx.getImageData(0, 0, w, h).data; } catch { return []; }
      const points: Point[] = [];
      let found = 0;
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        if (pixels[(y * w + x) * 4 + 3]! < 128) continue;
        const point = { x: (x + Math.random() * 2) / sampleScale, y: (y + Math.random() * 2) / sampleScale };
        found++;
        if (points.length < limit) points.push(point);
        else {
          const replacement = Math.floor(Math.random() * found);
          if (replacement < limit) points[replacement] = point;
        }
      }
      return points;
    }).filter((points) => points.length > 0);
  }

  private drawTextMask(ctx: CanvasRenderingContext2D, text: string, width: number, height: number): void {
    const desired = numeric(this, 'ui-font-size', 160, 12, 1200);
    const family = this.getAttribute('ui-font-family') || getComputedStyle(this).fontFamily || 'sans-serif';
    const maxWidth = numeric(this, 'ui-max-width', this.width, 20, this.width) * width / this.width;
    let size = Math.min(desired * width / this.width, height * .65);
    ctx.font = `800 ${size}px ${family}`;
    const measured = ctx.measureText(text).width;
    if (measured > maxWidth - 20) size *= Math.max(.05, (maxWidth - 20) / measured);
    ctx.font = `800 ${size}px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }

  private drawPathMask(ctx: CanvasRenderingContext2D, data: string, width: number, height: number): void {
    if (typeof Path2D === 'undefined') return;
    const values = (this.getAttribute('ui-view-box') || '0 0 100 100').trim().split(/[\s,]+/).map(Number);
    const [x, y, viewWidth, viewHeight] = values;
    if (![x, y, viewWidth, viewHeight].every(Number.isFinite) || viewWidth! <= 0 || viewHeight! <= 0) return;
    const scale = Math.min(width * .62 / viewWidth!, height * .72 / viewHeight!);
    const offsetX = (width - viewWidth! * scale) / 2 - x! * scale;
    const offsetY = (height - viewHeight! * scale) / 2 - y! * scale;
    try {
      ctx.save();
      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
      ctx.fill(new Path2D(data));
      ctx.restore();
    } catch { ctx.restore(); }
  }

  private createParticles(): void {
    this.particles = [];
    if (!this.pools.length) return;
    this.currentIndex = 0;
    this.nextIndex = this.pools.length > 1 ? 1 : 0;
    const first = this.pools[0]!;
    const next = this.pools[this.nextIndex]!;
    const colors = this.colors;
    const palette = colors.length ? colors : DEFAULT_COLORS;
    const count = numeric(this, 'ui-particle-count', 2000, 50, 6000);
    for (let index = 0; index < count; index++) {
      const from = first[Math.floor(Math.random() * first.length)]!;
      const to = next[Math.floor(Math.random() * next.length)]!;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.max(this.width, this.height) * (.2 + Math.random() * .5);
      this.particles.push({
        x: from.x + Math.cos(angle) * distance,
        y: from.y + Math.sin(angle) * distance,
        vx: 0, vy: 0, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y,
        seed: Math.random() * 100, size: .7 + Math.random() * 1.3,
        alpha: .45 + Math.random() * .5, color: palette[index % palette.length]!, delay: Math.random() * .18,
      });
    }
  }

  private readonly syncAnimation = (): void => {
    if (!this.context || !this.particles.length || !this.visible || document.hidden || this.getAttribute('ui-style') !== null && this.getAttribute('ui-style') !== 'particle-morph') {
      this.stop();
      return;
    }
    if (this.motionQuery?.matches) {
      this.stop();
      this.paint(performance.now(), true);
      this.previousFrame = 0;
      return;
    }
    if (!this.frameId) this.frameId = requestAnimationFrame(this.tick);
  };

  private stop(): void {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.previousFrame = 0;
  }

  private readonly tick = (time: number): void => {
    this.frameId = 0;
    if (!this.visible || document.hidden) return;
    this.paint(time);
    this.frameId = requestAnimationFrame(this.tick);
  };

  private paint(time: number, staticFrame = false): void {
    const ctx = this.context;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.particles.length) return;
    const duration = numeric(this, 'ui-morph-duration', 3, .3, 30) * 1000;
    if (!staticFrame && this.pools.length > 1 && time >= this.morphStart + duration) {
      this.currentIndex = this.nextIndex;
      this.nextIndex = (this.currentIndex + 1) % this.pools.length;
      const next = this.pools[this.nextIndex]!;
      for (const particle of this.particles) {
        particle.fromX = particle.toX;
        particle.fromY = particle.toY;
        const point = next[Math.floor(Math.random() * next.length)]!;
        particle.toX = point.x;
        particle.toY = point.y;
      }
      this.morphStart = time;
    }
    const morph = this.pools.length > 1 && time >= this.morphStart
      ? clamp((time - this.morphStart) / duration, 0, 1) : 0;
    const intro = staticFrame ? 1 : .25 + .75 * ease(clamp((time - this.introStart) / 1500, 0, 1));
    const dt = this.previousFrame ? clamp((time - this.previousFrame) / 16.67, .25, 2) : 1;
    this.previousFrame = time;
    const radius = numeric(this, 'ui-influence-radius', 200, 0, 800);
    const pull = numeric(this, 'ui-pull-strength', .5, 0, 2);
    const turbulence = numeric(this, 'ui-turbulence', 1, 0, 2);
    const flow = numeric(this, 'ui-flow-speed', .5, 0, 3);
    for (const particle of this.particles) {
      const local = ease(clamp((morph - particle.delay) / (1 - particle.delay), 0, 1));
      const targetX = particle.fromX + (particle.toX - particle.fromX) * local;
      const targetY = particle.fromY + (particle.toY - particle.fromY) * local;
      if (staticFrame) { particle.x = targetX; particle.y = targetY; }
      else {
        const drift = time * .00045 * flow + particle.seed;
        const idleX = Math.sin(drift) * turbulence * 1.6;
        const idleY = Math.cos(drift * .83) * turbulence * 1.6;
        particle.vx += (targetX + idleX - particle.x) * (.03 + pull * .055) * dt;
        particle.vy += (targetY + idleY - particle.y) * (.03 + pull * .055) * dt;
        const dx = particle.x - this.mouse.x;
        const dy = particle.y - this.mouse.y;
        const distance = Math.hypot(dx, dy);
        if (distance < radius && distance > 1) {
          const influence = (1 - distance / radius) ** 2 * dt;
          particle.vx += (-dy / distance * (1.5 + turbulence) + dx / distance * pull) * influence;
          particle.vy += (dx / distance * (1.5 + turbulence) + dy / distance * pull) * influence;
        }
        const friction = Math.pow(.83, dt);
        particle.vx *= friction;
        particle.vy *= friction;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
      }
      ctx.globalAlpha = particle.alpha * intro * (.78 + Math.sin(time * .002 + particle.seed) * .22);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** Legacy alias retained for existing markup and JavaScript imports. */
export class UiBackground extends UiAnimatedBackground {}

define('ui-animated-background', UiAnimatedBackground);
define('ui-background', UiBackground);

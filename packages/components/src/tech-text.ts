import { define } from '@ui/core';

type Reveal = 'letter' | 'area' | 'off';
type Glyph = {
  char: string;
  x: number;
  left: number;
  top: number;
  width: number;
  height: number;
  outline: HTMLCanvasElement | null;
  amount: number;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
};

const numberAttr = (element: Element, name: string, fallback: number, min: number, max: number): number => {
  const raw = element.getAttribute(name);
  const value = raw === null ? fallback : Number(raw);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
};
const enabled = (element: Element, name: string, fallback: boolean): boolean => {
  const value = element.getAttribute(name);
  return value === null ? fallback : value !== 'false';
};
const approach = (current: number, target: number, dt: number, seconds: number): number =>
  current + (target - current) * (1 - Math.exp(-dt / seconds));

/** Canvas wordmark with pointer-revealed vector outlines and draggable letters. */
export class UiTechText extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['ui-text', 'ui-font-family', 'ui-size', 'ui-weight', 'ui-letter-spacing', 'ui-align', 'ui-reveal',
      'ui-reach', 'ui-softness', 'ui-dash-length', 'ui-dash-gap', 'ui-stroke-width',
      'ui-line-style', 'ui-specks', 'ui-selection', 'ui-labels', 'ui-draggable', 'ui-sweep', 'ui-speed',
      'ui-bounce', 'ui-click-kick', 'ui-guides', 'ui-intro', 'ui-intro-duration'];
  }

  private controller: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private source: HTMLSpanElement | null = null;
  private status: HTMLSpanElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private authoredText = '';
  private glyphs: Glyph[] = [];
  private letterIndexes: number[] = [];
  private font = '';
  private baseline = 0;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private pointer = { x: 0, y: 0, inside: false };
  private keyboardIndex = -1;
  private dragIndex = -1;
  private dragPointer = -1;
  private dragStart = { x: 0, y: 0 };
  private pressStart = { x: 0, y: 0 };
  private activeIndex = -1;
  private frame = 0;
  private lastTime = 0;
  private sweepTime = 0;
  private introTime = 0;
  private visible = true;
  private frameBox: { x: number; y: number; width: number; height: number } | null = null;

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    if (!this.source) {
      this.authoredText = this.textContent?.trim() || 'UI Core';
      this.source = document.createElement('span');
      this.source.className = 'ui-tech-text__source';
      this.status = document.createElement('span');
      this.status.className = 'ui-tech-text__status';
      this.status.setAttribute('role', 'status');
      this.status.setAttribute('aria-live', 'polite');
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ui-tech-text__canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.replaceChildren(this.source, this.status, this.canvas);
    }
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.ctx = this.canvas!.getContext('2d');
    this.refresh();
    this.addEventListener('pointerenter', this.onPointerMove, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerleave', this.onPointerLeave, { signal });
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.addEventListener('pointerup', this.onPointerUp, { signal });
    this.addEventListener('pointercancel', this.onPointerUp, { signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    this.addEventListener('blur', this.onBlur, { signal });
    document.addEventListener('visibilitychange', this.onVisibilityChange, { signal });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.refresh());
      this.resizeObserver.observe(this);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(([entry]) => {
        this.visible = Boolean(entry?.isIntersecting);
        if (this.visible) this.wake();
        else this.stop();
      });
      this.intersectionObserver.observe(this);
    }
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    this.motionQuery?.addEventListener('change', this.onMotionChange, { signal });
    const generation = this.controller;
    document.fonts?.ready?.then(() => { if (this.controller === generation) this.refresh(); });
  }

  disconnectedCallback(): void {
    this.controller?.abort();
    this.controller = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.motionQuery?.removeEventListener('change', this.onMotionChange);
    this.motionQuery = null;
    this.removeEventListener('pointerenter', this.onPointerMove);
    this.removeEventListener('pointermove', this.onPointerMove);
    this.removeEventListener('pointerleave', this.onPointerLeave);
    this.removeEventListener('pointerdown', this.onPointerDown);
    this.removeEventListener('pointerup', this.onPointerUp);
    this.removeEventListener('pointercancel', this.onPointerUp);
    this.removeEventListener('keydown', this.onKeyDown);
    this.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.stop();
    this.dragIndex = -1;
    this.pointer.inside = false;
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ui-intro' || name === 'ui-intro-duration') this.introTime = 0;
    if (['ui-text', 'ui-font-family', 'ui-size', 'ui-weight', 'ui-letter-spacing', 'ui-align', 'ui-dash-length',
      'ui-dash-gap', 'ui-stroke-width', 'ui-line-style'].includes(name)) {
      this.refresh();
    } else this.wake();
  }

  /** Recalculate text metrics after changing its font or container. */
  refresh(): void {
    if (!this.source || !this.canvas) return;
    this.source.textContent = this.getAttribute('ui-text') ?? this.authoredText;
    const rect = this.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    if (!this.ctx) {
      this.removeAttribute('data-ready');
      return;
    }
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.buildGlyphs();
    this.setAttribute('data-ready', '');
    this.wake();
  }

  /** Restart the idle sweep and return all letters to the baseline. */
  replay(): void {
    this.sweepTime = 0;
    this.introTime = 0;
    this.keyboardIndex = -1;
    this.frameBox = null;
    for (const glyph of this.glyphs) {
      glyph.amount = 0;
      glyph.targetX = glyph.targetY = 0;
      glyph.dx = glyph.dy = glyph.vx = glyph.vy = 0;
    }
    this.wake();
  }

  private get reducedMotion(): boolean { return this.motionQuery?.matches ?? false; }
  private get introMode(): 'none' | 'type' | 'assemble' | 'metrics' {
    const value = this.getAttribute('ui-intro');
    return value === 'type' || value === 'assemble' || value === 'metrics' ? value : 'none';
  }
  private get reveal(): Reveal {
    const value = this.getAttribute('ui-reveal');
    return value === 'area' || value === 'off' ? value : 'letter';
  }

  private buildGlyphs(): void {
    const ctx = this.ctx!;
    const text = this.source?.textContent ?? '';
    const chars = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((part) => part.segment)
      : Array.from(text);
    const style = getComputedStyle(this);
    const family = this.getAttribute('ui-font-family') || style.fontFamily || 'sans-serif';
    const weight = numberAttr(this, 'ui-weight', 600, 100, 900);
    const maxSize = numberAttr(this, 'ui-size', 150, 12, 600);
    const spacing = numberAttr(this, 'ui-letter-spacing', -.05, -.2, .3);
    const available = this.width * .9;
    const measure = (size: number): number => {
      ctx.font = `${weight} ${size}px ${family}`;
      return chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0)
        + Math.max(0, chars.length - 1) * spacing * size;
    };
    const maxWidth = measure(maxSize);
    const size = Math.max(10, Math.min(maxSize, maxSize * available / Math.max(1, maxWidth), this.height * .57));
    this.font = `${weight} ${size}px ${family}`;
    ctx.font = this.font;
    const widths = chars.map((char) => ctx.measureText(char).width);
    const tracking = spacing * size;
    const totalWidth = widths.reduce((sum, value) => sum + value, 0) + Math.max(0, chars.length - 1) * tracking;
    const align = this.getAttribute('ui-align');
    let x = align === 'left' ? this.width * .05 : align === 'right' ? this.width * .95 - totalWidth : (this.width - totalWidth) / 2;
    this.baseline = this.height / 2 + size * .34;
    const ink = style.getPropertyValue('--ui-tech-text-color').trim() || style.color;
    const lineWidth = numberAttr(this, 'ui-stroke-width', 1.5, .5, 8);
    const dash = numberAttr(this, 'ui-dash-length', 4, 1, 30);
    const gap = numberAttr(this, 'ui-dash-gap', 2, 1, 30);
    const solid = this.getAttribute('ui-line-style') === 'solid';
    this.glyphs = chars.map((char, index) => {
      const metrics = ctx.measureText(char);
      const boxLeft = Number.isFinite(metrics.actualBoundingBoxLeft) ? metrics.actualBoundingBoxLeft : 0;
      const boxRight = Number.isFinite(metrics.actualBoundingBoxRight) ? metrics.actualBoundingBoxRight : widths[index]!;
      const boxAscent = Number.isFinite(metrics.actualBoundingBoxAscent) ? metrics.actualBoundingBoxAscent : size * .75;
      const boxDescent = Number.isFinite(metrics.actualBoundingBoxDescent) ? metrics.actualBoundingBoxDescent : size * .2;
      const left = x - boxLeft;
      const top = this.baseline - boxAscent;
      const width = Math.max(1, boxLeft + boxRight);
      const height = Math.max(1, boxAscent + boxDescent);
      const glyph: Glyph = { char, x, left, top, width, height, outline: null,
        amount: 0, dx: 0, dy: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 };
      if (char.trim()) glyph.outline = this.makeOutline(glyph, ink, lineWidth, dash, gap, solid);
      x += widths[index]! + tracking;
      return glyph;
    });
    this.letterIndexes = this.glyphs.map((glyph, index) => glyph.char.trim() ? index : -1).filter((index) => index >= 0);
    this.frameBox = null;
    this.activeIndex = -1;
    this.introTime = 0;
  }

  private makeOutline(glyph: Glyph, ink: string, stroke: number, dash: number, gap: number, solid: boolean): HTMLCanvasElement | null {
    const pad = Math.ceil(stroke * 3 + 4);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil((glyph.width + pad * 2) * this.dpr));
    canvas.height = Math.max(1, Math.ceil((glyph.height + pad * 2) * this.dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, (-glyph.left + pad) * this.dpr, (-glyph.top + pad) * this.dpr);
    ctx.font = this.font;
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = stroke * 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    if (!solid) ctx.setLineDash([dash, gap]);
    ctx.strokeText(glyph.char, glyph.x, this.baseline);
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillText(glyph.char, glyph.x, this.baseline);
    return canvas;
  }

  private indexAt(x: number, y: number): number {
    let nearest = -1;
    let distance = Infinity;
    this.glyphs.forEach((glyph, index) => {
      if (!glyph.char.trim()) return;
      const gx = glyph.left + glyph.dx;
      const gy = glyph.top + glyph.dy;
      const dx = Math.max(gx - x, 0, x - gx - glyph.width);
      const dy = Math.max(gy - y, 0, y - gy - glyph.height);
      const value = Math.hypot(dx, dy);
      if (value < distance) { distance = value; nearest = index; }
    });
    return distance <= 28 ? nearest : -1;
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    this.keyboardIndex = -1;
    if (this.status) this.status.textContent = '';
    const rect = this.getBoundingClientRect();
    this.pointer.x = event.clientX - rect.left;
    this.pointer.y = event.clientY - rect.top;
    this.pointer.inside = true;
    if (this.dragIndex >= 0 && event.pointerId === this.dragPointer) {
      const glyph = this.glyphs[this.dragIndex]!;
      glyph.targetX = this.pointer.x - this.dragStart.x;
      glyph.targetY = this.pointer.y - this.dragStart.y;
    }
    this.wake();
  };
  private readonly onPointerLeave = (): void => { if (this.dragIndex < 0) this.pointer.inside = false; this.wake(); };
  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!enabled(this, 'ui-draggable', true) || (event.pointerType === 'mouse' && event.button !== 0)) return;
    this.onPointerMove(event);
    const index = this.indexAt(this.pointer.x, this.pointer.y);
    if (index < 0) return;
    this.dragIndex = index;
    this.dragPointer = event.pointerId;
    this.pressStart = { x: this.pointer.x, y: this.pointer.y };
    this.dragStart = { x: this.pointer.x - this.glyphs[index]!.dx, y: this.pointer.y - this.glyphs[index]!.dy };
    this.setPointerCapture?.(event.pointerId);
    this.wake();
  };
  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.dragPointer) return;
    const index = this.dragIndex;
    this.dragIndex = -1;
    this.dragPointer = -1;
    if (this.hasPointerCapture?.(event.pointerId)) this.releasePointerCapture(event.pointerId);
    const rect = this.getBoundingClientRect();
    this.pointer.inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (index >= 0) {
      const glyph = this.glyphs[index]!;
      const clickDistance = Math.hypot(this.pointer.x - this.pressStart.x, this.pointer.y - this.pressStart.y);
      if (clickDistance < 6 && enabled(this, 'ui-click-kick', true) && !this.reducedMotion) {
        glyph.vx += (glyph.x + glyph.width / 2 - this.width / 2) * 1.2;
        glyph.vy -= 360;
      }
      this.dispatchEvent(new CustomEvent('ui:tech-text:release', { detail: { index, char: glyph.char, x: glyph.dx, y: glyph.dy } }));
    }
    this.wake();
  };
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
    event.preventDefault();
    const valid = this.letterIndexes;
    if (!valid.length) return;
    if (event.key === 'Escape') this.keyboardIndex = -1;
    else if (event.key === 'Home') this.keyboardIndex = valid[0]!;
    else if (event.key === 'End') this.keyboardIndex = valid.at(-1)!;
    else {
      const position = valid.indexOf(this.keyboardIndex);
      this.keyboardIndex = valid[Math.max(0, Math.min(valid.length - 1, position + (event.key === 'ArrowRight' ? 1 : -1)))]!;
    }
    if (this.keyboardIndex >= 0) {
      const glyph = this.glyphs[this.keyboardIndex]!;
      if (this.status) this.status.textContent = `Letter ${glyph.char}, ${this.keyboardIndex + 1} of ${this.glyphs.length}`;
      this.dispatchEvent(new CustomEvent('ui:tech-text:select', { detail: { index: this.keyboardIndex, char: glyph.char } }));
    } else if (this.status) this.status.textContent = '';
    this.wake();
  };
  private readonly onBlur = (): void => { this.keyboardIndex = -1; if (this.status) this.status.textContent = ''; this.wake(); };
  private readonly onVisibilityChange = (): void => { if (document.hidden) this.stop(); else this.wake(); };
  private readonly onMotionChange = (): void => this.wake();

  private stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lastTime = 0;
  }
  private wake(): void {
    if (this.frame || !this.ctx || !this.isConnected || !this.visible || document.hidden) return;
    this.frame = requestAnimationFrame(this.paint);
  }

  private readonly paint = (now: number): void => {
    this.frame = 0;
    const dt = this.lastTime ? Math.min(.05, (now - this.lastTime) / 1000) : 1 / 60;
    this.lastTime = now;
    const reduced = this.reducedMotion;
    const intro = this.introMode;
    const introDuration = numberAttr(this, 'ui-intro-duration', 2, .2, 10);
    if (!reduced && intro !== 'none') this.introTime = Math.min(introDuration, this.introTime + dt);
    const introducing = !reduced && intro !== 'none' && this.introTime < introDuration;
    const sweep = enabled(this, 'ui-sweep', true) && this.letterIndexes.length > 0
      && !reduced && !introducing && !this.pointer.inside && this.keyboardIndex < 0
      && (this.reveal !== 'off' || enabled(this, 'ui-selection', true));
    if (sweep) this.sweepTime += dt * numberAttr(this, 'ui-speed', 1, .1, 5);
    const sweepIndex = sweep && this.letterIndexes.length
      ? this.letterIndexes[Math.floor(this.sweepTime / .8) % this.letterIndexes.length]! : -1;
    const selected = this.dragIndex >= 0 ? this.dragIndex : this.keyboardIndex >= 0
      ? this.keyboardIndex : this.pointer.inside ? this.indexAt(this.pointer.x, this.pointer.y) : sweepIndex;
    this.activeIndex = selected;
    const reveal = this.reveal;
    let moving = false;
    for (const [index, glyph] of this.glyphs.entries()) {
      let target = 0;
      if (reveal === 'letter') target = index === selected ? 1 : 0;
      else if (reveal === 'area' && (this.pointer.inside || selected >= 0)) {
        const reach = numberAttr(this, 'ui-reach', 200, 20, 600);
        const usePointer = this.pointer.inside && this.keyboardIndex < 0;
        const cx = usePointer ? this.pointer.x : (this.glyphs[selected]?.x ?? 0);
        const cy = usePointer ? this.pointer.y : this.baseline;
        const distance = Math.hypot(glyph.left + glyph.width / 2 - cx, glyph.top + glyph.height / 2 - cy);
        const softness = numberAttr(this, 'ui-softness', .7, 0, 1);
        target = Math.max(0, Math.min(1, (reach - distance) / Math.max(1, reach * softness)));
      }
      glyph.amount = reduced ? target : approach(glyph.amount, target, dt, .13);
      if (Math.abs(glyph.amount - target) > .005) moving = true;
      if (index !== this.dragIndex) glyph.targetX = glyph.targetY = 0;
      if (reduced) { glyph.dx = glyph.targetX; glyph.dy = glyph.targetY; }
      else {
        const damping = 12 - numberAttr(this, 'ui-bounce', .4, 0, 1) * 8;
        glyph.vx = (glyph.vx + (glyph.targetX - glyph.dx) * 180 * dt) * Math.exp(-damping * dt);
        glyph.vy = (glyph.vy + (glyph.targetY - glyph.dy) * 180 * dt) * Math.exp(-damping * dt);
        glyph.dx += glyph.vx * dt;
        glyph.dy += glyph.vy * dt;
      }
      if (Math.abs(glyph.dx - glyph.targetX) + Math.abs(glyph.dy - glyph.targetY) + Math.abs(glyph.vx) + Math.abs(glyph.vy) > .05) moving = true;
    }
    this.draw(now);
    if (sweep || introducing || moving || this.pointer.inside || this.dragIndex >= 0) this.wake();
    else this.lastTime = 0;
  };

  private draw(now: number): void {
    const ctx = this.ctx!;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const style = getComputedStyle(this);
    const ink = style.getPropertyValue('--ui-tech-text-color').trim() || style.color;
    const accent = style.getPropertyValue('--ui-tech-text-accent').trim() || ink;
    if (enabled(this, 'ui-guides', false) || this.introMode === 'metrics' && this.introTime < numberAttr(this, 'ui-intro-duration', 2, .2, 10))
      this.drawGuides(ctx, accent);
    ctx.font = this.font;
    ctx.textBaseline = 'alphabetic';
    for (const [index, glyph] of this.glyphs.entries()) {
      if (!glyph.char.trim()) continue;
      const entering = this.introState(index);
      ctx.globalAlpha = (1 - glyph.amount) * entering.alpha;
      ctx.fillStyle = ink;
      ctx.fillText(glyph.char, glyph.x + glyph.dx + entering.x, this.baseline + glyph.dy + entering.y);
      if (glyph.outline && glyph.amount > .001) {
        ctx.globalAlpha = glyph.amount * entering.alpha;
        const pad = Math.ceil(numberAttr(this, 'ui-stroke-width', 1.5, .5, 8) * 3 + 4);
        ctx.drawImage(glyph.outline, glyph.left + glyph.dx + entering.x - pad, glyph.top + glyph.dy + entering.y - pad,
          glyph.outline.width / this.dpr, glyph.outline.height / this.dpr);
      }
    }
    ctx.globalAlpha = 1;
    if (enabled(this, 'ui-selection', true) && this.activeIndex >= 0) this.drawFrame(ctx, accent, now);
    else this.frameBox = null;
  }

  private introState(index: number): { alpha: number; x: number; y: number } {
    const mode = this.introMode;
    if (mode === 'none' || this.reducedMotion) return { alpha: 1, x: 0, y: 0 };
    const duration = numberAttr(this, 'ui-intro-duration', 2, .2, 10);
    const stagger = index / Math.max(1, this.glyphs.length) * duration * .72;
    const progress = Math.max(0, Math.min(1, (this.introTime - stagger) / (duration * .28)));
    const eased = progress * progress * (3 - 2 * progress);
    if (mode === 'assemble') return { alpha: eased, x: (1 - eased) * (index % 2 ? 48 : -48), y: (1 - eased) * (index % 3 ? 35 : -35) };
    return { alpha: eased, x: 0, y: mode === 'type' ? (1 - eased) * 12 : 0 };
  }

  private drawGuides(ctx: CanvasRenderingContext2D, color: string): void {
    if (!this.glyphs.length) return;
    const left = Math.min(...this.glyphs.map((glyph) => glyph.left)) - 15;
    const right = Math.max(...this.glyphs.map((glyph) => glyph.left + glyph.width)) + 15;
    const top = Math.min(...this.glyphs.filter((glyph) => glyph.char.trim()).map((glyph) => glyph.top));
    if (!Number.isFinite(top)) return;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = .2;
    ctx.setLineDash([3, 5]);
    for (const y of [top, this.baseline]) {
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = .55;
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('cap height', left, top - 7);
    ctx.fillText('baseline', left, this.baseline + 13);
    ctx.globalAlpha = 1;
  }

  private drawFrame(ctx: CanvasRenderingContext2D, color: string, now: number): void {
    const glyph = this.glyphs[this.activeIndex];
    if (!glyph || !glyph.char.trim()) return;
    const target = { x: glyph.left + glyph.dx - 5, y: glyph.top + glyph.dy - 5,
      width: glyph.width + 10, height: glyph.height + 10 };
    if (!this.frameBox || this.reducedMotion) this.frameBox = target;
    else for (const key of ['x', 'y', 'width', 'height'] as const)
      this.frameBox[key] = approach(this.frameBox[key], target[key], 1 / 60, .1);
    const { x, y, width, height } = this.frameBox;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = .65;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    ctx.globalAlpha = .85;
    for (const px of [x, x + width]) for (const py of [y, y + height]) ctx.fillRect(px - 2, py - 2, 4, 4);
    if (enabled(this, 'ui-labels', true)) {
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${glyph.char} · ${Math.round(glyph.width)} × ${Math.round(glyph.height)}`, x, y - 7);
    }
    const specks = numberAttr(this, 'ui-specks', 15, 0, 60);
    if (!this.reducedMotion) for (let i = 0; i < specks; i++) {
      const seed = i * 73.31 + this.activeIndex * 17.1;
      if (Math.sin(now * .005 + seed) < .05) continue;
      const side = i % 4;
      const fraction = ((Math.sin(seed * 2.4) + 1) * .5);
      const px = side < 2 ? x + fraction * width : side === 2 ? x - 12 : x + width + 12;
      const py = side < 2 ? (side === 0 ? y - 12 : y + height + 12) : y + fraction * height;
      ctx.globalAlpha = .18 + .35 * (Math.sin(now * .004 + seed) + 1) / 2;
      ctx.fillRect(px, py, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
    }
    ctx.globalAlpha = 1;
  }
}

define('ui-tech-text', UiTechText);

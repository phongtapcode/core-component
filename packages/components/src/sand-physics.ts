import { define } from '@ui/core';
import { SandCell, SandPhysicsEngine, type SandGravity, type SandMaterial, type SandPreset } from './sand-physics-engine.js';

type SandTool = SandMaterial | 'wall' | 'eraser' | 'brush' | 'attract' | 'explode';
const materials = new Set<SandTool>(['sand','water','stone','fire','smoke','lava','wood','wall','eraser','brush','attract','explode']);
const gravities = new Set<SandGravity>(['down','up','left','right']);
const presets = new Set<SandPreset>(['none','funnel','hourglass','maze','chute']);
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const numeric = (host: Element, name: string, fallback: number, min: number, max: number): number => {
  const value = Number(host.getAttribute(name));
  return host.hasAttribute(name) && Number.isFinite(value) ? clamp(value, min, max) : fallback;
};
const defaults: Record<number, [number, number, number]> = {
  [SandCell.Sand]: [236, 190, 119], [SandCell.Water]: [62, 166, 239],
  [SandCell.Stone]: [157, 158, 173], [SandCell.Fire]: [255, 113, 48],
  [SandCell.Smoke]: [153, 158, 185], [SandCell.Lava]: [250, 87, 45],
  [SandCell.Wood]: [140, 98, 71], [SandCell.Wall]: [185, 207, 224],
};

export class UiSandPhysics extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['ui-cell-size','ui-speed','ui-gravity','ui-gravity-strength','ui-tool','ui-color','ui-brush-size','ui-amount','ui-auto-rate','ui-initial-count','ui-preset','ui-background'];
  }

  private controller: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private image: ImageData | null = null;
  private engine: SandPhysicsEngine | null = null;
  private frame = 0;
  private lastTime = 0;
  private accumulator = 0;
  private spawnAccumulator = 0;
  private activePointer = -1;
  private pointerX = 0;
  private pointerY = 0;
  private lastX = 0;
  private lastY = 0;
  private visible = true;
  private paused = false;
  private palette: Array<[number,number,number]> = [[238,189,119],[244,153,106],[198,169,226],[117,205,212]];
  private paletteIndex = 0;
  private width = 0;
  private height = 0;

  get particleCount(): number { return this.engine?.particleCount ?? 0; }
  get isPaused(): boolean { return this.paused; }
  get simulation(): SandPhysicsEngine | null { return this.engine; }

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ui-sand-physics__canvas';
      this.canvas.setAttribute('aria-hidden','true');
      this.prepend(this.canvas);
    }
    try { this.context = this.canvas.getContext('2d', { alpha: true }); } catch { this.context = null; }
    this.toggleAttribute('data-ui-sand-fallback', !this.context);
    this.style.touchAction = 'none';
    if (!this.hasAttribute('role')) this.setAttribute('role', 'application');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Interactive sand physics sandbox');
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerup', this.onPointerUp, { signal });
    this.addEventListener('pointercancel', this.onPointerUp, { signal });
    this.addEventListener('lostpointercapture', this.onPointerUp, { signal });
    document.addEventListener('visibilitychange', this.onVisibilityChange, { signal });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this);
    } else window.addEventListener('resize', this.resize, { signal });
    if (typeof IntersectionObserver !== 'undefined') {
      this.visible = false;
      this.intersectionObserver = new IntersectionObserver((entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        if (this.visible) this.start(); else this.stop();
      }, { rootMargin: '120px' });
      this.intersectionObserver.observe(this);
    }
    this.resize();
    this.start();
  }

  disconnectedCallback(): void {
    this.controller?.abort(); this.controller = null;
    this.resizeObserver?.disconnect(); this.resizeObserver = null;
    this.intersectionObserver?.disconnect(); this.intersectionObserver = null;
    this.stop();
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ui-cell-size') this.resize();
    else if (name === 'ui-gravity' || name === 'ui-gravity-strength') this.updateGravity();
    else if (name === 'ui-preset') {
      const preset = this.getAttribute('ui-preset') as SandPreset;
      if (this.engine && presets.has(preset)) { this.engine.setPreset(preset); this.render(); this.notify(); }
    } else if (name === 'ui-color') this.registerColor();
  }

  pause(): void { this.paused = true; this.setAttribute('ui-paused',''); this.stop(); this.notify(); }
  resume(): void { this.paused = false; this.removeAttribute('ui-paused'); this.start(); this.notify(); }
  togglePause(): void { if (this.paused) this.resume(); else this.pause(); }
  clear(): void { this.engine?.checkpoint(); this.engine?.clear(); this.render(); this.notify(); }
  reset(): void {
    if (!this.engine) return;
    const preset = this.getAttribute('ui-preset') as SandPreset;
    this.engine.setPreset(presets.has(preset) ? preset : 'none');
    this.render(); this.notify();
  }
  undo(): boolean { const changed = this.engine?.undo() ?? false; if (changed) { this.render(); this.notify(); } return changed; }
  setPreset(name: SandPreset): void { if (presets.has(name)) this.setAttribute('ui-preset', name); }
  saveImage(): string {
    this.render();
    if (!this.canvas) return '';
    const output = document.createElement('canvas');
    output.width = Math.max(1, this.clientWidth || this.canvas.width);
    output.height = Math.max(1, this.clientHeight || this.canvas.height);
    const context = output.getContext('2d');
    if (!context) return this.canvas.toDataURL('image/png');
    const background = this.getAttribute('ui-background');
    if (background !== 'transparent') {
      context.fillStyle = background === 'light' ? '#edf2f5' : '#09111e';
      context.fillRect(0,0,output.width,output.height);
    }
    context.imageSmoothingEnabled = false;
    context.drawImage(this.canvas,0,0,output.width,output.height);
    return output.toDataURL('image/png');
  }

  private get tool(): SandTool {
    const value = this.getAttribute('ui-tool') as SandTool;
    return materials.has(value) ? value : 'sand';
  }
  private get brushSize(): number { return numeric(this, 'ui-brush-size', 5, 1, 35); }
  private get amount(): number { return numeric(this, 'ui-amount', .68, .05, 1); }

  private resize = (): void => {
    if (!this.canvas || !this.context) return;
    const width = Math.max(1, this.clientWidth || 800);
    const height = Math.max(1, this.clientHeight || 480);
    const requested = numeric(this, 'ui-cell-size', 4, 2, 12);
    const cellSize = Math.max(requested, Math.sqrt(width * height / 130_000));
    const columns = Math.max(1, Math.round(width / cellSize));
    const rows = Math.max(1, Math.round(height / cellSize));
    if (this.width === columns && this.height === rows) return;
    const previous = this.engine;
    this.width = columns; this.height = rows;
    this.canvas.width = columns; this.canvas.height = rows;
    this.image = this.context.createImageData(columns, rows);
    this.engine = new SandPhysicsEngine(columns, rows);
    this.updateGravity();
    if (previous) {
      for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        const px = Math.floor(x * previous.width / columns);
        const py = Math.floor(y * previous.height / rows);
        const material = previous.at(px, py);
        if (material !== SandCell.Empty) this.engine.set(x, y, material, previous.tones[py * previous.width + px]);
      }
    } else {
      const preset = this.getAttribute('ui-preset') as SandPreset;
      if (presets.has(preset)) this.engine.setPreset(preset);
      this.registerColor();
      const initial = numeric(this, 'ui-initial-count', 0, 0, 20_000);
      let created = 0;
      for (let tries = 0; tries < initial * 8 && created < initial; tries++) {
        const x = Math.floor(columns * (.26 + Math.random() * .48));
        const y = Math.floor(rows * (.04 + Math.random() * .40));
        if (this.engine.at(x,y) !== SandCell.Empty) continue;
        const layer = Math.min(3, Math.floor(y / Math.max(1,rows * .11)));
        this.engine.set(x,y,SandCell.Sand,layer * 16 + Math.floor(Math.random() * 12));
        created++;
      }
    }
    this.render(); this.notify();
  };

  private updateGravity(): void {
    if (!this.engine) return;
    const direction = this.getAttribute('ui-gravity') as SandGravity;
    this.engine.gravity = gravities.has(direction) ? direction : 'down';
    this.engine.gravityStrength = numeric(this, 'ui-gravity-strength', 1, .1, 4);
  }

  private registerColor(): void {
    const hex = this.getAttribute('ui-color') || '#eebd77';
    const match = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!match) return;
    const value = match[1]!;
    const color: [number,number,number] = [0,2,4].map((offset) => parseInt(value.slice(offset,offset+2),16)) as [number,number,number];
    const existing = this.palette.findIndex((entry) => entry.every((part,index) => part === color[index]));
    if (existing >= 0) this.paletteIndex = existing;
    else if (this.palette.length < 4096) { this.paletteIndex = this.palette.length; this.palette.push(color); }
    else { this.paletteIndex = 4095; this.palette[4095] = color; }
  }

  private point(event: PointerEvent): [number,number] {
    const bounds = this.getBoundingClientRect();
    return [Math.floor((event.clientX - bounds.left) * this.width / Math.max(1,bounds.width)),
      Math.floor((event.clientY - bounds.top) * this.height / Math.max(1,bounds.height))];
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.engine || this.activePointer !== -1) return;
    event.preventDefault();
    this.activePointer = event.pointerId;
    this.engine.checkpoint();
    [this.pointerX, this.pointerY] = this.point(event);
    this.lastX = this.pointerX; this.lastY = this.pointerY;
    this.setPointerCapture?.(event.pointerId);
    this.paintStroke(0);
  };
  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointer || !this.engine) return;
    event.preventDefault();
    [this.pointerX, this.pointerY] = this.point(event);
    const velocity = Math.hypot(this.pointerX - this.lastX, this.pointerY - this.lastY);
    this.paintStroke(velocity);
    this.lastX = this.pointerX; this.lastY = this.pointerY;
  };
  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointer) return;
    this.activePointer = -1;
    if (this.hasPointerCapture?.(event.pointerId)) this.releasePointerCapture(event.pointerId);
    this.notify();
  };
  private paintStroke(velocity: number): void {
    const engine = this.engine;
    if (!engine) return;
    const tool = this.tool;
    const density = clamp(this.amount * (1 + velocity / 16), .05, 1);
    const flowX = (this.pointerX - this.lastX) * .45;
    const flowY = (this.pointerY - this.lastY) * .45;
    engine.stroke(this.lastX, this.lastY, this.pointerX, this.pointerY,
      this.brushSize, tool, this.paletteIndex * 16, density, flowX, flowY);
    if (this.paused) this.render();
    this.notify();
  }

  private readonly onVisibilityChange = (): void => { if (document.hidden) this.stop(); else this.start(); };
  private start(): void {
    if (this.frame || this.paused || !this.visible || document.hidden || !this.engine) return;
    this.lastTime = 0;
    this.frame = requestAnimationFrame(this.tick);
  }
  private stop(): void { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; this.lastTime = 0; }
  private readonly tick = (now: number): void => {
    this.frame = 0;
    if (!this.isConnected || this.paused || !this.visible || document.hidden || !this.engine) return;
    const dt = this.lastTime ? Math.min(50, now - this.lastTime) : 16.7;
    this.lastTime = now;
    const rate = numeric(this,'ui-auto-rate',0,0,2000);
    this.spawnAccumulator = Math.min(100, this.spawnAccumulator + rate * dt / 1000);
    const [gx, gy] = this.engine.gravity === 'down' ? [0,1] : this.engine.gravity === 'up' ? [0,-1] : this.engine.gravity === 'left' ? [-1,0] : [1,0];
    for (let added = 0; this.spawnAccumulator >= 1 && added < 50; added++, this.spawnAccumulator--) {
      const x = gx ? (gx > 0 ? 0 : this.width - 1) : Math.floor(this.width * (.3 + Math.random() * .4));
      const y = gy ? (gy > 0 ? 0 : this.height - 1) : Math.floor(this.height * (.3 + Math.random() * .4));
      if (this.engine.at(x,y) === SandCell.Empty) this.engine.set(x,y,SandCell.Sand,this.paletteIndex * 16 + Math.floor(Math.random()*12));
    }
    if (this.activePointer !== -1 && this.tool !== 'wall' && this.tool !== 'eraser') this.paintStroke(0);
    const speed = numeric(this,'ui-speed',1,.1,4) * this.engine.gravityStrength;
    this.accumulator = Math.min(100, this.accumulator + dt * speed);
    for (let steps = 0; this.accumulator >= 16.7 && steps < 5; steps++, this.accumulator -= 16.7) this.engine.step();
    this.render();
    this.frame = requestAnimationFrame(this.tick);
  };

  private render(): void {
    if (!this.context || !this.image || !this.engine) return;
    const pixels = this.image.data;
    const cells = this.engine.cells;
    const tones = this.engine.tones;
    const transparent = this.getAttribute('ui-background') === 'transparent';
    for (let index = 0; index < cells.length; index++) {
      const material = cells[index]!;
      const offset = index * 4;
      if (material === SandCell.Empty) { pixels[offset+3] = 0; continue; }
      const tone = tones[index]!;
      const base = material === SandCell.Sand ? this.palette[tone >> 4] ?? this.palette[0]! : defaults[material]!;
      const variation = (tone & 15) - 6;
      pixels[offset] = clamp(base[0] + variation * 3,0,255);
      pixels[offset+1] = clamp(base[1] + variation * 2,0,255);
      pixels[offset+2] = clamp(base[2] + variation,0,255);
      pixels[offset+3] = material === SandCell.Smoke ? 190 : 255;
    }
    // Transparent cells expose the host's dark or light theme. PNG export retains transparency.
    this.context.putImageData(this.image,0,0);
    this.canvas?.toggleAttribute('data-transparent',transparent);
  }

  private notify(): void {
    this.dispatchEvent(new CustomEvent('ui:sand-physics:change', { bubbles:true,
      detail: { count:this.particleCount, paused:this.paused, gravity:this.engine?.gravity } }));
  }
}

define('ui-sand-physics', UiSandPhysics);

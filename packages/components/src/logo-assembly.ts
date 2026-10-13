/** Colored image pixels become independent particles that assemble into a logo. */
import { define } from '@ui/core';

type Mode = 'scattered' | 'assembling' | 'assembled' | 'exploding';
type Target = { x: number; y: number; color: string; alpha: number };
type Particle = Target & {
  vx: number; vy: number; homeX: number; homeY: number;
  driftX: number; driftY: number; radius: number; phase: number; delay: number;
};

const DEFAULT_LOGO = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"><path fill="#74e3ff" d="M300 15 550 180 300 345 50 180Z"/><path fill="#243bea" d="M300 75 450 180 300 285 150 180Z"/><path fill="#fff" d="M300 130 370 180 300 230 230 180Z"/></svg>')}`;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const numberAttr = (host: Element, name: string, fallback: number, min: number, max: number): number => {
  const value = Number(host.getAttribute(name));
  return host.hasAttribute(name) && Number.isFinite(value) ? clamp(value, min, max) : fallback;
};
const random = (min: number, max: number): number => min + Math.random() * (max - min);

/** Sample only opaque pixels, retaining the original color of each selected point. */
export function sampleLogoPixels(data: Uint8ClampedArray, width: number, height: number, count: number): Target[] {
  const candidates: Target[] = [];
  const stride = width * height > 250_000 ? 2 : 1;
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3] ?? 0;
      if (alpha < 48) continue;
      candidates.push({
        x, y, alpha: alpha / 255,
        color: `rgb(${data[offset] ?? 0} ${data[offset + 1] ?? 0} ${data[offset + 2] ?? 0})`,
      });
    }
  }
  if (!candidates.length) return [];
  // Draw one point from each occupied cell before drawing a second from any cell.
  // Random picks across the whole mask cluster visibly, even with thousands of points.
  const cellSize = Math.max(1, Math.sqrt(candidates.length * stride * stride / count));
  const columns = Math.ceil(width / cellSize);
  const cells = new Map<number, Target[]>();
  for (const candidate of candidates) {
    const key = Math.floor(candidate.y / cellSize) * columns + Math.floor(candidate.x / cellSize);
    let cell = cells.get(key);
    if (!cell) { cell = []; cells.set(key, cell); }
    cell.push(candidate);
  }
  const buckets = [...cells.values()];
  for (const bucket of buckets) {
    for (let index = bucket.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [bucket[index], bucket[other]] = [bucket[other]!, bucket[index]!];
    }
  }
  const sampled: Target[] = [];
  let round = 0;
  while (sampled.length < count) {
    // A new order per pass keeps incomplete final passes spread across the artwork.
    for (let index = buckets.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [buckets[index], buckets[other]] = [buckets[other]!, buckets[index]!];
    }
    for (const bucket of buckets) {
      if (sampled.length >= count) break;
      const point = bucket[round % bucket.length]!;
      sampled.push({ ...point,
        x: clamp(point.x + random(-.45, .45), 0, width - 1),
        y: clamp(point.y + random(-.45, .45), 0, height - 1),
      });
    }
    round++;
  }
  return sampled;
}

export class UiLogoAssembly extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['ui-src', 'ui-count', 'ui-particle-size', 'ui-color', 'ui-brightness', 'ui-glow',
      'ui-speed', 'ui-attraction', 'ui-repel', 'ui-repel-radius', 'ui-interaction', 'ui-auto'];
  }

  private controller: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private sourceImage: HTMLImageElement | null = null;
  private sourceUrl = '';
  private ownedUrl: string | null = null;
  private ownedFile: File | null = null;
  private loadVersion = 0;
  private loadTask: Promise<void> = Promise.resolve();
  private particles: Particle[] = [];
  private width = 800;
  private height = 460;
  private frame = 0;
  private resizeFrame = 0;
  private autoTimer = 0;
  private previousTime = 0;
  private assemblyStart = 0;
  private explosionUntil = 0;
  private mode: Mode = 'scattered';
  private pointerX = -10_000;
  private pointerY = -10_000;
  private pointerInside = false;
  private visible = true;
  private reducedMotion = false;
  private ownsRole = false;
  private coverageRadius = 1.7;

  get particleCount(): number { return this.particles.length; }
  get state(): Mode { return this.mode; }

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ui-logo-assembly__canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.prepend(this.canvas);
    }
    try { this.context = this.canvas.getContext('2d', { alpha: true }); } catch { this.context = null; }
    this.toggleAttribute('data-ui-logo-fallback', !this.context);
    if (!this.hasAttribute('role')) {
      this.ownsRole = true;
      this.updateRole();
    }
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Animated particle logo');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerleave', this.onPointerLeave, { signal });
    this.addEventListener('click', this.onClick, { signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    document.addEventListener('visibilitychange', this.onVisibilityChange, { signal });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.scheduleResize);
      this.resizeObserver.observe(this);
    } else window.addEventListener('resize', this.scheduleResize, { signal });
    if (typeof IntersectionObserver !== 'undefined') {
      this.visible = false;
      this.intersectionObserver = new IntersectionObserver((entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        if (this.visible) { this.scheduleAutoAssembly(); this.startLoop(); }
        else this.stopLoop();
      }, { rootMargin: '120px' });
      this.intersectionObserver.observe(this);
    }
    this.resizeCanvas();
    if (this.ownedFile && !this.ownedUrl) {
      this.ownedUrl = URL.createObjectURL(this.ownedFile);
      this.setAttribute('ui-src', this.ownedUrl);
    } else if (this.sourceImage && this.sourceUrl === (this.getAttribute('ui-src') || DEFAULT_LOGO)) this.resample(true);
    else {
      this.loadTask = this.loadSource(this.getAttribute('ui-src') || DEFAULT_LOGO);
      void this.loadTask.catch(() => {});
    }
  }

  disconnectedCallback(): void {
    this.controller?.abort();
    this.controller = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    this.stopLoop();
    cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = 0;
    clearTimeout(this.autoTimer);
    this.loadVersion++;
    if (this.ownedUrl) URL.revokeObjectURL(this.ownedUrl);
    this.ownedUrl = null;
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ui-src') {
      this.loadTask = this.loadSource(this.getAttribute('ui-src') || DEFAULT_LOGO);
      void this.loadTask.catch(() => {});
    }
    else if (name === 'ui-count') this.scheduleResize();
    else if (name === 'ui-particle-size') {
      for (const particle of this.particles) particle.radius = this.particleRadius();
      if (this.reducedMotion) this.draw(performance.now());
    }
    else if (name === 'ui-auto') this.scheduleAutoAssembly();
    else if (name === 'ui-interaction' && this.ownsRole) this.updateRole();
  }

  /** Replace the artwork without clearing existing particles. */
  setLogo(src: string): Promise<void> {
    const previousUpload = this.ownedUrl;
    if (src !== this.getAttribute('ui-src')) this.setAttribute('ui-src', src);
    else if (this.isConnected && this.sourceUrl !== src) this.loadTask = this.loadSource(src);
    return this.loadTask.then(() => {
      if (previousUpload && previousUpload !== src && this.ownedUrl === previousUpload) {
        URL.revokeObjectURL(previousUpload);
        this.ownedUrl = null;
        this.ownedFile = null;
      }
    });
  }

  /** Accept local SVG, PNG, or WebP files. The object URL is released on disconnect. */
  async loadFile(file: File): Promise<void> {
    if (!['image/svg+xml', 'image/png', 'image/webp'].includes(file.type) &&
      !(file.type === '' && /\.(svg|png|webp)$/i.test(file.name))) throw new TypeError('Use an SVG, PNG, or WebP logo.');
    const url = URL.createObjectURL(file);
    const previous = this.ownedUrl;
    const previousFile = this.ownedFile;
    const previousSource = this.sourceUrl || DEFAULT_LOGO;
    this.ownedUrl = url;
    try {
      await this.setLogo(url);
      this.ownedFile = file;
      if (previous) URL.revokeObjectURL(previous);
    } catch (error) {
      URL.revokeObjectURL(url);
      this.ownedUrl = previous;
      this.ownedFile = previousFile;
      if (this.getAttribute('ui-src') === url) this.setAttribute('ui-src', previousSource);
      throw error;
    }
  }

  assemble(): void {
    if (!this.particles.length) return;
    if (this.reducedMotion) {
      this.mode = 'assembled';
      for (const particle of this.particles) {
        particle.x = particle.homeX;
        particle.y = particle.homeY;
        particle.vx = 0;
        particle.vy = 0;
      }
      this.setAttribute('ui-active', '');
      this.setAttribute('ui-assembled', '');
      this.draw(performance.now());
      this.dispatchEvent(new CustomEvent('ui:logo-assembly:assembled', { bubbles: true }));
      return;
    }
    this.mode = 'assembling';
    this.assemblyStart = performance.now();
    this.removeAttribute('ui-assembled');
    this.setAttribute('ui-active', '');
    this.dispatchEvent(new CustomEvent('ui:logo-assembly:assemble', { bubbles: true }));
    this.startLoop();
  }

  scatter(): void {
    this.mode = 'scattered';
    this.removeAttribute('ui-active');
    this.removeAttribute('ui-assembled');
    for (const particle of this.particles) {
      particle.driftX = random(0, this.width);
      particle.driftY = random(0, this.height);
    }
    this.dispatchEvent(new CustomEvent('ui:logo-assembly:scatter', { bubbles: true }));
    this.startLoop();
  }

  explode(): void {
    if (!this.particles.length || this.mode === 'exploding' || this.reducedMotion) return;
    this.mode = 'exploding';
    this.removeAttribute('ui-assembled');
    this.explosionUntil = performance.now() + Math.max(450, this.speed * .42);
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    for (const particle of this.particles) {
      const angle = Math.atan2(particle.y - centerY, particle.x - centerX) + random(-.7, .7);
      const impulse = random(3.5, 12) * (this.width / 800 + .5);
      particle.vx += Math.cos(angle) * impulse;
      particle.vy += Math.sin(angle) * impulse;
    }
    this.dispatchEvent(new CustomEvent('ui:logo-assembly:explode', { bubbles: true }));
    this.startLoop();
  }

  private get speed(): number { return numberAttr(this, 'ui-speed', 2300, 150, 10_000); }
  private get interaction(): string { return this.getAttribute('ui-interaction') || 'all'; }
  private updateRole(): void { this.setAttribute('role', this.interaction === 'all' || this.interaction === 'click' ? 'button' : 'img'); }
  private get particleLimit(): number {
    const requested = numberAttr(this, 'ui-count', 3600, 150, 8000);
    const compact = this.width < 640 || window.matchMedia?.('(pointer: coarse)').matches;
    return Math.max(150, Math.round(Math.min(requested, compact ? 1500 : 6000, this.width * this.height / 45)));
  }

  private loadSource(url: string): Promise<void> {
    const version = ++this.loadVersion;
    const image = new Image();
    if (/^https?:/i.test(url)) image.crossOrigin = 'anonymous';
    return new Promise<void>((resolve, reject) => {
      image.onload = () => {
        if (version !== this.loadVersion || !this.isConnected) { resolve(); return; }
        const previousImage = this.sourceImage;
        const previousUrl = this.sourceUrl;
        this.sourceImage = image;
        try {
          if (!this.resample(this.particles.length > 0)) throw new Error('Could not sample the logo image.');
          this.sourceUrl = url;
          this.removeAttribute('ui-error');
          resolve();
        } catch (error) {
          this.sourceImage = previousImage;
          this.sourceUrl = previousUrl;
          this.setAttribute('ui-error', this.getAttribute('ui-error') || 'sample');
          reject(error);
        }
      };
      image.onerror = () => {
        if (version !== this.loadVersion || !this.isConnected) { resolve(); return; }
        this.setAttribute('ui-error', 'load');
        this.dispatchEvent(new CustomEvent('ui:logo-assembly:error', { bubbles: true, detail: { src: url } }));
        reject(new Error('Could not load the logo image.'));
      };
      image.src = url;
    });
  }

  private readonly scheduleResize = (): void => {
    if (this.resizeFrame) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = 0;
      if (!this.isConnected) return;
      this.resizeCanvas();
      if (this.sourceImage) this.resample(true);
    });
  };

  private resizeCanvas(): void {
    this.width = Math.max(1, this.clientWidth || 800);
    this.height = Math.max(1, this.clientHeight || 460);
    if (!this.canvas || !this.context) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private resample(preserve: boolean): boolean {
    const image = this.sourceImage;
    if (!image || !this.context) return false;
    if (!image.naturalWidth || !image.naturalHeight) {
      this.setAttribute('ui-error', 'empty');
      return false;
    }
    const mask = document.createElement('canvas');
    mask.width = Math.round(Math.min(this.width, 1100));
    mask.height = Math.round(Math.min(this.height, 650));
    const context = mask.getContext('2d', { willReadFrequently: true });
    if (!context) return false;
    const scale = Math.min(mask.width * .72 / image.naturalWidth, mask.height * .7 / image.naturalHeight);
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    context.clearRect(0, 0, mask.width, mask.height);
    context.drawImage(image, (mask.width - imageWidth) / 2, (mask.height - imageHeight) / 2, imageWidth, imageHeight);
    let data: ImageData;
    try { data = context.getImageData(0, 0, mask.width, mask.height); }
    catch {
      this.setAttribute('ui-error', 'cors');
      this.dispatchEvent(new CustomEvent('ui:logo-assembly:error', { bubbles: true, detail: { reason: 'cors' } }));
      return false;
    }
    const targets = sampleLogoPixels(data.data, mask.width, mask.height, this.particleLimit);
    if (!targets.length) {
      this.setAttribute('ui-error', 'empty');
      return false;
    }
    this.removeAttribute('ui-error');
    const scaleX = this.width / mask.width;
    const scaleY = this.height / mask.height;
    let opaquePixels = 0;
    for (let offset = 3; offset < data.data.length; offset += 4) {
      if (data.data[offset]! >= 48) opaquePixels++;
    }
    const areaPerParticle = opaquePixels * scaleX * scaleY / targets.length;
    this.coverageRadius = clamp(Math.sqrt(areaPerParticle) * .9, 1.7, 10);
    targets.forEach((target) => { target.x *= scaleX; target.y *= scaleY; });
    this.assignTargets(targets, preserve);
    this.setAttribute('ui-ready', '');
    this.dispatchEvent(new CustomEvent('ui:logo-assembly:ready', { bubbles: true, detail: { count: targets.length } }));
    this.startLoop();
    this.scheduleAutoAssembly();
    return true;
  }

  private particleRadius(): number {
    const size = numberAttr(this, 'ui-particle-size', 1.7, .3, 8);
    return this.coverageRadius * (size / 1.7) * random(.88, 1.12);
  }

  private assignTargets(targets: Target[], preserve: boolean): void {
    if (!preserve || !this.particles.length) {
      this.particles = targets.map((target) => ({
        ...target, homeX: target.x, homeY: target.y,
        x: random(0, this.width), y: random(0, this.height),
        vx: random(-.4, .4), vy: random(-.4, .4),
        driftX: random(0, this.width), driftY: random(0, this.height),
        radius: this.particleRadius(), phase: random(0, Math.PI * 2), delay: random(0, .72),
      }));
      this.mode = 'scattered';
      return;
    }
    // Match by angular position so a changed logo morphs without a random cross-screen scramble.
    const angle = (x: number, y: number): number => Math.atan2(y - this.height / 2, x - this.width / 2);
    const orderedParticles = [...this.particles].sort((a, b) => angle(a.x, a.y) - angle(b.x, b.y));
    const orderedTargets = [...targets].sort((a, b) => angle(a.x, a.y) - angle(b.x, b.y));
    orderedParticles.forEach((particle, index) => {
      const target = orderedTargets[Math.floor(index * orderedTargets.length / orderedParticles.length)]!;
      particle.homeX = target.x;
      particle.homeY = target.y;
      particle.color = target.color;
      particle.alpha = target.alpha;
      particle.radius = this.particleRadius();
      particle.delay = random(0, .45);
    });
    while (this.particles.length < targets.length) {
      const target = targets[this.particles.length]!;
      this.particles.push({ ...target, homeX: target.x, homeY: target.y,
        x: random(0, this.width), y: random(0, this.height), vx: 0, vy: 0,
        driftX: random(0, this.width), driftY: random(0, this.height),
        radius: this.particleRadius(), phase: random(0, Math.PI * 2), delay: random(0, .45) });
    }
    if (this.particles.length > targets.length) this.particles.length = targets.length;
    this.assemble();
  }

  private scheduleAutoAssembly(): void {
    clearTimeout(this.autoTimer);
    if (!this.visible || !this.particles.length || this.mode !== 'scattered' || this.getAttribute('ui-auto') === 'false') return;
    if (this.reducedMotion) { this.assemble(); return; }
    this.autoTimer = window.setTimeout(() => { this.autoTimer = 0; if (this.isConnected && this.visible) this.assemble(); }, 650);
  }

  private startLoop(): void {
    if (this.reducedMotion) { this.draw(performance.now()); return; }
    if (!this.context || !this.visible || document.hidden || this.frame) return;
    this.previousTime = 0;
    this.frame = requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.previousTime = 0;
  }

  private readonly onVisibilityChange = (): void => { if (document.hidden) this.stopLoop(); else this.startLoop(); };
  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.interaction !== 'all' && this.interaction !== 'hover') return;
    const bounds = this.getBoundingClientRect();
    this.pointerX = event.clientX - bounds.left;
    this.pointerY = event.clientY - bounds.top;
    this.pointerInside = true;
  };
  private readonly onPointerLeave = (): void => { this.pointerInside = false; };
  private readonly onClick = (): void => {
    if (this.interaction === 'all' || this.interaction === 'click') this.explode();
  };
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if ((event.key === 'Enter' || event.key === ' ') && (this.interaction === 'all' || this.interaction === 'click')) {
      event.preventDefault();
      this.explode();
    }
  };

  private readonly tick = (now: number): void => {
    this.frame = 0;
    if (!this.isConnected || !this.visible || document.hidden) return;
    const dt = this.previousTime ? clamp((now - this.previousTime) / 16.67, .35, 2) : 1;
    this.previousTime = now;
    if (this.mode === 'exploding' && now >= this.explosionUntil) this.assemble();
    const assembled = this.mode === 'assembled';
    const scattering = this.mode === 'scattered';
    const exploding = this.mode === 'exploding';
    const duration = this.speed;
    const speedFactor = clamp(2300 / duration, .35, 3.3);
    const attraction = clamp(numberAttr(this, 'ui-attraction', .024, .002, .16) * speedFactor * speedFactor, .001, .16);
    const repel = numberAttr(this, 'ui-repel', 3.2, 0, 20);
    const repelRadius = numberAttr(this, 'ui-repel-radius', 110, 20, 400);
    for (const particle of this.particles) {
      let targetX = particle.homeX;
      let targetY = particle.homeY;
      if (scattering || (this.mode === 'assembling' && now < this.assemblyStart + duration * particle.delay)) {
        targetX = particle.driftX + Math.sin(now * .00035 + particle.phase) * 18;
        targetY = particle.driftY + Math.cos(now * .00028 + particle.phase) * 18;
      } else if (assembled || this.mode === 'assembling') {
        targetX += Math.sin(now * .0014 + particle.phase) * .55;
        targetY += Math.cos(now * .0011 + particle.phase) * .55;
      }
      if (!exploding) {
        const spring = scattering ? .0025 : attraction;
        particle.vx += (targetX - particle.x) * spring * dt;
        particle.vy += (targetY - particle.y) * spring * dt;
      }
      if (this.pointerInside && !exploding && !scattering && repel > 0) {
        const dx = particle.x - this.pointerX;
        const dy = particle.y - this.pointerY;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > 1 && distanceSquared < repelRadius * repelRadius) {
          const distance = Math.sqrt(distanceSquared);
          const force = (1 - distance / repelRadius) ** 2 * repel * dt;
          particle.vx += dx / distance * force;
          particle.vy += dy / distance * force;
        }
      }
      const friction = Math.pow(exploding ? .983 : scattering ? .975 : .88, dt * (scattering || exploding ? 1 : speedFactor));
      particle.vx *= friction;
      particle.vy *= friction;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
    if (this.mode === 'assembling' && now > this.assemblyStart + duration * 1.65) {
      this.mode = 'assembled';
      this.setAttribute('ui-assembled', '');
      this.dispatchEvent(new CustomEvent('ui:logo-assembly:assembled', { bubbles: true }));
    }
    this.draw(now);
    this.frame = requestAnimationFrame(this.tick);
  };

  private draw(now: number): void {
    const context = this.context;
    if (!context) return;
    context.clearRect(0, 0, this.width, this.height);
    const override = this.getAttribute('ui-color');
    const brightness = numberAttr(this, 'ui-brightness', 1, .1, 3);
    const glow = numberAttr(this, 'ui-glow', 7, 0, 30);
    context.globalCompositeOperation = 'source-over';
    context.shadowBlur = 0;
    for (const particle of this.particles) {
      if (particle.x < -12 || particle.x > this.width + 12 || particle.y < -12 || particle.y > this.height + 12) continue;
      const shimmer = Math.sin(now * .0018 + particle.phase * 5);
      const opacity = this.mode === 'assembled' ? .96 + .04 * shimmer : .77 + .18 * shimmer;
      context.globalAlpha = clamp(opacity * particle.alpha * brightness, 0, 1);
      context.fillStyle = override || particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    if (glow > 0) {
      for (let index = 0; index < this.particles.length; index += 29) {
        const particle = this.particles[index]!;
        context.globalAlpha = .55 * particle.alpha;
        context.fillStyle = override || particle.color;
        context.shadowColor = override || particle.color;
        context.shadowBlur = glow * 2;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius * 1.2, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.shadowBlur = 0;
    context.globalAlpha = 1;
  }
}

define('ui-logo-assembly', UiLogoAssembly);

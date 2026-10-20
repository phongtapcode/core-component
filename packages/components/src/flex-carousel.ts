import { define } from '@ui/core';

export type FlexCarouselPreset = 'liquid' | 'ribbon' | 'vortex' | 'arch';
export type FlexCarouselFit = 'natural' | 'portrait' | 'square' | 'landscape';
export type FlexCarouselIntro = 'rise' | 'bloom' | 'spin' | 'deal' | 'none';

interface Slide { element: HTMLElement; image: HTMLImageElement; source: HTMLImageElement; title: string; subtitle: string; aspect: number; loaded: boolean; }
interface Metrics { widths: number[]; centers: number[]; loop: number; height: number; }
interface GLState { gl: WebGL2RenderingContext; program: WebGLProgram; vao: WebGLVertexArrayObject; buffer: WebGLBuffer; texture: WebGLTexture; uniforms: Record<string, WebGLUniformLocation>; }
const PRESETS: Record<FlexCarouselPreset, { bend: number; tilt: number; dispersion: number; lensWidth: number; lensHeight: number; reach: number; roundness: number; curl: number }> = {
  liquid: { bend: .34, tilt: 62, dispersion: .45, lensWidth: .74, lensHeight: 1.18, reach: .38, roundness: 1, curl: 0 },
  ribbon: { bend: .56, tilt: 0, dispersion: .16, lensWidth: .86, lensHeight: .68, reach: .28, roundness: .45, curl: 1 },
  vortex: { bend: .68, tilt: 42, dispersion: .7, lensWidth: .54, lensHeight: .85, reach: .55, roundness: .8, curl: 0 },
  arch: { bend: .48, tilt: 90, dispersion: .1, lensWidth: .66, lensHeight: 1.2, reach: .32, roundness: .2, curl: -1 },
};
const VERTEX = `#version 300 es
in vec2 aPoint;
out vec2 vUv;
void main(){vUv=aPoint*.5+.5;gl_Position=vec4(aPoint,0.,1.);}`;
const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uScene;
uniform vec2 uSize, uCenter, uHalf;
uniform float uAngle, uExponent, uInner, uOuter, uFlow, uCurl, uDispersion, uStrength, uFlatHalf;
vec2 rot(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
void main(){
  vec2 screen=vec2(vUv.x*uSize.x,(1.-vUv.y)*uSize.y);
  vec2 local=rot(screen-uCenter,-uAngle);
  vec2 q=max(abs(local)/uHalf,vec2(.00001));
  float shape=pow(pow(q.x,uExponent)+pow(q.y,uExponent),1./uExponent);
  vec2 gradient=pow(q,vec2(uExponent-1.))*sign(local)/uHalf*pow(shape,1.-uExponent);
  float distance=(shape-1.)/max(length(gradient),.00001);
  float t=clamp((distance+uInner)/(uInner+uOuter),0.,1.);
  float ramp=t*t*t*(t*(t*6.-15.)+10.);
  float bendZone=16.*t*t*(1.-t)*(1.-t);
  float sideDistance=screen.x-uCenter.x;
  float side=smoothstep(uFlatHalf,uFlatHalf+uSize.x*.14,abs(sideDistance));
  float direction=uCurl==0. ? sign(sideDistance) : uCurl;
  vec2 normal=rot(gradient/max(length(gradient),.00001),uAngle);
  vec2 tangent=vec2(-normal.y,normal.x);
  float warp=uFlow*ramp*side*direction*uStrength;
  vec2 source=screen;
  source.y+=warp;
  source-=tangent*tangent.y*side*direction*bendZone*uFlow*uStrength*.35;
  vec2 uv=vec2(source.x/uSize.x,1.-source.y/uSize.y);
  float shift=uDispersion*bendZone*side*uStrength/uSize.x*32.;
  vec4 mid=texture(uScene,uv);
  vec4 red=texture(uScene,uv+vec2(shift,0.));
  vec4 blue=texture(uScene,uv-vec2(shift,0.));
  outColor=vec4(red.r,mid.g,blue.b,max(max(red.a,mid.a),blue.a));
}`;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const wrap = (value: number, loop: number): number => ((value + loop / 2) % loop + loop) % loop - loop / 2;
const ease = (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

export class UiFlexCarousel extends HTMLElement {
  static observedAttributes = ['ui-preset', 'ui-intro', 'ui-fit', 'ui-card-height', 'ui-gap', 'ui-radius', 'ui-lens-width', 'ui-lens-height', 'ui-flat-width', 'ui-tilt', 'ui-bend', 'ui-reach', 'ui-roundness', 'ui-dispersion', 'ui-curl', 'ui-follow-cursor', 'ui-focus-on-click', 'ui-autoplay', 'ui-interval', 'ui-captions', 'ui-capture-wheel'];
  private slides: Slide[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private scene: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private gpu: GLState | null = null;
  private caption: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private media: MediaQueryList | null = null;
  private abort: AbortController | null = null;
  private frame = 0;
  private last = 0;
  private width = 0;
  private height = 0;
  private pos = 0;
  private goal = 0;
  private velocity = 0;
  private active = -1;
  private focusIndex = -1;
  private pendingFocus = -1;
  private autoplayTimer: ReturnType<typeof setTimeout> | null = null;
  private focusAmount = 0;
  private lensX = 0;
  private lensY = 0;
  private pointer = { down: false, dragging: false, id: -1, x: 0, y: 0, startX: 0, startY: 0, startPos: 0, samples: [] as { x: number; time: number }[], over: false };
  private wheelAt = 0;
  private visible = true;
  private dirty = true;
  private introStart = 0;
  private interactionAt = 0;
  private generation = 0;
  private readonly onMotionChange = (): void => this.refreshMode();
  private readonly onVisibility = (): void => { if (document.hidden) { this.stop(); this.clearAutoplay(); } else { this.requestFrame(); this.scheduleAutoplay(); } };

  get preset(): FlexCarouselPreset { const value = this.getAttribute('ui-preset'); return value && value in PRESETS ? value as FlexCarouselPreset : 'liquid'; }
  set preset(value: FlexCarouselPreset) { this.setAttribute('ui-preset', value); }
  get fit(): FlexCarouselFit { const value = this.getAttribute('ui-fit'); return value === 'portrait' || value === 'square' || value === 'landscape' ? value : 'natural'; }
  set fit(value: FlexCarouselFit) { this.setAttribute('ui-fit', value); }
  get intro(): FlexCarouselIntro { const value = this.getAttribute('ui-intro'); return value === 'bloom' || value === 'spin' || value === 'deal' || value === 'none' ? value : 'rise'; }
  set intro(value: FlexCarouselIntro) { this.setAttribute('ui-intro', value); }
  get index(): number { return Math.max(0, this.active); }
  get length(): number { return this.slides.length; }
  get autoplay(): boolean { return this.hasAttribute('ui-autoplay'); }
  set autoplay(value: boolean) { this.toggleAttribute('ui-autoplay', value); }
  get focusOnClick(): boolean { return this.getAttribute('ui-focus-on-click') !== 'false'; }
  set focusOnClick(value: boolean) { this.setAttribute('ui-focus-on-click', String(value)); }

  connectedCallback(): void {
    if (this.abort) return;
    this.abort = new AbortController();
    const { signal } = this.abort;
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', 'carousel');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'Image carousel');
    this.media = matchMedia('(prefers-reduced-motion: reduce)');
    this.media.addEventListener('change', this.onMotionChange, { signal });
    document.addEventListener('visibilitychange', this.onVisibility, { signal });
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerup', this.onPointerUp, { signal });
    this.addEventListener('pointercancel', this.onPointerUp, { signal });
    this.addEventListener('pointerleave', this.onPointerLeave, { signal });
    this.addEventListener('wheel', this.onWheel, { passive: false, signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    this.addEventListener('focusin', () => { this.clearAutoplay(); this.requestFrame(); }, { signal });
    this.addEventListener('focusout', () => { this.requestFrame(); this.scheduleAutoplay(); }, { signal });
    this.resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.resize());
    this.resizeObserver?.observe(this);
    this.intersectionObserver = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      this.visible = Boolean(entry?.isIntersecting);
      if (this.visible) { this.requestFrame(); this.scheduleAutoplay(); } else { this.stop(); this.clearAutoplay(); this.settleOffscreen(); }
    });
    this.intersectionObserver?.observe(this);
    this.mutationObserver = new MutationObserver(() => this.refresh());
    this.mutationObserver.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'alt', 'ui-title', 'ui-subtitle'] });
    this.refresh();
    this.refreshMode();
  }

  disconnectedCallback(): void {
    this.generation++;
    this.stop();
    this.clearAutoplay();
    this.abort?.abort(); this.abort = null;
    this.resizeObserver?.disconnect(); this.resizeObserver = null;
    this.intersectionObserver?.disconnect(); this.intersectionObserver = null;
    this.mutationObserver?.disconnect(); this.mutationObserver = null;
    this.slides.forEach(slide => { slide.image.onload = null; slide.image.onerror = null; });
    this.slides = [];
    this.destroyGraphics();
    this.caption?.remove(); this.caption = null;
    this.removeAttribute('data-ready');
    this.removeAttribute('data-dragging');
    this.removeAttribute('data-focused');
    this.wheelAt = 0;
  }

  attributeChangedCallback(name: string, oldValue: string | null, value: string | null): void {
    if (oldValue === value || !this.isConnected) return;
    if (name === 'ui-intro') this.replay();
    else if (name === 'ui-fit' || name === 'ui-card-height' || name === 'ui-gap') { const metrics = this.metrics(); if (metrics) this.pos = this.goal = metrics.centers[Math.min(this.index, this.length - 1)]!; this.syncCaption(); this.dirty = true; this.requestFrame(); }
    else { if (name === 'ui-captions') this.syncCaption(); if (name === 'ui-autoplay' || name === 'ui-interval') { this.clearAutoplay(); this.scheduleAutoplay(); } this.dirty = true; this.requestFrame(); }
  }

  refresh(): void {
    if (!this.isConnected) return;
    const elements = Array.from(this.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child.localName === 'ui-flex-carousel-item');
    const signature = elements.map(element => `${element.querySelector('img')?.getAttribute('src') ?? ''}|${element.getAttribute('ui-title') ?? ''}|${element.getAttribute('ui-subtitle') ?? ''}`).join('\n');
    if (signature === this.dataset['sourceSignature'] && this.slides.length === elements.length) return;
    this.dataset['sourceSignature'] = signature;
    const token = ++this.generation;
    this.slides.forEach(slide => { slide.image.onload = null; slide.image.onerror = null; });
    this.slides = elements.map(element => {
      const source = element.querySelector('img') ?? document.createElement('img');
      const image = new Image();
      const slide: Slide = { element, image, source, title: element.getAttribute('ui-title') ?? source.alt, subtitle: element.getAttribute('ui-subtitle') ?? '', aspect: 1, loaded: false };
      image.onload = () => {
        if (token !== this.generation) return;
        const before = this.metrics();
        slide.aspect = clamp(image.naturalWidth / Math.max(1, image.naturalHeight), .55, 2.2);
        slide.loaded = true;
        const after = this.metrics();
        if (before && after) {
          this.pos = this.remap(before, after, this.pos);
          this.goal = this.remap(before, after, this.goal);
          this.pointer.startPos = this.remap(before, after, this.pointer.startPos);
        }
        this.dirty = true; this.requestFrame();
      };
      image.onerror = () => { if (token !== this.generation) return; this.dirty = true; this.requestFrame(); };
      image.src = source.currentSrc || source.src;
      return slide;
    });
    this.active = -1;
    this.focusIndex = -1;
    this.pendingFocus = -1;
    this.focusAmount = 0;
    this.pos = this.goal = 0;
    this.velocity = 0;
    this.introStart = performance.now();
    this.dirty = true;
    this.syncCaption();
    this.requestFrame();
  }

  replay(): void { this.introStart = performance.now(); this.dirty = true; this.requestFrame(); }
  next(): void { this.step(1); }
  previous(): void { this.step(-1); }
  goTo(index: number): void {
    if (!this.length || !Number.isFinite(index)) return;
    const target = ((Math.trunc(index) % this.length) + this.length) % this.length;
    if (!this.gpu) {
      this.active = target;
      const item = this.slides[target]?.element;
      if (item) this.scrollTo({ left: item.offsetLeft + item.offsetWidth / 2 - this.clientWidth / 2, behavior: 'instant' });
      this.dispatchEvent(new CustomEvent('ui:flex-carousel:change', { detail: { index: target, item }, bubbles: true }));
      return;
    }
    const metrics = this.metrics();
    if (!metrics) return;
    this.close(); this.pendingFocus = -1;
    this.goal += wrap(metrics.centers[target]! - this.goal, metrics.loop);
    this.clearAutoplay(); this.interactionAt = performance.now();
    this.settleOffscreen();
    this.requestFrame();
  }
  open(): void { if (!this.length) return; this.focusIndex = this.index; this.clearAutoplay(); this.interactionAt = performance.now(); this.setAttribute('data-focused', ''); this.requestFrame(); this.dispatchEvent(new CustomEvent('ui:flex-carousel:select', { detail: { index: this.index, item: this.slides[this.index]?.element }, bubbles: true })); }
  close(): void { this.pendingFocus = -1; if (this.focusIndex < 0) return; this.focusIndex = -1; this.removeAttribute('data-focused'); this.requestFrame(); }

  private number(name: string, fallback: number, min: number, max: number): number { const raw = Number(this.getAttribute(name)); return this.hasAttribute(name) && Number.isFinite(raw) ? clamp(raw, min, max) : fallback; }
  private config() {
    const preset = PRESETS[this.preset];
    return { bend: this.number('ui-bend', preset.bend, 0, 1), tilt: this.number('ui-tilt', preset.tilt, -180, 180), dispersion: this.number('ui-dispersion', preset.dispersion, 0, 1), lensWidth: this.number('ui-lens-width', preset.lensWidth, .15, 1.5), lensHeight: this.number('ui-lens-height', preset.lensHeight, .15, 2), flatWidth: this.number('ui-flat-width', .22, .1, .7), reach: this.number('ui-reach', preset.reach, .05, 1), roundness: this.number('ui-roundness', preset.roundness, 0, 1), curl: this.getAttribute('ui-curl') === 'rise' ? 1 : this.getAttribute('ui-curl') === 'fall' ? -1 : preset.curl, gap: this.number('ui-gap', 12, 0, 100), cardHeight: this.number('ui-card-height', .5, .15, .9), radius: this.number('ui-radius', 0, 0, 60), interval: this.number('ui-interval', 4, 1, 30) };
  }
  private metrics(): Metrics | null {
    if (!this.length || !this.width || !this.height) return null;
    const config = this.config();
    const height = Math.max(24, this.height * config.cardHeight);
    const fixed = this.fit === 'portrait' ? .72 : this.fit === 'square' ? 1 : this.fit === 'landscape' ? 1.5 : 0;
    const widths = this.slides.map(slide => height * (fixed || slide.aspect));
    const centers: number[] = [];
    let loop = 0;
    widths.forEach(width => { centers.push(loop + width / 2); loop += width + config.gap; });
    return { widths, centers, loop, height };
  }
  private nearest(metrics: Metrics, position = this.pos): number {
    let best = 0, distance = Infinity;
    metrics.centers.forEach((center, index) => { const delta = Math.abs(wrap(center - position, metrics.loop)); if (delta < distance) { best = index; distance = delta; } });
    return best;
  }
  private remap(before: Metrics, after: Metrics, position: number): number {
    const index = this.nearest(before, position);
    const cycle = Math.round((position - before.centers[index]!) / before.loop);
    const offset = position - before.centers[index]! - cycle * before.loop;
    return after.centers[index]! + cycle * after.loop + offset * (after.widths[index]! / before.widths[index]!);
  }
  private snap(metrics: Metrics, position: number): number { return position + wrap(metrics.centers[this.nearest(metrics, position)]! - position, metrics.loop); }
  private step(direction: number, userInitiated = true): void {
    if (!this.gpu) { this.goTo(this.index + direction); return; }
    const metrics = this.metrics(); if (!metrics) return;
    const index = this.nearest(metrics, this.goal);
    const next = (index + direction + this.length) % this.length;
    this.goal = this.snap(metrics, this.goal) + direction * (metrics.widths[index]! / 2 + metrics.widths[next]! / 2 + this.config().gap);
    this.close(); this.clearAutoplay(); if (userInitiated) this.interactionAt = performance.now(); this.requestFrame();
    this.settleOffscreen();
  }

  private settleOffscreen(): void {
    if (this.visible) return;
    const metrics = this.metrics(); if (!metrics) return;
    this.pos = this.goal; this.velocity = 0; this.wheelAt = 0;
    const index = this.nearest(metrics);
    if (index !== this.active) {
      this.active = index; this.syncCaption();
      this.dispatchEvent(new CustomEvent('ui:flex-carousel:change', { detail: { index, item: this.slides[index]?.element }, bubbles: true }));
    }
  }

  private refreshMode(): void {
    if (!this.isConnected) return;
    if (this.media?.matches) { this.clearAutoplay(); this.destroyGraphics(); this.removeAttribute('data-ready'); return; }
    if (!this.gpu) this.setupGraphics();
    this.resize(); this.scheduleAutoplay();
  }
  private setupGraphics(): void {
    const canvas = document.createElement('canvas');
    canvas.className = 'ui-flex-carousel__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) return;
    const vertex = this.compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = this.compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vertex || !fragment) return;
    const program = gl.createProgram(); const vao = gl.createVertexArray(); const buffer = gl.createBuffer(); const texture = gl.createTexture();
    if (!program || !vao || !buffer || !texture) return;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return; }
    gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'aPoint'); gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const uniforms: Record<string, WebGLUniformLocation> = {};
    for (const name of ['uScene','uSize','uCenter','uHalf','uAngle','uExponent','uInner','uOuter','uFlow','uCurl','uDispersion','uStrength','uFlatHalf']) { const location = gl.getUniformLocation(program, name); if (location) uniforms[name] = location; }
    this.gpu = { gl, program, vao, buffer, texture, uniforms };
    this.canvas = canvas;
    this.scene = document.createElement('canvas');
    this.ctx = this.scene.getContext('2d', { alpha: true });
    if (!this.ctx) { this.destroyGraphics(); return; }
    this.append(canvas);
    this.caption = document.createElement('div'); this.caption.className = 'ui-flex-carousel__caption'; this.caption.setAttribute('aria-live', 'polite'); this.caption.setAttribute('aria-atomic', 'true'); this.append(this.caption);
    this.setAttribute('data-ready', '');
    this.syncCaption();
    canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); this.destroyGraphics(); this.removeAttribute('data-ready'); }, { signal: this.abort!.signal });
  }
  private compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type); if (!shader) return null;
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  }
  private destroyGraphics(): void {
    this.stop();
    const gpu = this.gpu;
    if (gpu) { gpu.gl.deleteProgram(gpu.program); gpu.gl.deleteVertexArray(gpu.vao); gpu.gl.deleteBuffer(gpu.buffer); gpu.gl.deleteTexture(gpu.texture); }
    this.gpu = null;
    this.canvas?.remove(); this.canvas = null;
    this.caption?.remove(); this.caption = null;
    this.scene = null; this.ctx = null;
    this.removeAttribute('data-ready');
  }
  private resize(): void {
    if (!this.isConnected) return;
    const rect = this.getBoundingClientRect();
    const width = Math.round(rect.width), height = Math.round(rect.height);
    if (width <= 0 || height <= 0) return;
    if (width === this.width && height === this.height && this.scene) return;
    const before = this.metrics(); const old = before ? this.nearest(before) : 0;
    this.width = width; this.height = height;
    if (!this.lensX && !this.lensY) { this.lensX = width / 2; this.lensY = height / 2; }
    if (this.scene && this.canvas) {
      const dpr = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(2_000_000 / (width * height)));
      const pixelWidth = Math.max(2, Math.round(width * dpr)); const pixelHeight = Math.max(2, Math.round(height * dpr));
      this.scene.width = this.canvas.width = pixelWidth; this.scene.height = this.canvas.height = pixelHeight;
      this.canvas.style.width = `${width}px`; this.canvas.style.height = `${height}px`;
      this.ctx?.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      if (this.gpu) {
        const { gl, texture } = this.gpu;
        gl.viewport(0, 0, pixelWidth, pixelHeight);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pixelWidth, pixelHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
    }
    const after = this.metrics(); if (after) this.pos = this.goal = after.centers[Math.min(old, this.length - 1)]!;
    this.syncCaption(); this.dirty = true; this.requestFrame();
  }
  private syncCaption(): void {
    if (!this.caption) return;
    this.caption.style.top = `${this.height / 2 + this.height * this.config().cardHeight / 2 + 20}px`;
    const slide = this.slides[this.index];
    this.caption.replaceChildren();
    if (!slide || this.getAttribute('ui-captions') === 'false') return;
    const title = document.createElement('strong'); title.textContent = slide.title;
    const subtitle = document.createElement('span'); subtitle.textContent = slide.subtitle;
    const count = document.createElement('small'); count.textContent = `${this.index + 1} / ${this.length}`;
    this.caption.append(title, subtitle, count);
  }
  private requestFrame(): void {
    this.dirty = true;
    if (this.frame || !this.gpu || !this.visible || document.hidden || !this.isConnected) return;
    this.last = performance.now(); this.frame = requestAnimationFrame(this.tick);
  }
  private stop(): void { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; }
  private clearAutoplay(): void { if (this.autoplayTimer !== null) clearTimeout(this.autoplayTimer); this.autoplayTimer = null; }
  private scheduleAutoplay(): void {
    if (!this.autoplay || this.autoplayTimer !== null || !this.visible || document.hidden || this.media?.matches || this.pointer.over || this.pointer.down || this.matches(':focus-within') || this.focusIndex >= 0 || !this.length) return;
    const delay = Math.max(this.config().interval * 1000, 3000 - (performance.now() - this.interactionAt));
    this.autoplayTimer = setTimeout(() => { this.autoplayTimer = null; if (!this.isConnected) return; this.step(1, false); }, delay);
  }
  private readonly tick = (now: number): void => {
    this.frame = 0;
    if (!this.gpu || !this.visible || document.hidden || !this.ctx || !this.scene) return;
    const metrics = this.metrics(); if (!metrics) return;
    const dt = clamp((now - this.last) / 1000, .001, .05); this.last = now;
    let moving = false;
    if (this.wheelAt) {
      if (now - this.wheelAt > 150) { this.goal = this.snap(metrics, this.goal); this.wheelAt = 0; }
      else moving = true;
    }
    if (!this.pointer.dragging) {
      const stiffness = 58, damping = 2 * Math.sqrt(stiffness);
      const steps = Math.ceil(dt * 180), h = dt / steps;
      for (let i = 0; i < steps; i++) { this.velocity += (stiffness * (this.goal - this.pos) - damping * this.velocity) * h; this.pos += this.velocity * h; }
      if (Math.abs(this.goal - this.pos) < .08 && Math.abs(this.velocity) < .6) { this.pos = this.goal; this.velocity = 0; }
      else moving = true;
    }
    if (Math.abs(this.pos) > metrics.loop * 8) { const shift = Math.round(this.pos / metrics.loop) * metrics.loop; this.pos -= shift; this.goal -= shift; }
    const targetFocus = this.focusIndex >= 0 ? 1 : 0;
    this.focusAmount += (targetFocus - this.focusAmount) * (1 - Math.exp(-dt * 9));
    if (Math.abs(targetFocus - this.focusAmount) < .003) this.focusAmount = targetFocus; else moving = true;
    const index = this.nearest(metrics);
    if (index !== this.active) {
      this.active = index; this.syncCaption();
      this.dispatchEvent(new CustomEvent('ui:flex-carousel:change', { detail: { index, item: this.slides[index]?.element }, bubbles: true }));
    }
    const config = this.config();
    const follow = this.hasAttribute('ui-follow-cursor') && this.pointer.over && !this.pointer.dragging;
    const lensTargetX = follow ? this.pointer.x : this.width / 2;
    const lensTargetY = follow ? this.pointer.y : this.height / 2;
    const lensBlend = 1 - Math.exp(-dt * 12);
    this.lensX += (lensTargetX - this.lensX) * lensBlend;
    this.lensY += (lensTargetY - this.lensY) * lensBlend;
    if (Math.abs(this.lensX - lensTargetX) + Math.abs(this.lensY - lensTargetY) > .3) moving = true;
    else { this.lensX = lensTargetX; this.lensY = lensTargetY; }
    const introDuration = this.intro === 'none' ? 0 : this.intro === 'spin' ? 1.65 : 1.1;
    const introT = introDuration ? clamp((now - this.introStart) / (introDuration * 1000), 0, 1) : 1;
    if (introT < 1) moving = true;
    if (this.pendingFocus >= 0 && !moving && index === this.pendingFocus) {
      this.pendingFocus = -1; this.open(); moving = true;
    }
    this.drawScene(metrics, config, introT);
    this.drawWarp(metrics, config, introT);
    this.dirty = false;
    if (moving || this.pointer.dragging || this.dirty) { if (!this.frame) this.frame = requestAnimationFrame(this.tick); }
    else this.scheduleAutoplay();
  };
  private drawScene(metrics: Metrics, config: ReturnType<UiFlexCarousel['config']>, introT: number): void {
    const ctx = this.ctx!; ctx.clearRect(0, 0, this.width, this.height);
    const base = this.width / 2, centerY = this.height / 2;
    for (let i = 0; i < this.length; i++) {
      const slide = this.slides[i]!; const width = metrics.widths[i]!;
      const relative = wrap(metrics.centers[i]! - this.pos, metrics.loop);
      for (let cycle = -2; cycle <= 2; cycle++) {
        const rel = relative + cycle * metrics.loop;
        if (Math.abs(rel) - width / 2 > this.width + 60) continue;
        const stagger = clamp((introT - Math.abs(rel) / Math.max(this.width, 1) * .2) / .8, 0, 1);
        const appear = ease(stagger);
        let x = base + rel, y = centerY, scale = 1, alpha = 1;
        if (this.intro === 'rise') { y += (1 - appear) * this.height * .55; scale = .6 + .4 * appear; alpha = stagger; }
        else if (this.intro === 'bloom') { scale = .85 + .15 * appear; alpha = appear; }
        else if (this.intro === 'deal') { x -= rel * (1 - appear); alpha = appear; }
        else if (this.intro === 'spin') { x += (1 - appear) * this.width * 1.3; alpha = appear; }
        if (this.focusAmount > .005) {
          if (i === this.focusIndex && Math.abs(rel) < width) scale *= 1 + this.focusAmount * Math.min(.3, this.height * .8 / metrics.height - 1);
          else { x += Math.sign(rel) * this.width * .7 * this.focusAmount; alpha *= 1 - this.focusAmount; }
        }
        if (alpha <= .001) continue;
        const drawW = width * scale, drawH = metrics.height * scale;
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.translate(x - drawW / 2, y - drawH / 2);
        ctx.beginPath(); ctx.roundRect(0, 0, drawW, drawH, config.radius); ctx.clip();
        if (slide.loaded) {
          const aspect = slide.aspect, boxAspect = drawW / drawH;
          const imageW = aspect > boxAspect ? drawH * aspect : drawW;
          const imageH = aspect > boxAspect ? drawH : drawW / aspect;
          ctx.drawImage(slide.image, (drawW - imageW) / 2, (drawH - imageH) / 2, imageW, imageH);
        } else { ctx.fillStyle = ['#514639','#4b5a5d','#5a4b56','#40515d'][i % 4]!; ctx.fillRect(0, 0, drawW, drawH); }
        ctx.restore();
      }
    }
  }
  private drawWarp(metrics: Metrics, config: ReturnType<UiFlexCarousel['config']>, introT: number): void {
    const gpu = this.gpu!, { gl, uniforms: u } = gpu;
    gl.useProgram(gpu.program); gl.bindVertexArray(gpu.vao); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, gpu.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.scene!);
    const set1 = (key: string, value: number) => { if (u[key]) gl.uniform1f(u[key], value); };
    const set2 = (key: string, x: number, y: number) => { if (u[key]) gl.uniform2f(u[key], x, y); };
    if (u['uScene']) gl.uniform1i(u['uScene'], 0);
    set2('uSize', this.width, this.height);
    set2('uCenter', this.lensX, this.lensY);
    const halfW = Math.max(1, config.lensWidth * this.width / 2), halfH = Math.max(1, config.lensHeight * this.width / 2);
    set2('uHalf', halfW, halfH);
    set1('uAngle', -config.tilt * Math.PI / 180);
    set1('uExponent', 2 + Math.pow(1 - config.roundness, 1.5) * 10);
    const inner = Math.max(4, config.reach * (halfW + halfH) * .5);
    set1('uInner', inner); set1('uOuter', inner * 1.6);
    set1('uFlow', config.bend * (halfW + halfH) * .52);
    set1('uCurl', config.curl); set1('uDispersion', config.dispersion * .12);
    const position = ((this.pos % metrics.loop) + metrics.loop) % metrics.loop;
    let left = this.length - 1;
    for (let i = 0; i < this.length - 1; i++) {
      if (position >= metrics.centers[i]! && position < metrics.centers[i + 1]!) { left = i; break; }
    }
    const right = (left + 1) % this.length;
    const start = metrics.centers[left]!;
    const end = right === 0 ? metrics.centers[0]! + metrics.loop : metrics.centers[right]!;
    const progress = clamp(((position < start ? position + metrics.loop : position) - start) / (end - start), 0, 1);
    const blend = progress * progress * (3 - 2 * progress);
    const cardHalf = (metrics.widths[left]! * (1 - blend) + metrics.widths[right]! * blend) / 2 + config.gap;
    set1('uFlatHalf', Math.max(config.flatWidth * this.width / 2, cardHalf));
    set1('uStrength', ease(introT) * (1 - this.focusAmount));
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!this.gpu || event.button > 0) return;
    const rect = this.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    this.pointer = { down: true, dragging: false, id: event.pointerId, x, y, startX: x, startY: y, startPos: this.pos, samples: [{ x, time: performance.now() }], over: true };
    this.wheelAt = 0;
    this.clearAutoplay(); this.interactionAt = performance.now(); this.requestFrame();
  };
  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.gpu) return;
    const rect = this.getBoundingClientRect(); const x = event.clientX - rect.left, y = event.clientY - rect.top;
    this.pointer.x = x; this.pointer.y = y; this.pointer.over = true; this.clearAutoplay();
    if (this.pointer.down && this.pointer.id === event.pointerId) {
      const dx = x - this.pointer.startX, dy = y - this.pointer.startY;
      const slop = event.pointerType === 'touch' ? 10 : 5;
      if (!this.pointer.dragging && Math.abs(dx) > slop && Math.abs(dx) > Math.abs(dy)) {
        this.pointer.dragging = true; this.close();
        try { this.setPointerCapture(event.pointerId); } catch { /* Pointer may have ended before capture. */ }
        this.setAttribute('data-dragging', '');
      }
      if (this.pointer.dragging) {
        const now = performance.now();
        this.pointer.samples.push({ x, time: now });
        this.pointer.samples = this.pointer.samples.filter(sample => now - sample.time < 120);
        this.pos = this.pointer.startPos - (dx - Math.sign(dx) * slop);
        this.goal = this.pos; this.velocity = 0;
      }
    }
    if (this.hasAttribute('ui-follow-cursor')) this.requestFrame();
    else if (this.pointer.dragging) this.requestFrame();
  };
  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.pointer.down || this.pointer.id !== event.pointerId) return;
    const dragging = this.pointer.dragging;
    this.pointer.down = false; this.pointer.dragging = false; this.removeAttribute('data-dragging');
    if (this.hasPointerCapture(event.pointerId)) this.releasePointerCapture(event.pointerId);
    const metrics = this.metrics(); if (!metrics) return;
    if (dragging) {
      const samples = this.pointer.samples;
      const first = samples[0], last = samples[samples.length - 1];
      const duration = first && last ? last.time - first.time : 0;
      const speed = last && performance.now() - last.time < 80 && duration > 24 && Math.abs(this.pointer.startX - last.x) > 24
        ? clamp((first!.x - last.x) / duration * 1000, -1800, 1800) : 0;
      this.goal = this.snap(metrics, this.pos + speed * .18); this.requestFrame();
    }
    else if (this.focusOnClick) {
      if (this.focusIndex >= 0) this.close();
      else {
        const rect = this.getBoundingClientRect();
        if (Math.abs(event.clientY - rect.top - this.height / 2) > metrics.height / 2 + 48) return;
        const at = event.clientX - rect.left;
        const index = this.nearest(metrics, this.pos + at - this.width / 2);
        this.goTo(index); this.pendingFocus = index; this.requestFrame();
      }
    }
  };
  private readonly onPointerLeave = (): void => { this.pointer.over = false; this.scheduleAutoplay(); if (this.hasAttribute('ui-follow-cursor')) this.requestFrame(); };
  private readonly onWheel = (event: WheelEvent): void => {
    if (!this.gpu || this.getAttribute('ui-capture-wheel') === 'false' || Math.abs(event.deltaY) < Math.abs(event.deltaX) * .3) return;
    event.preventDefault(); this.close();
    const metrics = this.metrics(); if (!metrics) return;
    this.goal += clamp((event.deltaX + event.deltaY) * (event.deltaMode === 1 ? 8 : event.deltaMode === 2 ? this.width : 1), -180, 180);
    this.wheelAt = performance.now();
    this.clearAutoplay(); this.interactionAt = performance.now(); this.requestFrame();
  };
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowRight') { event.preventDefault(); this.next(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); this.previous(); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (this.focusIndex >= 0) this.close(); else this.open(); }
    else if (event.key === 'Escape') this.close();
  };
}
export class UiFlexCarouselItem extends HTMLElement {}
define('ui-flex-carousel', UiFlexCarousel);
define('ui-flex-carousel-item', UiFlexCarouselItem);

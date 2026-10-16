import { define } from '@ui/core';

export type CurvedLoopShape = 'arc' | 'wave' | 'circle' | 'line';

const SVG_NS = 'http://www.w3.org/2000/svg';
let nextId = 0;

function numberAttr(element: Element, name: string, fallback: number, min: number, max: number): number {
  const raw = element.getAttribute(name);
  const value = raw === null ? fallback : Number(raw);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function enabled(element: Element, name: string, fallback: boolean): boolean {
  const value = element.getAttribute(name);
  return value === null ? fallback : value !== 'false';
}

function svgElement<K extends keyof SVGElementTagNameMap>(name: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, name);
}

/** A looping SVG text ribbon that follows an arc, wave, circle, or straight path. */
export class UiCurvedLoop extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['ui-text', 'ui-shape', 'ui-separator', 'ui-direction', 'ui-speed', 'ui-scroll-boost',
      'ui-curve', 'ui-size', 'ui-weight', 'ui-letter-spacing', 'ui-edge-fade', 'ui-outline',
      'ui-interactive', 'ui-pause-on-hover'];
  }

  private readonly pathId = `ui-curved-loop-${++nextId}`;
  private controller: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private source: HTMLSpanElement | null = null;
  private svg: SVGSVGElement | null = null;
  private path: SVGPathElement | null = null;
  private measure: SVGTextElement | null = null;
  private textNode: SVGTextElement | null = null;
  private ribbon: SVGTextPathElement | null = null;
  private circleGroup: SVGGElement | null = null;
  private authoredText = '';
  private unitLength = 1;
  private circlePeriod = 1;
  private circleRadius = 1;
  private circleCenter = { x: 0, y: 0 };
  private width = 0;
  private offset = 0;
  private frame = 0;
  private lastTime = 0;
  private fling = 0;
  private scrollVelocity = 0;
  private lastScrollY = 0;
  private visible = true;
  private hovered = false;
  private pointerId = -1;
  private pointerX = 0;
  private pointerTime = 0;
  private dragVelocity = 0;

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    if (!this.source) this.createMarkup();
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.lastScrollY = window.scrollY;
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    this.refresh();
    this.addEventListener('pointerenter', this.onPointerEnter, { signal });
    this.addEventListener('pointerleave', this.onPointerLeave, { signal });
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerup', this.onPointerUp, { signal });
    this.addEventListener('pointercancel', this.onPointerUp, { signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    window.addEventListener('scroll', this.onScroll, { signal, passive: true });
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
    this.stop();
    this.pointerId = -1;
    this.hovered = false;
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ui-speed' || name === 'ui-direction' || name === 'ui-pause-on-hover' || name === 'ui-interactive' || name === 'ui-scroll-boost') this.wake();
    else this.refresh();
  }

  /** Recalculate the path and repeated text after changing content, font, or container width. */
  refresh(): void {
    if (!this.svg || !this.path || !this.measure || !this.textNode || !this.ribbon || !this.circleGroup || !this.source) return;
    const text = this.getAttribute('ui-text') ?? this.authoredText;
    this.source.textContent = text;
    if (typeof this.measure.getComputedTextLength !== 'function' || typeof this.path.getTotalLength !== 'function') {
      this.removeAttribute('data-ready');
      return;
    }
    const rect = this.getBoundingClientRect();
    const width = rect.width;
    if (width < 1) return;
    this.width = width;
    const height = Math.max(1, rect.height);
    const scale = width / 1440;
    const shape = this.shape;
    const curve = numberAttr(this, 'ui-curve', 400, -800, 800) * scale;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const y = height * .5;
    let d = '';
    if (shape === 'arc') {
      const bend = Math.max(-height * .36, Math.min(height * .36, curve));
      d = `M ${-width * .35} ${y - bend * .45} Q ${width * .5} ${y + bend * 2.35} ${width * 1.35} ${y - bend * .45}`;
    } else if (shape === 'wave') {
      const amplitude = Math.min(height * .24, Math.abs(curve) * .52) * (curve < 0 ? -1 : 1);
      d = `M ${-width * .25} ${y} C ${-width * .125} ${y - amplitude} 0 ${y - amplitude} ${width * .125} ${y}`
        + ` C ${width * .25} ${y + amplitude} ${width * .375} ${y + amplitude} ${width * .5} ${y}`
        + ` C ${width * .625} ${y - amplitude} ${width * .75} ${y - amplitude} ${width * .875} ${y}`
        + ` C ${width} ${y + amplitude} ${width * 1.125} ${y + amplitude} ${width * 1.25} ${y}`;
    } else if (shape === 'circle') {
      const radius = Math.min(width * .23, height * .32);
      d = `M ${width / 2} ${y - radius} A ${radius} ${radius} 0 1 1 ${width / 2 - .01} ${y - radius} Z`;
    } else d = `M ${-width * .4} ${y} L ${width * 1.4} ${y}`;
    this.path.setAttribute('d', d);
    const style = getComputedStyle(this);
    const fontSize = Math.max(18, numberAttr(this, 'ui-size', 96, 12, 240) * scale);
    const weight = numberAttr(this, 'ui-weight', 700, 100, 900);
    const spacing = numberAttr(this, 'ui-letter-spacing', 0, -20, 40) * scale;
    for (const node of [this.measure, this.textNode]) {
      node.setAttribute('font-size', String(fontSize));
      node.setAttribute('font-weight', String(weight));
      node.setAttribute('font-family', style.fontFamily || 'sans-serif');
      node.setAttribute('letter-spacing', String(spacing));
    }
    const separator = this.getAttribute('ui-separator') || '';
    const word = svgElement('tspan');
    word.textContent = text.trim();
    const gap = svgElement('tspan');
    gap.textContent = separator ? ` ${separator} ` : '  ';
    // The extra word prevents SVG from collapsing the separator's trailing spaces.
    this.measure.replaceChildren(word, gap, word.cloneNode(true));
    if (typeof word.getComputedTextLength !== 'function' || typeof gap.getComputedTextLength !== 'function') {
      this.removeAttribute('data-ready');
      return;
    }
    this.unitLength = Math.max(1, word.getComputedTextLength() + gap.getComputedTextLength());
    const length = this.path.getTotalLength();
    const repeatCount = Math.min(120, Math.max(3, Math.ceil(length / this.unitLength) + 2));
    this.ribbon.replaceChildren();
    for (let i = 0; i < repeatCount; i++) {
      const word = svgElement('tspan');
      word.textContent = text.trim();
      this.ribbon.append(word);
      const separatorPart = svgElement('tspan');
      separatorPart.textContent = separator ? ` ${separator} ` : '  ';
      separatorPart.setAttribute('fill', separator ? 'var(--ui-curved-loop-separator-color, currentColor)' : 'currentColor');
      this.ribbon.append(separatorPart);
    }
    const outline = enabled(this, 'ui-outline', false);
    const textNode = this.textNode;
    textNode.setAttribute('fill', outline ? 'none' : 'currentColor');
    textNode.setAttribute('stroke', outline ? 'currentColor' : 'none');
    textNode.setAttribute('stroke-width', outline ? String(Math.max(1, fontSize * .025)) : '0');
    // A separator remains solid even when the main text is outlined.
    this.ribbon.querySelectorAll('tspan:nth-child(even)').forEach((part) => {
      part.setAttribute('stroke', 'none');
      if (separator) part.setAttribute('fill', 'var(--ui-curved-loop-separator-color, currentColor)');
    });
    this.textNode.style.display = shape === 'circle' ? 'none' : '';
    this.circleGroup.style.display = shape === 'circle' ? '' : 'none';
    if (shape === 'circle') this.buildCircle(text.trim(), separator, width, height, fontSize, weight, spacing, style.fontFamily || 'sans-serif', outline);
    const fade = numberAttr(this, 'ui-edge-fade', 0, 0, 1);
    this.svg.style.maskImage = fade > 0 && shape !== 'circle'
      ? `linear-gradient(to right, transparent, black ${Math.round(fade * 30)}%, black ${Math.round(100 - fade * 30)}%, transparent)` : '';
    this.svg.style.webkitMaskImage = this.svg.style.maskImage;
    this.offset = this.wrap(this.offset);
    this.applyOffset();
    this.setAttribute('data-ready', '');
    this.wake();
  }

  /** Resume the automatic loop after a manual pause. */
  play(): void { this.removeAttribute('ui-paused'); this.wake(); }
  /** Pause the automatic loop without removing the component. */
  pause(): void { this.setAttribute('ui-paused', ''); this.stop(); }

  private get shape(): CurvedLoopShape {
    const value = this.getAttribute('ui-shape');
    return value === 'wave' || value === 'circle' || value === 'line' ? value : 'arc';
  }

  private createMarkup(): void {
    this.authoredText = this.textContent?.trim() || 'CURVED LOOP';
    this.source = document.createElement('span');
    this.source.className = 'ui-curved-loop__source';
    this.svg = svgElement('svg');
    this.svg.classList.add('ui-curved-loop__svg');
    this.svg.setAttribute('aria-hidden', 'true');
    const defs = svgElement('defs');
    this.path = svgElement('path');
    this.path.id = this.pathId;
    defs.append(this.path);
    this.measure = svgElement('text');
    this.measure.setAttribute('visibility', 'hidden');
    this.ribbon = svgElement('textPath');
    this.ribbon.setAttribute('href', `#${this.pathId}`);
    this.textNode = svgElement('text');
    this.textNode.append(this.ribbon);
    this.circleGroup = svgElement('g');
    this.circleGroup.classList.add('ui-curved-loop__circle');
    this.svg.append(defs, this.measure, this.textNode, this.circleGroup);
    this.replaceChildren(this.source, this.svg);
  }

  private buildCircle(text: string, separator: string, width: number, height: number, fontSize: number,
    weight: number, spacing: number, family: string, outline: boolean): void {
    const group = this.circleGroup!;
    const circleFontSize = Math.max(18, fontSize * .76);
    const radius = Math.min(width * .23, height * .32);
    const circumference = 2 * Math.PI * radius;
    const repeats = Math.max(1, Math.round(circumference / this.unitLength));
    const segment = (value: string): string[] => typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)].map((part) => part.segment)
      : Array.from(value);
    const characters = [...segment(text).map((char) => ({ char, separator: false })),
      ...segment(separator ? ` ${separator} ` : '  ').map((char) => ({ char, separator: true }))];
    const context = document.createElement('canvas').getContext('2d');
    if (context) context.font = `${weight} ${circleFontSize}px ${family}`;
    const fallbackWidth = this.unitLength / Math.max(1, characters.length);
    const advances = characters.map(({ char }) => Math.max(1, (context?.measureText(char).width ?? fallbackWidth) + spacing));
    const unitAdvance = advances.reduce((sum, advance) => sum + advance, 0);
    const fit = circumference / Math.max(1, unitAdvance * repeats);
    this.circlePeriod = circumference / repeats;
    this.circleRadius = radius;
    this.circleCenter = { x: width / 2, y: height / 2 };
    group.replaceChildren();
    group.setAttribute('font-family', family);
    group.setAttribute('font-size', String(circleFontSize));
    group.setAttribute('font-weight', String(weight));
    let distance = 0;
    for (let repeat = 0; repeat < repeats; repeat++) {
      for (const [index, { char, separator: isSeparator }] of characters.entries()) {
        const advance = advances[index]! * fit;
        if (char.trim()) {
          const angle = -Math.PI / 2 + (distance + advance / 2) / radius;
          const x = this.circleCenter.x + Math.cos(angle) * radius;
          const y = this.circleCenter.y + Math.sin(angle) * radius;
          const glyph = svgElement('text');
          glyph.textContent = char;
          glyph.setAttribute('x', String(x));
          glyph.setAttribute('y', String(y));
          glyph.setAttribute('text-anchor', 'middle');
          glyph.setAttribute('dominant-baseline', 'central');
          glyph.setAttribute('transform', `rotate(${(angle + Math.PI / 2) * 180 / Math.PI} ${x} ${y})`);
          glyph.setAttribute('fill', isSeparator && separator ? 'var(--ui-curved-loop-separator-color, currentColor)' : outline ? 'none' : 'currentColor');
          glyph.setAttribute('stroke', isSeparator && separator ? 'none' : outline ? 'currentColor' : 'none');
          glyph.setAttribute('stroke-width', outline && !isSeparator ? String(Math.max(1, circleFontSize * .025)) : '0');
          group.append(glyph);
        }
        distance += advance;
      }
    }
  }

  private applyOffset(): void {
    if (this.shape === 'circle') {
      const angle = this.offset / this.circleRadius * 180 / Math.PI;
      this.circleGroup?.setAttribute('transform', `rotate(${angle} ${this.circleCenter.x} ${this.circleCenter.y})`);
    } else this.ribbon?.setAttribute('startOffset', String(this.offset));
  }

  private wrap(value: number): number {
    const period = this.shape === 'circle' ? this.circlePeriod : this.unitLength;
    return period > 0 ? ((value % period) + period) % period - period : 0;
  }

  private onPointerEnter = (): void => { this.hovered = true; this.wake(); };
  private onPointerLeave = (): void => { this.hovered = false; this.wake(); };
  private onPointerDown = (event: PointerEvent): void => {
    if (!enabled(this, 'ui-interactive', true) || (event.pointerType === 'mouse' && event.button !== 0)) return;
    this.pointerId = event.pointerId;
    this.pointerX = event.clientX;
    this.pointerTime = performance.now();
    this.dragVelocity = 0;
    this.setPointerCapture?.(event.pointerId);
    this.wake();
  };
  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    const now = performance.now();
    const dx = event.clientX - this.pointerX;
    const dt = Math.max(.008, (now - this.pointerTime) / 1000);
    this.offset = this.wrap(this.offset + dx);
    this.applyOffset();
    this.dragVelocity = Math.max(-1800, Math.min(1800, dx / dt));
    this.pointerX = event.clientX;
    this.pointerTime = now;
  };
  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = -1;
    if (this.hasPointerCapture?.(event.pointerId)) this.releasePointerCapture(event.pointerId);
    this.fling = this.motionQuery?.matches ? 0 : this.dragVelocity;
    this.wake();
  };
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    this.offset = this.wrap(this.offset + (event.key === 'ArrowLeft' ? -30 : 30));
    this.applyOffset();
  };
  private onScroll = (): void => {
    const scrollY = window.scrollY;
    const delta = scrollY - this.lastScrollY;
    this.lastScrollY = scrollY;
    const boost = numberAttr(this, 'ui-scroll-boost', 0, 0, 10);
    if (!boost || !this.visible || this.motionQuery?.matches) return;
    this.scrollVelocity = Math.max(-1200, Math.min(1200, this.scrollVelocity + delta * boost * 8));
    this.wake();
  };
  private onVisibilityChange = (): void => { if (document.hidden) this.stop(); else this.wake(); };
  private onMotionChange = (): void => { if (this.motionQuery?.matches) this.stop(); else this.wake(); };

  private stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lastTime = 0;
  }

  private wake(): void {
    if (this.frame || !this.isConnected || !this.visible || document.hidden || this.motionQuery?.matches || this.hasAttribute('ui-paused')) return;
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    this.frame = 0;
    const dt = this.lastTime ? Math.min(.05, (now - this.lastTime) / 1000) : 1 / 60;
    this.lastTime = now;
    const speed = numberAttr(this, 'ui-speed', 2, 0, 10);
    const direction = this.getAttribute('ui-direction') === 'right' ? 1 : -1;
    const hovering = this.hovered && enabled(this, 'ui-pause-on-hover', false);
    const normal = this.pointerId >= 0 || hovering ? 0 : direction * speed * 36 * this.width / 1440;
    if (this.pointerId < 0) {
      this.offset = this.wrap(this.offset + (normal + this.fling + this.scrollVelocity) * dt);
      this.applyOffset();
    }
    this.fling *= Math.exp(-dt * 3.4);
    this.scrollVelocity *= Math.exp(-dt * 5);
    if (normal || Math.abs(this.fling) > .4 || Math.abs(this.scrollVelocity) > .4 || this.pointerId >= 0) this.wake();
    else this.lastTime = 0;
  };
}

define('ui-curved-loop', UiCurvedLoop);

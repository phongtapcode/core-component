import { define } from '@element-works/core';

type GalleryImage = { item: HTMLElement; image: HTMLImageElement };

const numberAttribute = (element: Element, name: string, fallback: number, min: number, max: number): number => {
  const value = Number(element.getAttribute(name));
  return element.hasAttribute(name) && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
};
const hash = (value: number): number => {
  const x = Math.sin(value * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
const smooth = (value: number): number => {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
};

/** Advance the dissolve front from the outer edge of a card toward its inner edge. */
export const directionalTileProgress = (dissolve: number, column: number, columns: number, outward: number, jitter = 0): number => {
  const position = (column + .5) / Math.max(1, columns);
  const inward = outward < 0 ? position : 1 - position;
  const threshold = .02 + inward * .74 + jitter * .04;
  return smooth((dissolve - threshold) / .22);
};

/** Infinite image strip whose cards dissolve into image tiles near the viewport edges. */
export class UiDisintegratingGallery extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-speed', 'ui-cell-size', 'ui-scatter', 'ui-card-width', 'ui-card-height', 'ui-gap']; }

  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private images: GalleryImage[] = [];
  private observer: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private controller: AbortController | null = null;
  private media: MediaQueryList | null = null;
  private frame = 0;
  private lastTime = 0;
  private offset = 0;
  private velocity = 0;
  private pointerId: number | null = null;
  private startX = 0;
  private lastX = 0;
  private lastPointerTime = 0;
  private dragged = false;
  private suppressClick = false;
  private visible = true;
  private activeIndex = -1;
  private addedTabIndex = false;

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    if (!this.hasAttribute('tabindex')) { this.tabIndex = 0; this.addedTabIndex = true; }
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'ui-disintegrating-gallery__canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.append(this.canvas);
    this.context = this.canvas.getContext('2d');
    this.observer = new MutationObserver(() => this.syncImages());
    this.observer.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'sizes'] });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(([entry]) => {
        this.visible = Boolean(entry?.isIntersecting);
        if (this.visible) this.start(); else this.stop();
      });
      this.intersectionObserver.observe(this);
    }
    this.media = matchMedia('(prefers-reduced-motion: reduce)');
    this.media.addEventListener?.('change', this.onMotionChange, { signal });
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerup', this.onPointerUp, { signal });
    this.addEventListener('pointercancel', this.onPointerCancel, { signal });
    this.addEventListener('lostpointercapture', this.onPointerCancel, { signal });
    this.addEventListener('wheel', this.onWheel, { passive: false, signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    this.addEventListener('click', this.onClick, { capture: true, signal });
    this.addEventListener('dragstart', (event) => event.preventDefault(), { signal });
    document.addEventListener('visibilitychange', this.onVisibilityChange, { signal });
    this.syncImages();
    this.resize();
    this.start();
  }

  disconnectedCallback(): void {
    this.stop();
    this.controller?.abort(); this.controller = null;
    this.observer?.disconnect(); this.observer = null;
    this.resizeObserver?.disconnect(); this.resizeObserver = null;
    this.intersectionObserver?.disconnect(); this.intersectionObserver = null;
    this.images.forEach(({ image }) => { image.removeEventListener('load', this.onImageChange); image.removeEventListener('error', this.onImageChange); });
    this.images = [];
    this.canvas?.remove(); this.canvas = null; this.context = null;
    this.removeAttribute('data-ready'); this.removeAttribute('data-dragging');
    if (this.addedTabIndex) { this.removeAttribute('tabindex'); this.addedTabIndex = false; }
    this.pointerId = null; this.lastTime = 0;
  }

  attributeChangedCallback(): void {
    this.resize(); this.draw();
    if (numberAttribute(this, 'ui-speed', 40, -300, 300) || this.velocity) this.start(); else this.stop();
  }

  /** Move the strip by CSS pixels; useful for external controls. */
  moveBy(pixels: number): void {
    if (!Number.isFinite(pixels)) return;
    this.offset += pixels;
    this.normalizeOffset();
    this.draw();
  }

  private syncImages(): void {
    const next = [...this.querySelectorAll<HTMLElement>('ui-disintegrating-gallery-item')]
      .map((item) => ({ item, image: item.querySelector('img') }))
      .filter((entry): entry is GalleryImage => entry.image instanceof HTMLImageElement);
    this.images.forEach(({ image }) => {
      if (!next.some((entry) => entry.image === image)) {
        image.removeEventListener('load', this.onImageChange);
        image.removeEventListener('error', this.onImageChange);
      }
    });
    next.forEach(({ image }) => {
      if (!this.images.some((entry) => entry.image === image)) {
        image.addEventListener('load', this.onImageChange);
        image.addEventListener('error', this.onImageChange);
      }
    });
    this.images = next;
    this.normalizeOffset();
    this.onImageChange();
  }

  private onImageChange = (): void => {
    const ready = Boolean(this.context && this.images.length && this.images.every(({ image }) => image.complete && image.naturalWidth > 0));
    this.toggleAttribute('data-ready', ready);
    this.draw();
    if (ready) this.start(); else this.stop();
  };

  private get metrics(): { width: number; height: number; cardWidth: number; cardHeight: number; gap: number; period: number } {
    const width = this.clientWidth;
    const height = this.clientHeight;
    const cardWidth = Math.min(numberAttribute(this, 'ui-card-width', 280, 80, 800), Math.max(80, width * .72));
    const cardHeight = Math.min(numberAttribute(this, 'ui-card-height', 360, 80, 800), Math.max(80, height - 16));
    const gap = numberAttribute(this, 'ui-gap', 28, 0, 200);
    return { width, height, cardWidth, cardHeight, gap, period: this.images.length * (cardWidth + gap) };
  }

  private normalizeOffset(): void {
    const { period } = this.metrics;
    if (period > 0) this.offset = ((this.offset % period) + period) % period;
  }

  private resize(): void {
    if (!this.canvas || !this.context) return;
    const { width, height } = this.metrics;
    if (!width || !height) return;
    const scale = Math.min(devicePixelRatio || 1, 2, Math.sqrt(3_000_000 / (width * height)));
    this.canvas.width = Math.max(1, Math.round(width * scale));
    this.canvas.height = Math.max(1, Math.round(height * scale));
    this.context.setTransform(scale, 0, 0, scale, 0, 0);
    this.normalizeOffset();
    this.draw();
  }

  private start(): void {
    if (!this.frame && this.isConnected && this.visible && !document.hidden && this.context &&
      this.hasAttribute('data-ready') && !this.media?.matches &&
      (numberAttribute(this, 'ui-speed', 40, -300, 300) !== 0 || Math.abs(this.velocity) >= 1)) {
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  private stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lastTime = 0;
  }

  private tick = (now: number): void => {
    this.frame = 0;
    const dt = this.lastTime ? Math.min(50, now - this.lastTime) : 0;
    this.lastTime = now;
    if (dt && this.pointerId === null) {
      const reduced = this.media?.matches ?? false;
      if (!reduced) {
        this.offset += (numberAttribute(this, 'ui-speed', 40, -300, 300) + this.velocity) * dt / 1000;
        this.velocity *= Math.exp(-dt / 650);
        if (Math.abs(this.velocity) < 1) this.velocity = 0;
        this.normalizeOffset();
      }
    }
    this.draw();
    this.start();
    if (!this.frame) this.lastTime = 0;
  };

  private draw(): void {
    const ctx = this.context;
    if (!ctx || !this.hasAttribute('data-ready')) return;
    const { width, height, cardWidth, cardHeight, gap, period } = this.metrics;
    if (!width || !height || !period) return;
    ctx.clearRect(0, 0, width, height);
    const center = width / 2;
    const step = cardWidth + gap;
    const cell = numberAttribute(this, 'ui-cell-size', 12, 4, 48);
    const scatter = numberAttribute(this, 'ui-scatter', 140, 0, 400);
    const firstCycle = Math.floor((this.offset - center - cardWidth) / period);
    const lastCycle = Math.ceil((this.offset + width / 2 + cardWidth) / period);
    for (let cycle = firstCycle; cycle <= lastCycle; cycle++) {
      this.images.forEach(({ image }, index) => {
        const x = center - cardWidth / 2 + index * step + cycle * period - this.offset;
        if (x > width + scatter || x + cardWidth < -scatter) return;
        const y = (height - cardHeight) / 2;
        const distance = Math.abs(x + cardWidth / 2 - center) / Math.max(center, 1);
        const dissolve = smooth((distance - .28) / .78);
        const sourceRatio = Math.max(cardWidth / image.naturalWidth, cardHeight / image.naturalHeight);
        const sw = cardWidth / sourceRatio;
        const sh = cardHeight / sourceRatio;
        const sx = (image.naturalWidth - sw) / 2;
        const sy = (image.naturalHeight - sh) / 2;
        if (dissolve < .008) {
          ctx.drawImage(image, sx, sy, sw, sh, x, y, cardWidth, cardHeight);
          return;
        }
        const cols = Math.ceil(cardWidth / cell);
        const rows = Math.ceil(cardHeight / cell);
        const outward = Math.sign(x + cardWidth / 2 - center) || 1;
        for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
          const dx = col * cell;
          const dy = row * cell;
          const tileW = Math.min(cell, cardWidth - dx);
          const tileH = Math.min(cell, cardHeight - dy);
          const seed = index * 100003 + row * 997 + col * 37;
          const variance = hash(seed) * 2 - 1;
          const progress = directionalTileProgress(dissolve, col, cols, outward, hash(seed + 31) - .5);
          if (progress >= 1) continue;
          const shiftX = outward * scatter * progress * (.25 + hash(seed + 7) * .9);
          const shiftY = variance * scatter * progress * .7;
          const scale = 1 - progress;
          const drawW = tileW * scale;
          const drawH = tileH * scale;
          ctx.globalAlpha = scale;
          ctx.drawImage(image, sx + dx / sourceRatio, sy + dy / sourceRatio, tileW / sourceRatio, tileH / sourceRatio,
            x + dx + shiftX + (tileW - drawW) / 2, y + dy + shiftY + (tileH - drawH) / 2, drawW, drawH);
        }
        ctx.globalAlpha = 1;
      });
    }
    const nearest = Math.round(this.offset / step) % this.images.length;
    if (nearest !== this.activeIndex) {
      this.activeIndex = nearest;
      this.dispatchEvent(new CustomEvent('ui:disintegrating-gallery:change', { bubbles: true, detail: { index: nearest, item: this.images[nearest]?.item } }));
    }
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    this.pointerId = event.pointerId;
    this.startX = this.lastX = event.clientX;
    this.lastPointerTime = event.timeStamp;
    this.velocity = 0;
    this.dragged = false;
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    if (!this.dragged && Math.abs(event.clientX - this.startX) < 5) return;
    if (!this.dragged) { this.dragged = true; this.setAttribute('data-dragging', ''); this.setPointerCapture?.(event.pointerId); }
    const dx = event.clientX - this.lastX;
    const dt = Math.max(1, event.timeStamp - this.lastPointerTime);
    this.offset -= dx;
    this.velocity = this.velocity * .4 + (-dx / dt * 1000) * .6;
    this.lastX = event.clientX;
    this.lastPointerTime = event.timeStamp;
    this.suppressClick = true;
    this.normalizeOffset(); this.draw();
    event.preventDefault();
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    if (this.hasPointerCapture?.(event.pointerId)) this.releasePointerCapture(event.pointerId);
    this.removeAttribute('data-dragging');
    if (event.timeStamp - this.lastPointerTime > 130) this.velocity *= Math.exp(-(event.timeStamp - this.lastPointerTime - 130) / 170);
    this.velocity = Math.max(-1600, Math.min(1600, this.velocity));
    if (this.media?.matches) this.velocity = 0;
    this.start();
  };

  private onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null; this.velocity = 0; this.removeAttribute('data-dragging');
  };

  private onWheel = (event: WheelEvent): void => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!delta) return;
    event.preventDefault();
    this.moveBy(delta);
    this.velocity = this.media?.matches ? 0 : Math.max(-900, Math.min(900, delta * 8));
    this.start();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== this || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault(); this.velocity = 0;
    this.moveBy((event.key === 'ArrowRight' ? 1 : -1) * (this.metrics.cardWidth + this.metrics.gap));
  };

  private onClick = (event: MouseEvent): void => {
    if (!this.suppressClick) return;
    event.preventDefault(); event.stopImmediatePropagation(); this.suppressClick = false;
  };
  private onMotionChange = (): void => {
    if (this.media?.matches) { this.velocity = 0; this.stop(); } else this.start();
    this.draw();
  };
  private onVisibilityChange = (): void => { if (document.hidden) this.stop(); else this.start(); };
}

export class UiDisintegratingGalleryItem extends HTMLElement {}

define('ui-disintegrating-gallery', UiDisintegratingGallery);
define('ui-disintegrating-gallery-item', UiDisintegratingGalleryItem);

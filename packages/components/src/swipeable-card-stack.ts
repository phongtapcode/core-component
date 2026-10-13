/** Swipe a card away to reveal the next card without reordering its DOM nodes. */
import { define } from '@ui/core';

type SwipeDirection = 'left' | 'right';
type StackStyle = 1 | 2 | 3;

interface CardOriginal {
  transform: string;
  opacity: string;
  zIndex: string;
  pointerEvents: string;
  ariaHidden: string | null;
  inert: boolean;
}

const EASINGS: Record<string, string> = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'cubic-bezier(.42,0,1,1)',
  easeOut: 'cubic-bezier(0,0,.58,1)',
  easeInOut: 'cubic-bezier(.42,0,.58,1)',
  spring: 'cubic-bezier(.18,1.32,.42,1)',
  decay: 'cubic-bezier(.2,.76,.2,1)',
};

function numberAttribute(host: Element, name: string, fallback: number, min: number, max: number): number {
  const value = Number(host.getAttribute(name));
  return host.hasAttribute(name) && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export class UiSwipeableCardStack extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-items-to-show', 'ui-scale-threshold', 'ui-speed', 'ui-easing', 'ui-style']; }

  private abort: AbortController | null = null;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private originals = new Map<HTMLElement, CardOriginal>();
  private currentIndex = 0;
  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private dx = 0;
  private dy = 0;
  private dragging = false;
  private animating = false;
  private suppressClick = false;
  private animationTimer = 0;
  private clickTimer = 0;
  private finishAnimation: (() => void) | null = null;
  private retiringItem: HTMLElement | null = null;

  get items(): HTMLElement[] { return [...this.children].filter((child): child is HTMLElement => child instanceof HTMLElement); }
  get activeIndex(): number { return this.currentIndex; }

  connectedCallback(): void {
    if (this.abort) return;
    this.abort = new AbortController();
    const signal = this.abort.signal;
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    window.addEventListener('pointermove', this.onPointerMove, { signal });
    window.addEventListener('pointerup', this.onPointerUp, { signal });
    window.addEventListener('pointercancel', this.onPointerCancel, { signal });
    this.addEventListener('click', this.onClick, { capture: true, signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    this.addEventListener('dragstart', this.onDragStart, { signal });
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    if (!this.hasAttribute('aria-roledescription')) this.setAttribute('aria-roledescription', 'card stack');
    this.mutationObserver = new MutationObserver(() => this.refresh());
    this.mutationObserver.observe(this, { childList: true });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateHeight());
    }
    this.refresh();
  }

  disconnectedCallback(): void {
    this.abort?.abort();
    this.abort = null;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    clearTimeout(this.animationTimer);
    clearTimeout(this.clickTimer);
    this.finishAnimation?.();
    this.finishAnimation = null;
    this.retiringItem?.removeAttribute('data-retiring');
    this.retiringItem = null;
    this.pointerId = null;
    this.dragging = false;
    this.animating = false;
    this.removeAttribute('data-dragging');
    this.removeAttribute('data-animating');
    this.style.removeProperty('--ui-stack-height');
    this.style.removeProperty('--ui-stack-duration');
    this.style.removeProperty('--ui-stack-easing');
    for (const [item, original] of this.originals) this.restore(item, original);
    this.originals.clear();
  }

  attributeChangedCallback(): void { if (this.isConnected) this.refresh(); }

  /** Recount direct children and recalculate their layer styles. */
  refresh(): void {
    const items = this.items;
    for (const [item, original] of this.originals) {
      if (!items.includes(item)) {
        this.resizeObserver?.unobserve(item);
        this.restore(item, original);
        this.originals.delete(item);
      }
    }
    items.forEach((item) => {
      if (this.originals.has(item)) return;
      this.originals.set(item, {
        transform: item.style.transform,
        opacity: item.style.opacity,
        zIndex: item.style.zIndex,
        pointerEvents: item.style.pointerEvents,
        ariaHidden: item.getAttribute('aria-hidden'),
        inert: item.inert,
      });
      this.resizeObserver?.observe(item);
    });
    if (this.currentIndex >= items.length) this.currentIndex = 0;
    this.style.setProperty('--ui-stack-duration', `${this.speed}ms`);
    this.style.setProperty('--ui-stack-easing', EASINGS[this.getAttribute('ui-easing') ?? 'spring'] ?? EASINGS['spring']!);
    this.render(this.dragging ? this.dx : 0, this.dragging ? this.dy : 0,
      this.dragging ? Math.min(1, Math.abs(this.dx) / Math.max(1, this.cardWidth * .55)) : 0);
    this.updateHeight();
  }

  swipeLeft(): Promise<void> { return this.swipe('left'); }
  swipeRight(): Promise<void> { return this.swipe('right'); }

  async goTo(index: number): Promise<void> {
    const count = this.items.length;
    if (!Number.isInteger(index) || index < 0 || index >= count || count < 2) return;
    if (this.animating) await new Promise<void>((resolve) => {
      const previous = this.finishAnimation;
      this.finishAnimation = () => { previous?.(); resolve(); };
    });
    let remaining = (index - this.currentIndex + count) % count;
    while (remaining-- > 0 && this.isConnected) await this.swipe('left');
  }

  private get speed(): number { return numberAttribute(this, 'ui-speed', 600, 0, 10_000); }
  private get itemsToShow(): number { return Math.floor(numberAttribute(this, 'ui-items-to-show', 5, 1, 100)); }
  private get scaleThreshold(): number { return numberAttribute(this, 'ui-scale-threshold', .1, 0, .35); }
  private get reducedMotion(): boolean { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; }
  private get cardWidth(): number { return this.items[this.currentIndex]?.getBoundingClientRect().width || this.clientWidth || 300; }
  private get cardHeight(): number { return this.items[this.currentIndex]?.getBoundingClientRect().height || this.clientHeight || 400; }
  private get stackStyle(): StackStyle {
    const attribute = this.getAttribute('ui-style');
    if (attribute === '2' || this.classList.contains('ui-swipeable-card-stack--style-2')) return 2;
    if (attribute === '3' || this.classList.contains('ui-swipeable-card-stack--style-3')) return 3;
    return 1;
  }

  private updateHeight(): void {
    const height = this.items[this.currentIndex]?.getBoundingClientRect().height ?? 0;
    if (height > 0) this.style.setProperty('--ui-stack-height', `${height}px`);
  }

  private restore(item: HTMLElement, original: CardOriginal): void {
    item.style.transform = original.transform;
    item.style.opacity = original.opacity;
    item.style.zIndex = original.zIndex;
    item.style.pointerEvents = original.pointerEvents;
    item.style.removeProperty('--ui-layer');
    item.style.removeProperty('--ui-interpolated');
    item.toggleAttribute('ui-active', false);
    item.removeAttribute('data-retiring');
    if (original.ariaHidden === null) item.removeAttribute('aria-hidden');
    else item.setAttribute('aria-hidden', original.ariaHidden);
    item.inert = original.inert;
  }

  private layerTransform(layer: number, width: number, height: number): string {
    const scale = Math.max(.45, 1 - this.scaleThreshold * layer);
    const style = this.stackStyle;
    const x = style === 1 ? layer * width * .1
      : style === 3 ? (Math.ceil(layer) % 2 ? 1 : -1) * Math.min(layer * width * .1, 48) : 0;
    const y = style === 2 ? layer * height * .1 : 0;
    const rotate = style === 3 ? (Math.ceil(layer) % 2 ? 1 : -1) * Math.min(layer * 5, 12) : 0;
    return `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
  }

  private render(dx: number, dy: number, progress: number): void {
    const items = this.items;
    const count = items.length;
    if (!count) return;
    const width = this.cardWidth;
    const height = this.cardHeight;
    const shown = Math.min(count, this.itemsToShow);
    items.forEach((item, index) => {
      const layer = (index - this.currentIndex + count) % count;
      const adjusted = Math.max(0, layer - progress);
      const scale = Math.max(.45, 1 - this.scaleThreshold * adjusted);
      const visible = layer < shown || (layer === shown && progress > 0);
      item.style.setProperty('--ui-layer', String(adjusted));
      item.style.setProperty('--ui-interpolated', String(scale));
      item.style.zIndex = String(count - layer);
      item.style.opacity = visible ? (layer === shown ? String(progress) : '1') : '0';
      item.style.pointerEvents = layer === 0 ? 'auto' : 'none';
      item.toggleAttribute('ui-active', layer === 0);
      item.setAttribute('aria-hidden', layer === 0 ? 'false' : 'true');
      item.inert = layer !== 0;
      if (layer === 0) {
        const tiltX = Math.max(-16, Math.min(16, -dy / Math.max(1, height) * 30));
        const tiltY = Math.max(-18, Math.min(18, -dx / Math.max(1, width) * 18));
        item.style.transform = `translate3d(${dx}px, ${dy}px, 0) perspective(${height * 2}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      } else item.style.transform = this.layerTransform(adjusted, width, height);
    });
  }

  private swipe(direction: SwipeDirection): Promise<void> {
    if (this.animating || this.dragging || this.items.length < 2) return Promise.resolve();
    return this.animateOut(direction);
  }

  private animateOut(direction: SwipeDirection): Promise<void> {
    const items = this.items;
    if (items.length < 2) return Promise.resolve();
    this.animating = true;
    this.dragging = false;
    this.removeAttribute('data-dragging');
    this.setAttribute('data-animating', '');
    const duration = this.reducedMotion ? 0 : this.speed;
    this.style.setProperty('--ui-stack-duration', `${duration}ms`);
    this.render(0, 0, 0);
    return new Promise<void>((resolve) => {
      let finished = false;
      this.finishAnimation = () => {
        if (finished) return;
        finished = true;
        clearTimeout(this.animationTimer);
        const previousIndex = this.currentIndex;
        if (this.isConnected) {
          if (this.items[previousIndex]?.contains(document.activeElement)) this.focus();
          this.currentIndex = (previousIndex + 1) % this.items.length;
          this.removeAttribute('data-animating');
          this.animating = false;
          this.render(0, 0, 0);
          this.updateHeight();
          this.dispatchEvent(new CustomEvent('ui:swipeable-card-stack:change', {
            bubbles: true,
            detail: { activeIndex: this.currentIndex, previousIndex, item: this.items[this.currentIndex], direction },
          }));
        }
        this.finishAnimation = null;
        resolve();
      };
      if (duration === 0) {
        this.finishAnimation();
        return;
      }
      // Read the starting transform before moving the card so CSS transitions always run.
      items[this.currentIndex]?.getBoundingClientRect();
      requestAnimationFrame(() => {
        if (!this.isConnected || !this.animating) return;
        this.render((direction === 'left' ? -1 : 1) * this.cardWidth * 1.35, 0, 1);
      });
      this.animationTimer = window.setTimeout(() => this.finishAnimation?.(), duration);
    });
  }

  private settleDraggedCard(direction: SwipeDirection): void {
    const items = this.items;
    const previousIndex = this.currentIndex;
    const outgoing = items[previousIndex];
    if (!outgoing || items.length < 2) return;

    this.animating = true;
    this.setAttribute('data-animating', '');
    const duration = this.reducedMotion ? 0 : this.speed;
    this.style.setProperty('--ui-stack-duration', `${duration}ms`);
    // Commit the dragged position while transitions are disabled. Once the
    // card is behind its siblings, CSS moves it directly from that position
    // into the final layer, as in the original stack interaction.
    outgoing.getBoundingClientRect();
    this.retiringItem = outgoing;
    outgoing.setAttribute('data-retiring', '');
    if (outgoing.contains(document.activeElement)) this.focus();
    this.currentIndex = (previousIndex + 1) % items.length;
    this.removeAttribute('data-dragging');
    this.render(0, 0, 0);
    this.updateHeight();
    this.dispatchEvent(new CustomEvent('ui:swipeable-card-stack:change', {
      bubbles: true,
      detail: { activeIndex: this.currentIndex, previousIndex, item: items[this.currentIndex], direction },
    }));

    this.finishAnimation = () => {
      clearTimeout(this.animationTimer);
      outgoing.removeAttribute('data-retiring');
      if (this.retiringItem === outgoing) this.retiringItem = null;
      if (this.isConnected) this.render(0, 0, 0);
      this.removeAttribute('data-animating');
      this.animating = false;
      this.finishAnimation = null;
    };
    if (duration === 0) this.finishAnimation();
    else this.animationTimer = window.setTimeout(() => this.finishAnimation?.(), duration);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.animating || this.pointerId !== null || event.button !== 0 || this.items.length < 2) return;
    const target = event.target;
    if (target instanceof Element && target.closest('a, button, input, select, textarea, [contenteditable="true"]')) return;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startTime = performance.now();
    this.dx = 0;
    this.dy = 0;
    this.dragging = false;
    try { this.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.pointerId === null || event.pointerId !== this.pointerId) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (!this.dragging) {
      if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
      this.dragging = true;
      this.setAttribute('data-dragging', '');
    }
    if (event.cancelable) event.preventDefault();
    this.dx = Math.max(-this.cardWidth, Math.min(this.cardWidth, dx));
    this.dy = Math.max(-50, Math.min(50, dy));
    this.render(this.dx, this.dy, Math.min(1, Math.abs(this.dx) / Math.max(1, this.cardWidth * .55)));
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (this.pointerId === null || event.pointerId !== this.pointerId) return;
    const dragged = this.dragging;
    const dx = this.dx;
    const dy = this.dy;
    this.pointerId = null;
    try { this.releasePointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    if (!dragged) return;
    this.suppressClick = true;
    clearTimeout(this.clickTimer);
    this.clickTimer = window.setTimeout(() => { this.suppressClick = false; }, 250);
    const elapsed = Math.max(1, performance.now() - this.startTime);
    const shouldSwipe = Math.abs(dx) >= this.cardWidth * .25 || (Math.abs(dx) > 24 && Math.abs(dx) / elapsed > .5);
    this.dragging = false;
    if (shouldSwipe) this.settleDraggedCard(dx < 0 ? 'left' : 'right');
    else {
      this.removeAttribute('data-dragging');
      this.render(0, 0, 0);
    }
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    if (this.pointerId === null || event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.dragging = false;
    this.removeAttribute('data-dragging');
    this.render(0, 0, 0);
  };

  private readonly onClick = (event: MouseEvent): void => {
    if (!this.suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.suppressClick = false;
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== this) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); void this.swipeLeft(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); void this.swipeRight(); }
  };

  private readonly onDragStart = (event: DragEvent): void => { event.preventDefault(); };
}

define('ui-swipeable-card-stack', UiSwipeableCardStack);

/**
 * Unified Pointer Events drag and swipe controller.
 * Supports touch, mouse, pointer capture, click suppression, RTL, velocity flicks, and vertical axes.
 */

export interface DragControllerOptions {
  host: HTMLElement;
  enabled: boolean;
  vertical: boolean;
  rtl: boolean;
  threshold?: number;
  onDragStart?: () => void;
  onDragMove?: (deltaPx: number) => void;
  onDragEnd?: (direction: 'next' | 'prev' | 'none', deltaPx: number) => void;
}

export class DragController {
  #options: DragControllerOptions;
  #isDown = false;
  #hasDragged = false;
  #startX = 0;
  #startY = 0;
  #startTime = 0;
  #currentDelta = 0;
  #pointerId: number | null = null;
  #threshold: number;
  #hostCleanup: (() => void)[] = [];
  #windowCleanup: (() => void)[] = [];

  constructor(options: DragControllerOptions) {
    this.#options = options;
    this.#threshold = options.threshold ?? 8;
    this.#attach();
  }

  updateOptions(options: Partial<DragControllerOptions>): void {
    this.#options = { ...this.#options, ...options };
    if (options.threshold !== undefined) this.#threshold = options.threshold;
  }

  destroy(): void {
    this.#removeWindowListeners();
    for (const off of this.#hostCleanup) off();
    this.#hostCleanup = [];
    this.#options.host.removeAttribute('data-dragging');
  }

  #attach(): void {
    const host = this.#options.host;

    // Prevent default HTML5 drag on images and text inside carousel
    const onDragStart = (e: DragEvent): void => {
      e.preventDefault();
    };

    const onPointerDown = (e: PointerEvent): void => {
      if (!this.#options.enabled) return;
      // Only primary mouse button or touch/pen
      if (e.button !== 0) return;

      // Don't drag when clicking interactive subcomponents directly
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          'ui-carousel-prev, ui-carousel-next, core-carousel-prev, core-carousel-next, ui-carousel-bullet, core-carousel-bullet, ui-carousel-thumbnail, ui-carousel-trigger, core-carousel-trigger, button, input, select, textarea',
        )
      ) {
        return;
      }

      this.#isDown = true;
      this.#hasDragged = false;
      this.#pointerId = e.pointerId;
      this.#startX = e.clientX;
      this.#startY = e.clientY;
      this.#startTime = performance.now();
      this.#currentDelta = 0;

      try {
        host.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }

      this.#addWindowListeners();
    };

    host.addEventListener('pointerdown', onPointerDown);
    host.addEventListener('dragstart', onDragStart);

    this.#hostCleanup.push(() => {
      host.removeEventListener('pointerdown', onPointerDown);
      host.removeEventListener('dragstart', onDragStart);
    });
  }

  #addWindowListeners(): void {
    this.#removeWindowListeners();

    const win = this.#options.host.ownerDocument.defaultView ?? window;

    const onPointerMove = (e: PointerEvent): void => {
      if (!this.#isDown) return;
      if (this.#pointerId !== null && e.pointerId !== this.#pointerId) return;

      const deltaX = e.clientX - this.#startX;
      const deltaY = e.clientY - this.#startY;
      const isVertical = this.#options.vertical;
      const primaryDelta = isVertical ? deltaY : deltaX;

      if (!this.#hasDragged) {
        // Check axis intent: only activate drag if movement along carousel axis exceeds cross axis
        const isPrimaryAxis = isVertical
          ? Math.abs(deltaY) >= Math.abs(deltaX)
          : Math.abs(deltaX) >= Math.abs(deltaY);

        if (isPrimaryAxis && Math.abs(primaryDelta) >= this.#threshold) {
          this.#hasDragged = true;
          this.#options.host.setAttribute('data-dragging', '');
          this.#options.onDragStart?.();
        }
      }

      if (this.#hasDragged) {
        this.#currentDelta = primaryDelta;
        this.#options.onDragMove?.(primaryDelta);
      }
    };

    const onPointerUp = (e: PointerEvent): void => {
      if (!this.#isDown) return;
      if (this.#pointerId !== null && e.pointerId !== this.#pointerId) return;

      this.#isDown = false;
      const pointerId = this.#pointerId;
      this.#pointerId = null;

      if (pointerId !== null) {
        try {
          this.#options.host.releasePointerCapture(pointerId);
        } catch {
          // Safe fallback
        }
      }

      this.#removeWindowListeners();

      if (this.#hasDragged) {
        this.#options.host.removeAttribute('data-dragging');

        const duration = Math.max(1, performance.now() - this.#startTime);
        const velocity = Math.abs(this.#currentDelta) / duration; // px per ms
        const isFlick = velocity > 0.3 && Math.abs(this.#currentDelta) >= 15;
        const isDistanceTrigger = Math.abs(this.#currentDelta) >= 35;

        let direction: 'next' | 'prev' | 'none' = 'none';

        if (isFlick || isDistanceTrigger) {
          if (this.#options.vertical) {
            direction = this.#currentDelta < 0 ? 'next' : 'prev';
          } else if (this.#options.rtl) {
            direction = this.#currentDelta < 0 ? 'prev' : 'next';
          } else {
            direction = this.#currentDelta < 0 ? 'next' : 'prev';
          }
        }

        this.#options.onDragEnd?.(direction, this.#currentDelta);
      }
    };

    const onPointerCancel = (e: PointerEvent): void => {
      if (!this.#isDown) return;
      if (this.#pointerId !== null && e.pointerId !== this.#pointerId) return;

      this.#isDown = false;
      const pointerId = this.#pointerId;
      this.#pointerId = null;

      if (pointerId !== null) {
        try {
          this.#options.host.releasePointerCapture(pointerId);
        } catch {
          // Safe fallback
        }
      }

      this.#removeWindowListeners();

      if (this.#hasDragged) {
        this.#options.host.removeAttribute('data-dragging');
        this.#options.onDragEnd?.('none', 0);
      }
    };

    // Suppress accidental click on slide content when dragging occurred
    const onClickCapture = (e: MouseEvent): void => {
      if (this.#hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        requestAnimationFrame(() => {
          this.#hasDragged = false;
        });
      }
    };

    win.addEventListener('pointermove', onPointerMove, { passive: true });
    win.addEventListener('pointerup', onPointerUp);
    win.addEventListener('pointercancel', onPointerCancel);
    win.addEventListener('click', onClickCapture, true);

    this.#windowCleanup.push(() => {
      win.removeEventListener('pointermove', onPointerMove);
      win.removeEventListener('pointerup', onPointerUp);
      win.removeEventListener('pointercancel', onPointerCancel);
      win.removeEventListener('click', onClickCapture, true);
    });
  }

  #removeWindowListeners(): void {
    for (const off of this.#windowCleanup) off();
    this.#windowCleanup = [];
  }
}

import { define } from '@ui/core';

/** A soft pointer-following light that reveals an inert visual copy of authored text. */
export class UiTextSpotlight extends HTMLElement {
  private controller: AbortController | null = null;
  private observer: MutationObserver | null = null;
  private base: HTMLDivElement | null = null;
  private light: HTMLDivElement | null = null;
  private frame = 0;
  private x = 0;
  private y = 0;
  private targetX = 0;
  private targetY = 0;
  private positioned = false;
  private pointerInside = false;

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.refresh();
    this.observer = new MutationObserver((records) => {
      if (records.some((record) => record.target === this || this.base?.contains(record.target))) this.refresh();
    });
    this.observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true });
    this.addEventListener('pointerenter', this.onPointerMove, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerleave', this.onPointerLeave, { signal });
    this.addEventListener('focusin', this.onFocusIn, { signal });
    this.addEventListener('focusout', this.onFocusOut, { signal });
  }

  disconnectedCallback(): void {
    this.controller?.abort();
    this.controller = null;
    this.observer?.disconnect();
    this.observer = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.pointerInside = false;
    this.removeAttribute('data-spotlight-active');
  }

  /** Rebuild the decorative light layer after authored content changes. */
  refresh(): void {
    if (!this.base) {
      this.base = document.createElement('div');
      this.base.className = 'ui-text-spotlight__base';
      this.light = document.createElement('div');
      this.light.className = 'ui-text-spotlight__light';
      this.light.setAttribute('aria-hidden', 'true');
      this.light.setAttribute('inert', '');
      this.append(this.base, this.light);
    }
    for (const child of [...this.childNodes]) {
      if (child !== this.base && child !== this.light) this.base.append(child);
    }
    const visual = [...this.base.childNodes].map((child) => child.cloneNode(true));
    this.light!.replaceChildren(...visual);
    this.light!.querySelectorAll('[id], [name], [autofocus], [for]').forEach((element) => {
      element.removeAttribute('id');
      element.removeAttribute('name');
      element.removeAttribute('autofocus');
      element.removeAttribute('for');
    });
    this.light!.querySelectorAll<HTMLElement>('button, a, input, select, textarea, [tabindex]').forEach((element) => {
      element.tabIndex = -1;
      if (element instanceof HTMLButtonElement) element.type = 'button';
    });
  }

  private aim(clientX: number, clientY: number): void {
    const rect = this.getBoundingClientRect();
    this.targetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    this.targetY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    if (!this.positioned) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.positioned = true;
      this.style.setProperty('--ui-text-spotlight-x', `${this.x}px`);
      this.style.setProperty('--ui-text-spotlight-y', `${this.y}px`);
    }
    if (!this.frame) this.frame = requestAnimationFrame(this.paint);
    this.setAttribute('data-spotlight-active', '');
  }

  private readonly paint = (): void => {
    this.x += (this.targetX - this.x) * .28;
    this.y += (this.targetY - this.y) * .28;
    this.style.setProperty('--ui-text-spotlight-x', `${this.x}px`);
    this.style.setProperty('--ui-text-spotlight-y', `${this.y}px`);
    if (Math.abs(this.targetX - this.x) > .4 || Math.abs(this.targetY - this.y) > .4) {
      this.frame = requestAnimationFrame(this.paint);
    } else this.frame = 0;
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.pointerInside = true;
    this.aim(event.clientX, event.clientY);
  };

  private readonly onPointerLeave = (): void => {
    this.pointerInside = false;
    if (!this.contains(document.activeElement)) this.removeAttribute('data-spotlight-active');
  };

  private readonly onFocusIn = (event: FocusEvent): void => {
    if (!(event.target instanceof HTMLElement)) return;
    const rect = event.target.getBoundingClientRect();
    this.aim(rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  private readonly onFocusOut = (event: FocusEvent): void => {
    if (!this.pointerInside && !(event.relatedTarget instanceof Node && this.contains(event.relatedTarget))) {
      this.removeAttribute('data-spotlight-active');
    }
  };
}

define('ui-text-spotlight', UiTextSpotlight);

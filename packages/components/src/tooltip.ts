/** Short, non-interactive hint anchored to the first child of <ui-tooltip>. */
import { BaseElement, define } from '@ui/core';

type Side = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';
let nextId = 0;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

export class UiTooltipContent extends HTMLElement {}

export class UiTooltip extends BaseElement {
  static override get observedAttributes() {
    return ['ui-title', 'ui-placement', 'ui-animate', 'ui-duration', 'ui-offset', 'ui-mobile-disabled'];
  }

  private content: UiTooltipContent | undefined;
  private trigger: HTMLElement | undefined;
  private closeTimer: ReturnType<typeof setTimeout> | undefined;
  private openFrame: number | undefined;
  private touchOpen = false;
  private lastTouchTime = -Infinity;
  private previousDescribedBy: string | null = null;

  protected override onConnect(): void {
    this.$on(this, 'pointerenter', (event: PointerEvent) => {
      if (event.pointerType !== 'touch') this.show();
    });
    this.$on(this, 'pointerleave', (event: PointerEvent) => {
      if (event.pointerType !== 'touch') this.hide();
    });
    this.$on(this, 'focusin', () => {
      if (this.hasAttribute('ui-mobile-disabled') && Date.now() - this.lastTouchTime < 500) return;
      this.show();
    });
    this.$on(this, 'focusout', (event: FocusEvent) => {
      if (!this.contains(event.relatedTarget as Node | null)) this.hide();
    });
    this.$on(this, 'pointerdown', (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      this.lastTouchTime = Date.now();
      if (this.hasAttribute('ui-mobile-disabled')) return;
      this.touchOpen ? this.hide() : this.show(true);
    });
    this.$on(document, 'pointerdown', (event: PointerEvent) => {
      if (this.touchOpen && !this.contains(event.target as Node)) this.hide();
    });
    this.$on(document, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') this.hide();
    });
    this.$on(window, 'scroll', () => this.updatePosition(), { capture: true, passive: true });
    this.$on(window, 'resize', () => this.updatePosition());
  }

  protected override onDisconnect(): void {
    this.removeContent();
  }

  protected override onAttributeChanged(name: string): void {
    if (!this.content) return;
    if (name === 'ui-title') {
      const title = this.getAttribute('ui-title')?.trim();
      if (!title) { this.hide(); return; }
      this.content.textContent = title;
    }
    if (name === 'ui-mobile-disabled' && this.touchOpen && this.hasAttribute(name)) { this.hide(); return; }
    this.applyOptions();
    this.updatePosition();
  }

  show(fromTouch = false): void {
    const title = this.getAttribute('ui-title')?.trim();
    const trigger = this.firstElementChild as HTMLElement | null;
    if (!title || !trigger) return;
    if (fromTouch && this.hasAttribute('ui-mobile-disabled')) return;
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
    if (this.openFrame !== undefined) cancelAnimationFrame(this.openFrame);
    if (this.trigger && this.trigger !== trigger) this.restoreDescription();
    this.trigger = trigger;
    this.touchOpen = fromTouch;
    if (!this.content) {
      const content = document.createElement('ui-tooltip-content') as UiTooltipContent;
      content.id = `ui-tooltip-${++nextId}`;
      content.setAttribute('role', 'tooltip');
      document.body.append(content);
      this.content = content;
      this.previousDescribedBy = trigger.getAttribute('aria-describedby');
      trigger.setAttribute('aria-describedby', [this.previousDescribedBy, content.id].filter(Boolean).join(' '));
    }
    this.content.textContent = title;
    this.applyOptions();
    this.updatePosition();
    this.content.dataset['state'] = 'opening';
    this.openFrame = requestAnimationFrame(() => {
      this.openFrame = undefined;
      if (this.content) this.content.dataset['state'] = 'open';
    });
  }

  hide(): void {
    if (!this.content) return;
    this.touchOpen = false;
    if (this.openFrame !== undefined) cancelAnimationFrame(this.openFrame);
    this.openFrame = undefined;
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.content.dataset['state'] = 'closing';
    const duration = this.duration();
    if (duration === 0) this.removeContent();
    else this.closeTimer = setTimeout(() => this.removeContent(), duration);
  }

  updatePosition(): void {
    if (!this.content || !this.trigger) return;
    const anchor = this.trigger.getBoundingClientRect();
    const floating = this.content.getBoundingClientRect();
    const width = floating.width || this.content.offsetWidth;
    const height = floating.height || this.content.offsetHeight;
    const [rawSide = 'top', rawAlign = 'center'] = (this.getAttribute('ui-placement') ?? 'top-center').split('-');
    let side: Side = ['top', 'bottom', 'left', 'right'].includes(rawSide) ? rawSide as Side : 'top';
    const align: Align = ['start', 'center', 'end'].includes(rawAlign) ? rawAlign as Align : 'center';
    const offsetValue = Number(this.getAttribute('ui-offset'));
    const offset = this.hasAttribute('ui-offset') && Number.isFinite(offsetValue) ? Math.max(0, offsetValue) : 8;
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = document.documentElement.clientHeight || window.innerHeight;
    const room: Record<Side, number> = { top: anchor.top, bottom: vh - anchor.bottom, left: anchor.left, right: vw - anchor.right };
    const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    const required = side === 'top' || side === 'bottom' ? height : width;
    if (room[side] < required + offset && room[opposite[side]] > room[side]) side = opposite[side];
    const horizontal = side === 'top' || side === 'bottom';
    const x = horizontal
      ? align === 'start' ? anchor.left : align === 'end' ? anchor.right - width : anchor.left + (anchor.width - width) / 2
      : side === 'right' ? anchor.right + offset : anchor.left - width - offset;
    const y = horizontal
      ? side === 'bottom' ? anchor.bottom + offset : anchor.top - height - offset
      : align === 'start' ? anchor.top : align === 'end' ? anchor.bottom - height : anchor.top + (anchor.height - height) / 2;
    this.content.style.left = `${Math.round(clamp(x, 8, vw - width - 8))}px`;
    this.content.style.top = `${Math.round(clamp(y, 8, vh - height - 8))}px`;
    this.content.dataset['placement'] = side;
  }

  private duration(): number {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 0;
    const value = Number(this.getAttribute('ui-duration'));
    return this.hasAttribute('ui-duration') && Number.isFinite(value) ? clamp(value, 0, 10000) : 180;
  }

  private applyOptions(): void {
    if (!this.content) return;
    const effect = this.getAttribute('ui-animate') || 'fade';
    this.content.dataset['animate'] = ['fade', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'scale', 'none'].includes(effect) ? effect : 'fade';
    this.content.style.setProperty('--ui-tooltip-duration', `${this.duration()}ms`);
  }

  private restoreDescription(): void {
    if (!this.trigger) return;
    if (this.previousDescribedBy === null) this.trigger.removeAttribute('aria-describedby');
    else this.trigger.setAttribute('aria-describedby', this.previousDescribedBy);
    this.trigger = undefined;
    this.previousDescribedBy = null;
  }

  private removeContent(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
    if (this.openFrame !== undefined) cancelAnimationFrame(this.openFrame);
    this.openFrame = undefined;
    this.content?.remove();
    this.content = undefined;
    this.touchOpen = false;
    this.restoreDescription();
  }
}

define('ui-tooltip-content', UiTooltipContent);
define('ui-tooltip', UiTooltip);
export const tooltip = UiTooltip;

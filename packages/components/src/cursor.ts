/** Pointer-following cursor for <ui-cursor> and <div is="ui-cursor">. */
import { define } from '@ui/core';

type CursorItem = HTMLElement;
const activeItems = new WeakMap<CursorItem, CursorController>();
const areaControllers = new WeakMap<Element, CursorController>();

function names(raw: string | null): string[] {
  if (!raw) return [];
  const value = raw.trim();
  if (value.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value.replace(/'/g, '"'));
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string').slice(0, 2);
    } catch { /* Treat invalid arrays as one name. */ }
  }
  return [value];
}

function isOldSafari(): boolean {
  const ua = navigator.userAgent;
  if (!/Safari/i.test(ua) || /Chrome|Chromium|CriOS|Edg/i.test(ua)) return false;
  const version = Number(/Version\/(\d+)/.exec(ua)?.[1]);
  return Number.isFinite(version) && version > 0 && version <= 19;
}
const OLD_SAFARI = isOldSafari();

class CursorController {
  private abort = new AbortController();
  private frame: number | null = null;
  private currentX = 0;
  private currentY = 0;
  private targetX = 0;
  private targetY = 0;
  private previousX = 0;
  private previousY = 0;
  private item: CursorItem | null = null;
  private hoveringButton = false;
  private active = false;

  constructor(private area: HTMLElement) {
    const options = { signal: this.abort.signal };
    area.addEventListener('pointerenter', this.onEnter, options);
    area.addEventListener('pointermove', this.onMove, options);
    area.addEventListener('pointerleave', this.onLeave, options);
    area.addEventListener('pointercancel', this.onLeave, options);
    window.addEventListener('blur', this.deactivate, options);
    window.addEventListener('resize', this.onResize, options);
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.addEventListener?.('change', this.deactivate, options);
    window.matchMedia?.('(max-width: 767px), (pointer: coarse)')?.addEventListener?.('change', this.deactivate, options);
  }

  destroy(): void {
    this.abort.abort();
    this.deactivate();
    areaControllers.delete(this.area);
  }

  private disabledFor(event: PointerEvent): boolean {
    return event.pointerType === 'touch' ||
      (this.area.hasAttribute('ui-mobile-disabled') && window.matchMedia?.('(max-width: 767px), (pointer: coarse)').matches) ||
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  private findItem(name: string | undefined): CursorItem | null {
    const local = [...this.area.querySelectorAll<CursorItem>('ui-cursor-item')];
    if (!name) return local[0] ?? null;
    return local.find((item) => item.getAttribute('ui-name') === name) ??
      [...document.querySelectorAll<CursorItem>('ui-cursor-item')].find((item) => item.getAttribute('ui-name') === name) ?? null;
  }

  private chooseItem(clientX: number): CursorItem | null {
    const list = names(this.area.getAttribute('ui-name'));
    if (list.length < 2) return this.findItem(list[0]);
    const bounds = this.area.getBoundingClientRect();
    return this.findItem(clientX < bounds.left + bounds.width / 2 ? list[0] : list[1]);
  }

  private readonly onEnter = (event: PointerEvent): void => {
    if (this.disabledFor(event)) return;
    // Initialize at the pointer itself, avoiding a jump from the origin.
    this.currentX = this.targetX = this.previousX = event.clientX;
    this.currentY = this.targetY = this.previousY = event.clientY;
    this.updateTarget(event);
  };

  private readonly onMove = (event: PointerEvent): void => {
    if (this.disabledFor(event)) { this.deactivate(); return; }
    this.updateTarget(event);
  };

  private readonly onLeave = (): void => this.deactivate();
  private readonly onResize = (): void => { if (this.active) this.render(); };

  private updateTarget(event: PointerEvent): void {
    const target = event.target as Element | null;
    const disabled = !!target?.closest('[ui-cursor-disabled]');
    if (disabled) { this.deactivate(); return; }
    const item = this.chooseItem(event.clientX);
    if (!item || (activeItems.has(item) && activeItems.get(item) !== this)) { this.deactivate(); return; }
    this.targetX = event.clientX;
    this.targetY = event.clientY;
    this.hoveringButton = !!target?.closest('a, button, [role="button"]');
    if (this.item !== item) {
      this.releaseItem();
      this.item = item;
      activeItems.set(item, this);
      item.toggleAttribute('ui-active', true);
      item.toggleAttribute('ui-is-hovering-button', this.hoveringButton);
      this.currentX = this.previousX = this.targetX;
      this.currentY = this.previousY = this.targetY;
    } else item.toggleAttribute('ui-is-hovering-button', this.hoveringButton);
    this.active = true;
    this.area.toggleAttribute('data-cursor-active', true);
    this.render();
    this.requestFrame();
  }

  private requestFrame(): void {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      if (!this.active || !this.item?.isConnected) { this.deactivate(); return; }
      const rawEase = Number(this.area.getAttribute('ui-lerp-ease'));
      const ease = Math.min(1, Math.max(.01, this.area.hasAttribute('ui-lerp-ease') && Number.isFinite(rawEase) ? rawEase : .1));
      this.previousX = this.currentX;
      this.previousY = this.currentY;
      this.currentX += (this.targetX - this.currentX) * ease;
      this.currentY += (this.targetY - this.currentY) * ease;
      this.render();
      if (Math.hypot(this.targetX - this.currentX, this.targetY - this.currentY) > .1 ||
          Math.hypot(this.currentX - this.previousX, this.currentY - this.previousY) > .1) this.requestFrame();
    });
  }

  private render(): void {
    if (!this.item) return;
    const absolute = this.area.hasAttribute('ui-absolute') && this.area.contains(this.item);
    const rect = absolute ? this.area.getBoundingClientRect() : null;
    this.item.toggleAttribute('data-cursor-absolute', absolute);
    this.item.style.setProperty('--ui-cursor-x', `${this.currentX - (rect?.left ?? 0)}px`);
    this.item.style.setProperty('--ui-cursor-y', `${this.currentY - (rect?.top ?? 0)}px`);
    const dx = this.currentX - this.previousX;
    const dy = this.currentY - this.previousY;
    const speed = Math.min(24, Math.hypot(dx, dy));
    const distortion = OLD_SAFARI ? 'none' : this.area.getAttribute('ui-distortion') || 'none';
    this.item.dataset['distortion'] = /^distortion-[2-5]$/.test(distortion) ? distortion : 'none';
    this.item.style.setProperty('--ui-cursor-stretch', String(1 + speed / 24));
    this.item.style.setProperty('--ui-cursor-squash', String(1 / (1 + speed / 24)));
    this.item.style.setProperty('--ui-cursor-skew-x', `${Math.max(-22, Math.min(22, dx * 2))}deg`);
    this.item.style.setProperty('--ui-cursor-skew-y', `${Math.max(-22, Math.min(22, dy * 2))}deg`);
    this.item.style.setProperty('--ui-cursor-rotate', `${Math.max(-25, Math.min(25, dx * 2))}deg`);
    this.item.style.setProperty('--ui-cursor-blur', `${Math.min(5, speed / 5)}px`);
    this.item.style.setProperty('--ui-cursor-radius', `${Math.max(28, 50 - speed)}% ${Math.min(72, 50 + speed)}% ${Math.max(28, 50 - speed)}% ${Math.min(72, 50 + speed)}%`);
    const areaRect = this.area.getBoundingClientRect();
    const localX = this.currentX - areaRect.left - areaRect.width / 2;
    const localY = this.currentY - areaRect.top - areaRect.height / 2;
    this.area.style.setProperty('--ui-cursor-local-x', `${localX}px`);
    this.area.style.setProperty('--ui-cursor-local-y', `${localY}px`);
    this.area.style.setProperty('--ui-cursor-magnet-x', `${Math.max(-24, Math.min(24, localX * .16))}px`);
    this.area.style.setProperty('--ui-cursor-magnet-y', `${Math.max(-24, Math.min(24, localY * .16))}px`);
  }

  private releaseItem(): void {
    if (!this.item) return;
    this.item.removeAttribute('ui-active');
    this.item.removeAttribute('ui-is-hovering-button');
    this.item.removeAttribute('data-cursor-absolute');
    activeItems.delete(this.item);
    this.item = null;
  }

  private readonly deactivate = (): void => {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.active = false;
    this.releaseItem();
    this.area.removeAttribute('data-cursor-active');
    this.area.style.removeProperty('--ui-cursor-local-x');
    this.area.style.removeProperty('--ui-cursor-local-y');
    this.area.style.removeProperty('--ui-cursor-magnet-x');
    this.area.style.removeProperty('--ui-cursor-magnet-y');
  };
}

function enhance(area: Element): void {
  if (areaControllers.has(area) || !(area instanceof HTMLElement)) return;
  areaControllers.set(area, new CursorController(area));
}

export class UiCursor extends HTMLElement {
  connectedCallback(): void { enhance(this); }
  disconnectedCallback(): void { areaControllers.get(this)?.destroy(); }
}
export class UiCursorItem extends HTMLElement {}

define('ui-cursor', UiCursor);
define('ui-cursor-item', UiCursorItem);

// Customized built-in elements do not work in Safari. Enhance the equivalent
// <div is="ui-cursor"> markup directly so both forms share the same behavior.
if (typeof MutationObserver !== 'undefined' && document.documentElement) {
  const scan = (node: Node, connect: boolean): void => {
    if (!(node instanceof Element)) return;
    const areas = [node, ...node.querySelectorAll('[is="ui-cursor"]')];
    for (const area of areas) {
      if (!area.matches('[is="ui-cursor"]')) continue;
      if (connect && area.isConnected) enhance(area);
      else if (!area.isConnected) areaControllers.get(area)?.destroy();
    }
  };
  document.querySelectorAll('[is="ui-cursor"]').forEach(enhance);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') {
        const target = record.target;
        if (target instanceof Element && !target.matches('[is="ui-cursor"]')) areaControllers.get(target)?.destroy();
        else scan(target, true);
        continue;
      }
      record.removedNodes.forEach((node) => scan(node, false));
      record.addedNodes.forEach((node) => scan(node, true));
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['is'] });
}

export const cursor = UiCursor;
export const cursorItem = UiCursorItem;

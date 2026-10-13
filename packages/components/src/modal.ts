/** Dialog, drawer and lightbox with named triggers. */
import { BaseElement, define } from '@ui/core';
import { lockScroll, trapFocus, unlockScroll } from './focus-trap.js';

type State = 'closed' | 'entering' | 'open' | 'leaving';
type Options = { disabled: boolean; duration: number; easing: string; animate: string; placement: string; backdropColor: string; backdropBlur: number; backdropDisabled: boolean };
const animations = ['zoom', 'smart-zoom', 'fade', 'smart-fade-zoom', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'none'];
const placements = ['center', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const easings: Record<string, string> = { linear: 'linear', ease: 'ease', easeInQuad: 'cubic-bezier(.55,.085,.68,.53)', easeOutQuad: 'cubic-bezier(.25,.46,.45,.94)', easeInOutQuad: 'ease-in-out', easeOutCubic: 'cubic-bezier(.215,.61,.355,1)', easeOutQuart: 'cubic-bezier(.165,.84,.44,1)', easeOutBack: 'cubic-bezier(.175,.885,.32,1.275)', spring: 'cubic-bezier(.2,1.35,.35,1)', decay: 'cubic-bezier(.22,1,.36,1)' };
const stack: UiModal[] = [];
const flag = (el: Element, name: string, fallback: boolean) => el.hasAttribute(name) ? el.getAttribute(name) !== 'false' : fallback;
const numeric = (value: string | null, fallback: number) => value !== null && Number.isFinite(Number(value)) ? Number(value) : fallback;

function breakpoints(raw: string | null): Record<string, Partial<Options>> {
  if (!raw) return {};
  try {
    const json = raw.replace(/([{,]\s*)([\w-]+)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,\s*([}\]])/g, '$1');
    const value: unknown = JSON.parse(json);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Partial<Options>> : {};
  } catch { return {}; }
}

const styles = `
:host { position:fixed; inset:0; z-index:var(--ui-z-modal,1200); display:grid; box-sizing:border-box; width:100vw; height:100vh; height:100dvh; max-width:none; max-height:none; min-width:0; min-height:0; margin:0; padding:0; border:0; background:none; pointer-events:none; visibility:hidden; }
:host([data-state="entering"]),:host([data-state="open"]),:host([data-state="leaving"]) { visibility:visible; }
:host([data-state="entering"]),:host([data-state="open"]) { pointer-events:auto; }
:host([data-disabled]) { display:contents; width:auto; height:auto; visibility:visible; pointer-events:auto; }
:host([data-portal-active])::backdrop { background:var(--ui-modal-backdrop-color,rgba(12,18,32,.48)); backdrop-filter:blur(var(--ui-modal-backdrop-blur,10px)); -webkit-backdrop-filter:blur(var(--ui-modal-backdrop-blur,10px)); opacity:0; transition:opacity var(--ui-modal-duration,300ms) ease; }
:host([data-portal-active][data-state="open"])::backdrop { opacity:1; }
:host([data-portal-active][data-backdrop-disabled])::backdrop { display:none; }
.backdrop { position:absolute; inset:0; display:block; background:var(--ui-modal-backdrop-color,rgba(12,18,32,.48)); backdrop-filter:blur(var(--ui-modal-backdrop-blur,10px)); -webkit-backdrop-filter:blur(var(--ui-modal-backdrop-blur,10px)); opacity:0; transition:opacity var(--ui-modal-duration,300ms) ease; }
:host([data-state="open"]) .backdrop { opacity:1; }
:host([data-portal-active]) .backdrop { background:transparent; backdrop-filter:none; -webkit-backdrop-filter:none; }
:host([data-backdrop-disabled]) .backdrop,:host([data-disabled]) .backdrop { display:none; }
.dialog { position:relative; z-index:1; box-sizing:border-box; justify-self:center; align-self:center; width:max-content; max-width:min(var(--ui-modal-width,90vw),calc(100vw - 32px)); max-height:var(--ui-modal-max-height,90dvh); overflow:auto; border-radius:var(--ui-modal-radius,12px); background:var(--ui-modal-surface,var(--ui-color-surface,#fff)); box-shadow:0 28px 90px rgba(0,0,0,.3),0 4px 18px rgba(0,0,0,.12); padding:var(--ui-modal-padding,24px); opacity:0; transform:var(--ui-modal-from-transform,scale(.88)); transform-origin:center; translate:var(--ui-modal-pan-x,0px) var(--ui-modal-pan-y,0px); transition:opacity var(--ui-modal-duration,300ms) var(--ui-modal-easing,cubic-bezier(.22,1,.36,1)),transform var(--ui-modal-duration,300ms) var(--ui-modal-easing,cubic-bezier(.22,1,.36,1)),translate 180ms ease; }
:host([data-state="open"]) .dialog { opacity:1; transform:none; }
:host([data-effect^="slide-"][data-state="entering"]) .dialog,:host([data-effect^="slide-"][data-state="leaving"]) .dialog { opacity:1; }
:host([data-effect="none"]) .dialog,:host([data-effect="none"]) .backdrop { transition:none; }
:host([data-placement^="top-"]) .dialog { align-self:start; margin-top:var(--ui-modal-edge,clamp(14px,3vw,32px)); }
:host([data-placement^="bottom-"]) .dialog { align-self:end; margin-bottom:var(--ui-modal-edge,clamp(14px,3vw,32px)); }
:host([data-placement$="-left"]) .dialog { justify-self:start; margin-left:var(--ui-modal-edge,clamp(14px,3vw,32px)); }
:host([data-placement$="-right"]) .dialog { justify-self:end; margin-right:var(--ui-modal-edge,clamp(14px,3vw,32px)); }
:host([data-disabled]) .dialog { display:contents; }
::slotted([data-modal-overlay]) { display:none !important; }
@media(prefers-reduced-motion:reduce) { .dialog,.backdrop { transition:none !important; } }
`;

export class UiModal extends BaseElement {
  static override properties = { open: { name: 'open', default: false, reflect: true }, dismissable: { name: 'dismissable', default: true } };
  static override get observedAttributes() { return ['open', 'dismissable', 'ui-name', 'ui-animate', 'ui-placement', 'ui-duration', 'ui-easing', 'ui-backdrop-color', 'ui-backdrop-blur', 'ui-backdrop-disabled', 'ui-portal', 'ui-disabled', 'ui-scroll-disabled', 'ui-autofocus', 'ui-video-autoplay', 'ui-breakpoints', 'ui-esc-close-disabled', 'ui-backdrop-close-disabled']; }
  declare open: boolean;
  declare dismissable: boolean;
  private state: State = 'closed';
  private options!: Options;
  private dialog: HTMLElement;
  private backdrop: HTMLElement;
  private previousFocus: HTMLElement | null = null;
  private focusRelease: (() => void) | null = null;
  private frame: number | null = null;
  private focusFrame: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private scrollLocked = false;
  private usingPopover = false;
  private trigger: HTMLElement | null = null;
  private playingVideos: HTMLVideoElement[] = [];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${styles}</style><ui-modal-backdrop class="backdrop" part="backdrop" aria-hidden="true"></ui-modal-backdrop><div class="dialog" part="dialog"><slot></slot></div>`;
    this.dialog = root.querySelector('.dialog') as HTMLElement;
    this.backdrop = root.querySelector('.backdrop') as HTMLElement;
  }

  protected override onConnect(): void {
    this.setAttribute('role', 'dialog');
    this.refresh();
    this.$on(this.backdrop, 'click', () => { if (this.dismissable && !this.hasAttribute('ui-backdrop-close-disabled')) this.closeModal(); });
    this.$on(this, 'click', (event: MouseEvent) => {
      const path = event.composedPath();
      if (path.some((item) => item instanceof Element && item.matches('[data-modal-close]'))) this.closeModal();
      if (path.some((item) => item instanceof Element && item.matches('[data-modal-overlay]')) && this.dismissable && !this.hasAttribute('ui-backdrop-close-disabled')) this.closeModal();
    });
    this.$on(document, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' && stack.at(-1) === this && this.dismissable && !this.hasAttribute('ui-esc-close-disabled')) { event.preventDefault(); this.closeModal(); }
    });
    this.$on(window, 'resize', () => this.refresh());
    if (this.open && !this.options.disabled) this.startOpen();
  }

  protected override onDisconnect(): void { this.cancelTimers(); this.releaseInteraction(); this.hidePortal(); this.setState('closed'); }
  protected override onAttributeChanged(name: string): void {
    if (!this.$isConnected) return;
    if (name === 'open') { if (this.open) this.startOpen(); else this.startClose(); }
    else this.refresh();
  }

  openModal(trigger?: HTMLElement): void {
    if (this.options?.disabled || this.hasAttribute('ui-disabled')) return;
    if (trigger) this.trigger = trigger;
    if (this.open) return;
    this.$set('open', true);
    this.$emit('ui-modal-open', undefined);
  }
  closeModal(): void { if (!this.open) return; this.$set('open', false); this.$emit('ui-modal-close', undefined); }
  toggle(trigger?: HTMLElement): void { if (this.open) this.closeModal(); else this.openModal(trigger); }

  refresh(): void {
    const wasDisabled = this.options?.disabled;
    const options: Options = { disabled: flag(this, 'ui-disabled', false), duration: Math.max(0, numeric(this.getAttribute('ui-duration'), 300)), easing: this.getAttribute('ui-easing') || 'decay', animate: animations.includes(this.getAttribute('ui-animate') || '') ? this.getAttribute('ui-animate')! : 'smart-fade-zoom', placement: placements.includes(this.getAttribute('ui-placement') || '') ? this.getAttribute('ui-placement')! : 'center', backdropColor: this.getAttribute('ui-backdrop-color') || 'rgba(12,18,32,.48)', backdropBlur: Math.max(0, numeric(this.getAttribute('ui-backdrop-blur'), 10)), backdropDisabled: flag(this, 'ui-backdrop-disabled', false) };
    const parsed = breakpoints(this.getAttribute('ui-breakpoints'));
    const point = Object.keys(parsed).map(Number).filter((value) => Number.isFinite(value) && window.innerWidth <= value).sort((a, b) => a - b)[0];
    if (point !== undefined) {
      const override = parsed[String(point)]!;
      if (typeof override.disabled === 'boolean') options.disabled = override.disabled;
      if (typeof override.duration === 'number' && Number.isFinite(override.duration)) options.duration = Math.max(0, override.duration);
      if (typeof override.easing === 'string') options.easing = override.easing;
      if (animations.includes(override.animate || '')) options.animate = override.animate!;
      if (placements.includes(override.placement || '')) options.placement = override.placement!;
      if (typeof override.backdropColor === 'string') options.backdropColor = override.backdropColor;
      if (typeof override.backdropBlur === 'number') options.backdropBlur = Math.max(0, override.backdropBlur);
      if (typeof override.backdropDisabled === 'boolean') options.backdropDisabled = override.backdropDisabled;
    }
    this.options = options;
    this.toggleAttribute('data-disabled', options.disabled);
    this.toggleAttribute('data-backdrop-disabled', options.backdropDisabled);
    this.dataset['placement'] = options.placement;
    this.dataset['effect'] = options.animate;
    this.style.setProperty('--ui-modal-duration', `${this.duration()}ms`);
    this.style.setProperty('--ui-modal-easing', easings[options.easing] || easings['decay']!);
    this.style.setProperty('--ui-modal-backdrop-color', options.backdropColor);
    this.style.setProperty('--ui-modal-backdrop-blur', `${options.backdropBlur}px`);
    this.style.setProperty('--ui-modal-from-transform', this.fromTransform());
    if (options.disabled && this.state !== 'closed') { this.cancelTimers(); this.releaseInteraction(); this.hidePortal(); this.setState('closed'); }
    if (wasDisabled && !options.disabled && this.open && this.$isConnected) this.startOpen();
  }

  private duration(): number { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || this.options.animate === 'none' ? 0 : this.options.duration; }
  private fromTransform(): string {
    switch (this.options.animate) {
      case 'fade': case 'none': return 'none';
      case 'zoom': return 'scale(.72)';
      case 'fade-up': return 'translateY(28px)'; case 'fade-down': return 'translateY(-28px)';
      case 'fade-left': return 'translateX(-28px)'; case 'fade-right': return 'translateX(28px)';
      case 'slide-up': return 'translateY(100vh)'; case 'slide-down': return 'translateY(-100vh)';
      case 'slide-left': return 'translateX(100vw)'; case 'slide-right': return 'translateX(-100vw)';
      default: return 'scale(.72)';
    }
  }
  private smartTransform(): void {
    if (!this.options.animate.startsWith('smart-') || !this.trigger) return;
    const from = this.trigger.getBoundingClientRect();
    const to = this.dialog.getBoundingClientRect();
    const width = this.dialog.offsetWidth || to.width;
    const height = this.dialog.offsetHeight || to.height;
    if (!from.width || !width || !height) return;
    const dx = from.left + from.width / 2 - to.left - to.width / 2;
    const dy = from.top + from.height / 2 - to.top - to.height / 2;
    this.style.setProperty('--ui-modal-from-transform', `translate(${dx}px,${dy}px) scale(${Math.max(.08, Math.min(1, from.width / width))},${Math.max(.08, Math.min(1, from.height / height))})`);
  }
  private startOpen(): void {
    if (this.options.disabled || this.state === 'open' || this.state === 'entering') return;
    this.cancelTimers();
    this.previousFocus = document.activeElement as HTMLElement | null;
    this.setState('entering');
    this.showPortal();
    if (flag(this, 'ui-scroll-disabled', true) && !this.scrollLocked) { lockScroll(); this.scrollLocked = true; }
    const index = stack.indexOf(this); if (index >= 0) stack.splice(index, 1);
    stack.push(this);
    this.style.setProperty('--ui-modal-from-transform', this.fromTransform());
    this.smartTransform();
    // Commit the entering style before changing state, so the first open animates.
    void this.dialog.offsetWidth;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      if (this.state !== 'entering') return;
      this.setState('open');
      this.focusFrame = requestAnimationFrame(() => {
        this.focusFrame = null;
        if (!this.open) return;
        this.focusRelease = trapFocus(this, (target, type, listener, options) => this.$on(target, type, (event) => {
          if (stack.at(-1) === this) listener(event);
        }, options));
        if (flag(this, 'ui-autofocus', false)) this.querySelector<HTMLElement>('input, textarea, select, [autofocus]')?.focus();
      });
      if (flag(this, 'ui-video-autoplay', false)) this.querySelectorAll<HTMLVideoElement>('video').forEach((video) => { this.playingVideos.push(video); void video.play().catch(() => {}); });
    });
  }
  private startClose(): void {
    if (this.state === 'closed' || this.state === 'leaving') return;
    this.cancelTimers(); this.setState('leaving'); this.releaseInteraction();
    if (!this.duration()) { this.finishClose(); return; }
    this.timer = setTimeout(() => this.finishClose(), this.duration());
  }
  private finishClose(): void { this.timer = null; if (!this.open) { this.setState('closed'); this.hidePortal(); } }
  private releaseInteraction(): void {
    if (this.scrollLocked) { unlockScroll(); this.scrollLocked = false; }
    this.focusRelease?.(); this.focusRelease = null;
    const index = stack.indexOf(this); if (index >= 0) stack.splice(index, 1);
    this.playingVideos.forEach((video) => video.pause()); this.playingVideos = [];
    this.previousFocus?.focus?.(); this.previousFocus = null;
  }
  private showPortal(): void {
    if (!flag(this, 'ui-portal', true) || typeof this.showPopover !== 'function') return;
    try { this.setAttribute('popover', 'manual'); this.showPopover(); this.usingPopover = true; this.toggleAttribute('data-portal-active', true); } catch { /* fixed-position fallback */ }
  }
  private hidePortal(): void { if (!this.usingPopover) return; try { this.hidePopover(); } catch { /* detached */ } this.usingPopover = false; this.removeAttribute('data-portal-active'); }
  private cancelTimers(): void {
    if (this.timer !== null) clearTimeout(this.timer); this.timer = null;
    if (this.frame !== null) cancelAnimationFrame(this.frame); this.frame = null;
    if (this.focusFrame !== null) cancelAnimationFrame(this.focusFrame); this.focusFrame = null;
  }
  private setState(state: State): void {
    this.state = state;
    if (state === 'closed') this.removeAttribute('data-state'); else this.dataset['state'] = state;
    this.setAttribute('aria-modal', state !== 'closed' && !this.options?.disabled ? 'true' : 'false');
  }
}

export class UiModalTrigger extends BaseElement {
  protected override onConnect(): void {
    this.$on(this, 'click', (event: MouseEvent) => {
      const name = this.getAttribute('ui-name');
      const target = name ? [...document.querySelectorAll<UiModal>('ui-modal')].find((el) => el.getAttribute('ui-name') === name) : this.closest<UiModal>('ui-modal');
      target?.toggle((event.target as Element).closest<HTMLElement>('button, img, [tabindex]') || this);
    });
  }
}

export class UiModalBackdrop extends HTMLElement {}

export class UiModalPan extends BaseElement {
  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  protected override onConnect(): void {
    this.$on(this, 'pointerdown', (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      this.pointerId = event.pointerId; this.startX = event.clientX; this.startY = event.clientY;
      this.setPointerCapture?.(event.pointerId);
    });
    this.$on(this, 'pointermove', (event: PointerEvent) => {
      if (event.pointerId !== this.pointerId) return;
      const modal = this.closest<UiModal>('ui-modal');
      const effect = modal?.getAttribute('data-effect');
      const horizontal = effect === 'slide-left' || effect === 'slide-right';
      modal?.style.setProperty(horizontal ? '--ui-modal-pan-x' : '--ui-modal-pan-y', `${Math.max(0, this.delta(event, modal))}px`);
    });
    this.$on(this, 'pointerup', (event: PointerEvent) => {
      if (event.pointerId !== this.pointerId) return;
      const modal = this.closest<UiModal>('ui-modal');
      if (this.delta(event, modal) > 80) modal?.closeModal();
      modal?.style.removeProperty('--ui-modal-pan-y'); modal?.style.removeProperty('--ui-modal-pan-x'); this.pointerId = null;
    });
    this.$on(this, 'pointercancel', () => { this.pointerId = null; const modal = this.closest<UiModal>('ui-modal'); modal?.style.removeProperty('--ui-modal-pan-y'); modal?.style.removeProperty('--ui-modal-pan-x'); });
  }
  private delta(event: PointerEvent, modal: UiModal | null): number {
    const effect = modal?.getAttribute('data-effect');
    if (effect === 'slide-left') return event.clientX - this.startX;
    if (effect === 'slide-right') return this.startX - event.clientX;
    const placement = modal?.getAttribute('data-placement') || 'center';
    if (placement.startsWith('top-')) return this.startY - event.clientY;
    return event.clientY - this.startY;
  }
}

export const uiModal = {
  open(name: string): void { [...document.querySelectorAll<UiModal>('ui-modal')].find((el) => el.getAttribute('ui-name') === name)?.openModal(); },
  close(name: string): void { [...document.querySelectorAll<UiModal>('ui-modal')].find((el) => el.getAttribute('ui-name') === name)?.closeModal(); },
  toggle(name: string): void { [...document.querySelectorAll<UiModal>('ui-modal')].find((el) => el.getAttribute('ui-name') === name)?.toggle(); },
};

define('ui-modal', UiModal);
define('ui-modal-trigger', UiModalTrigger);
define('ui-modal-backdrop', UiModalBackdrop);
define('ui-modal-pan', UiModalPan);
Object.assign(window, { uiModal });
export const modal = UiModal;

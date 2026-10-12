/**
 * <ui-collapse> / <core-collapse> / <xo-collapse>
 *
 * Enterprise-grade collapsible panel with hardware-accelerated height animation.
 * Features:
 * - Smooth transition from 0 to auto height
 * - Rich easing function support via @ui/tokens (decay, easeOutQuad, spring, etc.)
 * - Sync with <ui-collapse-trigger> by name
 * - Accordion mode when wrapped in <ui-collapse-provider>
 * - Accessible ARIA attributes and focus handling
 */

import { BaseElement, define } from '@ui/core';
import { toCssEasing } from '@ui/tokens';
import { collapseRegistry } from './registry.js';
import type { CollapseInstance } from './types.js';

let collapseUid = 0;

export class UiCollapse extends BaseElement implements CollapseInstance {
  static override properties = {
    name: { name: 'name', attr: 'name', default: '' },
    duration: { name: 'duration', attr: 'duration', default: 300 },
    easing: { name: 'easing', attr: 'easing', default: 'decay' },
    active: { name: 'active', attr: 'active', default: false },
    observed: { name: 'observed', attr: 'observed', default: '' },
  };

  static override get observedAttributes() {
    return [
      'name', 'ui-name', 'xo-name',
      'duration', 'ui-duration', 'xo-duration',
      'easing', 'ui-easing', 'xo-easing',
      'active', 'ui-active', 'xo-active',
      'observed', 'ui-observed', 'xo-observed',
      'open',
    ];
  }

  declare name: string;
  declare duration: number;
  declare easing: string;
  declare active: boolean;
  declare observed: string;

  readonly #id = `collapse-${++collapseUid}`;
  #currentRegisteredName = '';
  #isAnimating = false;
  #isOpen = false;
  #syncingAttributes = false;
  #animationTimer: ReturnType<typeof setTimeout> | null = null;

  /* ------------------------------------------------------------
     Attribute Getters (Standard, ui- & xo- compatibility)
     ------------------------------------------------------------ */

  get effectiveName(): string {
    return this.getAttribute('ui-name') ?? this.getAttribute('name') ?? this.getAttribute('xo-name') ?? this.name ?? '';
  }

  get effectiveDuration(): number {
    const raw = this.getAttribute('ui-duration') ?? this.getAttribute('duration') ?? this.getAttribute('xo-duration');
    const n = raw !== null ? Number(raw) : Number(this.duration);
    return Number.isFinite(n) && n >= 0 ? n : 300;
  }

  get effectiveEasing(): string {
    return (
      this.getAttribute('ui-easing') ??
      this.getAttribute('easing') ??
      this.getAttribute('xo-easing') ??
      this.easing ??
      'decay'
    );
  }

  get isOpen(): boolean {
    const raw = this.getAttribute('ui-active') ?? this.getAttribute('active') ?? this.getAttribute('xo-active');
    if (raw !== null) {
      return raw !== 'false';
    }
    return Boolean(this.hasAttribute('open') || this.active);
  }

  /* ------------------------------------------------------------
     Lifecycle
     ------------------------------------------------------------ */

  protected override onConnect(): void {
    if (!this.id) {
      this.id = this.#id;
    }

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'region');
    }

    this.tabIndex = this.tabIndex >= 0 ? this.tabIndex : 0;

    const provider = this.closest<any>('ui-collapse-provider, core-collapse-provider, xo-collapse-provider, ui-accordion');
    if (provider && typeof provider.notifyChildConnected === 'function') {
      provider.notifyChildConnected(this);
    }

    this.#isOpen = this.isOpen;
    this.#syncRegistration();
    this.#applyInitialState();

    // Internal trigger fallback: support clicking [data-collapse-trigger] inside
    this.$on(this, 'click', (e) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-collapse-trigger]')) {
        e.preventDefault();
        this.toggle();
      }
    });

    this.$on(this, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement | null;
        if (target && target !== this && target.closest('ui-collapse-trigger, button, a[href], input')) {
          return;
        }
        e.preventDefault();
        this.toggle();
      }
    });
  }

  protected override onDisconnect(): void {
    if (this.#currentRegisteredName) {
      collapseRegistry.unregisterCollapse(this.#currentRegisteredName, this);
      this.#currentRegisteredName = '';
    }
    if (this.#animationTimer) {
      clearTimeout(this.#animationTimer);
      this.#animationTimer = null;
    }
  }

  protected override onAttributeChanged(name: string): void {
    if (this.#syncingAttributes) return;
    if (name.includes('name')) {
      this.#syncRegistration();
    } else if (name.includes('active') || name === 'open') {
      const open = this.isOpen;
      if (open !== this.#isOpen) {
        if (open) {
          this.open();
        } else {
          this.close();
        }
      }
    } else if (name.includes('observed')) {
      this.#applyInitialState();
    }
  }

  /* ------------------------------------------------------------
     Public API
     ------------------------------------------------------------ */

  open(): void {
    if (this.#isOpen && !this.#isAnimating) return;
    this.#isOpen = true;

    const duration =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)')?.matches
        ? 0
        : this.effectiveDuration;
    const easing = toCssEasing(this.effectiveEasing);

    this.#syncingAttributes = true;
    if (!this.hasAttribute('active')) this.setAttribute('active', '');
    if (!this.hasAttribute('ui-active')) this.setAttribute('ui-active', '');
    if (!this.hasAttribute('open')) this.setAttribute('open', '');
    this.setAttribute('aria-hidden', 'false');
    this.#syncingAttributes = false;

    this.$emit('ui-collapse-toggle', { open: true });

    collapseRegistry.syncTriggers(this.effectiveName, true);

    if (duration === 0) {
      this.style.height = 'auto';
      this.style.overflow = '';
      this.#emitOpen();
      return;
    }

    this.#isAnimating = true;
    if (this.#animationTimer) clearTimeout(this.#animationTimer);

    // 1. Prepare to measure target height
    this.style.overflow = 'hidden';
    this.style.transition = 'none';
    this.style.height = 'auto';
    const targetHeight = this.scrollHeight;
    this.style.height = '0px';

    // Force layout reflow
    void this.offsetHeight;

    // 2. Animate to target height
    this.style.transition = `height ${duration}ms ${easing}`;
    this.style.height = `${targetHeight}px`;

    this.#animationTimer = setTimeout(() => {
      this.#isAnimating = false;
      this.#animationTimer = null;
      this.style.transition = '';
      this.style.height = 'auto';
      this.style.overflow = '';
      this.#emitOpen();
    }, duration);
  }

  close(): void {
    if (!this.#isOpen && !this.#isAnimating) return;
    this.#isOpen = false;

    const duration =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)')?.matches
        ? 0
        : this.effectiveDuration;
    const easing = toCssEasing(this.effectiveEasing);

    this.#syncingAttributes = true;
    if (this.hasAttribute('active')) this.removeAttribute('active');
    if (this.hasAttribute('ui-active')) this.removeAttribute('ui-active');
    if (this.hasAttribute('xo-active')) this.removeAttribute('xo-active');
    if (this.hasAttribute('open')) this.removeAttribute('open');
    this.setAttribute('aria-hidden', 'true');
    this.#syncingAttributes = false;

    this.$emit('ui-collapse-toggle', { open: false });

    collapseRegistry.syncTriggers(this.effectiveName, false);

    if (duration === 0) {
      this.style.height = '0px';
      this.style.overflow = 'hidden';
      this.#emitClose();
      return;
    }

    this.#isAnimating = true;
    if (this.#animationTimer) clearTimeout(this.#animationTimer);

    // 1. Snapshot current height
    const currentHeight = this.scrollHeight;
    this.style.height = `${currentHeight}px`;
    this.style.overflow = 'hidden';

    // Force layout reflow
    void this.offsetHeight;

    // 2. Animate to 0
    this.style.transition = `height ${duration}ms ${easing}`;
    this.style.height = '0px';

    this.#animationTimer = setTimeout(() => {
      this.#isAnimating = false;
      this.#animationTimer = null;
      this.style.transition = '';
      this.style.height = '0px';
      this.#emitClose();
    }, duration);
  }

  toggle(): void {
    if (this.#isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Backwards compatibility methods
  open$(): void {
    this.open();
  }

  close$(): void {
    this.close();
  }

  /* ------------------------------------------------------------
     Internal Logic
     ------------------------------------------------------------ */

  #applyInitialState(): void {
    if (this.isOpen) {
      this.setAttribute('aria-hidden', 'false');
      this.style.height = 'auto';
      this.style.overflow = '';
      collapseRegistry.syncTriggers(this.effectiveName, true);
    } else {
      this.setAttribute('aria-hidden', 'true');
      this.style.height = '0px';
      this.style.overflow = 'hidden';
      collapseRegistry.syncTriggers(this.effectiveName, false);
    }
  }

  #syncRegistration(): void {
    const newName = this.effectiveName;
    if (this.#currentRegisteredName && this.#currentRegisteredName !== newName) {
      collapseRegistry.unregisterCollapse(this.#currentRegisteredName, this);
    }
    if (newName) {
      this.#currentRegisteredName = newName;
      collapseRegistry.registerCollapse(newName, this);
    }
  }

  #emitOpen(): void {
    this.$emit('ui-collapse:open', { name: this.effectiveName, id: this.id });
    this.$emit('ui-collapse-open', undefined);
  }

  #emitClose(): void {
    this.$emit('ui-collapse:close', { name: this.effectiveName, id: this.id });
    this.$emit('ui-collapse-close', undefined);
  }
}

// Aliases
export class CoreCollapse extends UiCollapse {}
export class XoCollapse extends UiCollapse {}

define('ui-collapse', UiCollapse);
define('core-collapse', CoreCollapse);
define('xo-collapse', XoCollapse);
export const collapse = UiCollapse;

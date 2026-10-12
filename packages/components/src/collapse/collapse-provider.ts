/**
 * <ui-collapse-provider> / <ui-accordion>
 *
 * Accordion container managing a group of <ui-collapse-trigger> and <ui-collapse> panels.
 * Features:
 * - Single-open accordion mode (opening one closes others)
 * - Automatic name assignment when name is omitted on children
 * - Inherited animation duration for child panels
 * - Scroll to header on panel expansion with sticky header offset (scroll, scroll-offset)
 * - Dynamic mutation observer for children
 */

import { BaseElement, define } from '@ui/core';
import type { UiCollapse } from './collapse.js';
import type { UiCollapseTrigger } from './collapse-trigger.js';

let providerUid = 0;

export class UiCollapseProvider extends BaseElement {
  static override properties = {
    duration: { name: 'duration', attr: 'duration', default: 300 },
    autoScroll: { name: 'autoScroll', attr: 'scroll', default: false },
    scrollOffset: { name: 'scrollOffset', attr: 'scroll-offset', default: 0 },
    observed: { name: 'observed', attr: 'observed', default: '' },
    multiple: { name: 'multiple', attr: 'multiple', default: false }, // Backwards compatibility for ui-accordion
  };

  static override get observedAttributes() {
    return [
      'duration', 'ui-duration', 'xo-duration',
      'scroll', 'ui-scroll', 'xo-scroll',
      'scroll-offset', 'ui-scroll-offset', 'xo-scroll-offset',
      'observed', 'ui-observed', 'xo-observed',
      'multiple',
    ];
  }

  declare duration: number;
  declare autoScroll: boolean;
  declare scrollOffset: number;
  declare observed: string;
  declare multiple: boolean;

  readonly #id = `provider-${++providerUid}`;
  #mutationObserver: MutationObserver | null = null;
  #scrollTimer: ReturnType<typeof setTimeout> | null = null;

  /* ------------------------------------------------------------
     Attribute Getters (Standard, ui- & xo- compatibility)
     ------------------------------------------------------------ */

  get effectiveDuration(): number {
    const raw = this.getAttribute('ui-duration') ?? this.getAttribute('duration') ?? this.getAttribute('xo-duration');
    const n = raw !== null ? Number(raw) : Number(this.duration);
    return Number.isFinite(n) && n >= 0 ? n : 300;
  }

  get isScroll(): boolean {
    const raw = this.getAttribute('ui-scroll') ?? this.getAttribute('scroll') ?? this.getAttribute('xo-scroll');
    return raw !== null ? (raw !== 'false' && raw !== '0') : Boolean(this.autoScroll);
  }

  get effectiveScrollOffset(): number {
    const raw = this.getAttribute('ui-scroll-offset') ?? this.getAttribute('scroll-offset') ?? this.getAttribute('xo-scroll-offset');
    const n = raw !== null ? Number(raw) : Number(this.scrollOffset);
    return Number.isFinite(n) ? n : 0;
  }

  get isMultiple(): boolean {
    return Boolean(this.multiple || this.hasAttribute('multiple'));
  }

  /* ------------------------------------------------------------
     Lifecycle
     ------------------------------------------------------------ */

  protected override onConnect(): void {
    this.#setupChildren();
    this.#setupListeners();
    this.#setupMutationObserver();
  }

  protected override onDisconnect(): void {
    this.#mutationObserver?.disconnect();
    this.#mutationObserver = null;
    if (this.#scrollTimer) {
      clearTimeout(this.#scrollTimer);
      this.#scrollTimer = null;
    }
  }

  protected override onAttributeChanged(name: string): void {
    if (name.includes('duration') || name.includes('observed')) {
      this.#propagateOptions();
    }
  }

  notifyChildConnected(_child?: HTMLElement): void {
    this.#setupChildren();
  }

  /* ------------------------------------------------------------
     Internal Logic
     ------------------------------------------------------------ */

  #setupChildren(): void {
    const triggers = [...this.querySelectorAll<UiCollapseTrigger>('ui-collapse-trigger, core-collapse-trigger, xo-collapse-trigger')];
    const collapses = [...this.querySelectorAll<UiCollapse>('ui-collapse, core-collapse, xo-collapse')];

    const pairCount = Math.min(triggers.length, collapses.length);

    for (let i = 0; i < pairCount; i++) {
      const trigger = triggers[i]!;
      const collapse = collapses[i]!;

      // If either trigger or collapse lacks a name, auto-assign matching names
      let name = trigger.effectiveName || collapse.effectiveName;
      if (!name) {
        name = `${this.#id}-item-${i + 1}`;
        trigger.setAttribute('name', name);
        collapse.setAttribute('name', name);
      } else {
        if (!trigger.effectiveName) trigger.setAttribute('name', name);
        if (!collapse.effectiveName) collapse.setAttribute('name', name);
      }

      // Inherit duration if not set
      if (!collapse.hasAttribute('duration') && !collapse.hasAttribute('ui-duration')) {
        collapse.setAttribute('duration', String(this.effectiveDuration));
      }
    }
  }

  #setupListeners(): void {
    // Listen for child open events to enforce single-open accordion behavior and scroll
    this.$on(this, 'ui-collapse:open', ((e: CustomEvent<{ name: string; id: string }>) => {
      const openedName = e.detail?.name;
      this.#handleChildOpened(openedName);
    }) as EventListener);

    // Also support backwards compatibility event ui-collapse-toggle
    this.$on(this, 'ui-collapse-toggle', ((e: CustomEvent<{ open?: boolean }>) => {
      const targetCollapse = e.target as UiCollapse;
      let isOpen = true;
      if (typeof e.detail?.open === 'boolean') {
        isOpen = e.detail.open;
      } else if (targetCollapse) {
        isOpen = targetCollapse.hasAttribute('open') || Boolean((targetCollapse as any).isOpen) || true;
      }
      if (!isOpen) return;
      if (targetCollapse) {
        this.#handleChildOpened(targetCollapse.effectiveName, targetCollapse);
      }
    }) as EventListener);
  }

  #handleChildOpened(name?: string, targetCollapse?: UiCollapse): void {
    if (!this.isMultiple) {
      // Close all other collapses in this provider
      const collapses = [...this.querySelectorAll<UiCollapse>('ui-collapse, core-collapse, xo-collapse')];
      for (const other of collapses) {
        if (targetCollapse ? other !== targetCollapse : (name && other.effectiveName !== name)) {
          if (other.isOpen || other.hasAttribute('open')) {
            other.close();
            other.removeAttribute('open');
          }
        }
      }
    }

    this.$emit('ui-accordion-change', {
      openCount: this.querySelectorAll('ui-collapse[open], ui-collapse[active], core-collapse[open], core-collapse[active]').length,
    });

    // Scroll to header after animation completes if scroll enabled
    if (this.isScroll && name) {
      if (this.#scrollTimer) clearTimeout(this.#scrollTimer);
      const delay = this.effectiveDuration + 20;

      this.#scrollTimer = setTimeout(() => {
        this.#scrollTimer = null;
        const trigger = this.querySelector(
          `ui-collapse-trigger[name="${name}"], ui-collapse-trigger[ui-name="${name}"], core-collapse-trigger[name="${name}"], xo-collapse-trigger[name="${name}"]`
        ) as HTMLElement | null;

        if (trigger) {
          const rect = trigger.getBoundingClientRect();
          const currentY = window.scrollY ?? window.pageYOffset ?? 0;
          const targetY = currentY + rect.top - this.effectiveScrollOffset;
          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: 'smooth',
          });
        }
      }, delay);
    }
  }

  #propagateOptions(): void {
    const collapses = [...this.querySelectorAll<UiCollapse>('ui-collapse, core-collapse, xo-collapse')];
    const duration = this.effectiveDuration;
    for (const c of collapses) {
      c.setAttribute('duration', String(duration));
      if (this.observed) {
        c.setAttribute('observed', this.observed);
      }
    }
  }

  #setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    this.#mutationObserver = new MutationObserver((mutations) => {
      let shouldSync = false;
      for (const m of mutations) {
        if (m.type === 'childList') {
          shouldSync = true;
          break;
        }
      }
      if (shouldSync) {
        this.#setupChildren();
      }
    });

    this.#mutationObserver.observe(this, { childList: true });
  }
}

// Aliases
export class CoreCollapseProvider extends UiCollapseProvider {}
export class XoCollapseProvider extends UiCollapseProvider {}
export class UiAccordion extends UiCollapseProvider {}

define('ui-collapse-provider', UiCollapseProvider);
define('core-collapse-provider', CoreCollapseProvider);
define('xo-collapse-provider', XoCollapseProvider);
define('ui-accordion', UiAccordion);
export const collapseProvider = UiCollapseProvider;
export const accordion = UiAccordion;

/**
 * <xo-toggle> / <core-toggle> / <ui-toggle>
 *
 * Enterprise-grade toggle disclosure & dropdown container.
 * Features:
 * - Sync with <xo-toggle-trigger> via xo-name
 * - Outside click to close (xo-outside-click-enabled)
 * - Autofocus first input on open (xo-autofocus)
 * - Portal floating positioning (xo-portal, xo-parent-selector)
 * - Responsive breakpoints (xo-breakpoints)
 * - Accessibility (Escape to close, ARIA expanded/hidden)
 * - Seamless backwards compatibility for standalone switch use-cases
 */

import { BaseElement, define } from '@ui/core';
import { toggleRegistry } from './registry.js';
import type { ToggleInstance } from './types.js';

let toggleUid = 0;

export class UiToggle extends BaseElement implements ToggleInstance {
  static override properties = {
    name: { name: 'name', attr: 'name', default: '' },
    active: { name: 'active', attr: 'active', default: false },
    autofocus: { name: 'autofocus', attr: 'autofocus', default: false },
    outsideClickEnabled: { name: 'outsideClickEnabled', attr: 'outside-click-enabled', default: false },
    portal: { name: 'portal', attr: 'portal', default: false },
    parentSelector: { name: 'parentSelector', attr: 'parent-selector', default: '' },
    breakpoints: { name: 'breakpoints', attr: 'breakpoints', default: '' },
    escapeClose: { name: 'escapeClose', attr: 'escape-close', default: true },
    focusTrap: { name: 'focusTrap', attr: 'focus-trap', default: false },

    // Switch backward compatibility
    checked: { name: 'checked', attr: 'checked', default: false, reflect: true },
    disabled: { name: 'disabled', attr: 'disabled', default: false, reflect: true },
    label: { name: 'label', default: '' },
  };

  static override get observedAttributes() {
    return [
      'name', 'ui-name', 'xo-name',
      'active', 'ui-active', 'xo-active',
      'autofocus', 'ui-autofocus', 'xo-autofocus',
      'outside-click-enabled', 'ui-outside-click-enabled', 'xo-outside-click-enabled',
      'portal', 'ui-portal', 'xo-portal',
      'parent-selector', 'ui-parent-selector', 'xo-parent-selector',
      'breakpoints', 'ui-breakpoints', 'xo-breakpoints',
      'escape-close', 'ui-escape-close', 'xo-escape-close',
      'focus-trap', 'ui-focus-trap', 'xo-focus-trap',
      'checked', 'disabled', 'label',
    ];
  }

  declare name: string;
  declare active: boolean;
  declare autofocus: boolean;
  declare outsideClickEnabled: boolean;
  declare portal: boolean;
  declare parentSelector: string;
  declare breakpoints: string;
  declare escapeClose: boolean;
  declare focusTrap: boolean;

  declare checked: boolean;
  declare disabled: boolean;
  declare label: string;

  readonly #id = `toggle-${++toggleUid}`;
  #currentRegisteredName = '';
  #previousFocusedElement: HTMLElement | null = null;
  #originalParent: Node | null = null;
  #originalNextSibling: Node | null = null;
  #isPortaled = false;
  #breakpointListener: (() => void) | null = null;
  #outsideClickListener: ((ev: Event) => void) | null = null;
  #escapeListener: ((ev: KeyboardEvent) => void) | null = null;

  /* ------------------------------------------------------------
     Attribute Getters (Standard, ui- & xo- compatibility)
     ------------------------------------------------------------ */

  get effectiveName(): string {
    return this.getAttribute('ui-name') ?? this.getAttribute('name') ?? this.getAttribute('xo-name') ?? this.name ?? '';
  }

  get isOpen(): boolean {
    const raw = this.getAttribute('ui-active') ?? this.getAttribute('active') ?? this.getAttribute('xo-active');
    if (raw !== null) {
      return raw !== 'false';
    }
    // Switch compatibility fallback
    if (this.#isSwitchMode()) {
      return Boolean(this.checked);
    }
    return Boolean(this.active);
  }

  get isAutofocus(): boolean {
    const raw = this.getAttribute('ui-autofocus') ?? this.getAttribute('autofocus') ?? this.getAttribute('xo-autofocus');
    return raw !== null ? (raw !== 'false' && raw !== '0') : Boolean(this.autofocus);
  }

  get isOutsideClickEnabled(): boolean {
    const raw = this.getAttribute('ui-outside-click-enabled') ?? this.getAttribute('outside-click-enabled') ?? this.getAttribute('xo-outside-click-enabled');
    return raw !== null ? (raw !== 'false' && raw !== '0') : Boolean(this.outsideClickEnabled);
  }

  get isPortal(): boolean {
    const raw = this.getAttribute('ui-portal') ?? this.getAttribute('portal') ?? this.getAttribute('xo-portal');
    return raw !== null ? (raw !== 'false' && raw !== '0') : Boolean(this.portal);
  }

  get effectiveParentSelector(): string {
    return this.getAttribute('ui-parent-selector') ?? this.getAttribute('parent-selector') ?? this.getAttribute('xo-parent-selector') ?? this.parentSelector ?? '';
  }

  get isEscapeClose(): boolean {
    const raw = this.getAttribute('ui-escape-close') ?? this.getAttribute('escape-close') ?? this.getAttribute('xo-escape-close');
    return raw !== null ? raw !== 'false' : (this.escapeClose ?? true);
  }

  /* ------------------------------------------------------------
     Lifecycle
     ------------------------------------------------------------ */

  protected override onConnect(): void {
    if (!this.id) {
      this.id = this.#id;
    }

    if (this.#isSwitchMode()) {
      this.#setupSwitchMode();
      return;
    }

    this.#setupDisclosureMode();
  }

  protected override onDisconnect(): void {
    if (this.#currentRegisteredName) {
      toggleRegistry.unregisterToggle(this.#currentRegisteredName, this);
      this.#currentRegisteredName = '';
    }

    this.#cleanupOutsideClick();
    this.#cleanupEscape();
    this.#cleanupBreakpoints();
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'name' || name === 'ui-name' || name === 'xo-name') {
      this.#syncRegistration();
    } else if (name === 'active' || name === 'ui-active' || name === 'xo-active') {
      const open = this.isOpen;
      toggleRegistry.syncTriggers(this.effectiveName, open);
      if (open) this.#onOpened();
      else this.#onClosed();
    } else if (name === 'checked') {
      if (this.#isSwitchMode()) {
        this.setAttribute('aria-checked', String(this.checked));
      }
    } else if (name === 'label') {
      if (this.#isSwitchMode()) {
        this.setAttribute('aria-label', this.label);
      }
    } else if (name === 'disabled') {
      if (this.#isSwitchMode()) {
        this.tabIndex = this.disabled ? -1 : 0;
      }
    }
  }

  /* ------------------------------------------------------------
     Public API
     ------------------------------------------------------------ */

  open(): void {
    if (this.isOpen) return;

    if (this.#isSwitchMode()) {
      this.check();
      return;
    }

    this.setAttribute('active', '');
    this.setAttribute('ui-active', '');
    this.setAttribute('xo-active', '');
    this.removeAttribute('aria-hidden');

    this.#onOpened();

    toggleRegistry.syncTriggers(this.effectiveName, true);
    this.$emit('ui-toggle:open', { name: this.effectiveName, id: this.id });
    this.$emit('xo-toggle:open', { name: this.effectiveName, id: this.id });
    this.$emit('ui-toggle:change', { name: this.effectiveName, active: true });
  }

  close(): void {
    if (!this.isOpen) return;

    if (this.#isSwitchMode()) {
      this.uncheck();
      return;
    }

    this.removeAttribute('active');
    this.removeAttribute('ui-active');
    this.removeAttribute('xo-active');
    this.setAttribute('aria-hidden', 'true');

    this.#onClosed();

    toggleRegistry.syncTriggers(this.effectiveName, false);
    this.$emit('ui-toggle:close', { name: this.effectiveName, id: this.id });
    this.$emit('xo-toggle:close', { name: this.effectiveName, id: this.id });
    this.$emit('ui-toggle:change', { name: this.effectiveName, active: false });
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Switch backward compatibility methods
  check(): void {
    this.$set('checked', true);
    this.setAttribute('aria-checked', 'true');
    this.$emit('ui-toggle-change', { checked: true });
  }

  uncheck(): void {
    this.$set('checked', false);
    this.setAttribute('aria-checked', 'false');
    this.$emit('ui-toggle-change', { checked: false });
  }

  /* ------------------------------------------------------------
     Internal Logic
     ------------------------------------------------------------ */

  #isSwitchMode(): boolean {
    // If element is explicitly configured as a switch or has no toggle name and has switch indicators
    const hasToggleAttr = this.hasAttribute('xo-name') ||
      this.hasAttribute('name') ||
      this.hasAttribute('xo-outside-click-enabled') ||
      this.hasAttribute('outside-click-enabled') ||
      this.hasAttribute('xo-portal') ||
      this.hasAttribute('portal');

    if (hasToggleAttr) return false;

    // Default to switch mode if tagName is ui-toggle and not accompanied by trigger elements
    return this.tagName.toLowerCase() === 'ui-toggle' && (
      this.hasAttribute('checked') ||
      this.hasAttribute('disabled') ||
      this.hasAttribute('label') ||
      this.getAttribute('role') === 'switch' ||
      !this.hasChildNodes()
    );
  }

  #setupSwitchMode(): void {
    this.setAttribute('role', 'switch');
    this.setAttribute('aria-checked', String(this.checked));
    if (this.label) {
      this.setAttribute('aria-label', this.label);
    }
    this.tabIndex = this.disabled ? -1 : 0;

    this.$on(this, 'click', () => {
      if (this.disabled) return;
      if (this.checked) this.uncheck();
      else this.check();
    });

    this.$on(this, 'keydown', (e) => {
      if (this.disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (this.checked) this.uncheck();
        else this.check();
      }
    });
  }

  #setupDisclosureMode(): void {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'region');
    }

    this.#syncRegistration();
    this.#setupBreakpoints();

    if (this.isOpen) {
      this.setAttribute('aria-hidden', 'false');
      this.#onOpened();
    } else {
      this.setAttribute('aria-hidden', 'true');
    }
  }

  #syncRegistration(): void {
    const newName = this.effectiveName;
    if (this.#currentRegisteredName && this.#currentRegisteredName !== newName) {
      toggleRegistry.unregisterToggle(this.#currentRegisteredName, this);
    }
    if (newName) {
      this.#currentRegisteredName = newName;
      toggleRegistry.registerToggle(newName, this);
    }
  }

  #onOpened(): void {
    this.#setupOutsideClick();
    this.#setupEscape();

    // Portal positioning if enabled
    if (this.isPortal) {
      this.#applyPortal();
    }

    // Autofocus
    if (this.isAutofocus) {
      this.#previousFocusedElement = (this.ownerDocument ?? document).activeElement as HTMLElement | null;
      requestAnimationFrame(() => {
        const focusable = this.querySelector<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    }
  }

  #onClosed(): void {
    this.#cleanupOutsideClick();
    this.#cleanupEscape();

    if (this.#isPortaled && this.#originalParent) {
      this.#originalParent.insertBefore(this, this.#originalNextSibling);
      this.#isPortaled = false;
      this.style.position = '';
      this.style.top = '';
      this.style.left = '';
      this.style.zIndex = '';
    }

    if (this.#previousFocusedElement && document.contains(this.#previousFocusedElement)) {
      this.#previousFocusedElement.focus();
      this.#previousFocusedElement = null;
    }
  }

  #applyPortal(): void {
    if (!this.isConnected || this.#isPortaled || this.parentElement === document.body) return;

    this.#isPortaled = true;
    this.#originalParent = this.parentNode;
    this.#originalNextSibling = this.nextSibling;

    // Anchor positioning relative to parent selector or triggering button
    const selector = this.effectiveParentSelector;
    let anchor: HTMLElement | null = null;
    if (selector) {
      anchor = document.querySelector<HTMLElement>(selector);
    }
    if (!anchor && this.effectiveName) {
      const triggers = toggleRegistry.getTriggers(this.effectiveName);
      anchor = triggers[0] ?? null;
    }

    document.body.appendChild(this);

    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      this.style.position = 'absolute';
      this.style.top = `${rect.bottom + window.scrollY}px`;
      this.style.left = `${rect.left + window.scrollX}px`;
      this.style.zIndex = '9999';
    }
  }

  #setupOutsideClick(): void {
    if (!this.isOutsideClickEnabled || this.#outsideClickListener) return;

    this.#outsideClickListener = (ev: Event): void => {
      if (!this.isOpen) return;
      const target = ev.target as Node | null;
      if (!target) return;

      // Check if click was inside this toggle
      if (this.contains(target) || target === this) return;

      // Check if click was inside any associated triggers
      const triggers = toggleRegistry.getTriggers(this.effectiveName);
      for (const trigger of triggers) {
        if (trigger.contains(target) || target === trigger) return;
      }

      this.close();
    };

    // Use capturing pointerdown / click to dismiss promptly
    document.addEventListener('pointerdown', this.#outsideClickListener, true);
  }

  #cleanupOutsideClick(): void {
    if (this.#outsideClickListener) {
      document.removeEventListener('pointerdown', this.#outsideClickListener, true);
      this.#outsideClickListener = null;
    }
  }

  #setupEscape(): void {
    if (!this.isEscapeClose || this.#escapeListener) return;

    this.#escapeListener = (ev: KeyboardEvent): void => {
      if (this.isOpen && ev.key === 'Escape') {
        ev.stopPropagation();
        this.close();
      }
    };

    document.addEventListener('keydown', this.#escapeListener);
  }

  #cleanupEscape(): void {
    if (this.#escapeListener) {
      document.removeEventListener('keydown', this.#escapeListener);
      this.#escapeListener = null;
    }
  }

  #setupBreakpoints(): void {
    const raw = this.getAttribute('xo-breakpoints') ?? this.getAttribute('breakpoints');
    if (!raw) return;

    try {
      const bpConfig = JSON.parse(raw) as Record<string, Partial<{ portal: boolean; outsideClickEnabled: boolean }>>;
      const checkBreakpoints = (): void => {
        const width = window.innerWidth;
        // Sort breakpoints descending
        const sortedWidths = Object.keys(bpConfig).map(Number).filter((n) => !isNaN(n)).sort((a, b) => b - a);
        for (const bpWidth of sortedWidths) {
          if (width >= bpWidth) {
            const conf = bpConfig[String(bpWidth)];
            if (conf?.portal !== undefined) {
              if (conf.portal) this.setAttribute('portal', '');
              else this.removeAttribute('portal');
            }
            if (conf?.outsideClickEnabled !== undefined) {
              if (conf.outsideClickEnabled) this.setAttribute('outside-click-enabled', '');
              else this.removeAttribute('outside-click-enabled');
            }
            return;
          }
        }
      };

      window.addEventListener('resize', checkBreakpoints);
      this.#breakpointListener = () => window.removeEventListener('resize', checkBreakpoints);
      checkBreakpoints();
    } catch {
      // Invalid JSON ignore
    }
  }

  #cleanupBreakpoints(): void {
    this.#breakpointListener?.();
    this.#breakpointListener = null;
  }
}

// Aliases
export class CoreToggle extends UiToggle {}
export class XoToggle extends UiToggle {}

define('ui-toggle', UiToggle);
define('core-toggle', CoreToggle);
define('xo-toggle', XoToggle);
export const toggle = UiToggle;

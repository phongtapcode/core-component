/**
 * <ui-collapse-trigger> / <core-collapse-trigger> / <xo-collapse-trigger>
 *
 * Header trigger button that toggles visibility of associated <ui-collapse> panels.
 */

import { BaseElement, define } from '@ui/core';
import { collapseRegistry } from './registry.js';
import type { UiCollapse } from './collapse.js';

export class UiCollapseTrigger extends BaseElement {
  static override properties = {
    name: { name: 'name', attr: 'name', default: '' },
    active: { name: 'active', attr: 'active', default: false },
    activeBinding: { name: 'activeBinding', attr: 'active-binding', default: '' },
  };

  static override get observedAttributes() {
    return [
      'name', 'ui-name', 'xo-name',
      'active', 'ui-active', 'xo-active',
      'active-binding', 'ui-active-binding', 'xo-active-binding',
    ];
  }

  declare name: string;
  declare active: boolean;
  declare activeBinding: string;

  #currentRegisteredName = '';
  #syncingAttributes = false;

  get effectiveName(): string {
    return this.getAttribute('ui-name') ?? this.getAttribute('name') ?? this.getAttribute('xo-name') ?? this.name ?? '';
  }

  get isActive(): boolean {
    const raw = this.getAttribute('ui-active') ?? this.getAttribute('active') ?? this.getAttribute('xo-active');
    return raw !== null && raw !== 'false';
  }

  get effectiveActiveBinding(): string {
    return this.getAttribute('ui-active-binding') ?? this.getAttribute('active-binding') ?? this.getAttribute('xo-active-binding') ?? this.activeBinding ?? '';
  }

  protected override onConnect(): void {
    if (!this.hasAttribute('role') && !this.querySelector('button, [role="button"]')) {
      this.setAttribute('role', 'button');
    }
    if (!this.hasAttribute('tabindex') && !this.querySelector('button, a[href], input')) {
      this.tabIndex = 0;
    }

    const provider = this.closest<any>('ui-collapse-provider, core-collapse-provider, xo-collapse-provider, ui-accordion');
    if (provider && typeof provider.notifyChildConnected === 'function') {
      provider.notifyChildConnected(this);
    }

    this.setAttribute('aria-expanded', String(this.isActive));

    this.#syncRegistration();
    this.#applyActiveBindings(this.isActive);

    this.$on(this, 'click', (e) => {
      e.stopPropagation();
      this.triggerToggle();
    });

    this.$on(this, 'keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.triggerToggle();
      }
    });
  }

  protected override onDisconnect(): void {
    if (this.#currentRegisteredName) {
      collapseRegistry.unregisterTrigger(this.#currentRegisteredName, this);
      this.#currentRegisteredName = '';
    }
  }

  protected override onAttributeChanged(name: string): void {
    if (this.#syncingAttributes) return;
    if (name.includes('name')) {
      this.#syncRegistration();
    } else if (name.includes('active') && !name.includes('binding')) {
      this.setActiveState(this.isActive);
    } else if (name.includes('binding')) {
      this.#applyActiveBindings(this.isActive);
    }
  }

  setActiveState(active: boolean): void {
    this.setAttribute('aria-expanded', String(active));
    this.#syncingAttributes = true;
    if (active) {
      this.setAttribute('active', '');
      this.setAttribute('ui-active', '');
      this.setAttribute('xo-active', '');
    } else {
      this.removeAttribute('active');
      this.removeAttribute('ui-active');
      this.removeAttribute('xo-active');
    }
    this.#syncingAttributes = false;

    this.#applyActiveBindings(active);
  }

  triggerToggle(): void {
    const name = this.effectiveName;
    let targets: UiCollapse[] = [];

    if (name) {
      targets = collapseRegistry.getCollapses(name);
    }

    // Fallback: If no named target, check closest sibling or parent
    if (targets.length === 0) {
      const nextCollapse = (this.nextElementSibling ?? this.parentElement?.querySelector('ui-collapse, core-collapse, xo-collapse')) as UiCollapse | null;
      if (nextCollapse) {
        targets = [nextCollapse];
      }
    }

    for (const collapse of targets) {
      collapse.toggle();
    }
  }

  #syncRegistration(): void {
    const newName = this.effectiveName;
    if (this.#currentRegisteredName && this.#currentRegisteredName !== newName) {
      collapseRegistry.unregisterTrigger(this.#currentRegisteredName, this);
    }
    if (newName) {
      this.#currentRegisteredName = newName;
      collapseRegistry.registerTrigger(newName, this);
    }
  }

  #applyActiveBindings(active: boolean): void {
    const bindingStr = this.effectiveActiveBinding;
    if (!bindingStr) return;

    // Syntax: selector[attribute], e.g. "button[data-state], .icon[rotate]"
    const items = bindingStr.split(',').map((s) => s.trim()).filter(Boolean);
    for (const item of items) {
      const match = item.match(/^(.*?)\[([a-zA-Z0-9_\-]+)\]$/);
      if (!match || !match[2]) continue;

      const rawSelector = match[1];
      const attr = match[2];
      const selector = rawSelector?.trim() || '*';

      // Search inside trigger
      const elements = [...this.querySelectorAll<HTMLElement>(selector)];
      if (this.matches(selector)) {
        elements.push(this);
      }

      for (const el of elements) {
        if (active) {
          el.setAttribute(attr, '');
        } else {
          el.removeAttribute(attr);
        }
      }
    }
  }
}

// Aliases
export class CoreCollapseTrigger extends UiCollapseTrigger {}
export class XoCollapseTrigger extends UiCollapseTrigger {}

define('ui-collapse-trigger', UiCollapseTrigger);
define('core-collapse-trigger', CoreCollapseTrigger);
define('xo-collapse-trigger', XoCollapseTrigger);
export const collapseTrigger = UiCollapseTrigger;

/**
 * <xo-toggle-trigger> / <core-toggle-trigger> / <ui-toggle-trigger>
 *
 * Trigger button that toggles visibility of associated <xo-toggle> containers.
 */

import { BaseElement, define } from '@ui/core';
import { toggleRegistry } from './registry.js';
import type { UiToggle } from './toggle.js';

export class UiToggleTrigger extends BaseElement {
  static override properties = {
    name: { name: 'name', attr: 'name', default: '' },
    active: { name: 'active', attr: 'active', default: false },
  };

  static override get observedAttributes() {
    return ['name', 'ui-name', 'xo-name', 'active', 'ui-active', 'xo-active'];
  }

  declare name: string;
  declare active: boolean;

  #currentRegisteredName = '';

  get effectiveName(): string {
    return this.getAttribute('ui-name') ?? this.getAttribute('name') ?? this.getAttribute('xo-name') ?? this.name ?? '';
  }

  get isActive(): boolean {
    const raw = this.getAttribute('ui-active') ?? this.getAttribute('active') ?? this.getAttribute('xo-active');
    return raw !== null && raw !== 'false';
  }

  protected override onConnect(): void {
    if (!this.hasAttribute('role') && !this.querySelector('button, [role="button"]')) {
      this.setAttribute('role', 'button');
    }
    if (!this.hasAttribute('tabindex') && !this.querySelector('button, a[href], input')) {
      this.tabIndex = 0;
    }

    this.setAttribute('aria-expanded', String(this.isActive));

    this.#syncRegistration();

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
      toggleRegistry.unregisterTrigger(this.#currentRegisteredName, this);
      this.#currentRegisteredName = '';
    }
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'name' || name === 'ui-name' || name === 'xo-name') {
      this.#syncRegistration();
    }
  }

  setActiveState(active: boolean): void {
    this.setAttribute('aria-expanded', String(active));
    if (active) {
      this.setAttribute('active', '');
      this.setAttribute('ui-active', '');
      this.setAttribute('xo-active', '');
    } else {
      this.removeAttribute('active');
      this.removeAttribute('ui-active');
      this.removeAttribute('xo-active');
    }
  }

  triggerToggle(): void {
    const name = this.effectiveName;
    let targets: UiToggle[] = [];

    if (name) {
      targets = toggleRegistry.getToggles(name);
    }

    // Fallback: If no named target, check closest parent or adjacent toggle
    if (targets.length === 0) {
      const parentToggle = this.closest('xo-toggle, core-toggle, ui-toggle') as UiToggle | null;
      if (parentToggle) {
        targets = [parentToggle];
      } else {
        const nextToggle = (this.nextElementSibling ?? this.parentElement?.querySelector('xo-toggle, core-toggle, ui-toggle')) as UiToggle | null;
        if (nextToggle) {
          targets = [nextToggle];
        }
      }
    }

    for (const toggle of targets) {
      toggle.toggle();
    }
  }

  #syncRegistration(): void {
    const newName = this.effectiveName;
    if (this.#currentRegisteredName && this.#currentRegisteredName !== newName) {
      toggleRegistry.unregisterTrigger(this.#currentRegisteredName, this);
    }
    if (newName) {
      this.#currentRegisteredName = newName;
      toggleRegistry.registerTrigger(newName, this);
    }
  }
}

// Aliases
export class CoreToggleTrigger extends UiToggleTrigger {}
export class XoToggleTrigger extends UiToggleTrigger {}

define('ui-toggle-trigger', UiToggleTrigger);
define('core-toggle-trigger', CoreToggleTrigger);
define('xo-toggle-trigger', XoToggleTrigger);
export const toggleTrigger = UiToggleTrigger;

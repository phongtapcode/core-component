/**
 * Central registry for coordinating <xo-toggle> and <xo-toggle-trigger> instances.
 */

import type { UiToggle } from './toggle.js';
import type { UiToggleTrigger } from './toggle-trigger.js';

class ToggleRegistryManager {
  #toggles = new Map<string, Set<UiToggle>>();
  #triggers = new Map<string, Set<UiToggleTrigger>>();

  registerToggle(name: string, el: UiToggle): void {
    if (!name) return;
    let set = this.#toggles.get(name);
    if (!set) {
      set = new Set();
      this.#toggles.set(name, set);
    }
    set.add(el);
    this.syncTriggers(name, el.isOpen);
  }

  unregisterToggle(name: string, el: UiToggle): void {
    if (!name) return;
    const set = this.#toggles.get(name);
    if (set) {
      set.delete(el);
      if (set.size === 0) {
        this.#toggles.delete(name);
      }
    }
  }

  registerTrigger(name: string, el: UiToggleTrigger): void {
    if (!name) return;
    let set = this.#triggers.get(name);
    if (!set) {
      set = new Set();
      this.#triggers.set(name, set);
    }
    set.add(el);

    // Initial state sync from active toggle if one exists
    const toggles = this.#toggles.get(name);
    if (toggles && toggles.size > 0) {
      const activeToggle = [...toggles].find((t) => t.isOpen);
      el.setActiveState(Boolean(activeToggle));
    }
  }

  unregisterTrigger(name: string, el: UiToggleTrigger): void {
    if (!name) return;
    const set = this.#triggers.get(name);
    if (set) {
      set.delete(el);
      if (set.size === 0) {
        this.#triggers.delete(name);
      }
    }
  }

  syncTriggers(name: string, active: boolean): void {
    if (!name) return;
    const triggers = this.#triggers.get(name);
    if (triggers) {
      for (const trigger of triggers) {
        trigger.setActiveState(active);
      }
    }
  }

  getToggles(name: string): UiToggle[] {
    if (!name) return [];
    const set = this.#toggles.get(name);
    return set ? [...set] : [];
  }

  getTriggers(name: string): UiToggleTrigger[] {
    if (!name) return [];
    const set = this.#triggers.get(name);
    return set ? [...set] : [];
  }
}

export const toggleRegistry = new ToggleRegistryManager();

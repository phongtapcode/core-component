/**
 * Central registry coordinating <ui-collapse> and <ui-collapse-trigger> instances.
 */

import type { UiCollapse } from './collapse.js';
import type { UiCollapseTrigger } from './collapse-trigger.js';

class CollapseRegistryManager {
  #collapses = new Map<string, Set<UiCollapse>>();
  #triggers = new Map<string, Set<UiCollapseTrigger>>();

  registerCollapse(name: string, el: UiCollapse): void {
    if (!name) return;
    let set = this.#collapses.get(name);
    if (!set) {
      set = new Set();
      this.#collapses.set(name, set);
    }
    set.add(el);
    this.syncTriggers(name, el.isOpen);
  }

  unregisterCollapse(name: string, el: UiCollapse): void {
    if (!name) return;
    const set = this.#collapses.get(name);
    if (set) {
      set.delete(el);
      if (set.size === 0) {
        this.#collapses.delete(name);
      }
    }
  }

  registerTrigger(name: string, el: UiCollapseTrigger): void {
    if (!name) return;
    let set = this.#triggers.get(name);
    if (!set) {
      set = new Set();
      this.#triggers.set(name, set);
    }
    set.add(el);

    // Initial state sync from active collapse if one exists
    const collapses = this.#collapses.get(name);
    if (collapses && collapses.size > 0) {
      const activeCollapse = [...collapses].find((c) => c.isOpen);
      el.setActiveState(Boolean(activeCollapse));
    }
  }

  unregisterTrigger(name: string, el: UiCollapseTrigger): void {
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

  getCollapses(name: string): UiCollapse[] {
    if (!name) return [];
    const set = this.#collapses.get(name);
    return set ? [...set] : [];
  }

  getTriggers(name: string): UiCollapseTrigger[] {
    if (!name) return [];
    const set = this.#triggers.get(name);
    return set ? [...set] : [];
  }
}

export const collapseRegistry = new CollapseRegistryManager();

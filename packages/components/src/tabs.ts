/**
 * <ui-tabs> — accessible tabbed interface.
 *
 * Markup convention:
 *   <ui-tabs>
 *     <div role="tablist">
 *       <button role="tab" id="t1" aria-controls="p1">One</button>
 *       <button role="tab" id="t2" aria-controls="p2">Two</button>
 *     </div>
 *     <div role="tabpanel" id="p1" aria-labelledby="t1">...</div>
 *     <div role="tabpanel" id="p2" aria-labelledby="t2">...</div>
 *   </ui-tabs>
 *
 * Attributes:
 *   value    string  — id of the active tab (default '' = first)
 *
 * Events:
 *   ui-tabs-change  { value: string }
 *
 * Keyboard: ArrowLeft/Right (RTL: opposite), Home, End.
 */

import { BaseElement, define } from '@ui/core';

export class UiTabs extends BaseElement {
  static override properties = {
    value: { name: 'value', default: '', reflect: true },
    orientation: { name: 'orientation', default: 'horizontal' },
  };

  static override get observedAttributes() {
    return ['value', 'orientation'];
  }

  declare value: string;
  declare orientation: 'horizontal' | 'vertical';

  #tabs: HTMLElement[] = [];
  #panels: HTMLElement[] = [];

  protected override onConnect(): void {
    this.#collect();
    if (!this.value && this.#tabs[0]) {
      this.$set('value', this.#tabs[0].id);
    }
    this.#sync();
    this.$on(this, 'click', (e) => {
      const target = e.target as HTMLElement;
      const tab = target.closest('[role="tab"]') as HTMLElement | null;
      if (tab) {
        e.preventDefault();
        this.$set('value', tab.id);
        this.#sync();
        this.$emit('ui-tabs-change', { value: this.value });
        tab.focus();
      }
    });
    this.$on(this, 'keydown', ((e: KeyboardEvent) => {
      const idx = this.#tabs.findIndex((t) => t.id === this.value);
      if (idx < 0) return;
      let next = -1;
      if (e.key === 'ArrowRight' || (this.orientation === 'vertical' && e.key === 'ArrowDown')) {
        next = (idx + 1) % this.#tabs.length;
      } else if (e.key === 'ArrowLeft' || (this.orientation === 'vertical' && e.key === 'ArrowUp')) {
        next = (idx - 1 + this.#tabs.length) % this.#tabs.length;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = this.#tabs.length - 1;
      }
      if (next >= 0) {
        e.preventDefault();
        this.$set('value', this.#tabs[next]!.id);
        this.#sync();
        this.$emit('ui-tabs-change', { value: this.value });
        this.#tabs[next]!.focus();
      }
    }) as EventListener);
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'value') {
      this.#sync();
    }
  }

  #collect(): void {
    this.#tabs = [...this.querySelectorAll<HTMLElement>('[role="tab"]')];
    this.#panels = [...this.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
  }

  #sync(): void {
    for (const tab of this.#tabs) {
      const active = tab.id === this.value;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of this.#panels) {
      const active = panel.getAttribute('aria-labelledby') === this.value;
      panel.hidden = !active;
    }
  }
}

define('ui-tabs', UiTabs);
export const tabs = UiTabs;
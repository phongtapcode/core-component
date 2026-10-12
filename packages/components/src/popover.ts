/**
 * <ui-popover> — floating popover anchored to a trigger.
 *
 * Markup convention:
 *   <ui-popover>
 *     <button data-popover-trigger>Click me</button>
 *     <div data-popover-content>Popover content</div>
 *   </ui-popover>
 *
 * Attributes:
 *   open       boolean
 *   placement  'bottom' | 'top' | 'left' | 'right' (default 'bottom')
 *   dismissable boolean (default true)
 *
 * Events:
 *   ui-popover-open
 *   ui-popover-close
 */

import { BaseElement, define } from '@ui/core';

export class UiPopover extends BaseElement {
  static override properties = {
    open: { name: 'open', default: false, reflect: true },
    placement: { name: 'placement', default: 'bottom' },
    dismissable: { name: 'dismissable', default: true },
  };

  static override get observedAttributes() {
    return ['open', 'placement', 'dismissable'];
  }

  declare open: boolean;
  declare placement: 'bottom' | 'top' | 'left' | 'right';
  declare dismissable: boolean;

  protected override onConnect(): void {
    this.$on(this, 'click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-popover-trigger]')) {
        this.toggle();
      } else if (target.closest('[data-popover-close]') && this.dismissable) {
        this.close$();
      }
    });

    if (this.dismissable) {
      this.$on(document, 'click', ((ev: Event) => {
        if (!this.open) return;
        const target = ev.target as Node | null;
        if (target && (this.contains(target) || target === this)) return;
        this.close$();
      }) as EventListener);
      this.$on(document, 'keydown', ((ev: KeyboardEvent) => {
        if (this.open && ev.key === 'Escape') this.close$();
      }) as EventListener);
    }
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'open') {
      this.$emit(this.open ? 'ui-popover-open' : 'ui-popover-close', undefined);
    } else if (name === 'placement') {
      this.setAttribute('placement', this.placement);
    }
  }

  open$(): void {
    if (this.open) return;
    this.$set('open', true);
  }

  close$(): void {
    if (!this.open) return;
    this.$set('open', false);
  }

  toggle(): void {
    if (this.open) this.close$();
    else this.open$();
  }
}

define('ui-popover', UiPopover);
export const popover = UiPopover;
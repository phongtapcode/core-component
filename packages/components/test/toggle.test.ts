/**
 * Unit Test Suite for Toggle Component (<xo-toggle>, <xo-toggle-trigger>)
 * Testing full xo-* attribute specification, trigger synchronization, outside-click, autofocus, and accessibility.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';
import type { UiToggle, UiToggleTrigger } from '../src/toggle/index.js';

describe('<xo-toggle> / <xo-toggle-trigger> Spec Test Suite', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.body.innerHTML = '';
  });

  describe('1. Registration and Tag Aliases', () => {
    it('registers xo-toggle, core-toggle, and ui-toggle', () => {
      const xo = document.createElement('xo-toggle');
      const core = document.createElement('core-toggle');
      const ui = document.createElement('ui-toggle');
      ui.setAttribute('xo-name', 'test');

      container.appendChild(xo);
      container.appendChild(core);
      container.appendChild(ui);

      expect(xo.getAttribute('role')).toBe('region');
      expect(core.getAttribute('role')).toBe('region');
      expect(ui.getAttribute('role')).toBe('region');
    });

    it('registers xo-toggle-trigger, core-toggle-trigger, and ui-toggle-trigger', () => {
      const xo = document.createElement('xo-toggle-trigger');
      const core = document.createElement('core-toggle-trigger');
      const ui = document.createElement('ui-toggle-trigger');

      container.appendChild(xo);
      container.appendChild(core);
      container.appendChild(ui);

      expect(xo.getAttribute('role')).toBe('button');
      expect(core.getAttribute('role')).toBe('button');
      expect(ui.getAttribute('role')).toBe('button');
    });
  });

  describe('2. Basic Toggle Synchronization (xo-name & xo-active)', () => {
    it('synchronizes trigger and toggle state on trigger click', () => {
      const trigger = document.createElement('xo-toggle-trigger') as UiToggleTrigger;
      trigger.setAttribute('xo-name', 'main-menu');
      trigger.innerHTML = '<button>Open Menu</button>';

      const toggle = document.createElement('xo-toggle') as UiToggle;
      toggle.setAttribute('xo-name', 'main-menu');
      toggle.innerHTML = '<div>Menu Content</div>';

      container.appendChild(trigger);
      container.appendChild(toggle);

      // Initial state: closed
      expect(toggle.isOpen).toBe(false);
      expect(toggle.hasAttribute('xo-active')).toBe(false);
      expect(trigger.hasAttribute('xo-active')).toBe(false);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      // Click trigger -> open
      trigger.click();
      expect(toggle.isOpen).toBe(true);
      expect(toggle.hasAttribute('xo-active')).toBe(true);
      expect(trigger.hasAttribute('xo-active')).toBe(true);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      // Click trigger -> close
      trigger.click();
      expect(toggle.isOpen).toBe(false);
      expect(toggle.hasAttribute('xo-active')).toBe(false);
      expect(trigger.hasAttribute('xo-active')).toBe(false);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('supports multiple triggers for the same toggle', () => {
      const openTrigger = document.createElement('xo-toggle-trigger') as UiToggleTrigger;
      openTrigger.setAttribute('xo-name', 'drawer');
      openTrigger.innerHTML = '<span>Open</span>';

      const toggle = document.createElement('xo-toggle') as UiToggle;
      toggle.setAttribute('xo-name', 'drawer');

      const closeTrigger = document.createElement('xo-toggle-trigger') as UiToggleTrigger;
      closeTrigger.setAttribute('xo-name', 'drawer');
      closeTrigger.innerHTML = '<span>Close</span>';

      toggle.appendChild(closeTrigger);
      container.appendChild(openTrigger);
      container.appendChild(toggle);

      // Open via external trigger
      openTrigger.click();
      expect(toggle.isOpen).toBe(true);
      expect(openTrigger.hasAttribute('xo-active')).toBe(true);
      expect(closeTrigger.hasAttribute('xo-active')).toBe(true);

      // Close via internal trigger
      closeTrigger.click();
      expect(toggle.isOpen).toBe(false);
      expect(openTrigger.hasAttribute('xo-active')).toBe(false);
      expect(closeTrigger.hasAttribute('xo-active')).toBe(false);
    });

    it('initializes in open state if xo-active is preset', () => {
      const trigger = document.createElement('xo-toggle-trigger') as UiToggleTrigger;
      trigger.setAttribute('xo-name', 'preopened');

      const toggle = document.createElement('xo-toggle') as UiToggle;
      toggle.setAttribute('xo-name', 'preopened');
      toggle.setAttribute('xo-active', '');

      container.appendChild(trigger);
      container.appendChild(toggle);

      expect(toggle.isOpen).toBe(true);
      expect(trigger.hasAttribute('xo-active')).toBe(true);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('3. Public API Methods and Events', () => {
    it('supports open(), close(), and toggle() methods and emits custom events', () => {
      const toggle = document.createElement('xo-toggle') as UiToggle;
      toggle.setAttribute('xo-name', 'api-test');
      container.appendChild(toggle);

      const onOpen = vi.fn();
      const onClose = vi.fn();
      toggle.addEventListener('xo-toggle:open', onOpen);
      toggle.addEventListener('xo-toggle:close', onClose);

      toggle.open();
      expect(toggle.isOpen).toBe(true);
      expect(onOpen).toHaveBeenCalledTimes(1);

      toggle.close();
      expect(toggle.isOpen).toBe(false);
      expect(onClose).toHaveBeenCalledTimes(1);

      toggle.toggle();
      expect(toggle.isOpen).toBe(true);
    });
  });

  describe('4. xo-autofocus behavior', () => {
    it('focuses the first input when opened if xo-autofocus is true', async () => {
      const trigger = document.createElement('xo-toggle-trigger') as UiToggleTrigger;
      trigger.setAttribute('xo-name', 'search-box');
      trigger.innerHTML = '<button>Search</button>';

      const toggle = document.createElement('xo-toggle') as UiToggle;
      toggle.setAttribute('xo-name', 'search-box');
      toggle.setAttribute('xo-autofocus', 'true');
      toggle.innerHTML = '<input type="text" id="search-input" />';

      container.appendChild(trigger);
      container.appendChild(toggle);

      const input = toggle.querySelector('#search-input') as HTMLInputElement;
      const focusSpy = vi.spyOn(input, 'focus');

      toggle.open();

      // Wait a frame for autofocus requestAnimationFrame
      await new Promise((r) => setTimeout(r, 50));
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('5. xo-outside-click-enabled behavior', () => {
    it('closes toggle on document click outside when xo-outside-click-enabled is set', () => {
      const trigger = document.createElement('xo-toggle-trigger') as UiToggleTrigger;
      trigger.setAttribute('xo-name', 'dropdown');
      trigger.innerHTML = '<button>Dropdown</button>';

      const toggle = document.createElement('xo-toggle') as UiToggle;
      toggle.setAttribute('xo-name', 'dropdown');
      toggle.setAttribute('xo-outside-click-enabled', 'true');
      toggle.innerHTML = '<div>Dropdown options</div>';

      const outsideArea = document.createElement('div');
      outsideArea.id = 'outside';

      container.appendChild(trigger);
      container.appendChild(toggle);
      container.appendChild(outsideArea);

      toggle.open();
      expect(toggle.isOpen).toBe(true);

      // Click inside toggle: should remain open
      toggle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      expect(toggle.isOpen).toBe(true);

      // Click outside area: should close
      outsideArea.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      expect(toggle.isOpen).toBe(false);
    });
  });

  describe('6. Escape Key Accessibility', () => {
    it('closes open toggle on Escape keydown', () => {
      const toggle = document.createElement('xo-toggle') as UiToggle;
      toggle.setAttribute('xo-name', 'esc-test');
      container.appendChild(toggle);

      toggle.open();
      expect(toggle.isOpen).toBe(true);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(toggle.isOpen).toBe(false);
    });
  });

  describe('7. xo-portal mode', () => {
    it('moves toggle to document.body when opened in portal mode', () => {
      const innerWrapper = document.createElement('div');
      const toggle = document.createElement('xo-toggle') as UiToggle;
      toggle.setAttribute('xo-name', 'portal-box');
      toggle.setAttribute('xo-portal', 'true');

      innerWrapper.appendChild(toggle);
      container.appendChild(innerWrapper);

      expect(innerWrapper.contains(toggle)).toBe(true);

      toggle.open();
      expect(toggle.parentNode).toBe(document.body);

      toggle.close();
      expect(innerWrapper.contains(toggle)).toBe(true);
    });
  });

  describe('8. Switch Backward Compatibility', () => {
    it('supports standalone switch role and aria-checked for ui-toggle', () => {
      const sw = document.createElement('ui-toggle') as UiToggle;
      container.appendChild(sw);

      expect(sw.getAttribute('role')).toBe('switch');
      expect(sw.getAttribute('aria-checked')).toBe('false');

      sw.click();
      expect(sw.getAttribute('aria-checked')).toBe('true');

      sw.click();
      expect(sw.getAttribute('aria-checked')).toBe('false');
    });

    it('emits ui-toggle-change and supports check()/uncheck()', () => {
      const sw = document.createElement('ui-toggle') as UiToggle;
      container.appendChild(sw);

      const onChange = vi.fn();
      sw.addEventListener('ui-toggle-change', onChange);

      sw.check();
      expect(sw.getAttribute('aria-checked')).toBe('true');
      expect(onChange).toHaveBeenCalledTimes(1);

      sw.uncheck();
      expect(sw.getAttribute('aria-checked')).toBe('false');
      expect(onChange).toHaveBeenCalledTimes(2);
    });
  });
});

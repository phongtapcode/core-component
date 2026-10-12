import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../src/index.js';
import type { UiCollapse, UiCollapseTrigger, UiCollapseProvider } from '../src/collapse.js';

describe('Collapse & Accordion Suite (<ui-collapse>, <ui-collapse-trigger>, <ui-collapse-provider>)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Standalone Collapse & Trigger Pairing', () => {
    it('pairs trigger and collapse by name and toggles open/close on click', () => {
      document.body.innerHTML = `
        <ui-collapse-trigger name="faq-1">
          <button>Question 1</button>
        </ui-collapse-trigger>
        <ui-collapse name="faq-1">
          <div>Answer 1</div>
        </ui-collapse>
      `;

      const trigger = document.querySelector<UiCollapseTrigger>('ui-collapse-trigger')!;
      const collapse = document.querySelector<UiCollapse>('ui-collapse')!;

      expect(collapse.isOpen).toBe(false);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      trigger.click();

      expect(collapse.isOpen).toBe(true);
      expect(collapse.hasAttribute('active')).toBe(true);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      trigger.click();

      expect(collapse.isOpen).toBe(false);
      expect(collapse.hasAttribute('active')).toBe(false);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('supports ui-name attribute alias', () => {
      document.body.innerHTML = `
        <ui-collapse-trigger ui-name="alias-test">Toggle</ui-collapse-trigger>
        <ui-collapse ui-name="alias-test">Content</ui-collapse>
      `;

      const trigger = document.querySelector<UiCollapseTrigger>('ui-collapse-trigger')!;
      const collapse = document.querySelector<UiCollapse>('ui-collapse')!;

      expect(collapse.isOpen).toBe(false);
      trigger.click();
      expect(collapse.isOpen).toBe(true);
    });

    it('supports keyboard navigation (Enter and Space) on trigger', () => {
      document.body.innerHTML = `
        <ui-collapse-trigger name="key-test">Header</ui-collapse-trigger>
        <ui-collapse name="key-test">Body</ui-collapse>
      `;

      const trigger = document.querySelector<UiCollapseTrigger>('ui-collapse-trigger')!;
      const collapse = document.querySelector<UiCollapse>('ui-collapse')!;

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(collapse.isOpen).toBe(true);

      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      expect(collapse.isOpen).toBe(false);
    });

    it('emits ui-collapse-toggle, ui-collapse:open, and ui-collapse:close events', async () => {
      document.body.innerHTML = `
        <ui-collapse name="evt-test" duration="10">Content</ui-collapse>
      `;

      const collapse = document.querySelector<UiCollapse>('ui-collapse')!;
      const toggleCb = vi.fn();
      const openCb = vi.fn();
      const closeCb = vi.fn();

      collapse.addEventListener('ui-collapse-toggle', toggleCb);
      collapse.addEventListener('ui-collapse:open', openCb);
      collapse.addEventListener('ui-collapse:close', closeCb);

      collapse.open();
      expect(toggleCb).toHaveBeenCalledWith(expect.objectContaining({ detail: { open: true } }));

      // Wait for duration to elapse
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(openCb).toHaveBeenCalled();

      collapse.close();
      expect(toggleCb).toHaveBeenCalledWith(expect.objectContaining({ detail: { open: false } }));

      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(closeCb).toHaveBeenCalled();
    });
  });

  describe('Active Binding Feature (active-binding)', () => {
    it('binds active attribute to matching internal elements with syntax selector[attribute]', () => {
      document.body.innerHTML = `
        <ui-collapse-trigger name="bind-test" active-binding="button[data-state], .icon[rotate]">
          <button data-state="closed">
            <span>Toggle</span>
            <span class="icon">▼</span>
          </button>
        </ui-collapse-trigger>
        <ui-collapse name="bind-test">Content</ui-collapse>
      `;

      const trigger = document.querySelector<UiCollapseTrigger>('ui-collapse-trigger')!;
      const btn = trigger.querySelector('button')!;
      const icon = trigger.querySelector('.icon')!;

      expect(btn.hasAttribute('data-state')).toBe(false);
      expect(icon.hasAttribute('rotate')).toBe(false);

      trigger.click();

      expect(btn.hasAttribute('data-state')).toBe(true);
      expect(icon.hasAttribute('rotate')).toBe(true);

      trigger.click();

      expect(btn.hasAttribute('data-state')).toBe(false);
      expect(icon.hasAttribute('rotate')).toBe(false);
    });
  });

  describe('Accordion Mode (<ui-collapse-provider>)', () => {
    it('enforces single open panel (opening panel 2 closes panel 1)', () => {
      document.body.innerHTML = `
        <ui-collapse-provider duration="0">
          <ui-collapse-trigger name="tab-1">Section 1</ui-collapse-trigger>
          <ui-collapse name="tab-1" active>Content 1</ui-collapse>

          <ui-collapse-trigger name="tab-2">Section 2</ui-collapse-trigger>
          <ui-collapse name="tab-2">Content 2</ui-collapse>
        </ui-collapse-provider>
      `;

      const collapses = document.querySelectorAll<UiCollapse>('ui-collapse');
      const triggers = document.querySelectorAll<UiCollapseTrigger>('ui-collapse-trigger');

      expect(collapses[0]!.isOpen).toBe(true);
      expect(collapses[1]!.isOpen).toBe(false);

      triggers[1]!.click();

      expect(collapses[0]!.isOpen).toBe(false);
      expect(collapses[1]!.isOpen).toBe(true);
      expect(triggers[0]!.getAttribute('aria-expanded')).toBe('false');
      expect(triggers[1]!.getAttribute('aria-expanded')).toBe('true');
    });

    it('auto-assigns sequential names when children omit name', () => {
      document.body.innerHTML = `
        <ui-collapse-provider duration="0">
          <ui-collapse-trigger>Header 1</ui-collapse-trigger>
          <ui-collapse>Content 1</ui-collapse>

          <ui-collapse-trigger>Header 2</ui-collapse-trigger>
          <ui-collapse>Content 2</ui-collapse>
        </ui-collapse-provider>
      `;

      const triggers = document.querySelectorAll<UiCollapseTrigger>('ui-collapse-trigger');
      const collapses = document.querySelectorAll<UiCollapse>('ui-collapse');

      expect(triggers[0]!.effectiveName).toBeTruthy();
      expect(collapses[0]!.effectiveName).toBe(triggers[0]!.effectiveName);

      expect(triggers[1]!.effectiveName).toBeTruthy();
      expect(collapses[1]!.effectiveName).toBe(triggers[1]!.effectiveName);
      expect(triggers[1]!.effectiveName).not.toBe(triggers[0]!.effectiveName);

      // Clicking trigger 1 opens collapse 1
      triggers[0]!.click();
      expect(collapses[0]!.isOpen).toBe(true);
      expect(collapses[1]!.isOpen).toBe(false);

      // Clicking trigger 2 opens collapse 2 and closes collapse 1
      triggers[1]!.click();
      expect(collapses[0]!.isOpen).toBe(false);
      expect(collapses[1]!.isOpen).toBe(true);
    });

    it('propagates duration to child collapses if not explicitly specified', () => {
      document.body.innerHTML = `
        <ui-collapse-provider duration="450">
          <ui-collapse-trigger name="d-1">Header 1</ui-collapse-trigger>
          <ui-collapse name="d-1">Content 1</ui-collapse>
        </ui-collapse-provider>
      `;

      const collapse = document.querySelector<UiCollapse>('ui-collapse')!;
      expect(collapse.effectiveDuration).toBe(450);
    });

    it('emits ui-accordion-change event on open state change', () => {
      document.body.innerHTML = `
        <ui-collapse-provider duration="0">
          <ui-collapse-trigger name="acc-1">Header 1</ui-collapse-trigger>
          <ui-collapse name="acc-1">Content 1</ui-collapse>
        </ui-collapse-provider>
      `;

      const provider = document.querySelector<UiCollapseProvider>('ui-collapse-provider')!;
      const trigger = document.querySelector<UiCollapseTrigger>('ui-collapse-trigger')!;
      const changeCb = vi.fn();

      provider.addEventListener('ui-accordion-change', changeCb);
      trigger.click();

      expect(changeCb).toHaveBeenCalled();
    });

    it('allows multiple panels open when multiple attribute is present', () => {
      document.body.innerHTML = `
        <ui-collapse-provider multiple duration="0">
          <ui-collapse-trigger name="m-1">Header 1</ui-collapse-trigger>
          <ui-collapse name="m-1">Content 1</ui-collapse>

          <ui-collapse-trigger name="m-2">Header 2</ui-collapse-trigger>
          <ui-collapse name="m-2">Content 2</ui-collapse>
        </ui-collapse-provider>
      `;

      const triggers = document.querySelectorAll<UiCollapseTrigger>('ui-collapse-trigger');
      const collapses = document.querySelectorAll<UiCollapse>('ui-collapse');

      triggers[0]!.click();
      expect(collapses[0]!.isOpen).toBe(true);

      triggers[1]!.click();
      expect(collapses[0]!.isOpen).toBe(true);
      expect(collapses[1]!.isOpen).toBe(true);
    });
  });

  describe('Scroll to Header on Open (scroll & scroll-offset)', () => {
    it('triggers window.scrollTo when scroll is enabled after duration', async () => {
      const scrollToSpy = vi.fn();
      window.scrollTo = scrollToSpy;

      document.body.innerHTML = `
        <ui-collapse-provider scroll scroll-offset="50" duration="10">
          <ui-collapse-trigger name="scr-1">Header 1</ui-collapse-trigger>
          <ui-collapse name="scr-1">Content 1</ui-collapse>
        </ui-collapse-provider>
      `;

      const trigger = document.querySelector<UiCollapseTrigger>('ui-collapse-trigger')!;
      trigger.click();

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(scrollToSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          behavior: 'smooth',
        })
      );
    });
  });
});

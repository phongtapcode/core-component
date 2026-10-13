import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uiModal } from '../src/modal.js';
import type { UiModal } from '../src/modal.js';

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { vi.useRealTimers(); });

function mount(attrs = ''): UiModal {
  const holder = document.createElement('div');
  holder.innerHTML = `<ui-modal-trigger ui-name="sample"><button>Open</button></ui-modal-trigger><ui-modal ui-name="sample" ${attrs}><div><ui-modal-trigger><button>Close</button></ui-modal-trigger><ui-modal-pan>Drag</ui-modal-pan></div></ui-modal>`;
  document.body.append(...Array.from(holder.children));
  return document.querySelector('ui-modal') as UiModal;
}

describe('ui-modal', () => {
  it('creates a shadow backdrop, opens by named trigger, and closes by inner trigger', () => {
    const modal = mount('ui-animate="fade-up" ui-duration="0"');
    const open = document.querySelector('ui-modal-trigger > button') as HTMLButtonElement;
    open.click();
    expect(modal.open).toBe(true);
    expect(modal.shadowRoot?.querySelector('[part="backdrop"]')).not.toBeNull();
    expect(modal.getAttribute('data-effect')).toBe('fade-up');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    (modal.querySelector('ui-modal-trigger button') as HTMLButtonElement).click();
    expect(modal.open).toBe(false);
    expect(modal.getAttribute('aria-modal')).toBe('false');
  });

  it('respects Escape and backdrop close controls', () => {
    const modal = mount('ui-esc-close-disabled ui-backdrop-close-disabled ui-duration="0"');
    uiModal.open('sample');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(modal.open).toBe(true);
    (modal.shadowRoot!.querySelector('[part="backdrop"]') as HTMLElement).click();
    expect(modal.open).toBe(true);
    modal.removeAttribute('ui-esc-close-disabled');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(modal.open).toBe(false);
  });

  it('applies the narrowest matching breakpoint and updates on resize', () => {
    const width = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 });
    try {
      const modal = mount(`ui-breakpoints="{900:{placement:'bottom-center',animate:'slide-up'},650:{placement:'top-right',animate:'fade-down'}}"`);
      expect(modal.dataset['placement']).toBe('top-right');
      expect(modal.dataset['effect']).toBe('fade-down');
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 });
      window.dispatchEvent(new Event('resize'));
      expect(modal.dataset['placement']).toBe('bottom-center');
    } finally { Object.defineProperty(window, 'innerWidth', { configurable: true, value: width }); }
  });

  it('uses a visible blurred backdrop for edge placements and allows overrides', () => {
    const modal = mount('ui-placement="top-center"');
    expect(modal.style.getPropertyValue('--ui-modal-backdrop-blur')).toBe('10px');
    expect(modal.style.getPropertyValue('--ui-modal-backdrop-color')).toBe('rgba(12,18,32,.48)');
    modal.setAttribute('ui-backdrop-blur', '4');
    expect(modal.style.getPropertyValue('--ui-modal-backdrop-blur')).toBe('4px');
  });

  it('uses the native backdrop while portal mode is active', () => {
    const modal = mount('ui-duration="0"');
    const show = vi.fn();
    const hide = vi.fn();
    Object.defineProperty(modal, 'showPopover', { configurable: true, value: show });
    Object.defineProperty(modal, 'hidePopover', { configurable: true, value: hide });
    modal.openModal();
    expect(show).toHaveBeenCalledOnce();
    expect(modal.hasAttribute('data-portal-active')).toBe(true);
    modal.closeModal();
    expect(hide).toHaveBeenCalledOnce();
    expect(modal.hasAttribute('data-portal-active')).toBe(false);
  });

  it('closes on a touch pan beyond the threshold', () => {
    const modal = mount('ui-duration="0"');
    modal.openModal();
    const pan = modal.querySelector('ui-modal-pan')!;
    pan.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 2, clientY: 100 }));
    pan.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch', pointerId: 2, clientY: 200 }));
    expect(modal.style.getPropertyValue('--ui-modal-pan-y')).toBe('100px');
    pan.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch', pointerId: 2, clientY: 200 }));
    expect(modal.open).toBe(false);
    expect(modal.style.getPropertyValue('--ui-modal-pan-y')).toBe('');
  });

  it('supports disabled inline mode and named JavaScript API', () => {
    const modal = mount('ui-disabled');
    uiModal.open('sample');
    expect(modal.open).toBe(false);
    expect(modal.hasAttribute('data-disabled')).toBe(true);
    modal.removeAttribute('ui-disabled');
    uiModal.open('sample');
    expect(modal.open).toBe(true);
    uiModal.close('sample');
    expect(modal.open).toBe(false);
  });
});

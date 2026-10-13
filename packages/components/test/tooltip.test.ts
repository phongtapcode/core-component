import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';
import type { UiTooltip } from '../src/tooltip.js';

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { vi.useRealTimers(); });

function mount(attributes = ''): UiTooltip {
  const holder = document.createElement('div');
  holder.innerHTML = `<ui-tooltip ui-title="Thông tin" ${attributes}><button aria-describedby="existing">Trigger</button></ui-tooltip>`;
  const element = holder.firstElementChild as UiTooltip;
  document.body.append(element);
  return element;
}

describe('ui-tooltip', () => {
  it('shows plain text, connects the trigger to its description, and cleans up', () => {
    vi.useFakeTimers();
    const element = mount();
    element.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    const content = document.querySelector('ui-tooltip-content')!;
    expect(content.textContent).toBe('Thông tin');
    expect(content.getAttribute('role')).toBe('tooltip');
    expect(element.firstElementChild!.getAttribute('aria-describedby')).toContain(content.id);
    element.setAttribute('ui-title', '<b>Safe</b>');
    expect(content.textContent).toBe('<b>Safe</b>');
    expect(content.querySelector('b')).toBeNull();
    element.hide();
    vi.advanceTimersByTime(180);
    expect(document.querySelector('ui-tooltip-content')).toBeNull();
    expect(element.firstElementChild!.getAttribute('aria-describedby')).toBe('existing');
  });

  it('positions with offset, flips near the viewport edge, and responds to changes', () => {
    const element = mount('ui-placement="top-center" ui-offset="12"');
    const trigger = element.firstElementChild as HTMLElement;
    trigger.getBoundingClientRect = () => ({ x: 100, y: 2, left: 100, top: 2, right: 200, bottom: 42, width: 100, height: 40, toJSON: () => ({}) });
    element.show();
    const content = document.querySelector('ui-tooltip-content') as HTMLElement;
    content.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 80, bottom: 30, width: 80, height: 30, toJSON: () => ({}) });
    element.updatePosition();
    expect(content.dataset['placement']).toBe('bottom');
    expect(content.style.left).toBe('110px');
    expect(content.style.top).toBe('54px');
    element.setAttribute('ui-placement', 'bottom-start');
    expect(content.style.left).toBe('100px');
  });

  it('supports focus, Escape, and optional touch disabling', () => {
    vi.useFakeTimers();
    const element = mount('ui-mobile-disabled ui-duration="0"');
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    expect(document.querySelector('ui-tooltip-content')).toBeNull();
    element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(document.querySelector('ui-tooltip-content')).toBeNull();
    vi.advanceTimersByTime(500);
    element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(document.querySelector('ui-tooltip-content')).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('ui-tooltip-content')).toBeNull();
    element.removeAttribute('ui-mobile-disabled');
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    expect(document.querySelector('ui-tooltip-content')).not.toBeNull();
    element.remove();
    expect(document.querySelector('ui-tooltip-content')).toBeNull();
  });
});

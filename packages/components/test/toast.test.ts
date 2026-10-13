import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uiToast } from '../src/index.js';

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('ui-toast', () => {
  it('renders plain text, creates a portal, and removes the toast after its delay and exit animation', () => {
    const toast = uiToast('<strong>Added</strong>')!;
    expect(toast.textContent).toContain('<strong>Added</strong>');
    expect(toast.querySelector('strong')).toBeNull();
    expect(toast.closest('ui-toast-portal')?.getAttribute('ui-placement')).toBe('bottom-center');
    expect(toast.getAttribute('role')).toBe('status');
    vi.advanceTimersByTime(2000);
    expect(toast.dataset['state']).toBe('closing');
    vi.advanceTimersByTime(200);
    expect(toast.isConnected).toBe(false);
  });

  it('clones named HTML templates and honors option overrides', () => {
    const template = document.createElement('ui-toast');
    template.setAttribute('ui-name', 'cart');
    template.setAttribute('ui-placement', 'top-left');
    template.setAttribute('ui-delay', 'Infinity');
    template.innerHTML = '<strong>Added to cart</strong>';
    document.body.append(template);
    const toast = uiToast.push({ name: 'cart', placement: 'top-right', className: 'toast-success', duration: 0 })!;
    expect(toast).not.toBe(template);
    expect(toast.querySelector('strong')?.textContent).toBe('Added to cart');
    expect(toast.closest('ui-toast-portal')?.getAttribute('ui-placement')).toBe('top-right');
    expect(toast.classList.contains('toast-success')).toBe(true);
    vi.advanceTimersByTime(5000);
    expect(toast.isConnected).toBe(true);
    uiToast.remove('cart');
    expect(toast.isConnected).toBe(false);
    expect(template.isConnected).toBe(true);
  });

  it('supports trusted HTML, custom close buttons, and disabled close buttons', () => {
    const rich = uiToast.push({ content: '<strong>Done</strong>', closeButtonClassName: 'custom-close', delay: Infinity, duration: 0 })!;
    expect(rich.querySelector('strong')?.textContent).toBe('Done');
    const close = rich.querySelector('ui-toast-close-button');
    expect(close?.classList.contains('custom-close')).toBe(true);
    expect(close?.querySelector('button')?.classList.contains('custom-close')).toBe(true);
    (close?.querySelector('button') as HTMLButtonElement).click();
    expect(rich.isConnected).toBe(false);
    const quiet = uiToast.push({ content: 'Quiet', closeButtonDisabled: true, delay: Infinity, duration: 0 })!;
    expect(quiet.querySelector('ui-toast-close-button')).toBeNull();
    quiet.closeToast();
  });

  it('removes only toasts with the requested name', () => {
    const first = uiToast.push({ name: 'first', content: 'One', delay: Infinity, duration: 0 })!;
    const second = uiToast.push({ name: 'second', content: 'Two', delay: Infinity, duration: 0 })!;
    uiToast.remove('first');
    expect(first.isConnected).toBe(false);
    expect(second.isConnected).toBe(true);
    uiToast.remove();
    expect(second.isConnected).toBe(false);
  });
});

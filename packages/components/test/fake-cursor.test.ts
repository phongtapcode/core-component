import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/fake-cursor.js';
import type { UiFakeCursor } from '../src/fake-cursor.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks(); });

function createCursor(activate = false): { host: UiFakeCursor; button: HTMLButtonElement } {
  const host = document.createElement('ui-fake-cursor') as UiFakeCursor;
  host.setAttribute('ui-target', '#target');
  host.setAttribute('ui-duration', '1000');
  if (activate) host.setAttribute('ui-activate', '');
  const button = document.createElement('button');
  button.id = 'target';
  button.textContent = 'Try this';
  host.append(button);
  vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, width: 400, height: 240 } as DOMRect);
  vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ left: 110, top: 70, width: 100, height: 40 } as DOMRect);
  document.body.append(host);
  return { host, button };
}

describe('ui-fake-cursor', () => {
  it('measures a real target and renders a non-interactive visual cursor', () => {
    const { host } = createCursor();
    expect(host.style.getPropertyValue('--ui-fake-cursor-target-x')).toBe('150px');
    expect(host.style.getPropertyValue('--ui-fake-cursor-target-y')).toBe('70px');
    expect(host.style.getPropertyValue('--ui-fake-cursor-target-left')).toBe('100px');
    expect(host.style.getPropertyValue('--ui-fake-cursor-target-top')).toBe('50px');
    expect(host.style.getPropertyValue('--ui-fake-cursor-target-width')).toBe('100px');
    expect(host.style.getPropertyValue('--ui-fake-cursor-target-height')).toBe('40px');
    expect(host.querySelector('[data-fake-cursor]')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.querySelectorAll('[data-fake-cursor-focus] i')).toHaveLength(4);
    expect(host.querySelector('[data-fake-cursor-focus]')?.getAttribute('aria-hidden')).toBe('true');
    expect(host.hasAttribute('data-running')).toBe(true);
  });

  it('signals a simulated click without activating the target by default', () => {
    const { host, button } = createCursor();
    const clicks = vi.fn();
    const signals = vi.fn();
    button.addEventListener('click', clicks);
    host.addEventListener('ui-fake-cursor:click', signals);
    vi.advanceTimersByTime(650);
    expect(signals).toHaveBeenCalledOnce();
    expect(clicks).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(signals).toHaveBeenCalledTimes(2);
  });

  it('activates only when requested and stops timers after disconnect', () => {
    const { host, button } = createCursor(true);
    const clicks = vi.fn();
    button.addEventListener('click', clicks);
    vi.advanceTimersByTime(650);
    expect(clicks).toHaveBeenCalledOnce();
    host.remove();
    vi.advanceTimersByTime(3000);
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('allows the simulated click to be canceled', () => {
    const { host, button } = createCursor(true);
    const clicks = vi.fn();
    button.addEventListener('click', clicks);
    host.addEventListener('ui-fake-cursor:click', (event) => event.preventDefault());
    vi.advanceTimersByTime(650);
    expect(clicks).not.toHaveBeenCalled();
  });

  it('runs once when requested', () => {
    const { host, button } = createCursor(true);
    host.setAttribute('ui-once', '');
    const clicks = vi.fn();
    button.addEventListener('click', clicks);
    vi.advanceTimersByTime(6000);
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('does not animate or activate when reduced motion is preferred', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    const { host, button } = createCursor(true);
    const clicks = vi.fn();
    button.addEventListener('click', clicks);
    vi.advanceTimersByTime(6000);
    expect(host.hasAttribute('data-running')).toBe(false);
    expect(clicks).not.toHaveBeenCalled();
  });
});

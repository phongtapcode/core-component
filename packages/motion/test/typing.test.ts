import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mount(effect: string, content = '["AB", "CD"]') {
  const element = document.createElement('ui-typing');
  element.setAttribute('ui-effect', effect);
  element.setAttribute('ui-content', content);
  element.setAttribute('ui-duration', '40');
  element.setAttribute('ui-delay', '80');
  document.body.append(element);
  const visible = () => element.shadowRoot?.querySelector('ui-typing-content')?.textContent;
  return { element, visible };
}

describe('ui-typing', () => {
  it('types, pauses, erases, then advances through JSON words', () => {
    const { element, visible } = mount('typing');
    expect(visible()).toBe('A|');
    expect(element.getAttribute('aria-label')).toBe('AB');
    vi.advanceTimersByTime(40);
    expect(visible()).toBe('AB|');
    vi.advanceTimersByTime(160);
    expect(visible()).toBe('C|');
    expect(element.getAttribute('aria-label')).toBe('CD');
    element.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps a combining accent together as one visible character', () => {
    const { visible } = mount('typing', '["áb"]');
    expect(visible()).toBe('á|');
  });

  it('slides to the next word and responds to content changes', () => {
    const { element } = mount('slide');
    const content = () => element.shadowRoot!.querySelector('ui-typing-content')!;
    expect(content().querySelector('.current')?.textContent).toBe('AB');
    vi.advanceTimersByTime(80);
    expect(content().querySelector('.next')?.textContent).toBe('CD');
    vi.advanceTimersByTime(40);
    expect(content().querySelector('.current')?.textContent).toBe('CD');
    expect(element.getAttribute('aria-label')).toBe('CD');
    element.setAttribute('ui-content', '["New"]');
    expect(content().querySelector('.current')?.textContent).toBe('New');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses an SVG goo filter and the effect-specific duration default', () => {
    const element = document.createElement('ui-typing');
    element.setAttribute('ui-effect', 'goo');
    element.setAttribute('ui-content', '["Creative", "Bold"]');
    document.body.append(element);
    expect(element.shadowRoot?.querySelector('filter feGaussianBlur')).not.toBeNull();
    expect(element.style.getPropertyValue('--ui-typing-duration')).toBe('1000ms');
    expect(element.shadowRoot?.querySelector('ui-typing-inner')?.getAttribute('data-effect')).toBe('goo');
    const content = element.shadowRoot!.querySelector('ui-typing-content')!;
    expect(content.firstElementChild?.className).toBe('goo-blob');
    expect(content.lastElementChild?.textContent).toBe('Creative');
    vi.advanceTimersByTime(2000);
    expect(content.lastElementChild?.textContent).toBe('Bold');
    expect(content.querySelector('.goo-blob .next')?.textContent).toBe('Bold');
    vi.advanceTimersByTime(1000);
    expect(content.lastElementChild?.textContent).toBe('Bold');
    expect(content.querySelector('.goo-blob .current')?.textContent).toBe('Bold');
  });

  it('shows a static first word for reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const { element, visible } = mount('typing');
    expect(visible()).toBe('AB');
    expect(vi.getTimerCount()).toBe(0);
    expect(element.shadowRoot?.querySelector('.cursor')).toBeNull();
  });
});

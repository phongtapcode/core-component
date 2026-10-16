import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/text-spotlight.js';
import type { UiTextSpotlight } from '../src/text-spotlight.js';

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

function createCard(): { card: UiTextSpotlight; button: HTMLButtonElement } {
  const card = document.createElement('ui-text-spotlight') as UiTextSpotlight;
  const heading = document.createElement('h2');
  heading.setAttribute('data-spotlight-title', '');
  heading.textContent = 'Hidden Artifact';
  const button = document.createElement('button');
  button.id = 'explore';
  button.name = 'action';
  button.textContent = 'Explore';
  card.append(heading, button);
  vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20, width: 320, height: 300 } as DOMRect);
  document.body.append(card);
  return { card, button };
}

describe('ui-text-spotlight', () => {
  it('keeps the authored button interactive and makes the light copy inert', () => {
    const { card, button } = createCard();
    const clicks = vi.fn();
    button.addEventListener('click', clicks);
    const light = card.querySelector('.ui-text-spotlight__light')!;
    const copy = light.querySelector('button')!;
    expect(light.getAttribute('aria-hidden')).toBe('true');
    expect(light.hasAttribute('inert')).toBe(true);
    expect(copy.tabIndex).toBe(-1);
    expect(copy.hasAttribute('id')).toBe(false);
    expect(copy.hasAttribute('name')).toBe(false);
    button.click();
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('starts the soft light at the pointer and hides it when the pointer leaves', () => {
    const { card } = createCard();
    card.dispatchEvent(new PointerEvent('pointerenter', { clientX: 110, clientY: 80, pointerType: 'mouse' }));
    expect(card.hasAttribute('data-spotlight-active')).toBe(true);
    expect(card.style.getPropertyValue('--ui-text-spotlight-x')).toBe('100px');
    expect(card.style.getPropertyValue('--ui-text-spotlight-y')).toBe('60px');
    card.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    expect(card.hasAttribute('data-spotlight-active')).toBe(false);
  });

  it('synchronizes changed text into the decorative layer', async () => {
    const { card } = createCard();
    card.querySelector<HTMLElement>('.ui-text-spotlight__base h2')!.textContent = 'New title';
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(card.querySelector('.ui-text-spotlight__light h2')?.textContent).toBe('New title');
  });
});

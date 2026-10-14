import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UiImageStack } from '../src/image-stack.js';
import type { UiModal } from '../src/modal.js';
import '../src/image-stack.js';

afterEach(() => { document.body.innerHTML = ''; });

function mount(): UiImageStack {
  const stack = document.createElement('ui-image-stack') as UiImageStack;
  stack.innerHTML = `
    <ui-image-stack-item ui-label="Coast"><img src="/coast.jpg" alt="Blue coast"></ui-image-stack-item>
    <ui-image-stack-item ui-label="Garden"><img src="/garden.jpg" alt="Green garden"></ui-image-stack-item>
    <ui-image-stack-item ui-label="City"><img src="/city.jpg" alt="Night city"></ui-image-stack-item>`;
  document.body.append(stack);
  return stack;
}

describe('ui-image-stack', () => {
  it('assigns depth and keyboard targets to each authored image layer', () => {
    const stack = mount();
    expect(stack.style.getPropertyValue('--ui-image-stack-count')).toBe('3');
    expect(stack.items.map((item) => item.style.getPropertyValue('--ui-image-stack-index'))).toEqual(['0','1','2']);
    expect(stack.items.map((item) => item.style.zIndex)).toEqual(['3','2','1']);
    expect(stack.items.map((item) => item.dataset['uiStackNumber'])).toEqual(['01','02','03']);
    expect(stack.items.map((item) => item.style.getPropertyValue('--ui-image-stack-fan-slot'))).toEqual(['-1','0','1']);
    expect(stack.items.map((item) => item.style.getPropertyValue('--ui-image-stack-zigzag'))).toEqual(['1','-1','1']);
    expect(stack.items.map((item) => item.style.getPropertyValue('--ui-image-stack-grid-col'))).toEqual(['0','1','2']);
    expect(stack.items.map((item) => item.style.getPropertyValue('--ui-image-stack-grid-row'))).toEqual(['0','0','0']);
    expect(stack.items[1]?.getAttribute('role')).toBe('button');
    expect(stack.items[1]?.tabIndex).toBe(0);
  });

  it('places added photos on the next contact-sheet row', () => {
    const stack = mount();
    stack.setAttribute('ui-style', 'sheet');
    for (let index = 0; index < 3; index++) {
      const item = document.createElement('ui-image-stack-item');
      item.innerHTML = `<img src="/extra-${index}.jpg" alt="Extra ${index}">`;
      stack.append(item);
    }
    stack.refresh();
    expect(stack.items.slice(3).map((item) => item.style.getPropertyValue('--ui-image-stack-grid-col'))).toEqual(['0','1','2']);
    expect(stack.items.slice(3).map((item) => item.style.getPropertyValue('--ui-image-stack-grid-row'))).toEqual(['1','1','1']);
    stack.items[5]!.click();
    expect(document.querySelector('.ui-image-stack__counter')?.textContent).toBe('06 / 06');
  });

  it('opens the selected image and navigates inside the modal', () => {
    const stack = mount();
    stack.items[1]!.click();
    const modal = document.querySelector<UiModal>('.ui-image-stack__modal')!;
    expect(modal.open).toBe(true);
    expect(modal.querySelector<HTMLImageElement>('.ui-image-stack__preview-image')?.src).toContain('/garden.jpg');
    expect(modal.querySelector('.ui-image-stack__counter')?.textContent).toBe('02 / 03');
    modal.querySelector<HTMLButtonElement>('[aria-label="Next image"]')!.click();
    expect(modal.querySelector<HTMLImageElement>('.ui-image-stack__preview-image')?.src).toContain('/city.jpg');
    stack.next();
    expect(modal.querySelector('.ui-image-stack__counter')?.textContent).toBe('01 / 03');
    modal.querySelector<HTMLButtonElement>('[data-modal-close]')!.click();
    expect(modal.open).toBe(false);
    expect(stack.hasAttribute('data-open')).toBe(false);
    expect(document.activeElement).toBe(stack.items[1]);
  });

  it('opens with Enter, responds to arrow keys, and cleans up the portal on removal', () => {
    const stack = mount();
    stack.setAttribute('ui-style', 'fan');
    stack.items[0]!.dispatchEvent(new KeyboardEvent('keydown', { key:'Enter', bubbles:true }));
    const modal = document.querySelector<UiModal>('.ui-image-stack__modal')!;
    expect(modal.open).toBe(true);
    modal.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowLeft', bubbles:true }));
    expect(modal.querySelector('.ui-image-stack__counter')?.textContent).toBe('03 / 03');
    stack.setAttribute('ui-style', 'fall');
    stack.items[2]!.click();
    expect(modal.querySelector('.ui-image-stack__counter')?.textContent).toBe('03 / 03');
    stack.remove();
    expect(document.querySelector('.ui-image-stack__modal')).toBeNull();
  });

  it('locks a palette photo until the pointer leaves the frame', () => {
    const stack = mount();
    stack.setAttribute('ui-style', 'palette');
    stack.append(document.createElement('ui-image-stack-item'));
    vi.spyOn(stack, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 300 } as DOMRect);

    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 280, clientY: 150 }));
    expect(stack.getAttribute('data-palette-active')).toBe('1');
    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 150, clientY: 280 }));
    expect(stack.getAttribute('data-palette-active')).toBe('1');
    stack.dispatchEvent(new Event('pointerleave'));
    expect(stack.hasAttribute('data-palette-active')).toBe(false);
    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 150, clientY: 280 }));
    expect(stack.getAttribute('data-palette-active')).toBe('2');

    stack.items[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 150, clientY: 280 }));
    expect(document.querySelector('.ui-image-stack__counter')?.textContent).toBe('02 / 04');
  });

  it('keeps every photo accessible when palette has a different number of items', () => {
    const stack = mount();
    stack.setAttribute('ui-style', 'palette');
    vi.spyOn(stack, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 300 } as DOMRect);
    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 280, clientY: 150 }));
    expect(stack.hasAttribute('data-palette-active')).toBe(false);

    stack.append(document.createElement('ui-image-stack-item'), document.createElement('ui-image-stack-item'));
    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 280, clientY: 150 }));
    expect(stack.hasAttribute('data-palette-active')).toBe(false);
    stack.items[4]!.click();
    expect(document.querySelector('.ui-image-stack__counter')?.textContent).toBe('05 / 05');
  });

  it('switches corner photos through the exposed center and corner regions', () => {
    const stack = mount();
    stack.setAttribute('ui-style', 'corner');
    vi.spyOn(stack, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 300, height: 300 } as DOMRect);
    expect(stack.hasAttribute('data-corner-ready')).toBe(true);

    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 30, clientY: 30 }));
    expect(stack.getAttribute('data-corner-active')).toBe('1');
    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 150, clientY: 150 }));
    expect(stack.getAttribute('data-corner-active')).toBe('1');
    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 270, clientY: 270 }));
    expect(stack.getAttribute('data-corner-active')).toBe('2');
    stack.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 290, clientY: 290 }));
    expect(stack.getAttribute('data-corner-active')).toBe('3');
    stack.items[2]!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 290, clientY: 290 }));
    expect(document.querySelector('.ui-image-stack__counter')?.textContent).toBe('03 / 03');

    stack.dispatchEvent(new Event('pointerleave'));
    expect(stack.hasAttribute('data-corner-active')).toBe(false);

    stack.append(document.createElement('ui-image-stack-item'));
    stack.refresh();
    expect(stack.hasAttribute('data-corner-ready')).toBe(false);
    expect(stack.hasAttribute('data-corner-active')).toBe(false);
    stack.items[3]!.click();
    expect(document.querySelector('.ui-image-stack__counter')?.textContent).toBe('04 / 04');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Element, Modal, Toggle, register } from '../src/index.js';
import type { UiModal, UiToggle } from '@element-works/components';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | undefined;
let container: HTMLDivElement | undefined;

function mount(): Root {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  return root;
}

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

describe('@element-works/react', () => {
  it('renders custom element markup during SSR without loading browser modules', () => {
    expect(renderToString(createElement(Toggle, { label: 'Notifications' }))).toContain('<ui-toggle');
    expect(renderToString(createElement(Modal, null, 'Content'))).toContain('<ui-modal');
  });

  it('bridges Toggle state and events, then removes the listener on unmount', async () => {
    const onCheckedChange = vi.fn();
    await register('ui-toggle');
    const app = mount();
    await act(async () => app.render(createElement(Toggle, { checked: false, label: 'Alerts', onCheckedChange })));
    await act(async () => {});
    const toggle = container!.querySelector('ui-toggle') as UiToggle;
    expect(toggle.checked).toBe(false);
    expect(toggle.getAttribute('label')).toBe('Alerts');
    expect(toggle.getAttribute('aria-label')).toBe('Alerts');

    await act(async () => app.render(createElement(Toggle, { checked: true, onCheckedChange })));
    expect(toggle.checked).toBe(true);
    await act(async () => toggle.uncheck());
    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.any(CustomEvent));

    await act(async () => app.unmount());
    toggle.check();
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    root = undefined;
  });

  it('applies uncontrolled default state after registration', async () => {
    await register('ui-toggle');
    await register('ui-modal');
    const app = mount();
    await act(async () => app.render(createElement('div', null,
      createElement(Toggle, { defaultChecked: true }),
      createElement(Modal, { defaultOpen: true }, 'Dialog'),
    )));
    await act(async () => {});
    expect(container!.querySelector('ui-toggle')?.getAttribute('aria-checked')).toBe('true');
    expect(container!.querySelector('ui-modal')?.hasAttribute('open')).toBe(true);
  });

  it('bridges Modal state and open/close events', async () => {
    const onOpenChange = vi.fn();
    await register('ui-modal');
    const app = mount();
    await act(async () => app.render(createElement(Modal, { open: false, onOpenChange }, 'Dialog')));
    await act(async () => {});
    const modal = container!.querySelector('ui-modal') as UiModal;
    expect(modal.open).toBe(false);

    await act(async () => modal.openModal());
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.any(Event));
    await act(async () => app.render(createElement(Modal, { open: true, onOpenChange }, 'Dialog')));
    expect(modal.open).toBe(true);
    expect(modal.hasAttribute('open')).toBe(true);
    await act(async () => modal.closeModal());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.any(Event));
  });

  it('supports attributes, properties and events through the generic Element', async () => {
    const onEvent = vi.fn();
    await register('ui-animate');
    const app = mount();
    await act(async () => app.render(createElement(Element, {
      tag: 'ui-animate',
      attributes: { effect: 'fade-up', once: true },
      properties: { duration: 250 },
      events: { 'ui-animate-reveal': onEvent },
    }, 'Hello')));
    await act(async () => {});
    const element = container!.querySelector('ui-animate') as HTMLElement & { duration: number };
    expect(element.getAttribute('effect')).toBe('fade-up');
    expect(element.hasAttribute('once')).toBe(true);
    expect(element.duration).toBe(250);
    await act(async () => element.dispatchEvent(new CustomEvent('ui-animate-reveal', { detail: { x: 1 } })));
    expect(onEvent).toHaveBeenCalledTimes(1);

    await act(async () => app.render(createElement(Element, { tag: 'ui-animate', attributes: { effect: 'fade' } })));
    expect(element.hasAttribute('once')).toBe(false);
    await act(async () => element.dispatchEvent(new CustomEvent('ui-animate-reveal')));
    expect(onEvent).toHaveBeenCalledTimes(1);
  });

  it('rejects tags not provided by the library', async () => {
    await expect(register('ui-does-not-exist')).rejects.toThrow('does not define');
  });
});

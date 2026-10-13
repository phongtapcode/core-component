import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => { vi.unstubAllGlobals(); });

const point = (type: string, x: number, y: number, pointerType = 'mouse') =>
  new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerType });

describe('ui-cursor', () => {
  it('starts at the pointer, follows it, changes button state and honors disabled areas', () => {
    const area = document.createElement('ui-cursor');
    area.setAttribute('ui-name', 'demo');
    area.innerHTML = '<button>Action</button><div ui-cursor-disabled>Disabled</div><ui-cursor-item ui-name="demo">View</ui-cursor-item>';
    document.body.append(area);
    const item = area.querySelector('ui-cursor-item')!;
    area.dispatchEvent(point('pointerenter', 120, 80));
    expect(item.hasAttribute('ui-active')).toBe(true);
    expect(item.style.getPropertyValue('--ui-cursor-x')).toBe('120px');
    expect(item.style.getPropertyValue('--ui-cursor-y')).toBe('80px');
    area.querySelector('button')!.dispatchEvent(point('pointermove', 140, 90));
    expect(item.hasAttribute('ui-is-hovering-button')).toBe(true);
    area.querySelector('[ui-cursor-disabled]')!.dispatchEvent(point('pointermove', 150, 100));
    expect(item.hasAttribute('ui-active')).toBe(false);
    expect(area.hasAttribute('data-cursor-active')).toBe(false);
  });

  it('switches items across halves and uses local coordinates in absolute mode', () => {
    const area = document.createElement('ui-cursor');
    area.setAttribute('ui-name', "['prev','next']");
    area.setAttribute('ui-absolute', '');
    area.innerHTML = '<ui-cursor-item ui-name="prev">Prev</ui-cursor-item><ui-cursor-item ui-name="next">Next</ui-cursor-item>';
    area.getBoundingClientRect = () => ({ x: 100, y: 30, left: 100, top: 30, right: 300, bottom: 230, width: 200, height: 200, toJSON: () => ({}) });
    document.body.append(area);
    const [prev, next] = area.querySelectorAll('ui-cursor-item');
    area.dispatchEvent(point('pointerenter', 150, 60));
    expect(prev!.hasAttribute('ui-active')).toBe(true);
    expect(prev!.style.getPropertyValue('--ui-cursor-x')).toBe('50px');
    expect(prev!.style.getPropertyValue('--ui-cursor-y')).toBe('30px');
    area.dispatchEvent(point('pointermove', 250, 80));
    expect(prev!.hasAttribute('ui-active')).toBe(false);
    expect(next!.hasAttribute('ui-active')).toBe(true);
    expect(next!.hasAttribute('data-cursor-absolute')).toBe(true);
    area.remove();
    expect(next!.hasAttribute('ui-active')).toBe(false);
  });

  it('enhances the div is="ui-cursor" syntax after insertion', async () => {
    const area = document.createElement('div');
    area.setAttribute('is', 'ui-cursor');
    area.setAttribute('ui-name', 'custom');
    area.innerHTML = '<ui-cursor-item ui-name="custom">Custom</ui-cursor-item>';
    document.body.append(area);
    await new Promise((resolve) => setTimeout(resolve, 0));
    area.dispatchEvent(point('pointerenter', 40, 50));
    expect(area.querySelector('ui-cursor-item')!.hasAttribute('ui-active')).toBe(true);
    area.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(area.querySelector('ui-cursor-item')!.hasAttribute('ui-active')).toBe(false);
  });

  it('keeps the native cursor for touch pointers', () => {
    const area = document.createElement('ui-cursor');
    area.innerHTML = '<ui-cursor-item>View</ui-cursor-item>';
    document.body.append(area);
    area.dispatchEvent(point('pointerenter', 40, 50, 'touch'));
    expect(area.querySelector('ui-cursor-item')!.hasAttribute('ui-active')).toBe(false);
  });

  it('applies distortion but disables the cursor on coarse mobile devices when requested', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('pointer: coarse'), addEventListener() {} }));
    const area = document.createElement('ui-cursor');
    area.setAttribute('ui-name', 'image');
    area.setAttribute('ui-distortion', 'distortion-2');
    area.setAttribute('ui-mobile-disabled', '');
    area.innerHTML = '<ui-cursor-item ui-name="image">Image</ui-cursor-item>';
    document.body.append(area);
    const item = area.querySelector('ui-cursor-item')!;
    area.dispatchEvent(point('pointerenter', 40, 50));
    expect(item.hasAttribute('ui-active')).toBe(false);
    area.removeAttribute('ui-mobile-disabled');
    area.dispatchEvent(point('pointerenter', 40, 50));
    expect(item.hasAttribute('ui-active')).toBe(true);
    expect(item.dataset['distortion']).toBe('distortion-2');
  });
});

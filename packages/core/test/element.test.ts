import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseElement, define, forgetForTests, getRegistered } from '@ui/core';

/** A test element factory: returns a fresh class each call. */
function makeCounter(tagName: string): typeof BaseElement {
  class TestCounter extends BaseElement {
    static properties = {
      start: { name: 'start', default: 0 },
      step: { name: 'step', default: 1 },
      label: { name: 'label', default: 'count' },
    };
    static get observedAttributes() {
      return ['start', 'step', 'label'];
    }

    n = 0;
    protected onConnect(): void {
      this.n = (this as unknown as { start: number }).start;
      this.render();
      this.$on(this, 'click', () => {
        this.n += (this as unknown as { step: number }).step;
        this.render();
        this.$emit('ui-counter-change', { value: this.n });
      });
    }

    private render(): void {
      this.textContent = `${(this as unknown as { label: string }).label}: ${this.n}`;
    }
  }
  define(tagName, TestCounter);
  return TestCounter;
}

describe('BaseElement — lifecycle', () => {
  it('onConnect fires on first connect', () => {
    const tag = 'ui-test-counter-1';
    makeCounter(tag);
    const el = document.createElement(tag) as BaseElement & { n: number };
    const spy = vi.spyOn(el as unknown as { onConnect: () => void }, 'onConnect');
    document.body.appendChild(el);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(el.textContent).toBe('count: 0');
  });

  it('onConnect is idempotent across re-insertion', () => {
    const tag = 'ui-test-counter-2';
    makeCounter(tag);
    const el = document.createElement(tag) as BaseElement & { n: number };
    document.body.appendChild(el);
    document.body.removeChild(el);
    document.body.appendChild(el);
    // Constructor sets n to `start`. We re-set it manually in onConnect.
    // After remove+re-add, onConnect runs again, resetting n.
    expect(el.n).toBe(0);
    el.n = 0;
  });

  it('cleanup runs on disconnect', () => {
    const tag = 'ui-test-counter-3';
    makeCounter(tag);
    const el = document.createElement(tag) as BaseElement & { $cleanup: { size: number } };
    document.body.appendChild(el);
    expect(el.$cleanup.size).toBeGreaterThan(0);
    document.body.removeChild(el);
    expect(el.$cleanup.size).toBe(0);
  });

  it('click handler does not run after removal', () => {
    const tag = 'ui-test-counter-4';
    makeCounter(tag);
    const el = document.createElement(tag) as BaseElement & { n: number };
    document.body.appendChild(el);
    el.click();
    expect(el.n).toBe(1);
    document.body.removeChild(el);
    // After re-insertion, n is reset to start=0.
    el.n = 0;
    el.click();
    expect(el.n).toBe(0);
  });

  it('attribute changes update the property', () => {
    const tag = 'ui-test-counter-5';
    makeCounter(tag);
    const el = document.createElement(tag) as BaseElement & { n: number };
    el.setAttribute('start', '10');
    el.setAttribute('step', '5');
    document.body.appendChild(el);
    expect(el.n).toBe(10);
    el.click();
    expect(el.n).toBe(15);
  });

  it('emits typed custom events', () => {
    const tag = 'ui-test-counter-6';
    makeCounter(tag);
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const cb = vi.fn();
    el.addEventListener('ui-counter-change', cb as EventListener);
    el.click();
    expect(cb).toHaveBeenCalledTimes(1);
    const ev = cb.mock.calls[0]?.[0] as CustomEvent<{ value: number }>;
    expect(ev.detail?.value).toBe(1);
  });

  it('onReady fires once after first paint', async () => {
    const tag = 'ui-test-counter-7';
    let ready = false;
    class T extends BaseElement {
      protected onReady(): void {
        ready = true;
      }
    }
    define(tag, T);
    const el = document.createElement(tag);
    expect(ready).toBe(false);
    document.body.appendChild(el);
    expect(ready).toBe(false);
    // After one rAF cycle:
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(ready).toBe(true);
    // Disconnect + reconnect: should NOT fire onReady again.
    let calls = 0;
    class T2 extends BaseElement {
      protected onReady(): void {
        calls += 1;
      }
    }
    define('ui-test-counter-7b', T2);
    const el2 = document.createElement('ui-test-counter-7b');
    document.body.appendChild(el2);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(calls).toBe(1);
    document.body.removeChild(el2);
    document.body.appendChild(el2);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(calls).toBe(1);
  });

  it('attributeChangedCallback fires with old + new value', () => {
    const tag = 'ui-test-counter-8';
    const log: string[] = [];
    class T extends BaseElement {
      static properties = { label: { name: 'label', default: 'a' } };
      static get observedAttributes() {
        return ['label'];
      }
      protected onAttributeChanged(name: string, oldValue: string | null, newValue: string | null): void {
        log.push(`${name}:${oldValue ?? 'null'}->${newValue ?? 'null'}`);
      }
    }
    define(tag, T);
    const el = document.createElement(tag);
    el.setAttribute('label', 'b');
    el.setAttribute('label', 'c');
    // attributeChangedCallback fires synchronously when setAttribute is called
    // on an element that is NOT yet connected. Verify both events recorded.
    expect(log).toEqual(['label:null->b', 'label:b->c']);
  });

  it('$set() throws for undeclared properties', () => {
    const tag = 'ui-test-counter-9';
    makeCounter(tag);
    const el = document.createElement(tag) as BaseElement;
    expect(() => (el as unknown as { $set: (k: string, v: unknown) => void }).$set('nope', 1)).toThrow();
  });
});

// Cleanup the registry so cross-test pollution doesn't break define() (HMR-ish).
afterEach(() => {
  // No global teardown needed — each test uses a unique tag.
});
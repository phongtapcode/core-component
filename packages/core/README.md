# @ui/core

Foundation for every `<ui-…>` element. The only mandatory dependency of the rest of the library.

## What it provides

| Module | Surface |
|---|---|
| `BaseElement` | Abstract `HTMLElement` subclass with lifecycle, attribute reflection, cleanup wiring. |
| `CleanupRegistry` | Per-element teardown registry. |
| `ObserverManager` | Shared `IntersectionObserver` / `ResizeObserver` pool. |
| Attribute reflection | `static properties = {…}` + automatic `<attr>` ↔ JS property binding. |
| Event helpers | `$on`, `$once`, `$emit`. |
| Responsive | `getBreakpointState`, `onBreakpointChange`. |
| `define()` | `customElements.define()` wrapper with introspection. |

## Quick start

```ts
import { BaseElement, define } from '@ui/core';

class Counter extends BaseElement {
  static properties = {
    start: { type: 'number' as const, default: 0, attr: 'start' },
    step:  { type: 'number' as const, default: 1, attr: 'step' },
  };

  static get observedAttributes() {
    return ['start', 'step'];
  }

  private _n = 0;

  protected onConnect(): void {
    this._n = this.start;
    this.render();
    this.$on(this, 'click', () => {
      this._n += this.step;
      this.render();
    });
  }

  private render(): void {
    this.textContent = String(this._n);
  }
}

define('ui-counter', Counter);
```

```html
<ui-counter start="0" step="1"></ui-counter>
```

## Lifecycle contract

| Hook                  | Fires                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `constructor`        | Field init only. NO DOM, NO observers, NO timers.                    |
| `onConnect()`        | Every time the element is attached to the DOM.                       |
| `onReady()`          | Once, after the first paint following the first `onConnect()`.      |
| `onDisconnect()`     | Every time the element is detached (after cleanup has run).         |
| `onAdopted()`        | When the element is moved between documents.                        |
| `onAttributeChanged` | After the property has been updated from the new attribute value.      |

## Cleanup rules

- Every `addEventListener`, observer subscription, timer, and rAF handle MUST be registered through a `CleanupRegistry` (use the `$on` / `$observeIntersection` / `$afterPaint` helpers, or `this.$cleanup.add(fn)`).
- `disconnectedCallback` calls `this.$cleanup.run()` automatically — every teardown fires in registration order with isolated error handling.
- Re-insertion is fully idempotent: `onConnect()` runs again as if the element were new.

## Testing

```bash
pnpm --filter @ui/core test
```

Tests run in `happy-dom` and inject mocks for `IntersectionObserver` / `ResizeObserver` via `setObserverConstructors({ io, ro })`.
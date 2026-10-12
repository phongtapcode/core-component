# Architecture

See `CORE_ARCHITECTURE.md` in the project repository for the full design
document. Highlights:

## Custom element prefix

`<ui-…>`. Public API uses tag form, Action UI and Noun UI.

```html
<ui-modal>...</ui-modal>     <!-- noun: an object -->
<ui-animate>...</ui-animate> <!-- verb: an action -->
```

## Lifecycle

Every element extends `BaseElement` from `@ui/core`:

- `onConnect()` — every time the element is attached.
- `onReady()` — once, after first paint following the first attach.
- `onDisconnect()` — every time the element is detached (after cleanup runs).
- `onAdopted()` — when the element is moved between documents.

Re-insertion is fully idempotent. `onConnect()` runs again as if the element
were new.

## Cleanup

Every listener, observer, timer, and rAF handle is registered through a
`CleanupRegistry`. `disconnectedCallback` runs the registry. Re-insertion is
safe.

## Shared observers

`ObserverManager` shares `IntersectionObserver` and `ResizeObserver` instances
across components with matching config. Two `<ui-animate threshold="0.2">`s
on a page = ONE observer.

## CSS Custom Properties

Every visual aspect is overridable via CSS variables:

```css
:root {
  --ui-color-accent: #6366f1;
  --ui-duration-base: 200ms;
  --ui-modal-width: 600px;
  --ui-carousel-gap: 1rem;
}
```

Component-specific tokens follow the `--ui-<component>-<prop>` convention.

## Reduced motion

Every motion component respects `prefers-reduced-motion: reduce`. Animations
collapse to instant transitions; content is never hidden permanently.
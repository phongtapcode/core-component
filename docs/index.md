# UI Core

A framework-agnostic, production-quality web component library.

## Why

- **Native**: runs in any browser, no React/Vue/Next/Shopify runtime.
- **Web Components**: built on Custom Elements + Shadow DOM + native APIs.
- **TypeScript-first**: full type safety, strict mode, `exactOptionalPropertyTypes`.
- **Tested**: every component has unit + browser tests; lifecycle cleanup is the
  primary invariant.
- **CSS-first motion**: animations use CSS + Web Animations API; no JS
  animation loops.
- **Reduced-motion aware**: every motion component respects
  `prefers-reduced-motion`.

## Quick start

```html
<script type="module">
  import '@ui/components';
</script>

<ui-animate effect="fade-up">
  Hello, world!
</ui-animate>
```

## Architecture

See [Architecture](/architecture) for the full design, including:

- [x] Custom element prefix `ui-`
- [x] Lifecycle + re-insertion idempotency
- [x] `ObserverManager` for shared observers
- [x] CSS Custom Properties as the customisation surface
- [x] `<ui-…>` API conventions

## Status

The library currently includes **38 components and effects**. The workspace test suite has **321 passing tests**.

### Shipped components

Motion: Animate, Marquee.

Basic UI: Toggle, Collapse, Accordion, Tabs, Modal, Drawer, Popover.

Media: Lazyload, PhotoSwipe, ImageComparison.

Utility: Counter, DarkMode.

Advanced: Carousel.

# UI Components

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

Phase 0–5 shipped. **60+ unit tests, 114+ tests passing**. Build, typecheck, and
unit suite pass on the master branch.

### Shipped components

Motion: Animate, Reveal, Stagger, Marquee.

Basic UI: Toggle, Collapse, Accordion, Tabs, Modal, Drawer, Popover.

Media: Lazyload, ImageZoom, ImageComparison.

Utility: Counter, DarkMode.

Advanced: Carousel.
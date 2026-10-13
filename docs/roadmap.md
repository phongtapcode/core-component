# Roadmap

See `COMPONENT_ROADMAP.md` in the repository for the full inventory. Current
status:

## Shipped

### Phase 1 — Foundation
- `packages/tokens` — CSS variables + JS constants
- `packages/core` — BaseElement, CleanupRegistry, attribute reflection,
  ObserverManager, define(), focus trap, scroll lock

### Phase 2 — Motion
- `<ui-animate>` — viewport-driven reveal with 15 effects

### Phase 3 — Basic UI
- `<ui-toggle>`, `<ui-collapse>`, `<ui-accordion>`, `<ui-tabs>`,
  `<ui-modal>`, `<ui-drawer>`, `<ui-popover>`

### Phase 4-6 — Media & utilities
- `<ui-lazyload>`, `<ui-photoswipe>`, `<ui-image-comparison>`,
  `<ui-counter>`, `<ui-dark-mode>`, `<ui-marquee>`, `<ui-carousel>`

## Deferred (REVIEW_REQUIRED)

These need reference material from the user before implementation:

- `CollectionTabs`, `Column Options`, `Dri`, `GlobalFunction`, `Group`,
  `Instagram`, `Filters`, `Countto`, `IntersectionVideo`, `Magic move`,
  `GridHoverExpand`, `LineChart`, `Modal Breakpoints`, `Cursor`, `Item`

## Future phases

- **Phase 7** — Adapters (Shopify, React) once requested
- **Phase 8** — Hardening: a11y audit, perf audit, bundle-size audit,
  cross-browser testing, documentation completeness

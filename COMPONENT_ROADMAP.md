# COMPONENT_ROADMAP.md

> **Status:** Draft v0.1 — paired with `CORE_ARCHITECTURE.md`.
> **Source of inventory:** the two screenshots supplied by the user (`/Users/phong_mac/Documents/Code/Next js/core-component/image.png` — "XO Components" home/gallery, partial list visible; `/Users/phong_mac/Documents/Code/Next js/core-component/image copy.png` — full documentation sidebar).
> **Source-of-truth rule (from §19 of `README.MD`):** the *eventual* canonical record for each component is its `meta.ts`. This document is the *pre-implementation* list used to decide *whether* a component is built and in what phase.

**Important:** Not every component the reference site has will be implemented. Each one goes through REFERENCE ANALYSIS (README §20) before implementation. Items tagged `REVIEW_REQUIRED` need reference material from the user before any decision can be made.

---

## 1. Inventory at a glance

| Category | Count | P0 | P1 | P2 | P3 | REVIEW_REQUIRED |
|---|---|---|---|---|---|---|
| CORE | 0 | 0 | 0 | 0 | 0 | 0 |
| MOTION | 4 | 1 | 0 | 2 | 1 | 0 |
| LAYOUT | 4 | 0 | 1 | 1 | 0 | 2 |
| NAVIGATION | 3 | 0 | 1 | 1 | 0 | 1 |
| OVERLAY | 6 | 0 | 3 | 3 | 0 | 0 |
| MEDIA | 7 | 0 | 1 | 4 | 1 | 1 |
| UTILITY | 5 | 0 | 1 | 3 | 1 | 0 |
| ADVANCED | 4 | 0 | 0 | 1 | 3 | 0 |
| ADAPTER-SPECIFIC | 0 | 0 | 0 | 0 | 0 | 0 |
| **Total** | **33** | **1** | **7** | **15** | **6** | **4** |

`CORE` (foundation components beyond `<ui-animate>` & similar) is empty because the foundation pieces (`base-element`, `tokens`, `motion` engine) live in `packages/core` and `packages/motion` and are tracked in `CORE_ARCHITECTURE.md`, not here.

---

## 2. Priority definitions

| Priority | Meaning | Build phase |
|---|---|---|
| **P0** | Blockers for everything else — must exist before P1 components are usable. | Phase 1 / Phase 2 |
| **P1** | High-value, frequently reused, simple enough to ship quickly. | Phase 3 |
| **P2** | Important but more complex or lower frequency. | Phase 4 / 5 / 6 |
| **P3** | Advanced or specialised — only after foundations are solid. | Phase 7 |
| **REVIEW_REQUIRED** | Not enough information or likely should not be implemented. | — |

---

## 3. MOTION

| Component | Reference name | Priority | Status | Notes |
|---|---|---|---|---|
| Animate | Animate | **P0** | To build | First motion component; defines the motion engine contract. Includes the basic effect set: fade, fade-up/down/left/right, slide-up/down/left/right, zoom-in/out, scale-up/down, blur, rotate. |
| Marquee | — (proposed) | P2 | To build | Not visible in screenshots but listed in `README.MD` §5 (`packages/motion/marquee`). Adds CSS-only ticker. |
| Reveal | — (proposed) | P2 | To build | Single-shot reveal without the Animate effect taxonomy. |
| IntersectionVideo | IntersectionVideo | P3 | REVIEW_REQUIRED | Sounds like "play a video only when in viewport". Could merge with `<ui-lazyload>` + `<video>`. **NEEDS_REFERENCE:** exact behaviour and attribute surface. |
| Parallax | — (proposed) | P3 | To build | `prefers-reduced-motion` must disable entirely. |
| GridHoverExpand | GridHoverExpand | P3 | REVIEW_REQUIRED | Hover interaction on grid items is too site-specific for a baseline library. **NEEDS_REFERENCE:** the exact interaction model before deciding. |
| Magic move | Magic move | P3 | REVIEW_REQUIRED | Magic Move implies FLIP animations between DOM states. Powerful but easy to over-engineer. **NEEDS_REFERENCE:** scope and intended use cases before committing. |

---

## 4. LAYOUT

| Component | Reference name | Priority | Status | Notes |
|---|---|---|---|---|
| Grid Options | Grid Options | P1 | To build | Responsive grid with `data-` attribute driven options (columns / gap / alignment). Merge with `<ui-grid>` if duplication appears. |
| Grid | Grid | P1 | To build | The basic responsive grid layout system. Foundation for many other components. |
| Column Options | Column Options | P2 | REVIEW_REQUIRED | The name suggests a Shopify-collection column-toggle. Without reference material it is too ambiguous to implement. |
| Item | Item | — | REVIEW_REQUIRED | Too generic; probably a wrapper. Skip unless a clear use-case emerges. |

---

## 5. NAVIGATION

| Component | Reference name | Priority | Status | Notes |
|---|---|---|---|---|
| Tabs | Tabs | **P1** | To build | Tabbed navigation component. Roving tabindex, ARIA-compliant, keyboard navigation. |
| Filters | Filters | P2 | REVIEW_REQUIRED | Could mean faceted-search filters (UI-heavy) or simple check/radio filters. **NEEDS_REFERENCE:** screenshot of Filters docs/attributes before deciding scope. |
| CollectionTabs | CollectionTabs | P3 | REVIEW_REQUIRED | Likely tied to Shopify "collections". Strongly recommend not implementing unless explicitly requested. |

---

## 6. OVERLAY

| Component | Reference name | Priority | Status | Notes |
|---|---|---|---|---|
| Modal | Modal | **P1** | To build | Native `<dialog>`-based, focus trap, escape-to-close, restore focus. |
| Popover | Popover | **P1** | To build | Floating popover with placement engine (top/right/bottom/left + auto-flip). |
| Collapse | Collapse | P2 | To build | Single-content-section show/hide. |
| Toast | Toast | P2 | To build | Stacked, ARIA-live, dismissable notifications. |
| Drawer | Drawer (proposed) | P2 | To build | Slide-in side panel. Modal variant of overlay. |
| Modal Breakpoints | Modal Breakpoints | P3 | REVIEW_REQUIRED | Likely a "render the modal as a drawer on small screens" feature flag. Defer until Modal + responsive breakpoints are shipped, then evaluate as a config of `Modal` rather than a new element. |
| Accordion | Accordion (proposed) | P2 | To build | Composed from `Collapse`. |

---

## 7. MEDIA

| Component | Reference name | Priority | Status | Notes |
|---|---|---|---|---|
| Lazyload | Lazyload | **P1** | To build | `<img loading="lazy">` + native `IntersectionObserver` for richer behaviour (placeholder, blur-up, srcset). |
| Gallery | Gallery | P2 | To build | Composable thumbnail/lightbox layout. Pair with `<ui-image-zoom>` and `<ui-modal>`. |
| ImageZoom | ImageZoom | P2 | To build | Click/tap/hover-to-zoom. Native pointer events, no third-party engine. |
| ImageComparison | ImageComparison | P2 | To build | Before/after slider. Pointer + keyboard. |
| Video | Video (proposed) | P2 | To build | Custom-element wrapper around `<video>` with poster, lazy preload, captions, IntersectionObserver-driven autoplay. |
| IntersectionVideo | IntersectionVideo | P3 | REVIEW_REQUIRED | Likely a subset of `<ui-video>` (autoplay-when-visible). Decide after `<ui-video>` exists. |
| Instagram | Instagram | — | REVIEW_REQUIRED | Platform-specific feed. **RECOMMENDATION:** do not implement — too tied to a single social platform. If a "social-feed embed" abstraction is wanted, design a generic `<ui-social-embed>` instead and leave Instagram to consumers. |

---

## 8. UTILITY

| Component | Reference name | Priority | Status | Notes |
|---|---|---|---|---|
| Toggle | Toggle | **P1** | To build | Switch / checkbox replacement. |
| Countdown | Countdown | P2 | To build | Time-until countdown with `prefers-reduced-motion`. |
| Countto | Countto | P2 | REVIEW_REQUIRED | "Count-to" is typically a number animator (0 → N). Likely overlaps with `<ui-counter>`. Decide after `<ui-counter>` exists; otherwise rename/replace. |
| DarkMode | DarkMode | P2 | To build | Theme manager (light/dark/auto via `prefers-color-scheme`). |
| Cursor | Cursor | P3 | REVIEW_REQUIRED | Custom cursors are largely decorative and can hurt accessibility. **RECOMMENDATION:** do not implement by default. Revisit only if requested. |

---

## 9. ADVANCED

| Component | Reference name | Priority | Status | Notes |
|---|---|---|---|---|
| Carousel | Carousel | P2 | To build | Touch-friendly slider with keyboard, reduced-motion, autoplay-pause-on-focus, internal physics engine (internal scope, public API stays `<ui-carousel>`). |
| CircleBar | CircleBar | P2 | To build | Circular progress / skill indicator. Pure SVG + WAAPI. |
| LineChart | LineChart | P3 | REVIEW_REQUIRED | A charting primitive is useful but is a *whole subsystem* on its own. **RECOMMENDATION:** keep a `<ui-progress>` linear-bar primitive in core utilities and *skip* LineChart. If charts are needed later, ship them as a separate `@ui/charts` package outside this monorepo. |
| Magic move | Magic move | P3 | REVIEW_REQUIRED | See §3. |
| GridHoverExpand | GridHoverExpand | P3 | REVIEW_REQUIRED | See §3. |

---

## 10. ADAPTER-SPECIFIC

| Component | Reference name | Priority | Status | Notes |
|---|---|---|---|---|
| (none so far) | — | — | — | Shopify / React adapters live in `packages/adapters/` and ship only after their host framework is identified as needed. |

---

## 11. REVIEW_REQUIRED — open questions

These components need reference material before any decision. For each, please provide either:

- A screenshot of its documentation page (attribute table), or
- Copied documentation text, or
- A short description of the behaviour you want.

Once provided, this document is updated and the item moves out of `REVIEW_REQUIRED`.

| Component | Why it needs review | What to provide |
|---|---|---|
| **CollectionTabs** | Reference appears ecom/X-commerce specific. | Screenshot of docs; whether it should be implemented at all. |
| **Column Options** | Name is too generic; unclear scope. | Screenshot of docs. |
| **Dri** | Abbreviation unknown. May be a 3D rotation effect or a config name. | Screenshot of docs or a description. |
| **GlobalFunction** | Sounds like an internal helper, not a UI component. | Confirm whether it is a component at all. |
| **Group** | Too generic. May be a wrapper or a layout primitive. | Screenshot of docs and what it does. |
| **Instagram** | Platform-specific. | Confirm whether to skip or implement a generic social embed. |
| **Filters** | Could be faceted-search or simple check filters. | Screenshot of docs and intended use. |
| **Countto** | Likely overlaps `<ui-counter>`. | Confirm intended behaviour. |
| **IntersectionVideo** | Likely subset of `<ui-video>`. | Confirm intended behaviour. |
| **Magic move** | FLIP between DOM states; scope unclear. | Screenshot / use cases. |
| **GridHoverExpand** | Hover effect; site-specific. | Screenshot / use cases. |
| **LineChart** | Charts are a whole subsystem. | Confirm whether to skip or carve out as separate package. |
| **Modal Breakpoints** | Likely a feature of `<ui-modal>` itself. | Confirm intended behaviour. |
| **Cursor** | Accessibility trade-offs. | Confirm whether to skip. |
| **Item** | Too generic. | Confirm whether to skip. |

---

## 12. Acceptance criteria for promoting a component into the next priority tier

A component moves from P3 → P2 → P1 → P0 only when:

1. **Reference analysis (README §20)** is complete and the user has reviewed it.
2. **`meta.ts`** is approved (or the user has explicitly waived the requirement).
3. **No fewer than 2 `examples/*.html`** are documented.
4. **A11y / perf notes** are written into `meta`.
5. **No duplication** with existing core/motion/components.
6. **The Definition of Done checklist (CORE_ARCHITECTURE §27)** is achievable within the current phase budget.

A component can be **demoted** to `REVIEW_REQUIRED` if any of the above become unachievable or the reference material does not justify the cost.

---

## 13. Components explicitly NOT implemented in this library

The following are intentionally excluded. They are either too site-specific, too coupled to a single platform, or out of scope for a general-purpose core library. If a real use-case emerges, they are reconsidered via the REFERENCE ANALYSIS gate.

- `Instagram` — platform-specific feed embed.
- `CollectionTabs`, `Column Options`, `Filters`, `Item`, `Group`, `GlobalFunction` — pending clarification; assumed not in scope unless the user confirms.
- `Cursor` — accessibility trade-offs outweigh the benefit for a default component.

---

## 14. Open questions for the user

1. **Are there components from the reference you want that I have marked P2 or P3 that should be higher priority?** I have only marked `Animate` as P0 because every motion-using component depends on it.
2. **Which of the REVIEW_REQUIRED components do you actually want?** Please send screenshots/docs for those you want; I'll skip the rest.
3. **Are there components from the reference I have NOT listed?** (My list comes from the visible documentation sidebar in `image copy.png`.) If you can name anything not on the sidebar, add it here.
4. **Should I plan for a Shopify adapter in Phase 8, or defer it indefinitely?** Same question for the React adapter.

---

*End of `COMPONENT_ROADMAP.md` v0.1.*
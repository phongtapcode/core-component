# CORE_ARCHITECTURE.md

> **Status:** Draft v0.1 — awaiting approval.
> **Authoritative source for:** project scope, technology choices, package boundaries, lifecycle, observers, events, attributes, CSS tokens, custom-element naming, metadata source-of-truth, `/html` & `/docs` architecture, routing, testing, build, dependency policy, accessibility, performance, phases, risks, Definition of Done.
>
> Any deviation from this document must be justified in writing in `ARCHITECTURE_CHANGES.md` and approved before implementation.

---

## 1. Project goals

Build a production-grade, **framework-agnostic, universal component/core library** that:

1. Runs natively in a modern browser **without React, Vue, Next.js, Shopify, WordPress, PHP, or ASP.NET** as a runtime dependency.
2. Provides a single, predictable HTML custom-element API (`<ui-…>`) that any host page can drop in.
3. Exposes a reusable **motion engine**, **observer manager**, **lifecycle base**, **metadata schema**, and **design tokens** so that components share infrastructure instead of reinventing it.
4. Ships two companion surfaces:
   - `/html/` — a *live* component gallery for QA, visual review, and demos.
   - `/docs/` — *API* documentation for developers (and for AI coding agents).
5. Maintains **one source of truth** for component metadata; both surfaces are generated from that source.
7. Treats accessibility, lifecycle safety, and bundle hygiene as release blockers (see §27 Definition of Done).

## 2. Non-goals

- Become a port of any reference site (including XO Theme Dev).
- Become a React-first library with Web Components as a side-effect. Web Components are the public API.
- Replace every component the reference site has. Each reference component must pass REFERENCE ANALYSIS (§20 of `README.MD`) before implementation.
- Depend on heavyweight third-party animation/scroll libraries as part of the public API. Internal-only engines are allowed under the policy in §21.
- Support browsers that lack native `CustomElementRegistry`, `IntersectionObserver`, `ResizeObserver`, `Shadow DOM`, and ES2020. We target evergreen browsers (Chrome/Edge/Firefox/Safari ≥ last 2 stable majors).

---

## 3. Technology decisions

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | Predictable types for an API consumed by AI agents. |
| Component model | **Web Components / Custom Elements v1** | Runs in any browser, no framework runtime required. |
| Styling | **Native CSS** + **CSS Custom Properties** | No preprocessor, deepest customisation surface, plays nicely with Shadow DOM via `inherit`. |
| Basic animation | CSS transitions / `@keyframes` | Zero JS overhead for simple motion. |
| Programmatic animation | **Web Animations API** | Native timeline with cancellation/composition. Avoids rAF loops. |
| Viewport detection | **IntersectionObserver** | Replaces scroll listeners. |
| Size detection | **ResizeObserver** | Live-declaring layout changes. |
| rAF | `requestAnimationFrame` (only when WAAPI cannot express the motion) | Last resort. |
| Monorepo | **pnpm workspaces** | Disk-efficient, fast, deterministic. |
| Dev server | **Vite** | Native ESM, first-class web-component dev story, Rollup-compatible. |
| Production build | **Rollup** (per package) + Vite for app surfaces | Library output bundles clean for apps. |
| Unit tests | **Vitest** | Native ESM, fast, Jest-compatible API. |
| Browser / E2E | **Playwright** | Multi-engine, supports reduced-motion emulation, accessibility tree. |
| Documentation | **VitePress** | Vue-based but builds to static HTML; markdown-first; we keep Vue out of the public API by not exposing VitePress internals. |
| `/html` gallery | **Vite + native TS SPA** (no UI framework) | Avoids framework drift; the gallery is a dev tool, not consumer-facing. |
| Lint | **ESLint** (typescript-eslint) + **Prettier** | One style, no debates. |
| Releases | Changesets | Per-package versioning aligned with monorepo best practice. |

**Rejected:** Tailwind (would force utility classes into shadow DOM and fight the customisation model), Lit/Stencil (would shift our public API toward their conventions), GSAP / Lottie as a hard dependency (would couple our public API to a vendor — see §21).

---

## 4. Repository structure

```text
core-component/
├── packages/
│   ├── tokens/            # CSS custom-property tokens + JS constants (z-index, easing curves, breakpoints)
│   ├── core/              # BaseElement, lifecycle, CleanupRegistry, ObserverManager, events, attribute utils, responsive utils, types
│   ├── motion/            # Animate, Parallax, Marquee — built on core
│   ├── components/        # Carousel, Modal, Drawer, Tabs, Collapse, Accordion, Popover, Toggle, Toast
│   ├── media/             # Gallery, PhotoSwipe, ImageComparison, Lazyload, Video
│   ├── adapters/          # shopify, react (later phases)
│   └── test-utils/        # Shared Vitest fixtures, fixture components for cross-package testing
├── html/                  # Live component gallery (Vite + native TS SPA)
├── docs/                  # VitePress site (developer documentation)
├── tests/
│   └── e2e/              # Playwright cross-component suites
├── references/            # User-supplied reference material (screenshots, docs, recordings)
├── tools/                 # Internal scripts: meta aggregation, gallery scaffolder, docs scaffolder
├── .changeset/            # Changesets release notes
├── ARCHITECTURE_CHANGES.md # Required log for any deviation from this file
├── CORE_ARCHITECTURE.md   # This file
├── COMPONENT_ROADMAP.md   # Component inventory
├── README.MD              # Project charter (from user)
└── package.json           # pnpm workspace root
```

**Notes:**

- `tokens` produces **CSS only** + a tiny `.json` of constants for TS. It has zero runtime JS.
- `core` is the only mandatory dependency for everything else.
- `motion` may be depended on by `components` and `media` but must remain tree-shakeable per effect.
- `adapters` is allowed to depend on anything; its public API never reaches the consumer's `<ui-…>` markup (adapters wrap, they don't replace).

---

## 5. Package boundaries

Each package is independently buildable, publishable, and testable.

| Package | Public surface | Depends on | Forbidden from |
|---|---|---|---|
| `tokens` | CSS file, JSON token map | — | Running JS in the consumer's page |
| `core` | `BaseElement`, `CleanupRegistry`, `ObserverManager`, `define()`, types | `tokens` | Importing from `motion`, `components`, `media`, `adapters` |
| `motion` | `<ui-animate>`, `<ui-parallax>`, `<ui-marquee>` | `core`, `tokens` | Importing from `components` / `media` / `adapters` |
| `components` | `<ui-*>` components outside motion/media | `core`, `tokens`, `motion` (optional) | Importing from `adapters` |
| `media` | `<ui-gallery>`, `<ui-photoswipe>`, etc. | `core`, `tokens`, `motion` (optional) | Importing from `adapters` |
| `adapters` | Per-framework wrappers (Shopify Liquid, React) | everything | Mutating the `<ui-*>` tag behaviour from outside |
| `test-utils` | Internal only | `core` | Being imported by any shipped package's runtime |

**Cross-package rules:**

1. No package may import another package's **internal** modules (`/internal/`, `__tests__/`).
2. No circular deps. `madge` enforces this in CI.
3. No package re-exports another package's *full barrel*. Import from the entry point only.
4. Public type-level only exports go through `src/index.ts`. Everything else is internal.

---

## 6. Base component architecture

We adopt a composition model instead of a deep class chain, per §6's "do not blindly implement this hierarchy if composition provides a cleaner solution."

```text
HTMLElement
   │
   └── BaseElement (extends HTMLElement)
        ├── CleanupRegistry: addEventListener, observe, timer, rAF are registered here
        ├── Attribute ↔ Property reflection (driven by `static properties`)
        ├── Lifecycle state machine (created → connected → ready → disconnected → destroyed)
        ├── `onConnect()` / `onDisconnect()` hooks (subclasses override)
        └── Behaviors: opt-in mixins (`withFocusTrap`, `withSlotWatcher`, `withResizeObserver`, `withIntersectionObserver`)
              Each behavior returns a new class extending BaseElement.
```

**Why composition over deep inheritance:**

- Behaviors like *focus trap* and *slot watching* are orthogonal — a modal needs focus trap + scroll lock, a carousel needs slot watcher + resize observer + intersection.
- A subclass chain (`BaseElement → OverlayElement → ModalElement`) tangles concerns; mixins keep each concern's tests small and independent.
- Custom-element subclasses are single-inheritance. Mixins solve this without inventing our own multiple-inheritance system.

**`BaseElement` contract (sketch):**

```ts
abstract class BaseElement extends HTMLElement {
  static properties?: PropertyDefMap;
  static parts?: string[];

  // Subclass hooks (override, not call super)
  protected onConnect?(): void;
  protected onDisconnect?(): void;

  // Framework
  protected readonly $cleanup = new CleanupRegistry(this);
  $on<K extends keyof HTMLElementEventMap>(el: EventTarget, type: K, listener: ...): this;
  $nextTick(cb: () => void): this;
  $emit<T>(type: string, detail?: T): this;

  // Lifecycle
  connectedCallback(): void;
  disconnectedCallback(): void;
  adoptedCallback(): void;
}
```

**`define()`** — a single registration helper that wraps `customElements.define()` and stores the registration in a registry map so `/html` can introspect what's available.

---

## 7. Lifecycle architecture

States:

```text
created ──► connected ──► ready ──► disconnected ──► (re-insert) ──► connected …
   │           │             │              │
   │           │             │              └─► destroyed (only if permanently removed)
   │           │             └─► first paint completed, observers attached
   │           └─► DOM attached, attributes reflected, observers/lazy init registered
   └─► element instance allocated
```

Rules:

1. `onConnect()` and `onDisconnect()` may fire **multiple times**. Components must be idempotent across re-insertion.
2. `connectedCallback` → call `this.onConnect()` (user's init) → schedule first paint via `requestAnimationFrame` (so attributes set via the first parsed HTML are reflected before we measure).
3. `disconnectedCallback` → call `this.$cleanup.run()` (kills observers, listeners, timers, RAF) → call `this.onDisconnect()` for subclass-specific work (e.g. restoring body scroll lock).
4. `adoptedCallback` → same as `disconnectedCallback` then `connectedCallback`.
5. **No work in constructors** beyond field assignment. No `addEventListener`, no `new IntersectionObserver`, no `setTimeout`, no DOM lookups. Anything that touches the document must wait for `connectedCallback`.

```ts
// Strict constructor rule (enforced by ESLint custom rule `ui/no-side-effects-in-constructor`)
constructor() {
  super();
  this.$cleanup = new CleanupRegistry(this);
  // nothing else allowed here
}
```

---

## 8. Cleanup / disposal strategy

A single `CleanupRegistry` per element tracks:

- `addEventListener` calls (with their target and options)
- `IntersectionObserver.observe` / `ResizeObserver.observe` calls
- `setTimeout` / `setInterval` handles
- `requestAnimationFrame` handles
- Third-party engine subscriptions (when an internal engine is used)
- Focus listeners on document (for modals/drawers)

```ts
class CleanupRegistry {
  private tasks: Array<() => void> = [];
  add(fn: () => void): void { this.tasks.push(fn); }
  run(): void {
    for (const t of this.tasks.splice(0)) {
      try { t(); } catch (e) { console.error('[ui] cleanup failed:', e); }
    }
  }
}
```

Every helper (`$on`, `$observe`, `$nextTick`, `$afterPaint`, `withFocusTrap`) **must** register its cleanup. The Definition of Done (§27) requires a Playwright test that proves a removed component does not fire listeners/observers after removal.

---

## 9. Observer architecture

A single **`ObserverManager` singleton** (per `document`) shares observers across components when their config matches.

```ts
type ObserveKey = string; // hash of threshold + rootMargin + type

class ObserverManager {
  observe(el: Element, opts: IntersectionObserverInit, cb: (entry: IntersectionObserverEntry) => void): Disposer;
  unobserve(key: ObserveKey, el: Element): void;
}
```

Behaviour:

- IntersectionObservers are keyed by `(rootMargin, threshold-set)`. Two `<ui-animate>`s with `threshold="0.2"` share one observer.
- ResizeObservers are keyed by `box`.
- The manager holds weak references so disconnected elements are GC'd.
- If the manager's shared observer is destroyed (last unsubscriber), the next `observe` creates a fresh one.

This implements the "shared observer infrastructure" requirement from §12 of `README.MD`.

---

## 10. Event architecture

Conventions:

- All custom events are dispatched via `this.$emit(name, detail)` (typed via a `CustomEvent<T>` factory).
- Naming: `ui-{component}-{event}` in lowercase kebab. Examples: `ui-modal-open`, `ui-modal-close`, `ui-carousel-change`, `ui-tabs-change`, `ui-animate-reveal`, `ui-animate-reset`.
- Events bubble by default unless marked private (`{ bubbles: false }`).
- All events are `composed: true` so they cross Shadow DOM boundaries.

Listener registration rules:

- Internal handlers (the component reacting to its own events) → `this.addEventListener(...)` registered via `$cleanup`.
- External/document handlers (escape to close, scroll lock) → registered via `$on(document, ...)` so they are cleaned up on disconnect.
- Pointer / keyboard handlers on host → registered on `this` via `$on`.

Keyboard conventions (must be consistent across all components):

| Key | Behaviour (where applicable) |
|---|---|
| `Escape` | Close overlay / cancel transient interaction |
| `Enter` / `Space` | Activate primary action |
| `Tab` / `Shift+Tab` | Move focus within the component |
| `Arrow keys` | Move within composite widgets (Tabs, Carousel, Menu) |
| `Home` / `End` | First / last item |
| `PageUp` / `PageDown` | Page-level move (Carousel, Gallery) |

---

## 11. Attribute / property architecture

**One declarative source of truth** for each component:

```ts
// In every component file
static properties = {
  duration: { type: Number, default: 600, attr: 'duration' },
  delay:    { type: Number, default: 0,   attr: 'delay' },
  once:     { type: Boolean, default: true, attr: 'once', reflect: true },
  effect:   { type: String, default: 'fade-up', attr: 'effect' },
} as const;
```

Rules:

- Attributes are **kebab-case** (`once`, `root-margin`).
- Properties are **camelCase** (`rootMargin`).
- For each property: type, default, `reflect` (default false except `disabled`, `open`, `once`), and an optional `parse`/`serialize` for complex types.
- `BaseElement.attributeChangedCallback` consults `static properties` to reflect the change to the property and dispatch a `ui-{name}-attribute-change` event for any listener that wants raw attribute mutations.
- Numeric / boolean / JSON coercion lives in `core/attributes.ts` and is shared.
- **Do not use string-only APIs.** Components must not require `JSON.parse(setting)` from consumers.

For complex types (e.g. `effect` strings with sub-options), expose structured child attributes (`<ui-animate effect="fade-up" from-opacity="0">`) rather than a single opaque blob.

---

## 12. CSS architecture

- Every visual aspect of a component is overridable via **CSS Custom Properties**.
- Each component ships **two CSS files**:
  1. `tokens.css` — exports the component's tokens into the cascade (so they can be set globally and inherited).
  2. `styles.css` — the actual host / `::part` / slotted rules.
- Shadow DOM is used **by default** for component-localised styles, but with `mode: 'open'` and tokens consumed via `var(--ui-…, fallback)`.
- `:host` styles define defaults; consumers can reach inside via `::part(name)`.
- Slotted content is styled by the host using `::slotted(...)` only when necessary. Component-internal styles never leak; consumers override via `::part`.

**No hardcoded colors or sizes outside `packages/tokens`.** This is enforced by an ESLint rule that flags `#`, `hsl`, `px`, `rem`, `em` literals in any CSS file outside `tokens/` (with an inline disable comment allowed for one-off values).

---

## 13. CSS token naming

A two-level token system:

### Level 1 — Global tokens (in `packages/tokens/css/tokens.css`)

```text
/* Durations */
--ui-duration-instant: 80ms;
--ui-duration-fast: 150ms;
--ui-duration-base: 300ms;
--ui-duration-slow: 600ms;

/* Easings */
--ui-easing-standard: cubic-bezier(0.2, 0, 0, 1);
--ui-easing-decelerate: cubic-bezier(0, 0, 0, 1);
--ui-easing-accelerate: cubic-bezier(0.3, 0, 1, 1);
--ui-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);

/* Distance */
--ui-distance-short: 0.5rem;
--ui-distance-base: 1rem;
--ui-distance-long: 2rem;

/* Z-index scale */
--ui-z-hide: -1;
--ui-z-base: 1;
--ui-z-sticky: 100;
--ui-z-overlay: 1000;
--ui-z-modal: 1100;
--ui-z-toast: 1200;
--ui-z-tooltip: 1300;

/* Surfaces / text */
--ui-color-surface: #ffffff;
--ui-color-surface-raised: #fafafa;
--ui-color-text: #111111;
--ui-color-text-muted: #555555;
--ui-color-border: #e5e5e5;
--ui-color-accent: #2563eb;
--ui-color-focus: #2563eb;

/* Layout */
--ui-radius-sm: 4px;
--ui-radius-base: 8px;
--ui-radius-lg: 16px;
--ui-shadow-1: 0 1px 2px rgba(0,0,0,0.05);
--ui-shadow-2: 0 8px 24px rgba(0,0,0,0.08);

/* Breakpoints (consumed via JS, not CSS) */
--ui-bp-sm: 640px;
--ui-bp-md: 768px;
--ui-bp-lg: 1024px;
--ui-bp-xl: 1280px;
```

### Level 2 — Component tokens

Format: `--ui-{component}-{prop}`. Examples:

```text
--ui-modal-width: 480px;
--ui-modal-max-height: 90vh;
--ui-modal-radius: var(--ui-radius-lg);

--ui-drawer-size: 320px;
--ui-carousel-gap: 0px;
--ui-carousel-slide-size: 100%;
--ui-tabs-underline: 2px;
--ui-toast-gap: var(--ui-distance-base);
--ui-popover-arrow-size: 8px;
```

Components **must not** invent new global tokens. New globals require updating this document.

---

## 14. Custom Element naming / prefix

- **Prefix:** `ui-` (Universal Interface).
- **Tag form:** `ui-{kebab-name}` (kebab-variant). One tag per component; variants live in attributes, not new tags.
- **CSS classes inside Shadow DOM** (BEM-style, scoped to the component): `.ui-{name}__element--modifier`.
- **Public API surface — naming conventions:**

  | Surface | Convention | Example |
  |---|---|---|
  | Element tag | `ui-{name}` | `<ui-modal>` |
  | HTML attribute | kebab-case | `aria-label`, `root-margin`, `autoplay` |
  | JS property | camelCase | `rootMargin`, `autoPlay` |
  | Custom event | `ui-{name}-{event}` | `ui-modal-open` |
  | CSS variable | `--ui-{name}-{prop}` | `--ui-modal-width` |
  | CSS part | `part="name"` | `part="track"` |
  | Slot name | `slot="name"` | `slot="header"` |
  | Method | camelCase verb | `open()`, `close()`, `goto(index)` |

- **Naming etiquette for AI agents:** the action-style is named via `<ui-{verb}>` (e.g., `<ui-animate>`, `<ui-toggle>`, `<ui-collapse>`). The noun-style for things that *are* objects is `<ui-{noun}>` (e.g., `<ui-modal>`, `<ui-tabs>`, `<ui-carousel>`). The metadata file `COMPONENT_ROADMAP.md` records both.

---

## 15. Component metadata / source-of-truth design

**Goal (from §19 of `README.MD`):** one place defines `name / description / category / tagName / attributes / properties / methods / events / cssVariables / slots / a11y`. The HTML gallery and the docs site read from it.

```ts
// packages/components/<name>/meta.ts
import type { ComponentMeta } from '@ui/core/meta';

export const meta: ComponentMeta = {
  name: 'Animate',
  slug: 'animate',
  tagName: 'ui-animate',
  category: 'MOTION',
  description: 'Reveal content when it enters the viewport.',
  since: '0.1.0',

  attributes: {
    effect:    { type: 'string',  default: 'fade-up', description: '…' },
    duration:  { type: 'number',  default: 600,        description: '…' },
    delay:     { type: 'number',  default: 0,          description: '…' },
    threshold: { type: 'number',  default: 0.2,         description: '…' },
    once:      { type: 'boolean', default: true,        description: '…' },
  },

  properties: { /* same shape, may differ in type/format */ },

  events: {
    'ui-animate-reveal': { detail: '{ entry: IntersectionObserverEntry }', description: '…' },
    'ui-animate-reset':  { detail: '{}',                                     description: '…' },
  },

  methods: {
    play():    { description: '…' },
    reset():   { description: '…' },
  },

  cssVariables: {
    '--ui-animate-duration': { default: 'var(--ui-duration-base)', description: '…' },
    '--ui-animate-distance': { default: 'var(--ui-distance-base)', description: '…' },
  },

  cssParts: {
    root: 'The host element itself.',
  },

  slots: {
    default: 'The content to reveal.',
  },

  a11y: 'Purely visual effect. Content remains in the DOM and readable; animation respects prefers-reduced-motion.',
};
```

**How surfaces consume it:**

- `/html/` card: `name`, `category`, `description`, `tagName` → renders the demo by reading `meta.examples` (paths to `.html` snippets).
- `/html/{slug}` page: lists the demos; each demo is a real `<ui-{name}>` usage.
- `/docs/components/{slug}` page: generated header (name + description + "View demo" link to `/html/{slug}`) + tables for attributes/properties/methods/events/cssVariables + a hand-authored `description.md` and `examples.md` (we don't auto-generate prose).
- Tests: `meta` is read by the test suite to assert that the public API contract matches the implementation (e.g., a property defined in `meta` must exist on the class).

`tools/aggregate-meta.ts` builds a `dist/components-index.json` consumed by `/html` and `/docs`.

---

## 16. /html — Live Component Gallery architecture

**Tech:** Vite + native TypeScript SPA. No UI framework. Plain DOM APIs + Shadow DOM where needed.

**Routes:**

- `/` — index page (search, categories, card grid).
- `/{slug}` — demo page for a single component.

**Features of `/`:**

- Search box (filters `components-index.json` by `name`, `description`, attribute names).
- Category filter chips (CORE / MOTION / LAYOUT / NAVIGATION / OVERLAY / MEDIA / UTILITY / ADVANCED).
- Component count per category.
- Cards link to `/{slug}`.

**Features of `/{slug}`:**

- Description (from `meta`).
- Variants / edge cases / responsive tests.
- Reset & replay button per demo.
- Accessibility test (e.g., keyboard navigation instruction).
- "View documentation" link → `/docs/components/{slug}`.

**Routing:** History API with a fallback to hash mode for static hosts. Vite dev server supports both.

**Why not reuse VitePress:** VitePress is a *documentation* site — heavy on prose, light on interactive demos. The gallery is the opposite. Keeping them separate lets us use the right tool for each.

---

## 17. /docs — Documentation architecture

**Tech:** VitePress.

**Routes:**

- `/` — homepage (sidebar index + search).
- `/components/{slug}` — generated page per component.
- `/guide/{topic}` — guides (architecture, theming, SSR, accessibility, migration, …) — hand-written markdown.
- `/reference/{topic}` — auto-generated reference (lifecycle API, base-element API, observer manager API, motion engine API).

**Page generation:** a VitePress build hook reads `packages/components/*/meta.ts` + a sibling `description.md` and `examples.md` to produce `/components/{slug}.md`. The hand-authored parts (Description prose, Examples) are stored with the component so authors can edit them in the same PR.

**Sidebar:** generated from the metadata index, grouped by category.

**Search:** VitePress's built-in search (mini-search), indexed against the generated pages.

---

## 18. Routing strategy

| Surface | Mode | Static-host friendly? |
|---|---|---|
| `/html/` | History API, fallback to hash | Yes (Vite dev server handles both; production uses 404 → index.html rewrite) |
| `/docs/` | VitePress native (history) | ✅ out of the box |
| Internal component routes | Not applicable (custom elements do not own routing) | — |

The `/html/` SPA **must** work when dropped onto a plain static host (no SSR). No server-side logic. No `process.env`. The same SPA bundle must work behind `/html/` and at root if rebuilt with `base: '/'`.

---

## 19. Testing strategy

**Layered:**

1. **Unit (Vitest):**
   - `core/lifecycle` — connect, reconnect, disconnect, re-insert, attribute reflection.
   - `core/cleanup-registry` — every cleanup kind runs once.
   - `core/observer-manager` — observer sharing, weak GC.
   - `core/attribute-parsing` — numeric, boolean, complex types.
   - `core/events` — emit / on / $nextTick.
   - `motion/*` — each effect renders the right keyframes, respects `prefers-reduced-motion`.
   - Each component: at least one unit test verifying `meta` matches the implementation.

2. **Browser / E2E (Playwright):**
   - Each component has a `component-name.spec.ts`.
   - Tests required per component:
       - [ ] renders on page (smoke)
       - [ ] initial state correct
       - [ ] attribute change → behaviour/state change
       - [ ] keyboard interaction
       - [ ] reduced-motion (`page.emulateMedia({ reducedMotion: 'reduce' })`)
       - [ ] responsive (resize viewport for breakpoint-dependent components)
       - [ ] lifecycle cleanup — remove element, dispatch a synthetic event the element used to listen to, verify no callback runs
       - [ ] re-insertion — remove, add again, verify behaviour
   - `/html` smoke: every demo page loads and primary example is visible.

3. **A11y:** `@axe-core/playwright` runs once per component; CI fails on `serious` or `critical` violations.

4. **Visual regression:** Playwright snapshots for `/html/` cards. Optional, opt-in per component (defer until Phase 9).

5. **Coverage gates:**
   - `core`: ≥95% lines.
   - `motion`: ≥90% lines.
   - components per-component: ≥85% lines (lower because some paths are browser-only).

---

## 20. Build / package strategy

- **pnpm workspaces** with one `pnpm-workspace.yaml` at the root.
- **Per-package build (Rollup):** each package emits `dist/index.mjs` (ESM), `dist/index.cjs` (CJS, optional), `dist/index.d.ts` (types), and a `package.json` with `exports` map. Sides (typescript ESM) is preferred.
- **Root dev (Vite):** the `/html` gallery and root docs are Vite apps.
- **Tooling:** `tsup` (built on Rollup) is allowed to reduce config boilerplate, as long as the output respects Rollup's tree-shaking.
- **Bundling strategy:** ESM tree-shaking. Side-effects declared as `false` in `sideEffects: false` for everything except `tokens.css`.
- **TypeScript:** project references (`composite: true`) across packages for fast incremental builds.
- **Release flow:** Changesets. PRs add a changeset; bot opens a version bump PR.
- **CI:** `pnpm install --frozen-lockfile`, `pnpm -r build`, `pnpm -r test`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`.

---

## 21. Dependency policy

- **Native-first.** No dependency added solely because it makes code shorter.
- **Allowed exceptions** require:
   1. A documented rationale in `ARCHITECTURE_CHANGES.md`.
   2. An internal-only scope (the dependency must not appear in the consumer's `<ui-…>` API surface).
   3. A documented exit plan (can we replace it later without breaking the public API?).
- **Examples of allowed internal-only engines:**
   - A custom carousel physics engine (inside `packages/components/carousel/internal/`).
   - A custom intersection/scroll utility (only if standard transforms cannot achieve the result).
- **Public-API rule:** `<ui-carousel>` remains the API even if `packages/components/carousel/internal/` is rewritten. Adapter libraries may wrap our engine; we never expose third-party internals.
- **Vendors we will not depend on:** GSAP, Lottie, Framer Motion, Tailwind, jQuery, Anime.js. If we later evaluate a small, scoped engine (e.g., a FLIP helper), it lives under `internal/` and the public API does not import it.

---

## 22. Accessibility requirements

Mandatory for every component:

- **Reduced motion:** honour `prefers-reduced-motion`. Either disable transitions/animations entirely or reduce them to instant/very-short. Provide a non-animated fallback path so content is never hidden permanently.
- **Keyboard:** full keyboard interaction. Tab order must be predictable. Enter/Space activates primary actions. Escape closes overlays.
- **ARIA:** correct roles, states, and properties. `aria-expanded`, `aria-controls`, `aria-modal`, `aria-selected`, `aria-labelledby`, `aria-describedby`, etc. Each component's `meta.a11y` documents the contract.
- **Focus management:**
   - Modal/Drawer: trap focus while open; restore focus to the trigger on close.
   - Popover/Tooltip: focus is moved to the popover only when it's interactive.
   - Tabs: roving tabindex (arrow keys move focus, Tab exits the group).
   - Carousel: roving tabindex on slides.
- **Escape:** always closes the topmost transient.
- **Tab behaviour:** correct inside the component (no focus lost to background).
- **Semantic HTML:** use native elements where possible (`<dialog>`, `<button>`, `<input>`). If we use Shadow DOM, expose semantics via ARIA + `delegatesFocus: true` where focus delegation matters.
- **Animation must never permanently hide essential content.** If motion fails, content is still in the DOM and readable (e.g., `<ui-animate>` content is in the DOM before reveal).

---

## 23. Performance requirements

Performance is a first-class requirement, applied at every layer of the architecture.

**Avoid:**

- Layout thrashing (DOM read after DOM write in the same frame, inside RAF).
- Unnecessary DOM measurements (no `getBoundingClientRect()` in RAF unless strictly needed).
- Permanent `scroll` / `resize` listeners — always use `IntersectionObserver` / `ResizeObserver`.
- Duplicate `IntersectionObserver` instances — shared via `ObserverManager` (§9).
- Unnecessary `MutationObserver`s — most component mutations are reflected via `attributeChangedCallback` or attribute→property observers in `BaseElement`.
- Memory leaks (covered by §8 cleanup + Playwright leak test).
- Excessive `requestAnimationFrame` loops — `Web Animations API` first; CSS second.

**Prefer:**

- `transform` and `opacity` for animation (compositor-friendly, no layout/paint).
- `IntersectionObserver` for viewport detection.
- `ResizeObserver` for size changes.
- `requestAnimationFrame` only when WAAPI / CSS cannot express the effect.
- `:where()` and `:is()` over long descendant selectors (selector performance + specificity).
- Avoid style invalidations triggered by attribute changes; only mutate style when actually needed.

**Bundle:**

- ESM, `sideEffects: false`, tree-shakeable.
- Per-effect motion entry points (`@ui/motion/fade-up`) so apps pay only for what they use.
- A bundle budget per package (enforced in CI): `core` ≤ 8 kB gz; `motion` ≤ 4 kB gz per effect; each `components/<x>` ≤ 6 kB gz.

**Runtime budgets** (smoke-tested by Playwright on a mid-range mobile profile):

- `<ui-animate>` reveal frame budget: ≤ 1 ms first-paint after threshold.
- `<ui-modal>` open transition: ≤ 16 ms paint per frame.
- `<ui-carousel>` slide change: ≤ 8 ms JS + paint.

Component PRs must include a brief performance note in `meta.performanceNotes`.

---

## 24. AI/agent usage strategy

`meta.ts` is the canonical contract for AI agents. To make `claude` / `codex` / etc. correctly pick the right component:

- **Naming is consistent.** Action verbs → `<ui-{verb}>` (Animate, Toggle, Collapse). Nouns for things → `<ui-{noun}>` (Modal, Tabs, Carousel). No surprise tags.
- **Every component's docs page has a "Use it when you want to…" section** written by humans, listing 2–4 patterns.
- **`/docs/components/{slug}` is generated from `meta` + a small narrative.** Stable URLs.
- **Public methods only (no internal `engine.foo()` reaching the consumer).** This means an agent never needs to know the internal implementation.
- **Examples directory is small but canonical.** Each component has 2–4 `examples/*.html` files referenced by `meta.examples`.
- **`packages/components/` ships a `LLM/LLM.md`** ("Component selection guide") that explains intent → component.

---

## 25. Development phases

The phases defined in §26 of `README.MD` are restated here as a checklist. Each phase ends with a "definition of done" gate (see §27).

| Phase | Goal | Gate |
|---|---|---|
| **P0** | Architecture docs approved (this file + `COMPONENT_ROADMAP.md`) | User approves |
| **P1** | `core`: BaseElement, CleanupRegistry, ObserverManager, attribute system, events, define() | Unit ≥95%, lifecycle Playwright suite green |
| **P2** | `motion`: Animate (basic effects) | Reduced-motion + visible + a11y tests green |
| **P3** | Basic UI: Toggle, Collapse, Accordion, Tabs, Modal, Drawer, Popover | DoD per component |
| **P4** | Advanced UI: Carousel, Gallery, Marquee, Grid | DoD per component |
| **P5** | Media: Lazyload, PhotoSwipe, ImageComparison, Video | DoD per component |
| **P6** | Utilities: Countdown, Counter, Cursor, DarkMode, Scroll utilities | DoD per component |
| **P7** | Advanced effects: Parallax, Magic Move, Grid Hover | DoD per component |
| **P8** | Adapters: Shopify, React (only if justified) | Adapter parity tests |
| **P9** | Hardening: a11y audit, perf audit, bundle audit, cross-browser, docs completeness | All audits green |

---

## 26. Architectural risks

1. **Shadow DOM + form-associated elements:** `<input>` inside Shadow DOM has historically been fiddly. Mitigation — use `ElementInternals` (CustomElementRegistry) for form-associated custom elements where needed.
2. **CSS Custom Properties don't pierce shadow by default** for arbitrary properties (only inherited properties). Mitigation — pass tokens through `:host { color: var(--ui-color-text); }` and let inheritance do the work; expose non-inheritable tokens via `::part` overrides.
3. **Bundle duplication:** if a package is built with the wrong output format, an app may import two copies and observers/listeners won't share. Mitigation — single `dist/index.mjs`, `sideEffects: false`, project-wide `tsconfig` paths, Vite alias to `@ui/core` etc.
4. **Memory leaks in detached subtrees:** Shadow DOM subtrees may keep timers alive. Mitigation — strict `$cleanup.run()` on disconnect, Playwright leak test per component.
5. **Framework adapter drift:** if we add a React adapter later, it may "rewrite" behaviour. Mitigation — adapters are a wrapper layer; component logic stays in `core/components`. Adapter tests verify behaviour parity with the web-component version.
6. **Web Component lifecycle surprises on `adoptedCallback`** (element moved across documents): explicit re-init required. Covered by lifecycle tests.
7. **iOS Safari quirks** with sticky/overflow: Playwright on WebKit is in CI; reduced-motion + animation tests must run there.

---

## 27. Definition of Done

A component is DONE only when ALL boxes are ticked:

- [ ] TypeScript implementation exists
- [ ] Public API follows project conventions (§14)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm -r build` passes
- [ ] `pnpm -r test` passes
- [ ] Relevant Playwright tests pass (incl. lifecycle, reduced-motion, keyboard)
- [ ] Lifecycle cleanup verified — remove + re-insert works without leaks
- [ ] Accessibility reviewed — `@axe-core/playwright` returns no serious/critical issues
- [ ] Performance reviewed — no layout thrash, uses transform/opacity/observers
- [ ] `/html/{slug}` demo page exists and shows the examples
- [ ] `/docs/components/{slug}` documentation exists with full API table
- [ ] `meta.ts` is updated and the aggregated index re-generated
- [ ] No duplicated logic — shares infrastructure where it makes sense

If a box cannot be ticked, label the component `UNVERIFIED` and surface it. Do **not** silently skip.

---

## Open questions for the user

These are decisions that need an explicit answer before Phase 1 starts:

1. **Custom-element prefix.** Default proposal: `ui-`. Confirm or change?
2. **`/html/` framework.** Default proposal: native TS SPA (no UI framework). Confirm or change?
3. **`/docs/` framework.** Default proposal: VitePress. Confirm or change?
4. **Token set.** Are the proposed global tokens in §13 acceptable? Any required brand tokens?
5. **Initial release scope.** Is P3 (Basic UI) the next deliverable, or do you want P2 (Motion) first?
6. **Browser support.** Last two majors of Chrome/Edge/Firefox/Safari acceptable? iOS Safari quirks confirmed acceptable?
7. **Repository.** Should this live in a git repo today? If so, will you push, or should I prepare the initial commit?

---

*End of `CORE_ARCHITECTURE.md` v0.1.*

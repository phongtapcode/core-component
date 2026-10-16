---
name: senior-frontend-core
description: Develop, extend, debug, or review reusable ui-* Web Components and motion effects in this repository, including their public API, lifecycle, gallery demo, documentation, and verification. Use for component library work; do not invoke for unrelated site design or general app screens.
---

# Senior Frontend Core

Build framework-independent Custom Elements that work in a normal browser. Treat `CORE_ARCHITECTURE.md` and `README.md` as project intent, then inspect the relevant source before acting: parts of those documents describe planned infrastructure rather than code that already exists. Follow the user's requested scope and preserve existing behavior unless a change is intended.

## Repository map

- `packages/core/src/`: `BaseElement`, `CleanupRegistry`, observer sharing, attribute coercion, events, and `define()`. Reuse its actual exported APIs where they fit; `BaseElement` is useful but existing components also extend `HTMLElement` directly.
- `packages/motion/src/`: reusable motion components and effects. Put a behavior here when it is genuinely shared motion infrastructure.
- `packages/components/src/` and `packages/components/css/components.css`: component behavior, registration, exports, and styles. Keep dependencies flowing toward `core` and `tokens`; do not expose an internal animation engine through the public API.
- `html/src/`: native TypeScript/Vite live gallery. Its current catalog is `components.ts`, examples and controls are in `main.ts`, and in-gallery API data is in `docs-data.ts`.
- `docs/components/`: current VitePress Markdown pages. The architecture's proposed per-component `meta.ts` aggregation is not yet the only source of truth; inspect the current registration and all affected catalog/docs surfaces before updating them.
- `packages/*/test/`: Vitest tests. Root `test:e2e` and `lint` scripts are presently placeholders; do not report them as browser or lint verification.

## Required workflow for new components and behavior-changing effects

Follow these stages in order. For a narrowly scoped fix, still assess every stage and update only the affected artifacts; do not create unrelated features or redesigns.

1. **Analyze the request.** Read the relevant architecture section and existing implementations. Describe intended behavior, edge cases, available shared helpers, dependency cost, accessibility, responsive behavior, and performance risks. Treat supplied examples as functional references; implement original code. Identify missing information only when it blocks a sound API decision.
2. **Design the API.** Specify the `ui-*` tag and any `ui-style` variant, HTML attributes, typed JS properties, defaults and invalid-value behavior, public methods, custom events with detail, CSS variables, parts/slots, and state. Prefer a small, stable declarative API; preserve documented aliases when changing an existing component. Match real repository conventions when they differ from the draft architecture. Make browser-visible effects configurable without exposing private implementation details.
3. **Implement the core behavior.** Put reusable logic in the appropriate package; modify `packages/core` only for genuinely shared infrastructure. Register via `define()` and export through the package entry point. Initialize DOM-dependent work on connection, handle live attribute/content changes where promised, and make disconnect/reconnect idempotent. Track and release listeners, observers, animations, RAF, timers, media-query subscriptions, object URLs, generated DOM, and global state. Use `BaseElement` cleanup helpers or equivalent explicit teardown for direct `HTMLElement` subclasses. Prevent stale async callbacks after refresh or removal.
4. **Create an interactive `/html` demo.** Show the real element with controls that change relevant attributes/properties, replay/reset where useful, and representative variants and edge cases. Keep the preview focused on testing the effect; avoid unrelated hero sections or decoration. Check that controls, preview, and status stay in sync and remain usable with keyboard and touch where applicable.
5. **Write `/docs` documentation.** Add or update the VitePress component page and the current gallery/API data it needs. Document copyable usage, defaults, constraints, methods, events and payloads, styling hooks, keyboard and screen-reader behavior, responsive behavior, reduced-motion behavior, and browser requirements. Keep examples aligned with the implemented API.
6. **Test.** Add meaningful Vitest tests for behavior and failure modes, especially attribute changes, cleanup, removal/reinsertion, and reduced motion. Run relevant package tests, typecheck, and build. Inspect the live demo in a real browser at desktop and narrow widths when browser tooling is available; test keyboard interaction and supported engines where the behavior depends on them. If a browser check is unavailable, state that explicitly instead of treating the placeholder `test:e2e` script as proof.
7. **Review.** Compare implementation, demo, docs, and API data; inspect the diff for regressions and unrelated edits. Verify no orphaned work continues after disconnect, no essential content stays hidden, and no unbounded animation loop or large repaint is introduced. Report what was verified and any remaining `UNVERIFIED` item.

## Engineering decisions

- **Animation performance:** prefer CSS or Web Animations API for simple transitions; use RAF for frame-dependent effects such as canvas physics. Keep one loop per instance, cancel it promptly, pause or reduce work when offscreen or `document.hidden`, cap pixel density/work where appropriate, and avoid repeated layout reads or full regeneration on every control movement. Use `transform`/`opacity` when possible. Provide a meaningful `prefers-reduced-motion` result.
- **Accessibility:** keep authored content semantic and accessible; make decorative duplicates `aria-hidden` and inert, without duplicate IDs or focus targets. Provide keyboard and focus behavior for interactions, visible focus, usable labels/statuses, and pointer-independent operation where appropriate. Motion failure must not strand essential content.
- **Responsive and compatibility:** measure the element/container rather than assume viewport size; account for resize, DPR, touch/pointer input, and narrow layouts. Target the evergreen Chrome, Edge, Firefox, and Safari versions stated in `CORE_ARCHITECTURE.md`. Feature-check optional browser APIs and provide a sensible fallback for an effect when practical; verify browser-specific behavior instead of assuming parity.
- **Visual design skill boundary:** use `design-taste-frontend` only when designing or polishing the appearance of `/html` demos or `/docs` pages. It does not govern component API, lifecycle, animation internals, tests, or routine documentation edits.

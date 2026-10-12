# ARCHITECTURE_CHANGES.md

Log of deviations from `CORE_ARCHITECTURE.md`. Every deviation must be justified here before implementation.

---

## Change 001 — Phase 1 scaffolding: minimal, no `/html` SPA yet

- **Section affected:** §16 (Live Component Gallery architecture) and §4 (Repository structure).
- **Deviation:** Phase 1 ships only `packages/core` and `packages/tokens`. The `/html/` SPA, `/docs/`, ESLint, Prettier, and Playwright configs are deferred to later phases.
- **Why:** Each layer must be reviewable in isolation. Shipping core first lets us prove the lifecycle, attribute system, and cleanup registry are correct before any consumer-facing surface is built on top of them. Layering prevents rework.
- **Approved by:** user instruction "cứ làm đi" after reviewing `CORE_ARCHITECTURE.md` v0.1 + `COMPONENT_ROADMAP.md` v0.1.

---

## Change 002 — Vitest in core, no Playwright yet

- **Section affected:** §19 (Testing strategy).
- **Deviation:** Phase 1 uses Vitest (jsdom or happy-dom environment) only. Playwright is deferred until a real component (Animate) exists in Phase 5 — the lifecycle Playwright suite is part of Phase 9 (Hardening) per §26 of `CORE_ARCHITECTURE.md`.
- **Why:** Playwright needs a browser-shaped component to be meaningful. Unit-testing the lifecycle state machine, `CleanupRegistry`, attribute reflection, and `ObserverManager` sharing logic in jsdom gives us strong confidence without the cost of spinning up a browser for every commit during foundation work.

---

## Change 003 — Native custom-element class fields for `define()`

- **Section affected:** §6 (Base component architecture).
- **Deviation:** `define()` accepts `customElementConstructor: typeof HTMLElement` rather than `tagName + ctor` separately.
- **Why:** Standard CustomElementRegistry API; nothing custom to invent. We do still provide a thin `define()` wrapper for registry-introspection (§15) and dev-mode warnings.
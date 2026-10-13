# MASTER PROMPT — BUILD UNIVERSAL WEB COMPONENT CORE + PLAYGROUND + DOCUMENTATION

You are a Senior Frontend Framework Architect and TypeScript Engineer.

I want you to build a production-quality reusable frontend component/core library.

I have access to an existing component documentation website that I will use as a FUNCTIONAL REFERENCE.

The reference website has two important areas:

1. `/html/`
   - Component gallery
   - Lists available components/effects
   - Allows viewing/running the real visual behavior of components

2. `/docs/`
   - Documentation for each component
   - Usage
   - HTML examples
   - Attributes
   - Options
   - Methods
   - Events
   - Behavior descriptions

The reference website may require authentication.

DO NOT attempt to bypass authentication.

I will manually provide screenshots, copied documentation, HTML examples,
behavior descriptions, recordings, or files from the reference website when needed.

The reference is ONLY for understanding functionality and UX.

DO NOT copy proprietary source code.

We are building our OWN implementation.

==================================================

1. # PROJECT GOAL

Build our own universal frontend component/core library inspired by the
FUNCTIONAL IDEAS of the reference system.

The result must NOT be tied to:

- Shopify
- React
- Next.js
- Vue
- WordPress
- PHP
- ASP.NET
- any specific framework

The core must work directly in a normal browser.

Primary foundation:

- TypeScript
- Web Components / Custom Elements
- Native Browser APIs
- CSS
- CSS Custom Properties

Framework/platform integrations can be added later as adapters.

================================================== 2. FINAL PRODUCT
==================================================

The project should eventually contain THREE major products:

A. CORE LIBRARY

The actual reusable code.

Example:

<ui-animate effect="fade-up">
  Content
</ui-animate>

<ui-carousel>
  ...
</ui-carousel>

<ui-modal>
  ...
</ui-modal>

B. /html/

Visual Component Gallery / Playground.

This is where I can browse and RUN all components.

Example:

/html/
/html/animate
/html/carousel
/html/modal
/html/tabs

The homepage should display component cards similar conceptually to:

Core Components

[ Grid ]
Responsive grid layout

[ Animate ]
Scroll animation component

[ Carousel ]
Slider component

[ Modal ]
Dialog component

[ Tabs ]
Tabbed navigation

...

Clicking a component opens its LIVE DEMO page.

This area is primarily for:

- visual testing
- behavior testing
- development
- QA
- demonstrations

C. /docs/

Technical documentation.

Example:

/docs/
/docs/components/animate
/docs/components/carousel
/docs/components/modal
/docs/components/tabs

Each page documents the component's API.

================================================== 3. IMPORTANT DISTINCTION BETWEEN /html AND /docs
==================================================

DO NOT merge their responsibilities.

`/html/`

means:

LIVE COMPONENT GALLERY.

Its purpose is:

"Show me what this component does."

It should prioritize:

- live demos
- variants
- responsive testing
- visual states
- interaction testing

`/docs/`

means:

DEVELOPER DOCUMENTATION.

Its purpose is:

"Show me how to use this component."

It should prioritize:

- API
- syntax
- attributes
- properties
- methods
- events
- CSS variables
- accessibility
- examples

================================================== 4. TECHNOLOGY STACK
==================================================

Use:

Language:
TypeScript

Component model:
Web Components / Custom Elements

Styling:
Native CSS
CSS Custom Properties

Basic animations:
CSS transitions
CSS animations

Programmatic animation:
Web Animations API where appropriate

Viewport detection:
IntersectionObserver

Element dimension observation:
ResizeObserver

Frame-sensitive animation:
requestAnimationFrame

Build:
Vite + Rollup

Package management:
pnpm workspace

Unit tests:
Vitest

Browser / E2E:
Playwright

Documentation:
VitePress OR another lightweight documentation solution if there is a
strong architectural reason.

Code quality:
ESLint
Prettier

Do NOT use React/Vue as the core runtime.

================================================== 5. CORE ARCHITECTURE
==================================================

Design the repository approximately as:

project/
│
├── packages/
│ │
│ ├── core/
│ │ ├── element/
│ │ ├── lifecycle/
│ │ ├── observer/
│ │ ├── events/
│ │ └── utils/
│ │
│ ├── motion/
│ │ ├── animate/
│ │ ├── parallax/
│ │ └── marquee/
│ │
│ ├── components/
│ │ ├── carousel/
│ │ ├── modal/
│ │ ├── drawer/
│ │ ├── tabs/
│ │ ├── collapse/
│ │ ├── popover/
│ │ └── ...
│ │
│ ├── media/
│ │ ├── gallery/
│ │ ├── image-comparison/
│ │ ├── lazyload/
│ │ └── video/
│ │
│ └── adapters/
│ ├── shopify/
│ ├── react/
│ └── optional-animation-engines/
│
├── html/
│ └── live component gallery
│
├── docs/
│ └── developer documentation
│
├── tests/
│
├── references/
│ └── reference screenshots/docs supplied by me
│
└── package.json

This structure is a proposal.

If you identify a better architecture, explain why before changing it.

================================================== 6. CORE FOUNDATION
==================================================

Create a shared foundation instead of letting every component reinvent
the same behavior.

The foundation should consider:

BaseElement
Lifecycle management
Cleanup/disposal
Event utilities
DOM utilities
Attribute parsing
Observer manager
Breakpoint utilities
Shared types
Component registration

Example conceptual hierarchy:

HTMLElement
↓
BaseElement
↓
Component
↓
Animate / Carousel / Modal / Tabs / etc.

Do NOT blindly implement this hierarchy if composition provides a cleaner
solution.

Evaluate it first.

================================================== 7. LIFECYCLE REQUIREMENTS
==================================================

Every component must:

- initialize safely
- initialize only once
- support dynamic DOM insertion
- support removal
- support re-insertion
- remove event listeners
- disconnect observers
- cancel timers
- cancel requestAnimationFrame
- clean temporary DOM state
- avoid memory leaks

A component must NOT break if it is removed and later added back.

================================================== 8. COMPONENT API DESIGN
==================================================

All components must follow one predictable API philosophy.

Example:

<ui-animate
effect="fade-up"
duration="600"
delay="100"
threshold="0.2"
once

> Content
> </ui-animate>

This is only an example.

Before implementation, propose:

- Custom Element prefix
- attribute naming
- property naming
- event naming
- CSS variable naming
- method naming

Consistency is more important than copying the reference.

================================================== 9. COMPONENT CONTRACT
==================================================

Every component should document, where applicable:

HTML element

Attributes

JavaScript properties

Public methods

Events

Slots

CSS variables

CSS parts

States

Accessibility behavior

Responsive behavior

Lifecycle behavior

Examples

================================================== 10. CSS DESIGN
==================================================

Use CSS Custom Properties extensively.

For example:

--ui-duration
--ui-delay
--ui-distance
--ui-easing

Component-specific tokens may use names such as:

--ui-carousel-gap
--ui-modal-width
--ui-drawer-size

These are examples.

Design the naming system before implementation.

Avoid hardcoded styling that makes customization difficult.

================================================== 11. MOTION ENGINE
==================================================

Build a reusable motion system rather than independent animation hacks.

Initial effects should include:

fade
fade-up
fade-down
fade-left
fade-right

slide-up
slide-down
slide-left
slide-right

zoom-in
zoom-out

scale-up
scale-down

blur
rotate

The architecture should allow additional effects without modifying the
main Animate class.

Prefer:

TypeScript
↓
state
↓
attributes / CSS variables
↓
CSS

for simple animations.

Do NOT create unnecessary JavaScript animation loops.

================================================== 12. OBSERVER MANAGER
==================================================

Many components will require viewport detection:

Animate
Counter
Lazyload
Video
etc.

Do NOT blindly create a new IntersectionObserver for every component.

Design shared observer infrastructure capable of reusing observers when
configuration matches.

Support:

threshold
rootMargin
enter
leave
once
repeat

================================================== 13. ACCESSIBILITY
==================================================

Accessibility is mandatory.

Support:

prefers-reduced-motion

Keyboard navigation

ARIA

Focus management

Focus trap where required

Escape to close

Correct tab behavior

Semantic HTML

Animation must never hide essential content permanently.

================================================== 14. PERFORMANCE
==================================================

Performance is a first-class requirement.

Avoid:

- layout thrashing
- unnecessary DOM measurements
- permanent scroll handlers
- duplicate observers
- unnecessary MutationObservers
- memory leaks
- excessive requestAnimationFrame loops

Prefer:

transform
opacity
IntersectionObserver
ResizeObserver
requestAnimationFrame

when appropriate.

================================================== 15. DEPENDENCY POLICY
==================================================

Native-first.

Do NOT add dependencies simply because they make implementation easier.

For components that are genuinely difficult to implement correctly,
a small specialized engine may be evaluated.

Examples:

Carousel physics
Complex animation timelines

However:

OUR PUBLIC API MUST NEVER DEPEND ON THE INTERNAL ENGINE.

For example:

<ui-carousel>

must remain our API even if an internal carousel engine is changed later.

Do not expose third-party implementation details to consumers.

================================================== 16. /HTML — COMPONENT GALLERY
==================================================

Build `/html/` as a visual catalog.

Homepage:

/html/

should include:

- title
- search
- categories
- component count
- responsive card grid
- component name
- short description

Example categories:

Core
Motion
Navigation
Overlay
Media
Layout
Utility
Advanced

Clicking:

Animate

opens:

/html/animate

The Animate demo page should contain examples such as:

Basic
Fade
Fade Up
Fade Down
Fade Left
Fade Right
Delay
Duration
Repeat
Once
Custom easing

Each example must actually run.

================================================== 17. /HTML COMPONENT DEMO STANDARD
==================================================

Each live component page should contain:

Component title

Short description

Interactive examples

Variants

Edge cases

Responsive examples where applicable

Accessibility test example where useful

Reset/replay control where applicable

Link to corresponding documentation:

"View documentation"

Example:

/html/animate
↓
/docs/components/animate

================================================== 18. /DOCS — DOCUMENTATION
==================================================

Documentation homepage:

/docs/

should provide:

sidebar
search
component categories
navigation

Each component:

/docs/components/{component}

must contain:

# Component Name

Description

## Installation

## Basic Usage

## Examples

## HTML Attributes

Table:

| Name | Description | Type | Default |

## JavaScript Properties

## Methods

## Events

## CSS Variables

## Slots

## CSS Parts

## Accessibility

## Responsive Behavior

## Performance Notes

## Browser Support

## Related Components

================================================== 19. SOURCE OF TRUTH
==================================================

Avoid manually maintaining the same component metadata in multiple places.

Design a component metadata/schema system.

For example conceptually:

component.meta.ts

could define:

name
description
category
tagName
attributes
properties
methods
events
cssVariables

Then:

CORE
HTML GALLERY
DOCS

can consume shared metadata where appropriate.

The goal is:

ONE SOURCE OF TRUTH.

Do not create three manually synchronized copies of component APIs.

================================================== 20. REFERENCE WORKFLOW
==================================================

The existing reference website may contain components such as:

Animate
Carousel
CircleBar
Collapse
CollectionTabs
Column Options
Countdown
Countto
Cursor
DarkMode
Filters
Gallery
GridHoverExpand
Group
ImageComparison
IntersectionVideo
Lazyload
LineChart
Magic Move
Modal
Tabs
Toast
Popover
Grid
Toggle
etc.

DO NOT implement them simply because they exist in the reference.

For EACH component I provide, first perform:

REFERENCE ANALYSIS

Component:
[NAME]

PURPOSE:
What problem does it solve?

REFERENCE BEHAVIOR:
What does the reference appear to do?

KEEP:
Useful concepts.

IMPROVE:
Things our implementation should improve.

REMOVE:
Unnecessary or overly specific functionality.

OUR API:
Proposed API.

SHARED INFRASTRUCTURE:
What existing core systems can support it?

ACCESSIBILITY:
Requirements.

PERFORMANCE:
Potential concerns.

DEPENDENCIES:
Native or external engine?

TEST PLAN:
How it will be verified.

Only after this analysis should implementation begin.

================================================== 21. REFERENCE ACCESS
==================================================

The reference website may require authentication.

DO NOT:

- bypass authentication
- attempt credential extraction
- attempt unauthorized scraping
- assume browser sessions are available

I will provide:

- screenshots
- documentation text
- HTML snippets
- screen recordings
- behavior descriptions
- reference files

Store provided reference material under:

/references/

If required information is missing, report:

NEEDS_REFERENCE

Then tell me exactly what you need.

Example:

NEEDS_REFERENCE:
Carousel responsive breakpoint behavior.

Please provide:

- screenshot of Carousel attributes table
  or
- copied Carousel documentation.

Do NOT invent undocumented reference behavior.

================================================== 22. DO NOT CLONE THE REFERENCE
==================================================

This project must NOT become:

"XO with a different name."

We are using the reference to understand useful concepts.

Our implementation must have:

- our architecture
- our naming
- our TypeScript
- our CSS
- our APIs
- our tests
- our documentation

If the reference architecture is poor, improve it.

If two reference components can share one engine, create a shared engine.

If browser APIs provide a better implementation, use them.

================================================== 23. AI-FIRST DESIGN
==================================================

This library will later be used by coding agents such as Claude and Codex.

An agent should be able to read our documentation and correctly determine:

"This design needs a carousel → use <ui-carousel>."

"This element reveals on scroll → use <ui-animate>."

"This interaction is a modal → use <ui-modal>."

Therefore APIs must be:

predictable
consistent
explicit
well documented
easy to search

Avoid unnecessary magic.

================================================== 24. TESTING REQUIREMENTS
==================================================

A component is NOT complete simply because it looks correct.

Test:

multiple instances

initialization

destruction

reinitialization

dynamic DOM insertion

attribute changes

event cleanup

observer cleanup

keyboard behavior

reduced motion

responsive behavior

edge cases

Use:

Vitest
Playwright

where appropriate.

================================================== 25. DEFINITION OF DONE
==================================================

A component is DONE only when:

[ ] TypeScript implementation exists
[ ] public API follows project conventions
[ ] typecheck passes
[ ] build passes
[ ] unit tests pass
[ ] relevant browser tests pass
[ ] lifecycle cleanup verified
[ ] accessibility reviewed
[ ] performance reviewed
[ ] /html demo exists
[ ] /docs documentation exists
[ ] metadata is updated
[ ] no unnecessary duplicated logic exists

If something was not actually verified:

mark it as:

UNVERIFIED

Never claim it works without verification.

================================================== 26. DEVELOPMENT PHASES
==================================================

PHASE 0 — Architecture

Foundation architecture
Naming
Package boundaries
Metadata architecture
Docs architecture
HTML gallery architecture
Testing strategy

PHASE 1 — Core

BaseElement
Lifecycle
Cleanup
Events
DOM utilities
Attribute utilities
Observer Manager
Responsive utilities

PHASE 2 — Motion

Animate
basic effects

PHASE 3 — Basic UI

Toggle
Collapse
Accordion
Tabs
Modal
Drawer
Popover

PHASE 4 — Advanced UI

Carousel
Gallery
Marquee
Grid-related behavior

PHASE 5 — Media

Lazyload
ImageComparison
Video

PHASE 6 — Utilities

Countdown
Counter
Cursor
DarkMode
Scroll utilities

PHASE 7 — Advanced Effects

Parallax
Magic Move
Grid Hover effects
other approved effects

PHASE 8 — Adapters

Shopify
React
other adapters if justified

PHASE 9 — Hardening

Accessibility audit
Performance audit
Bundle-size audit
Cross-browser testing
Documentation completeness

================================================== 27. FIRST TASK — DO THIS NOW
==================================================

DO NOT start implementing all components.

First inspect the existing repository.

Then design the architecture.

Create:

CORE_ARCHITECTURE.md

It must contain:

1. Project goals
2. Non-goals
3. Technology decisions
4. Repository structure
5. Package boundaries
6. Base component architecture
7. Lifecycle architecture
8. Cleanup/disposal strategy
9. Observer architecture
10. Event architecture
11. Attribute/property architecture
12. CSS architecture
13. CSS token naming
14. Custom Element naming/prefix
15. Component metadata/source-of-truth design
16. /html architecture
17. /docs architecture
18. Routing strategy
19. Testing strategy
20. Build/package strategy
21. Dependency policy
22. Accessibility requirements
23. Performance requirements
24. AI/agent usage strategy
25. Development phases
26. Architectural risks
27. Definition of Done

Also create:

COMPONENT_ROADMAP.md

List potential components discovered from the reference materials.

For every component classify it as:

CORE
MOTION
LAYOUT
NAVIGATION
OVERLAY
MEDIA
UTILITY
ADVANCED
ADAPTER-SPECIFIC

and assign priority:

P0
P1
P2
P3

IMPORTANT:

Do NOT assume every reference component should be implemented.

Mark uncertain components as:

REVIEW_REQUIRED

After creating:

CORE_ARCHITECTURE.md
COMPONENT_ROADMAP.md

STOP.

Do not implement Phase 1 yet.

Wait for architecture approval.

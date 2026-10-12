# Component visual review plan

The gallery shell has a shared visual language. Review the live demos one component at a time so each change can be checked in isolation.

## Review order

| Order | Component | First issue to address |
|---|---|---|
| 1 | Toggle | Disclosure demo has many inline styles; switch and disclosure modes need distinct examples. |
| 2 | Collapse | Align trigger, content, open/closed states, and spacing. |
| 3 | Accordion | Match Collapse styling and show the single-open behavior clearly. |
| 4 | Tabs | Improve tab and panel states, then check narrow screens. |
| 5 | Modal | Refine dialog layout, actions, backdrop, and focus state. |
| 6 | Drawer | Refine panel layout and left/right examples. |
| 7 | Popover | Refine trigger, floating panel, and placement examples. |
| 8 | Animate | Make effect variants easy to compare. |
| 9 | Reveal | Show delay variants without identical-looking samples. |
| 10 | Stagger | Replace plain list items with a clear sequence example. |
| 11 | Lazyload | Replace remote random images with local sample assets and show loading states. |
| 12 | ImageZoom | Use a stable image and improve the overlay example. |
| 13 | ImageComparison | Use a real before/after pair and check handle visibility. |
| 14 | Counter | Refine number typography and example layout; the animation error was fixed in the shared pass. |
| 15 | DarkMode | Show light, dark, and auto states with a clear current-state label. |
| 16 | Marquee | Simplify crowded examples and review contrast for both themes. |
| 17 | Carousel | Completed the UI markup, thumbnail rail, controls, pagination, responsive breakpoint example, and gallery redesign. |

For each component, review its live demo, both themes, mobile width, keyboard focus, and documentation text before moving to the next component. Keep behavior changes and visual changes clear in the review summary.

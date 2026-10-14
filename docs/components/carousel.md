# Carousel

`<ui-carousel>` accepts authored `inner → list → slide` markup. It supports arrows, pagination, responsive layouts, and a thumbnail rail. Import `@ui/components` and `@ui/components/css` before using it. Direct child slides from the earlier API still work.

## Basic carousel

```html
<ui-carousel ui-per-view="1" ui-render-bullet="<span></span>">
  <ui-carousel-inner>
    <ui-carousel-list>
      <ui-carousel-slide><div class="carousel-item">1</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">2</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">3</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">4</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">5</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">6</div></ui-carousel-slide>
    </ui-carousel-list>
    <ui-carousel-prev><button type="button">Prev</button></ui-carousel-prev>
    <ui-carousel-pagination></ui-carousel-pagination>
    <ui-carousel-next><button type="button">Next</button></ui-carousel-next>
  </ui-carousel-inner>
</ui-carousel>
```

The `ui-carousel-inner` element is the viewport. `ui-carousel-list` is the moving track. Put only `ui-carousel-slide` elements inside the list. Arrows and pagination can sit beside the list inside `ui-carousel-inner`; position them at the bottom of the viewport with CSS so they never take up slide space. Use normal CSS to size and style your slide content.

```css
ui-carousel-inner { position: relative; }
ui-carousel-inner > ui-carousel-prev,
ui-carousel-inner > ui-carousel-next,
ui-carousel-inner > ui-carousel-pagination { position: absolute; bottom: 1rem; z-index: 2; }
ui-carousel-inner > ui-carousel-prev { left: 1rem; }
ui-carousel-inner > ui-carousel-next { right: 1rem; }
ui-carousel-inner > ui-carousel-pagination { left: 50%; transform: translateX(-50%); }
```

## With thumbnails

```html
<ui-carousel
  ui-rewind
  ui-per-view="4"
  ui-breakpoints="{
    600: { perView: 1, perMove: 1, gap: 10, overflow: 'visible' },
    1000: { perView: 2, perMove: 2 }
  }"
  ui-render-bullet="<span></span>"
>
  <ui-carousel-inner>
    <ui-carousel-list>
      <ui-carousel-slide><div class="carousel-item">1</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">2</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">3</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">4</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">5</div></ui-carousel-slide>
      <ui-carousel-slide><div class="carousel-item">6</div></ui-carousel-slide>
    </ui-carousel-list>
    <ui-carousel-prev><button type="button">Prev</button></ui-carousel-prev>
    <ui-carousel-pagination></ui-carousel-pagination>
    <ui-carousel-next><button type="button">Next</button></ui-carousel-next>
  </ui-carousel-inner>
  <ui-carousel-thumbnail ui-per-view="7">
    <ui-carousel-inner>
      <ui-carousel-list>
        <ui-carousel-slide><div class="carousel-item-thumb">1</div></ui-carousel-slide>
        <ui-carousel-slide><div class="carousel-item-thumb">2</div></ui-carousel-slide>
        <ui-carousel-slide><div class="carousel-item-thumb">3</div></ui-carousel-slide>
        <ui-carousel-slide><div class="carousel-item-thumb">4</div></ui-carousel-slide>
        <ui-carousel-slide><div class="carousel-item-thumb">5</div></ui-carousel-slide>
        <ui-carousel-slide><div class="carousel-item-thumb">6</div></ui-carousel-slide>
      </ui-carousel-list>
    </ui-carousel-inner>
  </ui-carousel-thumbnail>
</ui-carousel>
```

Clicking or keyboard activating a thumbnail selects that slide. The thumbnail rail scrolls ahead as the active slide approaches its visible edge, and it can be dragged horizontally to browse more thumbnails. When `ui-per-view` shows multiple slides, the main track moves as far as possible to bring the selection into view. `ui-loop` is disabled while a thumbnail rail exists.

## Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `ui-name` | string | — | Named carousel identifier. |
| `ui-active-index` | number | `0` | Initial active slide, starting at zero. |
| `ui-per-view` | number | `1` | Slides visible at once. |
| `ui-per-move` | number | `1` | Slides advanced by Next or Prev. |
| `ui-gap` | number | `20` | Gap between slides in pixels. |
| `ui-speed` | number | `200` | Transition duration in milliseconds. |
| `ui-autoplay` | number | `0` | Autoplay interval in milliseconds; `0` disables it. |
| `ui-autoheight` | boolean | `false` | Match viewport height to the active slide. |
| `ui-hover-pause` | boolean | `true` | Pause autoplay on hover. |
| `ui-overflow` | `visible` / `hidden` | `hidden` | Viewport overflow. |
| `ui-vertical` | boolean | `false` | Use a vertical track. |
| `ui-rewind` | boolean | `false` | Return to the other end at a boundary. |
| `ui-rtl` | boolean | document direction | Right-to-left navigation. |
| `ui-render-bullet` | HTML string | — | Markup for each pagination bullet; supports `{{index}}` and `{{page}}`. |
| `ui-breakpoints` | string | — | Container width overrides; accepts JSON or the object form shown above. |
| `ui-type` | `slide`, `fade`, `none`, `nature`, `water`, `urban`, `wind` | `slide` | Transition style. |
| `ui-loop` | boolean | `false` | Use inert end clones for continuous slide transitions; disabled with thumbnails or when all slides fit. |
| `ui-column-width` | number | `0` | Calculate visible columns from a desired item width. |
| `ui-easing` | string | `easeOutQuad` | Transition easing. |
| `ui-draggable` | boolean | `true` | Enable pointer drag and swipe. |
| `ui-stop-autoplay-on-interaction` | boolean | `false` | Stop autoplay after interaction. |
| `ui-progress` | boolean | `false` | Expose `--ui-carousel-autoplay-progress`. |
| `ui-sync-id` | string | — | Synchronize carousels sharing this ID. |
| `ui-media-lazyload` | boolean | `true` | Load slide media near the visible range. |
| `ui-observed` | string | — | Change its value to refresh the carousel. |

Boolean attributes accept presence, `true`, or `false`. `ui-carousel-thumbnail` accepts `ui-per-view` and `ui-gap` for its own rail.

## JavaScript

```js
const carousel = document.querySelector('ui-carousel');
carousel.next();
carousel.prev();
carousel.goTo(2);
carousel.play();
carousel.pause();
carousel.refresh();
```

The root emits `ui-carousel:change` and `ui-carousel-change` with `activeIndex`, `previousIndex`, `page`, and `direction`. Arrow keys navigate while focus is in the carousel. Reduced-motion preferences suppress autoplay.

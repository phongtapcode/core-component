# Animate

`<ui-animate>` reveals its content when the element enters the viewport. CSS-first animation with optional Web Animations API.

Import both the component registration and its stylesheet:

```js
import '@ui/motion';
import '@ui/motion/css';
```

## Basic usage

```html
<ui-animate effect="fade-up">Hello</ui-animate>
```

For a one-time opacity reveal, use the `fade` effect:

```html
<ui-animate effect="fade" duration="500" delay="200">Hello</ui-animate>
```

For a sequence of reveals, set increasing delays on the items:

```html
<ui-animate effect="fade-up" delay="0">First</ui-animate>
<ui-animate effect="fade-up" delay="80">Second</ui-animate>
<ui-animate effect="fade-up" delay="160">Third</ui-animate>
```

## Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `effect` | string | `fade-up` | One of: fade, fade-up, fade-down, fade-left, fade-right, slide-up, slide-down, slide-left, slide-right, zoom-in, zoom-out, scale-up, scale-down, blur, rotate |
| `duration` | number | 500 | Effect duration in ms. |
| `delay` | number | 0 | Wait time in ms before the effect starts. |
| `threshold` | number | 0.2 | IntersectionObserver threshold |
| `once` | boolean | true | Disconnect after first reveal |
| `root-margin` | string | `0px` | IntersectionObserver rootMargin |

## Methods

| Method | Description |
|---|---|
| `play()` | Trigger reveal immediately, ignoring the viewport |
| `reset()` | Hide again, will re-arm on next viewport entry |

## Events

| Event | Detail | Description |
|---|---|---|
| `ui-animate-reveal` | `{ entry }` | Fired when the element enters the viewport |
| `ui-animate-reset` | `{}` | Fired when reset() is called |

## CSS variables

| Variable | Default | Description |
|---|---|---|
| `--ui-animate-duration` | `500ms` | Animation duration |
| `--ui-animate-easing` | `var(--ui-easing-standard)` | Easing |
| `--ui-animate-delay` | `0ms` | Delay before reveal |
| `--ui-animate-distance` | `32px` | Translation distance for fade directions |
| `--ui-animate-from-opacity` | `0` | Initial opacity |
| `--ui-animate-to-opacity` | `1` | Revealed opacity |

## Accessibility

Pure visual effect — content is in the DOM before and after. Respects
`prefers-reduced-motion: reduce` (transitions become instant).

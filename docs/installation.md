# Installation

## From CDN

```html
<script type="module" src="https://esm.sh/@ui/components"></script>
```

## From npm (after publish)

```bash
pnpm add @ui/components
```

Then import:

```ts
import '@ui/components';
```

The components are registered as side-effects of the import. They upgrade
automatically when their tags appear in the DOM.

## CSS

The default styles are in `@ui/components/css/components.css`. Import them
separately alongside the JavaScript entry:

```ts
import '@ui/components/css';
```

To customise, override the CSS Custom Properties on `:root`:

```css
:root {
  --ui-color-accent: #6366f1;
  --ui-duration-base: 200ms;
}
```

## Token packages

For just the design tokens:

```ts
import '@ui/tokens/css/tokens.css';
```

For just the motion CSS:

```ts
import '@ui/motion/css/motion.css';
```

# Installation

## From CDN

```html
<script type="module" src="https://esm.sh/@element-works/components"></script>
```

## From npm (after publish)

```bash
pnpm add @element-works/components
```

Then import:

```ts
import '@element-works/components';
```

The components are registered as side-effects of the import. They upgrade
automatically when their tags appear in the DOM.

## CSS

The default styles are in `@element-works/components/css/components.css`. Import them
separately alongside the JavaScript entry:

```ts
import '@element-works/components/css';
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
import '@element-works/tokens/css';
```

For just the motion CSS:

```ts
import '@element-works/motion/css';
```

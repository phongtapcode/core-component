# Popover

`<ui-popover>` is a floating layer component anchored relative to a trigger element with positioning and auto-close.

## Basic usage

```html
<ui-popover placement="bottom">
  <button data-popover-trigger>Open Menu</button>
  <div data-popover-content>
    <h4>Popover Content</h4>
    <p>This floating content is anchored to the trigger.</p>
  </div>
</ui-popover>
```

## Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `open` | boolean | `false` | Whether popover is visible |
| `placement` | `'top'` \| `'right'` \| `'bottom'` \| `'left'` | `'bottom'` | Position relative to trigger |

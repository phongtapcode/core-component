# Counter

`<ui-counter>` animates a numeric value from a start value to an end value when it connects to the page. Call `restart()` to replay it. With reduced motion enabled, it shows the target value immediately.

## Basic usage

```html
<ui-counter from="0" to="1250" duration="2000">0</ui-counter>
```

## Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `from` | number | `0` | Starting value |
| `to` | number | `100` | Target value |
| `duration` | number | `1500` | Animation duration in milliseconds |

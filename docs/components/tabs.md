# Tabs

`<ui-tabs>` provides an accessible tabbed interface following WAI-ARIA tab panel specifications with full keyboard navigation.

## Basic usage

```html
<ui-tabs>
  <div role="tablist">
    <button role="tab" id="tab-1" aria-controls="panel-1">Tab 1</button>
    <button role="tab" id="tab-2" aria-controls="panel-2">Tab 2</button>
  </div>
  <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">Content 1</div>
  <div role="tabpanel" id="panel-2" aria-labelledby="tab-2">Content 2</div>
</ui-tabs>
```

## Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `value` | string | `''` | ID of the active tab (defaults to first tab) |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | Tablist layout orientation |

## Events

| Event | Detail | Description |
|---|---|---|
| `ui-tabs-change` | `{ value: string }` | Fired when the active tab changes |

## Keyboard navigation

- <kbd>←</kbd> / <kbd>→</kbd> (or <kbd>↑</kbd> / <kbd>↓</kbd> in vertical mode): Navigate through tabs.
- <kbd>Home</kbd> / <kbd>End</kbd>: Jump to first / last tab.

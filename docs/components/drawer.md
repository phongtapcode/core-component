# Drawer

`<ui-drawer>` is a slide-in side panel with backdrop blur, scroll locking, and smooth opening/closing transitions.

## Basic usage

```html
<button id="open-btn">Open Drawer</button>

<ui-drawer placement="left" id="my-drawer">
  <button data-drawer-close>Close</button>
  <h2>Navigation</h2>
  <nav>
    <a href="#home">Home</a>
    <a href="#about">About</a>
  </nav>
</ui-drawer>

<script type="module">
  document.getElementById('open-btn').addEventListener('click', () => {
    document.getElementById('my-drawer').openDrawer();
  });
</script>
```

## Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `open` | boolean | `false` | Whether the drawer is open |
| `placement` | `'left'` \| `'right'` | `'left'` | Screen edge to slide in from |

## Methods

| Method | Description |
|---|---|
| `openDrawer()` | Open the drawer with slide animation |
| `closeDrawer()` | Close the drawer with slide animation |
| `toggle()` | Toggle between open and closed |

## Events

| Event | Detail | Description |
|---|---|---|
| `ui-drawer-open` | `{}` | Fired when drawer opens |
| `ui-drawer-close` | `{}` | Fired when drawer closes |

## Features & Accessibility

- **Backdrop Overlay**: Automatically mounts a backdrop with blur that closes on click.
- **Scroll Lock**: Locks body scroll while drawer is open.
- **Focus Trap**: Contains keyboard focus inside the drawer while open.
- **Escape Key**: Press <kbd>Escape</kbd> to close.

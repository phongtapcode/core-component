# Modal

`<ui-modal>` is an accessible dialog with focus trap and Escape-to-close.

## Basic usage

```html
<button id="open">Open</button>
<ui-modal>
  <div data-modal-overlay></div>
  <div data-modal-dialog>
    <h2>Title</h2>
    <p>Body</p>
    <button data-modal-close>Close</button>
  </div>
</ui-modal>
<script type="module">
  document.getElementById('open').addEventListener('click', () => {
    document.querySelector('ui-modal').openModal();
  });
</script>
```

## Attributes

| Name | Type | Default | Description |
|---|---|---|---|
| `open` | boolean | false | Whether the modal is open |
| `dismissable` | boolean | true | Allow Escape / overlay click to close |

## Methods

| Method | Description |
|---|---|
| `openModal()` | Open |
| `closeModal()` | Close |
| `toggle()` | Open or close |

## Events

| Event | Detail | Description |
|---|---|---|
| `ui-modal-open` | `{}` | Fired when opening |
| `ui-modal-close` | `{}` | Fired when closing |

## Accessibility

- `role="dialog"` and `aria-modal="true"` are set automatically.
- Focus is trapped within the dialog while open.
- Escape closes the dialog (unless `dismissable="false"`).
- Focus is restored to the previously focused element on close.
- Body scroll is locked while open.
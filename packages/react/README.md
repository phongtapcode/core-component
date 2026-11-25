# @element-works/react

React and Next.js adapters for Element Works Web Components. The package keeps component behavior in the framework-independent Web Components and provides React props, typed refs, event callbacks, client-side registration, and one stylesheet.

## Install

```bash
pnpm add @element-works/react
```

React is a peer dependency. Your React or Next.js application must already have React installed. The package installs the Element Works Web Component packages as dependencies.

## Next.js App Router

Import the stylesheet once in the root layout. It includes tokens, motion styles, and component styles.

```tsx
// app/layout.tsx
import '@element-works/react/styles.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
```

Use the React wrappers in a Client Component:

```tsx
// app/demo.tsx
'use client';

import { useState } from 'react';
import { Modal, Toggle } from '@element-works/react';

export default function Demo() {
  const [notifications, setNotifications] = useState(false);
  const [open, setOpen] = useState(false);

  return <>
    <Toggle label="Notifications" checked={notifications} onCheckedChange={setNotifications} />
    <button onClick={() => setOpen(true)}>Open dialog</button>
    <Modal open={open} onOpenChange={setOpen}>
      <h2>Dialog title</h2>
      <p>Dialog content</p>
      <button onClick={() => setOpen(false)}>Close</button>
    </Modal>
  </>;
}
```

The adapter's entry point contains `use client`. It imports Web Component definitions only after mounting in the browser, so its module can be evaluated during Next.js server rendering without accessing `HTMLElement`.

For the Next.js Pages Router, import `@element-works/react/styles.css` once in `pages/_app.tsx`; the React wrappers work the same way.

## React with Vite

Import the stylesheet once in `src/main.tsx`. The same wrappers work in your app:

```tsx
import '@element-works/react/styles.css';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

## Other elements

`Toggle` and `Modal` have dedicated typed React props. Use `Element` for any other published `ui-*` tag. `attributes` sets HTML attributes; `properties` sets JavaScript properties after registration; `events` receives native `CustomEvent`s. Standard React props such as `className`, `style`, `id`, and `children` also work.

```tsx
import { Element } from '@element-works/react';

<Element tag="ui-animate" attributes={{ effect: 'fade-up', duration: 450 }}>
  <h2>Animated heading</h2>
</Element>

<Element
  tag="ui-carousel"
  attributes={{ 'ui-autoplay': 3000 }}
  events={{ 'ui-carousel-change': (event) => console.log(event.detail) }}
>
  {/* Use the markup required by ui-carousel's component documentation. */}
</Element>
```

The adapter registers the owning Web Component package for each tag. The first registration loads that package; later uses share the same import. `register('ui-modal')` can be called manually if you need a tag defined before rendering. `register()` loads both the components and motion packages.

## Props and state

| Wrapper | React props | Callback | Ref |
|---|---|---|---|
| `Toggle` | `label`, `checked`, `defaultChecked`, `disabled` | `onCheckedChange(checked, event)` | `UiToggle` element |
| `Modal` | `open`, `defaultOpen`, `dismissable` | `onOpenChange(open, event)` | `UiModal` element |
| `Element` | `tag`, `attributes`, `properties`, `events` | Native custom events through `events` | `HTMLElement` |

`checked` and `open` are controlled values: update your React state from the callback. Use `defaultChecked` and `defaultOpen` for initial uncontrolled values. Do not pass both controlled and default props for the same state.

The wrappers use native DOM listeners for custom events, so event names are preserved exactly and listeners are removed on unmount. The package does not include the React runtime in its published tarball; it uses the application's React installation.

## Limitations

- Only `Toggle` and `Modal` currently have dedicated React props. Other elements use `Element` and follow their Web Component API.
- Registration happens after client mount. Server-rendered markup is upgraded once the browser loads the matching Web Component module.
- `Element.properties` sets supplied properties after registration. To reset a property, pass the new value explicitly.
- Importing `styles.css` includes the full token, motion, and component CSS. For smaller CSS, import the specific CSS exports from the underlying packages in your app instead.

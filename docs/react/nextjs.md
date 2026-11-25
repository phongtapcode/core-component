# Dùng với Next.js

Adapter được thử với Next.js App Router, React 19 và TypeScript. Entry point có `'use client'` và không truy cập `HTMLElement` khi module được render trên server. Web Component được đăng ký sau khi Client Component mount trong browser.

## App Router

Import CSS trong root layout:

```tsx
// app/layout.tsx
import type { ReactNode } from 'react';
import '@element-works/react/styles.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
```

Đặt state và event handlers trong Client Component:

```tsx
// app/demo.tsx
'use client';

import { useState } from 'react';
import { Modal, Toggle } from '@element-works/react';

export default function Demo() {
  const [notifications, setNotifications] = useState(false);
  const [open, setOpen] = useState(false);

  return <>
    <Toggle
      label="Thông báo"
      checked={notifications}
      onCheckedChange={setNotifications}
    />
    <button onClick={() => setOpen(true)}>Mở modal</button>
    <Modal open={open} onOpenChange={setOpen}>
      <h2>Tiêu đề</h2>
      <p>Nội dung</p>
      <button onClick={() => setOpen(false)}>Đóng</button>
    </Modal>
  </>;
}
```

Trang vẫn có thể là Server Component:

```tsx
// app/page.tsx
import Demo from './demo';

export default function Page() {
  return <main><Demo /></main>;
}
```

Không import `@element-works/components` hoặc `@element-works/motion` trực tiếp trong Server Component: các module này định nghĩa class kế thừa `HTMLElement`. Adapter tải chúng sau khi mount ở browser.

## Pages Router

Đặt CSS trong `pages/_app.tsx`:

```tsx
import type { AppProps } from 'next/app';
import '@element-works/react/styles.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

Các wrapper dùng như ví dụ `Demo` phía trên; Pages Router không cần `'use client'`.

## Lưu ý khi render trên server

Next.js có thể prerender markup của Client Component. Các thẻ `ui-*` được nâng cấp sau khi mã JavaScript tải xong ở browser; phần nội dung nên đọc được trước khi hiệu ứng chạy. `Toggle` và `Modal` không cần file khai báo JSX riêng vì đã là React components.

Nếu cần gọi phương thức DOM trước tương tác của người dùng, dùng `await register('ui-modal')` trong browser rồi mới gọi qua ref. Xem [ví dụ ref](/react/components).

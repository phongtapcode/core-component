# React / Next.js

`@element-works/react` giúp dùng Element Works bằng JSX, callback và ref có kiểu TypeScript. Các Web Components vẫn giữ nguyên hành vi; adapter chỉ nối chúng với React và tự đăng ký thẻ khi chạy trong browser.

> **Trạng thái:** package React đã build và kiểm thử nhưng chưa publish lên npm vì lần phát hành đầu cần mã OTP của tài khoản. Các ví dụ cài đặt dưới đây dùng được sau khi publish.

## Bắt đầu nhanh

```bash
pnpm add @element-works/react
```

Import CSS một lần ở entry point của ứng dụng:

```tsx
import '@element-works/react/styles.css';
```

Sau đó dùng component như React thông thường:

```tsx
import { useState } from 'react';
import { Toggle } from '@element-works/react';

export function Notifications() {
  const [enabled, setEnabled] = useState(false);
  return <Toggle label="Thông báo" checked={enabled} onCheckedChange={setEnabled} />;
}
```

Trong Next.js, component có state cần thêm `'use client'` ở đầu file. Adapter tự xử lý việc tải Web Components ở browser; bạn không cần tự viết `useEffect` để đăng ký thẻ.

## Chọn hướng dẫn

- [Cài đặt](/react/installation): package, CSS, React + Vite và các cách import.
- [Next.js](/react/nextjs): App Router, Pages Router, server rendering và Client Components.
- [Dùng components](/react/components): Toggle, Modal, motion và các thẻ `ui-*` khác.
- [API và giới hạn](/react/api): props, sự kiện, ref, `register()` và phạm vi adapter.

Nếu bạn dùng Web Components không qua React, hãy xem [hướng dẫn cài đặt chung](/installation) và [danh sách components](/components/).

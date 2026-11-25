# Cài đặt cho React

> `@element-works/react` hiện đang chờ publish lần đầu. Nếu lệnh cài đặt trả `404`, package vẫn chưa có trên npm.

## Cài package

```bash
pnpm add @element-works/react
```

Hoặc dùng npm:

```bash
npm install @element-works/react
```

Ứng dụng cần React. Adapter khai báo `react` là peer dependency và cài các package Element Works cần thiết (`components`, `motion`, `tokens`, cùng dependency của chúng) tự động. Bạn không cần thêm khai báo `JSX.IntrinsicElements` cho các wrapper React.

## Import CSS một lần

```tsx
import '@element-works/react/styles.css';
```

File này gồm token CSS, motion CSS và component CSS. Đặt import ở `src/main.tsx` với React + Vite, `app/layout.tsx` với Next.js App Router, hoặc `pages/_app.tsx` với Next.js Pages Router.

### React + Vite

```tsx
// src/main.tsx
import '@element-works/react/styles.css';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

```tsx
// src/App.tsx
import { Toggle } from '@element-works/react';

export default function App() {
  return <Toggle label="Thông báo" defaultChecked />;
}
```

Không cần import `@element-works/components` vào entry point. Wrapper tải module Web Component phù hợp khi được mount.

## Chỉ dùng một phần CSS

`styles.css` là lựa chọn thuận tiện và chứa toàn bộ CSS của thư viện. Nếu muốn chọn từng file CSS, cài các package CSS như dependency trực tiếp của ứng dụng (đặc biệt với `pnpm`) rồi import đường dẫn tương ứng:

```bash
pnpm add @element-works/tokens @element-works/components
```

```tsx
import '@element-works/tokens/css';
import '@element-works/components/css';
```

Thêm `@element-works/motion` và `@element-works/motion/css` nếu dùng hiệu ứng motion. Các wrapper React vẫn được import từ `@element-works/react`.

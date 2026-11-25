# API React adapter

## `Toggle`

| Prop | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `label` | `string` | — | Nhãn truy cập cho switch. |
| `checked` | `boolean` | — | Giá trị do React state điều khiển. |
| `defaultChecked` | `boolean` | — | Giá trị ban đầu khi không dùng `checked`. |
| `disabled` | `boolean` | `false` | Chặn tương tác. |
| `onCheckedChange` | `(checked, event) => void` | — | Nhận event `ui-toggle-change`. |

Ref trỏ tới `UiToggle`; kiểu này được export từ `@element-works/react`.

## `Modal`

| Prop | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `open` | `boolean` | — | Trạng thái do React state điều khiển. |
| `defaultOpen` | `boolean` | — | Trạng thái ban đầu khi không dùng `open`. |
| `dismissable` | `boolean` | Theo Web Component | Cho phép modal tự đóng khi tương tác phù hợp. |
| `onOpenChange` | `(open, event) => void` | — | Nhận `ui-modal-open` hoặc `ui-modal-close`. |

Ref trỏ tới `UiModal`, cũng được export từ adapter. Các phương thức như `openModal()` và `closeModal()` vẫn có thể gọi qua ref sau khi tag đã được đăng ký.

## `Element`

| Prop | Kiểu | Ý nghĩa |
|---|---|---|
| `tag` | `` `ui-${string}` `` | Tên custom element cần render và đăng ký. |
| `attributes` | `Record<string, string \| number \| boolean \| null \| undefined>` | HTML attributes. `true` thành attribute rỗng; `false`, `null`, `undefined` xóa attribute. |
| `properties` | `Record<string, unknown>` | Gán JS properties sau khi tag được đăng ký. |
| `events` | `Record<string, (event: CustomEvent<unknown>) => void>` | Gắn native event listeners theo đúng tên event. |

`Element` cũng nhận `className`, `style`, `id`, `children` và các HTML props thông thường. Ref có kiểu `HTMLElement`. Muốn một property quay về giá trị khác, truyền giá trị mới; bỏ key khỏi `properties` không tự reset property cũ. Với các component phản ứng theo attribute, ưu tiên `attributes` để cập nhật hiển thị.

## `register(tag?)`

```ts
import { register } from '@element-works/react';

await register('ui-modal'); // tải package và định nghĩa riêng tag này
await register();           // tải cả components và motion
```

Không truyền tag thì cả hai package Web Components được tải. Với một tag được cung cấp, adapter chỉ tải package sở hữu tag đó. Hàm không làm gì khi chạy trên server; nếu browser không có tag sau khi tải, Promise bị reject. Khi dùng các wrapper thông thường, không cần gọi `register()` bằng tay.

## Phạm vi hiện tại

- `Toggle` và `Modal` có React props riêng. Các thẻ khác dùng `Element` và API của Web Component tương ứng.
- Web Component được đăng ký sau khi Client Component mount. Nội dung server render có thể xuất hiện trước khi hiệu ứng hoạt động.
- `@element-works/react/styles.css` chứa toàn bộ CSS của tokens, motion và components. Xem [cài đặt](/react/installation) nếu muốn import riêng.
- React là peer dependency. Adapter đã được thử với React 18 và 19; browser interaction được kiểm tra với React 19 và Next.js App Router.

# Dùng components trong React

Adapter có wrapper riêng cho `Toggle` và `Modal`. Những thẻ `ui-*` còn lại dùng wrapper chung `Element`, nên bạn vẫn truy cập được toàn bộ thư viện mà không cần khai báo JSX thủ công.

## Toggle

Controlled state: React giữ giá trị và cập nhật từ callback.

```tsx
import { useState } from 'react';
import { Toggle } from '@element-works/react';

export function SettingsToggle() {
  const [checked, setChecked] = useState(false);
  return <Toggle label="Thông báo" checked={checked} onCheckedChange={setChecked} />;
}
```

Nếu không cần React giữ state, dùng `defaultChecked` và bỏ `checked`:

```tsx
<Toggle label="Thông báo" defaultChecked onCheckedChange={(checked) => console.log(checked)} />
```

`disabled` chặn tương tác. `onCheckedChange` nhận `(checked, event)` với event gốc `ui-toggle-change`. Xem thêm [API của Toggle](/components/toggle).

## Modal

```tsx
import { useState } from 'react';
import { Modal } from '@element-works/react';

export function DialogExample() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Mở</button>
    <Modal open={open} onOpenChange={setOpen}>
      <h2>Chi tiết</h2>
      <p>Nội dung modal</p>
      <button onClick={() => setOpen(false)}>Đóng</button>
    </Modal>
  </>;
}
```

`defaultOpen` là trạng thái mở ban đầu khi không truyền `open`. `dismissable` điều khiển việc đóng bằng các tương tác của modal. `onOpenChange` nhận `(open, event)` từ `ui-modal-open` và `ui-modal-close`. Xem thêm [API của Modal](/components/modal).

## Gọi phương thức qua ref

```tsx
'use client';

import { useRef } from 'react';
import { Modal, register, type UiModal } from '@element-works/react';

export function ModalWithRef() {
  const modalRef = useRef<UiModal>(null);
  const open = async () => {
    await register('ui-modal');
    modalRef.current?.openModal();
  };

  return <>
    <button onClick={() => void open()}>Mở</button>
    <Modal ref={modalRef}><h2>Nội dung</h2></Modal>
  </>;
}
```

## Motion và các thẻ khác

`Element` nhận tên thẻ, HTML attributes, JS properties và custom events. Ví dụ hiệu ứng cuộn:

```tsx
import { Element } from '@element-works/react';

<Element tag="ui-animate" attributes={{ effect: 'fade-up', duration: 450 }}>
  <h2>Xuất hiện khi cuộn đến</h2>
</Element>
```

Ví dụ sự kiện từ carousel:

```tsx
<Element
  tag="ui-carousel"
  attributes={{ 'ui-autoplay': 3000 }}
  events={{ 'ui-carousel-change': (event) => console.log(event.detail) }}
>
  {/* Đặt markup theo hướng dẫn của Carousel. */}
</Element>
```

Xem [Animate](/components/animate) và [Carousel](/components/carousel) để biết markup, attributes và event detail của từng thẻ. `Element` tự tải package sở hữu thẻ đó sau khi mount.

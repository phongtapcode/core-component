# Accordion

`<ui-collapse-provider>` điều phối các cặp trigger và nội dung `<ui-collapse>`. Mặc định chỉ một mục được mở; thêm `multiple` để cho phép mở nhiều mục cùng lúc.

## Ví dụ

```html
<ui-collapse-provider duration="300">
  <ui-collapse-trigger active>
    <div>Section 1</div>
  </ui-collapse-trigger>
  <ui-collapse active>Content 1</ui-collapse>

  <ui-collapse-trigger>
    <div>Section 2</div>
  </ui-collapse-trigger>
  <ui-collapse>Content 2</ui-collapse>
</ui-collapse-provider>
```

`duration` là thời gian chuyển động tính bằng mili giây. `scroll` cuộn trigger đang mở vào khung nhìn; `scroll-offset` bù chiều cao header cố định. Sự kiện `ui-accordion-change` mang `detail.openCount`.

<a href="/html/#/ui-accordion">Xem demo tương tác</a>.

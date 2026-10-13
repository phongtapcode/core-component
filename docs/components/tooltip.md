# Tooltip

`<ui-tooltip>` hiển thị gợi ý ngắn khi hover, focus bằng bàn phím hoặc chạm vào trigger. Component tự tạo `<ui-tooltip-content>` và gắn vào `document.body` để tooltip không bị cắt bởi `overflow` của container.

## Cách dùng

```html
<ui-tooltip ui-title="Thêm vào giỏ hàng" ui-placement="top-center">
  <button>Giỏ hàng</button>
</ui-tooltip>

<ui-tooltip
  ui-title="Thông tin thêm"
  ui-placement="bottom-start"
  ui-animate="fade-up"
  ui-duration="300"
  ui-offset="12"
>
  <button aria-label="Thông tin thêm">?</button>
</ui-tooltip>
```

Phần tử con đầu tiên là trigger. `ui-title` được đưa vào tooltip dưới dạng văn bản thuần. Nên dùng button khi trigger có thể nhận focus; nếu chỉ dùng một `span`, hãy thêm `tabindex="0"` để người dùng bàn phím mở được tooltip.

## Thuộc tính

| Thuộc tính | Mặc định | Mô tả |
| --- | --- | --- |
| `ui-title` | — | Nội dung gợi ý ngắn, bắt buộc để hiển thị. |
| `ui-placement` | `top-center` | `top`, `bottom`, `left`, `right` kết hợp với `start`, `center`, `end`; ví dụ `bottom-start`. Tự đổi phía khi phía đối diện có nhiều chỗ hơn, sau đó giới hạn trong viewport. |
| `ui-animate` | `fade` | `fade`, `fade-up`, `fade-down`, `fade-left`, `fade-right`, `scale`, `none`. |
| `ui-duration` | `180` | Thời gian chạy hiệu ứng, tính bằng ms; `0` để tắt. |
| `ui-offset` | `8` | Khoảng cách giữa trigger và tooltip, tính bằng px. |
| `ui-mobile-disabled` | không | Tắt thao tác chạm để mở tooltip. |

Tooltip cập nhật vị trí khi cuộn trang hoặc resize. Hover rời khỏi trigger, mất focus, nhấn `Escape` hoặc chạm ra ngoài sẽ đóng tooltip. Khi mở, trigger được gắn `aria-describedby`; giá trị ban đầu được khôi phục khi đóng. Thiết bị bật reduced motion sẽ không chạy transition.

Chỉ dùng tooltip cho gợi ý ngắn, không có nút hay nội dung tương tác. Nội dung tương tác nên dùng popover hoặc modal.

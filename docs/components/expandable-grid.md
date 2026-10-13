# Expandable Grid

`<ui-expandable-grid>` mở rộng một card ngay trong grid. Các card còn lại di chuyển đến vị trí mới bằng hiệu ứng FLIP. Nội dung mở rộng vẫn nằm trong DOM và có thể chứa link hoặc nút.

## HTML cơ bản

```html
<ui-expandable-grid ui-duration="500">
  <ui-expandable-grid-item>
    <img src="coast.jpg" alt="Bờ biển" />
    <button type="button" ui-expandable-grid-trigger>Xem câu chuyện</button>
    <ui-expandable-grid-detail>
      <p>Thông tin về địa điểm và bức ảnh.</p>
      <a href="/story/coast">Đọc thêm</a>
    </ui-expandable-grid-detail>
  </ui-expandable-grid-item>
  <ui-expandable-grid-item>
    <img src="forest.jpg" alt="Rừng cây" />
    <button type="button" ui-expandable-grid-trigger>Xem câu chuyện</button>
    <ui-expandable-grid-detail>...</ui-expandable-grid-detail>
  </ui-expandable-grid-item>
</ui-expandable-grid>
```

Mỗi card là con trực tiếp của grid. Đặt `ui-expandable-grid-trigger` trên một `<button>` trong card. Khi mở, card nhận thuộc tính `ui-active`; nút nhận `aria-expanded="true"`. Bấm nút lần nữa hoặc Escape để đóng. Chỉ một card mở tại một thời điểm.

## Thuộc tính và API

| Thuộc tính | Mặc định | Mô tả |
| --- | --- | --- |
| `ui-duration` | `500` | Thời gian các card di chuyển, đơn vị ms. |
| `ui-easing` | `cubic-bezier(.22,1,.36,1)` | CSS easing cho chuyển động. |

| Phương thức | Mô tả |
| --- | --- |
| `open(index)` | Mở card theo chỉ số bắt đầu từ 0. |
| `close()` | Đóng card đang mở. |
| `toggle(index)` | Đổi trạng thái card. |

`ui-expandable-grid-change` được phát khi card mở thay đổi, với `event.detail = { activeIndex, previousIndex, item }`. Khi đóng, `activeIndex` là `-1` và `item` là `null`.

## CSS variables

| Biến | Mặc định | Mô tả |
| --- | --- | --- |
| `--ui-expandable-grid-columns` | `3` | Số cột trên màn hình rộng. |
| `--ui-expandable-grid-mobile-columns` | `1` | Số cột ở viewport ≤ 760px. |
| `--ui-expandable-grid-gap` | `16px` | Khoảng cách card. |
| `--ui-expandable-grid-item-height` | `250px` | Chiều cao tối thiểu khi đóng. |
| `--ui-expandable-grid-open-height` | `480px` | Chiều cao tối thiểu khi mở. |

Component bỏ qua chuyển động khi người dùng bật reduced motion. Bạn có thể style ảnh, nút, nền và nội dung của card trực tiếp bằng CSS.

# Image Stack

`ui-image-stack` xếp nhiều ảnh thành các lớp có chiều sâu. Hover hoặc focus làm các lớp tách ra; bấm vào một lớp để mở ảnh lớn. Trong bản xem lớn, dùng nút mũi tên hoặc phím ←/→ để chuyển ảnh, Escape hoặc nút × để đóng.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-image-stack aria-label="Bộ ảnh du lịch">
  <ui-image-stack-item ui-label="Bờ biển">
    <img src="coast.jpg" alt="Bờ biển lúc chiều tà">
    <span data-stack-caption>01 / Bờ biển</span>
  </ui-image-stack-item>
  <ui-image-stack-item ui-label="Khu vườn">
    <img src="garden.jpg" alt="Khu vườn xanh">
    <span data-stack-caption>02 / Khu vườn</span>
  </ui-image-stack-item>
  <ui-image-stack-item ui-label="Thành phố">
    <img src="city.jpg" alt="Kiến trúc thành phố">
    <span data-stack-caption>03 / Thành phố</span>
  </ui-image-stack-item>
</ui-image-stack>
```

`ui-image-stack-item` nhận ảnh `<img>` hoặc `<picture>`. `ui-label` là tên hiển thị trong bản xem lớn; nếu thiếu, component dùng `alt` của ảnh. `data-stack-caption` là caption tùy chọn trên thẻ nhỏ. Thứ tự các item quyết định thứ tự xếp lớp và xem ảnh.

## Kiểu xếp ảnh

| `ui-style` | Hình dạng |
|---|---|
| Không đặt | Các lớp lệch sang phải và xòe rộng khi hover. |
| `fan` | Ảnh có viền giấy, xòe thành hình quạt. |
| `fall` | Khung ảnh so le rồi rơi thành bậc dọc. |
| `sheet` | Chồng ảnh mở ra thành lưới ảnh 3 cột. Phù hợp nhất với 6 ảnh. |
| `coverflow` | Các ảnh trải thành hàng ngang với góc xoay theo chiều sâu. Phù hợp nhất với 5 ảnh. |

```html
<ui-image-stack ui-style="fan" style="--ui-image-stack-width:280px;--ui-image-stack-height:360px">
  <ui-image-stack-item ui-label="Ảnh một"><img src="one.jpg" alt="Ảnh một"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Ảnh hai"><img src="two.jpg" alt="Ảnh hai"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Ảnh ba"><img src="three.jpg" alt="Ảnh ba"></ui-image-stack-item>
</ui-image-stack>
```

## Tùy chỉnh

| CSS variable | Mặc định | Tác dụng |
|---|---:|---|
| `--ui-image-stack-width` | `320px` | Chiều rộng lớp đầu tiên. |
| `--ui-image-stack-height` | `390px` | Chiều cao lớp đầu tiên. |
| `--ui-image-stack-step` | `17px` | Mỗi lớp sau nhỏ hơn bao nhiêu. |
| `--ui-image-stack-offset` | `26px` | Khoảng lệch sang phải giữa các lớp. |
| `--ui-image-stack-depth` | `16px` | Khoảng cách chiều sâu giữa các lớp. |
| `--ui-image-stack-hover-spread` | `2.3` | Độ xòe ngang khi hover hoặc focus. |
| `--ui-image-stack-fan-spread` | `72px` | Khoảng xòe ngang mỗi thẻ ở kiểu `fan`. |
| `--ui-image-stack-rail-spread` | `125px` | Khoảng cách giữa các ảnh trong kiểu `coverflow`. |
| `--ui-image-stack-radius` | `15px` | Bo góc ảnh. |

```html
<ui-image-stack style="--ui-image-stack-width:260px;--ui-image-stack-height:330px;--ui-image-stack-offset:18px">
  <!-- Các ui-image-stack-item -->
</ui-image-stack>
```

API JavaScript: `open(index)`, `close()`, `next()`, `previous()`, `refresh()`. `index` bắt đầu từ 0; gọi `refresh()` sau khi thay đổi thứ tự bằng JavaScript (thêm/bỏ item cũng được đồng bộ tự động). Các sự kiện `ui:image-stack:open`, `ui:image-stack:change` và `ui:image-stack:close` có `detail.index`.

Bản xem lớn dùng `ui-modal` của thư viện, nên có backdrop, khóa cuộn, giữ focus trong modal và trả focus về ảnh đã chọn khi đóng. Trên thiết bị cảm ứng, các kiểu luôn mở sẵn để có thể chạm trực tiếp vào từng ảnh.

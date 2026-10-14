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
| `palette` | Đúng 4 ảnh sẽ gặp nhau ở tâm. Hover hoặc focus để mở rộng một ảnh; ảnh đó giữ nguyên đến khi con trỏ rời khung. Nếu có ít hoặc nhiều hơn 4 ảnh, component dùng kiểu xếp lớp mặc định để tất cả ảnh vẫn chọn được. |
| `corner` | Đúng 3 ảnh: ảnh đầu ở góc trên trái, ảnh thứ hai ở giữa, ảnh thứ ba ở góc dưới phải. Hover hoặc focus để mở ảnh; hai góc còn lại thu nhỏ nhưng vẫn có thể hover để chuyển trực tiếp. Nếu số ảnh khác 3, component dùng kiểu xếp lớp mặc định. |

```html
<ui-image-stack ui-style="fan" style="--ui-image-stack-width:280px;--ui-image-stack-height:360px">
  <ui-image-stack-item ui-label="Ảnh một"><img src="one.jpg" alt="Ảnh một"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Ảnh hai"><img src="two.jpg" alt="Ảnh hai"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Ảnh ba"><img src="three.jpg" alt="Ảnh ba"></ui-image-stack-item>
</ui-image-stack>
```

```html
<ui-image-stack ui-style="corner" style="--ui-image-stack-width:200px;--ui-image-stack-height:300px">
  <ui-image-stack-item ui-label="Phố"><img src="city.jpg" alt="Thành phố"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Vườn"><img src="garden.jpg" alt="Khu vườn"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Biển"><img src="coast.jpg" alt="Bờ biển"></ui-image-stack-item>
</ui-image-stack>
```

Với kiểu `palette`, có thể đặt chữ trong huy hiệu giữa bằng `ui-badge`:

```html
<ui-image-stack ui-style="palette" ui-badge="04" style="--ui-image-stack-width:300px;--ui-image-stack-height:300px">
  <ui-image-stack-item ui-label="Vườn"><img src="garden.jpg" alt="Vườn cây"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Biển"><img src="coast.jpg" alt="Bờ biển"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Phố"><img src="city.jpg" alt="Thành phố"></ui-image-stack-item>
  <ui-image-stack-item ui-label="Hoa"><img src="flowers.jpg" alt="Vườn hoa"></ui-image-stack-item>
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
| `--ui-image-stack-palette-1` đến `--ui-image-stack-palette-4` | `#cece5a`, `#ffe17b`, `#fd8d14`, `#c51605` | Bốn màu của kiểu `palette`. |

```html
<ui-image-stack style="--ui-image-stack-width:260px;--ui-image-stack-height:330px;--ui-image-stack-offset:18px">
  <!-- Các ui-image-stack-item -->
</ui-image-stack>
```

API JavaScript: `open(index)`, `close()`, `next()`, `previous()`, `refresh()`. `index` bắt đầu từ 0; gọi `refresh()` sau khi thay đổi thứ tự bằng JavaScript (thêm/bỏ item cũng được đồng bộ tự động). Các sự kiện `ui:image-stack:open`, `ui:image-stack:change` và `ui:image-stack:close` có `detail.index`.

Bản xem lớn dùng `ui-modal` của thư viện, nên có backdrop, khóa cuộn, giữ focus trong modal và trả focus về ảnh đã chọn khi đóng. Trên thiết bị cảm ứng, các kiểu xếp lớp luôn mở sẵn để có thể chạm trực tiếp vào từng ảnh; kiểu `palette` giữ bốn mảng màu để chọn ảnh bằng cách chạm.

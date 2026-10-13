# Image Solid

`ui-image-solid` đặt ảnh thật trên các mặt của một khối 3D bằng CSS transforms. Có thể xoay 360° quanh cả hai trục bằng chuột, cảm ứng hoặc bàn phím; khi thả, khối tiếp tục xoay theo quán tính. Component hỗ trợ cube, box chữ nhật và lăng trụ 3, 6 hoặc 8 cạnh.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-image-solid ui-shape="cube" ui-size="220" ui-auto-rotate aria-label="Bộ ảnh có thể xoay">
  <ui-image-solid-face ui-face="front"><img src="front.jpg" alt="Mặt trước"></ui-image-solid-face>
  <ui-image-solid-face ui-face="right"><img src="right.jpg" alt="Mặt phải"></ui-image-solid-face>
  <ui-image-solid-face ui-face="back"><img src="back.jpg" alt="Mặt sau"></ui-image-solid-face>
  <ui-image-solid-face ui-face="left"><img src="left.jpg" alt="Mặt trái"></ui-image-solid-face>
  <ui-image-solid-face ui-face="top"><img src="top.jpg" alt="Mặt trên"></ui-image-solid-face>
  <ui-image-solid-face ui-face="bottom"><img src="bottom.jpg" alt="Mặt dưới"></ui-image-solid-face>
</ui-image-solid>
```

Đổi `ui-shape` thành `box`, `triangle`, `hexagon` hoặc `octagon`. Với lăng trụ, các mặt bên mang tên `side-1` đến `side-N`, rồi `top` và `bottom`. Có thể bỏ `ui-face`: component nhận mặt theo thứ tự khai báo. Mặt thiếu sẽ được tạo nền gradient; mặt dư tạm ẩn khi đổi hình. Ảnh nên có `alt` riêng và sẽ được crop bằng `object-fit: cover`.

```html
<ui-image-solid ui-shape="hexagon" ui-size="160" ui-height="260">
  <ui-image-solid-face><img src="one.jpg" alt="Ảnh 1"></ui-image-solid-face>
  <ui-image-solid-face><img src="two.jpg" alt="Ảnh 2"></ui-image-solid-face>
  <!-- Thêm bốn mặt bên và hai mặt nắp -->
</ui-image-solid>
```

## Tùy chỉnh

| Thuộc tính | Mặc định | Tác dụng |
|---|---:|---|
| `ui-shape` | `cube` | `cube`, `box`, `triangle`, `hexagon`, `octagon`. |
| `ui-size` | `220` | Cạnh cube hoặc chiều rộng mỗi mặt bên lăng trụ, px. |
| `ui-width` | `230` | Chiều rộng box, px. |
| `ui-height` | `270` | Chiều cao box/lăng trụ, px. |
| `ui-depth` | `150` | Chiều sâu box, px. |
| `ui-auto-rotate` | Tắt | Có thuộc tính để tự xoay quanh trục đứng. |
| `ui-spin-speed` | `16` | Tốc độ xoay tự động, độ/giây; số âm xoay ngược. |
| `ui-inertia` | `0.91` | Độ giữ đà sau khi thả, từ 0.6 đến 0.99. |
| `ui-drag-sensitivity` | `0.55` | Số độ xoay cho mỗi pixel kéo. |
| `ui-rotation-x`, `ui-rotation-y` | `-18`, `30` | Góc khởi đầu, độ. |

```css
ui-image-solid {
  --ui-image-solid-height: 500px;
  --ui-image-solid-perspective: 950px;
}
```

```js
const solid = document.querySelector('ui-image-solid');
solid.rotateTo(-25, 180);
solid.reset();
solid.refresh(); // gọi sau khi thêm hoặc bỏ mặt ảnh bằng JavaScript
```

Sự kiện `ui:image-solid:rotate` chứa `{ x, y }`. Phím mũi tên xoay 15°, giữ Shift để xoay 30°, Home trở về góc khởi đầu. Component dừng xoay khi ở ngoài viewport hoặc tab bị ẩn; chế độ giảm chuyển động tắt xoay tự động và quán tính.

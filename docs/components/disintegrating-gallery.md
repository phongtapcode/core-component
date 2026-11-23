# Disintegrating Gallery

`<ui-disintegrating-gallery>` là dải ảnh chạy vô hạn. Ảnh ở giữa rõ và nguyên vẹn; khi trôi về rìa trái, ảnh tan dần từ trái sang phải, còn ở rìa phải thì tan từ phải sang trái. Các ô ảnh bay ra, nhỏ dần rồi biến mất hẳn. Kéo, vuốt hoặc cuộn để điều khiển dải ảnh. Component dùng Canvas 2D, không cần WebGL hay thư viện animation khác.

```html
<ui-disintegrating-gallery ui-speed="40" ui-cell-size="12" ui-scatter="140" aria-label="Bộ ảnh du lịch">
  <ui-disintegrating-gallery-item><img src="coast.jpg" alt="Bờ biển xanh" /></ui-disintegrating-gallery-item>
  <ui-disintegrating-gallery-item><img src="forest.jpg" alt="Khu rừng buổi sớm" /></ui-disintegrating-gallery-item>
  <ui-disintegrating-gallery-item><img src="sunset.jpg" alt="Hoàng hôn trên đồng cỏ" /></ui-disintegrating-gallery-item>
</ui-disintegrating-gallery>
```

Import `@element-works/components` và `@element-works/components/css`. Ảnh nên có cùng tỉ lệ; ảnh khác tỉ lệ sẽ được cắt theo kiểu `object-fit: cover`. Đặt `ui-speed="0"` nếu chỉ muốn lướt thủ công.

| Thuộc tính | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `ui-speed` | `40` | Tốc độ tự chạy, pixel/giây. Giá trị âm đổi chiều. |
| `ui-cell-size` | `12` | Cạnh ô ảnh, từ 4 đến 48 pixel. Ô nhỏ hơn tạo hiệu ứng mịn hơn nhưng tốn nhiều lệnh vẽ hơn. |
| `ui-scatter` | `140` | Khoảng bay tối đa của ô ảnh, từ 0 đến 400 pixel. |
| `ui-card-width` | `280` | Chiều rộng ảnh, được giới hạn theo độ rộng gallery. |
| `ui-card-height` | `360` | Chiều cao ảnh, được giới hạn theo chiều cao gallery. |
| `ui-gap` | `28` | Khoảng cách giữa các ảnh. |

CSS variables: `--ui-disintegrating-gallery-height` (mặc định `480px`) và `--ui-disintegrating-gallery-background` (mặc định trong suốt).

Gọi `moveBy(pixels)` để dịch dải ảnh bằng JavaScript. Event `ui:disintegrating-gallery:change` phát khi ảnh gần giữa thay đổi, với `detail: { index, item }`.

Kéo bằng chuột hoặc vuốt ngang để lướt có quán tính. Cuộn chuột hoặc trackpad khi con trỏ ở trên gallery cũng dịch dải ảnh; vuốt dọc trên màn hình cảm ứng vẫn cuộn trang. Focus gallery và dùng phím **← / →** để chuyển từng ảnh. Ảnh gốc và `alt` vẫn ở trong DOM cho trình đọc màn hình. Khi Canvas không dùng được hoặc ảnh tải lỗi, gallery hiển thị dải ảnh cuộn thông thường. `prefers-reduced-motion` tắt tự chạy và quán tính, nhưng vẫn cho phép điều khiển thủ công. Vòng vẽ dừng khi gallery ra khỏi màn hình, tab bị ẩn, hoặc component bị tháo khỏi DOM.

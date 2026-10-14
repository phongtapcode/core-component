# Image Flashlight

`ui-image-flashlight` bắt đầu với ảnh xám tối nhưng vẫn thấy nội dung. Một vùng sáng tròn di chuyển trên ảnh để hiện màu gốc trong vùng đó. Sau một lúc, vùng sáng mở rộng đến khi toàn bộ ảnh hiện rõ.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-image-flashlight ui-duration="6000" ui-radius="0.26" ui-loop
  style="--ui-image-flashlight-darkness: .24">
  <img src="photo.jpg" alt="Mô tả nội dung ảnh" />
</ui-image-flashlight>
```

Ảnh cần là phần tử `img` con trực tiếp. Component giữ nguyên ảnh này để cung cấp `alt`, đồng thời tạo một lớp ảnh tạm thời chỉ hiện trong vùng sáng. Khi hiệu ứng kết thúc, lớp tạm được xóa và ảnh gốc hiện đầy đủ.

| Thuộc tính | Mặc định | Tác dụng |
|---|---:|---|
| `ui-duration` | `6000` ms | Tổng thời gian soi và mở sáng, từ 800 đến 15000 ms. |
| `ui-radius` | `0.26` | Bán kính vùng soi so với cạnh ngắn của ảnh, từ 0.1 đến 0.55. |
| `ui-loop` | Tắt | Chạy lại sau khi ảnh đã sáng toàn bộ và giữ nguyên một lúc. |
| `ui-loop-delay` | `1800` ms | Thời gian giữ ảnh sáng trước vòng tiếp theo, từ 0 đến 10000 ms. |
| `ui-start-target` | `section` gần nhất | Chọn section bao quanh làm mốc bắt đầu. Nếu không có section, component dùng chính nó. |

| CSS variable | Mặc định | Tác dụng |
|---|---|---|
| `--ui-image-flashlight-darkness` | `.24` | Độ sáng của ảnh xám trước khi hiện màu đầy đủ. |

Hiệu ứng đợi đến khi toàn bộ section nằm trong màn hình mới bắt đầu. Nếu section cao hơn màn hình, nó bắt đầu khi người xem cuộn tới cuối section. Có thể đặt `ui-start-target=".my-section"` để chọn một section bao quanh khác. Vòng lặp cũng đợi điều kiện hiển thị này trước khi chạy lại.

Gọi `replay()` để chạy lại. Sau khi thay `src` của ảnh, gọi `refresh()` để bắt đầu hiệu ứng với ảnh mới.

```js
const flashlight = document.querySelector('ui-image-flashlight');
flashlight.replay();
flashlight.addEventListener('ui-image-flashlight:complete', () => {
  console.log('Ảnh đã hiện đầy đủ');
});
```

Lớp ảnh tạm được ẩn khỏi trình đọc màn hình. Khi người dùng bật giảm chuyển động, ảnh gốc hiện ngay.

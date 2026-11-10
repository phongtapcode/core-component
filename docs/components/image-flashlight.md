# Image Flashlight

`ui-image-flashlight` bắt đầu với ảnh xám tối nhưng vẫn thấy nội dung. Mặc định, vùng sáng tự quét qua ảnh rồi mở rộng để hiện toàn bộ ảnh. Thêm `ui-hover` để vùng sáng đi theo con trỏ thay cho chuỗi tự động.

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

Chế độ theo con trỏ:

```html
<ui-image-flashlight ui-hover ui-hover-inertia="0.55" ui-radius="0.26">
  <img src="photo.jpg" alt="Mô tả nội dung ảnh" />
</ui-image-flashlight>
```

Ảnh cần là phần tử `img` con trực tiếp. Component giữ nguyên ảnh này để cung cấp `alt`, đồng thời tạo một lớp ảnh tạm thời chỉ hiện trong vùng sáng. Khi hiệu ứng kết thúc, lớp tạm được xóa và ảnh gốc hiện đầy đủ.

| Thuộc tính | Mặc định | Tác dụng |
|---|---:|---|
| `ui-duration` | `6000` ms | Tổng thời gian soi và mở sáng, từ 800 đến 15000 ms. |
| `ui-radius` | `0.26` | Bán kính vùng soi so với cạnh ngắn của ảnh, từ 0.1 đến 0.55. |
| `ui-hover` | Tắt | Vùng sáng đi theo con trỏ. `ui-hover="false"` hoặc `"0"` tắt chế độ này. |
| `ui-hover-inertia` | `0.55` | Quán tính của vùng sáng khi dùng `ui-hover`, từ 0 (bám sát ngay) đến 1 (trễ nhiều hơn). |
| `ui-loop` | Tắt | Chạy lại sau khi ảnh đã sáng toàn bộ và giữ nguyên một lúc. |
| `ui-loop-delay` | `1800` ms | Thời gian giữ ảnh sáng trước vòng tiếp theo, từ 0 đến 10000 ms. |
| `ui-start-target` | `section` gần nhất | Chọn section bao quanh làm mốc bắt đầu. Nếu không có section, component dùng chính nó. |

| CSS variable | Mặc định | Tác dụng |
|---|---|---|
| `--ui-image-flashlight-darkness` | `.24` | Độ sáng của ảnh xám trước khi hiện màu đầy đủ. |

Chế độ tự động đợi đến khi toàn bộ section nằm trong màn hình mới bắt đầu. Nếu section cao hơn màn hình, nó bắt đầu khi người xem cuộn tới cuối section. Có thể đặt `ui-start-target=".my-section"` để chọn một section bao quanh khác. Vòng lặp cũng đợi điều kiện hiển thị này trước khi chạy lại.

Chế độ `ui-hover` sẵn sàng khi ảnh tải xong. Vùng sáng xuất hiện khi con trỏ ở trên ảnh, trễ nhẹ rồi ổn định ở vị trí mới, và ẩn khi rời ảnh. Click hoặc chạm vào ảnh để ánh sáng tỏa từ điểm đó đến khi hiện toàn ảnh, giữ trong chốc lát rồi thu về vùng sáng theo con trỏ. `ui-hover-inertia` có thể đổi trực tiếp khi đang chạy; khi vùng sáng đứng yên, component ngừng tính toán khung hình. `ui-loop`, `ui-duration` và `ui-start-target` không áp dụng trong chế độ này. Có thể thêm hoặc bỏ `ui-hover` khi component đang chạy. Khi focus bằng bàn phím, ảnh gốc hiện đầy đủ.

Gọi `replay()` để chạy lại chế độ tự động hoặc đặt lại vùng sáng trong chế độ hover. Sau khi thay `src` của ảnh, gọi `refresh()` để cập nhật hiệu ứng với ảnh mới.

```js
const flashlight = document.querySelector('ui-image-flashlight');
flashlight.replay();
flashlight.addEventListener('ui-image-flashlight:complete', () => {
  console.log('Ảnh đã hiện đầy đủ');
});
```

Lớp ảnh tạm được ẩn khỏi trình đọc màn hình. Sự kiện `ui-image-flashlight:start` và `ui-image-flashlight:complete` thuộc chuỗi tự động; chế độ hover không phát hai sự kiện này. Khi người dùng bật giảm chuyển động, ảnh gốc hiện ngay ở cả hai chế độ.

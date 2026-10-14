# Image Trace

`ui-image-trace` nhận một ảnh, đọc pixel ở độ phân giải nhỏ, tìm các đường biên theo độ sáng rồi vẽ chúng bằng SVG. Khi nét vẽ hoàn tất, component làm hiện ảnh gốc. Demo nằm trong gallery tại `#/ui-image-trace`.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-image-trace ui-duration="3600" ui-detail="320" ui-contrast="36"
  style="--ui-image-trace-stroke: #365a78">
  <img src="photo.jpg" alt="Mô tả nội dung ảnh" />
</ui-image-trace>
```

Ảnh phải là phần tử `img` con trực tiếp. Nên để ảnh theo đúng tỉ lệ tự nhiên; nếu dùng `object-fit: cover` để cắt ảnh, các nét SVG có thể lệch khỏi vùng ảnh được hiển thị. Ảnh đã tải từ cùng origin, data URL và ảnh có CORS phù hợp đều có thể được phân tích. Nếu trình duyệt không cho đọc pixel, component hiện ảnh gốc ngay.

| Thuộc tính | Mặc định | Tác dụng |
|---|---:|---|
| `ui-duration` | `3600` ms | Tổng thời gian vẽ và hiện ảnh, từ 400 đến 15000 ms. |
| `ui-detail` | `320` px | Độ dài cạnh lớn nhất của ảnh dùng để dò nét, từ 48 đến 512 px. Giá trị lớn tạo nhiều nét hơn và cần thêm thời gian xử lý. |
| `ui-contrast` | `36` | Độ rõ tối thiểu của cạnh. Tăng lên để bỏ hoa văn mờ; giảm xuống để giữ thêm chi tiết nhẹ. |

| CSS variable | Mặc định | Tác dụng |
|---|---|---|
| `--ui-image-trace-background` | `#f2eee8` | Nền khi vẽ. |
| `--ui-image-trace-stroke` | `#334d60` | Màu nét vẽ. |
| `--ui-image-trace-stroke-width` | `1px` | Độ dày nét trên màn hình; không phình ra khi ảnh được phóng lớn. |

Gọi `replay()` để chạy lại hiệu ứng. Nếu thay `src` sau khi component đã hiển thị, gọi `refresh()` sau khi gán `src`; component sẽ đợi ảnh mới tải xong.

```js
const trace = document.querySelector('ui-image-trace');
trace.replay();
trace.addEventListener('ui-image-trace:ready', (event) => {
  console.log(event.detail.count); // số đường nét được vẽ
});
trace.addEventListener('ui-image-trace:complete', () => {
  console.log('Ảnh gốc đã hiện');
});
```

SVG tạo ra chỉ là hiệu ứng và được ẩn khỏi trình đọc màn hình. Nội dung ảnh vẫn lấy từ `alt` của `img`. Khi người dùng bật giảm chuyển động, ảnh gốc hiện ngay.

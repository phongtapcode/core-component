# Image Comparison

`ui-image-comparison` đặt hai ảnh cùng kích thước chồng lên nhau. Ảnh **before** nằm dưới; ảnh **after** được mở ra từ phải sang trái theo vị trí thanh chia. Người dùng có thể kéo bằng chuột hoặc chạm, click một vị trí trên ảnh, và dùng bàn phím.

Dùng cho before/after của chỉnh sửa ảnh, sản phẩm hoặc không gian. Với gallery nhiều ảnh, dùng carousel.

```js
import '@ui/components';
import '@ui/components/css';
```

## Cấu trúc cơ bản

```html
<ui-image-comparison ui-default-percent="50" ui-animate>
  <ui-image-comparison-before>
    <img src="before.jpg" alt="Ảnh trước khi chỉnh sửa" />
    <ui-image-comparison-label>Before</ui-image-comparison-label>
  </ui-image-comparison-before>

  <ui-image-comparison-after>
    <img src="after.jpg" alt="Ảnh sau khi chỉnh sửa" />
    <ui-image-comparison-label>After</ui-image-comparison-label>
  </ui-image-comparison-after>

  <ui-image-comparison-handle>
    <ui-image-comparison-handle-icon>
      <svg width="40" height="40" viewBox="0 0 50 50" aria-hidden="true">
        <path d="m18 17-8 8 8 8m14-16 8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" />
      </svg>
    </ui-image-comparison-handle-icon>
  </ui-image-comparison-handle>
</ui-image-comparison>
```

| Element | Vai trò | Bắt buộc |
|---|---|---|
| `ui-image-comparison` | Container, xử lý pointer và bàn phím. | Có |
| `ui-image-comparison-before` | Lớp ảnh dưới. | Có |
| `ui-image-comparison-after` | Lớp ảnh được hé lộ. | Có |
| `ui-image-comparison-handle` | Vạch chia và vùng hiển thị nút kéo. | Có |
| `ui-image-comparison-handle-icon` | Icon tùy chỉnh trong nút kéo. Nếu bỏ, component hiển thị `↔`. | Không |
| `ui-image-comparison-label` | Nhãn Before/After ở góc ảnh. | Không |

Hai ảnh nên có cùng tỉ lệ, cùng góc chụp và thẳng hàng. Component mặc định có `aspect-ratio: 16 / 9`; ảnh dùng `object-fit: cover`. Có thể đổi tỉ lệ hoặc chiều cao bằng CSS:

```css
ui-image-comparison {
  --ui-image-comparison-aspect-ratio: 4 / 3;
  /* hoặc --ui-image-comparison-height: 420px; */
}
```

## Tương tác

- Kéo thanh chia hoặc kéo ở bất kỳ vị trí nào trên ảnh bằng chuột và ngón tay.
- Click vào một vị trí để chuyển thanh chia tới đó.
- Focus component và dùng `←` / `→` để thay đổi 5%; giữ Shift để thay đổi 10%. `Home` về 0%, `End` tới 100%.
- Giá trị luôn được giới hạn trong khoảng 0–100. Khi tương tác, `ui-value`, `aria-valuenow`, `--ui-value` và vị trí vạch chia được cập nhật cùng nhau.

## Thuộc tính và CSS variable

| Attribute | Kiểu | Mặc định | Tác dụng |
|---|---|---|---|
| `ui-default-percent` | number | `50` | Vị trí ban đầu của thanh chia (0–100). |
| `ui-value` | number | Giá trị ban đầu | Vị trí hiện tại; có thể cập nhật từ JavaScript và tự thay đổi khi tương tác. |
| `ui-animate` | boolean | `false` | Bắt đầu từ 0% rồi chạy spring tới giá trị hiện tại khi component vào viewport. |
| `ui-observed` | string | — | Đổi giá trị để đặt lại thanh chia theo `ui-default-percent` và chạy lại animation nếu được bật. |

| CSS variable | Mặc định | Tác dụng |
|---|---|---|
| `--ui-value` | `50` | Giá trị thanh chia dạng số từ 0 đến 100. |
| `--ui-image-comparison-position` | `50%` | Giá trị phần trăm dùng cho vùng ảnh after và vị trí handle. |
| `--ui-image-comparison-aspect-ratio` | `16 / 9` | Tỉ lệ khung ảnh. |
| `--ui-image-comparison-height` | `auto` | Chiều cao tùy chỉnh khi không muốn dùng tỉ lệ khung. |

`ui-animate` chỉ chạy một lần khi element đi vào viewport. Nếu người dùng kéo trong lúc animation đang chạy, thao tác kéo sẽ tiếp quản ngay. Khi thiết bị bật `prefers-reduced-motion: reduce`, thanh chia hiện ở giá trị hiện tại mà không chạy animation.

## JavaScript và sự kiện

```js
const comparison = document.querySelector('ui-image-comparison');
comparison.value = 70;

comparison.addEventListener('ui-image-comparison-change', (event) => {
  console.log(event.detail.value); // 0–100
});
```

Sự kiện `ui-image-comparison-change` được phát khi người dùng đổi giá trị bằng pointer hoặc bàn phím. Cập nhật `ui-value` từ code không phát sự kiện này.

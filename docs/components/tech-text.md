# Tech Text

`<ui-tech-text>` biến chữ thành đường viền nét đứt khi con trỏ đi qua từng ký tự. Khung chọn cho thấy ký tự đang tác động; bạn có thể kéo ký tự ra khỏi dòng rồi thả để nó trở về. Hiệu ứng lấy cảm hứng từ [Tech Text của React Bits](https://reactbits.dev/text-animations/tech-text), được viết lại thành Web Component không phụ thuộc React.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-tech-text ui-size="150" ui-reveal="letter" ui-sweep="true"
  style="--ui-tech-text-height:340px;--ui-tech-text-color:#fff;--ui-tech-text-accent:#a8eed2">
  UI Core
</ui-tech-text>
```

Đặt chiều rộng cho container; chữ tự thu nhỏ để vừa khung. Nội dung ban đầu là text bên trong element. Dùng `ui-text="..."` để thay chữ khi chạy, hoặc gọi `refresh()` sau khi đổi font của trang. Nên dùng từ hoặc cụm từ ngắn.

## Tùy chỉnh

| Thuộc tính | Mặc định | Ý nghĩa |
|---|---:|---|
| `ui-text` | text trong element | Chữ cần vẽ. |
| `ui-font-family` | kế thừa | Font dùng cho canvas; font cần được tải sẵn trên trang. |
| `ui-size` | `150` | Cỡ chữ tối đa, px. |
| `ui-weight` | `600` | Độ đậm font. |
| `ui-letter-spacing` | `-0.05` | Khoảng cách giữa ký tự, em. |
| `ui-align` | `center` | `left`, `center`, `right`. |
| `ui-reveal` | `letter` | `letter`, `area`, `off`. |
| `ui-reach` | `200` | Bán kính ảnh hưởng khi dùng `area`, px. |
| `ui-softness` | `0.7` | Độ chuyển mềm của vùng ảnh hưởng, từ 0 đến 1. |
| `ui-line-style` | `dashed` | `dashed` hoặc `solid`. |
| `ui-dash-length`, `ui-dash-gap` | `4`, `2` | Chiều dài nét và khoảng trống, px. |
| `ui-stroke-width` | `1.5` | Độ dày viền, px. |
| `ui-sweep`, `ui-speed` | `true`, `1` | Quét ký tự khi con trỏ ở ngoài và tốc độ quét. |
| `ui-selection`, `ui-labels`, `ui-specks` | `true`, `true`, `15` | Khung chọn, nhãn kích thước, hạt trang trí. |
| `ui-draggable` | `true` | Cho kéo ký tự bằng chuột hoặc cảm ứng. |
| `ui-bounce`, `ui-click-kick` | `0.4`, `true` | Độ nảy khi thả và xung lực khi bấm nhanh vào ký tự. |
| `ui-guides` | `false` | Hiện đường cap height và baseline. |
| `ui-intro`, `ui-intro-duration` | `none`, `2` | Mở đầu bằng `none`, `type`, `assemble` hoặc `metrics`; thời lượng tính bằng giây. |

Boolean có thể đặt thành `"false"` để tắt. Màu và chiều cao dùng CSS variables `--ui-tech-text-color`, `--ui-tech-text-accent`, `--ui-tech-text-height`. Nếu không đặt màu, component kế thừa `color` của trang.

## JavaScript và sự kiện

```js
const wordmark = document.querySelector('ui-tech-text');
wordmark.setAttribute('ui-text', 'HELLO');
wordmark.replay();
wordmark.addEventListener('ui:tech-text:release', (event) => {
  console.log(event.detail); // { index, char, x, y }
});
```

`refresh()` đo lại font, kích thước và tạo lại viền. `replay()` đưa các ký tự về vị trí đầu và bắt đầu lại lượt quét. Khi chọn bằng bàn phím, `ui:tech-text:select` phát `{ index, char }`.

## Truy cập và hiệu năng

Chữ gốc vẫn nằm trong DOM cho trình đọc màn hình; canvas chỉ là hình trang trí. Tab vào element, dùng Left/Right để chuyển ký tự, Home/End để tới đầu/cuối và Escape để bỏ chọn. Ký tự được chọn được thông báo qua vùng `role="status"`. `prefers-reduced-motion` tắt lượt quét và chuyển trạng thái ngay. Canvas dừng vẽ khi element ra khỏi viewport, tab bị ẩn hoặc element bị tháo khỏi DOM. Độ phân giải canvas được giới hạn ở DPR 2 để tránh tăng chi phí vẽ quá mức.

Hiệu ứng dùng Canvas 2D, `ResizeObserver` và `IntersectionObserver` khi trình duyệt hỗ trợ. Khi canvas không khả dụng, chữ nguồn vẫn hiển thị.

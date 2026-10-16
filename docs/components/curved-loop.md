# Curved Loop

`<ui-curved-loop>` làm chữ chạy liên tục trên đường cong SVG. Có bốn hình dạng: `arc`, `wave`, `circle` và `line`. Demo cung cấp bốn preset Arc, Wave, Circle, Outline và các control để tùy chỉnh riêng từng thuộc tính. Ý tưởng dựa trên [Curved Loop của React Bits](https://reactbits.dev/text-animations/curved-loop); phần triển khai là Web Component thuần, không cần React.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-curved-loop
  ui-shape="wave"
  ui-text="RIDE THE WAVE"
  ui-separator="—"
  ui-direction="right"
  ui-speed="1.5"
  ui-curve="360"
  style="--ui-curved-loop-height:360px;--ui-curved-loop-color:#fff"
>RIDE THE WAVE</ui-curved-loop>
```

## API

| Thuộc tính | Mặc định | Ý nghĩa |
|---|---:|---|
| `ui-text` | chữ trong element | Cụm chữ lặp trên đường đi. |
| `ui-shape` | `arc` | `arc`, `wave`, `circle`, `line`; giá trị khác dùng `arc`. |
| `ui-separator` | rỗng | Ký hiệu giữa các lần lặp, ví dụ `✦`, `—`, `•`, `/`. |
| `ui-direction` | `left` | `left` hoặc `right`. |
| `ui-speed` | `2` | Tốc độ tự chạy, từ 0 đến 10; `0` đứng yên. |
| `ui-scroll-boost` | `0` | Độ tăng tốc tạm thời khi cuộn trang, từ 0 đến 10. |
| `ui-curve` | `400` | Độ cong của arc hoặc biên độ wave tại chiều rộng 1440px. Giá trị âm đổi chiều cong. |
| `ui-size` | `96` | Cỡ chữ tại chiều rộng 1440px, từ 12 đến 240px. Circle giảm cỡ chữ thêm để các ký tự không chồng lên nhau. |
| `ui-weight` | `700` | Độ đậm chữ, từ 100 đến 900. |
| `ui-letter-spacing` | `0` | Khoảng cách chữ tại chiều rộng 1440px, từ -20 đến 40px. |
| `ui-edge-fade` | `0` | Mờ dần ở hai cạnh, từ 0 đến 1; không áp dụng cho circle. |
| `ui-outline` | `false` | Chỉ vẽ viền chữ; separator vẫn tô đặc. |
| `ui-interactive` | `true` | Cho kéo chữ bằng chuột hoặc cảm ứng. |
| `ui-pause-on-hover` | `false` | Dừng chuyển động tự động khi rê chuột vào. |

Boolean có thể đặt thành `"false"` để tắt. Dùng CSS variables `--ui-curved-loop-height`, `--ui-curved-loop-color` và `--ui-curved-loop-separator-color` để đổi kích thước và màu. Nếu không đặt màu, component kế thừa `color` từ trang.

`refresh()` đo lại đường đi và độ dài chữ sau khi bạn đổi font bên ngoài component. `pause()` dừng tự chạy; `play()` tiếp tục. Có thể thay các thuộc tính trong lúc component đang chạy.

## Truy cập và hiệu năng

Chữ gốc nằm trong DOM cho trình đọc màn hình; SVG lặp lại được đánh dấu trang trí. Tab vào component rồi dùng phím Trái/Phải để dịch chữ. `prefers-reduced-motion` dừng chuyển động tự chạy, nhưng chữ vẫn hiện. Component ngừng animation khi ra khỏi màn hình, tab bị ẩn hoặc element bị tháo khỏi DOM. Kích thước chữ và đường đi được đo lại khi container thay đổi.

SVG text paths cần trình duyệt hiện đại hỗ trợ `textPath`, `ResizeObserver` và `PointerEvent`. Nếu không dựng được SVG, chữ gốc vẫn có trong DOM.

# Animated Background

`<ui-animated-background>` là vùng nền trang trí. `<ui-background>` vẫn được hỗ trợ như alias cũ để các trang hiện có tiếp tục hoạt động. Style đầu tiên, `particle-morph`, gom các hạt thành hình SVG hoặc chữ, tự chuyển sang hình tiếp theo và tạo dòng xoáy nhẹ quanh con trỏ. Component dùng cách đặt tên `ui-*` của thư viện; các thuộc tính trong mẫu `xo-particle-morph-bg` tương ứng với `ui-*` dưới đây.

## Cài đặt

Import component **và** CSS trước khi dùng; CSS đặt canvas phủ kín vùng chứa.

```js
import '@ui/components';
import '@ui/components/css';
```

## SVG paths

```html
<section class="scene">
  <ui-animated-background
    ui-style="particle-morph"
    ui-svg-paths='["M 50,10 L 61,40 L 95,40 L 68,60 L 79,90 L 50,70 L 21,90 L 32,60 L 5,40 L 39,40 Z","M 50,10 A 40,40 0 1,1 49.9,10 Z"]'
    ui-colors='["#ffffff","#ffeb3b"]'
    ui-particle-count="2000"
    ui-turbulence="1"
    ui-pull-strength="0.5"
    ui-influence-radius="200"
    ui-morph-duration="3"
    ui-mouse-container=".scene">
  </ui-animated-background>
  <h2>Your content</h2>
</section>
```

```css
.scene { position: relative; min-height: 480px; overflow: hidden; background: #101622; }
.scene > h2 { position: relative; }
```

Mặc định path được hiểu trong hệ toạ độ `0 0 100 100`. Dùng `ui-view-box="0 0 500 500"` nếu dữ liệu SVG có hệ toạ độ khác. Chỉ vùng **bên trong path kín** được lấy mẫu để tạo hạt.

## Text

```html
<section class="scene">
  <ui-animated-background
    ui-style="particle-morph"
    ui-texts='["Hello","World"]'
    ui-colors='["#ffffff","#8ae6ee"]'
    ui-font-size="240"
    ui-max-width="700"
    ui-particle-count="2000">
  </ui-animated-background>
</section>
```

`ui-texts` được ưu tiên khi có cả text và SVG. Chữ tự thu nhỏ để vừa chiều cao nền và `ui-max-width`. Dùng JSON chuẩn trong HTML; cú pháp mảng dùng dấu nháy đơn trước đây vẫn được chấp nhận.

## JavaScript API

```js
const background = document.querySelector('ui-animated-background');
background.texts = ["Designer's notes", 'MOTION'];
background.svgPaths = ['M 0,0 H 100 V 100 H 0 Z'];
background.colors = ['#ffffff', '#ffeb3b'];
console.log(background.hasShapes); // false nếu không có vùng tô nào được lấy mẫu
background.refresh(); // lấy mẫu lại và phát lại intro sau khi font nguồn thay đổi
```

`texts`, `svgPaths` và `colors` là các property `string[]`. Gán **mảng mới** để cập nhật; mỗi lần gán được phản chiếu sang attribute JSON tương ứng nên markup cũ vẫn hoạt động. `texts = []` chuyển về chế độ SVG. `hasShapes` chỉ đọc; nó cho biết path/text hiện tại có tạo được hạt hay không. Mảng màu rỗng dùng palette mặc định.

## Thuộc tính

| Thuộc tính | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `ui-style` | `particle-morph` | Style nền hiện được hỗ trợ; giá trị khác dừng animation. |
| `ui-svg-paths` | star, circle, heart | Mảng JSON các SVG path kín. |
| `ui-texts` | rỗng | Mảng JSON các từ; ưu tiên hơn SVG. |
| `ui-colors` | `['#ffffff','#ffeb3b']` | Mảng JSON các màu hạt. |
| `ui-particle-count` | `2000` | Số hạt, giới hạn 50–6000. |
| `ui-view-box` | `0 0 100 100` | Hệ toạ độ của SVG path. |
| `ui-font-size` | `160` | Cỡ chữ mong muốn, pixel. |
| `ui-font-family` | font kế thừa | Font để lấy mẫu chữ. |
| `ui-max-width` | chiều rộng nền | Chiều rộng chữ tối đa, pixel. |
| `ui-turbulence` | `1` | Mức chuyển động nhẹ và độ xoáy, 0–2. |
| `ui-pull-strength` | `0.5` | Lực kéo hạt trở lại hình, 0–2. |
| `ui-flow-speed` | `0.5` | Tốc độ chuyển động nền, 0–3. |
| `ui-influence-radius` | `200` | Bán kính ảnh hưởng của con trỏ, pixel. |
| `ui-morph-duration` | `3` | Thời gian chuyển hình, giây. |
| `ui-mouse-container` | phần tử cha | Selector vùng nhận chuyển động chuột. |

Đổi `ui-texts`, `ui-svg-paths`, `ui-view-box`, font hoặc số hạt sẽ lấy mẫu lại và phát lại intro. Đổi màu chỉ tô lại hạt hiện có; các tham số chuyển động cập nhật mà không tạo lại hạt. `ui-mouse-container` chỉ đổi vùng bắt sự kiện. Resize được gộp theo frame và giữ tiến trình animation; gọi `refresh()` nếu font tải xong hoặc nội dung nguồn thay đổi mà kích thước không đổi.

Canvas chỉ mang tính trang trí, có `aria-hidden` và không chặn tương tác. Animation dừng khi nền ra khỏi màn hình hoặc tab bị ẩn. Khi `prefers-reduced-motion` bật, kể cả lúc trang đang mở, component hiển thị một hình tĩnh và dừng vòng lặp; khi tắt, animation chạy lại. Pointer cảm ứng không tạo xoáy, nhưng hình vẫn hiển thị.

Đây là hiệu ứng canvas chạy liên tục: tăng `ui-particle-count` đến 6000 có thể tốn CPU/GPU trên điện thoại. Thử ở kích thước mục tiêu và giảm số hạt khi cần. Component nhắm đến các bản Chrome, Edge, Firefox và Safari hiện đại theo `CORE_ARCHITECTURE.md`; `Path2D`, Canvas 2D và các observer của trình duyệt cần có để hiệu ứng hiển thị đầy đủ.

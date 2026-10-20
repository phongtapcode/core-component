# Flex Carousel

`<ui-flex-carousel>` hiển thị một dải ảnh cuộn vô hạn. Vùng thấu kính làm cong mép ảnh; kéo, cuộn chuột hoặc phím mũi tên để chuyển ảnh. Nhấp ảnh hoặc nhấn Enter để phóng ảnh đang chọn.

## Cài đặt và sử dụng

Import `@ui/components` cùng `@ui/components/css`, rồi thêm các item trực tiếp vào carousel:

```html
<ui-flex-carousel ui-preset="liquid" ui-intro="rise" aria-label="Studio work"
  style="--ui-flex-carousel-height:520px">
  <ui-flex-carousel-item ui-title="Iridescence" ui-subtitle="Form study">
    <img src="/images/flex-1.jpg" alt="Iridescent chrome head sculpture">
  </ui-flex-carousel-item>
  <ui-flex-carousel-item ui-title="White Room" ui-subtitle="Portrait">
    <img src="/images/flex-2.jpg" alt="Person against a white backdrop">
  </ui-flex-carousel-item>
</ui-flex-carousel>
```

Ảnh cần có `src` hợp lệ và nên cùng origin với trang. Component lấy tỷ lệ tự nhiên của ảnh khi `ui-fit="natural"`; trước khi ảnh tải xong, nó dùng khung màu tạm. Nên cung cấp tối thiểu ba item để vòng lặp nhìn tự nhiên. Demo tương tác có trong `/html/#/ui-flex-carousel`.

## API

| Thuộc tính | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `ui-preset` | `liquid` | `liquid`, `ribbon`, `vortex`, `arch`. Giá trị không hợp lệ về `liquid`. |
| `ui-intro` | `rise` | `rise`, `bloom`, `spin`, `deal`, `none`. Giá trị không hợp lệ về `rise`. |
| `ui-fit` | `natural` | `natural`, `portrait`, `square`, `landscape`. |
| `ui-card-height` | `0.5` | Chiều cao card theo tỷ lệ chiều cao carousel, giới hạn `0.15–0.9`. |
| `ui-gap` / `ui-radius` | `12` / `0` | Khoảng cách và bán kính góc, pixel. |
| `ui-lens-width` / `ui-lens-height` | Theo preset | Kích thước thấu kính theo tỷ lệ chiều rộng carousel. |
| `ui-flat-width` | `0.22` | Chiều rộng dải ảnh không méo ở giữa, theo tỷ lệ chiều rộng carousel (`0.1–0.7`). Dải này luôn đủ rộng cho card đang ở tâm. |
| `ui-tilt` | Theo preset | Góc xoay thấu kính, độ. |
| `ui-bend` / `ui-reach` / `ui-roundness` / `ui-dispersion` | Theo preset | Độ cong, phạm vi, dáng góc và tách màu; mỗi giá trị `0–1`. |
| `ui-curl` | Theo preset | `twist`, `rise` hoặc `fall`. |
| `ui-follow-cursor` | Tắt | Có thuộc tính để tâm thấu kính đi theo con trỏ. |
| `ui-autoplay` / `ui-interval` | Tắt / `4` | Tự động tiến và khoảng cách giữa hai lần tiến (giây, `1–30`). |
| `ui-focus-on-click` / `ui-captions` / `ui-capture-wheel` | `true` | Đặt `false` để tắt từng hành vi. |
| `ui-title` / `ui-subtitle` trên item | `alt` / rỗng | Nội dung caption. |

Có thể đặt các thuộc tính số trực tiếp từ JavaScript bằng `setAttribute`. Các giá trị số không hợp lệ trở về mặc định; giá trị ngoài miền được giới hạn.

### Thuộc tính và phương thức JavaScript

`preset`, `fit`, `intro`, `autoplay` và `focusOnClick` có getter/setter. `index` và `length` chỉ đọc. Gọi `next()`, `previous()`, `goTo(index)`, `open()`, `close()`, `replay()` hoặc `refresh()` khi cần. `refresh()` đọc lại danh sách ảnh/caption sau khi thay đổi DOM; việc thêm hoặc xóa item trực tiếp cũng được theo dõi tự động.

### Sự kiện

- `ui:flex-carousel:change` — `detail: { index, item }` khi ảnh ở tâm đổi.
- `ui:flex-carousel:select` — `detail: { index, item }` khi ảnh được mở.

Chỉ số bắt đầu từ `0`; `item` là phần tử `ui-flex-carousel-item` gốc. Cả hai sự kiện nổi bọt.

### CSS

- `--ui-flex-carousel-height`: chiều cao, mặc định `520px`.
- `--ui-flex-carousel-caption-color`: màu caption, mặc định `currentColor`.
- `--ui-flex-carousel-focus`: màu viền focus, mặc định `#a5caff`.

## Tương tác và khả năng truy cập

Kéo ngang bằng chuột hoặc ngón tay; cuộn chuột trên vùng carousel để chuyển ảnh. Nếu cần để trang nhận wheel, đặt `ui-capture-wheel="false"`. Focus carousel rồi nhấn `←`/`→` để chuyển ảnh, `Enter`/`Space` để mở hoặc đóng, `Escape` để đóng. Canvas chỉ là lớp trình bày; ảnh gốc và alt text vẫn ở trong DOM, caption hiện tại được thông báo qua `aria-live`.

Khi bật `prefers-reduced-motion` hoặc trình duyệt không hỗ trợ WebGL2, component hiện dải ảnh cuộn ngang bằng CSS, không chạy shader. Component tự đo kích thước vùng chứa, giới hạn mật độ pixel canvas, dừng animation khi ra ngoài viewport hoặc tab bị ẩn, và dọn listener/observer/GL resource khi bị tháo khỏi DOM. Hỗ trợ Chrome, Edge, Firefox và Safari phiên bản hiện hành có WebGL2.

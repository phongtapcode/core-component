# Marquee (`<ui-marquee>`)

Enterprise-grade, gapless infinite looping marquee web component. Supports bidirectional horizontal and vertical movement, hover pausing, scroll parallax acceleration, and framework-agnostic native custom elements.

---

## 1. Quick Start

```html
<ui-marquee speed="6" pause-on-hover="true">
  <figure><img src="coast.jpg" alt="Coast" /><figcaption>The quiet coast</figcaption></figure>
  <figure><img src="architecture.jpg" alt="Architecture" /><figcaption>Lines and light</figcaption></figure>
  <figure><img src="botanical.jpg" alt="Botanical garden" /><figcaption>A greener hour</figcaption></figure>
</ui-marquee>
```

---

## 2. HTML Attributes Reference

| Attribute | Alias / UI Prefix | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `speed` | `ui-speed` | `number` | `6` | Tốc độ chạy tự động (**cao = nhanh**). Thời gian được tính toán tự động dựa trên chiều rộng nội dung. |
| `direction` | `ui-direction` | `'ltr' \| 'rtl' \| 'ttb' \| 'btt'` | `document.dir` | Chiều chạy. Mặc định theo hướng văn bản (`ltr` / `rtl`), hoặc `btt` khi chạy dọc (`vertical`). |
| `pause-on-hover` | `ui-pause-on-hover` | `boolean` | `false` | Tạm dừng chạy khi người dùng rê chuột vào marquee. |
| `auto-run` | `ui-auto-run` | `boolean` | `true` | Tự động chạy CSS animation ngay khi khởi tạo. |
| `scroll-enabled` | `ui-scroll-enabled` | `boolean` | `false` | Bật hiệu ứng parallax: cuộn trang sẽ đẩy marquee di chuyển nhanh/chậm tương ứng. |
| `scroll-speed` | `ui-scroll-speed` | `number` | `1` | Hệ số nhân tốc độ scroll parallax (khi bật `scroll-enabled`). |
| `vertical` | `ui-vertical` | `boolean` | `false` | Bật chế độ chạy theo chiều dọc. |
| `observed` | `ui-observed` | `string` | `—` | Thay đổi giá trị để dựng lại clones và đo đạc lại kích thước (phục vụ CMS / visual design mode). |

---

## 3. Direction Modes

| Direction | Orientation | Mô tả |
| :--- | :--- | :--- |
| `rtl` | Ngang | Chạy từ phải sang trái (Mặc định ltr document) |
| `ltr` | Ngang | Chạy từ trái sang phải |
| `btt` | Dọc | Chạy từ dưới lên trên (Bottom to Top) |
| `ttb` | Dọc | Chạy từ trên xuống dưới (Top to Bottom) |

---

## 4. Key Behaviors & Architecture

### Gapless Auto-Cloning
Khi nội dung ngắn hơn kích thước màn hình hoặc viewport, component tự động tính toán kích thước container và nhân bản số lượng content groups chẵn ($\ge 2$) với `aria-hidden="true"` để đảm bảo:
- Không bao giờ bị khoảng trống (gapless).
- Chu kỳ lặp lại dịch chuyển đúng $50\%$ track hoàn toàn mượt mà, không giật khung hình.

### Speed Formula ("Cao = Nhanh")
Tốc độ di chuyển thực tế trên màn hình:
$$\text{px/second} = \text{speed} \times 16$$
$$\text{duration (s)} = \frac{\text{trackDistance}}{\text{speed} \times 16}$$
- `speed = 3`: ~48 px/s (chậm, thư thái)
- `speed = 6` (mặc định): ~96 px/s (chuẩn)
- `speed = 12`: ~192 px/s (nhanh)

### Scroll Parallax Scrubbing
Khi bật `scroll-enabled="true"`:
Component lắng nghe sự kiện scroll với `requestAnimationFrame` và tính toán delta cuộn trang để truyền vào biến CSS `--ui-marquee-scroll-offset`, tạo cảm giác tương tác mượt mà khi người dùng cuộn chuột.

---

## 5. JavaScript API

```typescript
const marquee = document.querySelector('ui-marquee');

// Methods
marquee.play();    // Tiếp tục chạy animation
marquee.pause();   // Tạm dừng animation
marquee.toggle();  // Đảo trạng thái chạy / dừng
marquee.refresh(); // Đo đạc lại kích thước và rebuild clones

// Properties
marquee.isRunning;          // boolean
marquee.isVertical;         // boolean
marquee.effectiveSpeed;     // number
marquee.effectiveDirection; // 'ltr' | 'rtl' | 'ttb' | 'btt'
```

### Events
| Event | Detail | Mô tả |
| :--- | :--- | :--- |
| `ui-marquee:init` | `{ id: string }` | Được kích hoạt sau khi marquee khởi tạo DOM xong. |
| `ui-marquee:play` | `{ id: string }` | Được kích hoạt khi marquee tiếp tục chạy. |
| `ui-marquee:pause` | `{ id: string }` | Được kích hoạt khi marquee tạm dừng. |
| `ui-marquee:destroy` | `{ id: string }` | Được kích hoạt khi component bị remove khỏi DOM. |

---

## 6. Examples

### Vertical Marquee (Chạy dọc từ dưới lên)
```html
<ui-marquee vertical="true" direction="btt" speed="5" style="height: 240px;">
  <div class="py-2 border-b">Tin nóng 1: Ra mắt bản cập nhật UI Core</div>
  <div class="py-2 border-b">Tin nóng 2: Hỗ trợ 7 hiệu ứng Carousel 3D</div>
  <div class="py-2 border-b">Tin nóng 3: Tối ưu hiệu năng 120 FPS</div>
</ui-marquee>
```

### Scroll Parallax Marquee
```html
<ui-marquee scroll-enabled="true" scroll-speed="1.8" speed="8">
  <span class="text-3xl font-black uppercase tracking-wider mx-4">
    PARALLAX SCROLL INTERACTION • SPEED MULTIPLIER • ULTRA SMOOTH •
  </span>
</ui-marquee>
```

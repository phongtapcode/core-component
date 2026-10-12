# Scroll Y

`ui-scroll-y` tạo chuỗi panel toàn màn hình khi người dùng cuộn dọc. Panel đầu hiển thị sẵn; mỗi panel tiếp theo trượt từ `top: 100%` lên `top: 0%` và phủ lên panel trước. Vùng hiển thị dùng sticky positioning trong shadow DOM.

Dùng cho storytelling hoặc showcase nhiều cảnh. Với danh sách dọc thông thường, dùng CSS layout.

```js
import '@ui/motion';
import '@ui/motion/css';
```

## Cấu trúc cơ bản

```html
<ui-scroll-y>
  <ui-scroll-y-item>
    <div class="panel panel-1">Section 1</div>
  </ui-scroll-y-item>
  <ui-scroll-y-item>
    <div class="panel panel-2">Section 2</div>
  </ui-scroll-y-item>
  <ui-scroll-y-item>
    <div class="panel panel-3">Section 3</div>
  </ui-scroll-y-item>
</ui-scroll-y>
```

| Element | Vai trò | Tạo bởi |
|---|---|---|
| `ui-scroll-y` | Tính số panel, chiều cao container và tiến trình cuộn. | Bạn |
| `ui-scroll-y-inner` | Wrapper sticky chứa slot trong shadow DOM. | Component tự tạo |
| `ui-scroll-y-item` | Panel trượt lên từ dưới. | Bạn |
| `ui-scroll-xy-item` | Panel thay thế, dùng được trong cả Scroll X và Scroll Y. | Bạn, tùy chọn |

Các item phải là **con trực tiếp** của container. Chiều cao mặc định của `ui-scroll-y` là `N × 110vh`, với `N` là số item. Bạn có thể ghi đè CSS `height` để đổi độ dài trải nghiệm. Nội dung của item nên có chiều cao `100%` và ảnh nên dùng `object-fit: cover`.

## Ví dụ với ảnh

```html
<ui-scroll-y class="photo-sequence">
  <ui-scroll-y-item>
    <article class="photo-panel">
      <img src="/images/coast.jpg" alt="Bờ biển" />
      <h2>Discover the coast</h2>
    </article>
  </ui-scroll-y-item>
  <ui-scroll-y-item>
    <article class="photo-panel">
      <img src="/images/architecture.jpg" alt="Kiến trúc" />
      <h2>Explore the space</h2>
    </article>
  </ui-scroll-y-item>
</ui-scroll-y>
```

```css
.photo-sequence { --ui-scroll-y-background: #10263c; }
.photo-panel { position: relative; height: 100vh; display: grid; place-items: center; overflow: hidden; color: white; }
.photo-panel img { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; object-fit: cover; }
.photo-panel h2 { font-size: clamp(3rem, 8vw, 8rem); text-shadow: 0 4px 30px #0008; }
```

Gallery có hai demo: **Photo panels** và **Parallax layers**.

## Mốc cuộn và quán tính

**Các panel chỉ bắt đầu trượt khi cạnh trên `ui-scroll-y` chạm đỉnh viewport.** Trước đó panel đầu hiển thị toàn bộ và các panel sau nằm dưới vùng sticky. Chuyển động kết thúc khi cạnh dưới container chạm đáy viewport. Với `N` panel, `N - 1` panel sau chia nhau quãng cuộn sticky. Cuộn ngược sẽ đưa chúng trở xuống.

Hiệu ứng có quán tính theo từng frame với `ui-lerp-ease="0.12"`. Tăng giá trị để bám sát scroll hơn, giảm để trượt chậm hơn; `ui-lerp-ease="1"` bỏ quán tính. `panelProgress` là tiến trình **đã được làm mượt** từ 0 đến 1.

```js
const story = document.querySelector('ui-scroll-y');
console.log(story.panelProgress);
story.refresh(); // Tính lại ngay sau khi nội dung hoặc layout đổi.
```

Component tự theo dõi item được thêm/xóa trực tiếp và thay đổi kích thước viewport. `refresh()` cũng cập nhật các `ui-parallax-scroll` nằm trong container.

| Attribute / CSS variable | Mặc định | Tác dụng |
|---|---|---|
| `ui-lerp-ease` | `0.12` | Hệ số quán tính 0–1 của panel. |
| `ui-parallax` | Tắt | Cho phép dùng `ui-parallax-scroll` và `ui-parallax-hover` bên trong Scroll Y. |
| `--ui-scroll-y-background` | `transparent` | Nền phía sau khi panel mới trượt vào. |
| `--ui-scroll-y-count` | Số item | Dùng tính chiều cao `N × 110vh`; component tự đặt. |

`ui-scroll-y-inner` ở trong shadow DOM. Có thể style wrapper qua `ui-scroll-y::part(inner)`; item và nội dung vẫn ở light DOM.

## Kết hợp với Parallax

Thêm `ui-parallax` trên container để các `ui-parallax-scroll` lồng bên trong nhận `ui-scroll-y` làm vùng đo. Hiệu ứng trượt panel và transform của nội dung chạy trên các element khác nhau nên có thể kết hợp.

```html
<ui-scroll-y ui-parallax>
  <ui-scroll-y-item>
    <ui-parallax-scroll
      ui-fit-content="false"
      ui-start="offset"
      ui-end="offset + container.offsetHeight - window.innerHeight"
      ui-keyframes="{
        '0%': {scale: 1, borderRadius: 0},
        '50%': {scale: 0.95, borderRadius: 40},
        '100%': {scale: 0.95, borderRadius: 40}
      }"
    >
      <img style="width: 100%; height: 100%; object-fit: cover" src="/images/coast.jpg" alt="Bờ biển" />
    </ui-parallax-scroll>
  </ui-scroll-y-item>
  <ui-scroll-y-item>
    <div class="panel">Scene 2</div>
  </ui-scroll-y-item>
</ui-scroll-y>
```

`ui-start` và `ui-end` trong ví dụ map 0%–100% của parallax vào đúng quãng sticky. Nếu bỏ hai attribute này, parallax dùng tiến trình riêng từ lúc container đi vào đáy viewport tới khi đi ra khỏi đỉnh viewport. Xem [Parallax](./parallax.md) để biết các thuộc tính keyframe và breakpoints.

## Truy cập và reduced motion

Panel khuất được đặt `inert` để tab không đi vào nội dung không nhìn thấy. Trạng thái `inert` và `top` inline ban đầu được khôi phục khi component bị tháo khỏi DOM.

Khi bật `prefers-reduced-motion: reduce`, các panel chuyển thành danh sách dọc bình thường, không còn hiệu ứng trượt hoặc parallax; toàn bộ nội dung đều hiển thị.

# Scroll X

`ui-scroll-x` biến cuộn dọc thành chuỗi panel toàn màn hình. Panel đầu hiển thị sẵn; mỗi panel tiếp theo mở rộng chiều rộng từ 0% đến 100%, phủ lên panel trước. Vùng hiển thị được giữ bằng `position: sticky` trong lúc section đi qua viewport.

Dùng component này cho storytelling, portfolio hoặc showcase nhiều cảnh. Với danh sách cần kéo ngang trực tiếp, dùng `ui-carousel`.

```js
import '@ui/motion';
import '@ui/motion/css';
```

## Cấu trúc

```html
<ui-scroll-x>
  <ui-scroll-x-item>
    <div class="panel panel-1">Section 1</div>
  </ui-scroll-x-item>
  <ui-scroll-x-item>
    <div class="panel panel-2">Section 2</div>
  </ui-scroll-x-item>
  <ui-scroll-x-item>
    <div class="panel panel-3">Section 3</div>
  </ui-scroll-x-item>
</ui-scroll-x>
```

| Element | Vai trò | Tạo bởi |
|---|---|---|
| `ui-scroll-x` | Container đo quãng cuộn và tính số panel. | Bạn |
| `ui-scroll-x-inner` | Vùng sticky trong shadow DOM, chứa slot của các panel. | Component tự tạo |
| `ui-scroll-x-item` | Panel mở theo chiều ngang. | Bạn |
| `ui-scroll-xy-item` | Panel thay thế có cùng hành vi trong Scroll X. | Bạn, tùy chọn |

Các item cần là **con trực tiếp** của `ui-scroll-x`. Nội dung của mỗi item là một element có kích thước cố định theo chiều rộng container, nên ảnh và chữ không bị co lại khi item đang mở. Component tự gán chiều cao `N × 110vh` với `N` là số item; bạn vẫn có thể ghi đè CSS `height` nếu muốn đổi thời lượng.

## Ví dụ với ảnh

```html
<ui-scroll-x class="photo-sequence">
  <ui-scroll-x-item>
    <article class="photo-panel">
      <img src="/images/coast.jpg" alt="Bờ biển" />
      <h2>Discover the coast</h2>
    </article>
  </ui-scroll-x-item>
  <ui-scroll-x-item>
    <article class="photo-panel">
      <img src="/images/architecture.jpg" alt="Kiến trúc" />
      <h2>Explore the space</h2>
    </article>
  </ui-scroll-x-item>
  <ui-scroll-x-item>
    <article class="photo-panel">
      <img src="/images/botanical.jpg" alt="Hoa và lá" />
      <h2>See the details</h2>
    </article>
  </ui-scroll-x-item>
</ui-scroll-x>
```

```css
.photo-sequence { --ui-scroll-x-background: #10263c; }
.photo-panel { position: relative; height: 100vh; display: grid; place-items: center; overflow: hidden; color: white; }
.photo-panel img { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; object-fit: cover; }
.photo-panel h2 { font-size: clamp(3rem, 8vw, 8rem); text-shadow: 0 4px 30px #0008; }
```

Gallery có hai demo dùng ảnh thật: **Photo story** và **Editorial panels**.

## Tiến trình cuộn

**Animation chỉ bắt đầu khi cạnh trên `ui-scroll-x` chạm đỉnh viewport.** Trước mốc này, panel đầu đã mở hoàn toàn và các panel sau có chiều rộng 0%. Animation kết thúc khi cạnh dưới container chạm đáy viewport, tức khi vùng sticky thôi bám. Với `N` panel, `N - 1` panel sau lần lượt mở trên toàn bộ quãng cuộn sticky. Khi cuộn ngược, chiều rộng giảm theo đúng thứ tự.

Chuyển động có quán tính: tiến trình hiển thị tiến dần tới vị trí scroll thực tế bằng nội suy theo từng frame. Mặc định hệ số `ui-lerp-ease="0.12"`; tăng lên để bám sát cuộn hơn (ít trễ), giảm xuống để trượt mượt hơn (trễ hơn). `ui-lerp-ease="1"` tắt quán tính. Quán tính vẫn chạy một đoạn ngắn sau khi người dùng ngừng cuộn để bắt kịp vị trí cuối.

`ui-scroll-x.progress` cho biết tiến trình 0–1. `ui-scroll-x.refresh()` đếm lại item và tính lại chiều rộng ngay lập tức. Component cũng tự theo dõi khi bạn thêm hoặc xóa item trực tiếp, và cập nhật khi viewport đổi kích thước.

| Attribute | Mặc định | Tác dụng |
|---|---|---|
| `ui-lerp-ease` | `0.12` | Hệ số quán tính trong khoảng 0–1. `1` bám sát scroll. |

```js
const story = document.querySelector('ui-scroll-x');
story.appendChild(document.createElement('ui-scroll-x-item'));
story.refresh();
```

| CSS variable | Mặc định | Tác dụng |
|---|---|---|
| `--ui-scroll-x-background` | `transparent` | Nền vùng sticky trước và giữa các lần mở panel. |
| `--ui-scroll-x-panel-width` | Chiều rộng container | Giữ nội dung panel rộng ổn định khi vỏ item đang mở. Component tự cập nhật khi resize. |
| `--ui-scroll-x-count` | Số item | Dùng trong phép tính chiều cao `N × 110vh`; component tự cập nhật. |

`ui-scroll-x-inner` nằm trong shadow DOM. Nếu cần style vùng sticky, dùng `ui-scroll-x::part(inner)`; các item và nội dung của chúng vẫn là light DOM nên có thể style bằng CSS thông thường.

## Truy cập và reduced motion

Chỉ panel đang mở là panel tương tác được; các panel khác được đặt `inert` để tab không đi vào nội dung khuất. Trạng thái `inert` và chiều rộng inline ban đầu của item được khôi phục khi component bị tháo khỏi DOM.

Khi người dùng bật `prefers-reduced-motion: reduce`, các panel hiển thị thành danh sách dọc bình thường, không bị ẩn bởi hiệu ứng mở rộng. Nội dung vẫn đọc và tương tác được.

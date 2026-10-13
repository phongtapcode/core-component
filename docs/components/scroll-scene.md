# Scroll Scene

`ui-scroll-scene` đổi nội dung trong một vùng sticky theo quãng cuộn dọc. Dùng cho story, giới thiệu tính năng hoặc chuỗi ảnh toàn màn hình. Với animation của một phần tử riêng lẻ, dùng `ui-animate` hoặc `ui-parallax-scroll`.

```js
import '@ui/motion';
import '@ui/motion/css';
```

## Cấu trúc

```html
<ui-scroll-scene ui-threshold="0.5" ui-mobile-disabled ui-mobile-breakpoint="768">
  <ui-scroll-scene-inner>
    <ui-scroll-scene-item><div class="scene">Scene 1</div></ui-scroll-scene-item>
    <ui-scroll-scene-item><div class="scene">Scene 2</div></ui-scroll-scene-item>
    <ui-scroll-scene-item><div class="scene">Scene 3</div></ui-scroll-scene-item>
  </ui-scroll-scene-inner>
</ui-scroll-scene>
```

`ui-scroll-scene-inner` và các `ui-scroll-scene-item` là **light DOM** và cần được viết trong HTML. Các item phải là con trực tiếp của inner. Component tự thêm một `ui-scroll-scene-item-focus` vào mỗi item để có thể dùng phím mũi tên, Home và End. Có thể cung cấp phần tử focus này thủ công nếu muốn tùy biến.

## Mốc chuyển cảnh

Scene đầu hiện trước khi section tới viewport. **Chỉ khi đỉnh section chạm đỉnh viewport, quãng cuộn cho các scene mới bắt đầu.** Mỗi scene tiếp theo được kích hoạt sau `ui-threshold × window.innerHeight` pixel. Mặc định là `0.5`, tức nửa chiều cao màn hình. Với 3 scene và viewport cao 1000px, các scene có mốc 0, 500 và 1000px tính từ đỉnh section. Chiều cao section tự động là `viewportHeight + sceneCount × step`, để scene cuối vẫn còn vùng cuộn trước khi trang tiếp tục. Cuộn ngược cũng đổi scene ngược lại.

| Attribute | Mặc định | Tác dụng |
|---|---:|---|
| `ui-threshold` | `0.5` | Phần chiều cao viewport cần cuộn giữa hai scene. Giá trị phải lớn hơn 0. |
| `ui-mobile-disabled` | tắt | Chuyển thành danh sách dọc trên mobile. |
| `ui-mobile-breakpoint` | `0` | Ngưỡng chiều rộng tính bằng px. Khi là 0, nhận diện mobile bằng coarse pointer. |

Số lượng item, chiều cao viewport hoặc các attribute trên đổi thì component tự tính lại. Gọi `element.refresh()` nếu bố cục thay đổi theo cách khác. CSS variable `--ui-scroll-scene-height` chứa chiều cao đã tính; có thể ghi đè `height` trong CSS nếu muốn kiểm soát thời lượng riêng.

## Demo ảnh và chữ

Gallery có thêm demo **Image with texts**: mỗi scene gồm ảnh nền và chữ; một khung chân dung duy nhất nằm cố định bên phải. Khi scene đổi, ảnh mới trượt từ dưới lên bên trong khung và trượt xuống khi cuộn ngược. Trên màn hình từ 992px trở xuống, `ui-mobile-disabled` cho các scene trở thành các section dọc thông thường. Cấu trúc tối thiểu:

```html
<ui-scroll-scene class="image-story" ui-mobile-disabled ui-mobile-breakpoint="992">
  <ui-scroll-scene-inner>
    <ui-scroll-scene-item>
      <article class="image-story-panel">
        <img class="image-story-background" src="background-1.jpg" alt="" />
        <div class="image-story-layout">
          <div><h2>Title 1</h2><p>Nội dung cảnh đầu tiên</p></div>
          <img class="mobile-portrait" src="portrait-1.jpg" alt="Mô tả ảnh chân dung" />
        </div>
      </article>
    </ui-scroll-scene-item>
    <!-- Thêm các scene khác cùng cấu trúc -->
    <div class="fixed-portrait" aria-hidden="true">
      <img src="portrait-1.jpg" alt="" />
      <img src="portrait-2.jpg" alt="" />
      <img src="portrait-3.jpg" alt="" />
    </div>
  </ui-scroll-scene-inner>
</ui-scroll-scene>
```

Khung chuyển ảnh dùng `aria-hidden` vì là hiệu ứng trang trí; nội dung chính nằm ở tiêu đề và đoạn văn. CSS đặt khung cố định trên các scene và dùng `clip-path` mở ảnh mới từ dưới lên như một đường chia before/after; bản mobile ẩn khung đó và hiện ảnh trong từng scene. CSS đầy đủ nằm trong demo gallery.

## Trạng thái và CSS

| Trạng thái | Vị trí | Ý nghĩa |
|---|---|---|
| `ui-active` | item | Scene đang hiển thị. |
| `ui-prev`, `ui-next` | item | Scene ngay trước và ngay sau scene hiện tại. |
| `ui-direction="up\|down"` | root | Hướng cuộn gần nhất. |
| `ui-ready="true"` | root | Đã khởi tạo xong. |

```css
.scene { height: 100vh; display: grid; place-items: center; }
ui-scroll-scene-item .scene h2 { opacity: 0; transform: translateY(2rem); transition: opacity .5s, transform .5s; }
ui-scroll-scene-item[ui-active] .scene h2 { opacity: 1; transform: none; }
```

Khi scene đổi, component phát `ui:scroll-scene:change` với `{ activeIndex, previousIndex, direction }`. Chỉ số bắt đầu từ 0; không phát sự kiện cho trạng thái ban đầu.

```js
document.querySelector('ui-scroll-scene').addEventListener('ui:scroll-scene:change', (event) => {
  console.log(event.detail.activeIndex);
});
```

## Mobile và hỗ trợ tiếp cận

Scene không hoạt động được đặt `inert`, tránh tab vào nội dung đang ẩn. Focus target được tạo tự động cho phép đổi scene bằng Arrow Up/Down/Left/Right và Home/End. Khi có `ui-mobile-disabled` và viewport đạt breakpoint, tất cả scene hiển thị dọc, không sticky. `prefers-reduced-motion: reduce` cũng dùng bố cục dọc để nội dung vẫn đọc được.

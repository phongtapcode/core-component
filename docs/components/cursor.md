# Cursor

`ui-cursor` cho một `ui-cursor-item` chạy theo con trỏ khi chuột ở trong vùng của nó. Item là phần trang trí, luôn có `pointer-events: none` để không chặn nút và liên kết phía dưới.

## Cơ bản

```html
<ui-cursor ui-name="product" ui-lerp-ease="0.1">
  <h2>Move over this area</h2>
  <a href="/products">See products</a>
  <ui-cursor-item ui-name="product">View</ui-cursor-item>
</ui-cursor>
```

Có thể dùng `<div is="ui-cursor">` nếu cần giữ tag `div`. Thư viện tự gắn hành vi bằng `MutationObserver`, kể cả trên Safari nơi customized built-in elements không được hỗ trợ. `<ui-cursor>` là cách dùng khuyến nghị cho markup mới.

## Hai item theo nửa vùng

```html
<div is="ui-cursor" ui-name="['prev','next']">
  <div class="left">Previous</div>
  <div class="right">Next</div>
  <ui-cursor-item ui-name="prev">← Prev</ui-cursor-item>
  <ui-cursor-item ui-name="next">Next →</ui-cursor-item>
</div>
```

Item bên trái được chọn khi con trỏ ở nửa trái của vùng; item bên phải được chọn ở nửa phải. Item có thể nằm bên trong vùng hoặc ở nơi khác trong trang nếu `ui-name` khớp. Nên giữ tên duy nhất khi có nhiều vùng cursor.

## Trạng thái và vùng tắt

Khi item được chọn, component tự thêm `ui-active`. Khi con trỏ ở trên `a`, `button` hoặc `[role="button"]`, nó thêm `ui-is-hovering-button` để bạn đổi giao diện:

```css
ui-cursor-item[ui-is-hovering-button] {
  background: #40d9bb;
  color: #09231d;
}
```

Đặt `ui-cursor-disabled` trên bất kỳ phần tử nào bên trong vùng để ẩn item và hiện lại con trỏ mặc định ở phần đó:

```html
<ui-cursor ui-name="demo">
  <div ui-cursor-disabled>Use the native cursor here</div>
  <ui-cursor-item ui-name="demo">Move</ui-cursor-item>
</ui-cursor>
```

## Định vị và độ mượt

Mặc định item dùng `position: fixed` và tọa độ viewport. Nếu item là con của vùng cursor, thêm `ui-absolute` để tính tọa độ theo vùng và dùng `position: absolute`. Khi item nằm ngoài vùng, nó vẫn dùng viewport.

`ui-lerp-ease` nhận số từ `0.01` đến `1`; càng lớn càng bám sát chuột. Mặc định là `0.1`. Khi con trỏ vừa đi vào vùng, item bắt đầu ngay ở vị trí chuột để tránh cú nhảy từ góc màn hình.

Vùng cursor còn xuất CSS variables `--ui-cursor-local-x`, `--ui-cursor-local-y`, `--ui-cursor-magnet-x` và `--ui-cursor-magnet-y`, có thể dùng cho magnetic button:

```css
.magnetic-button {
  transform: translate(
    var(--ui-cursor-magnet-x, 0px),
    var(--ui-cursor-magnet-y, 0px)
  );
}
```

## Distortion

`ui-distortion` nhận `none`, `distortion-2`, `distortion-3`, `distortion-4`, `distortion-5`. Các preset dùng vận tốc con trỏ để kéo giãn, nghiêng, xoay, blur hoặc thay đổi bo góc của item. Ví dụ:

```html
<ui-cursor ui-name="photo" ui-distortion="distortion-3">
  <h2>Hover to preview</h2>
  <ui-cursor-item ui-name="photo" class="photo-cursor">
    <img src="preview.jpg" alt="" />
  </ui-cursor-item>
</ui-cursor>
```

Distortion tự bỏ qua trên Safari 19 trở xuống; item vẫn đi theo chuột. Khi người dùng bật reduced motion, cursor trang trí tắt và con trỏ mặc định hoạt động.

## Hover vào chữ để hiện ảnh

Đặt `ui-cursor` quanh chính dòng chữ để vùng hover chỉ rộng bằng chữ. Mỗi dòng dùng một `ui-name` riêng để hiện đúng ảnh. `ui-cursor-item` bám theo con trỏ và canh tâm ảnh khi dừng. `ui-lerp-ease="0.16"` tạo độ trễ giống demo Distortion gallery.

```html
<ui-cursor ui-name="story-1" ui-lerp-ease="0.16" class="story-title">
  <span>Quiet landscapes</span>
  <ui-cursor-item ui-name="story-1" class="story-preview">
    <img src="landscape.jpg" alt="" />
  </ui-cursor-item>
</ui-cursor>
```

```css
.story-title { display: inline-block; width: max-content; }
.story-preview {
  width: 220px;
  aspect-ratio: 4 / 5;
  padding: 0;
  overflow: hidden;
}
.story-preview img { width: 100%; height: 100%; object-fit: cover; }
```

Với màn hình cảm ứng và người dùng bật reduced motion, nên hiển thị thêm ảnh tĩnh vì cursor trang trí không chạy ở các trường hợp này. Xem demo **Text image reveal** trong gallery.

## Thuộc tính

| Element | Thuộc tính | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `ui-cursor` | `ui-name` | — | Tên item hoặc mảng hai tên cho hai nửa vùng. |
| `ui-cursor` | `ui-absolute` | `false` | Dùng tọa độ theo vùng cho item nằm bên trong. |
| `ui-cursor` | `ui-lerp-ease` | `0.1` | Hệ số nội suy từ `0.01` đến `1`. |
| `ui-cursor` | `ui-distortion` | `none` | Một trong bốn preset distortion. |
| `ui-cursor` | `ui-mobile-disabled` | `false` | Tắt trên viewport hẹp hoặc thiết bị có con trỏ coarse. |
| `ui-cursor-item` | `ui-name` | — | Tên để vùng cursor chọn item. |
| `ui-cursor-item` | `ui-active` | tự động | Item đang hiển thị. |
| `ui-cursor-item` | `ui-is-hovering-button` | tự động | Con trỏ đang ở trên link hoặc button. |
| phần tử bất kỳ | `ui-cursor-disabled` | — | Ẩn item khi trỏ vào vùng này. |

Trên màn hình cảm ứng, cursor trang trí không xuất hiện vì không có vị trí hover ổn định. `ui-mobile-disabled` còn tắt hiệu ứng khi dùng chuột trên viewport hẹp hoặc thiết bị báo con trỏ coarse.

# Swipeable Card Stack

`ui-swipeable-card-stack` xếp các thẻ thành một chồng. Kéo thẻ trên cùng sang trái hoặc phải để đưa thẻ kế tiếp lên; kéo chưa đủ ngưỡng thì thẻ trở về. Dùng cho bộ ảnh, câu chuyện ngắn hoặc lựa chọn theo từng thẻ.

```js
import '@ui/components';
import '@ui/components/css';
```

## Dùng cơ bản

```html
<ui-swipeable-card-stack
  class="ui-swipeable-card-stack--style-1"
  ui-items-to-show="4"
  ui-scale-threshold="0.1"
  ui-speed="400"
  ui-easing="decay"
  aria-label="Photo stories"
>
  <article class="card"><img src="coast.jpg" alt="Bờ biển" /></article>
  <article class="card"><img src="city.jpg" alt="Thành phố" /></article>
  <article class="card"><img src="garden.jpg" alt="Khu vườn" /></article>
  <article class="card"><img src="mountain.jpg" alt="Núi" /></article>
</ui-swipeable-card-stack>
```

```css
ui-swipeable-card-stack { --ui-stack-width: 300px; --ui-stack-card-height: 400px; }
ui-swipeable-card-stack > .card { height: 400px; overflow: hidden; border-radius: 20px; }
ui-swipeable-card-stack > .card img { width: 100%; height: 100%; object-fit: cover; }
```

Thẻ là **con trực tiếp** của component. CSS mặc định đặt các thẻ chồng lên nhau; phần tử con tự định chiều cao và giao diện. Component đo thẻ đang active để cập nhật chiều cao container. Nó không đổi thứ tự DOM khi vuốt, nên nội dung và trạng thái của thẻ vẫn ổn định.

## Ba kiểu xếp lớp

| Kiểu | Cách dùng | Hiệu ứng |
|---|---|---|
| Ngang | `ui-style="1"` hoặc class `ui-swipeable-card-stack--style-1` | Các thẻ phía sau lệch sang phải. |
| Dọc | `ui-style="2"` hoặc class `ui-swipeable-card-stack--style-2` | Các thẻ phía sau lệch xuống dưới. |
| Rải | `ui-style="3"` hoặc class `ui-swipeable-card-stack--style-3` | Các thẻ phía sau lệch và nghiêng xen kẽ. |

Nếu vừa đặt `ui-style` vừa đặt class, `ui-style="2"` hoặc `"3"` được ưu tiên. Các lớp thu nhỏ theo `ui-scale-threshold`; `--ui-layer` và `--ui-interpolated` trên mỗi thẻ có thể dùng để thêm trang trí riêng.

## Thuộc tính

| Thuộc tính | Mặc định | Tác dụng |
|---|---:|---|
| `ui-items-to-show` | `5` | Số lớp tối đa có thể thấy. |
| `ui-scale-threshold` | `0.1` | Mức thu nhỏ thêm ở mỗi lớp (0–0.35). |
| `ui-speed` | `600` | Thời gian chuyển thẻ, tính bằng ms. Sau khi kéo và thả, thẻ được đưa xuống lớp cuối ngay rồi trượt từ vị trí thả về vị trí trong chồng theo thời gian này. |
| `ui-easing` | `spring` | `spring`, `decay`, `linear`, `ease`, `easeIn`, `easeOut`, `easeInOut`. |
| `ui-style` | `1` | Kiểu xếp `1`, `2` hoặc `3`. |

`ui-active` được đặt trên thẻ hiện ở trước. Các thẻ phía sau có `aria-hidden="true"`, `inert` và không nhận tương tác cho đến khi lên trước.

## JavaScript API

```js
const stack = document.querySelector('ui-swipeable-card-stack');
await stack.swipeLeft();
await stack.swipeRight();
await stack.goTo(2); // chỉ số bắt đầu từ 0

stack.addEventListener('ui:swipeable-card-stack:change', (event) => {
  console.log(event.detail.activeIndex, event.detail.previousIndex);
});
```

Vuốt trái và phải đều đưa **thẻ kế tiếp theo thứ tự DOM** lên trước; hướng chỉ quyết định thẻ cũ bay ra phía nào. `goTo(index)` đi lần lượt qua các thẻ đến vị trí yêu cầu. Có thể gọi `refresh()` sau khi thay nội dung; thêm hoặc bớt con trực tiếp cũng được theo dõi tự động.

Trên cảm ứng, kéo dọc vẫn cuộn trang. Component hỗ trợ phím mũi tên trái/phải khi focus ở container. Khi người dùng bật reduced motion, chuyển thẻ diễn ra ngay, không chạy transition.

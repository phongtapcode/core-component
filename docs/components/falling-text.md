# Falling Text

`<ui-falling-text>` biến từng từ hoặc ký tự thành rigid body bằng Matter.js. Chúng rơi theo thứ tự chọn trước, va chạm và bật nảy trong khung. Người dùng có thể kéo, ném hoặc quét chuột để đẩy chúng. Hiệu ứng lấy cảm hứng từ [Falling Text của React Bits](https://reactbits.dev/text-animations/falling-text), được viết thành Web Component để dùng không cần React.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-falling-text
  ui-trigger="click"
  ui-split="words"
  ui-order="random"
  ui-gravity="1"
  ui-bounciness="0.2"
  ui-scatter="0.5"
  ui-restore-delay="2"
  ui-highlight-words="falls,apart"
  style="--ui-falling-text-height:360px;--ui-falling-text-accent:#5b8cff"
>
  This sentence falls apart when you touch it.
</ui-falling-text>
```

## API

| Thuộc tính | Mặc định | Ý nghĩa |
|---|---:|---|
| `ui-text` | nội dung element | Câu hiển thị; đổi giá trị sẽ dựng lại các mảnh chữ. |
| `ui-highlight-words` | rỗng | Các tiền tố phân cách bằng dấu phẩy để tô màu nhấn. |
| `ui-trigger` | `click` | `auto`, `hover`, `click`, `scroll`; giá trị khác dùng `click`. Scroll chạy khi element vào vùng nhìn. |
| `ui-variant` | `text` | `text` hoặc `tiles` (ô chữ). |
| `ui-split` | `words` | `words` hoặc `letters`. |
| `ui-order` | `random` | `random`, `sequence`, `center`, `together`. |
| `ui-stagger` | `0.03` | Khoảng cách thả giữa các mảnh, 0–0.5 giây. |
| `ui-gravity` | `1` | Trọng lực -2 đến 3; số âm làm chữ bay lên. |
| `ui-bounciness` | `0.2` | Độ bật nảy 0–1. |
| `ui-scatter` | `0.5` | Độ xô ngang và xoay ban đầu 0–1. |
| `ui-draggable` | `true` | Cho phép kéo và ném bằng chuột/cảm ứng; đặt `"false"` để tắt. |
| `ui-drag-stiffness` | `0.2` | Độ bám theo con trỏ, 0.05–1. |
| `ui-cursor-push` | `0.5` | Lực đẩy khi quét chuột, 0–2; `0` tắt. |
| `ui-restore-delay` | `0` | Số giây sau khi đống chữ ổn định để quay về, khi con trỏ đã rời; `0` giữ nguyên đống chữ. |
| `ui-wireframes` | `false` | Vẽ đường bao quanh từng mảnh để kiểm tra. |

Giá trị số không hợp lệ trở về mặc định; giá trị quá giới hạn được giới hạn lại. Dùng CSS variables `--ui-falling-text-height` (360px), `--ui-falling-text-font-size` (2rem), `--ui-falling-text-weight` (400), `--ui-falling-text-text-width` (720px), `--ui-falling-text-color` (`currentColor`), `--ui-falling-text-accent` (`#5b8cff`), `--ui-falling-text-tile-background` và `--ui-falling-text-tile-accent-color` để phối màu và kích thước. Component không dùng shadow DOM; các mảnh có class `.ui-falling-text__piece`, còn chữ gốc nằm trong `.ui-falling-text__source`.

## Điều khiển

- `start()` chạy hiệu ứng theo lệnh, không phụ thuộc trigger.
- `reset()` đưa mảnh chữ về vị trí ban đầu.
- `replay()` dựng lại và thả lần nữa.
- `refresh()` đo lại sau khi đổi font hoặc kích thước từ CSS bên ngoài.

Component phát `ui:falling-text:start` với `{ count }`, `ui:falling-text:settle`, và `ui:falling-text:restore`. Các event đều `bubbles: true`.

## Truy cập, responsive và hiệu năng

Câu gốc vẫn nằm trong DOM cho trình đọc màn hình; các mảnh chuyển động được đánh dấu trang trí. Tab vào component, Enter/Space để bắt đầu hoặc chạy lại, Escape để reset. Trên màn hình cảm ứng, có thể kéo chữ đã rơi. `prefers-reduced-motion` giữ câu đứng yên, vẫn đọc được. Component đo theo vùng chứa khi resize, tạm dừng vòng lặp khi khuất màn hình hoặc tab ẩn, và dọn observer, listener, timer, RAF khi tháo khỏi DOM.

Cần trình duyệt hiện đại hỗ trợ Custom Elements, Pointer Events và CSS transforms. `ResizeObserver`/`IntersectionObserver` được dùng khi có sẵn; nếu thiếu, vẫn có thể gọi `refresh()` hoặc `start()` bằng mã. `matter-js` được đóng gói theo dependency của `@ui/components`.

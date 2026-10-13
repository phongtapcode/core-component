# Modal

`<ui-modal>` tạo dialog, drawer hoặc lightbox. Component có shadow DOM chứa backdrop và khung dialog; nội dung bên trong được đưa vào qua slot. Trigger ngoài modal dùng `ui-name` để tìm đúng modal; trigger bên trong modal không cần tên và dùng để đóng.

## Cơ bản

```html
<ui-modal-trigger ui-name="contact"><button>Open</button></ui-modal-trigger>

<ui-modal ui-name="contact" ui-animate="fade-up">
  <div>
    <ui-modal-trigger><button aria-label="Close">×</button></ui-modal-trigger>
    <h2>Contact us</h2>
    <p>Modal content</p>
  </div>
</ui-modal>
```

Backdrop và dialog tự tạo trong shadow DOM. Cách dùng cũ với `[data-modal-overlay]`, `[data-modal-dialog]` và `[data-modal-close]` vẫn hoạt động.
Khi trình duyệt hỗ trợ Popover API, modal dùng `::backdrop` của top layer để làm mờ toàn bộ trang phía sau; nếu không, lớp backdrop trong shadow DOM đảm nhiệm việc này.

## Hiệu ứng và vị trí

`ui-animate` nhận `zoom`, `smart-zoom`, `fade`, `smart-fade-zoom`, `fade-up`, `fade-down`, `fade-left`, `fade-right`, `slide-up`, `slide-down`, `slide-left`, `slide-right`, `none`. Mặc định là `smart-fade-zoom`. Hai kiểu `smart-*` bắt đầu từ vị trí và kích thước của trigger nếu modal được mở qua `<ui-modal-trigger>` hoặc `openModal(trigger)`.

`ui-placement` nhận `center`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`. Ví dụ drawer ở cạnh dưới:

```html
<ui-modal-trigger ui-name="sheet"><button>Open sheet</button></ui-modal-trigger>
<ui-modal ui-name="sheet" ui-placement="bottom-center" ui-animate="slide-up">
  <div>
    <ui-modal-pan>Swipe down to close</ui-modal-pan>
    <h2>Bottom sheet</h2>
  </div>
</ui-modal>
```

`<ui-modal-pan>` là vùng nhận cử chỉ vuốt trên thiết bị cảm ứng. Vuốt quá 80px theo hướng đóng sẽ đóng modal. Với `slide-left` hoặc `slide-right`, cử chỉ dùng trục ngang.

## Responsive

`ui-breakpoints` nhận object dạng JSON hoặc object literal như ví dụ. Mỗi key là **chiều rộng viewport tối đa**. Nếu nhiều mốc khớp, mốc nhỏ nhất được áp dụng.

```html
<ui-modal
  ui-name="responsive"
  ui-animate="zoom"
  ui-breakpoints="{700:{placement:'bottom-center',animate:'slide-up',duration:400}}"
>
  <div>Responsive content</div>
</ui-modal>
```

Các giá trị có thể override: `disabled`, `duration`, `easing`, `animate`, `backdropColor`, `backdropBlur`, `backdropDisabled`, `placement`. Khi `disabled: true`, nội dung hiện trong layout bình thường.

## Thuộc tính

| Thuộc tính | Mặc định | Mô tả |
| --- | --- | --- |
| `ui-name` | — | Ghép modal với trigger bên ngoài. |
| `ui-animate` | `smart-fade-zoom` | Kiểu mở và đóng. |
| `ui-placement` | `center` | Vị trí dialog. |
| `ui-duration` | `300` | Thời gian hiệu ứng, ms. |
| `ui-easing` | `decay` | Tên easing; hỗ trợ `spring`. |
| `ui-backdrop-color` | `rgba(12,18,32,.48)` | Màu backdrop. |
| `ui-backdrop-blur` | `10` | Độ mờ nền phía sau modal, px. |
| `ui-backdrop-disabled` | `false` | Ẩn backdrop. |
| `ui-portal` | `true` khi hỗ trợ | Dùng Popover API để đưa modal vào top layer. |
| `ui-disabled` | `false` | Hiện nội dung như HTML bình thường. |
| `ui-scroll-disabled` | `true` | Khóa cuộn trang khi mở. |
| `ui-autofocus` | `false` | Focus input đầu tiên. |
| `ui-video-autoplay` | `false` | Phát video khi mở, dừng khi đóng. |
| `ui-breakpoints` | `{}` | Override theo viewport. |
| `ui-esc-close-disabled` | `false` | Không đóng bằng Escape. |
| `ui-backdrop-close-disabled` | `false` | Không đóng bằng backdrop. |
| `open` | `false` | Trạng thái mở. |
| `dismissable` | `true` | Cho phép Escape và backdrop; API cũ. |

## JavaScript

```js
import { uiModal } from '@ui/components';

uiModal.open('contact');
uiModal.close('contact');
uiModal.toggle('contact');

const modal = document.querySelector('ui-modal[ui-name="contact"]');
modal.openModal();
modal.closeModal();
modal.toggle();
```

Đối tượng `uiModal` cũng có trên `window`. Modal phát `ui-modal-open` và `ui-modal-close`. Khi mở, focus được giữ trong modal, trang bị khóa cuộn theo mặc định và focus được trả về phần tử trước đó khi đóng. Escape đóng modal trên cùng khi có modal lồng nhau. Người dùng bật reduced motion sẽ không thấy transition.

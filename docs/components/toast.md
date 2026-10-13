# Toast

`ui-toast` hiển thị thông báo ngắn ở một trong sáu vị trí trên màn hình. Mỗi vị trí có một `ui-toast-portal` cố định, tự tạo khi cần; nhiều toast ở cùng vị trí sẽ xếp chồng. Dùng toast cho kết quả thao tác, thông báo thành công, lỗi hoặc cảnh báo ngắn. Thông tin cần đọc lâu nên đặt trong trang; xác nhận thao tác nên dùng modal.

## Gọi bằng JavaScript

```js
// Văn bản thuần: các ký tự HTML được hiển thị như chữ.
uiToast('Đã thêm vào giỏ hàng!');

// Nội dung HTML tin cậy, có thể định dạng tùy ý.
const toast = uiToast.push({
  content: '<strong>Thành công!</strong> Đơn hàng đã được đặt.',
  placement: 'top-right',
  delay: 3000,
  duration: 300,
  easing: 'spring',
  className: 'toast-success',
  closeButtonPlacement: 'center-right',
});

toast?.closeToast(); // đóng riêng toast này
```

`uiToast.push()` trả về phần tử `ui-toast` đang hiển thị, hoặc `null` nếu không tìm thấy template có tên. Truyền `Node` vào `content` nếu nội dung có dữ liệu người dùng; chuỗi HTML trong `push()` chỉ nên dùng với nội dung tin cậy.

## Template HTML

Khai báo toast có `ui-name` trong HTML. Element này được ẩn để làm template; mỗi lần gọi `push()` sẽ tạo một bản sao. Cách này phù hợp với nội dung nhiều thẻ hoặc được render sẵn từ template server.

```html
<ui-toast ui-name="cart-toast" ui-placement="top-right" ui-delay="3000"
  ui-class-name="toast-success" ui-close-button-placement="center-right">
  <strong>Đã thêm vào giỏ hàng</strong>
  <span>Giỏ hàng của bạn đã được cập nhật.</span>
</ui-toast>

<button onclick="uiToast.push({ name: 'cart-toast' })">Hiện toast</button>
```

Các option truyền vào `push()` được ưu tiên hơn thuộc tính của template. Gọi `uiToast.remove('cart-toast')` để đóng mọi bản sao đang hiển thị của template đó; `uiToast.remove()` đóng tất cả.

## Vị trí, thời gian và nút đóng

`ui-placement` nhận `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`. Mặc định là `bottom-center`.

`ui-delay` là thời gian toast hiển thị trước khi bắt đầu đóng, mặc định `2000` ms. Truyền `delay: Infinity` hoặc `ui-delay="Infinity"` để chỉ đóng thủ công. `ui-duration` điều khiển animation vào và ra, mặc định `200` ms. `ui-easing` mặc định `decay`; có thể dùng `spring` hoặc một CSS easing hợp lệ.

Nút đóng được tạo tự động với `aria-label="Close notification"`. Dùng `ui-close-button-disabled` để bỏ nút này, `ui-close-button-class-name` để thêm class, và `ui-close-button-placement` để chọn `top-right`, `top-left`, `center-right` hoặc `center-left`. Bạn cũng có thể đặt `<ui-toast-close-button>` trong template để tự viết nội dung nút; bên trong cần có một `<button>`.

```js
uiToast.push({
  content: 'Cần xử lý thủ công',
  delay: Infinity,
  closeButtonDisabled: false,
});
```

## Thuộc tính

| Element | Thuộc tính | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `ui-toast` | `ui-name` | — | Tên template. |
| `ui-toast` | `ui-placement` | `bottom-center` | Vị trí trên màn hình. |
| `ui-toast` | `ui-duration` | `200` | Thời gian animation vào/ra, ms. |
| `ui-toast` | `ui-delay` | `2000` | Thời gian tự đóng, ms; hỗ trợ `Infinity`. |
| `ui-toast` | `ui-easing` | `decay` | `decay`, `spring`, hoặc CSS easing. |
| `ui-toast` | `ui-class-name` | — | Class thêm vào toast đang hiển thị. |
| `ui-toast` | `ui-close-button-disabled` | `false` | Không tạo nút đóng. |
| `ui-toast` | `ui-close-button-class-name` | — | Class thêm vào nút đóng. |
| `ui-toast` | `ui-close-button-placement` | `top-right` | Vị trí nút đóng trong toast. |
| `ui-toast-portal` | `ui-placement` | — | Vị trí của nhóm toast; tự tạo. |

Toast mặc định dùng `role="status"` và `aria-live="polite"`; có thể khai báo sẵn trên template nếu cần mức thông báo khác. Người dùng bật reduced motion sẽ thấy toast xuất hiện và biến mất ngay, không có animation.

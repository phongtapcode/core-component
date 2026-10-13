# PhotoSwipe

`ui-photoswipe` tích hợp [PhotoSwipe 5](https://photoswipe.com/getting-started/) để mở gallery ảnh toàn màn hình, zoom và chuyển ảnh bằng thao tác vuốt hoặc bàn phím. Thành phần chỉ tải CSS, Lightbox và Core từ CDN khi người dùng mở ảnh đầu tiên. Phiên bản được cố định ở `5.4.4`.

## Khi nào nên dùng

Dùng cho gallery ảnh cần lightbox toàn màn hình. Nếu cần giao diện nhiều control tùy biến hơn, dùng `ui-modal` kết hợp `ui-carousel`. Với video, dùng `ui-modal` có `ui-video-autoplay`.

Một ảnh đơn cũng dùng được: đặt một link ảnh trong `ui-photoswipe` để mở lightbox và zoom khi click.

## HTML cơ bản

Đặt các link ảnh trong `ui-photoswipe`. `href` trỏ đến ảnh đầy đủ; `data-pswp-width` và `data-pswp-height` là kích thước thật của ảnh đó. PhotoSwipe cần biết kích thước trước khi tải ảnh để tính toán zoom và chuyển cảnh.

```html
<ui-photoswipe>
  <a href="/images/coast.jpg" data-pswp-width="1672" data-pswp-height="941">
    <img src="/images/coast.jpg" alt="Bờ biển lúc bình minh" />
  </a>
  <a href="/images/botanical.jpg" data-pswp-width="1672" data-pswp-height="941">
    <img src="/images/botanical.jpg" alt="Cây xanh trong vườn" />
  </a>
</ui-photoswipe>
```

Ảnh đơn:

```html
<ui-photoswipe>
  <a href="/images/photo-large.jpg" data-pswp-width="1600" data-pswp-height="1000">
    <img src="/images/photo-thumb.jpg" alt="Ảnh sản phẩm" />
  </a>
</ui-photoswipe>
```

Giữ `href` hợp lệ để người dùng vẫn mở được ảnh khi CDN bị chặn hoặc không có JavaScript. Mọi ảnh trong gallery cần kích thước chính xác; khi click trực tiếp vào link thiếu kích thước hợp lệ, link đó hoạt động như link ảnh thông thường.

## Tuỳ chọn

Đặt các [PhotoSwipe options](https://photoswipe.com/options/) dạng JSON trong `ui-options`. Các option truyền qua HTML phải là dữ liệu JSON; không dùng hàm JavaScript. Thành phần quản lý `gallery`, `children`, `dataSource` và `pswpModule` nên sẽ bỏ qua bốn option đó.

```html
<ui-photoswipe ui-options='{"bgOpacity":0.92,"loop":false,"wheelToZoom":true}'>
  <!-- Các link ảnh -->
</ui-photoswipe>
```

Ngoài JSON chuẩn, component chấp nhận cú pháp object đơn giản như `{ bgOpacity: 0.92, loop: false }`. Cú pháp này chỉ được chuẩn hóa thành JSON, không được thực thi. Khi thay đổi `ui-options`, lightbox cũ được hủy và cấu hình mới dùng từ lần mở tiếp theo.

| Thuộc tính | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `ui-options` | object/JSON string | `{}` | Tuỳ chọn PhotoSwipe. |
| `data-pswp-width` trên `<a>` | số dương | — | Chiều rộng ảnh đầy đủ. |
| `data-pswp-height` trên `<a>` | số dương | — | Chiều cao ảnh đầy đủ. |

## Nạp tài nguyên và hành vi

Lần click đầu tiên, component tải `photoswipe.css` và `photoswipe-lightbox.esm.js` từ CDN; PhotoSwipe Core tiếp tục được tải khi lightbox mở. Các gallery trên cùng trang dùng chung tài nguyên đã tải. Nếu CDN lỗi, click đầu tiên sẽ mở `href` của ảnh như link bình thường. Khi component bị gỡ khỏi DOM, instance PhotoSwipe được hủy.

PhotoSwipe hỗ trợ Escape để đóng, phím mũi tên để chuyển ảnh, thao tác vuốt trên thiết bị cảm ứng và giảm chuyển động khi người dùng bật reduced motion. Xem thêm [tài liệu chính thức](https://photoswipe.com/).

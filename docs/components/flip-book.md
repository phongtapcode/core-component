# Flip Book

`ui-flip-book` tạo một cuốn sách 3D với bìa và các tờ hai mặt. Ban đầu chỉ hiển thị bìa. Bấm hoặc vuốt bìa sang trái để mở; sau đó vuốt ngang, dùng phím ←/→ hoặc gọi `next()` và `previous()` để lật từng tờ. Nội dung của mỗi mặt do bạn viết trong HTML.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-flip-book aria-label="Nhật ký du lịch">
  <ui-flip-book-cover>
    <div class="my-cover">Những chuyến đi</div>
    <div data-cover-back>Lời mở đầu</div>
  </ui-flip-book-cover>
  <ui-flip-book-page>
    <div data-page-front><img src="coast.jpg" alt="Bờ biển"></div>
    <div data-page-back><h2>Chương một</h2><p>Ghi chép bên bờ biển.</p></div>
  </ui-flip-book-page>
  <ui-flip-book-page>
    <div data-page-front><img src="garden.jpg" alt="Khu vườn"></div>
    <div data-page-back><h2>Chương hai</h2><p>Ánh sáng trong khu vườn.</p></div>
  </ui-flip-book-page>
</ui-flip-book>
<button onclick="document.querySelector('ui-flip-book').previous()">←</button>
<button onclick="document.querySelector('ui-flip-book').next()">→</button>
```

Đặt `data-cover-back` lên mặt trong của bìa để tùy chỉnh trang trái đầu tiên; nếu không có, component dùng mặt lót mặc định. Mỗi `ui-flip-book-page` có một mặt `data-page-front` và một mặt `data-page-back`. Lúc mới mở, mặt trước của tờ đầu nằm bên phải. Lật một tờ làm mặt sau của nó hiện ở bên trái và mặt trước của tờ kế tiếp hiện ở bên phải.

| Attribute | Mặc định | Tác dụng |
|---|---|---|
| `ui-open` | Không có | Bìa đang mở. |
| `ui-page` | `0` | Số tờ đã lật, từ 0 đến số lượng tờ. |

| CSS variable | Mặc định | Tác dụng |
|---|---:|---|
| `--ui-flip-book-page-width` | `300px` | Chiều rộng mỗi trang. |
| `--ui-flip-book-page-height` | `410px` | Chiều cao cuốn sách. |
| `--ui-flip-book-duration` | `650ms` | Thời gian lật bìa và trang. |

API: `open()`, `close()`, `next()`, `previous()`, `goTo(index)`, `refresh()`. Component phát `ui:flip-book:open`, `ui:flip-book:change` và `ui:flip-book:close`. Kéo hoặc vuốt sang trái để lật tới, sang phải để lật lui; vuốt phải ở trang đầu để đóng sách. Trang nghiêng theo tay khi kéo và tự về vị trí cũ nếu vuốt chưa đủ xa. Vuốt dọc vẫn cuộn trang web. Khi focus vào sách, dùng ←/→ để lật, Home/End để về đầu/cuối. Bìa nhận Enter hoặc Space. Các mặt trang đang ẩn được đặt `inert` để không nhận focus.

Demo trực tiếp: `#/ui-flip-book` trong gallery.

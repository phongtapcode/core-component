# Logo Assembly

`ui-logo-assembly` biến các pixel có màu của SVG, PNG hoặc WebP thành những hạt canvas độc lập. Hạt trôi trong không gian rồi tụ lại thành logo, giữ màu gốc của từng điểm. Sau khi hình thành, chúng dao động và nhấp nháy nhẹ.

```js
import '@ui/components';
import '@ui/components/css';
```

## Dùng cơ bản

```html
<ui-logo-assembly
  ui-src="/images/brand.svg"
  ui-count="3600"
  ui-particle-size="1.7"
  ui-speed="2300"
  ui-attraction="0.024"
  ui-repel="3.2"
  ui-repel-radius="110"
  aria-label="Logo thương hiệu tạo từ các hạt sáng"
></ui-logo-assembly>
```

```css
ui-logo-assembly { --ui-logo-assembly-height: 460px; }
```

Component tự bắt đầu tụ hạt khi vào gần viewport. Trước đó, các hạt trôi trong trường sao. Di chuột qua logo để đẩy các hạt gần con trỏ; rời chuột thì chúng quay về. Click hoặc nhấn Enter/Space để làm logo vỡ ra rồi tự lắp lại. Có thể đặt `ui-auto="false"` để gọi `assemble()` thủ công.

## Đổi hoặc tải logo

```js
const logo = document.querySelector('ui-logo-assembly');
await logo.setLogo('/images/another-logo.webp'); // các hạt hiện có chuyển sang hình mới

document.querySelector('input[type="file"]').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (file) await logo.loadFile(file); // SVG, PNG hoặc WebP
});

logo.explode();
logo.scatter();
logo.assemble();
```

Logo cần có vùng trong suốt ở ngoài hình. Với ảnh tải từ domain khác, server ảnh phải cho phép CORS để canvas đọc được pixel. `loadFile()` tạo object URL cho file nội bộ và giải phóng nó khi component được tháo khỏi DOM.

## Tùy chỉnh

| Thuộc tính | Mặc định | Tác dụng |
|---|---:|---|
| `ui-src` | Logo mẫu | URL SVG, PNG hoặc WebP. |
| `ui-count` | `3600` | Số hạt yêu cầu (150–8000); giới hạn thực tế là 6000 trên desktop và 1500 trên màn nhỏ/cảm ứng. |
| `ui-particle-size` | `1.7` | Hệ số kích thước hạt. Ở mức mặc định, bán kính tự tăng theo diện tích phần logo có màu và số hạt thực tế để ảnh không bị thủng; tăng hoặc giảm giá trị này để chỉnh độ phủ. |
| `ui-color` | Màu logo | Ghi đè màu mọi hạt bằng một CSS color. |
| `ui-brightness` | `1` | Mức sáng/độ đậm của hạt. |
| `ui-glow` | `7` | Độ phát sáng của một số hạt. |
| `ui-speed` | `2300` | Thời gian tụ hoặc đổi hình, tính bằng ms. |
| `ui-attraction` | `0.024` | Lực kéo hạt về vị trí trong logo. |
| `ui-repel` | `3.2` | Lực đẩy khi con trỏ đến gần. |
| `ui-repel-radius` | `110` | Bán kính vùng đẩy, tính bằng px. |
| `ui-interaction` | `all` | `all`, `hover`, `click`, hoặc `none`. |
| `ui-auto` | `true` | Đặt `false` để tắt tự động tụ khi vào viewport. |

`ui-ready`, `ui-active`, `ui-assembled` và `ui-error` phản ánh trạng thái trên element. Các sự kiện `ui:logo-assembly:ready`, `ui:logo-assembly:assemble`, `ui:logo-assembly:assembled`, `ui:logo-assembly:scatter`, `ui:logo-assembly:explode` và `ui:logo-assembly:error` cho phép đồng bộ UI ngoài component. `ui:logo-assembly:ready` chứa `detail.count` là số hạt thực tế.

Canvas chỉ vẽ một phần tử DOM cho toàn bộ trường hạt, tạm dừng khi ra khỏi viewport hoặc khi tab bị ẩn. Chế độ reduced motion hiển thị logo tĩnh đã lắp xong.

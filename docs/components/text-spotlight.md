# Text Spotlight

`<ui-text-spotlight>` đặt nội dung trên một thẻ tối và làm sáng một vùng tròn mềm theo vị trí con trỏ. Hiệu ứng lấy cảm hứng từ mẫu **Uiverse.io by stepan_4398** do bạn cung cấp. Vùng sáng di chuyển liên tục theo chuột thay vì nhảy giữa các ô theo dõi.

## Cách dùng

```html
<ui-text-spotlight style="--ui-text-spotlight-radius: 145px">
  <span data-spotlight-badge>Object / 404</span>
  <h2 data-spotlight-title>Hidden Artifact</h2>
  <p data-spotlight-description>Move the pointer to discover this text.</p>
  <button type="button" data-spotlight-action>Explore</button>
</ui-text-spotlight>
```

Các thuộc tính `data-spotlight-*` áp dụng kiểu chữ mặc định. Bạn có thể thay nội dung, dùng phần tử HTML khác và viết thêm CSS cho chúng. Nút trong mã gốc vẫn nhận được sự kiện `click`.

## Tuỳ chỉnh

| Biến CSS | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `--ui-text-spotlight-radius` | `140px` | Bán kính vùng sáng. |
| `--ui-text-spotlight-width` | `320px` | Chiều rộng thẻ. |
| `--ui-text-spotlight-padding` | `38px 30px` | Khoảng cách từ nội dung tới viền. |
| `--ui-text-spotlight-dark-background` | `#09090d` | Nền tối. |
| `--ui-text-spotlight-lit-background` | `#191921` | Nền trong vùng sáng. |

Component tự đồng bộ lớp sáng khi nội dung thay đổi. Có thể gọi `refresh()` để đồng bộ thủ công sau khi cập nhật nội dung bằng thư viện bên ngoài.

## Trợ năng

Lớp sáng chỉ dùng để hiển thị, được ẩn với trình đọc màn hình và không bắt chuột hay bàn phím. Khi một phần tử bên trong được focus bằng bàn phím, vùng sáng đi tới phần tử đó. Trên thiết bị cảm ứng hoặc khi bật giảm chuyển động, thẻ hiển thị nội dung sáng rõ để luôn đọc được.

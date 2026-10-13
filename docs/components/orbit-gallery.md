# Orbit Gallery

`<ui-orbit-gallery>` chuyển ý tưởng vòng card xoay 3D thành một component dùng lại được. Component tự đếm các `ui-orbit-gallery-item` trong track, chia đều góc xoay và cập nhật khi thêm hoặc bớt card. Bạn có thể đặt ảnh, caption hoặc link trong từng card.

## Ví dụ

```html
<ui-orbit-gallery ui-duration="24000" aria-label="Bộ ảnh du lịch">
  <ui-orbit-gallery-track>
    <ui-orbit-gallery-item>
      <img src="coast.jpg" alt="Bờ biển lúc chiều tà" />
      <span>Bờ biển</span>
    </ui-orbit-gallery-item>
    <ui-orbit-gallery-item>
      <img src="garden.jpg" alt="Khu vườn xanh" />
      <span>Khu vườn</span>
    </ui-orbit-gallery-item>
    <ui-orbit-gallery-item>
      <img src="city.jpg" alt="Đường phố buổi sớm" />
      <span>Thành phố</span>
    </ui-orbit-gallery-item>
  </ui-orbit-gallery-track>
</ui-orbit-gallery>
```

Nhớ import `@ui/components` và `@ui/components/css`. Kích thước, phối màu, caption và ảnh do CSS của trang quyết định. Demo có sẵn trong gallery ở mục **Orbit Gallery**.

## Tùy chỉnh

| Thuộc tính | Mặc định | Mô tả |
| --- | --- | --- |
| `ui-duration` | `24000` | Số mili giây cho một vòng quay. |
| `ui-direction` | `normal` | Dùng `reverse` để quay theo chiều ngược lại. |

| CSS variable | Mặc định | Mô tả |
| --- | --- | --- |
| `--ui-orbit-radius` | `310px` | Bán kính vòng card. |
| `--ui-orbit-card-width` | `170px` | Chiều rộng card. |
| `--ui-orbit-card-height` | `240px` | Chiều cao card. |
| `--ui-orbit-card-radius` | `16px` | Bo góc card. |
| `--ui-orbit-height` | `560px` | Chiều cao vùng hiển thị. |
| `--ui-orbit-perspective` | `1100px` | Độ sâu phối cảnh. |
| `--ui-orbit-tilt` | `-12deg` | Độ nghiêng của vòng. |

Vòng xoay tạm dừng khi rê chuột hoặc focus vào nội dung bên trong. Khi người dùng bật **reduced motion**, vòng dừng quay. Ở viewport nhỏ hơn 700px, card và bán kính thu lại theo CSS mặc định; có thể override bằng CSS của trang.

Component tạo thêm mặt sau cho mỗi card để ảnh và caption vẫn hiển thị đúng chiều khi card đi qua nửa sau của vòng. Mặt sao chép này chỉ để hiển thị và được ẩn khỏi trình đọc màn hình.

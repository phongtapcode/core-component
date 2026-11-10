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

Kéo ngang bằng chuột hoặc vuốt ngang trên màn hình cảm ứng để xoay vòng ảnh. Khi thả tay, vòng tiếp tục trôi rõ rệt rồi chậm dần; sau đó chế độ tự quay tiếp tục kể cả khi con trỏ vẫn ở trên gallery. Vuốt dọc vẫn cuộn trang. Focus vào gallery rồi nhấn **←** hoặc **→** để xoay từng bước 24°. Một lần chạm hoặc click không xoay vòng; nếu card chứa link, kéo sẽ không mở link.

Vòng xoay vẫn chạy khi rê chuột qua gallery; chỉ tạm dừng khi đang kéo hoặc khi focus bằng bàn phím. Khi người dùng bật **reduced motion**, vòng dừng tự quay và thao tác kéo vẫn hoạt động nhưng không có quán tính sau khi thả. Ở viewport nhỏ hơn 700px, card và bán kính thu lại theo CSS mặc định; có thể override bằng CSS của trang.

Component tạo thêm mặt sau cho mỗi card để ảnh và caption vẫn hiển thị đúng chiều khi card đi qua nửa sau của vòng. Mặt sao chép này chỉ để hiển thị và được ẩn khỏi trình đọc màn hình.

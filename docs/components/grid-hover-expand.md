# Grid Hover Expand

`<ui-grid-hover-expand>` chia các phần tử con trực tiếp thành các cột bằng nhau. Khi hover hoặc focus một ô, ô đó rộng gấp đôi phần còn lại trong **cùng hàng**. Những hàng khác giữ nguyên. Rời khỏi vùng hover, các ô trở lại bằng nhau.

## HTML cơ bản

```html
<ui-grid-hover-expand ui-gap="0" style="--xs: 1; --sm: 1; --md: 3; --lg: 3">
  <div><img src="coast.jpg" alt="Bờ biển" /></div>
  <div><img src="city.jpg" alt="Thành phố" /></div>
  <div><img src="garden.jpg" alt="Khu vườn" /></div>
</ui-grid-hover-expand>
```

Mỗi phần tử con là một ô. Có thể đặt ảnh, text hoặc nội dung khác bên trong. Nếu muốn người dùng dùng bàn phím, đặt một link, button hoặc phần tử có thể focus trong ô.

## Thuộc tính

| Thuộc tính | Mặc định | Mô tả |
| --- | --- | --- |
| `ui-active-index` | không có | Chỉ số ô mở sẵn, bắt đầu từ 0. Khi rời hover, grid quay về ô này. Bỏ thuộc tính để mọi ô bằng nhau. |
| `ui-duration` | `200` | Thời gian thay đổi chiều rộng, tính bằng mili giây. |
| `ui-gap` | `20` | Khoảng cách ngang và dọc giữa các ô, tính bằng px. Đặt `0` để các ô liền nhau. |
| `ui-active` | tự động | Được gắn lên ô đang mở rộng. Dùng để style ảnh và nội dung bên trong. |

## CSS variables

| Biến | Mặc định | Mô tả |
| --- | --- | --- |
| `--xs` | `1` | Số cột dưới 576px. |
| `--sm` | kế thừa `--xs` | Số cột từ 576px. |
| `--md` | kế thừa `--sm` | Số cột từ 768px. |
| `--lg` | kế thừa `--md` | Số cột từ 992px. |
| `--ui-grid-hover-column-gap` | `20px` | Khoảng cách ngang giữa các ô. |
| `--ui-grid-hover-row-gap` | `20px` | Khoảng cách dọc giữa các hàng. |

`ui-gap` ưu tiên hơn hai CSS variable khoảng cách. Bỏ `ui-gap` nếu cần đặt khoảng cách ngang và dọc khác nhau.

Trên layout một cột, component giữ mọi ô bằng nhau. Khi người dùng bật reduced motion, thay đổi chiều rộng diễn ra ngay, không có transition. Khác với `ui-expandable-grid`, component này chỉ thay đổi chiều rộng trong hàng, không mở card thành một hàng mới.

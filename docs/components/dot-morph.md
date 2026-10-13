# Dot Morph

`<ui-dot-morph>` tạo các chấm ở vị trí ngẫu nhiên. Khi hover, focus bằng bàn phím hoặc chạm, chúng tụ thành chữ trong `ui-text`. Rời khỏi vùng hover, các chấm lại phân tán theo vị trí ngẫu nhiên mới.

## HTML cơ bản

```html
<ui-dot-morph
  ui-text='["CREATE", "EXPLORE", "INSPIRE"]'
  ui-duration="3000"
  ui-interval="1500"
></ui-dot-morph>
```

Component dùng Canvas để đo chữ và vẽ các chấm. Chỉ một canvas được cập nhật trong lúc chuyển động, nên vẫn chạy nhẹ khi chữ có nhiều chấm. Nếu Canvas không khả dụng, chữ thường được hiển thị thay thế.

Ở trạng thái ban đầu, một ít chấm nằm trong khung và phần lớn ở ngoài các cạnh. Khi hover, focus hoặc chạm, toàn bộ chấm bay vào tạo chữ đầu tiên. Sau khi chữ hiện đủ `ui-interval` mili giây, các chấm chuyển sang chữ kế tiếp, lặp lại đến hết mảng rồi quay về chữ đầu. Rời hover, timer dừng và các chấm bay ra ngoài; lần hover sau bắt đầu từ chữ đầu. `ui-count` điều chỉnh tổng số chấm.

## Thuộc tính

| Thuộc tính | Mặc định | Mô tả |
| --- | --- | --- |
| `ui-text` | `["UI"]` | Mảng JSON các chữ/cụm từ ngắn. Vẫn nhận một chuỗi đơn. Có thể đổi lúc đang chạy. |
| `ui-count` | tự động | Số chấm tuỳ chọn, từ 20 đến 3200. Nếu bỏ qua, mật độ chấm tự tăng theo kích thước nét chữ. |
| `ui-duration` | `900` | Thời gian các chấm di chuyển, tính bằng mili giây. |
| `ui-interval` | `1800` | Thời gian giữ mỗi chữ sau khi tạo xong trước khi chuyển chữ tiếp theo, tính bằng mili giây. |
| `ui-active` | tự động | Có khi các chấm đang tạo thành chữ. |

## CSS variables

| Biến | Mặc định | Mô tả |
| --- | --- | --- |
| `--ui-dot-height` | `280px` | Chiều cao tối thiểu của vùng chấm. |
| `--ui-dot-color` | `#fff` | Màu chấm và chữ thay thế. |
| `--ui-dot-glow` | `#ffffff8a` | Màu ánh sáng quanh chấm. |

```css
ui-dot-morph {
  --ui-dot-height: 360px;
  --ui-dot-color: #8cf4eb;
  --ui-dot-glow: #32d8e5b8;
  background: #10223b;
}
```

Đặt font trên chính `ui-dot-morph` để đổi phông chữ dùng khi tạo điểm. Với cụm từ dài, chữ tự thu nhỏ để vừa vùng hiển thị. Component tự tính lại khi vùng chứa đổi kích thước.

Khi bật **reduced motion**, component hiển thị chữ tĩnh thay vì hiệu ứng chấm. Component có thể nhận focus bằng Tab; trên thiết bị cảm ứng, chạm để bật/tắt chữ.

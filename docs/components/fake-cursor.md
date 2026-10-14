# Fake Cursor

`<ui-fake-cursor>` vẽ một con trỏ giả chạy tới phần tử được chọn, hiện bốn dấu góc chữ L quanh target, nhấn nhẹ và hiện vòng phản hồi. Các dấu góc xuất hiện khi con trỏ tới target rồi biến mất khi nó rời đi. Hình con trỏ lấy cảm hứng từ mẫu SVG **Uiverse.io by Darlley** do bạn cung cấp. Component này khác `ui-cursor`: chuyển động theo kịch bản, không theo chuột thật.

## Cách dùng

```html
<ui-fake-cursor ui-target="[data-cursor-target]" ui-label="Alex" ui-duration="3600">
  <button type="button" data-cursor-target>Create project</button>
</ui-fake-cursor>
```

Mặc định, cú bấm chỉ là hiệu ứng hình ảnh. Nếu muốn kích hoạt nút thật, thêm `ui-activate`:

```html
<ui-fake-cursor ui-target="#create" ui-activate ui-once>
  <button id="create" type="button">Create project</button>
</ui-fake-cursor>
```

Target phải nằm bên trong `ui-fake-cursor`. Không dùng `ui-activate` với liên kết dẫn trang hoặc hành động có tác dụng phụ nếu bạn chỉ cần phần hướng dẫn trực quan.

## Thuộc tính

| Thuộc tính | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `ui-target` | `[data-cursor-target]` | CSS selector của phần tử đích trong component. |
| `ui-label` | `Guide` | Tên nhỏ cạnh con trỏ. |
| `ui-duration` | `3200` | Thời gian một vòng chuyển động, tính bằng mili giây; giới hạn 800–30000. |
| `ui-activate` | tắt | Gọi `click()` trên target ở thời điểm bấm giả. |
| `ui-once` | tắt | Chạy một vòng thay vì lặp lại. |

## JavaScript và sự kiện

`play()`, `pause()`, `replay()` điều khiển chuyển động. Gọi `refresh()` sau khi nội dung hoặc vị trí target thay đổi ngoài quá trình resize.

`ui-fake-cursor:click` là sự kiện có thể hủy, chứa `detail.target`. Khi gọi `preventDefault()`, component sẽ không kích hoạt target dù có `ui-activate`.

## Giao diện và trợ năng

Đổi màu bằng `--ui-fake-cursor-color`. Con trỏ giả không nhận pointer events và không chặn nút thật. Khi người dùng bật **reduced motion**, hiệu ứng và tự động kích hoạt đều dừng; target vẫn tương tác bình thường.

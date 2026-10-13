# Sand Physics

`ui-sand-physics` là hộp cát tương tác chạy bằng lưới ô trên Canvas. Mỗi ô chứa tối đa một vật liệu nên hạt không xuyên qua nhau hay xuyên tường. Giữ và kéo chuột hoặc chạm để rải vật liệu; nét vẽ được nối liền giữa các sự kiện pointer. Kéo nhanh tạo nhiều hạt hơn và truyền xung lực theo hướng kéo.

```js
import '@ui/components';
import '@ui/components/css';
```

```html
<ui-sand-physics
  ui-preset="funnel"
  ui-tool="sand"
  ui-cell-size="4"
  ui-brush-size="5"
  ui-initial-count="1800"
  ui-auto-rate="180"
  ui-gravity="down"
  aria-label="Hộp cát tương tác"
></ui-sand-physics>
```

```css
ui-sand-physics { --ui-sand-height: 500px; }
```

## Vật liệu và công cụ

Đổi `ui-tool` giữa `sand`, `water`, `stone`, `fire`, `smoke`, `lava`, `wood`, `wall`, `eraser`, `brush`, `attract`, và `explode`. Cát rơi và trượt; nước lan ngang; đá rơi rồi nằm yên; dung nham chảy chậm và đông thành đá khi gặp nước; lửa và khói bay ngược trọng lực rồi tắt dần; lửa có thể đốt gỗ. Tường chặn mọi vật liệu. Brush đẩy hạt, Attract hút hạt và Explosion tạo xung lực lên hạt quanh con trỏ.

Các mô hình dùng quy tắc theo ô, ưu tiên tốc độ và tính ổn định hơn mô phỏng chất lỏng liên tục. Kích thước một hạt bằng một ô lưới; `ui-cell-size` càng nhỏ thì ảnh càng chi tiết nhưng cần xử lý nhiều ô hơn. Component giới hạn lưới ở khoảng 130.000 ô để hỗ trợ điện thoại.

## Điều khiển

| Thuộc tính | Mặc định | Tác dụng |
|---|---:|---|
| `ui-tool` | `sand` | Vật liệu hoặc công cụ hiện tại. |
| `ui-cell-size` | `4` | Kích thước ô tính theo pixel hiển thị, từ 2 đến 12. |
| `ui-brush-size` | `5` | Bán kính cọ theo ô, từ 1 đến 35. |
| `ui-amount` | `0.68` | Mật độ hạt của nét vẽ, từ 0.05 đến 1. |
| `ui-auto-rate` | `0` | Số hạt cát tự thêm vào mỗi giây từ cạnh đối diện hướng trọng lực. |
| `ui-initial-count` | `0` | Số hạt cát nhiều màu được rải lúc khởi tạo. |
| `ui-speed` | `1` | Tốc độ cập nhật mô phỏng. |
| `ui-gravity` | `down` | `down`, `up`, `left` hoặc `right`. |
| `ui-gravity-strength` | `1` | Số bước mô phỏng theo thời gian, từ 0.1 đến 4. |
| `ui-preset` | `none` | Vật cản mẫu: `none`, `funnel`, `hourglass`, `maze`, `chute`. |
| `ui-color` | `#eebd77` | Màu cho lớp cát mới; lớp cũ giữ màu đã vẽ. |
| `ui-background` | `dark` | `dark`, `light`, hoặc `transparent`. |

```js
const box = document.querySelector('ui-sand-physics');
box.pause();
box.resume();
box.togglePause();
box.undo();
box.clear();
box.reset();
box.setPreset('hourglass');

const link = document.createElement('a');
link.href = box.saveImage();
link.download = 'sand.png';
link.click();
```

Mỗi nét vẽ và mỗi lần đổi preset lưu một bước Undo, tối đa 12 bước. Sự kiện `ui:sand-physics:change` chứa `{ count, paused, gravity }`. Mô phỏng tạm dừng khi component nằm ngoài viewport hoặc tab bị ẩn; kéo trên màn cảm ứng dùng Pointer Events như chuột.

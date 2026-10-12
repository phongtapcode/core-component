# Collapse & Accordion

Component collapsible panel và accordion với hiệu ứng height animation mượt mà từ `0` đến `auto`, hỗ trợ điều khiển độc lập hoặc nhóm theo dạng accordion (chỉ mở 1 panel tại một thời điểm), scroll-to-header tự động khi mở, và binding trạng thái `active-binding` cho icon hoặc button bên trong.

## Khi nào nên dùng

- **FAQ, câu hỏi thường gặp**, danh sách câu hỏi thu gọn.
- **Panel chi tiết**, sidebar navigation nhiều cấp có submenu.
- Dùng `<ui-collapse-provider>` (hoặc `<ui-accordion>`) để tạo **Accordion** (chỉ 1 panel mở tại một thời điểm, tự động đóng các panel khác).
- Dùng standalone (không có provider) khi các panel cần đóng/mở độc lập.
- Dùng `<ui-toggle>` nếu chỉ cần ẩn/hiện tức thì mà không cần hiệu ứng chuyển động chiều cao (height transition).
- *Không dùng cho modal, dropdown, hoặc tabs* — hãy dùng `<ui-modal>`, `<ui-popover>`, hoặc `<ui-tabs>`.

## Các element

| Tag | Vai trò | Bắt buộc |
|---|---|---|
| `<ui-collapse-trigger>` | Phần header / button click để đóng hoặc mở panel nội dung | Có |
| `<ui-collapse>` | Container chứa nội dung có animation height từ `0` đến `auto` | Có |
| `<ui-collapse-provider>` | Wrapper tạo accordion (chỉ 1 panel mở tại 1 thời điểm, tự động ghép trigger/collapse) | Không (Dùng khi làm accordion) |

> **Lưu ý**: `<ui-accordion>` là alias tương thích của `<ui-collapse-provider>`.

---

## Cú pháp HTML cơ bản

### 1. Collapse đơn lẻ (Standalone)

Đóng mở độc lập từng phần bằng cách liên kết `name` giữa trigger và collapse:

```html
<ui-collapse-trigger name="faq-1">
  <div class="collapse-header">Câu hỏi 1: Antigravity UI là gì?</div>
</ui-collapse-trigger>

<ui-collapse name="faq-1" duration="300" easing="decay">
  <div class="collapse-content">
    Antigravity UI là bộ component web chuẩn Enterprise, Zero-dependency, native Web Components.
  </div>
</ui-collapse>
```

### 2. Accordion (với `<ui-collapse-provider>`)

Khi bao bọc các cặp trigger và collapse trong `<ui-collapse-provider>`, component sẽ tự động hoạt động ở chế độ accordion: mở một mục sẽ tự động đóng các mục còn lại. Thuộc tính `name` có thể được tự động tạo nếu để trống:

```html
<ui-collapse-provider duration="300">
  <!-- Panel 1 (Mở mặc định) -->
  <ui-collapse-trigger active>
    <div class="collapse-header">Phần 1: Giới thiệu</div>
  </ui-collapse-trigger>
  <ui-collapse active>
    <div class="collapse-content">Nội dung phần 1...</div>
  </ui-collapse>

  <!-- Panel 2 -->
  <ui-collapse-trigger>
    <div class="collapse-header">Phần 2: Cài đặt</div>
  </ui-collapse-trigger>
  <ui-collapse>
    <div class="collapse-content">Nội dung phần 2...</div>
  </ui-collapse>

  <!-- Panel 3 -->
  <ui-collapse-trigger>
    <div class="collapse-header">Phần 3: Sử dụng</div>
  </ui-collapse-trigger>
  <ui-collapse>
    <div class="collapse-content">Nội dung phần 3...</div>
  </ui-collapse>
</ui-collapse-provider>
```

### 3. Accordion tự động cuộn (Scroll to Header)

Khi chuyển panel trong accordion dài, header của panel vừa mở sẽ tự động cuộn lên đầu viewport sau khi animation hoàn tất. Sử dụng `scroll-offset` để trừ hao khoảng cách header dính (sticky navbar):

```html
<ui-collapse-provider duration="300" scroll scroll-offset="70">
  <ui-collapse-trigger active>
    <div class="collapse-header">Chương 1</div>
  </ui-collapse-trigger>
  <ui-collapse active>
    <div class="collapse-content">Nội dung dài chương 1...</div>
  </ui-collapse>

  <ui-collapse-trigger>
    <div class="collapse-header">Chương 2</div>
  </ui-collapse-trigger>
  <ui-collapse>
    <div class="collapse-content">Nội dung dài chương 2...</div>
  </ui-collapse>
</ui-collapse-provider>
```

### 4. Đồng bộ icon trạng thái (`active-binding`)

Thuộc tính `active-binding` trên `<ui-collapse-trigger>` cho phép tự động thêm/xóa attribute trên các phần tử con theo cú pháp `selector[attribute]` (ngăn cách bằng dấu phẩy):

```html
<ui-collapse-trigger name="panel-icon" active-binding="button[data-state], .icon[rotate]">
  <button type="button" class="flex justify-between items-center w-full p-4">
    <span>Chi tiết thông số</span>
    <span class="icon transition-transform">▼</span>
  </button>
</ui-collapse-trigger>

<ui-collapse name="panel-icon">
  <div class="p-4 bg-muted">
    Bảng thông số chi tiết...
  </div>
</ui-collapse>
```

CSS kèm theo:
```css
.icon[rotate] {
  transform: rotate(180deg);
}
```

---

## Chi tiết thuộc tính (Attributes)

### `<ui-collapse-trigger>`

| Attribute | Description | Type | Default |
|---|---|---|---|
| `name` | Tên định danh đồng bộ với `<ui-collapse>` tương ứng | `string` | `—` |
| `active` | Trạng thái mở của trigger (`aria-expanded` phản ánh giá trị này) | `boolean` | `false` |
| `active-binding` | Tự động đặt thuộc tính cho element bên trong theo cú pháp `selector[attribute]` | `string` | `—` |

### `<ui-collapse>`

| Attribute | Description | Type | Default |
|---|---|---|---|
| `name` | Tên định danh đồng bộ với `<ui-collapse-trigger>` | `string` | `—` |
| `duration` | Thời gian transition tính bằng mili-giây (ms) | `number` | `300` |
| `easing` | Hàm gia tốc chuyển động (xem bảng Easing bên dưới) | `string` | `'decay'` |
| `active` | Trạng thái mở của collapse (phản ánh `aria-hidden="false"`) | `boolean` | `false` |
| `observed` | Thay đổi giá trị để kích hoạt tái khởi tạo (hữu ích cho design mode / CMS) | `string` | `—` |

### `<ui-collapse-provider>` / `<ui-accordion>`

| Attribute | Description | Type | Default |
|---|---|---|---|
| `duration` | Thời gian transition mặc định truyền xuống các collapse con | `number` | `300` |
| `scroll` | Tự động cuộn header lên viewport sau khi mở panel | `boolean` | `false` |
| `scroll-offset` | Khoảng cách bù trừ (pixel) khi cuộn, dùng khi có sticky header | `number` | `0` |
| `multiple` | Cho phép mở nhiều panel cùng lúc (bỏ chế độ đơn lẻ) | `boolean` | `false` |
| `observed` | Thay đổi giá trị để đồng bộ lại toàn bộ con | `string` | `—` |

---

## Danh sách hàm Easing hỗ trợ

Các đường cong easing được tối ưu hóa mượt mà từ `@ui/tokens`:

| Tên Easing | Mô tả |
|---|---|
| `decay` *(Default)* | Chuyển động giảm tốc tự nhiên chuẩn iOS/macOS |
| `easeOutQuad` | Giảm tốc mượt bậc 2 |
| `easeInOutQuad` | Tăng tốc nhẹ rồi giảm tốc bậc 2 |
| `easeInCubic`, `easeOutCubic`, `easeInOutCubic` | Độ dốc bậc 3 |
| `easeInQuart`, `easeOutQuart`, `easeInOutQuart` | Độ dốc bậc 4 mạnh mẽ |
| `easeInQuint`, `easeOutQuint`, `easeInOutQuint` | Độ dốc bậc 5 siêu mượt |
| `easeOutBounce`, `easeInBounce` | Hiệu ứng nảy cơ học |
| `easeOutBack`, `easeInBack` | Hiệu ứng vượt ngưỡng nhẹ (overshoot) |
| `easeOutElastic`, `easeInElastic` | Hiệu ứng dây thun đàn hồi |
| `spring` | Lò xo vật lý |
| `linear`, `ease` | Các hàm CSS tiêu chuẩn |

---

## Events & JavaScript API

### Events

| Event Name | Target | Detail | Mô tả |
|---|---|---|---|
| `ui-collapse:open` | `<ui-collapse>` | `{ name, id }` | Bắn ra khi animation mở hoàn thành |
| `ui-collapse:close` | `<ui-collapse>` | `{ name, id }` | Bắn ra khi animation đóng hoàn thành |
| `ui-collapse-toggle` | `<ui-collapse>` | `{ open: boolean }` | Bắn ra ngay khi lệnh toggle/open/close được kích hoạt |
| `ui-accordion-change` | `<ui-collapse-provider>` | `{ openCount: number }` | Bắn ra khi số lượng panel mở trong provider thay đổi |

### Phương thức JavaScript

```ts
const collapse = document.querySelector<UiCollapse>('ui-collapse');

// Mở nội dung
collapse.open();

// Đóng nội dung
collapse.close();

// Đảo trạng thái
collapse.toggle();

// Kiểm tra trạng thái hiện tại
console.log(collapse.isOpen); // boolean
```

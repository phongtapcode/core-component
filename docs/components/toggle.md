# Toggle (`<ui-toggle>` / `<ui-toggle-trigger>`)

Component ẩn/hiện đơn giản kết hợp giữa trigger và container nội dung, hỗ trợ click outside để đóng, chế độ portal cho floating positioning, và đầy đủ tính năng accessibility (focus restoration, autofocus, escape to close).

---

## 1. Khi nào nên dùng

- **Dùng cho:** Panel ẩn/hiện đơn giản, mobile menu, dropdown content, menu header, hoặc section mở rộng không cần animation tính toán chiều cao phức tạp.
- **`outside-click-enabled`:** Dùng cho hành vi dropdown (click ra ngoài vùng panel và trigger sẽ tự động đóng).
- **`portal` & `parent-selector`:** Dùng cho panel floating cần di chuyển ra ngoài DOM tree (chống bị che bởi `overflow: hidden`) và định vị theo parent/anchor.
- **`breakpoints`:** Dùng cho cấu hình responsive (ví dụ: chỉ bật portal trên desktop hoặc thay đổi hành vi theo kích thước màn hình).
- *So sánh với các component khác:*
  - Dùng `<ui-collapse>` khi cần hiệu ứng animation height transition mượt mà.
  - Dùng `<ui-modal>` cho overlay full màn hình (dialog).
  - Dùng `<ui-popover>` cho floating panel có arrow định hướng.

---

## 2. Các Element

| Tag | Vai trò | Bắt buộc |
| :--- | :--- | :--- |
| `ui-toggle-trigger` | Nút bấm toggle ẩn/hiện nội dung (có thể đặt ngoài hoặc trong container) | **Có** |
| `ui-toggle` | Container nội dung ẩn/hiện | **Có** |

---

## 3. Cấu trúc HTML cơ bản

```html
<!-- Trigger mở menu -->
<ui-toggle-trigger name="menu">
  <button class="btn">Toggle Menu</button>
</ui-toggle-trigger>

<!-- Container nội dung -->
<ui-toggle name="menu" outside-click-enabled autofocus>
  <nav class="p-4 bg-white shadow-lg rounded">
    <a href="/page-1" class="block py-2">Trang 1</a>
    <a href="/page-2" class="block py-2">Trang 2</a>

    <!-- Trigger đóng bên trong container -->
    <ui-toggle-trigger name="menu">
      <button class="close-btn">&times; Đóng</button>
    </ui-toggle-trigger>
  </nav>
</ui-toggle>
```

---

## 4. Bảng thuộc tính (HTML Attributes)

### `ui-toggle-trigger`
| Attribute | Alias / UI Prefix | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `ui-name` | `string` | `—` | Tên định danh đồng bộ với `ui-toggle`. |
| `active` | `ui-active` | `boolean` | `false` | Phản ánh trạng thái mở của container (tự động cập nhật khi container mở/đóng). |

### `ui-toggle`
| Attribute | Alias / UI Prefix | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `ui-name` | `string` | `—` | Tên định danh đồng bộ với `ui-toggle-trigger`. |
| `active` | `ui-active` | `boolean` | `false` | Phản ánh trạng thái mở (tự động cập nhật, hoặc đặt trước để mở ban đầu). |
| `autofocus` | `ui-autofocus` | `boolean` | `false` | Tự động focus vào input / button đầu tiên khi mở và trả lại focus khi đóng. |
| `outside-click-enabled` | `ui-outside-click-enabled` | `boolean` | `false` | Cho phép tự động đóng panel khi click ra ngoài container và trigger. |
| `portal` | `ui-portal` | `boolean` | `false` | Đưa nội dung ra ngoài `document.body` để tránh bị cắt bởi `overflow: hidden`. |
| `parent-selector` | `ui-parent-selector` | `string` | `—` | CSS selector của element neo để định vị toạ độ floating panel khi bật portal. |
| `breakpoints` | `ui-breakpoints` | `string` | `—` | Cấu hình responsive dạng chuỗi JSON, ví dụ: `'{"768": {"portal": true}}'`. |
| `escape-close` | `ui-escape-close` | `boolean` | `true` | Tự động đóng toggle khi người dùng bấm phím `Escape`. |

---

## 5. JavaScript API

```typescript
const toggle = document.querySelector('ui-toggle');

// Methods
toggle.open();   // Mở toggle
toggle.close();  // Đóng toggle
toggle.toggle(); // Đảo trạng thái mở/đóng

// Properties
toggle.isOpen;        // boolean
toggle.effectiveName; // string

// Events
toggle.addEventListener('ui-toggle:open', (e) => {
  console.log('Opened:', e.detail.name);
});
toggle.addEventListener('ui-toggle:close', (e) => {
  console.log('Closed:', e.detail.name);
});
toggle.addEventListener('ui-toggle:change', (e) => {
  console.log('State changed:', e.detail.active);
});
```

---

## 6. Ví dụ nâng cao

### Dropdown Menu với Click Outside
```html
<div class="relative inline-block">
  <ui-toggle-trigger name="profile-dropdown">
    <button class="btn">Tài khoản ▼</button>
  </ui-toggle-trigger>

  <ui-toggle
    name="profile-dropdown"
    outside-click-enabled
    class="dropdown-panel shadow-md border rounded bg-white mt-2 p-3"
  >
    <a href="/profile" class="block py-1">Hồ sơ cá nhân</a>
    <a href="/settings" class="block py-1">Cài đặt</a>
    <a href="/logout" class="block py-1 text-red-600">Đăng xuất</a>
  </ui-toggle>
</div>
```

### Floating Portal với Responsive Breakpoints
```html
<ui-toggle-trigger name="user-tooltip">
  <button id="user-btn">Thông tin chi tiết</button>
</ui-toggle-trigger>

<ui-toggle
  name="user-tooltip"
  portal="true"
  parent-selector="#user-btn"
  outside-click-enabled="true"
  breakpoints='{"1024": {"portal": true}, "0": {"portal": false}}'
  class="p-4 bg-slate-900 text-white rounded shadow-xl"
>
  <p>Panel được portal ra ngoài body trên desktop để không bị cắt layout!</p>
</ui-toggle>
```
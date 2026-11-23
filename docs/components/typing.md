# Typing

`ui-typing` thay đổi các cụm từ ngắn trong headline theo ba hiệu ứng: đánh máy (`typing`), trượt dọc (`slide`) và hòa chữ bằng SVG filter (`goo`). Phù hợp cho hero, slogan hoặc tiêu đề trang trí; với đoạn văn dài cần đọc, dùng text bình thường.

```js
import '@element-works/motion';
import '@element-works/motion/css';
```

## Typewriter

`ui-duration` là thời gian gõ **mỗi ký tự**. Sau khi gõ hết cụm từ, component dừng theo `ui-delay`, xóa từng ký tự rồi bắt đầu cụm tiếp theo. Con trỏ mặc định là `|` và có thể đổi bằng `ui-cursor-char`.

```html
<h1>
  Make room for
  <ui-typing
    ui-effect="typing"
    ui-content='["wonder", "ideas", "people"]'
    ui-duration="95"
    ui-delay="1900"
    ui-cursor-char="|"
  ></ui-typing>
</h1>
```

Component tách ký tự theo grapheme khi trình duyệt hỗ trợ `Intl.Segmenter`, để dấu tiếng Việt và emoji không bị xóa giữa chừng.

Trong demo gallery, các nút **Journal**, **Travel** và **Studio** thay `ui-content` trực tiếp để thử nhiều bộ từ trên cùng một headline.

## Slide

`ui-duration` là thời gian chuyển **cả cụm từ**. Từ cũ trượt lên, từ mới đi từ dưới vào. Component chừa sẵn chiều rộng của cụm dài nhất để bố cục headline không nhảy khi đổi chữ.

```html
<h1>
  Spaces for
  <ui-typing
    ui-effect="slide"
    ui-content='["living", "meeting", "making"]'
    ui-duration="520"
    ui-delay="2100"
  ></ui-typing>
</h1>
```

## Goo

Hai cụm từ chồng lên nhau trong lúc chuyển. SVG filter làm mờ và kết nối vùng chữ ở lớp phía sau để tạo cảm giác morphing/blob; lớp này chỉ hiện trong lúc chuyển nên chữ đứng yên vẫn sắc nét. Mỗi instance có filter riêng để nhiều component có thể xuất hiện trên cùng trang.

```html
<h1>
  Stay
  <ui-typing
    ui-effect="goo"
    ui-content='["curious", "open", "brave"]'
    ui-duration="1050"
    ui-delay="1800"
  ></ui-typing>
</h1>
```

## Element và thuộc tính

| Element | Vai trò | Tạo bởi |
|---|---|---|
| `ui-typing` | Element chính chứa nội dung và cấu hình. | Bạn |
| `ui-typing-inner` | Wrapper giữ kích thước headline và trạng thái chuyển chữ. | Component tự tạo trong shadow DOM |
| `ui-typing-content` | Nội dung đang hiển thị. | Component tự tạo trong shadow DOM |

| Attribute | Kiểu | Mặc định | Tác dụng |
|---|---|---|---|
| `ui-content` | JSON `string[]` | `[]` | Mảng các cụm từ. Chỉ giá trị chuỗi được dùng. |
| `ui-effect` | `typing`, `slide`, `goo` | `typing` | Chọn hiệu ứng. |
| `ui-duration` | number (ms) | `100` / `300` / `1000` | Thời gian mỗi ký tự với typing; thời gian chuyển với slide/goo. |
| `ui-delay` | number (ms) | `2000` | Thời gian dừng trước khi chuyển cụm từ. |
| `ui-cursor-char` | string | `|` | Ký tự con trỏ, chỉ dùng trong typing. Đặt chuỗi rỗng để ẩn. |

`ui-content` phải là JSON hợp lệ. Khi thay đổi các attribute, component bắt đầu lại từ cụm đầu tiên với cấu hình mới. Mảng rỗng không tạo animation; mảng chỉ có một cụm từ hiển thị cụm đó và không xoay vòng. Giá trị duration hoặc delay âm/không hợp lệ dùng mặc định.

`ui-typing` là inline block nên có thể đặt trực tiếp trong `<h1>`. Có thể style màu và font trên chính element; shadow content sẽ kế thừa. Dùng `ui-typing::part(inner)` và `ui-typing::part(content)` nếu cần style wrapper bên trong.

## Truy cập và reduced motion

Cụm từ hoàn chỉnh hiện tại được đặt làm nhãn truy cập của element; phần chữ đang chạy trong shadow DOM không được đọc từng ký tự. Component không phát live announcement liên tục.

Khi người dùng bật `prefers-reduced-motion: reduce`, cụm đầu tiên hiển thị tĩnh, không có cursor hoặc timer. Timer và animation frame được dọn khi element bị tháo khỏi DOM.

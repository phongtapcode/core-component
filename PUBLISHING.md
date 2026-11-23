# Phát hành các package

Workspace có bốn package public: `tokens` → `core` → `motion` → `components`.
`docs` và `html` là ứng dụng nội bộ, không publish lên npm.

## Trước mỗi lần phát hành

1. Repo dùng npm scope `@element-works/*`. Tài khoản `nguyenbaphong` là owner của organization `element-works`.
2. Quyết định quyền sử dụng mã nguồn. Nếu muốn người khác được phép sử dụng, chọn license phù hợp và thêm file `LICENSE`; repo hiện chưa có license.
3. Đăng nhập registry bằng `npm login` và xác nhận tài khoản bằng `npm whoami`.

## Kiểm tra bản phát hành

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

Lệnh này build gallery và docs, typecheck, chạy các bài test, sau đó pack bốn package và kiểm tra JS, types, CSS exports cùng version của dependency nội bộ trong tarball. Không dùng `pnpm test:e2e` hay `pnpm lint` làm điều kiện phát hành vì hai script đó hiện chỉ là placeholder.

Version `0.1.0` của bốn package đã được phát hành. Khi phát hành bản mới, cập nhật version của các package liên quan, chạy `pnpm install` để cập nhật lockfile, rồi chạy lại `pnpm release:check`. Đảm bảo version chưa tồn tại trên npm.

## Publish

Sau khi kiểm tra scope, quyền sử dụng mã nguồn, tài khoản npm và commit các thay đổi:

```bash
pnpm -r publish --dry-run
pnpm -r publish --access public
```

`pnpm` bỏ qua các workspace package có `private: true` và chuyển `workspace:*` thành version cụ thể trong package được publish. Xem lại output của dry run trước khi thực hiện lệnh publish.

Nếu npm báo `EOTP`, nhập mã trong terminal của bạn (không chia sẻ mã trong chat). Với shell `zsh`, có thể nhập kín mã và phát hành từ trạng thái repo chưa commit bằng:

```zsh
read -rs "otp?Mã OTP npm: "; echo
pnpm -r publish --access public --no-git-checks --otp "$otp"
unset otp
```

`--no-git-checks` chỉ cần khi workspace còn thay đổi chưa commit. Sau khi publish, xác nhận bốn version trên npm registry.

## Dùng trong dự án khác

```bash
pnpm add @element-works/components @element-works/tokens
```

Trong ứng dụng chạy trên trình duyệt, import CSS và JS tại entry point phía client:

```ts
import '@element-works/tokens/css';
import '@element-works/components/css';
import '@element-works/components';
```

Nếu chỉ cần các hiệu ứng motion, cài `@element-works/motion` và import `@element-works/motion/css` cùng `@element-works/motion`. Nếu chỉ cần primitive để tự viết Web Component, cài `@element-works/core`; package này không đăng ký component giao diện.

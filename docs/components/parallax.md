# Parallax

`ui-parallax` đo vùng cuộn và vị trí con trỏ. Đặt `ui-parallax-scroll` bên trong để nội suy CSS theo scroll, hoặc `ui-parallax-hover` để dịch chuyển / nghiêng 3D theo chuột. Có thể lồng hover trong scroll để kết hợp hai hiệu ứng. Với hiệu ứng hiện ra một lần khi vào màn hình, dùng [`ui-animate`](./animate.md).

```js
import '@ui/motion';
import '@ui/motion/css';
```

| Element | Vai trò | Yêu cầu |
|---|---|---|
| `<ui-parallax>` | Container xác định vùng đo scroll và hover. | Bắt buộc cho cả hai element con. |
| `<ui-parallax-scroll>` | Nội suy keyframes theo tiến trình cuộn. | Cần `ui-keyframes`. |
| `<ui-parallax-hover>` | Dịch chuyển hoặc nghiêng theo vị trí con trỏ. | Cần nằm trong `ui-parallax`. |

## Bắt đầu với ảnh

Container cần có chiều cao để tạo quãng cuộn. `overflow: hidden` cắt phần ảnh di chuyển ra ngoài vùng hiển thị.

```html
<ui-parallax class="photo-section">
  <ui-parallax-scroll
    class="photo-section__image"
    ui-fit-content="false"
    ui-keyframes="{'0%': {y: -80, scale: 1.15}, '100%': {y: 80, scale: 1.05}}"
  >
    <img src="/images/coast.jpg" alt="Bờ biển" />
  </ui-parallax-scroll>
  <h2>Khám phá bờ biển</h2>
</ui-parallax>
```

```css
.photo-section { position: relative; height: 120vh; min-height: 600px; overflow: hidden; display: grid; place-items: center; }
.photo-section__image { position: absolute; inset: -10% 0; width: 100%; height: 120%; z-index: -1; }
.photo-section__image img { width: 100%; height: 100%; object-fit: cover; }
```

Đổi đường dẫn ảnh theo dự án của bạn. Gallery đi kèm có thêm ví dụ ảnh mở rộng theo scroll, ảnh nhiều lớp và ảnh kết hợp hover.

## Scroll keyframes: ảnh và chữ theo từng cảnh

Demo **Scroll keyframes** trong gallery là một section sticky cao `300vh` với hai nhịp nội dung. Ảnh nền bờ biển zoom chậm, ảnh hoa hiện dần ở nhịp sau; thẻ ảnh và tiêu đề di chuyển độc lập bằng `x`, `y`, `rotate`, `scale`, `opacity`. Các mốc chính nằm trong khoảng 25%–75% vì đây là phần quãng cuộn mà stage `100vh` đang sticky. Ảnh sử dụng các asset có sẵn trong gallery.

```html
<ui-parallax class="story" style="height: 300vh">
  <div class="story-stage">
    <ui-parallax-scroll ui-fit-content="false"
      ui-keyframes="{'25%': {scale: 1.15, y: -40}, '75%': {scale: 1, y: 35}}">
      <img src="/images/coast.jpg" alt="" />
    </ui-parallax-scroll>
    <ui-parallax-scroll
      ui-keyframes="{'25%': {y: 90, opacity: 0}, '34%': {y: 0, opacity: 1}, '48%': {y: -15, opacity: 1}, '58%': {y: -100, opacity: 0}}">
      <h2>Follow the quiet light.</h2>
    </ui-parallax-scroll>
  </div>
</ui-parallax>
```

```css
.story-stage { position: sticky; top: 0; height: 100vh; overflow: hidden; }
.story-stage img { width: 100%; height: 100%; object-fit: cover; }
```

Demo đầy đủ có hai lớp ảnh nền, hai thẻ ảnh, hai khối chữ và bố cục tĩnh hiển thị đủ nội dung khi người dùng bật reduced motion.

## Circular scroll

Demo **Circular scroll** trong gallery đặt tám `ui-parallax-scroll` trên một `offset-path` hình tròn. Container cao `480vh`; stage cao `100vh` và sticky. Mỗi thẻ cách nhau `360px` trên cung tròn. Một keyframe tùy chỉnh thay đổi quãng đường đi từ `0` đến `-2520px` (bảy khoảng cách giữa tám thẻ).

```html
<ui-parallax class="circular-scroll">
  <div class="circular-scroll-stage">
    <ui-parallax-scroll
      class="circular-scroll-item"
      ui-fit-content="false"
      style="--orbit-start: 0px"
      ui-keyframes="{'20%': {orbitShift: 0}, '70%': {orbitShift: -2520}}"
    >Ảnh 1</ui-parallax-scroll>
    <!-- Các item tiếp theo dùng --orbit-start: 360px, 720px, ... -->
  </div>
</ui-parallax>
```

```css
.circular-scroll { height: 480vh; }
.circular-scroll-stage { position: sticky; top: 0; height: 100vh; overflow: hidden; --radius: clamp(850px, 78vw, 1200px); --path: circle(var(--radius) at 50% calc(100% + var(--radius) - 50vh)); }
.circular-scroll-item { position: absolute; offset-path: var(--path); offset-distance: calc(-25% + var(--orbit-shift, 0px) + var(--orbit-start)); offset-rotate: auto; }
```

```js
document.querySelectorAll('.circular-scroll-item').forEach((item) => {
  item.customEffects(({ element, createValue, EMPTY }) => {
    const distance = createValue('orbitShift');
    if (distance !== EMPTY) element.style.setProperty('--orbit-shift', `${Number(distance)}px`);
  });
});
```

`ui-keyframes` là dữ liệu, không tính biểu thức JavaScript trong chuỗi. Vì vậy viết `-2520` thay cho `'360 * 7 * -1'`. Mỗi thẻ cần `--orbit-start` riêng. Demo có bố cục lưới thay thế khi trình duyệt không hỗ trợ `offset-path` hoặc người dùng bật reduced motion.

`offset-rotate: auto` cho thẻ xoay theo tiếp tuyến của đường tròn. Bán kính được giới hạn theo viewport để các thẻ bên cạnh nghiêng rõ hơn trong khi thẻ ở đỉnh cung vẫn gần như thẳng.

## Tiến trình scroll và keyframes

```html
<ui-parallax style="height: 200vh">
  <ui-parallax-scroll
    ui-keyframes="{
      '33.33%': { y: 0, scale: 1 },
      '100%': { y: 200, scale: 50 }
    }"
    ui-breakpoints="{
      1000: {
        '33.33%': { y: 0, scale: 1 },
        '100%': { y: 200, scale: 40 }
      }
    }"
  >
    <div>Scroll me</div>
  </ui-parallax-scroll>
</ui-parallax>
```

Tiến trình bằng **0%** khi cạnh trên `ui-parallax` chạm đáy viewport; bằng **100%** khi cạnh dưới container đi qua đỉnh viewport. Công thức là `(viewportHeight - containerTop) / (viewportHeight + containerHeight)`, giới hạn trong khoảng 0–1. Chẳng hạn container cao `200vh` sẽ đi từ 0% đến 100% trên quãng cuộn dài `300vh`.

`ui-keyframes` nhận các mốc từ `'0%'` đến `'100%'`. Giá trị giữa hai mốc được nội suy; trước mốc đầu và sau mốc cuối sẽ giữ giá trị gần nhất. Nếu thuộc tính thiếu ở một mốc, component dùng hai mốc gần nhất có khai báo thuộc tính đó. Số và chuỗi có cùng đơn vị (`px`, `%`, `vw`, `vh`, `deg`, `rem`, `em`) được nội suy; chuỗi khác đơn vị đổi tại mốc sau.

Chuỗi attribute chấp nhận JSON hoặc cú pháp object trong ví dụ (key không có dấu nháy, nháy đơn, dấu phẩy cuối). Nội dung được phân tích như dữ liệu, không chạy như JavaScript. Mỗi `ui-parallax-scroll` tìm `ui-parallax` gần nhất, kể cả khi có wrapper ở giữa. Khi dùng bên trong [`ui-scroll-y`](./scroll-y.md), có thể đặt `ui-parallax` trên `ui-scroll-y` để dùng chính container đó làm vùng đo.

### Responsive với breakpoints

Mỗi breakpoint là **chiều rộng viewport tối đa**. Khi nhiều breakpoint khớp, breakpoint nhỏ nhất được chọn. Keyframes của breakpoint **thay thế toàn bộ** keyframes gốc, nên hãy khai báo đủ mốc và thuộc tính cần dùng. Ngoài các breakpoint, component dùng `ui-keyframes` gốc.

```html
<ui-parallax-scroll
  ui-keyframes="{'0%': {y: 100, scale: 0.7}, '100%': {y: -100, scale: 1.4}}"
  ui-breakpoints="{
    600:  {'0%': {y: 40, scale: 0.9}, '100%': {y: -40, scale: 1.1}},
    1000: {'0%': {y: 70, scale: 0.8}, '100%': {y: -70, scale: 1.2}}
  }"
>Nội dung</ui-parallax-scroll>
```

### Thuộc tính của `ui-parallax-scroll`

| Thuộc tính | Kiểu | Mặc định | Tác dụng |
|---|---|---|---|
| `ui-keyframes` | object string | Bắt buộc | Các mốc phần trăm và giá trị cần nội suy. |
| `ui-breakpoints` | object string | — | Thay bộ keyframes theo viewport tối đa. |
| `ui-lerp-ease` | number | `0.08` | Hệ số bám theo scroll từ 0 đến 1; càng lớn càng ít trễ. Trên mobile tự dùng `1`. |
| `ui-backface-visibility` | CSS string | `hidden` | Giá trị CSS `backface-visibility` của element. |
| `ui-fit-content` | boolean | `true` | Đặt `width: fit-content`; dùng `"false"` cho ảnh cần rộng hết khung. |
| `ui-start` | arithmetic string | Khi container vào viewport | Vị trí cuộn tuyệt đối ứng với 0%. |
| `ui-end` | arithmetic string | Khi container ra khỏi viewport | Vị trí cuộn tuyệt đối ứng với 100%. |
| `ui-step-mode` | boolean | `false` | Giữ giá trị mốc hiện tại đến khi qua mốc tiếp theo, không nội suy. |
| `ui-mobile-disabled` | boolean | `false` | Tắt hiệu ứng scroll khi viewport rộng tối đa 767px. |

Thuộc tính boolean có thể viết chỉ bằng tên (`ui-step-mode`) hoặc đặt `"true"` / `"false"`. Để đổi keyframes sau khi đã render, cập nhật attribute; component sẽ đọc lại và tính lại hiệu ứng.

### Giá trị dùng trong keyframes

| Nhóm | Thuộc tính | Cách dùng |
|---|---|---|
| Vị trí | `x`, `y` | Số tính bằng `px`; chuỗi có thể dùng `px`, `%`, `vw`, `vh`, `rem`, `em`. |
| Biến đổi | `scale`, `scaleX`, `scaleY` | Hệ số không có đơn vị; `1` là kích thước gốc. |
| Góc | `rotate`, `rotateX`, `rotateY`, `skew`, `skewX`, `skewY` | Số tính bằng độ; chuỗi có thể ghi `deg`. |
| Hiển thị | `opacity`, `width`, `height`, `borderRadius` | `opacity` từ 0 đến 1; các kích thước dạng số tính bằng `px`. |
| Nền | `backgroundPositionY`, `backgroundSizeX`, `backgroundSizeY` | Số tính bằng `px`, hoặc chuỗi CSS phù hợp. |
| Filter | `brightness`, `hueRotate`, `contrast`, `blur`, `grayscale` | Giá trị CSS filter; số `hueRotate` tính bằng độ, số `blur` tính bằng `px`. |
| Media | `videoTime`, `groupImg` | Phần trăm từ 0 đến 100 của video hoặc dãy ảnh. |

Các transform và filter được ghi vào inline style của chính `ui-parallax-scroll`. Nếu cần giữ transform riêng trên nội dung, đặt transform đó ở element con. `videoTime` đặt `currentTime` cho video đầu tiên bên trong element (video cần metadata trước khi tua được). `groupImg` chọn một ảnh theo thứ tự DOM và ẩn các ảnh còn lại.

### Tự đặt điểm bắt đầu và kết thúc

`ui-start` và `ui-end` nhận biểu thức số học `+`, `-`, `*`, `/` và dấu ngoặc. Kết quả là vị trí `window.scrollY` tuyệt đối tính bằng pixel. Có thể dùng `offset`, `container.offsetTop`, `container.offsetHeight`, `window.innerHeight`, `window.innerWidth`, `window.scrollY`, `document.documentElement.clientHeight` và `document.documentElement.scrollHeight`. `offset` là vị trí đầu container trên trang.

```html
<ui-parallax-scroll
  ui-start="offset - window.innerHeight / 2"
  ui-end="offset + container.offsetHeight"
  ui-keyframes="{'0%': {opacity: 0}, '100%': {opacity: 1}}"
>Content</ui-parallax-scroll>
```

Nếu biểu thức không hợp lệ, tiến trình của element đó là 0 và console ghi lỗi. Function call, API khác và JavaScript tùy ý không được chạy.

### Video và dãy ảnh

`videoTime` từ 0 đến 100 đưa video từ đầu tới cuối. Dùng `preload="auto"` và bảo đảm metadata đã tải trước khi cần tua. Ví dụ sau tua video trong khoảng 25%–75% của quãng cuộn:

```html
<ui-parallax style="height: 300vh">
  <div class="sticky-stage">
    <ui-parallax-scroll ui-keyframes="{
      '25%': {videoTime: 0}, '75%': {videoTime: 100}, '100%': {videoTime: 100}
    }">
      <video src="/media/sequence.mp4" playsinline muted preload="auto"></video>
    </ui-parallax-scroll>
  </div>
</ui-parallax>
```

```css
.sticky-stage { position: sticky; top: 0; height: 100vh; display: grid; place-items: center; }
.sticky-stage video { width: 100%; max-height: 100vh; object-fit: cover; }
```

`groupImg` từ 0 đến 100 chọn lần lượt các `<img>` bên trong scroll element. Đặt ảnh theo thứ tự frame; component sẽ ẩn các frame còn lại. Với dãy dài, hãy cân nhắc dung lượng và mức preload.

```html
<ui-parallax style="height: 300vh">
  <div class="sticky-stage">
    <ui-parallax-scroll ui-keyframes="{
      '25%': {groupImg: 0}, '75%': {groupImg: 100}, '100%': {groupImg: 100}
    }">
      <img src="/frames/001.jpg" alt="" />
      <img src="/frames/002.jpg" alt="" />
      <img src="/frames/003.jpg" alt="" />
    </ui-parallax-scroll>
  </div>
</ui-parallax>
```

## Custom effect

Keyframe có thể chứa tên thuộc tính tùy ý. Gắn callback sau sự kiện `ui:parallax-scroll:init` để đọc giá trị đã nội suy bằng `createValue(name)`. Nếu thuộc tính vắng mặt, hàm trả về `EMPTY` (`''`).

```html
<ui-parallax style="height: 200vh">
  <ui-parallax-scroll class="custom" ui-keyframes="{'0%': {opacityCustom: 0}, '100%': {opacityCustom: 1}}">
    Custom content
  </ui-parallax-scroll>
</ui-parallax>
<script type="module">
  const element = document.querySelector('.custom');
  element.addEventListener('ui:parallax-scroll:init', () => {
    element.customEffects(({ element, createValue, EMPTY }) => {
      const opacity = createValue('opacityCustom');
      if (opacity !== EMPTY) element.style.opacity = String(opacity);
    });
  });
</script>
```

Callback nhận `{ element, createValue, EMPTY }` và chạy khi giá trị scroll cập nhật. Những inline style callback thay đổi được khôi phục khi scroll effect bị tắt hoặc element bị tháo khỏi DOM.

## Hover và 3D tilt

Vùng nhạy con trỏ là **toàn bộ `ui-parallax`**. Khi chuột đi từ giữa ra mép, hover element dịch tối đa `ui-strength / 2` pixel mỗi chiều. Với `ui-3d`, element dùng `perspective(900px)` và nghiêng tối đa `ui-strength × 0.12` độ mỗi trục. Chuyển động có transition 160ms; khi rời vùng, reset trong 300ms.

```html
<ui-parallax class="hover-area">
  <ui-parallax-hover ui-strength="40" ui-3d ui-inner-width="280px">
    <img src="/images/botanical.jpg" alt="Lá cây" />
  </ui-parallax-hover>
</ui-parallax>
```

```css
.hover-area { min-height: 360px; display: grid; place-items: center; }
.hover-area img { display: block; width: 100%; border-radius: 20px; }
```

| Thuộc tính | Kiểu | Mặc định | Tác dụng |
|---|---|---|---|
| `ui-strength` | number | `100` | Biên độ dịch chuyển; khi bật 3D, điều khiển góc nghiêng. |
| `ui-reset-position` | boolean | `true` | Trả về transform ban đầu khi chuột rời container; đặt `"false"` để giữ vị trí cuối. |
| `ui-3d` | boolean | `false` | Dùng xoay phối cảnh thay cho dịch chuyển. |
| `ui-inner-width` | CSS string | `fit-content` | Chiều rộng CSS của hover element, ví dụ `"100%"` hoặc `"280px"`. |

Để kết hợp scroll với hover, bọc `ui-parallax-hover` trong `ui-parallax-scroll`. Mỗi element điều khiển transform của riêng nó nên hai hiệu ứng chạy cùng lúc:

```html
<ui-parallax style="height: 160vh">
  <ui-parallax-scroll ui-keyframes="{'0%': {y: 80, scale: 0.8}, '100%': {y: -80, scale: 1.1}}">
    <ui-parallax-hover ui-strength="35" ui-3d>
      <img src="/images/botanical.jpg" alt="Lá cây" />
    </ui-parallax-hover>
  </ui-parallax-scroll>
</ui-parallax>
```

Hover không chạy trên viewport rộng tối đa 767px hoặc với pointer touch. Scroll vẫn chạy trên mobile trừ khi element có `ui-mobile-disabled`. Khi người dùng bật `prefers-reduced-motion: reduce`, cả scroll và hover đều ngừng; style do scroll component áp dụng được khôi phục.

## API và xử lý sự cố

| API | Cách dùng |
|---|---|
| `uiParallax.progress` | Tiến trình hiện tại từ 0 đến 1. |
| `uiParallax.refresh()` | Tính lại ngay sau khi đổi layout hoặc nội dung bằng JavaScript. |
| `scrollElement.customEffects(callback)` | Đăng ký callback cho thuộc tính keyframe tùy chỉnh. |
| `ui:parallax-scroll:init` | Sự kiện trên scroll element khi đã sẵn sàng đăng ký custom effect. |

- Không thấy hiệu ứng: kiểm tra đã import CSS, có `ui-parallax` cha, `ui-keyframes` hợp lệ, container có chiều cao/quãng cuộn, và thiết bị không bật reduced motion.
- Ảnh bị tràn: đặt `overflow: hidden` trên vùng cần cắt; dùng `ui-fit-content="false"` nếu scroll element phải phủ hết chiều rộng.
- Hover không phản hồi: dùng chuột trên màn hình rộng hơn 767px; thêm diện tích cho container.
- Scroll nặng với ảnh/video: ưu tiên ảnh kích thước phù hợp, tránh quá nhiều layer và dãy ảnh độ phân giải lớn cùng lúc.

## Photo scroll sections trong gallery

Gallery có ba ví dụ dùng ảnh nội bộ: ảnh bờ biển nhiều lớp, ảnh kiến trúc mở rộng, và ảnh lá cây kết hợp scroll với hover. Markup ở `html/src/main.ts`; ảnh ở `html/public/images`.

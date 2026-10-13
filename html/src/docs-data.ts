/**
 * Documentation metadata for all UI components.
 * Used to render in-app component documentation and API tables.
 */

export interface DocParam {
  readonly name: string;
  readonly type: string;
  readonly default?: string;
  readonly description: string;
}

export interface DocMethod {
  readonly name: string;
  readonly description: string;
}

export interface DocEvent {
  readonly name: string;
  readonly detail?: string;
  readonly description: string;
}

export interface DocCssVar {
  readonly name: string;
  readonly default: string;
  readonly description: string;
}

export interface ComponentDoc {
  readonly slug: string;
  readonly tagName: string;
  readonly name: string;
  readonly category: string;
  readonly summary: string;
  readonly usage: string;
  readonly attributes: readonly DocParam[];
  readonly methods?: readonly DocMethod[];
  readonly events?: readonly DocEvent[];
  readonly cssVars?: readonly DocCssVar[];
  readonly a11y?: string;
}

export const COMPONENT_DOCS: Record<string, ComponentDoc> = {
  'logo-assembly': {
    slug: 'logo-assembly', tagName: 'ui-logo-assembly', name: 'Logo Assembly', category: 'Advanced',
    summary: 'Build a colored logo from thousands of independently moving particles. Supports SVG, PNG, and WebP, pointer repulsion, explosion, and a continuous morph to a new logo.',
    usage: `<ui-logo-assembly ui-src="/logo.svg" ui-count="3600" ui-particle-size="1.7" ui-speed="2300" ui-attraction="0.024" ui-repel="3.2" aria-label="Animated brand logo"></ui-logo-assembly>`,
    attributes: [
      { name: 'ui-src', type: 'URL', default: 'built-in mark', description: 'SVG, PNG, or WebP logo. Transparent pixels are excluded; sampled particles retain source colors.' },
      { name: 'ui-count', type: 'number', default: '3600', description: 'Requested particles. Automatically capped at 1500 on narrow or touch screens.' },
      { name: 'ui-particle-size', type: 'number', default: '1.7', description: 'Particle size multiplier. At the default value, dot radius adapts to the opaque logo area and actual particle count to avoid gaps.' },
      { name: 'ui-color', type: 'CSS color', description: 'Optional particle color override. Omit to preserve logo colors.' },
      { name: 'ui-brightness', type: 'number', default: '1', description: 'Particle opacity and brightness multiplier.' },
      { name: 'ui-glow', type: 'number', default: '7', description: 'Glow strength on a sparse subset of particles.' },
      { name: 'ui-speed', type: 'milliseconds', default: '2300', description: 'Assembly and morph timing.' },
      { name: 'ui-attraction', type: 'number', default: '0.024', description: 'Spring force pulling particles toward their logo positions.' },
      { name: 'ui-repel', type: 'number', default: '3.2', description: 'Pointer repulsion strength.' },
      { name: 'ui-repel-radius', type: 'number (px)', default: '110', description: 'Radius around the pointer affected by repulsion.' },
      { name: 'ui-interaction', type: 'all | hover | click | none', default: 'all', description: 'Enabled pointer interactions.' },
      { name: 'ui-auto', type: 'boolean string', default: 'true', description: 'Set to false to assemble manually with assemble().' },
    ],
    methods: [
      { name: 'assemble()', description: 'Gather scattered or exploded particles into the logo.' },
      { name: 'scatter()', description: 'Return particles to the floating star field.' },
      { name: 'explode()', description: 'Burst the assembled logo and then automatically rebuild it.' },
      { name: 'setLogo(src)', description: 'Morph the existing particles into another logo URL.' },
      { name: 'loadFile(file)', description: 'Load a local SVG, PNG, or WebP file.' },
    ],
    events: [
      { name: 'ui:logo-assembly:ready', detail: '{ count }', description: 'A logo has been sampled into particles.' },
      { name: 'ui:logo-assembly:assemble', description: 'Particles start gathering into the logo.' },
      { name: 'ui:logo-assembly:assembled', description: 'The logo has completed its assembly.' },
      { name: 'ui:logo-assembly:scatter', description: 'Particles return to the star field.' },
      { name: 'ui:logo-assembly:explode', description: 'The explosion has started.' },
      { name: 'ui:logo-assembly:error', detail: '{ src | reason }', description: 'The image could not be loaded or sampled.' },
    ],
    cssVars: [{ name: '--ui-logo-assembly-height', default: '460px', description: 'Height of the particle field.' }],
    a11y: 'Give the logo an accessible label. Enter or Space triggers an explosion. Offscreen animation pauses; reduced motion shows an assembled, still logo.',
  },
  'swipeable-card-stack': {
    slug: 'swipeable-card-stack', tagName: 'ui-swipeable-card-stack', name: 'Swipeable Card Stack', category: 'Advanced',
    summary: 'Swipe the front card left or right to bring the next card forward. Supports pointer, touch, keyboard, and JavaScript control.',
    usage: `<ui-swipeable-card-stack class="ui-swipeable-card-stack--style-1" ui-items-to-show="4" ui-scale-threshold="0.1" ui-speed="400" ui-easing="decay">
  <div class="card">First card</div>
  <div class="card">Second card</div>
  <div class="card">Third card</div>
  <div class="card">Fourth card</div>
</ui-swipeable-card-stack>`,
    attributes: [
      { name: 'ui-items-to-show', type: 'number', default: '5', description: 'Maximum number of visible layers. Remaining cards wait behind the stack.' },
      { name: 'ui-scale-threshold', type: 'number', default: '0.1', description: 'Scale reduction per layer, clamped to keep cards legible.' },
      { name: 'ui-speed', type: 'milliseconds', default: '600', description: 'Swipe-out and return transition duration.' },
      { name: 'ui-easing', type: 'spring | decay | linear | ease | easeIn | easeOut | easeInOut', default: 'spring', description: 'Transition easing preset.' },
      { name: 'ui-style', type: '1 | 2 | 3', default: '1', description: 'Stack arrangement: offset right, offset downward, or scattered fan. The matching style class also works.' },
      { name: 'ui-active', type: 'boolean', description: 'Reflected on the current front card.' },
    ],
    methods: [
      { name: 'swipeLeft()', description: 'Animate the front card to the left and reveal the next card.' },
      { name: 'swipeRight()', description: 'Animate the front card to the right and reveal the next card.' },
      { name: 'goTo(index)', description: 'Advance in DOM order to a zero-based card index.' },
      { name: 'refresh()', description: 'Recount cards and update layers after changing content or layout.' },
    ],
    events: [{ name: 'ui:swipeable-card-stack:change', detail: '{ activeIndex, previousIndex, item, direction }', description: 'Emitted after a committed swipe.' }],
    cssVars: [
      { name: '--ui-stack-width', default: '300px', description: 'Stack width.' },
      { name: '--ui-stack-card-height', default: '400px', description: 'Minimum card height.' },
      { name: '--ui-layer', default: 'computed', description: 'Each card’s interpolated depth in the stack.' },
      { name: '--ui-interpolated', default: 'computed', description: 'Each card’s scale during drag.' },
    ],
    a11y: 'Focus the stack and use Left/Right arrows to advance. Only the front card is interactive; reduced motion removes transitions. Touch gestures preserve vertical page scrolling.',
  },
  'grid-hover-expand': {
    slug: 'grid-hover-expand', tagName: 'ui-grid-hover-expand', name: 'Grid Hover Expand', category: 'Advanced',
    summary: 'All cards start with equal widths. Hover or focus a card to expand it inside its own row.',
    usage: `<ui-grid-hover-expand ui-gap="0" style="--xs: 1; --sm: 1; --md: 3; --lg: 3">
  <div><img src="photo-1.jpg" alt="Coast" /></div>
  <div><img src="photo-2.jpg" alt="City" /></div>
  <div><img src="photo-3.jpg" alt="Garden" /></div>
</ui-grid-hover-expand>`,
    attributes: [
      { name: 'ui-active-index', type: 'number', description: 'Optional zero-based card to expand before hover or after the pointer leaves.' },
      { name: 'ui-duration', type: 'milliseconds', default: '200', description: 'Width transition duration.' },
      { name: 'ui-gap', type: 'number (px)', default: '20', description: 'Horizontal and vertical spacing. Set to 0 for cards that touch.' },
      { name: 'ui-active', type: 'boolean', description: 'Reflected on the expanded direct child.' },
    ],
    cssVars: [
      { name: '--xs / --sm / --md / --lg', default: '1', description: 'Columns at viewport widths below 576, 576+, 768+, and 992+ px.' },
      { name: '--ui-grid-hover-column-gap', default: '20px', description: 'Horizontal spacing between cards.' },
      { name: '--ui-grid-hover-row-gap', default: '20px', description: 'Vertical spacing between rows.' },
    ],
    a11y: 'Put a focusable link or button inside each card. Focusing it expands the card; touch layouts remain equal width.',
  },
  'dot-morph': {
    slug: 'dot-morph', tagName: 'ui-dot-morph', name: 'Dot Morph', category: 'Advanced',
    summary: 'Scatter particles randomly, then gather them into arbitrary text on hover, focus, or touch.',
    usage: `<ui-dot-morph ui-text='["CREATE","EXPLORE","INSPIRE"]' ui-duration="3000" ui-interval="1500"></ui-dot-morph>`,
    attributes: [
      { name: 'ui-text', type: 'JSON string[]', default: '["UI"]', description: 'Words formed in order while hovered. A single string also works.' },
      { name: 'ui-count', type: 'number', default: 'auto', description: 'Optional particle count (20–3200). By default, density adapts to the text size.' },
      { name: 'ui-duration', type: 'milliseconds', default: '900', description: 'Travel time into/out of the field and between words.' },
      { name: 'ui-interval', type: 'milliseconds', default: '1800', description: 'Time each completed word stays visible before moving to the next.' },
      { name: 'ui-active', type: 'boolean', description: 'Reflected while the text is formed.' },
    ],
    cssVars: [
      { name: '--ui-dot-height', default: '280px', description: 'Minimum height of the particle field.' },
      { name: '--ui-dot-color', default: '#fff', description: 'Particle and fallback text color.' },
      { name: '--ui-dot-glow', default: '#ffffff8a', description: 'Particle glow color.' },
    ],
    a11y: 'The component exposes the text as an accessible label. Keyboard focus forms the word, touch toggles it, and reduced motion shows readable static text.',
  },
  'orbit-gallery': {
    slug: 'orbit-gallery', tagName: 'ui-orbit-gallery', name: 'Orbit Gallery', category: 'Advanced',
    summary: 'Arrange image cards on a rotating 3D ring. Card count and positions update automatically when cards change.',
    usage: `<ui-orbit-gallery ui-duration="24000" aria-label="Photo gallery">
  <ui-orbit-gallery-track>
    <ui-orbit-gallery-item><img src="coast.jpg" alt="Coast" /></ui-orbit-gallery-item>
    <ui-orbit-gallery-item><img src="garden.jpg" alt="Garden" /></ui-orbit-gallery-item>
    <ui-orbit-gallery-item><img src="city.jpg" alt="City" /></ui-orbit-gallery-item>
  </ui-orbit-gallery-track>
</ui-orbit-gallery>`,
    attributes: [
      { name: 'ui-duration', type: 'milliseconds', default: '24000', description: 'Time for one full rotation.' },
      { name: 'ui-direction', type: 'normal | reverse', default: 'normal', description: 'Rotation direction.' },
    ],
    cssVars: [
      { name: '--ui-orbit-radius', default: '310px', description: 'Distance from the center to each card.' },
      { name: '--ui-orbit-card-width', default: '170px', description: 'Card width.' },
      { name: '--ui-orbit-card-height', default: '240px', description: 'Card height.' },
      { name: '--ui-orbit-tilt', default: '-12deg', description: 'Angle of the ring.' },
      { name: '--ui-orbit-height', default: '560px', description: 'Height of the gallery viewport.' },
    ],
    a11y: 'Give each image useful alt text and the gallery an accessible label. Animation pauses on hover or focus and stops when reduced motion is enabled.',
  },
  'expandable-grid': {
    slug: 'expandable-grid', tagName: 'ui-expandable-grid', name: 'Expandable Grid', category: 'Advanced',
    summary: 'Expand a card inside a responsive grid while the other cards animate to their new positions.',
    usage: `<ui-expandable-grid ui-duration="500">
  <ui-expandable-grid-item>
    <img src="photo.jpg" alt="Coastal landscape" />
    <button ui-expandable-grid-trigger type="button">Explore</button>
    <ui-expandable-grid-detail>More about this place</ui-expandable-grid-detail>
  </ui-expandable-grid-item>
</ui-expandable-grid>`,
    attributes: [
      { name: 'ui-duration', type: 'milliseconds', default: '500', description: 'Time for tile movement.' },
      { name: 'ui-easing', type: 'CSS easing', default: 'cubic-bezier(.22,1,.36,1)', description: 'Tile movement easing.' },
      { name: 'ui-active', type: 'boolean', description: 'Reflected on the expanded item.' },
    ],
    methods: [
      { name: 'open(index)', description: 'Expand an item by zero-based index.' },
      { name: 'close()', description: 'Close the active item.' },
      { name: 'toggle(index)', description: 'Toggle an item by zero-based index.' },
    ],
    events: [{ name: 'ui-expandable-grid-change', detail: '{ activeIndex, previousIndex, item }', description: 'Fired when the expanded item changes.' }],
    cssVars: [
      { name: '--ui-expandable-grid-columns', default: '3', description: 'Desktop column count.' },
      { name: '--ui-expandable-grid-gap', default: '16px', description: 'Gap between cards.' },
      { name: '--ui-expandable-grid-open-height', default: '480px', description: 'Minimum height of the expanded card.' },
    ],
    a11y: 'Use a real button with ui-expandable-grid-trigger in every card. Enter or Space opens it; Escape closes it and restores focus. Reduced motion skips tile animations.',
  },
  photoswipe: {
    slug: 'photoswipe',
    tagName: 'ui-photoswipe',
    name: 'PhotoSwipe',
    category: 'Media',
    summary: 'Open image links in a full-screen PhotoSwipe 5 gallery with zoom, swipe, and keyboard navigation. Assets load from a pinned CDN on first click.',
    usage: `<ui-photoswipe ui-options='{"bgOpacity":0.9,"loop":false}'>
  <a href="/images/coast.jpg" data-pswp-width="1672" data-pswp-height="941">
    <img src="/images/coast.jpg" alt="Coastal landscape" />
  </a>
  <a href="/images/botanical.jpg" data-pswp-width="1672" data-pswp-height="941">
    <img src="/images/botanical.jpg" alt="Botanical photograph" />
  </a>
</ui-photoswipe>`,
    attributes: [
      { name: 'ui-options', type: 'JSON object', default: '{}', description: 'PhotoSwipe options such as bgOpacity, loop, or wheelToZoom. Gallery and loader options are managed by the component.' },
      { name: 'data-pswp-width', type: 'positive number', description: 'Full-size image width on each link; required by PhotoSwipe.' },
      { name: 'data-pswp-height', type: 'positive number', description: 'Full-size image height on each link; required by PhotoSwipe.' },
    ],
    a11y: 'Image links remain ordinary links if PhotoSwipe cannot load. Use descriptive alt text on thumbnails. The lightbox supports keyboard navigation and honors reduced motion.',
  },
  toast: {
    slug: 'toast',
    tagName: 'ui-toast',
    name: 'Toast',
    category: 'Basic UI',
    summary: 'Show temporary notifications from JavaScript or a named HTML template, with placement and dismissal controls.',
    usage: `<!-- Simple text -->
uiToast('Đã thêm vào giỏ hàng!');

<!-- Rich HTML content (trusted strings only) -->
uiToast.push({
  content: '<strong>Thành công!</strong> Đơn hàng đã được đặt.',
  placement: 'top-right',
  delay: 3000,
  duration: 300,
  className: 'toast-success'
});

<!-- Named HTML template -->
<ui-toast ui-name="cart-toast" ui-placement="top-right" ui-delay="3000">
  <strong>Đã thêm vào giỏ hàng</strong>
</ui-toast>
<button onclick="uiToast.push({ name: 'cart-toast' })">Show toast</button>`,
    attributes: [
      { name: 'ui-name', type: 'string', description: 'Name of a reusable HTML toast template.' },
      { name: 'ui-placement', type: 'top-left | top-center | top-right | bottom-left | bottom-center | bottom-right', default: 'bottom-center', description: 'Screen edge or corner for the toast portal.' },
      { name: 'ui-duration', type: 'milliseconds', default: '200', description: 'Enter and exit animation duration.' },
      { name: 'ui-delay', type: 'milliseconds | Infinity', default: '2000', description: 'Time before automatic dismissal. Infinity requires manual closing.' },
      { name: 'ui-easing', type: 'decay | spring | CSS easing', default: 'decay', description: 'Animation timing function.' },
      { name: 'ui-class-name', type: 'string', default: '', description: 'Additional CSS classes on the visible toast.' },
      { name: 'ui-close-button-disabled', type: 'boolean', default: 'false', description: 'Hide the automatic close button.' },
      { name: 'ui-close-button-class-name', type: 'string', default: '', description: 'Additional classes on ui-toast-close-button.' },
      { name: 'ui-close-button-placement', type: 'top-right | top-left | center-right | center-left', default: 'top-right', description: 'Position of the close button inside the toast.' },
    ],
    methods: [
      { name: 'uiToast(text)', description: 'Show a plain-text notification.' },
      { name: 'uiToast.push(options)', description: 'Show a notification; returns the live ui-toast element.' },
      { name: 'uiToast.remove(name?)', description: 'Close notifications by name, or all visible notifications.' },
      { name: 'toast.closeToast()', description: 'Close a specific live toast.' },
    ],
    a11y: 'Live notifications use role="status" and polite announcements by default. The close button is keyboard accessible. Reduced motion removes enter and exit animation.',
  },
  typing: {
    slug: 'typing',
    tagName: 'ui-typing',
    name: 'Typing',
    category: 'Motion',
    summary: 'Rotate short headline phrases with typewriter, vertical slide, or SVG goo morph effects.',
    usage: `<h1>
  Chúng tôi tạo
  <ui-typing
    ui-effect="typing"
    ui-content='["website đẹp", "trải nghiệm tuyệt vời", "sản phẩm số"]'
    ui-duration="80"
    ui-delay="2000"
    ui-cursor-char="|"
  ></ui-typing>
</h1>`,
    attributes: [
      { name: 'ui-content', type: 'JSON string[]', default: '[]', description: 'Words or short phrases to rotate. Invalid JSON renders no text.' },
      { name: 'ui-effect', type: 'typing | slide | goo', default: 'typing', description: 'Typewriter with cursor, vertical sliding, or SVG-filtered goo morph.' },
      { name: 'ui-duration', type: 'milliseconds', default: '100 / 300 / 1000', description: 'Time per character for typing, or transition time for slide / goo.' },
      { name: 'ui-delay', type: 'milliseconds', default: '2000', description: 'Pause between completed phrases.' },
      { name: 'ui-cursor-char', type: 'string', default: '|', description: 'Cursor character shown by the typing effect only.' },
    ],
    a11y: 'The current complete phrase is exposed as an accessible label. Reduced motion shows the first phrase as static text without a cursor or timers.',
  },
  cursor: {
    slug: 'cursor',
    tagName: 'ui-cursor',
    name: 'Cursor',
    category: 'Motion',
    summary: 'Make an item follow the pointer inside a region, with smoothing, hover states, split names and distortion presets.',
    usage: `<ui-cursor ui-name="gallery" ui-lerp-ease="0.12" ui-distortion="distortion-2">
  <a href="#">Explore</a>
  <div ui-cursor-disabled>Native cursor here</div>
  <ui-cursor-item ui-name="gallery">View</ui-cursor-item>
</ui-cursor>

<!-- Equivalent div syntax -->
<div is="ui-cursor" ui-name="['prev','next']">
  <ui-cursor-item ui-name="prev">←</ui-cursor-item>
  <ui-cursor-item ui-name="next">→</ui-cursor-item>
</div>`,
    attributes: [
      { name: 'ui-name', type: 'string | [string,string]', description: 'Name of the item; two names choose left or right half of the region.' },
      { name: 'ui-absolute', type: 'boolean', default: 'false', description: 'Position a child item relative to the region instead of the viewport.' },
      { name: 'ui-lerp-ease', type: 'number', default: '0.1', description: 'Pointer-following speed from 0.01 to 1.' },
      { name: 'ui-distortion', type: 'none | distortion-2…5', default: 'none', description: 'Shape response to pointer velocity; skipped on Safari 19 and older.' },
      { name: 'ui-mobile-disabled', type: 'boolean', default: 'false', description: 'Disable the custom cursor on narrow or coarse-pointer devices.' },
    ],
    a11y: 'Decorative cursor items ignore pointer events. The native cursor remains on touch devices and in disabled zones; reduced motion disables the custom effect.',
  },
  'scroll-scene': {
    slug: 'scroll-scene',
    tagName: 'ui-scroll-scene',
    name: 'Scroll Scene',
    category: 'Motion',
    summary: 'Switch full-screen sticky scenes as the page scrolls, with configurable viewport-height steps and accessible keyboard navigation.',
    usage: `<ui-scroll-scene ui-threshold="0.5" ui-mobile-disabled ui-mobile-breakpoint="768">
  <ui-scroll-scene-inner>
    <ui-scroll-scene-item><div class="scene">Scene 1</div></ui-scroll-scene-item>
    <ui-scroll-scene-item><div class="scene">Scene 2</div></ui-scroll-scene-item>
    <ui-scroll-scene-item><div class="scene">Scene 3</div></ui-scroll-scene-item>
  </ui-scroll-scene-inner>
</ui-scroll-scene>`,
    attributes: [
      { name: 'ui-threshold', type: 'positive number', default: '0.5', description: 'Viewport-height fraction scrolled before activating the next scene.' },
      { name: 'ui-mobile-disabled', type: 'boolean', default: 'false', description: 'Show scenes as a normal vertical stack on mobile.' },
      { name: 'ui-mobile-breakpoint', type: 'number', default: '0', description: 'Viewport width in px for mobile mode. At 0, a coarse pointer determines mobile mode.' },
      { name: 'ui-active / ui-prev / ui-next', type: 'reactive', description: 'Marks the active scene and its immediate neighbours.' },
      { name: 'ui-direction / ui-ready', type: 'reactive', description: 'Scroll direction on the root, and true after initialization.' },
    ],
    methods: [{ name: 'refresh()', description: 'Recount scenes and recalculate the scroll distance.' }],
    events: [{ name: 'ui:scroll-scene:change', detail: '{ activeIndex, previousIndex, direction }', description: 'Fires when scrolling activates another scene.' }],
    a11y: 'Inactive scenes are inert. Each scene gets a keyboard focus target; use arrow keys or Home/End to navigate. Reduced motion and disabled mobile mode show a readable vertical stack.',
  },
  'scroll-y': {
    slug: 'scroll-y',
    tagName: 'ui-scroll-y',
    name: 'Scroll Y',
    category: 'Motion',
    summary: 'Full-screen panels rise from the viewport bottom after the section reaches the top. Includes scroll inertia and optional nested parallax effects.',
    usage: `<ui-scroll-y ui-parallax>
  <ui-scroll-y-item><div class="panel">First scene</div></ui-scroll-y-item>
  <ui-scroll-y-item>
    <ui-parallax-scroll ui-keyframes="{'0%': {scale: 1}, '100%': {scale: 1.2}}">
      <div class="panel">Second scene</div>
    </ui-parallax-scroll>
  </ui-scroll-y-item>
  <ui-scroll-xy-item><div class="panel">Third scene</div></ui-scroll-xy-item>
</ui-scroll-y>`,
    attributes: [
      { name: 'ui-lerp-ease', type: 'number', default: '0.12', description: 'Panel scroll inertia from 0 to 1. Higher values follow scrolling more closely; 1 disables smoothing.' },
      { name: 'ui-parallax', type: 'boolean', default: 'false', description: 'Allow nested ui-parallax-scroll and ui-parallax-hover children to use this container for their keyframes.' },
      { name: '--ui-scroll-y-background', type: 'CSS variable', default: 'transparent', description: 'Background behind panels as they slide into view.' },
      { name: '--ui-scroll-y-count', type: 'CSS variable', default: 'panel count', description: 'Controls the automatic section height of N × 110vh.' },
    ],
    methods: [{ name: 'refresh()', description: 'Recount panels and recalculate panel and nested parallax progress.' }],
    a11y: 'The first panel remains visible before scrolling starts. Inactive panels are inert. Reduced motion displays every panel in a normal vertical stack.',
  },
  'scroll-x': {
    slug: 'scroll-x',
    tagName: 'ui-scroll-x',
    name: 'Scroll X',
    category: 'Motion',
    summary: 'The first panel is visible immediately. Later full-screen panels reveal with inertia after the section reaches the viewport top.',
    usage: `<ui-scroll-x>
  <ui-scroll-x-item><div class="panel">First scene</div></ui-scroll-x-item>
  <ui-scroll-x-item><div class="panel">Second scene</div></ui-scroll-x-item>
  <ui-scroll-xy-item><div class="panel">Third scene</div></ui-scroll-xy-item>
</ui-scroll-x>`,
    attributes: [
      { name: 'ui-lerp-ease', type: 'number', default: '0.12', description: 'Scroll inertia from 0 to 1. Higher values follow scrolling more closely; 1 disables smoothing.' },
      { name: '--ui-scroll-x-background', type: 'CSS variable', default: 'transparent', description: 'Background shown behind a panel while its width is opening.' },
      { name: '--ui-scroll-x-panel-width', type: 'CSS variable', default: 'container width', description: 'Width of each panel’s immediate child, so its content does not shrink during the reveal.' },
    ],
    methods: [{ name: 'refresh()', description: 'Recount panels and update their widths after a layout change.' }],
    a11y: 'Panels are revealed in DOM order. Inactive panels are inert. With reduced motion, the panels become a normal vertical stack.',
  },
  parallax: {
    slug: 'parallax',
    tagName: 'ui-parallax',
    name: 'Parallax',
    category: 'Motion',
    summary: 'Animate scroll keyframes, images, video, and pointer movement inside a measured container. Scroll and hover can be nested.',
    usage: `<ui-parallax style="height: 160vh; overflow: hidden">
  <ui-parallax-scroll ui-fit-content="false"
    ui-keyframes="{'0%': {y: 80, scale: .8}, '100%': {y: -80, scale: 1.1}}">
    <ui-parallax-hover ui-strength="35" ui-3d>
      <img src="/images/botanical.jpg" alt="Botanical" />
    </ui-parallax-hover>
  </ui-parallax-scroll>
</ui-parallax>`,
    attributes: [
      { name: 'ui-keyframes', type: 'object string', default: 'required', description: 'Scroll: percentage keyframes from 0% to 100%. Supports transforms, opacity, dimensions, filters, videoTime, and groupImg.' },
      { name: 'ui-breakpoints', type: 'object string', default: '—', description: 'Scroll: complete keyframe replacements keyed by maximum viewport width. Smallest matching breakpoint wins.' },
      { name: 'ui-lerp-ease', type: 'number', default: '0.08', description: 'Scroll: smoothing from 0 to 1; higher values follow the scroll more closely. Becomes 1 on mobile.' },
      { name: 'ui-backface-visibility', type: 'CSS string', default: 'hidden', description: 'Scroll: backface-visibility of the animated element.' },
      { name: 'ui-fit-content', type: 'boolean', default: 'true', description: 'Scroll: set width to fit-content. Use false for a full-width image layer.' },
      { name: 'ui-start', type: 'arithmetic string', default: 'container entry', description: 'Scroll: absolute page position for 0%. Accepts offset, container dimensions, and viewport variables.' },
      { name: 'ui-end', type: 'arithmetic string', default: 'container exit', description: 'Scroll: absolute page position for 100%. Uses the same arithmetic syntax as ui-start.' },
      { name: 'ui-step-mode', type: 'boolean', default: 'false', description: 'Scroll: hold each value until the next keyframe rather than interpolating.' },
      { name: 'ui-mobile-disabled', type: 'boolean', default: 'false', description: 'Scroll: disable the effect when the viewport is 767px wide or narrower.' },
      { name: 'ui-strength', type: 'number', default: '100', description: 'Hover: movement range in pixels, or tilt strength with ui-3d.' },
      { name: 'ui-reset-position', type: 'boolean', default: 'true', description: 'Hover: return to the original transform when the pointer leaves.' },
      { name: 'ui-3d', type: 'boolean', default: 'false', description: 'Hover: rotate with perspective instead of translating.' },
      { name: 'ui-inner-width', type: 'CSS string', default: 'fit-content', description: 'Hover: width of the animated element, such as 100% or 280px.' },
    ],
    methods: [
      { name: 'refresh()', description: 'Recalculate parent progress and all children.' },
      { name: 'customEffects(callback)', description: 'Apply custom interpolated keyframe properties on a scroll child.' },
    ],
    events: [{ name: 'ui:parallax-scroll:init', detail: 'void', description: 'Scroll child is ready for custom effects.' }],
    a11y: 'Scroll progress is 0% when the container enters from the viewport bottom and 100% when it leaves at the top. Scroll and hover stop for reduced motion. Hover is disabled on touch and viewports up to 767px. See the Parallax docs for complete examples and keyframe properties.',
  },
  carousel: {
    slug: 'carousel',
    tagName: 'ui-carousel',
    name: 'Carousel',
    category: 'Advanced',
    summary: 'Composable carousel with slide, thumbnail, arrow, and pagination elements. Supports responsive layouts, drag, autoplay, and transition variants.',
    usage: `<ui-carousel ui-per-view="1" ui-render-bullet="<span></span>">
  <ui-carousel-inner>
    <ui-carousel-list>
      <ui-carousel-slide>Slide 1</ui-carousel-slide>
      <ui-carousel-slide>Slide 2</ui-carousel-slide>
      <ui-carousel-slide>Slide 3</ui-carousel-slide>
    </ui-carousel-list>
  </ui-carousel-inner>
  <ui-carousel-prev><button>Prev</button></ui-carousel-prev>
  <ui-carousel-next><button>Next</button></ui-carousel-next>
  <ui-carousel-pagination></ui-carousel-pagination>
</ui-carousel>`,
    attributes: [
      { name: 'ui-name', type: 'string', default: '—', description: 'Carousel identifier.' },
      { name: 'ui-active-index', type: 'number', default: '0', description: 'Active slide, starting at zero.' },
      { name: 'ui-per-view', type: 'number', default: '1', description: 'Visible slides.' },
      { name: 'ui-per-move', type: 'number', default: '1', description: 'Slides advanced per step.' },
      { name: 'ui-gap', type: 'number', default: '20', description: 'Gap in pixels.' },
      { name: 'ui-speed', type: 'number', default: '200', description: 'Transition duration in milliseconds.' },
      { name: 'ui-autoplay', type: 'number', default: '0', description: 'Autoplay interval in milliseconds; 0 disables it.' },
      { name: 'ui-autoheight', type: 'boolean', default: 'false', description: 'Match the visible slide height.' },
      { name: 'ui-hover-pause', type: 'boolean', default: 'true', description: 'Pause autoplay on hover.' },
      { name: 'ui-overflow', type: "'visible' | 'hidden'", default: "'hidden'", description: 'Inner viewport overflow.' },
      { name: 'ui-vertical', type: 'boolean', default: 'false', description: 'Use a vertical track.' },
      { name: 'ui-rewind', type: 'boolean', default: 'false', description: 'Return to the other end at a boundary.' },
      { name: 'ui-rtl', type: 'boolean', default: 'document direction', description: 'Right-to-left navigation.' },
      { name: 'ui-render-bullet', type: 'HTML string', default: '—', description: 'Pagination bullet content.' },
      { name: 'ui-breakpoints', type: 'string', default: '—', description: 'Container width overrides; accepts JSON or the documented object-literal form.' },
      { name: 'ui-type', type: 'string', default: "'slide'", description: 'slide, fade, none, nature, water, urban, or wind.' },
      { name: 'ui-loop', type: 'boolean', default: 'false', description: 'Continuous slide transitions with inert end clones; disabled with thumbnails or when all slides fit.' },
      { name: 'ui-column-width', type: 'number', default: '0', description: 'Calculate visible columns from width.' },
      { name: 'ui-easing', type: 'string', default: "'easeOutQuad'", description: 'Transition easing.' },
      { name: 'ui-draggable', type: 'boolean', default: 'true', description: 'Enable pointer drag and swipe.' },
      { name: 'ui-stop-autoplay-on-interaction', type: 'boolean', default: 'false', description: 'Stop autoplay after interaction.' },
      { name: 'ui-progress', type: 'boolean', default: 'false', description: 'Expose --ui-carousel-autoplay-progress.' },
      { name: 'ui-sync-id', type: 'string', default: '—', description: 'Synchronize carousels with the same ID.' },
      { name: 'ui-media-lazyload', type: 'boolean', default: 'true', description: 'Load slide media as it becomes visible.' },
      { name: 'ui-observed', type: 'string', default: '—', description: 'Change to refresh the carousel.' },
    ],
    methods: [
      { name: 'next()', description: 'Advance to the next slide.' },
      { name: 'prev()', description: 'Go back to the previous slide.' },
      { name: 'goto(index: number)', description: 'Jump directly to the specified zero-based slide index.' },
    ],
    events: [
      { name: 'ui-carousel:change', detail: '{ index: number }', description: 'Dispatched when active slide changes.' },
    ],
    a11y: 'Full keyboard navigation with Left and Right arrow keys, WAI-ARIA tab/slide semantics, prefers-reduced-motion support.',
  },

  modal: {
    slug: 'modal',
    tagName: 'ui-modal',
    name: 'Modal',
    category: 'Basic UI',
    summary: 'Named modal, drawer, or lightbox with shadow DOM backdrop, responsive options, touch dismissal, focus management and animation variants.',
    usage: `<ui-modal-trigger ui-name="contact"><button>Open modal</button></ui-modal-trigger>
<ui-modal ui-name="contact" ui-animate="fade-up" ui-placement="center">
  <div>
    <ui-modal-trigger><button aria-label="Close">×</button></ui-modal-trigger>
    <h2>Contact</h2>
    <ui-modal-pan>Swipe down to close</ui-modal-pan>
  </div>
</ui-modal>`,
    attributes: [
      { name: 'open', type: 'boolean', default: 'false', description: 'Controls open state. Reflects to attribute.' },
      { name: 'dismissable', type: 'boolean', default: 'true', description: 'Allows closing by clicking the overlay or pressing Escape.' },
      { name: 'ui-name', type: 'string', description: 'Connects an external ui-modal-trigger to this modal.' },
      { name: 'ui-animate', type: 'zoom | smart-zoom | fade | smart-fade-zoom | fade-* | slide-* | none', default: 'smart-fade-zoom', description: 'Entry and exit animation.' },
      { name: 'ui-placement', type: 'center | top-* | bottom-*', default: 'center', description: 'Dialog alignment. Corner and edge placements support drawers.' },
      { name: 'ui-duration', type: 'number (ms)', default: '300', description: 'Time for opening and closing transitions.' },
      { name: 'ui-easing', type: 'string', default: 'decay', description: 'Named easing curve, including spring.' },
      { name: 'ui-backdrop-color', type: 'CSS color', default: 'rgba(12,18,32,.48)', description: 'Backdrop color.' },
      { name: 'ui-backdrop-blur', type: 'number (px)', default: '10', description: 'Blur radius behind the modal.' },
      { name: 'ui-backdrop-disabled', type: 'boolean', default: 'false', description: 'Hides the backdrop.' },
      { name: 'ui-portal', type: 'boolean', default: 'true', description: 'Uses the Popover API top layer when available.' },
      { name: 'ui-disabled', type: 'boolean', default: 'false', description: 'Shows content inline and disables modal behavior.' },
      { name: 'ui-scroll-disabled', type: 'boolean', default: 'true', description: 'Locks page scroll while open.' },
      { name: 'ui-autofocus', type: 'boolean', default: 'false', description: 'Focuses the first form field after opening.' },
      { name: 'ui-video-autoplay', type: 'boolean', default: 'false', description: 'Plays contained videos when open and pauses on close.' },
      { name: 'ui-breakpoints', type: 'object string', default: '{}', description: 'Max-width overrides for placement, animation, duration, easing, disabled and backdrop settings.' },
      { name: 'ui-esc-close-disabled', type: 'boolean', default: 'false', description: 'Disables Escape dismissal.' },
      { name: 'ui-backdrop-close-disabled', type: 'boolean', default: 'false', description: 'Disables backdrop click dismissal.' },
    ],
    methods: [
      { name: 'openModal(trigger?)', description: 'Opens the modal, optionally animating from a trigger element.' },
      { name: 'closeModal()', description: 'Closes the modal.' },
      { name: 'toggle()', description: 'Toggles between open and closed states.' },
      { name: 'refresh()', description: 'Recomputes responsive options.' },
    ],
    events: [
      { name: 'ui-modal-open', detail: 'void', description: 'Fired when the modal opens.' },
      { name: 'ui-modal-close', detail: 'void', description: 'Fired when the modal closes.' },
    ],
    cssVars: [
      { name: '--ui-modal-width', default: '90vw', description: 'Maximum dialog box width.' },
      { name: '--ui-modal-padding', default: '24px', description: 'Dialog inner padding.' },
    ],
    a11y: 'role="dialog" and aria-modal="true" set automatically. Focus trap keeps keyboard focus inside. Page scrolling is locked without shifting the background, and focus returns to the previous element on close.',
  },

  drawer: {
    slug: 'drawer',
    tagName: 'ui-drawer',
    name: 'Drawer',
    category: 'Basic UI',
    summary: 'Slide-in side panel with smooth cubic-bezier transitions, backdrop blur overlay, scroll lock, and keyboard focus trapping.',
    usage: `<button id="open-drawer">Open Menu</button>

<ui-drawer placement="left" id="my-drawer">
  <button data-drawer-close>✕ Close</button>
  <h2>Navigation</h2>
  <ul>
    <li><a href="#home">Home</a></li>
    <li><a href="#settings">Settings</a></li>
  </ul>
</ui-drawer>`,
    attributes: [
      { name: 'open', type: 'boolean', default: 'false', description: 'Whether the drawer is visible.' },
      { name: 'placement', type: "'left' | 'right'", default: "'left'", description: 'Edge of screen to slide out from.' },
    ],
    methods: [
      { name: 'openDrawer()', description: 'Opens drawer with snappy slide-in animation.' },
      { name: 'closeDrawer()', description: 'Closes drawer with slide-out animation.' },
      { name: 'toggle()', description: 'Toggles open/close state.' },
    ],
    events: [
      { name: 'ui-drawer-open', detail: 'void', description: 'Fired when drawer begins opening.' },
      { name: 'ui-drawer-close', detail: 'void', description: 'Fired when drawer begins closing.' },
    ],
    cssVars: [
      { name: '--ui-drawer-duration', default: '280ms', description: 'Slide transition speed.' },
      { name: '--ui-drawer-size', default: '320px', description: 'Drawer width on screen.' },
    ],
    a11y: 'Automatically injects and cleans up a backdrop element. Traps focus and dismisses on Escape or overlay click.',
  },

  animate: {
    slug: 'animate',
    tagName: 'ui-animate',
    name: 'Animate',
    category: 'Motion',
    summary: 'Scroll-triggered entrance animation engine with 15 built-in presets: fade, fade-up, fade-down, slide, zoom, blur, rotate.',
    usage: `<ui-animate effect="fade-up" threshold="0.2">
  <div class="card">Reveals when scrolled into view</div>
</ui-animate>`,
    attributes: [
      { name: 'effect', type: 'string', default: "'fade-up'", description: 'Animation preset (fade, fade-up, zoom-in, scale-up, blur, rotate, etc).' },
      { name: 'duration', type: 'number', default: '500', description: 'Animation duration in ms.' },
      { name: 'delay', type: 'number', default: '0', description: 'Delay in ms before starting animation.' },
      { name: 'threshold', type: 'number', default: '0.2', description: 'IntersectionObserver threshold (0.0 to 1.0).' },
      { name: 'once', type: 'boolean', default: 'true', description: 'Whether to animate only once or repeat on every view.' },
    ],
    methods: [
      { name: 'play()', description: 'Reveals immediately, bypassing viewport detection.' },
      { name: 'reset()', description: 'Resets to hidden state and re-arms the observer.' },
    ],
    events: [
      { name: 'ui-animate-reveal', detail: '{ entry }', description: 'Fired when entering viewport.' },
      { name: 'ui-animate-reset', detail: 'void', description: 'Fired when reset.' },
    ],
  },

  toggle: {
    slug: 'toggle',
    tagName: 'ui-toggle',
    name: 'Toggle',
    category: 'Basic UI',
    summary: 'Accessible toggle panel / switch with trigger button, click-outside-to-close dropdown behavior, portal floating mode, responsive breakpoints, focus trap, and Escape key dismissal.',
    usage: `<!-- Trigger -->
<ui-toggle-trigger name="menu">
  <button>Toggle Menu</button>
</ui-toggle-trigger>

<!-- Content panel -->
<ui-toggle name="menu" outside-click-enabled autofocus>
  <nav>
    <a href="/page-1">Page 1</a>
    <a href="/page-2">Page 2</a>
  </nav>
</ui-toggle>`,
    attributes: [
      { name: 'name', type: 'string', default: "''", description: 'Identifier synced with <ui-toggle-trigger>.' },
      { name: 'active', type: 'boolean', default: 'false', description: 'Reflects open/active state (supports two-way binding).' },
      { name: 'autofocus', type: 'boolean', default: 'false', description: 'Automatically focus first input or link when opened.' },
      { name: 'outside-click-enabled', type: 'boolean', default: 'false', description: 'Automatically close when clicking outside the panel.' },
      { name: 'portal', type: 'boolean', default: 'false', description: 'Teleport panel to body or parent for floating overlay.' },
      { name: 'parent-selector', type: 'string', default: "''", description: 'Selector of parent element for relative positioning.' },
      { name: 'breakpoints', type: 'string (JSON)', default: '—', description: 'Responsive breakpoints to toggle attributes like portal.' },
    ],
    methods: [
      { name: 'open()', description: 'Open the toggle content.' },
      { name: 'close()', description: 'Close the toggle content.' },
      { name: 'toggle()', description: 'Flips active state.' },
    ],
    events: [
      { name: 'ui-toggle:open', detail: 'void', description: 'Fired when opened.' },
      { name: 'ui-toggle:close', detail: 'void', description: 'Fired when closed.' },
      { name: 'ui-toggle-change', detail: '{ checked: boolean }', description: 'Fired when state changes.' },
    ],
    a11y: 'Full keyboard support (Escape to close, focus trap when portal enabled, Space/Enter trigger).',
  },

  collapse: {
    slug: 'collapse',
    tagName: 'ui-collapse',
    name: 'Collapse',
    category: 'Basic UI',
    summary: 'Hardware-accelerated height transition from 0 to auto, standalone triggers with active-binding (selector[attribute]), rich easing curves via @ui/tokens, and accordion mode via <ui-collapse-provider>.',
    usage: `<ui-collapse-trigger name="faq-1" active-binding="button[data-state], .icon[rotate]">
  <button type="button">
    <span>FAQ Question 1</span>
    <span class="icon">▼</span>
  </button>
</ui-collapse-trigger>

<ui-collapse name="faq-1" duration="300" easing="decay">
  <div class="content">Smooth animated height content from 0 to auto.</div>
</ui-collapse>`,
    attributes: [
      { name: 'name', type: 'string', default: "''", description: 'Identifier synced with <ui-collapse-trigger>.' },
      { name: 'duration', type: 'number', default: '300', description: 'Transition duration in milliseconds.' },
      { name: 'easing', type: 'string', default: "'decay'", description: 'Easing curve (decay, easeOutQuad, spring, easeOutBounce, etc.).' },
      { name: 'active', type: 'boolean', default: 'false', description: 'Whether section is expanded (reflects aria-hidden).' },
      { name: 'observed', type: 'string', default: '—', description: 'Reinitialize collapse when value changes.' },
    ],
    methods: [
      { name: 'open()', description: 'Expands the collapse content.' },
      { name: 'close()', description: 'Collapses the content to height 0.' },
      { name: 'toggle()', description: 'Toggles between open and collapsed states.' },
    ],
    events: [
      { name: 'ui-collapse:open', detail: '{ name, id }', description: 'Fired when expansion animation completes.' },
      { name: 'ui-collapse:close', detail: '{ name, id }', description: 'Fired when collapse animation completes.' },
      { name: 'ui-collapse-toggle', detail: '{ open: boolean }', description: 'Fired immediately when toggle command is triggered.' },
    ],
  },

  accordion: {
    slug: 'accordion',
    tagName: 'ui-accordion',
    name: 'Accordion',
    category: 'Basic UI',
    summary: 'Accordion provider container managing child collapses with single-open mode (opening one closes others), auto-generated sequential names, duration inheritance, and scroll-to-header.',
    usage: `<ui-collapse-provider duration="300" scroll scroll-offset="60">
  <ui-collapse-trigger active>
    <div class="header">Section 1</div>
  </ui-collapse-trigger>
  <ui-collapse active>
    <div>Content 1</div>
  </ui-collapse>

  <ui-collapse-trigger>
    <div class="header">Section 2</div>
  </ui-collapse-trigger>
  <ui-collapse>
    <div>Content 2</div>
  </ui-collapse>
</ui-collapse-provider>`,
    attributes: [
      { name: 'duration', type: 'number', default: '300', description: 'Transition duration propagated to child collapses.' },
      { name: 'scroll', type: 'boolean', default: 'false', description: 'Automatically scroll opened header into view after animation.' },
      { name: 'scroll-offset', type: 'number', default: '0', description: 'Pixel offset to account for sticky headers when scrolling.' },
      { name: 'multiple', type: 'boolean', default: 'false', description: 'Allow multiple panels to remain open simultaneously.' },
      { name: 'observed', type: 'string', default: '—', description: 'Re-sync all children when value changes.' },
    ],
    events: [
      { name: 'ui-accordion-change', detail: '{ openCount: number }', description: 'Dispatched when number of open panels changes.' },
    ],
  },

  tabs: {
    slug: 'tabs',
    tagName: 'ui-tabs',
    name: 'Tabs',
    category: 'Basic UI',
    summary: 'Accessible tabbed interface following WAI-ARIA specs with arrow-key roving tabindex, Home/End support, and panel visibility control.',
    usage: `<ui-tabs>
  <div role="tablist">
    <button role="tab" id="t1" aria-controls="p1">Overview</button>
    <button role="tab" id="t2" aria-controls="p2">Specs</button>
  </div>
  <div role="tabpanel" id="p1" aria-labelledby="t1">Overview content</div>
  <div role="tabpanel" id="p2" aria-labelledby="t2">Specs technical data</div>
</ui-tabs>`,
    attributes: [
      { name: 'value', type: 'string', default: "''", description: 'ID of active tab (defaults to first).' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Keyboard navigation orientation.' },
    ],
    events: [
      { name: 'ui-tabs-change', detail: '{ value: string }', description: 'Fired when active tab changes.' },
    ],
    a11y: 'Full roving tabindex. Arrow keys navigate tabs. Home and End jump to start and end.',
  },

  popover: {
    slug: 'popover',
    tagName: 'ui-popover',
    name: 'Popover',
    category: 'Basic UI',
    summary: 'Floating layer anchored to a trigger element with automatic placement and click-outside dismissal.',
    usage: `<ui-popover placement="bottom">
  <button data-popover-trigger>Open Menu</button>
  <div data-popover-content>
    <strong>Popover Menu</strong>
    <p>Anchored floating content.</p>
  </div>
</ui-popover>`,
    attributes: [
      { name: 'open', type: 'boolean', default: 'false', description: 'Visibility state.' },
      { name: 'placement', type: "'top' | 'right' | 'bottom' | 'left'", default: "'bottom'", description: 'Anchor placement side.' },
    ],
  },

  tooltip: {
    slug: 'tooltip',
    tagName: 'ui-tooltip',
    name: 'Tooltip',
    category: 'Basic UI',
    summary: 'Short text hint on hover, keyboard focus, or tap. The floating content follows its trigger and stays inside the viewport.',
    usage: `<ui-tooltip ui-title="Thêm vào giỏ hàng" ui-placement="top-center">
  <button>Giỏ hàng</button>
</ui-tooltip>

<ui-tooltip ui-title="Thông tin thêm" ui-placement="bottom-start" ui-animate="fade-up" ui-duration="300">
  <button aria-label="Thông tin thêm">?</button>
</ui-tooltip>`,
    attributes: [
      { name: 'ui-title', type: 'string', description: 'Plain text shown in the tooltip. Required.' },
      { name: 'ui-placement', type: 'top | bottom | left | right, with start | center | end', default: 'top-center', description: 'Preferred placement. Flips when the opposite side has more space and clamps within the viewport.' },
      { name: 'ui-animate', type: 'fade | fade-up | fade-down | fade-left | fade-right | scale | none', default: 'fade', description: 'Entrance and exit animation.' },
      { name: 'ui-duration', type: 'milliseconds', default: '180', description: 'Animation duration; zero disables it.' },
      { name: 'ui-offset', type: 'pixels', default: '8', description: 'Gap between trigger and tooltip.' },
      { name: 'ui-mobile-disabled', type: 'boolean', default: 'false', description: 'Disables tap-to-show on touch devices.' },
    ],
    a11y: 'The trigger receives aria-describedby while the tooltip is visible. Focus opens it; blur or Escape closes it. Reduced motion disables transitions.',
  },

  lazyload: {
    slug: 'lazyload',
    tagName: 'ui-lazyload',
    name: 'Lazyload',
    category: 'Media',
    summary: 'IntersectionObserver-driven image and iframe loader. Prevents layout shift with native loading="lazy" support.',
    usage: `<ui-lazyload>
  <img data-src="large-image.jpg" src="placeholder.svg" alt="Lazy photo" />
</ui-lazyload>`,
    attributes: [
      { name: 'threshold', type: 'number', default: '0.1', description: 'Intersection threshold to trigger loading.' },
    ],
  },

  'image-comparison': {
    slug: 'image-comparison',
    tagName: 'ui-image-comparison',
    name: 'Image Comparison',
    category: 'Media',
    summary: 'Compare aligned before/after images by dragging, touching, clicking, or using the keyboard. Optional spring animation starts on viewport entry.',
    usage: `<ui-image-comparison ui-default-percent="50" ui-animate>
  <ui-image-comparison-before>
    <img src="before.jpg" alt="Before" />
    <ui-image-comparison-label>Before</ui-image-comparison-label>
  </ui-image-comparison-before>
  <ui-image-comparison-after>
    <img src="after.jpg" alt="After" />
    <ui-image-comparison-label>After</ui-image-comparison-label>
  </ui-image-comparison-after>
  <ui-image-comparison-handle></ui-image-comparison-handle>
</ui-image-comparison>`,
    attributes: [
      { name: 'ui-default-percent', type: 'number', default: '50', description: 'Initial split percentage, clamped to 0–100.' },
      { name: 'ui-value', type: 'number', default: 'initial percentage', description: 'Current split percentage. Updates with pointer and keyboard interaction; also sets --ui-value.' },
      { name: 'ui-animate', type: 'boolean', default: 'false', description: 'Spring the divider from 0 to the initial value when the component enters the viewport.' },
      { name: 'ui-observed', type: 'string', default: '—', description: 'Changing this value resets the divider to ui-default-percent and reinitializes the entry animation.' },
    ],
    events: [{ name: 'ui-image-comparison-change', detail: '{ value: number }', description: 'Emitted when pointer or keyboard interaction changes the split.' }],
    cssVars: [
      { name: '--ui-value', default: '50', description: 'Numeric 0–100 current divider position.' },
      { name: '--ui-image-comparison-position', default: '50%', description: 'Percentage used to clip the after image and place the handle.' },
    ],
    a11y: 'Focusable slider with Arrow Left/Right, Shift + arrow, Home, and End. Respects reduced motion by skipping the entry animation.',
  },

  counter: {
    slug: 'counter',
    tagName: 'ui-counter',
    name: 'Counter',
    category: 'Utility',
    summary: 'Animated number count-up when connected, with a configurable duration and reduced-motion support.',
    usage: `<ui-counter from="0" to="999" duration="2500">0</ui-counter>`,
    attributes: [
      { name: 'from', type: 'number', default: '0', description: 'Starting number.' },
      { name: 'to', type: 'number', default: '100', description: 'Target number.' },
      { name: 'duration', type: 'number', default: '1500', description: 'Animation duration in ms.' },
    ],
  },

  'dark-mode': {
    slug: 'dark-mode',
    tagName: 'ui-dark-mode',
    name: 'Dark Mode',
    category: 'Utility',
    summary: 'Theme manager that cycles through light, dark, and auto modes, automatically persisting preferences to localStorage.',
    usage: `<ui-dark-mode mode="auto">Toggle Theme</ui-dark-mode>`,
    attributes: [
      { name: 'mode', type: "'auto' | 'light' | 'dark'", default: "'auto'", description: 'Active theme mode.' },
    ],
  },

  marquee: {
    slug: 'marquee',
    tagName: 'ui-marquee',
    name: 'Marquee',
    category: 'Advanced',
    summary: 'Hardware-accelerated continuous scrolling banner with infinite looping, bi-directional and vertical orientation, scroll parallax speed multiplier, and pause on hover.',
    usage: `<ui-marquee speed="6" pause-on-hover scroll-enabled scroll-speed="1.5">
  <span>Breaking News • New Components • Web Components Native • Zero Runtime •</span>
</ui-marquee>`,
    attributes: [
      { name: 'speed', type: 'number', default: '6', description: 'Auto-scroll speed (higher = faster).' },
      { name: 'direction', type: "'ltr' | 'rtl' | 'ttb' | 'btt'", default: 'document.dir', description: 'Movement direction (left-to-right, right-to-left, top-to-bottom, bottom-to-top).' },
      { name: 'pause-on-hover', type: 'boolean', default: 'false', description: 'Pause animation when hovering with mouse.' },
      { name: 'auto-run', type: 'boolean', default: 'true', description: 'Run animation continuously.' },
      { name: 'scroll-enabled', type: 'boolean', default: 'false', description: 'Add parallax movement tied to window scroll.' },
      { name: 'scroll-speed', type: 'number', default: '1', description: 'Scroll parallax multiplier (used with scroll-enabled).' },
      { name: 'vertical', type: 'boolean', default: 'false', description: 'Enable vertical scrolling mode.' },
      { name: 'observed', type: 'string', default: '—', description: 'Re-render marquee when value changes.' },
    ],
  },
};

export function getDocForSlug(slug: string): ComponentDoc | undefined {
  const clean = slug.replace(/^ui-/, '');
  return COMPONENT_DOCS[clean];
}

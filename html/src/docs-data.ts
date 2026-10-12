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
    summary: 'Accessible dialog overlay with backdrop blur, smooth scale-in and fade animations, body scroll lock, focus trap, and Escape key dismissal.',
    usage: `<button id="btn-open">Open Modal</button>

<ui-modal dismissable>
  <div data-modal-overlay></div>
  <div data-modal-dialog>
    <h2>Welcome to UI Core</h2>
    <p>This dialog features smooth entry/exit animations.</p>
    <button data-modal-close>Got it</button>
  </div>
</ui-modal>

<script type="module">
  document.getElementById('btn-open').addEventListener('click', () => {
    document.querySelector('ui-modal').openModal();
  });
</script>`,
    attributes: [
      { name: 'open', type: 'boolean', default: 'false', description: 'Controls open state. Reflects to attribute.' },
      { name: 'dismissable', type: 'boolean', default: 'true', description: 'Allows closing by clicking the overlay or pressing Escape.' },
    ],
    methods: [
      { name: 'openModal()', description: 'Opens the modal with scale-in + backdrop fade animation.' },
      { name: 'closeModal()', description: 'Closes the modal with scale-out + backdrop fade animation.' },
      { name: 'toggle()', description: 'Toggles between open and closed states.' },
    ],
    events: [
      { name: 'ui-modal-open', detail: 'void', description: 'Fired when the modal opens.' },
      { name: 'ui-modal-close', detail: 'void', description: 'Fired when the modal closes.' },
    ],
    cssVars: [
      { name: '--ui-modal-duration', default: '220ms', description: 'Animation duration for entry and exit transitions.' },
      { name: '--ui-modal-width', default: '480px', description: 'Maximum dialog box width.' },
    ],
    a11y: 'role="dialog" and aria-modal="true" set automatically. Focus trap keeps keyboard focus trapped inside. Locks body scroll when open and restores focus to previous element on close.',
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

  reveal: {
    slug: 'reveal',
    tagName: 'ui-reveal',
    name: 'Reveal',
    category: 'Motion',
    summary: 'Lightweight single-shot fade reveal. Cheaper alternative to ui-animate when you only need a clean opacity reveal.',
    usage: `<ui-reveal delay="200" duration="500">
  <h1>Smooth single-shot fade</h1>
</ui-reveal>`,
    attributes: [
      { name: 'duration', type: 'number', default: '400', description: 'Fade duration in ms.' },
      { name: 'delay', type: 'number', default: '0', description: 'Delay in ms before fade.' },
      { name: 'threshold', type: 'number', default: '0.2', description: 'Viewport intersection threshold.' },
      { name: 'once', type: 'boolean', default: 'true', description: 'Trigger only once.' },
    ],
  },

  stagger: {
    slug: 'stagger',
    tagName: 'ui-stagger',
    name: 'Stagger',
    category: 'Motion',
    summary: 'Cascades child reveals sequentially using CSS custom property indices (--ui-stagger-index). High performance, zero JS loops.',
    usage: `<ui-stagger step="80">
  <div>Item 1 (delay 0ms)</div>
  <div>Item 2 (delay 80ms)</div>
  <div>Item 3 (delay 160ms)</div>
</ui-stagger>`,
    attributes: [
      { name: 'step', type: 'number', default: '80', description: 'Delay increment (ms) between consecutive children.' },
      { name: 'threshold', type: 'number', default: '0.1', description: 'Intersection threshold to trigger sequence.' },
      { name: 'once', type: 'boolean', default: 'true', description: 'Only cascade once.' },
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

  'image-zoom': {
    slug: 'image-zoom',
    tagName: 'ui-image-zoom',
    name: 'Image Zoom',
    category: 'Media',
    summary: 'Click-to-zoom interactive lightbox with smooth expansion and click/Escape to close.',
    usage: `<ui-image-zoom>
  <img src="photo.jpg" alt="Click to zoom in" />
</ui-image-zoom>`,
    attributes: [],
  },

  'image-comparison': {
    slug: 'image-comparison',
    tagName: 'ui-image-comparison',
    name: 'Image Comparison',
    category: 'Media',
    summary: 'Interactive before/after image slider with mouse dragging, touch gestures, and keyboard arrow controls.',
    usage: `<ui-image-comparison value="50">
  <img src="before.jpg" alt="Before" />
  <img src="after.jpg" alt="After" />
</ui-image-comparison>`,
    attributes: [
      { name: 'value', type: 'number', default: '50', description: 'Split divider position percentage (0 to 100).' },
    ],
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

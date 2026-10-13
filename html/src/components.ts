/**
 * Component manifest for the gallery. Each entry produces a card and a
 * demo page. In production this would be generated from `meta.ts` files
 * across the packages.
 */

export interface ComponentEntry {
  readonly name: string;
  readonly tagName: string;
  readonly category: 'Motion' | 'Basic UI' | 'Media' | 'Utility' | 'Advanced';
  readonly description: string;
  readonly demos: readonly string[];
}

export const COMPONENTS: readonly ComponentEntry[] = [
  {
    name: 'Animate',
    tagName: 'ui-animate',
    category: 'Motion',
    description: 'Reveal content when it enters the viewport, with CSS or Web Animations API.',
    demos: ['Basic fade-up', 'Effect variants', 'Once vs repeat'],
  },
  {
    name: 'Parallax',
    tagName: 'ui-parallax',
    category: 'Motion',
    description: 'Scroll keyframes and pointer-driven depth inside a measured container.',
    demos: ['Coastal story', 'Photo aperture', 'Botanical layers', 'Circular scroll', 'Text fly', 'Scroll keyframes', 'Hover & 3D', 'Custom effect'],
  },
  {
    name: 'Scroll X',
    tagName: 'ui-scroll-x',
    category: 'Motion',
    description: 'Full-screen story panels reveal with inertia after the section reaches the viewport top.',
    demos: ['Photo story', 'Editorial panels'],
  },
  {
    name: 'Scroll Y',
    tagName: 'ui-scroll-y',
    category: 'Motion',
    description: 'Full-screen panels slide upward with inertia as the page scrolls.',
    demos: ['Photo panels', 'Parallax layers'],
  },
  {
    name: 'Scroll Scene',
    tagName: 'ui-scroll-scene',
    category: 'Motion',
    description: 'Sticky storytelling scenes switch as the page passes viewport-based scroll thresholds.',
    demos: ['Photo story', 'Editorial story', 'Image with texts'],
  },
  {
    name: 'Typing',
    tagName: 'ui-typing',
    category: 'Motion',
    description: 'Rotate short hero phrases with typewriter, vertical slide, or goo morph effects.',
    demos: ['Typewriter hero', 'Slide headline', 'Goo morph'],
  },
  {
    name: 'Cursor',
    tagName: 'ui-cursor',
    category: 'Motion',
    description: 'A cursor item follows the pointer with smoothing, split zones, magnetic motion and distortion.',
    demos: ['Follow and states', 'Text image reveal', 'Split cursor', 'Distortion gallery', 'Magnetic button'],
  },
  {
    name: 'Toggle',
    tagName: 'ui-toggle',
    category: 'Basic UI',
    description: 'Switch component with full keyboard + ARIA support.',
    demos: ['On / off', 'Disabled', 'With label'],
  },
  {
    name: 'Collapse',
    tagName: 'ui-collapse',
    category: 'Basic UI',
    description: 'Animated show / hide a single content section.',
    demos: ['Toggle', 'Custom duration'],
  },
  {
    name: 'Accordion',
    tagName: 'ui-accordion',
    category: 'Basic UI',
    description: 'Multiple collapses with single-open or multi-open mode.',
    demos: ['Single-open', 'Multi-open'],
  },
  {
    name: 'Tabs',
    tagName: 'ui-tabs',
    category: 'Basic UI',
    description: 'Accessible tabbed interface with arrow-key navigation.',
    demos: ['Two tabs', 'Three tabs', 'Vertical orientation'],
  },
  {
    name: 'Modal',
    tagName: 'ui-modal',
    category: 'Basic UI',
    description: 'Dialog, drawer and lightbox with named triggers, animation, breakpoints and touch dismissal.',
    demos: ['Animations', 'Placements', 'Responsive and pan', 'Lightbox and API'],
  },
  {
    name: 'Toast',
    tagName: 'ui-toast',
    category: 'Basic UI',
    description: 'Temporary notifications with named HTML templates, six placements, animation, and dismissal controls.',
    demos: ['Notification styles', 'Placements', 'Timing and motion', 'HTML template'],
  },
  {
    name: 'Drawer',
    tagName: 'ui-drawer',
    category: 'Basic UI',
    description: 'Slide-in side panel.',
    demos: ['Left placement', 'Right placement'],
  },
  {
    name: 'Popover',
    tagName: 'ui-popover',
    category: 'Basic UI',
    description: 'Floating popover anchored to a trigger.',
    demos: ['Bottom', 'Top / right / left'],
  },
  {
    name: 'Tooltip',
    tagName: 'ui-tooltip',
    category: 'Basic UI',
    description: 'Short hover or focus hint with viewport-aware placement and animation.',
    demos: ['Top center', 'Bottom start', 'Placement and offset'],
  },
  {
    name: 'Lazyload',
    tagName: 'ui-lazyload',
    category: 'Media',
    description: 'IntersectionObserver-driven lazy image loader.',
    demos: ['Basic image', 'With srcset'],
  },
  {
    name: 'PhotoSwipe',
    tagName: 'ui-photoswipe',
    category: 'Media',
    description: 'Lazy-loaded PhotoSwipe 5 lightbox for full-screen image galleries with zoom and swipe.',
    demos: ['Image gallery', 'Single image', 'Custom options'],
  },
  {
    name: 'Image Comparison',
    tagName: 'ui-image-comparison',
    category: 'Media',
    description: 'Before / after image comparison with drag, touch, click, keyboard, and scroll-entry animation.',
    demos: ['Basic', 'Keyboard navigation'],
  },
  {
    name: 'Counter',
    tagName: 'ui-counter',
    category: 'Utility',
    description: 'Count up to N from 0 using Web Animations API.',
    demos: ['Basic', 'Reduced motion'],
  },
  {
    name: 'DarkMode',
    tagName: 'ui-dark-mode',
    category: 'Utility',
    description: 'Theme manager with light / dark / auto modes.',
    demos: ['Cycle on click'],
  },
  {
    name: 'Marquee',
    tagName: 'ui-marquee',
    category: 'Advanced',
    description: 'Infinite horizontal scroller. Pauses on hover.',
    demos: ['Basic', 'Pause on hover'],
  },
  {
    name: 'Carousel',
    tagName: 'ui-carousel',
    category: 'Advanced',
    description: 'Composable slider with thumbnails, pagination, arrows, and responsive layouts.',
    demos: ['Basic carousel', 'With thumbnails'],
  },
  {
    name: 'Expandable Grid',
    tagName: 'ui-expandable-grid',
    category: 'Advanced',
    description: 'Open a photo card inside its grid while neighboring cards animate into place.',
    demos: ['Editorial gallery', 'Compact grid'],
  },
  {
    name: 'Grid Hover Expand',
    tagName: 'ui-grid-hover-expand',
    category: 'Advanced',
    description: 'Grow the hovered image card while its neighbors in the same row make room.',
    demos: ['Photo stories', 'Compact cards', 'Edge to edge'],
  },
  {
    name: 'Swipeable Card Stack',
    tagName: 'ui-swipeable-card-stack',
    category: 'Advanced',
    description: 'Drag the front card away to reveal the next one in a layered photo deck.',
    demos: ['Side stack', 'Down stack', 'Scattered deck'],
  },
  {
    name: 'Orbit Gallery',
    tagName: 'ui-orbit-gallery',
    category: 'Advanced',
    description: 'A rotating 3D ring of image cards with captions and automatic spacing.',
    demos: ['Photo orbit', 'Reverse orbit'],
  },
  {
    name: 'Dot Morph',
    tagName: 'ui-dot-morph',
    category: 'Advanced',
    description: 'Random particles gather into any word when you hover, focus, or tap.',
    demos: ['Type your word', 'Neon particles'],
  },
];

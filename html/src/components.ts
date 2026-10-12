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
    demos: ['Coastal story', 'Photo aperture', 'Botanical layers', 'Scroll keyframes', 'Hover & 3D', 'Custom effect'],
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
    name: 'Reveal',
    tagName: 'ui-reveal',
    category: 'Motion',
    description: 'Single-shot fade reveal. Cheaper sibling of ui-animate.',
    demos: ['Basic fade', 'With delay'],
  },
  {
    name: 'Stagger',
    tagName: 'ui-stagger',
    category: 'Motion',
    description: 'Cascade child reveals by setting CSS custom property indices.',
    demos: ['List of cards'],
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
    description: 'Accessible dialog with focus trap + Escape to close.',
    demos: ['Basic', 'With form'],
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
    name: 'Lazyload',
    tagName: 'ui-lazyload',
    category: 'Media',
    description: 'IntersectionObserver-driven lazy image loader.',
    demos: ['Basic image', 'With srcset'],
  },
  {
    name: 'ImageZoom',
    tagName: 'ui-image-zoom',
    category: 'Media',
    description: 'Click-to-zoom on an image with overlay.',
    demos: ['Click to zoom', 'Close on overlay'],
  },
  {
    name: 'ImageComparison',
    tagName: 'ui-image-comparison',
    category: 'Media',
    description: 'Before / after slider with keyboard support.',
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
];

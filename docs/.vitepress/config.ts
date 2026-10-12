import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'UI Components',
  description: 'Framework-agnostic web component library',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Components', link: '/components/' },
      { text: 'Architecture', link: '/architecture' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is this?', link: '/' },
          { text: 'Installation', link: '/installation' },
          { text: 'Quick start', link: '/quick-start' },
        ],
      },
      {
        text: 'Components',
        items: [
          { text: 'Animate', link: '/components/animate' },
          { text: 'Parallax', link: '/components/parallax' },
          { text: 'Scroll X', link: '/components/scroll-x' },
          { text: 'Scroll Y', link: '/components/scroll-y' },
          { text: 'Toggle', link: '/components/toggle' },
          { text: 'Collapse', link: '/components/collapse' },
          { text: 'Tabs', link: '/components/tabs' },
          { text: 'Modal', link: '/components/modal' },
          { text: 'Drawer', link: '/components/drawer' },
          { text: 'Popover', link: '/components/popover' },
          { text: 'Lazyload', link: '/components/lazyload' },
          { text: 'ImageZoom', link: '/components/image-zoom' },
          { text: 'Counter', link: '/components/counter' },
          { text: 'DarkMode', link: '/components/dark-mode' },
          { text: 'Carousel', link: '/components/carousel' },
          { text: 'Marquee', link: '/components/marquee' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Roadmap', link: '/roadmap' },
        ],
      },
    ],
  },
});

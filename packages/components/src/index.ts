/**
 * @ui/components — public entry point. Side-effect imports register all
 * custom elements.
 */

import './toggle.js';
import './collapse.js';
import './accordion.js';
import './tabs.js';
import './modal.js';
import './drawer.js';
import './popover.js';
import './lazyload.js';
import './image-zoom.js';
import './image-comparison.js';
import './counter.js';
import './dark-mode.js';
import './marquee.js';
import './carousel.js';

export {
  UiToggle,
  UiToggleTrigger,
  CoreToggle,
  CoreToggleTrigger,
  XoToggle,
  XoToggleTrigger,
  toggle,
  toggleTrigger,
} from './toggle.js';
export {
  UiCollapse,
  UiCollapseTrigger,
  UiCollapseProvider,
  CoreCollapse,
  CoreCollapseTrigger,
  CoreCollapseProvider,
  XoCollapse,
  XoCollapseTrigger,
  XoCollapseProvider,
  collapse,
  collapseTrigger,
  collapseProvider,
  type CollapseOptions,
  type CollapseTriggerOptions,
  type CollapseProviderOptions,
  type CollapseInstance,
} from './collapse.js';
export { UiAccordion, accordion } from './accordion.js';
export { UiTabs, tabs } from './tabs.js';
export { UiModal, modal } from './modal.js';
export { UiDrawer, drawer } from './drawer.js';
export { UiPopover, popover } from './popover.js';
export { UiLazyload, lazyload } from './lazyload.js';
export { UiImageZoom, imageZoom } from './image-zoom.js';
export { UiImageComparison, imageComparison } from './image-comparison.js';
export { UiCounter, counter } from './counter.js';
export { UiDarkMode, darkMode, type ThemeMode } from './dark-mode.js';
export { UiMarquee, marquee } from './marquee.js';
export { UiCarousel, UiCarouselThumbnail, carousel } from './carousel.js';

export { lockScroll, trapFocus, unlockScroll } from './focus-trap.js';

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
import './tooltip.js';
import './lazyload.js';
import './image-comparison.js';
import './counter.js';
import './dark-mode.js';
import './marquee.js';
import './carousel.js';
import './cursor.js';
import './fake-cursor.js';
import './toast.js';
import './photoswipe.js';
import './expandable-grid.js';
import './orbit-gallery.js';
import './dot-morph.js';
import './logo-assembly.js';
import './sand-physics.js';
import './image-solid.js';
import './image-stack.js';
import './image-trace.js';
import './image-flashlight.js';
import './text-spotlight.js';
import './tech-text.js';
import './curved-loop.js';
import './falling-text.js';
import './flex-carousel.js';
import './animated-background.js';
import './flip-book.js';
import './grid-hover-expand.js';
import './swipeable-card-stack.js';

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
export { UiModal, UiModalTrigger, UiModalBackdrop, UiModalPan, uiModal, modal } from './modal.js';
export { UiDrawer, drawer } from './drawer.js';
export { UiPopover, popover } from './popover.js';
export { UiTooltip, UiTooltipContent, tooltip } from './tooltip.js';
export { UiLazyload, lazyload } from './lazyload.js';
export {
  UiImageComparison, UiImageComparisonBefore, UiImageComparisonAfter,
  UiImageComparisonHandle, UiImageComparisonHandleIcon, UiImageComparisonLabel,
  imageComparison, imageComparisonBefore, imageComparisonAfter,
  imageComparisonHandle, imageComparisonHandleIcon, imageComparisonLabel,
} from './image-comparison.js';
export { UiCounter, counter } from './counter.js';
export { UiDarkMode, darkMode, type ThemeMode } from './dark-mode.js';
export { UiMarquee, marquee } from './marquee.js';
export { UiCarousel, UiCarouselThumbnail, carousel } from './carousel.js';
export { UiCursor, UiCursorItem, cursor, cursorItem } from './cursor.js';
export { UiFakeCursor } from './fake-cursor.js';
export { UiToast, UiToastPortal, UiToastCloseButton, uiToast, type ToastOptions, type ToastPlacement } from './toast.js';
export { UiPhotoSwipe, parsePhotoSwipeOptions } from './photoswipe.js';
export { UiExpandableGrid, UiExpandableGridItem } from './expandable-grid.js';
export { UiOrbitGallery, UiOrbitGalleryTrack, UiOrbitGalleryItem } from './orbit-gallery.js';
export { UiDotMorph } from './dot-morph.js';
export { UiLogoAssembly, sampleLogoPixels } from './logo-assembly.js';
export { UiSandPhysics } from './sand-physics.js';
export { SandPhysicsEngine, SandCell, type SandGravity, type SandMaterial, type SandPreset } from './sand-physics-engine.js';
export { UiImageSolid, UiImageSolidFace, imageSolidGeometry, type ImageSolidShape, type ImageSolidFace } from './image-solid.js';
export { UiImageStack, UiImageStackItem } from './image-stack.js';
export { UiImageTrace, traceImageContours, type ImageTracePath } from './image-trace.js';
export { UiImageFlashlight, flashlightFrame, type FlashlightFrame } from './image-flashlight.js';
export { UiTextSpotlight } from './text-spotlight.js';
export { UiTechText } from './tech-text.js';
export { UiCurvedLoop, type CurvedLoopShape } from './curved-loop.js';
export { UiFallingText } from './falling-text.js';
export { UiFlexCarousel, UiFlexCarouselItem, type FlexCarouselPreset, type FlexCarouselFit, type FlexCarouselIntro } from './flex-carousel.js';
export { UiAnimatedBackground, UiBackground } from './animated-background.js';
export { UiFlipBook, UiFlipBookCover, UiFlipBookPage } from './flip-book.js';
export { UiGridHoverExpand } from './grid-hover-expand.js';
export { UiSwipeableCardStack } from './swipeable-card-stack.js';

export { lockScroll, trapFocus, unlockScroll } from './focus-trap.js';

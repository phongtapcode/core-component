/**
 * Carousel Core module exports.
 */

import './subcomponents.js';
import './carousel.js';

export { UiCarousel, carousel } from './carousel.js';
export {
  UiCarouselPrev,
  UiCarouselNext,
  UiCarouselPagination,
  UiCarouselBullet,
  UiCarouselPaginationProgress,
  UiCarouselPage,
  UiCarouselSize,
  UiCarouselTrigger,
  UiCarouselThumbnail,
} from './subcomponents.js';

export {
  type CarouselOptions,
  type CarouselType,
  type BreakpointConfig,
  type BreakpointsMap,
  type CarouselChangeEventDetail,
  type CarouselInstance,
} from './types.js';

export { getCarouselByName } from './sync.js';

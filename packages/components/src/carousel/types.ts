/**
 * Carousel Core Options & Interfaces based on Functional Spec.
 */

export type CarouselType = 'slide' | 'fade' | 'none' | 'nature' | 'water' | 'urban' | 'wind';

export interface BreakpointConfig {
  perView?: number;
  perMove?: number;
  gap?: number;
  overflow?: 'visible' | 'hidden';
  vertical?: boolean;
}

export type BreakpointsMap = Record<string, BreakpointConfig>;

export interface CarouselOptions {
  name?: string;
  activeIndex: number;
  perView: number;
  perMove: number;
  gap: number;
  speed: number;
  autoplay: number;
  autoHeight: boolean;
  hoverPause: boolean;
  overflow: 'visible' | 'hidden';
  vertical: boolean;
  rewind: boolean;
  loop: boolean;
  rtl: boolean;
  draggable: boolean;
  easing: string;
  type: CarouselType;
  columnWidth: number;
  stopAutoplayOnInteraction: boolean;
  progress: boolean;
  syncId?: string;
  mediaLazyload: boolean;
  videoCoverLazyload?: boolean;
  renderBullet?: string;
  observed?: string;
  breakpoints?: string;
}

export interface CarouselChangeEventDetail {
  activeIndex: number;
  previousIndex: number;
  page: number;
  previousPage: number;
  direction: 'next' | 'prev' | 'none';
  index: number; // backward compatibility
}

export interface CarouselInstance {
  readonly activeIndex: number;
  readonly pageCount: number;
  readonly currentPage: number;
  readonly slidesCount: number;
  readonly effectivePerView: number;
  readonly isLooping: boolean;
  next(amount?: number): void;
  prev(amount?: number): void;
  goTo(index: number): void;
  goto(index: number): void;
  play(): void;
  pause(): void;
  refresh(): void;
  destroy(): void;
}

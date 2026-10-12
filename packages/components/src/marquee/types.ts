/**
 * Marquee Component Types and Options.
 */

export type MarqueeDirection = 'ltr' | 'rtl' | 'ttb' | 'btt';

export interface MarqueeOptions {
  speed: number;
  direction: MarqueeDirection;
  pauseOnHover: boolean;
  autoRun: boolean;
  scrollEnabled: boolean;
  scrollSpeed: number;
  vertical: boolean;
  observed?: string;
}

export interface MarqueeInstance {
  readonly isRunning: boolean;
  readonly isVertical: boolean;
  play(): void;
  pause(): void;
  toggle(): void;
  refresh(): void;
}

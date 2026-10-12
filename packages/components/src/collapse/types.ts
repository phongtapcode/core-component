/**
 * Collapse & Accordion Types and Options.
 */

export interface CollapseOptions {
  name: string;
  duration: number;
  easing: string;
  active: boolean;
  observed?: string;
}

export interface CollapseTriggerOptions {
  name: string;
  active: boolean;
  activeBinding?: string;
}

export interface CollapseProviderOptions {
  duration: number;
  scroll: boolean;
  scrollOffset: number;
  observed?: string;
}

export interface CollapseInstance {
  readonly isOpen: boolean;
  readonly effectiveName: string;
  open(): void;
  close(): void;
  toggle(): void;
}

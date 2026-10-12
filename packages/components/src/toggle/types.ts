/**
 * Toggle Component Types and Options.
 */

export interface ToggleOptions {
  name: string;
  active: boolean;
  autofocus: boolean;
  outsideClickEnabled: boolean;
  portal: boolean;
  parentSelector?: string;
  breakpoints?: string;
  escapeClose: boolean;
  focusTrap: boolean;
}

export interface ToggleTriggerOptions {
  name: string;
  active: boolean;
}

export interface ToggleInstance {
  readonly isOpen: boolean;
  readonly effectiveName: string;
  open(): void;
  close(): void;
  toggle(): void;
}

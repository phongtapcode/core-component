/**
 * <ui-dark-mode> — theme manager (light/dark/auto).
 *
 * Sets `data-theme` on <html>:
 *   'light' | 'dark' | 'auto'  (auto defers to prefers-color-scheme)
 *
 * Persists to localStorage under 'ui-theme' unless `storage` is 'none'.
 */

import { BaseElement, define } from '@ui/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'ui-theme';

export class UiDarkMode extends BaseElement {
  static override properties = {
    mode: { name: 'mode', default: 'auto' as ThemeMode, reflect: true },
    storage: { name: 'storage', default: 'local' as 'local' | 'none' },
  };

  static override get observedAttributes() {
    return ['mode', 'storage'];
  }

  declare mode: ThemeMode;
  declare storage: 'local' | 'none';

  #unsubscribe: (() => void) | null = null;

  protected override onConnect(): void {
    // Read persisted mode on first connect.
    if (this.storage === 'local') {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        this.mode = saved;
      }
    }
    this.#apply();
    this.#unsubscribe = this.$on(this, 'click', () => this.#cycle());
    this.#unsubscribe = this.$on(document, 'change', ((ev: Event) => {
      if ((ev as MediaQueryListEvent).media !== '(prefers-color-scheme: dark)') return;
      this.#apply();
    }) as EventListener);
  }

  protected override onDisconnect(): void {
    this.#unsubscribe?.();
  }

  protected override onAttributeChanged(name: string): void {
    if (name === 'mode') this.#apply();
  }

  set(mode: ThemeMode): void {
    this.mode = mode;
  }

  #apply(): void {
    const root = document.documentElement;
    const isDark = this.mode === 'dark' ||
      (this.mode === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (this.storage === 'local') {
      try { localStorage.setItem(STORAGE_KEY, this.mode); } catch {}
    }
    this.$emit('ui-dark-mode-change', { mode: this.mode, isDark });
  }

  #cycle(): void {
    const order: ThemeMode[] = ['light', 'dark', 'auto'];
    const idx = order.indexOf(this.mode);
    this.$set('mode', order[(idx + 1) % order.length]!);
  }
}

define('ui-dark-mode', UiDarkMode);
export const darkMode = UiDarkMode;
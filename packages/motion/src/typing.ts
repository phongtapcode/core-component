import { BaseElement, define } from '@ui/core';

type TypingEffect = 'typing' | 'slide' | 'goo';

let filterCounter = 0;

function positiveMilliseconds(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseWords(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((word): word is string => typeof word === 'string') : [];
  } catch {
    console.warn('[ui-typing] ui-content must be a JSON array of strings');
    return [];
  }
}

function characters(word: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)].map(({ segment }) => segment);
  }
  return Array.from(word);
}

/** Rotates short text through typewriter, vertical slide, or SVG goo effects. */
export class UiTyping extends BaseElement {
  static override get observedAttributes(): string[] {
    return ['ui-content', 'ui-duration', 'ui-delay', 'ui-effect', 'ui-cursor-char'];
  }

  #inner: HTMLElement | null = null;
  #content: HTMLElement | null = null;
  #sizer: HTMLElement | null = null;
  #timer = 0;
  #frame = 0;
  #words: string[] = [];
  #index = 0;
  #count = 0;
  #current: HTMLElement | null = null;
  #blobLayer: HTMLElement | null = null;
  #blobCurrent: HTMLElement | null = null;
  #cursor: HTMLElement | null = null;
  #effect: TypingEffect = 'typing';
  #duration = 100;
  #delay = 2000;
  #reduced: MediaQueryList | null = null;
  #originalLabel: string | null = null;
  #originalRole: string | null = null;

  protected override onConnect(): void {
    this.#originalLabel = this.getAttribute('aria-label');
    this.#originalRole = this.getAttribute('role');
    this.#ensureShadow();
    this.#reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    if (this.#reduced) this.$on(this.#reduced, 'change', () => this.#restart());
    this.#restart();
  }

  protected override onDisconnect(): void {
    this.#stop();
    if (this.#originalLabel === null) this.removeAttribute('aria-label');
    else this.setAttribute('aria-label', this.#originalLabel);
    if (this.#originalRole === null) this.removeAttribute('role');
    else this.setAttribute('role', this.#originalRole);
  }

  protected override onAttributeChanged(): void {
    if (this.isConnected) this.#restart();
  }

  #ensureShadow(): void {
    if (this.shadowRoot) return;
    const id = `ui-typing-goo-${++filterCounter}`;
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>
      :host { display: inline-block; vertical-align: baseline; white-space: nowrap; }
      ui-typing-inner { display: inline-grid; position: relative; vertical-align: baseline; font: inherit; line-height: inherit; }
      .sizer, ui-typing-content { grid-area: 1 / 1; }
      .sizer { display: grid; visibility: hidden; pointer-events: none; white-space: nowrap; }
      .sizer > span { grid-area: 1 / 1; }
      ui-typing-content { display: block; position: relative; height: 100%; white-space: nowrap; }
      .word { display: block; white-space: nowrap; }
      [data-effect='typing'] .word { display: inline; }
      .cursor { display: inline; animation: ui-typing-blink 900ms steps(1, end) infinite; }
      @keyframes ui-typing-blink { 50% { opacity: 0; } }
      [data-effect='slide'] ui-typing-content { overflow: hidden; }
      [data-effect='slide'] .word, [data-effect='goo'] .word { position: absolute; top: 0; left: 0; }
      [data-effect='slide'] .word.next { transform: translateY(100%); }
      [data-effect='slide'][data-transitioning] .word { transition: transform var(--ui-typing-duration) cubic-bezier(.22, 1, .36, 1); }
      [data-effect='slide'][data-transitioning] .word.current { transform: translateY(-100%); }
      [data-effect='slide'][data-transitioning] .word.next { transform: translateY(0); }
      [data-effect='goo'] ui-typing-content { overflow: visible; }
      [data-effect='goo'] .goo-blob { position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: .55; filter: url(#${id}); }
      [data-effect='goo'] .goo-blob .word { transform-origin: left center; }
      [data-effect='goo'] .goo-blob .word.next { opacity: 0; filter: blur(8px); transform: scale(.9); }
      [data-effect='goo'][data-transitioning] .goo-blob .word { transition: opacity var(--ui-typing-duration) ease, filter var(--ui-typing-duration) ease, transform var(--ui-typing-duration) ease; }
      [data-effect='goo'][data-transitioning] .goo-blob .word.current { opacity: 0; filter: blur(8px); transform: scale(1.1); }
      [data-effect='goo'][data-transitioning] .goo-blob .word.next { opacity: 1; filter: blur(0); transform: scale(1); }
      [data-effect='goo'] ui-typing-content > .word { z-index: 1; filter: none; }
      [data-effect='goo'] ui-typing-content > .word.next { opacity: 0; }
      [data-effect='goo'][data-transitioning] ui-typing-content > .word.current { animation: ui-typing-goo-out var(--ui-typing-duration) both; }
      [data-effect='goo'][data-transitioning] ui-typing-content > .word.next { animation: ui-typing-goo-in var(--ui-typing-duration) both; }
      @keyframes ui-typing-goo-out { 0%, 35% { opacity: 1; } 55%, 100% { opacity: 0; } }
      @keyframes ui-typing-goo-in { 0%, 45% { opacity: 0; } 65%, 100% { opacity: 1; } }
      svg { position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none; }
      @media (prefers-reduced-motion: reduce) {
        .cursor { display: none; animation: none; }
        .word { transition: none !important; animation: none !important; }
        [data-effect='goo'] .goo-blob { display: none; }
      }
    </style>
    <ui-typing-inner part="inner" aria-hidden="true">
      <span class="sizer" aria-hidden="true"></span>
      <ui-typing-content part="content"></ui-typing-content>
    </ui-typing-inner>
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"/><feBlend in="SourceGraphic" in2="goo" mode="normal"/></filter></defs></svg>`;
    this.#inner = shadow.querySelector('ui-typing-inner');
    this.#content = shadow.querySelector('ui-typing-content');
    this.#sizer = shadow.querySelector('.sizer');
  }

  #stop(): void {
    clearTimeout(this.#timer);
    cancelAnimationFrame(this.#frame);
    this.#timer = 0;
    this.#frame = 0;
  }

  #word(value: string, className: string): HTMLElement {
    const element = document.createElement('span');
    element.className = `word ${className}`;
    element.textContent = value;
    return element;
  }

  #label(value: string): void {
    if (this.#originalRole === null) this.setAttribute('role', 'text');
    if (this.#originalLabel === null) this.setAttribute('aria-label', value);
  }

  #restart(): void {
    this.#stop();
    this.#words = parseWords(this.getAttribute('ui-content'));
    this.#effect = this.getAttribute('ui-effect') === 'slide' ? 'slide' : this.getAttribute('ui-effect') === 'goo' ? 'goo' : 'typing';
    this.#duration = positiveMilliseconds(this.getAttribute('ui-duration'), this.#effect === 'slide' ? 300 : this.#effect === 'goo' ? 1000 : 100);
    this.#delay = positiveMilliseconds(this.getAttribute('ui-delay'), 2000);
    this.#index = 0;
    this.#count = 0;
    this.#inner!.dataset['effect'] = this.#effect;
    this.#inner!.removeAttribute('data-transitioning');
    this.style.setProperty('--ui-typing-duration', `${this.#duration}ms`);
    this.#sizer!.replaceChildren(...this.#words.map((word) => {
      const span = document.createElement('span');
      span.textContent = word;
      return span;
    }));
    this.#content!.replaceChildren();
    this.#current = null;
    this.#blobLayer = null;
    this.#blobCurrent = null;
    this.#cursor = null;
    if (!this.#words.length) { this.#label(''); return; }
    this.#label(this.#words[0]!);
    if (this.#reduced?.matches) {
      this.#current = this.#word(this.#words[0]!, 'current');
      this.#content!.append(this.#current);
      return;
    }
    if (this.#effect === 'typing') {
      this.#current = this.#word('', 'current');
      this.#cursor = document.createElement('span');
      this.#cursor.className = 'cursor';
      this.#cursor.textContent = this.getAttribute('ui-cursor-char') ?? '|';
      this.#content!.append(this.#current, this.#cursor);
      this.#typeNext();
    } else {
      this.#current = this.#word(this.#words[0]!, 'current');
      if (this.#effect === 'goo') {
        this.#blobLayer = document.createElement('span');
        this.#blobLayer.className = 'goo-blob';
        this.#blobCurrent = this.#word(this.#words[0]!, 'current');
        this.#blobLayer.append(this.#blobCurrent);
        this.#content!.append(this.#blobLayer);
      }
      this.#content!.append(this.#current);
      if (this.#words.length > 1) this.#timer = window.setTimeout(() => this.#transition(), this.#delay);
    }
  }

  #typeNext(): void {
    const chars = characters(this.#words[this.#index]!);
    if (this.#count < chars.length) {
      this.#count++;
      this.#current!.textContent = chars.slice(0, this.#count).join('');
      this.#timer = window.setTimeout(() => this.#typeNext(), Math.max(16, this.#duration));
    } else if (this.#words.length > 1) {
      this.#timer = window.setTimeout(() => this.#erase(), this.#delay);
    }
  }

  #erase(): void {
    if (this.#count > 0) {
      this.#count--;
      this.#current!.textContent = characters(this.#words[this.#index]!).slice(0, this.#count).join('');
      this.#timer = window.setTimeout(() => this.#erase(), Math.max(16, this.#duration / 2));
      return;
    }
    this.#index = (this.#index + 1) % this.#words.length;
    this.#label(this.#words[this.#index]!);
    this.#typeNext();
  }

  #transition(): void {
    const nextIndex = (this.#index + 1) % this.#words.length;
    const next = this.#word(this.#words[nextIndex]!, 'next');
    const blobNext = this.#effect === 'goo' ? this.#word(this.#words[nextIndex]!, 'next') : null;
    if (blobNext) this.#blobLayer!.append(blobNext);
    this.#content!.append(next);
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#inner!.setAttribute('data-transitioning', '');
      this.#timer = window.setTimeout(() => {
        this.#current!.remove();
        next.className = 'word current';
        if (blobNext) {
          this.#blobCurrent!.remove();
          blobNext.className = 'word current';
          this.#blobCurrent = blobNext;
        }
        this.#inner!.removeAttribute('data-transitioning');
        this.#current = next;
        this.#index = nextIndex;
        this.#label(this.#words[this.#index]!);
        this.#timer = window.setTimeout(() => this.#transition(), this.#delay);
      }, this.#duration);
    });
  }
}

export class UiTypingInner extends HTMLElement {}
export class UiTypingContent extends HTMLElement {}

define('ui-typing', UiTyping);
define('ui-typing-inner', UiTypingInner);
define('ui-typing-content', UiTypingContent);

export const typing = UiTyping;
export const typingInner = UiTypingInner;
export const typingContent = UiTypingContent;

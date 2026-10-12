/**
 * Unit Test Suite for Marquee Component (<ui-marquee>, <core-marquee>, <xo-marquee>)
 * Testing full xo-* attribute specification and enterprise behaviors.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';
import type { UiMarquee } from '../src/marquee/index.js';

describe('<ui-marquee> / <core-marquee> / <xo-marquee> Spec Test Suite', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  function createMarquee(
    tag = 'ui-marquee',
    attrs: Record<string, string> = {},
    itemCount = 3
  ): UiMarquee {
    const el = document.createElement(tag) as UiMarquee;
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    for (let i = 0; i < itemCount; i++) {
      const span = document.createElement('span');
      span.textContent = `Item ${i + 1}`;
      el.appendChild(span);
    }
    container.appendChild(el);
    return el;
  }

  describe('1. Registration and Tag Aliases', () => {
    it('registers <ui-marquee>, <core-marquee>, and <xo-marquee>', () => {
      const ui = createMarquee('ui-marquee');
      const core = createMarquee('core-marquee');
      const xo = createMarquee('xo-marquee');

      expect(ui.hasAttribute('initialized')).toBe(true);
      expect(core.hasAttribute('initialized')).toBe(true);
      expect(xo.hasAttribute('initialized')).toBe(true);

      expect(ui.getAttribute('role')).toBe('region');
      expect(ui.getAttribute('aria-roledescription')).toBe('marquee');
    });
  });

  describe('2. Default Options and Standard Attributes', () => {
    it('uses correct defaults', () => {
      const m = createMarquee('ui-marquee');
      expect(m.effectiveSpeed).toBe(6);
      expect(m.effectiveDirection).toBe('rtl');
      expect(m.effectivePauseOnHover).toBe(false);
      expect(m.isAutoRun).toBe(true);
      expect(m.isScrollEnabled).toBe(false);
      expect(m.effectiveScrollSpeed).toBe(1);
      expect(m.isVertical).toBe(false);
      expect(m.isRunning).toBe(true);
    });

    it('reads standard attributes', () => {
      const m = createMarquee('ui-marquee', {
        speed: '10',
        direction: 'ltr',
        'pause-on-hover': 'true',
        'auto-run': 'false',
        'scroll-enabled': 'true',
        'scroll-speed': '2',
        vertical: 'true',
      });

      expect(m.effectiveSpeed).toBe(10);
      expect(m.effectiveDirection).toBe('ltr');
      expect(m.effectivePauseOnHover).toBe(true);
      expect(m.isAutoRun).toBe(false);
      expect(m.isScrollEnabled).toBe(true);
      expect(m.effectiveScrollSpeed).toBe(2);
      expect(m.isVertical).toBe(true);
      expect(m.isRunning).toBe(false);
    });
  });

  describe('3. xo-* HTML Attributes Compatibility', () => {
    it('parses xo-speed correctly', () => {
      const m = createMarquee('xo-marquee', { 'xo-speed': '12' });
      expect(m.effectiveSpeed).toBe(12);
    });

    it('parses xo-direction correctly (ltr, rtl, btt, ttb)', () => {
      const mLtr = createMarquee('xo-marquee', { 'xo-direction': 'ltr' });
      expect(mLtr.effectiveDirection).toBe('ltr');

      const mBtt = createMarquee('xo-marquee', { 'xo-direction': 'btt' });
      expect(mBtt.effectiveDirection).toBe('btt');

      const mTtb = createMarquee('xo-marquee', { 'xo-direction': 'ttb' });
      expect(mTtb.effectiveDirection).toBe('ttb');
    });

    it('parses xo-vertical and sets default direction to btt', () => {
      const m = createMarquee('xo-marquee', { 'xo-vertical': 'true' });
      expect(m.isVertical).toBe(true);
      expect(m.effectiveDirection).toBe('btt');
    });

    it('parses xo-pause-on-hover', () => {
      const m = createMarquee('xo-marquee', { 'xo-pause-on-hover': 'true' });
      expect(m.effectivePauseOnHover).toBe(true);
    });

    it('parses xo-auto-run', () => {
      const m = createMarquee('xo-marquee', { 'xo-auto-run': 'false' });
      expect(m.isAutoRun).toBe(false);
      expect(m.isRunning).toBe(false);
    });

    it('parses xo-scroll-enabled and xo-scroll-speed', () => {
      const m = createMarquee('xo-marquee', {
        'xo-scroll-enabled': 'true',
        'xo-scroll-speed': '1.5',
      });
      expect(m.isScrollEnabled).toBe(true);
      expect(m.effectiveScrollSpeed).toBe(1.5);
    });
  });

  describe('4. Gapless Clone DOM Structure', () => {
    it('creates viewport, track, and clones', () => {
      const m = createMarquee('ui-marquee');
      const viewport = m.querySelector('[data-marquee-viewport]');
      const track = m.querySelector('[data-marquee-track]');
      const content = m.querySelector('[data-marquee-content]');
      const clones = m.querySelectorAll('[data-marquee-clone]');

      expect(viewport).not.toBeNull();
      expect(track).not.toBeNull();
      expect(content).not.toBeNull();
      expect(clones.length).toBeGreaterThanOrEqual(1);

      // Verify clone accessibility
      for (const clone of clones) {
        expect(clone.getAttribute('aria-hidden')).toBe('true');
      }
    });

    it('ensures total group count is an even number for seamless looping', () => {
      const m = createMarquee('ui-marquee');
      const content = m.querySelectorAll('[data-marquee-content], [data-marquee-clone]');
      expect(content.length % 2).toBe(0);
      expect(content.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('5. Speed and Duration Calculation', () => {
    it('calculates shorter duration for higher speed (cao = nhanh)', () => {
      const mSlow = createMarquee('ui-marquee', { speed: '3' });
      const mFast = createMarquee('ui-marquee', { speed: '12' });

      const dSlow = parseFloat(mSlow.style.getPropertyValue('--ui-marquee-duration'));
      const dFast = parseFloat(mFast.style.getPropertyValue('--ui-marquee-duration'));

      expect(dFast).toBeLessThan(dSlow);
    });

    it('exposes both --ui-marquee-duration and --xo-marquee-duration', () => {
      const m = createMarquee('xo-marquee', { 'xo-speed': '8' });
      const uiDur = m.style.getPropertyValue('--ui-marquee-duration');
      const xoDur = m.style.getPropertyValue('--xo-marquee-duration');

      expect(uiDur).toBeTruthy();
      expect(uiDur).toBe(xoDur);
    });
  });

  describe('6. Play / Pause / Toggle Controls', () => {
    it('pauses and resumes on API call and emits events', () => {
      const m = createMarquee('ui-marquee');
      const onPause = vi.fn();
      const onPlay = vi.fn();
      m.addEventListener('ui-marquee:pause', onPause);
      m.addEventListener('ui-marquee:play', onPlay);

      m.pause();
      expect(m.isRunning).toBe(false);
      expect(onPause).toHaveBeenCalledTimes(1);

      const track = m.querySelector('[data-marquee-track]') as HTMLElement;
      expect(track.style.animationPlayState).toBe('paused');

      m.play();
      expect(m.isRunning).toBe(true);
      expect(onPlay).toHaveBeenCalledTimes(1);
      expect(track.style.animationPlayState).toBe('running');

      m.toggle();
      expect(m.isRunning).toBe(false);

      m.toggle();
      expect(m.isRunning).toBe(true);
    });
  });

  describe('7. xo-observed Design Mode Trigger', () => {
    it('rebuilds marquee when xo-observed changes', () => {
      const m = createMarquee('xo-marquee', { 'xo-observed': 'v1' });
      const refreshSpy = vi.spyOn(m, 'refresh');

      m.setAttribute('xo-observed', 'v2');
      expect(refreshSpy).toHaveBeenCalled();
    });
  });
});

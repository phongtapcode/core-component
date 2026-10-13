import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parsePhotoSwipeOptions } from '../src/index.js';

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => {
  document.body.innerHTML = '';
  document.querySelector('link[data-ui-photoswipe-css]')?.remove();
  vi.restoreAllMocks();
});

describe('ui-photoswipe', () => {
  it('safely parses options while preserving control of the gallery and loader', () => {
    expect(parsePhotoSwipeOptions('{ bgOpacity: 0.9, loop: false, wheelToZoom: true, }')).toEqual({
      bgOpacity: 0.9, loop: false, wheelToZoom: true,
    });
    expect(parsePhotoSwipeOptions('{"gallery":"#other","children":"div","dataSource":[],"bgOpacity":0.6}'))
      .toEqual({ bgOpacity: 0.6 });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parsePhotoSwipeOptions('{ broken')).toEqual({});
    expect(warning).toHaveBeenCalledOnce();
  });

  it('keeps links usable and starts loading only after a valid gallery click', () => {
    const appendedLinks: HTMLLinkElement[] = [];
    vi.spyOn(document.head, 'append').mockImplementation((...nodes) => {
      for (const node of nodes) if (node instanceof HTMLLinkElement) appendedLinks.push(node);
    });
    const gallery = document.createElement('ui-photoswipe');
    gallery.innerHTML = '<a href="/full.jpg" data-pswp-width="1200" data-pswp-height="800"><img src="/thumb.jpg" alt="Photo"></a><a href="/invalid.jpg" data-pswp-width="0" data-pswp-height="800">Invalid</a>';
    document.body.append(gallery);
    expect(document.querySelector('link[data-ui-photoswipe-css]')).toBeNull();

    const invalidClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    gallery.querySelectorAll('a')[1]!.dispatchEvent(invalidClick);
    expect(invalidClick.defaultPrevented).toBe(false);

    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    gallery.querySelector('img')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(appendedLinks).toHaveLength(1);
    expect(appendedLinks[0]?.href).toContain('photoswipe@5.4.4/dist/photoswipe.css');
  });
});

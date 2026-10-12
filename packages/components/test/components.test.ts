import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/index.js';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('<ui-toggle>', () => {
  it('toggles checked on click', async () => {
    const el = document.createElement('ui-toggle');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-checked')).toBe('false');
    el.click();
    expect(el.getAttribute('aria-checked')).toBe('true');
    el.click();
    expect(el.getAttribute('aria-checked')).toBe('false');
  });

  it('emits ui-toggle-change', () => {
    const el = document.createElement('ui-toggle');
    document.body.appendChild(el);
    const cb = vi.fn();
    el.addEventListener('ui-toggle-change', cb as EventListener);
    (el as unknown as { toggle(): void }).toggle();
    expect(cb).toHaveBeenCalledTimes(1);
    const ev = cb.mock.calls[0]?.[0] as CustomEvent<{ checked: boolean }>;
    expect(ev.detail?.checked).toBe(true);
  });

  it('does not toggle when disabled', () => {
    const el = document.createElement('ui-toggle');
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    el.click();
    expect(el.getAttribute('aria-checked')).toBe('false');
  });

  it('responds to Space and Enter', () => {
    const el = document.createElement('ui-toggle');
    document.body.appendChild(el);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('check()/uncheck() set state explicitly', () => {
    const el = document.createElement('ui-toggle');
    document.body.appendChild(el);
    (el as unknown as { check(): void }).check();
    expect(el.getAttribute('aria-checked')).toBe('true');
    (el as unknown as { uncheck(): void }).uncheck();
    expect(el.getAttribute('aria-checked')).toBe('false');
  });
});

describe('<ui-collapse>', () => {
  it('toggles open attribute', () => {
    const el = document.createElement('ui-collapse');
    document.body.appendChild(el);
    expect(el.hasAttribute('open')).toBe(false);
    (el as unknown as { toggle(): void }).toggle();
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('emits ui-collapse-toggle', () => {
    const el = document.createElement('ui-collapse');
    document.body.appendChild(el);
    const cb = vi.fn();
    el.addEventListener('ui-collapse-toggle', cb as EventListener);
    (el as unknown as { open$(): void }).open$();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('responds to Enter and Space', () => {
    const el = document.createElement('ui-collapse');
    document.body.appendChild(el);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(el.hasAttribute('open')).toBe(true);
  });
});

describe('<ui-accordion>', () => {
  it('connects without error', () => {
    const el = document.createElement('ui-accordion');
    document.body.appendChild(el);
    expect(el.isConnected).toBe(true);
  });

  it('closes other collapses when one opens (single mode)', () => {
    const acc = document.createElement('ui-accordion');
    const c1 = document.createElement('ui-collapse');
    const c2 = document.createElement('ui-collapse');
    acc.append(c1, c2);
    document.body.appendChild(acc);
    // Manually set since connect already fired before children were added.
    (acc as unknown as { onConnect(): void }).onConnect();
    c1.setAttribute('open', '');
    c1.dispatchEvent(new CustomEvent('ui-collapse-toggle', { bubbles: true }));
    expect(c2.hasAttribute('open')).toBe(false);
  });
});

describe('<ui-tabs>', () => {
  function makeTabs(): HTMLElement {
    const tabs = document.createElement('ui-tabs');
    tabs.innerHTML = `
      <div role="tablist">
        <button role="tab" id="t1" aria-controls="p1">One</button>
        <button role="tab" id="t2" aria-controls="p2">Two</button>
      </div>
      <div role="tabpanel" id="p1" aria-labelledby="t1">A</div>
      <div role="tabpanel" id="p2" aria-labelledby="t2">B</div>
    `;
    return tabs;
  }

  it('selects first tab by default', () => {
    const el = makeTabs();
    document.body.appendChild(el);
    expect(el.getAttribute('value')).toBe('t1');
    const tabs = [...el.querySelectorAll('[role="tab"]')];
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
  });

  it('click on tab changes selection', () => {
    const el = makeTabs();
    document.body.appendChild(el);
    const t2 = el.querySelector('#t2') as HTMLElement;
    t2.click();
    expect(el.getAttribute('value')).toBe('t2');
    const tabs = [...el.querySelectorAll('[role="tab"]')];
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('false');
  });

  it('emits ui-tabs-change', () => {
    const el = makeTabs();
    document.body.appendChild(el);
    const cb = vi.fn();
    el.addEventListener('ui-tabs-change', cb as EventListener);
    (el.querySelector('#t2') as HTMLElement).click();
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('arrow keys move focus', () => {
    const el = makeTabs();
    document.body.appendChild(el);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(el.getAttribute('value')).toBe('t2');
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(el.getAttribute('value')).toBe('t1');
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    expect(el.getAttribute('value')).toBe('t2');
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(el.getAttribute('value')).toBe('t1');
  });
});

describe('<ui-modal>', () => {
  it('opens and closes', () => {
    const el = document.createElement('ui-modal');
    document.body.appendChild(el);
    (el as unknown as { openModal(): void }).openModal();
    expect(el.hasAttribute('open')).toBe(true);
    (el as unknown as { closeModal(): void }).closeModal();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('emits ui-modal-open and ui-modal-close', () => {
    const el = document.createElement('ui-modal');
    document.body.appendChild(el);
    const openCb = vi.fn();
    const closeCb = vi.fn();
    el.addEventListener('ui-modal-open', openCb as EventListener);
    el.addEventListener('ui-modal-close', closeCb as EventListener);
    (el as unknown as { openModal(): void }).openModal();
    (el as unknown as { closeModal(): void }).closeModal();
    expect(openCb).toHaveBeenCalledTimes(1);
    expect(closeCb).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape when dismissable', () => {
    const el = document.createElement('ui-modal');
    document.body.appendChild(el);
    (el as unknown as { openModal(): void }).openModal();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('does not close on Escape when not dismissable', () => {
    const el = document.createElement('ui-modal');
    el.setAttribute('dismissable', 'false');
    document.body.appendChild(el);
    (el as unknown as { openModal(): void }).openModal();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('closes on overlay click', () => {
    const el = document.createElement('ui-modal');
    el.innerHTML = '<div data-modal-overlay></div><div data-modal-dialog>X</div>';
    document.body.appendChild(el);
    (el as unknown as { openModal(): void }).openModal();
    (el.querySelector('[data-modal-overlay]') as HTMLElement).click();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('closes on data-modal-close click', () => {
    const el = document.createElement('ui-modal');
    el.innerHTML = '<div data-modal-dialog><button data-modal-close>X</button></div>';
    document.body.appendChild(el);
    (el as unknown as { openModal(): void }).openModal();
    (el.querySelector('[data-modal-close]') as HTMLElement).click();
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('<ui-drawer>', () => {
  it('opens and closes', () => {
    const el = document.createElement('ui-drawer');
    document.body.appendChild(el);
    (el as unknown as { openDrawer(): void }).openDrawer();
    expect(el.hasAttribute('open')).toBe(true);
    (el as unknown as { closeDrawer(): void }).closeDrawer();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('reflects placement attribute', () => {
    const el = document.createElement('ui-drawer');
    el.setAttribute('placement', 'right');
    document.body.appendChild(el);
    expect(el.getAttribute('placement')).toBe('right');
  });

  it('closes on Escape', () => {
    const el = document.createElement('ui-drawer');
    document.body.appendChild(el);
    (el as unknown as { openDrawer(): void }).openDrawer();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('<ui-popover>', () => {
  function makePopover(): HTMLElement {
    const p = document.createElement('ui-popover');
    p.innerHTML = `
      <button data-popover-trigger>Open</button>
      <div data-popover-content>X</div>
    `;
    return p;
  }

  it('opens on trigger click and closes on trigger click again', () => {
    const el = makePopover();
    document.body.appendChild(el);
    (el.querySelector('[data-popover-trigger]') as HTMLElement).click();
    expect(el.hasAttribute('open')).toBe(true);
    (el.querySelector('[data-popover-trigger]') as HTMLElement).click();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('closes on outside click', () => {
    const el = makePopover();
    document.body.appendChild(el);
    (el as unknown as { open$(): void }).open$();
    document.body.click();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('emits ui-popover-open', () => {
    const el = makePopover();
    document.body.appendChild(el);
    const cb = vi.fn();
    el.addEventListener('ui-popover-open', cb as EventListener);
    (el as unknown as { open$(): void }).open$();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('<ui-lazyload>', () => {
  it('swaps data-src to src on load()', () => {
    const el = document.createElement('ui-lazyload');
    el.innerHTML = '<img data-src="real.jpg" src="placeholder.jpg">';
    document.body.appendChild(el);
    (el as unknown as { load(): void }).load();
    const img = el.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('real.jpg');
    expect(img.hasAttribute('data-src')).toBe(false);
  });

  it('also swaps data-srcset to srcset', () => {
    const el = document.createElement('ui-lazyload');
    el.innerHTML = '<img data-srcset="real.jpg 1x" data-src="real.jpg">';
    document.body.appendChild(el);
    (el as unknown as { load(): void }).load();
    const img = el.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('srcset')).toBe('real.jpg 1x');
  });

  it('emits ui-lazyload-loaded', () => {
    const el = document.createElement('ui-lazyload');
    el.innerHTML = '<img data-src="real.jpg">';
    document.body.appendChild(el);
    const cb = vi.fn();
    el.addEventListener('ui-lazyload-loaded', cb as EventListener);
    (el as unknown as { load(): void }).load();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe('<ui-image-zoom>', () => {
  it('opens overlay on image click', () => {
    const el = document.createElement('ui-image-zoom');
    el.innerHTML = '<img src="a.jpg">';
    document.body.appendChild(el);
    (el.querySelector('img') as HTMLElement).click();
    expect(document.querySelector('[data-ui-image-zoom-overlay]')).toBeTruthy();
  });

  it('closes on overlay click', () => {
    const el = document.createElement('ui-image-zoom');
    el.innerHTML = '<img src="a.jpg">';
    document.body.appendChild(el);
    (el.querySelector('img') as HTMLElement).click();
    (document.querySelector('[data-ui-image-zoom-overlay]') as HTMLElement).click();
    expect(document.querySelector('[data-ui-image-zoom-overlay]')).toBeFalsy();
  });
});

describe('<ui-image-comparison>', () => {
  it('has ARIA slider role', () => {
    const el = document.createElement('ui-image-comparison');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('slider');
  });

  it('arrow keys change value', () => {
    const el = document.createElement('ui-image-comparison');
    document.body.appendChild(el);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect((el as unknown as { value: number }).value).toBe(55);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect((el as unknown as { value: number }).value).toBe(45);
  });
});

describe('<ui-counter>', () => {
  it('renders immediately when reduced motion is active', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' })) as typeof matchMedia;
    const c = document.createElement('ui-counter');
    c.setAttribute('from', '0');
    c.setAttribute('to', '100');
    document.body.appendChild(c);
    expect(c.textContent).toBe('100');
    window.matchMedia = originalMatchMedia;
  });

  it('renders the target when duration is zero', () => {
    const c = document.createElement('ui-counter');
    c.setAttribute('from', '0');
    c.setAttribute('to', '42');
    c.setAttribute('duration', '0');
    document.body.appendChild(c);
    expect(c.textContent).toBe('42');
  });
});

describe('<ui-dark-mode>', () => {
  it('sets data-theme on documentElement', () => {
    const el = document.createElement('ui-dark-mode');
    el.setAttribute('mode', 'dark');
    document.body.appendChild(el);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('cycles mode on click', () => {
    const el = document.createElement('ui-dark-mode');
    el.setAttribute('mode', 'light');
    el.setAttribute('storage', 'none');
    document.body.appendChild(el);
    el.click();
    expect(el.getAttribute('mode')).toBe('dark');
  });
});

describe('<ui-marquee>', () => {
  it('duplicates children into clones for seamless looping', () => {
    const el = document.createElement('ui-marquee');
    el.innerHTML = '<span>A</span><span>B</span>';
    document.body.appendChild(el);
    expect(el.querySelectorAll('[data-marquee-clone]').length).toBeGreaterThanOrEqual(1);
  });
});

describe('<ui-carousel>', () => {
  function makeCarousel(): HTMLElement {
    const c = document.createElement('ui-carousel');
    c.innerHTML = '<div>1</div><div>2</div><div>3</div>';
    return c;
  }

  it('starts at index 0', () => {
    const c = makeCarousel();
    document.body.appendChild(c);
    expect(c.getAttribute('index')).toBe('0');
  });

  it('next() advances and emits', () => {
    const c = makeCarousel();
    document.body.appendChild(c);
    const cb = vi.fn();
    c.addEventListener('ui-carousel-change', cb as EventListener);
    (c as unknown as { next(): void }).next();
    expect(c.getAttribute('index')).toBe('1');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('prev() goes back', () => {
    const c = makeCarousel();
    document.body.appendChild(c);
    (c as unknown as { goto(i: number): void }).goto(2);
    (c as unknown as { prev(): void }).prev();
    expect(c.getAttribute('index')).toBe('1');
  });

  it('stays at the first slide by default', () => {
    const c = makeCarousel();
    document.body.appendChild(c);
    (c as unknown as { prev(): void }).prev();
    expect(c.getAttribute('index')).toBe('0');
  });

  it('arrow keys move carousel', () => {
    const c = makeCarousel();
    document.body.appendChild(c);
    c.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(c.getAttribute('index')).toBe('1');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(c.getAttribute('index')).toBe('0');
  });
});

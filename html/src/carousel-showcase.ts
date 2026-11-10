import type { UiCarousel } from '@ui/components';

const images = [
  { src: 'coast.jpg', title: 'Open water', note: 'Coastal journal' },
  { src: 'architecture.jpg', title: 'Quiet lines', note: 'Spaces and form' },
  { src: 'botanical.jpg', title: 'New growth', note: 'Botanical study' },
  { src: 'flex-2.jpg', title: 'White room', note: 'Portrait study' },
  { src: 'flex-4.jpg', title: 'Clay form', note: 'Object study' },
  { src: 'flex-6.jpg', title: 'Brim', note: 'Editorial portrait' },
];

const escapeCode = (value: string): string => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const codeSources = new WeakMap<HTMLElement, string>();
let codeHighlighter: Promise<(source: string) => string> | null = null;
function loadCodeHighlighter(): Promise<(source: string) => string> {
  codeHighlighter ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('shiki/langs/html.mjs'),
    import('shiki/themes/github-dark.mjs'),
  ]).then(async ([core, engine, html, theme]) => {
    const highlighter = await core.createHighlighterCore({
      themes: [theme.default],
      langs: [html.default],
      engine: engine.createJavaScriptRegexEngine(),
    });
    return (source: string) => highlighter.codeToHtml(source, { lang: 'html', theme: 'github-dark' });
  });
  return codeHighlighter;
}
async function highlightCarouselCode(code: HTMLElement): Promise<void> {
  const source = codeSources.get(code) ?? code.textContent ?? '';
  codeSources.set(code, source);
  try {
    const highlight = await loadCodeHighlighter();
    const highlighted = highlight(source);
    if (codeSources.get(code) !== source || !code.isConnected) return;
    const template = document.createElement('template');
    template.innerHTML = highlighted;
    const rendered = template.content.querySelector('code');
    if (rendered) code.innerHTML = rendered.innerHTML;
  } catch {
    // The readable source stays available if highlighting cannot load.
  }
}
const formatMarkup = (markup: string): string => {
  const template = document.createElement('template');
  template.innerHTML = markup;
  const format = (node: Node, depth: number): string => {
    const indent = '  '.repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) return `${indent}${node.textContent?.trim() ?? ''}`;
    if (!(node instanceof Element)) return '';
    const tag = node.localName;
    const closing = `</${tag}>`;
    const empty = node.cloneNode(false) as Element;
    const serialized = empty.outerHTML;
    const opening = serialized.endsWith(closing) ? serialized.slice(0, -closing.length) : serialized;
    if (!serialized.endsWith(closing)) return `${indent}${opening}`;
    const children = [...node.childNodes].filter((child) => child.nodeType !== Node.TEXT_NODE || child.textContent?.trim());
    if (children.length === 0) return `${indent}${opening}${closing}`;
    if (children.length === 1 && children[0]?.nodeType === Node.TEXT_NODE) return `${indent}${opening}${children[0].textContent?.trim()}${closing}`;
    return `${indent}${opening}\n${children.map((child) => format(child, depth + 1)).join('\n')}\n${indent}${closing}`;
  };
  return [...template.content.childNodes].filter((node) => node.nodeType !== Node.TEXT_NODE || node.textContent?.trim()).map((node) => format(node, 0)).join('\n');
};
const photo = (index: number, kind = 'photo'): string => {
  const image = images[index % images.length]!;
  return `<figure class="carousel-lab__${kind}"><img src="/images/${image.src}" alt="${image.title}" loading="lazy"><figcaption><strong>${image.title}</strong><span>${image.note}</span></figcaption></figure>`;
};
const slides = (count = 6, kind = 'photo'): string => Array.from({ length: count }, (_, index) => `<ui-carousel-slide>${photo(index, kind)}</ui-carousel-slide>`).join('');
const track = (content: string): string => `<ui-carousel-inner><ui-carousel-list>${content}</ui-carousel-list></ui-carousel-inner>`;
const arrows = (previous = 'Previous slide', next = 'Next slide'): string => `<div class="carousel-lab__arrows"><ui-carousel-prev><button type="button" aria-label="${previous}">←</button></ui-carousel-prev><ui-carousel-next><button type="button" aria-label="${next}">→</button></ui-carousel-next></div>`;
const pagination = (): string => '<ui-carousel-pagination class="carousel-lab__dots"></ui-carousel-pagination>';
const progress = (): string => '<ui-carousel-pagination-progress class="carousel-lab__progress"></ui-carousel-pagination-progress>';
const counter = (): string => '<span class="carousel-lab__counter"><ui-carousel-page></ui-carousel-page><span>/</span><ui-carousel-size></ui-carousel-size></span>';
const carousel = (attrs: string, content: string, controls = `${pagination()}${arrows()}`, className = ''): string =>
  `<ui-carousel class="carousel-lab__carousel ${className}" ${attrs}>${track(content)}<div class="carousel-lab__controls">${controls}</div></ui-carousel>`;

interface Example { intro: string; markup: string; note?: string; }

function example(name: string): Example {
  switch (name) {
    case 'Basic': return {
      intro: 'A simple photo gallery. Drag, swipe, use the arrows, or focus the carousel and press Left / Right.',
      markup: carousel('ui-gap="0" aria-label="Basic photo gallery"', slides()),
    };
    case 'Responsive': return {
      intro: 'Four cards on wide screens, then two, then one. Breakpoints follow the carousel container width.',
      markup: carousel(`ui-per-view="4" ui-gap="16" ui-breakpoints="{ 640: { perView: 1, gap: 10 }, 960: { perView: 2, gap: 12 }, 1200: { perView: 3 } }" aria-label="Responsive gallery"`, slides(6, 'card'), `${progress()}${arrows()}`, 'carousel-lab__carousel--cards'),
    };
    case 'Loop': return {
      intro: 'Move from the last slide to the first without a visible rewind. The current implementation uses inert end clones.',
      markup: carousel('ui-loop ui-per-view="2" ui-gap="14" ui-breakpoints="{ 640: { perView: 1 } }" aria-label="Looping gallery"', slides(6, 'tile'), `${counter()}${arrows()}`, 'carousel-lab__carousel--cards'),
    };
    case 'Autoplay': return {
      intro: 'Autoplay pauses on hover, keyboard focus, hidden tabs, and reduced motion. The bar shows time left on the current slide.',
      markup: carousel('ui-loop ui-autoplay="3600" ui-progress ui-gap="0" aria-label="Autoplay stories"', slides(3), `${counter()}<span class="carousel-lab__autoplay-meter" aria-hidden="true"></span>${arrows()}`, 'carousel-lab__carousel--autoplay'),
    };
    case 'Transitions': return {
      intro: 'Choose a transition. Fade, wind, nature, water, and urban are real ui-type values.',
      markup: `<label class="carousel-lab__field">Transition <select data-carousel-type><option>slide</option><option>fade</option><option>wind</option><option>nature</option><option>water</option><option>urban</option><option>none</option></select></label>${carousel('ui-type="slide" ui-speed="650" ui-loop ui-gap="0" aria-label="Transition preview"', slides(4), `${counter()}${arrows()}`, 'carousel-lab__carousel--transition')}`,
    };
    case 'Vertical': return {
      intro: 'A fixed-height viewport turns the carousel into a vertical story rail. Use Up / Down keys when focused.',
      markup: carousel('ui-vertical ui-loop ui-per-view="2" ui-gap="12" aria-label="Vertical stories"', slides(6, 'vertical'), `${counter()}${arrows('Previous story', 'Next story')}`, 'carousel-lab__carousel--vertical'),
    };
    case 'Thumbnails': return {
      intro: 'Click a thumbnail to select the matching photo. The rail follows the active slide.',
      markup: `<ui-carousel class="carousel-lab__carousel carousel-lab__carousel--thumbnails" ui-gap="0" aria-label="Gallery with thumbnails">${track(slides(6))}<div class="carousel-lab__controls">${counter()}${arrows()}</div><ui-carousel-thumbnail ui-per-view="4" ui-gap="10" aria-label="Select a photo">${track(slides(6, 'thumb'))}</ui-carousel-thumbnail></ui-carousel>`,
    };
    case 'Pagination': return {
      intro: 'Bullet pages, a fraction, and a progress bar all read the same carousel state. Limit visible bullets with ui-per-view.',
      markup: carousel('ui-gap="0" ui-render-bullet="<span class=\'carousel-lab__bullet\'></span>" aria-label="Pagination gallery"', slides(6), `<ui-carousel-pagination class="carousel-lab__dots" per-view="5"></ui-carousel-pagination>${counter()}${progress()}${arrows()}`),
    };
    case 'Custom controls': return {
      intro: 'Prev and next wrappers accept your own buttons. Their disabled state follows the current edge.',
      markup: `<div class="carousel-lab__topline"><strong>Selected work</strong></div>${carousel('ui-per-view="2" ui-gap="14" ui-breakpoints="{ 640: { perView: 1 } }" aria-label="Custom navigation"', slides(6, 'card'), `<div class="carousel-lab__arrows carousel-lab__arrows--custom"><ui-carousel-prev><button type="button" aria-label="Previous work">Previous work</button></ui-carousel-prev><ui-carousel-next><button type="button" aria-label="Next work">Next work →</button></ui-carousel-next></div>`, 'carousel-lab__carousel--custom')}`,
    };
    case 'Center and overflow': return {
      intro: 'The middle visible slide receives [center]. Fractional ui-per-view lets the next card peek into view.',
      markup: `${carousel('ui-loop ui-per-view="3" ui-gap="12" ui-breakpoints="{ 640: { perView: 1 } }" aria-label="Centered gallery"', slides(6, 'tile'), arrows(), 'carousel-lab__carousel--center')}${carousel('ui-per-view="2.4" ui-gap="14" ui-overflow="visible" ui-breakpoints="{ 640: { perView: 1.2 } }" aria-label="Overflow gallery"', slides(6, 'card'), `${progress()}${arrows()}`, 'carousel-lab__carousel--overflow')}`,
    };
    case 'Auto height': return {
      intro: 'The viewport follows the height of visible content as you move through short and long cards.',
      markup: carousel('ui-autoheight ui-gap="0" ui-speed="400" aria-label="Variable height tips"', [
        '<ui-carousel-slide><article class="carousel-lab__tip"><h4>Keep it simple</h4><p>Short cards need only a little space.</p></article></ui-carousel-slide>',
        '<ui-carousel-slide><article class="carousel-lab__tip"><h4>Give details room</h4><p>This card includes more text, so the frame grows to fit it.</p><p>Use this setting for reviews, instructions, and other content that does not share a fixed height.</p></article></ui-carousel-slide>',
        '<ui-carousel-slide><article class="carousel-lab__tip"><h4>Back to compact</h4><p>The frame shrinks again.</p></article></ui-carousel-slide>',
      ].join(''), `${counter()}${arrows()}`, 'carousel-lab__carousel--autoheight'),
    };
    case 'Synchronized': return {
      intro: 'Two carousels share ui-sync-id. Moving either one updates the other while each keeps its own transition.',
      markup: `<div class="carousel-lab__sync">${carousel('ui-sync-id="studio-pair" ui-loop ui-gap="0" aria-label="Synchronized photos"', slides(4), arrows())}${carousel('ui-sync-id="studio-pair" ui-type="fade" ui-loop ui-gap="0" aria-label="Synchronized captions"', images.slice(0, 4).map((image) => `<ui-carousel-slide><div class="carousel-lab__sync-copy"><h4>${image.title}</h4><p>${image.note}</p></div></ui-carousel-slide>`).join(''), `${counter()}${arrows()}`, 'carousel-lab__carousel--sync-copy')}</div>`,
    };
    case 'Product row': return {
      intro: 'Set a target card width and the carousel calculates how many columns fit. Resize the page to see it adapt.',
      markup: carousel('ui-column-width="200" ui-gap="16" aria-label="Product row"', slides(6, 'product'), `${progress()}${arrows()}`, 'carousel-lab__carousel--products'),
    };
    case 'Hero': return {
      intro: 'A wide banner combines loop, autoplay, slide count, and a clear call to action inside each slide.',
      markup: carousel('ui-loop ui-autoplay="5200" ui-progress ui-gap="0" aria-label="Editorial hero"', images.slice(0, 3).map((image) => `<ui-carousel-slide><div class="carousel-lab__hero"><img src="/images/${image.src}" alt="${image.title}" loading="lazy"><div><span>${image.note}</span><h4>${image.title}</h4><a href="#/docs/carousel">Explore the API →</a></div></div></ui-carousel-slide>`).join(''), `${counter()}<span class="carousel-lab__autoplay-meter" aria-hidden="true"></span>${arrows()}`, 'carousel-lab__carousel--hero'),
    };
    case 'Testimonials': return {
      intro: 'Fade between quotes; select a person from the thumbnail rail below.',
      markup: `<ui-carousel class="carousel-lab__carousel carousel-lab__carousel--quotes" ui-type="fade" ui-speed="500" ui-rewind ui-gap="0" aria-label="Customer quotes">${track([
        ['“The markup is readable and the controls just work.”', 'Lan, designer'],
        ['“We can change the layout without rewriting the slider.”', 'Minh, developer'],
        ['“Keyboard support came with the component.”', 'Anh, editor'],
      ].map(([quote, author]) => `<ui-carousel-slide><blockquote>${quote}<cite>${author}</cite></blockquote></ui-carousel-slide>`).join(''))}<div class="carousel-lab__controls">${counter()}${arrows()}</div><ui-carousel-thumbnail ui-per-view="3" ui-gap="8" aria-label="Select a quote">${track(['Lan', 'Minh', 'Anh'].map((person) => `<ui-carousel-slide><span class="carousel-lab__person">${person}</span></ui-carousel-slide>`).join(''))}</ui-carousel-thumbnail></ui-carousel>`,
    };
    case 'Logo strip': return {
      intro: 'A compact, looping brand rail. Autoplay stops when someone hovers or focuses it.',
      markup: carousel('ui-loop ui-autoplay="2000" ui-per-view="4" ui-gap="12" ui-breakpoints="{ 640: { perView: 2 } }" aria-label="Partner names"', ['Norde', 'Atelier', 'Lumen', 'Sora', 'Kōen', 'Volt'].map((word) => `<ui-carousel-slide><div class="carousel-lab__logo">${word}</div></ui-carousel-slide>`).join(''), arrows(), 'carousel-lab__carousel--logos'),
    };
    case 'RTL': return {
      intro: 'Direction and arrow keys follow right-to-left navigation. This demo uses Arabic slide labels.',
      markup: carousel('ui-rtl ui-per-view="3" ui-gap="12" ui-breakpoints="{ 640: { perView: 1 } }" dir="rtl" aria-label="Right to left gallery"', ['الربيع', 'الصيف', 'الخريف', 'الشتاء', 'الليل'].map((word, index) => `<ui-carousel-slide><div class="carousel-lab__rtl">${index + 1}<span>${word}</span></div></ui-carousel-slide>`).join(''), `${pagination()}${arrows()}`, 'carousel-lab__carousel--rtl'),
    };
    case 'External controls': return {
      intro: 'Hover a chapter to switch slides. Click on touch screens, or focus a button and press Enter. The buttons below use the JavaScript API.',
      markup: `<div class="carousel-lab__external"><div class="carousel-lab__chapters">${images.slice(0, 4).map((image, index) => `<ui-carousel-trigger carousel-selector="[ui-name='gallery-seasons']" index="${index}" trigger="hover"><button type="button">${image.title}</button></ui-carousel-trigger>`).join('')}</div>${carousel('ui-name="gallery-seasons" ui-type="fade" ui-gap="0" aria-label="Externally controlled gallery"', slides(4), `${counter()}${arrows()}`)}</div><div class="carousel-lab__api"><button type="button" data-carousel-api="prev">prev()</button><button type="button" data-carousel-api="next">next()</button><button type="button" data-carousel-api="goTo">goTo(0)</button><button type="button" data-carousel-api="pause">pause()</button><button type="button" data-carousel-api="play">play()</button><output data-carousel-status aria-live="polite">Active slide: 1</output></div>`,
    };
    case 'Playground': return {
      intro: 'Adjust the public attributes and inspect the exact markup below. The carousel updates in place.',
      markup: `<div class="carousel-lab__playground"><div class="carousel-lab__settings"><label>Transition<select data-carousel-setting="type"><option>slide</option><option>fade</option><option>wind</option><option>nature</option><option>water</option><option>urban</option></select></label><label>Slides in view<input data-carousel-setting="per-view" type="range" min="1" max="3" step="1" value="1"><output data-carousel-value="per-view">1</output></label><label>Speed<input data-carousel-setting="speed" type="range" min="100" max="1200" step="100" value="400"><output data-carousel-value="speed">400</output></label><label><input data-carousel-setting="loop" type="checkbox"> Loop</label><label><input data-carousel-setting="autoplay" type="checkbox"> Autoplay</label></div>${carousel('ui-type="slide" ui-per-view="1" ui-speed="400" ui-gap="12" aria-label="Carousel playground"', slides(6, 'card'), `${pagination()}${arrows()}`, 'carousel-lab__carousel--playground')}</div>`,
    };
    default: return { intro: '', markup: '' };
  }
}

export function renderCarouselExample(name: string): string {
  const { intro, markup } = example(name);
  return `<div class="carousel-lab"><p class="carousel-lab__intro">${intro}</p><div class="carousel-lab__stage">${markup}</div><details class="carousel-lab__code"><summary>Xem code</summary><pre><code>${escapeCode(formatMarkup(markup))}</code></pre></details></div>`;
}

export function wireCarouselExamples(root: HTMLElement): void {
  root.querySelectorAll<HTMLDetailsElement>('.carousel-lab__code').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (details.open) {
        const code = details.querySelector<HTMLElement>('code');
        if (code) void highlightCarouselCode(code);
      }
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-carousel-jump]').forEach((button) => button.addEventListener('click', () => {
    const target = button.dataset['carouselJump'];
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }));
  root.querySelector<HTMLSelectElement>('[data-carousel-type]')?.addEventListener('change', (event) => {
    const select = event.currentTarget as HTMLSelectElement;
    select.closest('.carousel-lab')?.querySelector<UiCarousel>('ui-carousel')?.setAttribute('ui-type', select.value);
  });
  const playground = root.querySelector<HTMLElement>('.carousel-lab__playground');
  const playgroundCarousel = playground?.querySelector<UiCarousel>('ui-carousel');
  playground?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-carousel-setting]').forEach((control) => {
    control.addEventListener('input', () => {
      if (!playgroundCarousel) return;
      const setting = control.dataset['carouselSetting'];
      if (!setting) return;
      if (control instanceof HTMLInputElement && control.type === 'checkbox') {
        if (setting === 'autoplay') playgroundCarousel.setAttribute('ui-autoplay', control.checked ? '2600' : '0');
        else playgroundCarousel.toggleAttribute(`ui-${setting}`, control.checked);
      } else {
        playgroundCarousel.setAttribute(`ui-${setting}`, control.value);
        playground?.querySelector<HTMLOutputElement>(`[data-carousel-value="${setting}"]`)?.replaceChildren(control.value);
      }
      playgroundCarousel.refresh();
      const code = playground?.closest('.carousel-lab')?.querySelector<HTMLElement>('pre code');
      if (code) {
        const template = document.createElement('template');
        template.innerHTML = example('Playground').markup;
        const authored = template.content.querySelector('ui-carousel');
        playground?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-carousel-setting]').forEach((input) => {
          const key = input.dataset['carouselSetting'];
          if (!key) return;
          if (input instanceof HTMLInputElement && input.type === 'checkbox') {
            if (key === 'autoplay') authored?.toggleAttribute('ui-autoplay', input.checked);
            else authored?.toggleAttribute(`ui-${key}`, input.checked);
            if (key === 'autoplay' && input.checked) authored?.setAttribute('ui-autoplay', '2600');
          } else authored?.setAttribute(`ui-${key}`, input.value);
        });
        const source = formatMarkup(template.innerHTML);
        codeSources.set(code, source);
        code.textContent = source;
        if (code.closest('details')?.open) void highlightCarouselCode(code);
      }
    });
  });
  const external = root.querySelector<HTMLElement>('.carousel-lab__external')?.closest('.carousel-lab');
  const named = external?.querySelector<UiCarousel>('[ui-name="gallery-seasons"]');
  external?.querySelectorAll<HTMLButtonElement>('[data-carousel-api]').forEach((button) => button.addEventListener('click', () => {
    if (!named) return;
    const action = button.dataset['carouselApi'];
    if (action === 'prev') named.prev();
    if (action === 'next') named.next();
    if (action === 'goTo') named.goTo(0);
    if (action === 'pause') named.pause();
    if (action === 'play') named.play();
  }));
  named?.addEventListener('ui-carousel:change', () => {
    const status = external?.querySelector<HTMLOutputElement>('[data-carousel-status]');
    if (status) status.textContent = `Active slide: ${named.activeIndex + 1}`;
  });
}

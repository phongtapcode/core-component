/**
 * Gallery SPA entry. Hash-based routing.
 */

import { uiToast, type ToastPlacement, type UiModal, type UiDrawer } from '@ui/components';
import { EFFECTS } from '@ui/motion';
import './styles.css';
import { COMPONENTS, type ComponentEntry } from './components.js';
import { getDocForSlug } from './docs-data.js';

const appRoot = document.getElementById('app')!;
const storedTheme = localStorage.getItem('ui-theme');
document.documentElement.dataset['theme'] = storedTheme === 'dark' ||
  (storedTheme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';

/* ============================================================
   Home page
   ============================================================ */

function renderHome(): void {
  const search = queryParam('q');

  const grouped: Record<string, ComponentEntry[]> = {};
  for (const c of COMPONENTS) (grouped[c.category] ??= []).push(c);

  const cats = ['Motion', 'Basic UI', 'Media', 'Utility', 'Advanced'];

  appRoot.innerHTML = `
    ${renderHero()}

    <main class="container gallery-main" id="components">
      <section class="section">
        <div class="section-header">
          <div>
            <span class="eyebrow">Explore the library</span>
            <h2>Components <span class="section-count">${COMPONENTS.length}</span></h2>
            <p>Real browser components you can open, test, and inspect.</p>
          </div>
          <label class="search-field" for="search">
            <span aria-hidden="true">⌕</span>
            <input id="search" type="search" placeholder="Search components…" autocomplete="off" />
          </label>
        </div>

        ${cats
          .map((cat) => {
            const items = grouped[cat] ?? [];
            if (items.length === 0) return '';
            return `
              <div class="category" data-category="${cat}">
                <h3 class="category-title">${cat} <span class="category-count">${items.length}</span></h3>
                <div class="cards-grid">
                  ${items.map(renderCard).join('')}
                </div>
              </div>`;
          })
          .join('')}
        <p class="search-empty" id="search-empty" hidden>No components match your search.</p>
      </section>

      ${renderScrollDemo()}
      ${renderPhotoFeature()}
    </main>

    ${renderFooter()}
  `;

  const input = document.getElementById('search') as HTMLInputElement;
  input.value = search;
  const updateResults = (): void => {
    const term = input.value.trim().toLowerCase();
    let visibleTotal = 0;
    appRoot.querySelectorAll<HTMLElement>('.category').forEach((category) => {
      let visibleCategory = 0;
      category.querySelectorAll<HTMLElement>('.card').forEach((card) => {
        const matches = (card.dataset['search'] ?? '').includes(term);
        card.hidden = !matches;
        if (matches) visibleCategory++;
      });
      category.hidden = visibleCategory === 0;
      category.querySelector('.category-count')!.textContent = String(visibleCategory);
      visibleTotal += visibleCategory;
    });
    appRoot.querySelector('.section-count')!.textContent = String(visibleTotal);
    (document.getElementById('search-empty') as HTMLElement).hidden = visibleTotal !== 0;
  };
  input.addEventListener('input', () => {
    const path = location.hash.split('?')[0] || '#/';
    history.replaceState(null, '', `${location.pathname}${location.search}${path}${input.value ? '?q=' + encodeURIComponent(input.value) : ''}`);
    updateResults();
  });
  updateResults();
  appRoot.querySelectorAll<HTMLAnchorElement>('[data-scroll-target="components"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById('components')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
  document.getElementById('gallery-theme')?.addEventListener('click', () => {
    const next = document.documentElement.dataset['theme'] === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset['theme'] = next;
    localStorage.setItem('ui-theme', next);
    updateThemeButton();
  });
  updateThemeButton();

}

function updateThemeButton(): void {
  const button = document.getElementById('gallery-theme');
  if (!button) return;
  const dark = document.documentElement.dataset['theme'] === 'dark';
  button.textContent = dark ? '☀' : '☾';
  button.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
}

/* ============================================================
   Hero
   ============================================================ */

function renderHero(): string {
  return `
    <header class="hero">
      <nav class="site-nav" aria-label="Main navigation">
        <a class="brand" href="#/" aria-label="UI Components home"><span class="brand-mark">◈</span> UI Components</a>
        <div class="site-nav-links"><a href="#/" data-scroll-target="components">Components</a><a href="#/docs/animate">Documentation</a><button type="button" id="gallery-theme" class="theme-button" aria-label="Switch color theme"></button></div>
      </nav>
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="hero-kicker">WEB COMPONENTS · TYPESCRIPT · NATIVE CSS</span>
          <h1>
            <span>Build better UI.</span><br/>
            <span class="hero-accent">Bring your own stack.</span>
          </h1>
          <p class="hero-tagline">
            ${COMPONENTS.length} reusable components and effects, built with browser APIs.
            Explore live examples, then drop them into any frontend.
          </p>
          <div class="hero-actions">
            <a class="btn primary" href="#/" data-scroll-target="components">Explore components <span aria-hidden="true">↗</span></a>
            <a class="btn ghost" href="#/docs/animate">Read the docs</a>
          </div>
        </div>
        <div class="hero-visual" aria-label="Preview of UI components">
          <div class="preview-window">
            <div class="preview-bar"><span class="preview-dots"><i></i><i></i><i></i></span><span>component-preview.html</span><span>↗</span></div>
            <div class="preview-content">
              <div class="preview-label">LIVE PREVIEW <span>● Interactive</span></div>
              <div class="preview-panel"><span class="preview-icon">✦</span><div><strong>Made for the modern web</strong><small>Native elements, thoughtful details.</small></div></div>
              <div class="preview-tabs"><span class="selected">Overview</span><span>Examples</span><span>API</span></div>
              <div class="preview-line wide"></div><div class="preview-line"></div>
              <div class="preview-controls"><span class="preview-button">Explore demo →</span><span class="preview-switch" aria-hidden="true"></span></div>
            </div>
          </div>
          <span class="preview-float preview-float-top">✳ Framework agnostic</span>
          <span class="preview-float preview-float-bottom">${COMPONENTS.length} components</span>
        </div>
      </div>
    </header>
  `;
}

function renderFooter(): string {
  return `
    <footer class="footer">
      <div>
        <strong>UI Components</strong> — framework-agnostic, web-component native.
      </div>
      <div class="footer-links">
        <a href="#/">Gallery</a>
        <a href="#/docs/animate">Documentation</a>
      </div>
    </footer>
  `;
}

/* ============================================================
   Card
   ============================================================ */

function renderCard(c: ComponentEntry): string {
  const thumb = thumbFor(c.tagName);
  const slug = c.tagName.replace(/^ui-/, '');
  return `
    <article class="card" data-search="${escapeHtml((c.name + ' ' + c.description + ' ' + c.tagName + ' ' + c.category).toLowerCase())}">
      <a class="card-thumb" href="#/${c.tagName}" title="View live ${c.name} demo">
        ${thumb}
      </a>
      <div class="card-body">
        <div class="card-title-row">
          <h3>${c.name}</h3>
        </div>
        <p>${c.description}</p>
        <code class="card-tag">&lt;${c.tagName}&gt;</code>
        <div class="card-actions">
          <a class="card-btn card-btn-doc" href="#/docs/${slug}" title="Read documentation for ${c.name}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Docs
          </a>
          <a class="card-btn card-btn-demo" href="#/${c.tagName}" title="View interactive demo of ${c.name}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Demo
          </a>
        </div>
      </div>
    </article>`;
}

/**
 * Generate a long strip of demo cards that fade in as the user scrolls.
 * Each card is wrapped in a <ui-animate> so the IntersectionObserver fires
 * when the card scrolls into view.
 */
function renderScrollDemo(): string {
  const effects = ['fade-up', 'zoom-in', 'blur', 'rotate', 'slide-up', 'scale-up'];
  return `
    <section class="section scroll-demo">
      <div class="scroll-demo-heading">
        <div><span class="eyebrow">Motion in action</span><h2>Watch the details come alive.</h2></div>
        <p>Scroll through these effects, then open Animate to try the complete set.</p>
      </div>
        <div class="scroll-grid">
          ${effects.map((effect, i) => `
            <ui-animate effect="${effect}" threshold="0.1">
              <a class="scroll-card" href="#/ui-animate">
                <span class="effect-graphic effect-graphic-${i + 1}" aria-hidden="true"><i></i><i></i><i></i></span>
                <span class="scroll-card-overlay"><strong>${effect}</strong><small>View effect ↗</small></span>
              </a>
            </ui-animate>
          `).join('')}
        </div>
    </section>
  `;
}

function renderPhotoFeature(): string {
  return `
    <section class="section home-photo-feature" aria-label="Photo parallax preview">
      <div class="scroll-demo-heading">
        <div><span class="eyebrow">Scroll stories</span><h2>Images with a sense of depth.</h2></div>
        <p>Follow a photograph through the viewport, then explore the full Parallax demo.</p>
      </div>
      <ui-parallax class="home-photo-parallax">
        <div class="home-photo-stage">
          <ui-parallax-scroll class="home-photo-image" ui-fit-content="false" ui-keyframes="{'0%': {y: -60, scale: 1.14}, '100%': {y: 65, scale: 1.02}}">
            <img src="/images/coast.jpg" alt="Sunlit limestone coast and turquoise sea" loading="lazy" />
          </ui-parallax-scroll>
          <div class="home-photo-shade"></div>
          <ui-parallax-scroll class="home-photo-copy" ui-keyframes="{'0%': {y: 65, opacity: 0}, '40%': {y: 0, opacity: 1}, '85%': {y: -20, opacity: 1}, '100%': {y: -45, opacity: 0}}">
            <span class="photo-story-index">THE SCROLL COLLECTION</span>
            <h3>Movement made<br />for the moment.</h3>
            <a href="#/ui-parallax">Explore Parallax →</a>
          </ui-parallax-scroll>
        </div>
      </ui-parallax>
    </section>`;
}

function thumbFor(tag: string): string {
  const symbols: Record<string, string> = {
    'ui-animate': '✦', 'ui-parallax': '▧', 'ui-toggle': '◉',
    'ui-collapse': '⌄', 'ui-accordion': '☷', 'ui-tabs': '▤', 'ui-modal': '▣', 'ui-cursor': '◎',
    'ui-drawer': '◧', 'ui-popover': '▢', 'ui-tooltip': '?', 'ui-lazyload': '◐',
    'ui-image-comparison': '◒', 'ui-counter': '99', 'ui-dark-mode': '☼',
    'ui-marquee': '→', 'ui-carousel': '◫', 'ui-expandable-grid': '▦', 'ui-grid-hover-expand': '▥', 'ui-swipeable-card-stack': '▤', 'ui-orbit-gallery': '◌', 'ui-dot-morph': '✳',
  };
  return `<span class="thumb-art thumb-${tag}" aria-hidden="true"><span class="thumb-orbit"></span><span class="thumb-symbol">${symbols[tag] ?? '✦'}</span><span class="thumb-caption">${tag.replace(/^ui-/, '')}</span></span>`;
}

/* ============================================================
   Documentation page
   ============================================================ */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderDocPage(rawSlug: string): void {
  const doc = getDocForSlug(rawSlug);
  if (!doc) {
    renderHome();
    return;
  }
  const tagName = doc.tagName;
  const demoTagName = tagName;

  appRoot.innerHTML = `
    <main class="container doc-page">
      <div class="page-nav-bar">
        <a class="back" href="#/">← All components</a>
        <div class="page-switcher-tabs">
          <a class="tab-btn" href="#/${demoTagName}">▶ Live Demo</a>
          <a class="tab-btn active" href="#/docs/${doc.slug}">📄 Documentation</a>
        </div>
      </div>

      <header class="doc-header">
        <div class="doc-badge-row">
          <span class="badge">${doc.category}</span>
          <code class="card-tag">&lt;${doc.tagName}&gt;</code>
        </div>
        <h1>${doc.name}</h1>
        <p class="doc-summary">${doc.summary}</p>
      </header>

      <section class="doc-section">
        <h2>Basic Usage</h2>
        <div class="code-box">
          <pre><code>${escapeHtml(doc.usage)}</code></pre>
        </div>
      </section>

      ${doc.attributes && doc.attributes.length > 0 ? `
        <section class="doc-section">
          <h2>Attributes & Properties</h2>
          <div class="table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Attribute</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${doc.attributes.map((a) => `
                  <tr>
                    <td><code>${a.name}</code></td>
                    <td><span class="type-badge">${escapeHtml(a.type)}</span></td>
                    <td><code>${escapeHtml(a.default ?? '-')}</code></td>
                    <td>${a.description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      ` : ''}

      ${doc.methods && doc.methods.length > 0 ? `
        <section class="doc-section">
          <h2>Methods</h2>
          <div class="table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${doc.methods.map((m) => `
                  <tr>
                    <td><code>${escapeHtml(m.name)}</code></td>
                    <td>${m.description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      ` : ''}

      ${doc.events && doc.events.length > 0 ? `
        <section class="doc-section">
          <h2>Custom Events</h2>
          <div class="table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Detail</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${doc.events.map((e) => `
                  <tr>
                    <td><code>${e.name}</code></td>
                    <td><code>${escapeHtml(e.detail ?? 'void')}</code></td>
                    <td>${e.description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      ` : ''}

      ${doc.cssVars && doc.cssVars.length > 0 ? `
        <section class="doc-section">
          <h2>CSS Custom Properties</h2>
          <div class="table-wrap">
            <table class="doc-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${doc.cssVars.map((v) => `
                  <tr>
                    <td><code>${v.name}</code></td>
                    <td><code>${escapeHtml(v.default)}</code></td>
                    <td>${v.description}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>
      ` : ''}

      ${doc.a11y ? `
        <section class="doc-section">
          <h2>Accessibility & Keyboard</h2>
          <div class="callout">
            <p>${doc.a11y}</p>
          </div>
        </section>
      ` : ''}

      <section class="doc-section preview-section">
        <h2>Interactive Playground</h2>
        <div class="demo-block">
          ${renderDemoBody(demoTagName, 'Quick Demo')}
        </div>
        <div style="margin-top: 1rem">
          <a class="btn primary" href="#/${demoTagName}">Open Full Demo Page →</a>
        </div>
      </section>

      ${renderFooter()}
    </main>
  `;

  wireButtons();
  wireAnimateReplay(appRoot);
  wireParallaxDemo(appRoot);
  wireSwipeableStackDemo(appRoot);
  wireToastDemo(appRoot);
  wireDotMorphDemo(appRoot);
}

/* ============================================================
   Demo page
   ============================================================ */

function renderDemo(tagName: string): void {
  const entry = COMPONENTS.find((c) => c.tagName === tagName || c.tagName === `ui-${tagName}`);
  if (!entry) {
    renderHome();
    return;
  }
  const slug = entry.tagName.replace(/^ui-/, '');
  appRoot.innerHTML = `
    <main class="container demo-page">
      <div class="page-nav-bar">
        <a class="back" href="#/">← All components</a>
        <div class="page-switcher-tabs">
          <a class="tab-btn active" href="#/${entry.tagName}">▶ Live Demo</a>
          <a class="tab-btn" href="#/docs/${slug}">📄 Documentation</a>
        </div>
      </div>
      <header class="demo-header">
        <code class="tag">&lt;${entry.tagName}&gt;</code>
        <h1>${entry.name}</h1>
        <p>${entry.description}</p>
      </header>
      ${entry.demos.map((d) => `
        <section class="demo-block">
          <header><h3>${d}</h3></header>
          ${renderDemoBody(entry.tagName, d)}
        </section>
      `).join('')}
      ${renderFooter()}
    </main>
  `;
  wireButtons();
  wireAnimateReplay(appRoot);
  wireParallaxDemo(appRoot);
  wireSwipeableStackDemo(appRoot);
  wireToastDemo(appRoot);
  wireDotMorphDemo(appRoot);
}

function renderFlyingWord(word: string, firstIndex: number): string {
  return `<span class="text-fly-word" aria-hidden="true">${Array.from(word).map((letter, position) => {
    const index = firstIndex + position;
    const from = index * 3.76;
    const to = Math.min(100, from + 6);
    const y = (index * 23) % 41 - 20;
    const rotate = (index * 37) % 81 - 40;
    const frames = { [`${from}%`]: { y: `${y}vh`, rotate }, [`${to}%`]: { y: '0vh', rotate: 0 } };
    return `<ui-parallax-scroll class="text-fly-letter" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes='${JSON.stringify(frames)}'>${letter}</ui-parallax-scroll>`;
  }).join('')}</span>`;
}

function renderDemoBody(tag: string, variant: string): string {
  // Every demo returns a card with the running component + sample content.
  switch (tag) {
    case 'ui-toast': {
      if (variant === 'Placements') return `
        <p class="demo-text">Choose where the notification should appear. Toasts at one position stack without blocking the page.</p>
        <div class="toast-demo-grid">${(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map((position) => `
          <button type="button" class="toast-demo-option" data-toast-placement="${position}">
            <span class="toast-demo-dot" aria-hidden="true"></span><strong>${position}</strong><span>Show toast ↗</span>
          </button>`).join('')}</div>`;
      if (variant === 'Timing and motion') return `
        <p class="demo-text">Compare a spring entrance, a quick notification, and a toast that stays until it is closed.</p>
        <div class="toast-demo-grid">
          <button type="button" class="toast-demo-option" data-toast-motion="spring"><strong>Spring</strong><span>600 ms entrance</span></button>
          <button type="button" class="toast-demo-option" data-toast-motion="quick"><strong>Quick</strong><span>2 second delay</span></button>
          <button type="button" class="toast-demo-option" data-toast-motion="persistent"><strong>Persistent</strong><span>Close manually</span></button>
          <button type="button" class="toast-demo-option" data-toast-motion="stack"><strong>Stack three</strong><span>Multiple notifications</span></button>
        </div>`;
      if (variant === 'HTML template') return `
        <p class="demo-text">The named element stays in the page as a template. Each click creates a live copy with its HTML content.</p>
        <div class="toast-demo-grid">
          <button type="button" class="toast-demo-option" data-toast-template="gallery-message"><strong>Message template</strong><span>Open rich notification ↗</span></button>
          <button type="button" class="toast-demo-option" data-toast-template="gallery-progress"><strong>Progress notification</strong><span>See the remaining time ↗</span></button>
        </div>
        <ui-toast ui-name="gallery-message" ui-placement="top-right" ui-delay="5000" ui-class-name="gallery-toast gallery-toast--info" ui-close-button-placement="center-right">
          <div class="gallery-toast-content"><span class="gallery-toast-icon" aria-hidden="true">✉</span><div><strong>New message received</strong><span>Your inbox has one new update.</span></div></div>
        </ui-toast>
        <ui-toast ui-name="gallery-progress" ui-placement="top-right" ui-delay="5000" ui-class-name="gallery-toast gallery-toast--custom" ui-close-button-placement="center-right">
          <div class="gallery-toast-content"><span class="gallery-toast-icon" aria-hidden="true">◷</span><div><strong>Saving your work</strong><span>This notice closes after five seconds.</span></div></div>
          <span class="gallery-toast-progress" aria-hidden="true"></span>
        </ui-toast>`;
      return `
        <p class="demo-text">Choose a notification style. Each toast can be dismissed with its close button.</p>
        <div class="toast-demo-grid">${([
          ['success', '✓', 'Success', 'Order confirmed'],
          ['error', '!', 'Error', 'Action could not be completed'],
          ['warning', '⚠', 'Warning', 'Please review your input'],
          ['info', 'i', 'Info', 'A new update is available'],
          ['default', '✦', 'Default', 'Simple notification'],
          ['custom', '✉', 'Rich content', 'Custom HTML layout'],
        ] as const).map(([kind, icon, title, detail]) => `
          <button type="button" class="toast-demo-option" data-toast-kind="${kind}"><span class="toast-demo-icon toast-demo-icon--${kind}" aria-hidden="true">${icon}</span><strong>${title}</strong><span>${detail}</span></button>`).join('')}</div>`;
    }
    case 'ui-animate': {
      const effects = variant === 'Effect variants'
        ? EFFECTS
        : variant === 'Once vs repeat'
          ? ['fade-up', 'zoom-in']
          : ['fade-up'];
      return `
        <p class="demo-text">${variant === 'Once vs repeat'
          ? 'The first card animates once. The second resets when it leaves the viewport and animates again when it returns.'
          : 'Scroll these cards into view or replay them to compare the effects.'}</p>
        <div class="demo-actions"><button type="button" class="btn ghost" data-replay-animate>Replay effects</button></div>
        <div class="grid-3">
          ${effects.map((e, index) => `
            <div class="demo-tile">
              <ui-animate effect="${e}" threshold="0.2"${variant === 'Once vs repeat' && index === 1 ? ' once="false"' : ''}>
                <div class="demo-card">${variant === 'Once vs repeat' ? (index === 0 ? 'once' : 'repeat') : e}</div>
              </ui-animate>
            </div>`).join('')}
        </div>
      `;
    }
    case 'ui-parallax': {
      if (variant === 'Text fly') return `
        <div class="text-fly-intro"><span>SCROLL STUDY / TYPE & IMAGE</span><h2>Chữ cũng có thể<br /><em>kể chuyện.</em></h2><p>Kéo xuống: câu chữ dài đi từ phải sang trái, từng ký tự ghép vào nhau; ảnh bay quanh dòng chữ để trang trí.</p><span aria-hidden="true">↓</span></div>
        <ui-parallax class="text-fly-section">
          <div class="text-fly-stage">
            <div class="text-fly-topline"><span>01 / THE WORDS</span><span>KEEP SCROLLING ↓</span></div>
            <ui-parallax-scroll class="text-fly-track" ui-fit-content="false" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'0%': {travel: 0}, '100%': {travel: 1}}">
              <h2 class="text-fly-headline" aria-label="we wannabe where the people are">
                ${renderFlyingWord('we', 0)}
                ${renderFlyingWord('wannabe', 2)}
                ${renderFlyingWord('where', 9)}
                ${renderFlyingWord('the', 14)}
                ${renderFlyingWord('people', 17)}
                ${renderFlyingWord('are', 23)}
                <ui-parallax-scroll class="text-fly-decor text-fly-decor--one" ui-fit-content="false" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'22%': {y: '-40vh', rotate: -35, scale: 0, opacity: 0}, '38%': {y: '0vh', rotate: -9, scale: 1, opacity: 1}, '46%': {y: '2vh', rotate: -5, scale: .94, opacity: 1}, '54%': {y: '0vh', rotate: -9, scale: 1, opacity: 1}}"><img src="/images/coast.jpg" alt="" loading="lazy" /></ui-parallax-scroll>
                <ui-parallax-scroll class="text-fly-decor text-fly-decor--two" ui-fit-content="false" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'43%': {y: '28vh', rotate: 25, scale: 0, opacity: 0}, '60%': {y: '0vh', rotate: 8, scale: 1, opacity: 1}, '68%': {y: '3vh', rotate: 4, scale: .94, opacity: 1}, '76%': {y: '0vh', rotate: 8, scale: 1, opacity: 1}}"><img src="/images/botanical.jpg" alt="" loading="lazy" /></ui-parallax-scroll>
              </h2>
            </ui-parallax-scroll>
            <ui-parallax-scroll class="text-fly-caption" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'0%': {y: 35, opacity: 0}, '32%': {y: 0, opacity: 1}, '100%': {y: 0, opacity: 1}}">The best stories stay with us because they move us.</ui-parallax-scroll>
            <ui-parallax-scroll class="text-fly-arrow" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'0%': {x: -40, opacity: 0}, '46%': {x: 0, opacity: 1}, '100%': {x: 70, opacity: 1}}" aria-hidden="true">↗</ui-parallax-scroll>
          </div>
        </ui-parallax>
        <ui-parallax class="text-fly-photo-section">
          <div class="text-fly-photo-stage">
            <ui-parallax-scroll class="text-fly-photo" ui-fit-content="false" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'0%': {scale: 1.32}, '100%': {scale: 1}}"><img src="/images/architecture.jpg" alt="Warm light falling across a sculptural staircase" loading="lazy" /></ui-parallax-scroll>
            <div class="text-fly-photo-shade"></div>
            <div class="text-fly-photo-copy"><span>02 / THE MOMENT</span><h2 aria-label="We are UI">${['WE', 'ARE', 'UI'].map((word, index) => `<ui-parallax-scroll ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'${index * 12}%': {x: ${index % 2 ? -160 : 160}, y: 110, rotate: ${index % 2 ? -16 : 16}, opacity: 0, blur: 10}, '${48 + index * 11}%': {x: 0, y: 0, rotate: 0, opacity: 1, blur: 0}}" aria-hidden="true">${word}</ui-parallax-scroll>`).join(' ')}</h2><p>Ảnh và chữ cùng chuyển động theo một vùng cuộn.</p></div>
            <span class="text-fly-photo-bottom">FORM FOLLOWS FEELING — UI COMPONENTS</span>
          </div>
        </ui-parallax>`;
      if (variant === 'Circular scroll') {
        const circularImages = ['/images/coast.jpg', '/images/architecture.jpg', '/images/botanical.jpg'];
        const circularTitles = ['Open horizons', 'A new angle', 'Quiet details', 'Into the light', 'Natural forms', 'Room to breathe', 'Look closer', 'Keep exploring'];
        return `
          <div class="parallax-circular-intro"><span>SCROLL EXPERIMENT / 08 FRAMES</span><h2>Kéo xuống để xoay vòng ảnh</h2><p>Tám thẻ đi theo một cung tròn lớn khi bạn cuộn trang.</p><span aria-hidden="true">↓</span></div>
          <ui-parallax class="parallax-circular-demo">
            <div class="parallax-circular-stage">
              <div class="parallax-circular-guide" aria-hidden="true"></div>
              <div class="parallax-circular-heading"><span>CURVED JOURNEY</span><p>Scroll to explore</p></div>
              ${circularTitles.map((title, index) => `
                <ui-parallax-scroll class="parallax-circular-item" ui-fit-content="false" style="--orbit-start:${index * 360}px" ui-keyframes="{'20%': {orbitShift: 0}, '70%': {orbitShift: -2520}}">
                  <article class="parallax-circular-card">
                    <img src="${circularImages[index % circularImages.length]}" alt="" />
                    <div><span>${String(index + 1).padStart(2, '0')} / 08</span><h3>${title}</h3></div>
                  </article>
                </ui-parallax-scroll>`).join('')}
            </div>
          </ui-parallax>
          <div class="parallax-circular-outro">Hết vòng ảnh · Cuộn lên để xem lại</div>`;
      }
      if (variant === 'Coastal story') return `
        <p class="demo-text">A full-image scene moves at a different speed from its caption as you scroll.</p>
        <ui-parallax class="photo-story coast-story">
          <div class="photo-story-stage">
            <ui-parallax-scroll class="photo-story-image" ui-fit-content="false" ui-keyframes="{'0%': {y: -90, scale: 1.2}, '35%': {y: -30, scale: 1.1}, '100%': {y: 90, scale: 1.02}}">
              <img src="/images/coast.jpg" alt="Golden cliffs descending into a turquoise Mediterranean bay" loading="lazy" />
            </ui-parallax-scroll>
            <div class="photo-story-shade"></div>
            <ui-parallax-scroll class="photo-story-copy" ui-keyframes="{'0%': {y: 65, opacity: 0}, '32%': {y: 0, opacity: 1}, '68%': {y: -20, opacity: 1}, '100%': {y: -65, opacity: 0}}">
              <span class="photo-story-index">01 / THE COAST</span>
              <h2>Where the land<br />meets the light.</h2>
              <p>Two layers, one continuous scroll.</p>
            </ui-parallax-scroll>
            <span class="photo-story-cue">SCROLL TO EXPLORE ↓</span>
          </div>
        </ui-parallax>`;
      if (variant === 'Photo aperture') return `
        <p class="demo-text">The photograph opens like a window: width, height and corner radius all follow scroll keyframes.</p>
        <ui-parallax class="photo-aperture">
          <div class="photo-aperture-stage">
            <span class="photo-aperture-kicker">02 / SPACE & LIGHT</span>
            <ui-parallax-scroll class="photo-aperture-frame" ui-fit-content="false" ui-keyframes="{'0%': {width: '28%', height: '28vh', borderRadius: '30px'}, '32%': {width: '28%', height: '28vh', borderRadius: '30px'}, '72%': {width: '92%', height: '72vh', borderRadius: '8px'}, '100%': {width: '92%', height: '72vh', borderRadius: '8px'}}">
              <img src="/images/architecture.jpg" alt="Sculptural limestone staircase in warm sunlight" loading="lazy" />
            </ui-parallax-scroll>
            <ui-parallax-scroll class="photo-aperture-label" ui-keyframes="{'0%': {opacity: 0, y: 30}, '50%': {opacity: 0, y: 30}, '78%': {opacity: 1, y: 0}, '100%': {opacity: 1, y: 0}}">Architecture in motion</ui-parallax-scroll>
          </div>
        </ui-parallax>`;
      if (variant === 'Botanical layers') return `
        <p class="demo-text">A layered editorial scene pairs scroll movement with a subtle pointer tilt on the image.</p>
        <ui-parallax class="photo-botanical">
          <div class="photo-botanical-stage">
            <ui-parallax-scroll class="photo-botanical-image" ui-fit-content="false" ui-keyframes="{'0%': {x: 70, y: 70, scale: .86, opacity: .55}, '40%': {x: 0, y: 0, scale: 1, opacity: 1}, '100%': {x: -40, y: -60, scale: 1.06, opacity: 1}}">
              <ui-parallax-hover ui-strength="36" ui-3d ui-inner-width="100%">
                <img src="/images/botanical.jpg" alt="White calla lily framed by deep green leaves" loading="lazy" />
              </ui-parallax-hover>
            </ui-parallax-scroll>
            <ui-parallax-scroll class="photo-botanical-copy" ui-keyframes="{'0%': {y: 90, opacity: 0}, '38%': {y: 0, opacity: 1}, '80%': {y: -20, opacity: 1}, '100%': {y: -70, opacity: 0}}">
              <span class="photo-story-index">03 / BOTANICAL STUDY</span>
              <h2>Nature,<br />in layers.</h2>
              <p>Scroll for depth. Move the pointer for tilt.</p>
            </ui-parallax-scroll>
          </div>
        </ui-parallax>`;
      if (variant === 'Hover & 3D') return `
        <p class="demo-text">Move the pointer across the panel to compare translation and 3D tilt.</p>
        <ui-parallax class="parallax-hover-demo">
          <ui-parallax-hover ui-strength="90"><span class="parallax-hover-card">Move</span></ui-parallax-hover>
          <ui-parallax-hover ui-strength="120" ui-3d><span class="parallax-hover-card alt">3D tilt</span></ui-parallax-hover>
        </ui-parallax>`;
      if (variant === 'Custom effect') return `
        <p class="demo-text">A custom property is interpolated from the scroll keyframes and applied through customEffects().</p>
        <ui-parallax class="parallax-scroll-demo">
          <div class="parallax-sticky">
            <ui-parallax-scroll class="parallax-custom-demo" ui-keyframes="{'0%': {opacityCustom: 0}, '50%': {opacityCustom: 1}, '100%': {opacityCustom: 0}}">
              <span class="parallax-word">CUSTOM</span>
            </ui-parallax-scroll>
          </div>
        </ui-parallax>`;
      return `
        <div class="keyframe-story-intro"><span>AN EDITORIAL JOURNEY / 02 CHAPTERS</span><h2>Every place has<br /><em>a story.</em></h2><p>Cuộn xuống để xem ảnh và chữ thay đổi cùng nhịp.</p><span class="keyframe-story-down" aria-hidden="true">↓</span></div>
        <ui-parallax class="keyframe-story">
          <div class="keyframe-story-stage">
            <ui-parallax-scroll class="keyframe-story-bg keyframe-story-bg--coast" ui-fit-content="false" ui-keyframes="{'0%': {scale: 1.22, y: -65}, '25%': {scale: 1.15, y: -40}, '55%': {scale: 1.02, y: 15}, '100%': {scale: 1, y: 35}}"><img src="/images/coast.jpg" alt="" /></ui-parallax-scroll>
            <ui-parallax-scroll class="keyframe-story-bg keyframe-story-bg--botanical" ui-fit-content="false" ui-keyframes="{'0%': {scale: 1.16, opacity: 0}, '45%': {scale: 1.16, opacity: 0}, '61%': {scale: 1.06, opacity: 1}, '100%': {scale: 1, opacity: 1}}"><img src="/images/botanical.jpg" alt="" /></ui-parallax-scroll>
            <div class="keyframe-story-scrim"></div>
            <div class="keyframe-story-topline"><span>FIELD NOTES — VOLUME 01</span><span>SCROLL TO DISCOVER</span></div>
            <ui-parallax-scroll class="keyframe-story-outline" ui-keyframes="{'0%': {y: 80, opacity: 0}, '30%': {y: 0, opacity: .18}, '70%': {y: -65, opacity: .12}, '100%': {y: -120, opacity: 0}}">WONDER</ui-parallax-scroll>
            <ui-parallax-scroll class="keyframe-story-card keyframe-story-card--one" ui-fit-content="false" ui-keyframes="{'0%': {x: 170, y: 120, rotate: 10, scale: .8, opacity: 0}, '25%': {x: 170, y: 120, rotate: 10, scale: .8, opacity: 0}, '35%': {x: 0, y: 0, rotate: -5, scale: 1, opacity: 1}, '48%': {x: -25, y: -25, rotate: -8, scale: 1.04, opacity: 1}, '58%': {x: -160, y: -135, rotate: -15, scale: .86, opacity: 0}, '100%': {x: -160, y: -135, rotate: -15, scale: .86, opacity: 0}}"><figure><img src="/images/architecture.jpg" alt="Sunlit sculptural staircase opening onto the coast" /><figcaption>01 / SPACES THAT STAY WITH US</figcaption></figure></ui-parallax-scroll>
            <ui-parallax-scroll class="keyframe-story-copy keyframe-story-copy--one" ui-fit-content="false" ui-keyframes="{'0%': {y: 90, opacity: 0}, '25%': {y: 90, opacity: 0}, '34%': {y: 0, opacity: 1}, '48%': {y: -15, opacity: 1}, '58%': {y: -100, opacity: 0}, '100%': {y: -100, opacity: 0}}"><span class="keyframe-story-kicker">01 / THE HORIZON</span><h2>Follow the<br /><em>quiet light.</em></h2><p>Ở nơi nắng chạm mặt biển, mỗi khung hình là một lý do để chậm lại và nhìn lâu hơn.</p><span class="keyframe-story-small">A MOMENT WORTH KEEPING —</span></ui-parallax-scroll>
            <ui-parallax-scroll class="keyframe-story-card keyframe-story-card--two" ui-fit-content="false" ui-keyframes="{'0%': {x: -170, y: 160, rotate: -10, scale: .8, opacity: 0}, '47%': {x: -170, y: 160, rotate: -10, scale: .8, opacity: 0}, '60%': {x: 0, y: 0, rotate: 6, scale: 1, opacity: 1}, '75%': {x: 25, y: -25, rotate: 9, scale: 1.04, opacity: 1}, '100%': {x: 60, y: -75, rotate: 12, scale: 1.08, opacity: 1}}"><figure><img src="/images/coast.jpg" alt="Golden cliffs beside a blue sea" /><figcaption>02 / THE ART OF NOTICING</figcaption></figure></ui-parallax-scroll>
            <ui-parallax-scroll class="keyframe-story-copy keyframe-story-copy--two" ui-fit-content="false" ui-keyframes="{'0%': {y: 100, opacity: 0}, '50%': {y: 100, opacity: 0}, '61%': {y: 0, opacity: 1}, '78%': {y: -20, opacity: 1}, '100%': {y: -70, opacity: 1}}"><span class="keyframe-story-kicker">02 / THE DETAILS</span><h2>Beauty lives<br /><em>in detail.</em></h2><p>Một hình khối, một chiếc lá, một vệt sáng. Chúng tạo nên câu chuyện mà ta muốn nhớ.</p><span class="keyframe-story-small">LOOK A LITTLE CLOSER —</span></ui-parallax-scroll>
            <div class="keyframe-story-footer"><span>01 / 02</span><span>MADE TO BE FELT</span></div>
          </div>
        </ui-parallax>
        <div class="keyframe-story-outro"><span>THE JOURNEY CONTINUES</span><p>Điều đẹp nhất thường nằm trong những khoảnh khắc nhỏ.</p></div>`;
    }
    case 'ui-scroll-x': {
      if (variant === 'Editorial panels') return `
        <p class="demo-text">A second sequence uses the same scroll-driven width reveal with a quieter editorial layout.</p>
        <ui-scroll-x class="scroll-x-demo scroll-x-editorial">
          <ui-scroll-x-item><article class="scroll-x-panel scroll-x-panel--editorial"><img src="/images/botanical.jpg" alt="White flower against dark green leaves" loading="lazy" /><div class="scroll-x-panel-copy"><span>01 / BOTANICAL</span><h2>Quiet forms,<br />bold stories.</h2><p>A moment to look closer.</p></div></article></ui-scroll-x-item>
          <ui-scroll-xy-item><article class="scroll-x-panel scroll-x-panel--editorial"><img src="/images/coast.jpg" alt="Sunlit coast and turquoise sea" loading="lazy" /><div class="scroll-x-panel-copy"><span>02 / COASTAL</span><h2>Beyond<br />the horizon.</h2><p>Every scroll reveals another place.</p></div></article></ui-scroll-xy-item>
          <ui-scroll-x-item><article class="scroll-x-panel scroll-x-panel--editorial"><img src="/images/architecture.jpg" alt="Warm light on a sculptural staircase" loading="lazy" /><div class="scroll-x-panel-copy"><span>03 / ARCHITECTURE</span><h2>Space to<br />discover.</h2><p>Keep scrolling to continue the page.</p></div></article></ui-scroll-x-item>
        </ui-scroll-x>`;
      return `
        <p class="demo-text">Scroll until this section reaches the top. The next photographs then open from the left with gentle inertia.</p>
        <ui-scroll-x class="scroll-x-demo">
          <ui-scroll-x-item><article class="scroll-x-panel"><img src="/images/coast.jpg" alt="Cliffs beside a turquoise bay" loading="lazy" /><div class="scroll-x-panel-copy"><span>01 / THE COAST</span><h2>Follow<br />the light.</h2><p>Three places, one continuous journey.</p></div></article></ui-scroll-x-item>
          <ui-scroll-x-item><article class="scroll-x-panel"><img src="/images/architecture.jpg" alt="Sculptural limestone staircase" loading="lazy" /><div class="scroll-x-panel-copy"><span>02 / THE SPACE</span><h2>Find a new<br />perspective.</h2><p>Scroll to open the next scene.</p></div></article></ui-scroll-x-item>
          <ui-scroll-x-item><article class="scroll-x-panel"><img src="/images/botanical.jpg" alt="White flower framed by deep green leaves" loading="lazy" /><div class="scroll-x-panel-copy"><span>03 / THE DETAILS</span><h2>Notice<br />everything.</h2><p>The story continues below.</p></div></article></ui-scroll-x-item>
        </ui-scroll-x>`;
    }
    case 'ui-scroll-y': {
      if (variant === 'Parallax layers') return `
        <p class="demo-text">The panels rise with scroll while nested ui-parallax-scroll elements add depth to each photograph.</p>
        <ui-scroll-y class="scroll-y-demo scroll-y-parallax-demo" ui-parallax>
          <ui-scroll-y-item><article class="scroll-y-panel"><ui-parallax-scroll class="scroll-y-image-effect" ui-fit-content="false" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'0%': {scale: 1}, '50%': {scale: 1.18}, '100%': {scale: 1.18}}"><img src="/images/architecture.jpg" alt="Sunlit limestone stairs" loading="lazy" /></ui-parallax-scroll><div class="scroll-y-panel-copy"><span>01 / SPACE</span><h2>New angles.<br />New stories.</h2><p>The photograph moves beneath the rising panel.</p></div></article></ui-scroll-y-item>
          <ui-scroll-y-item><article class="scroll-y-panel"><ui-parallax-scroll class="scroll-y-image-effect" ui-fit-content="false" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'0%': {scale: 1}, '50%': {scale: 1}, '100%': {scale: 1.18}}"><img src="/images/botanical.jpg" alt="Calla lily among green leaves" loading="lazy" /></ui-parallax-scroll><div class="scroll-y-panel-copy"><span>02 / NATURE</span><h2>A closer<br />look.</h2><p>Scroll up to revisit the previous image.</p></div></article></ui-scroll-y-item>
          <ui-scroll-xy-item><article class="scroll-y-panel"><ui-parallax-scroll class="scroll-y-image-effect" ui-fit-content="false" ui-start="offset" ui-end="offset + container.offsetHeight - window.innerHeight" ui-keyframes="{'0%': {scale: 1.12}, '100%': {scale: 1}}"><img src="/images/coast.jpg" alt="Turquoise water beside the coast" loading="lazy" /></ui-parallax-scroll><div class="scroll-y-panel-copy"><span>03 / HORIZON</span><h2>Keep<br />exploring.</h2><p>The page continues after this scene.</p></div></article></ui-scroll-xy-item>
        </ui-scroll-y>`;
      return `
        <p class="demo-text">Scroll until this section reaches the viewport top. Each new panel then rises from below.</p>
        <ui-scroll-y class="scroll-y-demo">
          <ui-scroll-y-item><article class="scroll-y-panel"><img src="/images/coast.jpg" alt="Golden cliffs above a blue sea" loading="lazy" /><div class="scroll-y-panel-copy"><span>01 / THE COAST</span><h2>Where land<br />meets light.</h2><p>A full-screen vertical story.</p></div></article></ui-scroll-y-item>
          <ui-scroll-y-item><article class="scroll-y-panel"><img src="/images/architecture.jpg" alt="Modern staircase in warm light" loading="lazy" /><div class="scroll-y-panel-copy"><span>02 / THE SPACE</span><h2>Shape the<br />moment.</h2><p>One scene rises over another.</p></div></article></ui-scroll-y-item>
          <ui-scroll-y-item><article class="scroll-y-panel"><img src="/images/botanical.jpg" alt="White flower in lush foliage" loading="lazy" /><div class="scroll-y-panel-copy"><span>03 / THE DETAILS</span><h2>Look<br />closer.</h2><p>Scroll back to see the story reverse.</p></div></article></ui-scroll-y-item>
        </ui-scroll-y>`;
    }
    case 'ui-scroll-scene': {
      if (variant === 'Image with texts') return `
        <div class="scene-image-intro"><span>SCROLL STORY / 03 SCENES</span><h2>Kéo xuống để khám phá</h2><p>Mỗi cảnh kết hợp ảnh nền, nội dung và một ảnh chân dung.</p><span class="scene-image-intro-arrow" aria-hidden="true">↓</span></div>
        <ui-scroll-scene class="scene-image-story" ui-mobile-disabled ui-mobile-breakpoint="992">
          <ui-scroll-scene-inner>
            <ui-scroll-scene-item>
              <article class="scene-image-panel">
                <img class="scene-image-background" src="https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=2000" alt="" />
                <div class="scene-image-shade"></div>
                <div class="scene-image-layout">
                  <div class="scene-image-copy"><span>01 / DISCOVER</span><h3>Title 1</h3><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime voluptatibus quia fuga ea consectetur, natus veritatis molestias sint magni reprehenderit?</p></div>
                  <div class="scene-image-portrait"><img src="https://images.pexels.com/photos/8063550/pexels-photo-8063550.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="Portrait for scene one" /></div>
                </div>
              </article>
            </ui-scroll-scene-item>
            <ui-scroll-scene-item>
              <article class="scene-image-panel">
                <img class="scene-image-background" src="https://images.pexels.com/photos/1435752/pexels-photo-1435752.jpeg?auto=compress&cs=tinysrgb&w=2000" alt="" />
                <div class="scene-image-shade"></div>
                <div class="scene-image-layout">
                  <div class="scene-image-copy"><span>02 / EXPLORE</span><h3>Title 2</h3><p>Fugiat necessitatibus sit voluptate rerum impedit illum eaque asperiores consequuntur! Deserunt fugiat suscipit at quod! Consectetur vitae repellat nostrum?</p></div>
                  <div class="scene-image-portrait"><img src="https://images.pexels.com/photos/8205481/pexels-photo-8205481.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="Portrait for scene two" /></div>
                </div>
              </article>
            </ui-scroll-scene-item>
            <ui-scroll-scene-item>
              <article class="scene-image-panel">
                <img class="scene-image-background" src="https://images.pexels.com/photos/1090977/pexels-photo-1090977.jpeg?auto=compress&cs=tinysrgb&w=2000" alt="" />
                <div class="scene-image-shade"></div>
                <div class="scene-image-layout">
                  <div class="scene-image-copy"><span>03 / REMEMBER</span><h3>Title 3</h3><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, quisquam rem qui tempore repellendus vel cum illum suscipit voluptate quod?</p></div>
                  <div class="scene-image-portrait"><img src="https://images.pexels.com/photos/19163481/pexels-photo-19163481.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="Portrait for scene three" /></div>
                </div>
              </article>
            </ui-scroll-scene-item>
            <div class="scene-image-fixed-stage" aria-hidden="true">
              <div class="scene-image-portrait-fixed">
                <img class="scene-image-portrait-layer" src="https://images.pexels.com/photos/8063550/pexels-photo-8063550.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="" />
                <img class="scene-image-portrait-layer" src="https://images.pexels.com/photos/8205481/pexels-photo-8205481.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="" />
                <img class="scene-image-portrait-layer" src="https://images.pexels.com/photos/19163481/pexels-photo-19163481.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="" />
              </div>
            </div>
          </ui-scroll-scene-inner>
        </ui-scroll-scene>
        <div class="scene-image-outro"><span>END OF STORY</span><h2>Tiếp tục khám phá</h2><p>Cuộn ngược để xem lại từng cảnh.</p></div>`;
      if (variant === 'Editorial story') return `
        <p class="demo-text">Cuộn đến khi section chạm đỉnh màn hình. Mỗi nửa chiều cao màn hình sẽ đổi một cảnh.</p>
        <ui-scroll-scene class="scroll-scene-demo scroll-scene-demo--editorial" ui-threshold="0.5" ui-mobile-disabled ui-mobile-breakpoint="680">
          <ui-scroll-scene-inner>
            <ui-scroll-scene-item><article class="scroll-scene-panel"><img src="/images/botanical.jpg" alt="White flower among dark foliage" /><div class="scroll-scene-copy"><span>01 / DETAIL</span><h2>Look a little closer.</h2><p>Small details change the whole story.</p></div></article></ui-scroll-scene-item>
            <ui-scroll-scene-item><article class="scroll-scene-panel"><img src="/images/architecture.jpg" alt="Sculptural staircase in warm light" /><div class="scroll-scene-copy"><span>02 / FORM</span><h2>Find the shape.</h2><p>Every angle reveals a new perspective.</p></div></article></ui-scroll-scene-item>
            <ui-scroll-scene-item><article class="scroll-scene-panel"><img src="/images/coast.jpg" alt="Turquoise coast in sunlight" /><div class="scroll-scene-copy"><span>03 / SPACE</span><h2>Let the scene breathe.</h2><p>The page continues after the final scene.</p></div></article></ui-scroll-scene-item>
          </ui-scroll-scene-inner>
        </ui-scroll-scene>`;
      return `
        <p class="demo-text">Một câu chuyện bằng ảnh. Cuộn xuống để đổi cảnh; cuộn lên để xem lại.</p>
        <ui-scroll-scene class="scroll-scene-demo" ui-threshold="0.65" ui-mobile-disabled ui-mobile-breakpoint="680">
          <ui-scroll-scene-inner>
            <ui-scroll-scene-item><article class="scroll-scene-panel"><img src="/images/coast.jpg" alt="Sunlit cliffs and blue sea" /><div class="scroll-scene-copy"><span>01 / COAST</span><h2>Follow the light.</h2><p>Scroll to discover the next place.</p></div></article></ui-scroll-scene-item>
            <ui-scroll-scene-item><article class="scroll-scene-panel"><img src="/images/architecture.jpg" alt="Warm stone staircase" /><div class="scroll-scene-copy"><span>02 / ARCHITECTURE</span><h2>Step inside.</h2><p>A different scene, held in the same frame.</p></div></article></ui-scroll-scene-item>
            <ui-scroll-scene-item><article class="scroll-scene-panel"><img src="/images/botanical.jpg" alt="Flower against deep green leaves" /><div class="scroll-scene-copy"><span>03 / NATURE</span><h2>Stay curious.</h2><p>Keep scrolling to continue the page.</p></div></article></ui-scroll-scene-item>
          </ui-scroll-scene-inner>
        </ui-scroll-scene>`;
    }
    case 'ui-typing': {
      if (variant === 'Slide headline') return `
        <div class="typing-stage typing-stage--slide">
          <span class="typing-stage-kicker">BUILT FOR WHAT'S NEXT</span>
          <h2>Our <ui-typing ui-effect="slide" ui-content='["Mission", "Vision", "Future"]' ui-duration="450" ui-delay="2200"></ui-typing><br />starts here.</h2>
          <p>Short phrases slide through the same space without shifting the headline layout.</p>
        </div>`;
      if (variant === 'Goo morph') return `
        <div class="typing-stage typing-stage--goo">
          <span class="typing-stage-kicker">THE SHAPE OF IDEAS</span>
          <h2><ui-typing ui-effect="goo" ui-content='["Creative", "Curious", "Brave"]' ui-duration="900" ui-delay="1900"></ui-typing><br />by design.</h2>
          <p>An SVG goo filter blends one word into the next.</p>
        </div>`;
      return `
        <div class="typing-stage typing-stage--type">
          <span class="typing-stage-kicker">DIGITAL STUDIO</span>
          <h2>Chúng tôi tạo<br /><ui-typing ui-effect="typing" ui-content='["website đẹp", "trải nghiệm tuyệt vời", "sản phẩm số"]' ui-duration="80" ui-delay="2000" ui-cursor-char="|"></ui-typing></h2>
          <p>One headline, many ideas. The cursor types each phrase and erases it before the next.</p>
        </div>`;
    }
    case 'ui-cursor': {
      if (variant === 'Text image reveal') {
        const stories = [
          { name: 'Quiet landscapes', number: '01', image: '/images/coast.jpg' },
          { name: 'Spaces in motion', number: '02', image: '/images/architecture.jpg' },
          { name: 'Details worth seeing', number: '03', image: '/images/botanical.jpg' },
        ];
        return `<section class="cursor-editorial-stage">
          <div class="cursor-editorial-heading"><span class="eyebrow">HOVER TO DISCOVER</span><p>Move over the words to reveal a photograph.</p></div>
          <div class="cursor-editorial-list">${stories.map((story) => `
            <div class="cursor-editorial-row">
              <span class="cursor-editorial-number">${story.number}</span>
              <ui-cursor ui-name="story-${story.number}" ui-lerp-ease="0.16" class="cursor-editorial-title">
                <span>${story.name}</span>
                <ui-cursor-item ui-name="story-${story.number}" class="cursor-editorial-image"><img src="${story.image}" alt=""></ui-cursor-item>
              </ui-cursor>
              <img class="cursor-editorial-mobile" src="${story.image}" alt="">
              <span class="cursor-editorial-arrow" aria-hidden="true">↗</span>
            </div>`).join('')}</div>
        </section>`;
      }
      if (variant === 'Split cursor') return `
        <p class="demo-text">Move from the left half to the right half. This example also uses the <code>div is="ui-cursor"</code> syntax.</p>
        <div is="ui-cursor" ui-name="['cursor-prev','cursor-next']" class="cursor-demo-stage cursor-demo-split">
          <span>← Previous</span><span>Next →</span>
          <ui-cursor-item ui-name="cursor-prev">← Prev</ui-cursor-item>
          <ui-cursor-item ui-name="cursor-next">Next →</ui-cursor-item>
        </div>`;
      if (variant === 'Distortion gallery') return `
        <p class="demo-text">Move across each card to compare the four distortion presets.</p>
        <div class="cursor-distortion-grid">${[2, 3, 4, 5].map((index) => `
          <ui-cursor class="cursor-distortion-card" ui-name="cursor-distortion-${index}" ui-distortion="distortion-${index}" ui-lerp-ease="0.16">
            <span>Distortion ${index}</span>
            <strong>Move here</strong>
            <ui-cursor-item class="cursor-image-item" ui-name="cursor-distortion-${index}"><img src="https://images.pexels.com/photos/${[432059, 842963, 157886, 6207714, 6214365][index - 1]}/pexels-photo-${[432059, 842963, 157886, 6207714, 6214365][index - 1]}.jpeg?auto=compress&cs=tinysrgb&w=400" alt=""></ui-cursor-item>
          </ui-cursor>`).join('')}</div>`;
      if (variant === 'Magnetic button') return `
        <p class="demo-text">The button reacts to the same pointer coordinates that drive the cursor item.</p>
        <ui-cursor ui-name="cursor-magnet" class="cursor-demo-stage cursor-demo-magnet" ui-lerp-ease="0.18">
          <button class="cursor-magnetic-button">Explore more ↗</button>
          <ui-cursor-item ui-name="cursor-magnet" class="cursor-magnetic-item">Explore</ui-cursor-item>
        </ui-cursor>`;
      return `
        <p class="demo-text">Hover the link or button to change the cursor item. The red area disables it.</p>
        <ui-cursor ui-name="cursor-basic" class="cursor-demo-stage cursor-demo-basic" ui-absolute ui-lerp-ease="0.12">
          <h2>Follow the pointer</h2>
          <div class="cursor-demo-actions"><a href="#/ui-cursor">Hover a link</a><button class="btn primary">Hover a button</button></div>
          <div ui-cursor-disabled class="cursor-disabled-zone">Native cursor here</div>
          <ui-cursor-item ui-name="cursor-basic">Move</ui-cursor-item>
        </ui-cursor>`;
    }
    case 'ui-toggle': {
      return `
        <p class="demo-text">Enterprise disclosure component (<code style="color:var(--ui-color-accent)">&lt;ui-toggle&gt;</code> / <code style="color:var(--ui-color-accent)">&lt;ui-toggle-trigger&gt;</code>). Supports outside-click dismissal, autofocus first input, floating portal positioning, and keyboard Escape.</p>

        <!-- 1. Dropdown with Outside Click & Autofocus -->
        <div style="background:var(--gallery-panel-strong);padding:1.5rem;border-radius:12px;margin-bottom:1.5rem">
          <h3 style="margin:0 0 0.75rem 0;font-size:1.1rem;font-weight:600">1. Dropdown Menu (Outside Click & Autofocus)</h3>
          <p style="font-size:0.85rem;color:var(--ui-color-text-muted);margin-bottom:1rem">Clicking "Open Search" opens the dropdown and automatically focuses the input. Click outside or press Escape to close.</p>

          <div style="position:relative;display:inline-block">
            <ui-toggle-trigger name="search-dropdown">
              <button class="btn" style="background:#3b82f6;color:white;padding:0.5rem 1rem;border-radius:6px;border:none;cursor:pointer">🔍 Open Search Dropdown ▼</button>
            </ui-toggle-trigger>

            <ui-toggle
              name="search-dropdown"
              outside-click-enabled="true"
              autofocus="true"
              style="position:absolute;top:100%;left:0;margin-top:0.5rem;background:var(--gallery-panel);border:1px solid var(--ui-color-border);border-radius:8px;padding:1rem;min-width:280px;box-shadow:0 10px 25px rgba(0,0,0,0.5);z-index:50"
            >
              <div style="margin-bottom:0.75rem">
                <input type="text" placeholder="Type search query..." style="width:100%;padding:0.4rem 0.6rem;background:var(--gallery-panel-strong);border:1px solid var(--ui-color-border);border-radius:4px;color:var(--ui-color-text);box-sizing:border-box" />
              </div>
              <div style="display:flex;flex-direction:column;gap:0.4rem;font-size:0.9rem">
                <a href="#/docs/toggle" style="color:var(--ui-color-accent);text-decoration:none">⚡ Quick Link: Documentation</a>
                <a href="#/ui-carousel" style="color:var(--ui-color-accent);text-decoration:none">🎠 Quick Link: Carousel</a>
                <a href="#/ui-marquee" style="color:var(--ui-color-accent);text-decoration:none">📜 Quick Link: Marquee</a>
              </div>
            </ui-toggle>
          </div>
        </div>

        <!-- 2. Mobile Menu with Inside Close Trigger -->
        <div style="background:var(--gallery-panel-strong);padding:1.5rem;border-radius:12px;margin-bottom:1.5rem">
          <h3 style="margin:0 0 0.75rem 0;font-size:1.1rem;font-weight:600">2. Mobile Nav Drawer (Multiple Triggers)</h3>
          <p style="font-size:0.85rem;color:var(--ui-color-text-muted);margin-bottom:1rem">Features an external trigger to open and an internal close button (<code style="color:var(--ui-color-accent)">&times; Đóng</code>) inside the panel.</p>

          <ui-toggle-trigger name="mobile-nav">
            <button class="btn ghost" style="padding:0.5rem 1rem;border:1px solid #4b5563;border-radius:6px;cursor:pointer">☰ Toggle Mobile Navigation</button>
          </ui-toggle-trigger>

          <ui-toggle
            name="mobile-nav"
            outside-click-enabled="true"
            style="margin-top:0.75rem;background:var(--gallery-panel);border:1px solid var(--ui-color-border);border-radius:8px;padding:1rem"
          >
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--ui-color-border);padding-bottom:0.5rem;margin-bottom:0.75rem">
              <span style="font-weight:700;color:var(--ui-color-text)">Navigation Menu</span>
              <ui-toggle-trigger name="mobile-nav">
                <button style="background:none;border:none;color:#ef4444;font-size:1.1rem;cursor:pointer;font-weight:bold">&times; Close</button>
              </ui-toggle-trigger>
            </div>
            <nav style="display:flex;flex-direction:column;gap:0.5rem">
              <a href="#/" style="color:var(--ui-color-text);text-decoration:none">🏠 Home</a>
              <a href="#/ui-toggle" style="color:var(--ui-color-text);text-decoration:none">🔘 Toggle Specs</a>
              <a href="#/ui-carousel" style="color:var(--ui-color-text);text-decoration:none">🎡 Carousel</a>
              <a href="#/ui-marquee" style="color:var(--ui-color-text);text-decoration:none">⏩ Infinite Marquee</a>
            </nav>
          </ui-toggle>
        </div>

        <!-- 3. Switch Mode (Backwards Compatibility) -->
        <div style="background:var(--gallery-panel-strong);padding:1.5rem;border-radius:12px">
          <h3 style="margin:0 0 0.75rem 0;font-size:1.1rem;font-weight:600">3. Switch / Checkbox Mode (Backward Compatibility)</h3>
          <div class="row" style="margin-bottom:0.5rem">
            <ui-toggle label="Notifications"></ui-toggle>
            <span style="margin-left:0.5rem">Notifications</span>
          </div>
          <div class="row" style="margin-bottom:0.5rem">
            <ui-toggle label="Auto-save" checked></ui-toggle>
            <span style="margin-left:0.5rem">Auto-save (checked)</span>
          </div>
          <div class="row">
            <ui-toggle label="Disabled" disabled></ui-toggle>
            <span style="margin-left:0.5rem">Disabled</span>
          </div>
        </div>
      `;
    }
    case 'ui-collapse':
      return `
        <p class="demo-text">Standalone collapsible panel với trigger riêng biệt, animation height mượt mà và active-binding icon.</p>
        <div style="max-width:540px;display:flex;flex-direction:column;gap:1rem">
          <div style="border:1px solid var(--ui-color-border);border-radius:8px;overflow:hidden;background:var(--gallery-panel)">
            <ui-collapse-trigger name="demo-c1" active-binding="button[data-state], .chevron[rotate]" style="display:block">
              <button type="button" data-state="closed" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;background:none;border:none;cursor:pointer;font-weight:600;font-size:0.95rem;text-align:left">
                <span>Tại sao nên chọn UI Core Components?</span>
                <span class="chevron" style="transition:transform 0.25s ease;display:inline-block">▼</span>
              </button>
            </ui-collapse-trigger>
            <ui-collapse name="demo-c1" duration="300" easing="decay">
              <div style="padding:1rem;background:var(--gallery-panel-strong);border-top:1px solid var(--ui-color-border);color:var(--ui-color-text-muted);line-height:1.6;font-size:0.9rem">
                Các component được xây dựng dựa trên Web Component tiêu chuẩn, zero runtime dependency, tối ưu hiệu năng và hỗ trợ đầy đủ accessibility (ARIA).
              </div>
            </ui-collapse>
          </div>
        </div>
        <style>
          .chevron[rotate] { transform: rotate(180deg) !important; }
        </style>
      `;
    case 'ui-accordion':
      return `
        <p class="demo-text">Accordion container (ui-collapse-provider / ui-accordion): Chỉ 1 mục mở tại 1 thời điểm, tự động ghép trigger & collapse.</p>
        <div style="max-width:540px">
          <ui-collapse-provider duration="300" style="display:flex;flex-direction:column;gap:0.5rem">
            <div style="border:1px solid var(--ui-color-border);border-radius:8px;overflow:hidden;background:var(--gallery-panel)">
              <ui-collapse-trigger active active-binding=".acc-icon[rotate]">
                <button type="button" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;background:none;border:none;cursor:pointer;font-weight:600;font-size:0.95rem;text-align:left">
                  <span>Mục 1: Cài đặt và tích hợp</span>
                  <span class="acc-icon" style="transition:transform 0.25s ease;display:inline-block">▼</span>
                </button>
              </ui-collapse-trigger>
              <ui-collapse active>
                <div style="padding:1rem;background:var(--gallery-panel-strong);border-top:1px solid var(--ui-color-border);color:var(--ui-color-text-muted);line-height:1.6;font-size:0.9rem">
                  Hỗ trợ cả import ES module native hoặc bundler (Vite, Next.js, Webpack, Nuxt).
                </div>
              </ui-collapse>
            </div>

            <div style="border:1px solid var(--ui-color-border);border-radius:8px;overflow:hidden;background:var(--gallery-panel)">
              <ui-collapse-trigger active-binding=".acc-icon[rotate]">
                <button type="button" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;background:none;border:none;cursor:pointer;font-weight:600;font-size:0.95rem;text-align:left">
                  <span>Mục 2: Tuỳ biến CSS và Theming</span>
                  <span class="acc-icon" style="transition:transform 0.25s ease;display:inline-block">▼</span>
                </button>
              </ui-collapse-trigger>
              <ui-collapse>
                <div style="padding:1rem;background:var(--gallery-panel-strong);border-top:1px solid var(--ui-color-border);color:var(--ui-color-text-muted);line-height:1.6;font-size:0.9rem">
                  Dễ dàng ghi đè biến CSS Design Tokens (@ui/tokens) hoặc viết style custom theo thiết kế Figma.
                </div>
              </ui-collapse>
            </div>

            <div style="border:1px solid var(--ui-color-border);border-radius:8px;overflow:hidden;background:var(--gallery-panel)">
              <ui-collapse-trigger active-binding=".acc-icon[rotate]">
                <button type="button" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;background:none;border:none;cursor:pointer;font-weight:600;font-size:0.95rem;text-align:left">
                  <span>Mục 3: Khả năng tiếp cận Accessibility</span>
                  <span class="acc-icon" style="transition:transform 0.25s ease;display:inline-block">▼</span>
                </button>
              </ui-collapse-trigger>
              <ui-collapse>
                <div style="padding:1rem;background:var(--gallery-panel-strong);border-top:1px solid var(--ui-color-border);color:var(--ui-color-text-muted);line-height:1.6;font-size:0.9rem">
                  Tự động gán role="region", role="button", aria-expanded và aria-hidden chuẩn WAI-ARIA, điều hướng phím Enter/Space.
                </div>
              </ui-collapse>
            </div>
          </ui-collapse-provider>
        </div>
        <style>
          .acc-icon[rotate] { transform: rotate(180deg) !important; }
        </style>
      `;
    case 'ui-tabs':
      return `
        <p class="demo-text">Tab + arrow-key navigation. Use ←/→ to move, Home/End to jump.</p>
        <ui-tabs>
          <div role="tablist">
            <button role="tab" id="t1" aria-controls="p1">Overview</button>
            <button role="tab" id="t2" aria-controls="p2">Specs</button>
            <button role="tab" id="t3" aria-controls="p3">Reviews</button>
          </div>
          <div role="tabpanel" id="p1" aria-labelledby="t1"><p>Overview content. Click another tab to switch.</p></div>
          <div role="tabpanel" id="p2" aria-labelledby="t2"><p>Specs content with technical details.</p></div>
          <div role="tabpanel" id="p3" aria-labelledby="t3"><p>Reviews content with user feedback.</p></div>
        </ui-tabs>
      `;
    case 'ui-modal': {
      const card = (name: string, title: string, attributes = '') => `
        <div class="modal-showcase-card">
          <span class="eyebrow">${title}</span>
          <ui-modal-trigger ui-name="${name}"><button class="btn primary">Open ${title}</button></ui-modal-trigger>
          <ui-modal ui-name="${name}" ${attributes}>
            <div class="modal-showcase-content">
              <ui-modal-trigger><button class="modal-showcase-close" aria-label="Close modal">×</button></ui-modal-trigger>
              <p class="eyebrow">UI MODAL</p><h2>${title}</h2>
              <p>Try Escape, the backdrop, and keyboard Tab. Focus returns to the trigger on close.</p>
              <ui-modal-pan class="modal-showcase-pan">↕ Swipe this area to close on touch</ui-modal-pan>
            </div>
          </ui-modal>
        </div>`;
      if (variant === 'Placements') return `<p class="demo-text">Position a dialog at any corner or edge.</p><div class="modal-showcase-grid">${['center', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((position) => card(`modal-${position}`, position, `ui-placement="${position}" ui-animate="${position.startsWith('top') ? 'slide-down' : position.startsWith('bottom') ? 'slide-up' : 'zoom'}"`)).join('')}</div>`;
      if (variant === 'Responsive and pan') return `<p class="demo-text">Resize below 700px: the dialog becomes a bottom sheet. Swipe the handle down to close.</p><div class="modal-showcase-grid">${card('modal-responsive', 'Responsive sheet', `ui-animate="fade-up" ui-breakpoints="{700:{placement:'bottom-center',animate:'slide-up',duration:400}}"`)}${card('modal-backdrop', 'Custom backdrop', `ui-backdrop-color="rgba(56, 36, 95, .7)" ui-backdrop-blur="10"`)}${card('modal-locked', 'Explicit close', `ui-esc-close-disabled ui-backdrop-close-disabled`)}</div>`;
      if (variant === 'Lightbox and API') return `<p class="demo-text">The smart zoom begins at the thumbnail. Use <code>uiModal.open('modal-photo')</code> from JavaScript.</p><div class="modal-showcase-grid"><ui-modal-trigger ui-name="modal-photo" class="modal-showcase-photo"><img src="https://images.pexels.com/photos/949670/pexels-photo-949670.jpeg?auto=compress&cs=tinysrgb&w=500" alt="Open mountain photograph"></ui-modal-trigger><ui-modal ui-name="modal-photo" ui-animate="smart-zoom" ui-easing="spring" ui-duration="600" style="--ui-modal-padding:0;--ui-modal-width:80vw"><ui-modal-pan><img style="display:block;max-width:100%;max-height:80dvh" src="https://images.pexels.com/photos/949670/pexels-photo-949670.jpeg?auto=compress&cs=tinysrgb&w=1500" alt="Mountain photograph"></ui-modal-pan></ui-modal>${card('modal-api', 'JavaScript API', 'ui-animate="smart-fade-zoom"')}</div>`;
      return `<p class="demo-text">Each effect has its own entrance and exit motion.</p><div class="modal-showcase-grid">${['smart-fade-zoom', 'smart-zoom', 'zoom', 'fade', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'none'].map((effect) => card(`modal-${effect}`, effect, `ui-animate="${effect}"`)).join('')}</div>`;
    }
    case 'ui-drawer':
      return `
        <p class="demo-text">Slide-in side panel. Useful for navigation or settings.</p>
        <div class="row">
          <button id="open-left" class="btn primary">Open left drawer</button>
          <button id="open-right" class="btn ghost">Open right drawer</button>
        </div>
        <ui-drawer placement="left" id="drawer-left">
          <button data-drawer-close style="float:right">×</button>
          <h3>Menu</h3>
          <ul style="list-style:none;padding:0">
            <li style="padding:0.5rem 0">Home</li>
            <li style="padding:0.5rem 0">About</li>
            <li style="padding:0.5rem 0">Contact</li>
          </ul>
        </ui-drawer>
        <ui-drawer placement="right" id="drawer-right">
          <button data-drawer-close style="float:right">×</button>
          <h3>Settings</h3>
        </ui-drawer>
      `;
    case 'ui-popover':
      return `
        <p class="demo-text">Click the trigger to toggle.</p>
        <ui-popover>
          <button data-popover-trigger class="btn primary">Click me</button>
          <div data-popover-content>
            <strong>Hello!</strong>
            <p>This is a popover. It positions automatically.</p>
          </div>
        </ui-popover>
      `;
    case 'ui-tooltip':
      return `
        <p class="demo-text">Hover, focus with Tab, or tap the triggers. Press Escape to dismiss.</p>
        <div class="row" style="gap: 1.25rem; align-items: center; flex-wrap: wrap; padding: 2rem 1rem;">
          <ui-tooltip ui-title="Thêm vào giỏ hàng" ui-placement="top-center">
            <button class="btn primary">Giỏ hàng</button>
          </ui-tooltip>
          <ui-tooltip ui-title="Thông tin thêm" ui-placement="bottom-start" ui-animate="fade-up" ui-duration="300" ui-offset="12">
            <button class="btn ghost" aria-label="Thông tin thêm">?</button>
          </ui-tooltip>
          <ui-tooltip ui-title="Tooltip bên trái" ui-placement="left-center" ui-animate="scale">
            <button class="btn ghost">Bên trái</button>
          </ui-tooltip>
        </div>
      `;
    case 'ui-lazyload':
      return `
        <p class="demo-text">Real images load when scrolled into view. Each image is 1200×800.</p>
        <div class="grid-3">
          ${[1, 2, 3, 4, 5, 6].map((i) => `
            <ui-lazyload>
              <img data-src="https://picsum.photos/seed/l${i}/600/400"
                   src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'><rect fill='%23ddd'/></svg>"
                   style="width:100%;border-radius:8px"
                   loading="lazy">
            </ui-lazyload>
          `).join('')}
        </div>
      `;
    case 'ui-photoswipe': {
      const images = [
        { src: '/images/coast.jpg', title: 'The quiet coast', number: '01', alt: 'Sunlit coast and blue sea' },
        { src: '/images/architecture.jpg', title: 'Lines and light', number: '02', alt: 'Architectural building in warm light' },
        { src: '/images/botanical.jpg', title: 'Botanical study', number: '03', alt: 'Close view of plants and leaves' },
      ];
      const custom = variant === 'Custom options';
      const single = variant === 'Single image';
      return `<p class="demo-text">${single
        ? 'A single photo opens in the same full-screen zoom viewer. Click the image to try it.'
        : custom
        ? 'This gallery uses a dark backdrop, a fade transition, and wheel zoom. Click a photo, then swipe or use the arrow keys.'
        : 'Click a photo for the full-screen lightbox. Pinch or double-click to zoom; swipe or use the arrow keys to move between images.'}</p>
        <ui-photoswipe class="photoswipe-demo-grid"${custom ? ` ui-options='{"bgOpacity":0.92,"loop":false,"wheelToZoom":true,"showHideAnimationType":"fade","showAnimationDuration":450}'` : ''}>
          ${(single ? images.slice(0, 1) : images).map((image) => `<a href="${image.src}" data-pswp-width="1672" data-pswp-height="941" aria-label="Open ${image.title} in the photo gallery">
            <img src="${image.src}" alt="${image.alt}" loading="lazy" />
            <span class="photoswipe-demo-caption"><span>${image.number} / ${image.title}</span><span aria-hidden="true">↗</span></span>
          </a>`).join('')}
        </ui-photoswipe>`;
    }
    case 'ui-image-comparison':
      if (variant === 'Keyboard navigation') return `
        <p class="demo-text">Focus the comparison, then use ← / → by 5%, Shift + arrow by 10%, or Home / End.</p>
        <ui-image-comparison class="comparison-demo comparison-demo--architecture" ui-default-percent="65" aria-label="Compare original and restored architecture photo">
          <ui-image-comparison-before>
            <img src="/images/architecture.jpg" alt="Architecture photo before color restoration" loading="lazy" />
            <ui-image-comparison-label>Before</ui-image-comparison-label>
          </ui-image-comparison-before>
          <ui-image-comparison-after>
            <img src="/images/architecture.jpg" alt="Architecture photo after color restoration" loading="lazy" />
            <ui-image-comparison-label>After</ui-image-comparison-label>
          </ui-image-comparison-after>
          <ui-image-comparison-handle></ui-image-comparison-handle>
        </ui-image-comparison>`;
      return `
        <p class="demo-text">Drag the handle, swipe across the image, or click a position to compare the color grade.</p>
        <ui-image-comparison class="comparison-demo comparison-demo--coast" ui-default-percent="50" ui-animate aria-label="Compare monochrome and color coast photo">
          <ui-image-comparison-before>
            <img src="/images/coast.jpg" alt="Coast photograph in monochrome" loading="lazy" />
            <ui-image-comparison-label>Before</ui-image-comparison-label>
          </ui-image-comparison-before>
          <ui-image-comparison-after>
            <img src="/images/coast.jpg" alt="Coast photograph in color" loading="lazy" />
            <ui-image-comparison-label>After</ui-image-comparison-label>
          </ui-image-comparison-after>
          <ui-image-comparison-handle>
            <ui-image-comparison-handle-icon aria-hidden="true">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none"><path d="m17 17-7 7 7 7M31 17l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </ui-image-comparison-handle-icon>
          </ui-image-comparison-handle>
        </ui-image-comparison>`;
    case 'ui-counter':
      return `
        <p class="demo-text">The count starts when the component loads. Reload this demo to replay it.</p>
        <div class="grid-3">
          <div class="counter-card"><ui-counter from="0" to="100" duration="2000">0</ui-counter><small>0 → 100</small></div>
          <div class="counter-card"><ui-counter from="50" to="999" duration="2500">50</ui-counter><small>50 → 999</small></div>
          <div class="counter-card"><ui-counter from="-100" to="100" duration="1800">-100</ui-counter><small>-100 → 100</small></div>
        </div>
      `;
    case 'ui-dark-mode':
      return `
        <p class="demo-text">Click the button to cycle light / dark / auto. Set <code>data-theme</code> on <code>:root</code>.</p>
        <ui-dark-mode mode="auto" id="theme-toggle" class="btn ghost">Click to cycle theme</ui-dark-mode>
      `;
    case 'ui-marquee':
      return `
        <p class="demo-text">Enterprise infinite looping marquee component (<code style="color:var(--ui-color-accent)">&lt;ui-marquee&gt;</code>). Dynamic gapless clones, pause-on-hover, bi-directional horizontal & vertical orientations, and scroll parallax scrubbing.</p>

        <!-- 1. Interactive Horizontal Marquee with Controls -->
        <div style="background:var(--gallery-panel-strong);padding:1.5rem;border-radius:12px;margin-bottom:1.5rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.5rem">
            <h3 style="margin:0;font-size:1.1rem;font-weight:600">Horizontal Marquee (RTL & LTR)</h3>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <button class="btn btn-sm" id="marquee-toggle" style="border-radius:4px;padding:3px 10px;font-size:0.8rem">Pause</button>
              <button class="btn btn-sm marquee-speed" data-speed="3" style="border-radius:4px;padding:3px 8px;font-size:0.8rem">Slow (3)</button>
              <button class="btn btn-sm marquee-speed" data-speed="6" style="border-radius:4px;padding:3px 8px;font-size:0.8rem;background:#3b82f6;color:white">Normal (6)</button>
              <button class="btn btn-sm marquee-speed" data-speed="14" style="border-radius:4px;padding:3px 8px;font-size:0.8rem">Fast (14)</button>
            </div>
          </div>
          <ui-marquee id="demo-marquee-horiz" speed="6" pause-on-hover="true" style="padding:0.75rem 0;background:var(--gallery-panel);border-radius:8px">
            <span class="marquee-cell" style="padding:0.25rem 1rem;font-weight:600;color:var(--ui-color-accent)">⚡ Real-time Speed Adjustment</span>
            <span class="marquee-cell" style="padding:0.25rem 1rem;font-weight:600;color:#34d399">🚀 Dynamic Gapless Clones</span>
            <span class="marquee-cell" style="padding:0.25rem 1rem;font-weight:600;color:#f472b6">💎 Hover to Pause</span>
            <span class="marquee-cell" style="padding:0.25rem 1rem;font-weight:600;color:#fbbf24">✨ Zero Dependencies</span>
          </ui-marquee>

          <!-- Opposite Direction LTR -->
          <ui-marquee direction="ltr" speed="5" pause-on-hover="true" style="margin-top:0.75rem;padding:0.75rem 0;background:var(--gallery-panel);border-radius:8px">
            <span class="marquee-cell" style="padding:0.25rem 1rem;color:var(--ui-color-text-muted)">← Reverse Direction (LTR)</span>
            <span class="marquee-cell" style="padding:0.25rem 1rem;color:var(--ui-color-text-muted)">Accessible ARIA Role Region</span>
            <span class="marquee-cell" style="padding:0.25rem 1rem;color:var(--ui-color-text-muted)">Custom Elements V1</span>
            <span class="marquee-cell" style="padding:0.25rem 1rem;color:var(--ui-color-text-muted)">120 FPS GPU Accelerated</span>
          </ui-marquee>
        </div>

        <!-- 2. Vertical Marquee & Scroll Parallax -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem">
          <!-- Vertical Ticker -->
          <div style="background:var(--gallery-panel-strong);padding:1.5rem;border-radius:12px">
            <h3 style="margin:0 0 0.75rem 0;font-size:1.1rem;font-weight:600">Vertical Marquee (vertical)</h3>
            <ui-marquee vertical="true" direction="btt" speed="5" pause-on-hover="true" style="height:150px;background:var(--gallery-panel);border-radius:8px;padding:0.5rem 1rem">
              <div style="padding:0.4rem 0;border-bottom:1px solid var(--ui-color-border);color:var(--ui-color-text);font-size:0.9rem">📢 Notice: System update scheduled</div>
              <div style="padding:0.4rem 0;border-bottom:1px solid var(--ui-color-border);color:var(--ui-color-text);font-size:0.9rem">📈 Traffic increased by 42%</div>
              <div style="padding:0.4rem 0;border-bottom:1px solid var(--ui-color-border);color:var(--ui-color-text);font-size:0.9rem">🛡️ Security audit: 100% passed</div>
              <div style="padding:0.4rem 0;border-bottom:1px solid var(--ui-color-border);color:var(--ui-color-text);font-size:0.9rem">⚡ Web Component loaded in 1.2ms</div>
            </ui-marquee>
          </div>

          <!-- Scroll Parallax Scrubbing -->
          <div style="background:var(--gallery-panel-strong);padding:1.5rem;border-radius:12px">
            <h3 style="margin:0 0 0.75rem 0;font-size:1.1rem;font-weight:600">Scroll Parallax (scroll-enabled)</h3>
            <p style="font-size:0.8rem;color:var(--ui-color-text-muted);margin-top:0;margin-bottom:0.75rem">Scroll the page up/down to observe parallax acceleration!</p>
            <ui-marquee scroll-enabled="true" scroll-speed="2.5" speed="8" style="background:var(--gallery-panel);border-radius:8px;padding:0.75rem 0">
              <span style="font-size:1.1rem;font-weight:800;letter-spacing:1px;color:#a855f7;padding:0 1rem">✦ SCROLL ACCELERATION</span>
              <span style="font-size:1.1rem;font-weight:800;letter-spacing:1px;color:#06b6d4;padding:0 1rem">✦ PARALLAX SCRUBBING</span>
              <span style="font-size:1.1rem;font-weight:800;letter-spacing:1px;color:#ec4899;padding:0 1rem">✦ 120 FPS FLUID</span>
            </ui-marquee>
          </div>
        </div>
      `;
    case 'ui-carousel': {
      const slides = [1, 2, 3, 4, 5, 6].map((number) =>
        `<ui-carousel-slide><div class="carousel-item carousel-item-${number}"><span>Slide</span><strong>${number}</strong></div></ui-carousel-slide>`,
      ).join('');
      const controls = `<div class="carousel-controls">
        <ui-carousel-prev><button type="button" aria-label="Previous slide">← Prev</button></ui-carousel-prev>
        <ui-carousel-next><button type="button" aria-label="Next slide">Next →</button></ui-carousel-next>
      </div><ui-carousel-pagination></ui-carousel-pagination>`;
      if (variant === 'With thumbnails') {
        const thumbnails = [1, 2, 3, 4, 5, 6].map((number) =>
          `<ui-carousel-slide><div class="carousel-item-thumb carousel-item-${number}">${number}</div></ui-carousel-slide>`,
        ).join('');
        return `<p class="demo-text">Select a thumbnail, swipe the slides, or use the arrows. The main view adapts to the available width.</p>
          <ui-carousel class="gallery-carousel" ui-rewind ui-per-view="4" ui-breakpoints="{ 600: { perView: 1, perMove: 1, gap: 10, overflow: 'visible' }, 1000: { perView: 2, perMove: 2 } }" ui-render-bullet="<span></span>">
            <ui-carousel-inner><ui-carousel-list>${slides}</ui-carousel-list></ui-carousel-inner>
            <ui-carousel-thumbnail ui-per-view="7" class="gallery-thumbnail"><ui-carousel-inner><ui-carousel-list>${thumbnails}</ui-carousel-list></ui-carousel-inner></ui-carousel-thumbnail>
            ${controls}
          </ui-carousel>`;
      }
      return `<p class="demo-text">A simple carousel with six slides. Use the arrows, bullets, or keyboard.</p>
        <ui-carousel class="gallery-carousel" ui-per-view="1" ui-render-bullet="<span></span>">
          <ui-carousel-inner><ui-carousel-list>${slides}</ui-carousel-list></ui-carousel-inner>
          ${controls}
        </ui-carousel>`;
    }
    case 'ui-grid-hover-expand': {
      const compact = variant === 'Compact cards';
      const edge = variant === 'Edge to edge';
      const allCards = [
        { image: 'coast', name: 'Open water', type: 'Coastal study', position: 'center' },
        { image: 'architecture', name: 'Quiet lines', type: 'Architecture', position: '22% center' },
        { image: 'botanical', name: 'New growth', type: 'Botanical study', position: 'center' },
        { image: 'architecture', name: 'Warm light', type: 'Places', position: '75% center' },
        { image: 'coast', name: 'Blue hour', type: 'Landscape', position: '75% center' },
        { image: 'botanical', name: 'Natural forms', type: 'Nature', position: '70% center' },
      ];
      const cards = edge ? allCards.slice(0, 3) : allCards;
      return `<p class="demo-text">Hover a card or focus it with Tab. Only cards in the same row change width; the grid resets when you leave.</p>
        <ui-grid-hover-expand class="grid-hover-demo${compact ? ' grid-hover-demo--compact' : ''}${edge ? ' grid-hover-demo--edge' : ''}" style="--xs:1;--sm:1;--md:${edge ? 3 : 2};--lg:${compact ? 4 : 3}" ui-gap="${edge ? 0 : 16}" ui-duration="400">
          ${cards.map((card, index) => `<div><div class="grid-hover-demo__card" tabindex="0" role="img" aria-label="${card.name}, ${card.type}">
            <img src="/images/${card.image}.jpg" alt="" loading="lazy" style="object-position:${card.position}" />
            <span class="grid-hover-demo__number">${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}</span>
            <div class="grid-hover-demo__caption"><small>${card.type}</small><h3>${card.name}</h3><span>Discover the story ↗</span></div>
          </div></div>`).join('')}
        </ui-grid-hover-expand>`;
    }
    case 'ui-swipeable-card-stack': {
      const style = variant === 'Down stack' ? 2 : variant === 'Scattered deck' ? 3 : 1;
      const photos = [
        { image: 'coast', name: 'Open water', category: 'LANDSCAPE', position: 'center' },
        { image: 'architecture', name: 'Quiet lines', category: 'ARCHITECTURE', position: '25% center' },
        { image: 'botanical', name: 'New growth', category: 'BOTANICAL', position: 'center' },
        { image: 'coast', name: 'Blue hour', category: 'LANDSCAPE', position: '78% center' },
        { image: 'architecture', name: 'Warm light', category: 'ARCHITECTURE', position: '74% center' },
      ];
      return `<section class="swipe-stack-demo swipe-stack-demo--${style}">
        <div class="swipe-stack-demo__intro"><span class="eyebrow">CARD STUDY / 0${style}</span><h2>${style === 1 ? 'A story in layers.' : style === 2 ? 'The next one waits.' : 'A little disorder.'}</h2><p>Drag the front card left or right. A short drag returns it to place; a full swipe brings the next card forward.</p></div>
        <div class="swipe-stack-demo__stage">
          <ui-swipeable-card-stack class="ui-swipeable-card-stack--style-${style}" ui-style="${style}" ui-items-to-show="${style === 3 ? 5 : 4}" ui-scale-threshold="0.1" ui-speed="400" ui-easing="${style === 1 ? 'spring' : 'decay'}" aria-label="Photo card stack">
            ${photos.map((photo, index) => `<article class="swipe-stack-demo__card"><img src="/images/${photo.image}.jpg" alt="${photo.name}" loading="lazy" style="object-position:${photo.position}" /><div class="swipe-stack-demo__shade"></div><div class="swipe-stack-demo__card-top"><span>FIELD NOTES</span><span>${String(index + 1).padStart(2, '0')} / 05</span></div><div class="swipe-stack-demo__card-bottom"><small>${photo.category}</small><h3>${photo.name}</h3></div></article>`).join('')}
          </ui-swipeable-card-stack>
        </div>
        <div class="swipe-stack-demo__controls"><button type="button" data-stack-direction="left" aria-label="Swipe card left">←</button><span data-stack-counter>01 / 05</span><button type="button" data-stack-direction="right" aria-label="Swipe card right">→</button><button type="button" class="swipe-stack-demo__jump" data-stack-goto="4">Go to last card ↗</button></div>
      </section>`;
    }
    case 'ui-expandable-grid': {
      const compact = variant === 'Compact grid';
      const photos = [
        { image: 'coast', name: 'The quiet coast', category: 'Landscape', note: 'A little room to breathe, where the sea meets a lighter horizon.' },
        { image: 'architecture', name: 'Lines & light', category: 'Architecture', note: 'Geometry, warm stone, and the moments between shadows.' },
        { image: 'botanical', name: 'Botanical study', category: 'Nature', note: 'A closer look at the quiet details of the natural world.' },
        { image: 'architecture', name: 'Still spaces', category: 'Architecture', note: 'The kind of place that changes with every hour of daylight.' },
        { image: 'coast', name: 'Blue hour', category: 'Landscape', note: 'An open view, the last colour in the sky, and nowhere else to be.' },
        { image: 'botanical', name: 'New growth', category: 'Nature', note: 'Fresh forms and textures gathered into a simple visual story.' },
      ];
      return `<p class="demo-text">Select a card to expand it in the grid. The other cards move into place. Press Escape to close.</p>
        <ui-expandable-grid class="expandable-grid-demo${compact ? ' expandable-grid-demo--compact' : ''}" ui-duration="650">
          ${photos.map((photo, index) => `<ui-expandable-grid-item>
            <img src="/images/${photo.image}.jpg" alt="${photo.name}" loading="lazy" />
            <div class="expandable-grid-demo__shade"></div>
            <div class="expandable-grid-demo__top"><span>NO. ${String(index + 1).padStart(2, '0')}</span><span>${photo.category}</span></div>
            <div class="expandable-grid-demo__content">
              <h3>${photo.name}</h3>
              <ui-expandable-grid-detail><p>${photo.note}</p></ui-expandable-grid-detail>
              <button type="button" ui-expandable-grid-trigger aria-label="Toggle ${photo.name}"><span class="expandable-grid-demo__closed">Explore story ↗</span><span class="expandable-grid-demo__open">Close story ×</span></button>
            </div>
          </ui-expandable-grid-item>`).join('')}
        </ui-expandable-grid>`;
    }
    case 'ui-orbit-gallery': {
      const reverse = variant === 'Reverse orbit';
      const photos = [
        { image: 'coast', name: 'Blue hour', position: 'center' },
        { image: 'architecture', name: 'Warm lines', position: '20% center' },
        { image: 'botanical', name: 'Still life', position: 'center' },
        { image: 'coast', name: 'Open water', position: '80% center' },
        { image: 'architecture', name: 'Soft geometry', position: '75% center' },
        { image: 'botanical', name: 'New growth', position: '70% center' },
        { image: 'coast', name: 'The horizon', position: '30% center' },
        { image: 'architecture', name: 'Afternoon light', position: 'center' },
        { image: 'botanical', name: 'Quiet garden', position: '20% center' },
        { image: 'coast', name: 'Last light', position: '60% center' },
      ];
      return `<section class="orbit-demo">
        <div class="orbit-demo__heading"><span class="eyebrow">A study in motion / 001</span><h2>Places in <em>orbit.</em></h2><p>Ten moments, one continuous journey. Hover over the gallery to pause and take a closer look.</p></div>
        <ui-orbit-gallery ui-duration="${reverse ? 30000 : 24000}"${reverse ? ' ui-direction="reverse"' : ''} aria-label="Rotating photo gallery">
          <ui-orbit-gallery-track>
            ${photos.map((photo, index) => `<ui-orbit-gallery-item><img src="/images/${photo.image}.jpg" alt="${photo.name}" style="object-position:${photo.position}" /><span class="orbit-demo__caption"><small>${String(index + 1).padStart(2, '0')} / 10</small><strong>${photo.name}</strong></span></ui-orbit-gallery-item>`).join('')}
          </ui-orbit-gallery-track>
        </ui-orbit-gallery>
        <div class="orbit-demo__footer"><span>✦ Curated perspectives</span><span>Hover to pause · ${reverse ? 'Reverse' : 'Forward'} rotation</span></div>
      </section>`;
    }
    case 'ui-dot-morph': {
      const neon = variant === 'Neon particles';
      const words = neon ? ['MOTION', 'ENERGY', 'FLOW'] : ['CREATE', 'EXPLORE', 'INSPIRE'];
      return `<section class="dot-morph-demo${neon ? ' dot-morph-demo--neon' : ''}">
        <div class="dot-morph-demo__intro"><span class="eyebrow">PARTICLE STUDY / ${neon ? '02' : '01'}</span><h2>Chaos becomes <em>meaning.</em></h2><p>Hover, focus, or tap the field. The particles move through three words; edit the first one below.</p></div>
        <ui-dot-morph ui-text='${JSON.stringify(words)}' ui-duration="3000" ui-interval="1500"></ui-dot-morph>
        <div class="dot-morph-demo__footer"><label>FIRST WORD <input data-dot-morph-input type="text" maxlength="18" value="${words[0]}" aria-label="First word to form with particles" /></label><span>MOVE INTO THE FIELD ↗</span></div>
      </section>`;
    }
    default:
      return `<code>&lt;${tag}&gt;</code>`;
  }
}

/* ============================================================
   Helpers
   ============================================================ */

function queryParam(k: string): string {
  return new URLSearchParams(location.hash.split('?')[1] ?? '').get(k) ?? '';
}

function wireAnimateReplay(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-replay-animate]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.demo-block')?.querySelectorAll('ui-animate').forEach((effect) => {
        effect.replaceWith(effect.cloneNode(true));
      });
    });
  });
}

function wireParallaxDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.text-fly-track').forEach((element) => {
    const scroll = element as HTMLElement & { customEffects(callback: (params: { element: HTMLElement; createValue: (key: string) => string | number; EMPTY: string }) => void): void };
    scroll.customEffects(({ element: target, createValue, EMPTY }) => {
      const value = createValue('travel');
      if (value === EMPTY) return;
      const progress = Math.max(0, Math.min(1, Number(value)));
      const viewportWidth = target.parentElement?.clientWidth ?? window.innerWidth;
      const start = viewportWidth * 0.78;
      const end = viewportWidth * 0.64 - target.offsetWidth;
      target.style.transform = `translate3d(${start + (end - start) * progress}px, 0, 0)`;
    });
  });
  root.querySelectorAll<HTMLElement>('.parallax-custom-demo').forEach((element) => {
    const scroll = element as HTMLElement & { customEffects(callback: (params: { element: HTMLElement; createValue: (key: string) => string | number; EMPTY: string }) => void): void };
    scroll.customEffects(({ element: target, createValue, EMPTY }) => {
      const value = createValue('opacityCustom');
      if (value !== EMPTY) target.style.opacity = String(value);
    });
  });
  root.querySelectorAll<HTMLElement>('.parallax-circular-item').forEach((element) => {
    const scroll = element as HTMLElement & { customEffects(callback: (params: { element: HTMLElement; createValue: (key: string) => string | number; EMPTY: string }) => void): void };
    scroll.customEffects(({ element: target, createValue, EMPTY }) => {
      const value = createValue('orbitShift');
      if (value !== EMPTY) target.style.setProperty('--orbit-shift', `${Number(value)}px`);
    });
  });
}

function wireSwipeableStackDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.swipe-stack-demo').forEach((demo) => {
    const stack = demo.querySelector('ui-swipeable-card-stack') as HTMLElement & {
      readonly activeIndex: number;
      readonly items: HTMLElement[];
      swipeLeft(): Promise<void>;
      swipeRight(): Promise<void>;
      goTo(index: number): Promise<void>;
    } | null;
    if (!stack) return;
    const counter = demo.querySelector<HTMLElement>('[data-stack-counter]');
    const update = (): void => {
      if (counter) counter.textContent = `${String(stack.activeIndex + 1).padStart(2, '0')} / ${String(stack.items.length).padStart(2, '0')}`;
    };
    stack.addEventListener('ui:swipeable-card-stack:change', update);
    demo.querySelectorAll<HTMLButtonElement>('[data-stack-direction]').forEach((button) => {
      button.addEventListener('click', () => { void (button.dataset['stackDirection'] === 'right' ? stack.swipeRight() : stack.swipeLeft()); });
    });
    demo.querySelector<HTMLButtonElement>('[data-stack-goto]')?.addEventListener('click', () => { void stack.goTo(4); });
    update();
  });
}

function wireToastDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-toast-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset['toastKind'] ?? 'default';
      const labels: Record<string, [string, string, string]> = {
        success: ['✓', 'Order confirmed', 'Your order was placed successfully.'],
        error: ['!', 'Something went wrong', 'Please try that action again.'],
        warning: ['⚠', 'Check your details', 'One field still needs your attention.'],
        info: ['i', 'New update', 'A fresh version is ready to explore.'],
        default: ['✦', 'All set', 'Your changes have been saved.'],
        custom: ['✉', 'New message', 'You have a note waiting in your inbox.'],
      };
      const [icon, title, message] = labels[kind] ?? labels['default']!;
      uiToast.push({
        content: `<div class="gallery-toast-content"><span class="gallery-toast-icon" aria-hidden="true">${icon}</span><div><strong>${title}</strong><span>${message}</span></div></div>`,
        className: `gallery-toast gallery-toast--${kind}`,
        placement: kind === 'default' ? 'bottom-center' : 'top-right',
        closeButtonPlacement: 'center-right',
        delay: 3200,
      });
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-toast-placement]').forEach((button) => {
    button.addEventListener('click', () => {
      const position = button.dataset['toastPlacement'] as ToastPlacement;
      uiToast.push({ content: `<strong>${position}</strong><br>Notification at this position.`, placement: position, className: 'gallery-toast gallery-toast--info', delay: 3000 });
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-toast-motion]').forEach((button) => {
    button.addEventListener('click', () => {
      const motion = button.dataset['toastMotion'];
      if (motion === 'stack') {
        for (let index = 1; index <= 3; index++) uiToast.push({ content: `<strong>Notification ${index} of 3</strong><br>Toasts stack neatly in one portal.`, placement: 'top-right', className: 'gallery-toast gallery-toast--info', delay: 4000 });
        return;
      }
      uiToast.push({
        content: `<strong>${motion === 'persistent' ? 'Stays until closed' : motion === 'spring' ? 'Spring motion' : 'Quick notice'}</strong><br>${motion === 'persistent' ? 'Use the close button to dismiss this toast.' : 'This notification will disappear automatically.'}`,
        placement: 'top-center',
        className: 'gallery-toast gallery-toast--success',
        easing: motion === 'spring' ? 'spring' : 'decay',
        duration: motion === 'spring' ? 600 : 200,
        delay: motion === 'persistent' ? Infinity : 2000,
      });
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-toast-template]').forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.dataset['toastTemplate'];
      if (name) uiToast.push({ name });
    });
  });
}

function wireDotMorphDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLInputElement>('[data-dot-morph-input]').forEach((input) => {
    input.addEventListener('input', () => {
      const morph = input.closest('.dot-morph-demo')?.querySelector('ui-dot-morph');
      if (!morph) return;
      const words = JSON.parse(morph.getAttribute('ui-text') || '[]') as string[];
      words[0] = input.value.slice(0, 18) || 'UI';
      morph.setAttribute('ui-text', JSON.stringify(words));
    });
  });
}

function wireButtons(): void {
  document.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement;
      // Open modal
      if (t.id === 'open-modal') {
        document.querySelector<UiModal>('ui-modal')?.openModal();
      }
      // Drawer open
      if (t.id === 'open-left') {
        (document.getElementById('drawer-left') as UiDrawer | null)?.openDrawer();
      }
      if (t.id === 'open-right') {
        (document.getElementById('drawer-right') as UiDrawer | null)?.openDrawer();
      }
      // Marquee toggle play/pause
      if (t.id === 'marquee-toggle') {
        const m = document.getElementById('demo-marquee-horiz') as unknown as { isRunning: boolean; play(): void; pause(): void } | null;
        if (m) {
          if (m.isRunning) {
            m.pause();
            t.textContent = 'Play';
          } else {
            m.play();
            t.textContent = 'Pause';
          }
        }
      }
      // Marquee speed switcher
      const speedBtn = t.closest('.marquee-speed') as HTMLElement | null;
      if (speedBtn) {
        const speed = speedBtn.getAttribute('data-speed') || '6';
        const m = document.getElementById('demo-marquee-horiz') as HTMLElement | null;
        if (m) {
          m.setAttribute('speed', speed);
          document.querySelectorAll('.marquee-speed').forEach((b) => {
            (b as HTMLElement).style.background = '';
            (b as HTMLElement).style.color = '';
          });
          speedBtn.style.background = '#3b82f6';
          speedBtn.style.color = 'white';
        }
      }
    },
    { once: false },
  );
}

/* ============================================================
   Router
   ============================================================ */

window.addEventListener('hashchange', route);
route();

function route(): void {
  const [path] = location.hash.split('?');
  if (!path || path === '#' || path === '#/') {
    renderHome();
  } else if (path.startsWith('#/docs/')) {
    const slug = path.replace('#/docs/', '');
    renderDocPage(slug);
  } else if (path.startsWith('#/ui/')) {
    const sub = path.replace('#/ui/', '');
    const tag = sub.startsWith('ui-') ? sub : `ui-${sub}`;
    renderDemo(tag);
  } else {
    renderDemo(path.slice(2));
  }
}

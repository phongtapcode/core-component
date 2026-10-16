/**
 * Gallery SPA entry. Hash-based routing.
 */

import { uiToast, type ToastPlacement, type UiModal, type UiDrawer, type UiAnimatedBackground } from '@ui/components';
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
    'ui-animate': '✦', 'ui-parallax': '▧', 'ui-text-spotlight': '◉', 'ui-animated-background': '✳', 'ui-toggle': '◉',
    'ui-collapse': '⌄', 'ui-accordion': '☷', 'ui-tabs': '▤', 'ui-modal': '▣', 'ui-cursor': '◎', 'ui-fake-cursor': '➤',
    'ui-drawer': '◧', 'ui-popover': '▢', 'ui-tooltip': '?', 'ui-lazyload': '◐',
    'ui-image-comparison': '◒', 'ui-image-trace': '✎', 'ui-image-flashlight': '◉', 'ui-counter': '99', 'ui-dark-mode': '☼',
    'ui-marquee': '→', 'ui-carousel': '◫', 'ui-expandable-grid': '▦', 'ui-grid-hover-expand': '▥', 'ui-swipeable-card-stack': '▤', 'ui-orbit-gallery': '◌', 'ui-dot-morph': '✳', 'ui-logo-assembly': '✦', 'ui-sand-physics': '▨', 'ui-image-solid': '⬡', 'ui-image-stack': '▰', 'ui-flip-book': '▣',
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
  wireLogoAssemblyDemo(appRoot);
  wireSandPhysicsDemo(appRoot);
  wireImageSolidDemo(appRoot);
  wireFlipBookDemo(appRoot);
  wireFakeCursorDemo(appRoot);
  wireTextSpotlightDemo(appRoot);
  wireBackgroundDemo(appRoot);
  wireImageTraceDemo(appRoot);
  wireImageFlashlightDemo(appRoot);
}

/* ============================================================
   Demo page
   ============================================================ */

function renderDemo(tagName: string): void {
  const resolvedTagName = tagName === 'ui-background' || tagName === 'background' ? 'ui-animated-background' : tagName;
  const entry = COMPONENTS.find((c) => c.tagName === resolvedTagName || c.tagName === `ui-${resolvedTagName}`);
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
  wireLogoAssemblyDemo(appRoot);
  wireSandPhysicsDemo(appRoot);
  wireImageSolidDemo(appRoot);
  wireFlipBookDemo(appRoot);
  wireFakeCursorDemo(appRoot);
  wireTextSpotlightDemo(appRoot);
  wireBackgroundDemo(appRoot);
  wireImageTraceDemo(appRoot);
  wireImageFlashlightDemo(appRoot);
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

const BACKGROUND_PATHS = [
  'M 50,10 L 61,40 L 95,40 L 68,60 L 79,90 L 50,70 L 21,90 L 32,60 L 5,40 L 39,40 Z',
  'M 50,10 A 40,40 0 1,1 49.9,10 Z',
  'M 50,30 C 50,20 40,10 30,10 C 20,10 10,20 10,30 C 10,45 30,60 50,90 C 70,60 90,45 90,30 C 90,20 80,10 70,10 C 60,10 50,20 50,30 Z',
];

function backgroundSlider(label: string, attr: string, value: string, min: number, max: number, step: number, unit = ''): string {
  return `<label class="background-demo__slider"><span>${label}<output>${value}${unit}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-background-attr="${attr}" data-unit="${unit}" /></label>`;
}

function backgroundControls(textMode: boolean): string {
  return `<aside class="background-demo__controls">
    <div class="background-demo__controls-heading"><span>LIVE CONTROLS</span><strong>${textMode ? 'Text particles' : 'SVG particles'}</strong><p>Change the values and watch the preview update.</p></div>
    ${textMode ? `<div class="background-demo__field"><label>First word<input type="text" value="MOTION" maxlength="16" data-background-word="0" /></label><label>Second word<input type="text" value="DESIGN" maxlength="16" data-background-word="1" /></label><button type="button" data-background-apply="words">Apply words</button></div>`
      : `<label class="background-demo__field">Shapes<select data-background-shape><option value="all">Star → Circle → Heart</option><option value="0">Star only</option><option value="1">Circle only</option><option value="2">Heart only</option><option value="custom">Custom paths</option></select></label><details class="background-demo__custom"><summary>Custom SVG paths</summary><label>SVG viewBox<input type="text" value="0 0 100 100" spellcheck="false" data-background-viewbox /></label><textarea rows="4" spellcheck="false" aria-label="SVG path array" data-background-paths>${JSON.stringify(BACKGROUND_PATHS)}</textarea><button type="button" data-background-apply="paths">Apply paths</button></details>`}
    <label class="background-demo__field">Color palette<select data-background-palette><option value="${textMode ? 'ice' : 'warm'}">${textMode ? 'Ice' : 'Warm gold'}</option><option value="${textMode ? 'warm' : 'ice'}">${textMode ? 'Warm gold' : 'Ice'}</option><option value="neon">Neon</option><option value="mono">White</option></select></label>
    ${backgroundSlider('Particles', 'ui-particle-count', textMode ? '2200' : '2300', 300, 4000, 100)}
    ${textMode ? backgroundSlider('Font size', 'ui-font-size', '230', 60, 300, 10, 'px') : ''}
    ${backgroundSlider('Turbulence', 'ui-turbulence', textMode ? '.65' : '1', 0, 2, .05)}
    ${backgroundSlider('Pull strength', 'ui-pull-strength', textMode ? '.45' : '.55', 0, 2, .05)}
    ${backgroundSlider('Mouse radius', 'ui-influence-radius', textMode ? '180' : '210', 60, 400, 10, 'px')}
    ${backgroundSlider('Flow speed', 'ui-flow-speed', '.5', 0, 2, .05)}
    ${backgroundSlider('Morph duration', 'ui-morph-duration', textMode ? '3.8' : '3.2', 1, 8, .1, 's')}
    <div class="background-demo__actions"><button type="button" data-background-replay>↻ Replay entrance</button><span data-background-message role="status" aria-live="polite"></span></div>
  </aside>`;
}

function renderDemoBody(tag: string, variant: string): string {
  // Every demo returns a card with the running component + sample content.
  switch (tag) {
    case 'ui-animated-background': {
      const textMode = variant === 'Text particle morph';
      return `<section class="background-demo">
        <div class="background-demo__preview${textMode ? ' background-demo__preview--text' : ''}">
          <ui-animated-background ui-style="particle-morph" ${textMode ? 'ui-texts=\'["MOTION","DESIGN"]\'' : `ui-svg-paths='${JSON.stringify(BACKGROUND_PATHS)}'`}
            ui-colors='${textMode ? '["#d6f5ff","#8ae6ee","#ffffff"]' : '["#ffffff","#ffe46d","#e6ad69"]'}'
            ui-particle-count="${textMode ? '2200' : '2300'}" ui-font-size="230" ui-turbulence="${textMode ? '.65' : '1'}"
            ui-pull-strength="${textMode ? '.45' : '.55'}" ui-flow-speed=".5" ui-influence-radius="${textMode ? '180' : '210'}"
            ui-morph-duration="${textMode ? '3.8' : '3.2'}" ui-mouse-container=".background-demo__preview"></ui-animated-background>
          <span class="background-demo__preview-label">${textMode ? 'TEXT MORPH' : 'SVG MORPH'}</span>
          <span class="background-demo__preview-hint">MOVE YOUR CURSOR OVER THE PARTICLES</span>
        </div>
        ${backgroundControls(textMode)}
      </section>`;
    }
    case 'ui-text-spotlight': {
      if (variant === 'Archive transcript') return `<section class="text-spotlight-demo text-spotlight-demo--transcript">
        <header class="text-spotlight-demo__transcript-heading"><div><span>THE AFTER HOURS INDEX / 002</span><h2>Conversations<br><em>left in the dark.</em></h2></div><p>A wider editorial layout gives the light more space to travel. Follow it across the transcript to uncover each line.</p></header>
        <div class="text-spotlight-demo__stage"><div class="text-spotlight-demo__glow"></div>
          <ui-text-spotlight aria-label="Archive transcript" style="--ui-text-spotlight-radius:175px">
            <div class="text-spotlight-demo__transcript-rail"><span data-spotlight-badge>ARCHIVE / 017</span><span>23:48<br>RECORDING</span><span>◉</span></div>
            <div class="text-spotlight-demo__transcript-copy"><span class="text-spotlight-demo__speaker">INTERVIEWER · THE LAST QUESTION</span><h3 data-spotlight-title>“What did you see<br>when the lights went out?”</h3><p data-spotlight-description>“At first, nothing. Then the details appeared one by one, exactly where I chose to look.”</p><button type="button" data-spotlight-action>Open full transcript ↗</button></div>
          </ui-text-spotlight>
          <span class="text-spotlight-demo__hint" aria-live="polite">SCAN THE TRANSCRIPT · FOLLOW THE LIGHT</span>
        </div>
      </section>`;
      return `<section class="text-spotlight-demo">
        <div class="text-spotlight-demo__intro"><span>POINTER LIGHT / 01</span><h2>Find the words<br><em>in the dark.</em></h2><p>Move across the card to reveal fragments of its text. The beam follows smoothly and fades when you leave.</p></div>
        <div class="text-spotlight-demo__stage"><div class="text-spotlight-demo__glow"></div>
          <ui-text-spotlight aria-label="Hidden artifact" style="--ui-text-spotlight-radius:145px">
            <span data-spotlight-badge>OBJECT / 404</span>
            <h3 data-spotlight-title>Hidden Artifact</h3>
            <p data-spotlight-description>A forgotten object is concealed in darkness. Guide the beam across the card to uncover its details.</p>
            <button type="button" data-spotlight-action>Explore artifact →</button>
          </ui-text-spotlight>
          <span class="text-spotlight-demo__hint" aria-live="polite">MOVE THE CURSOR · FOLLOW THE LIGHT</span>
        </div>
      </section>`;
    }
    case 'ui-image-flashlight': {
      const botanical = variant === 'Botanical night';
      return `<section class="image-flashlight-demo">
        <div class="image-flashlight-demo__intro"><span>LIGHT STUDY / 0${botanical ? '2' : '1'}</span><h2>From shadow<br>to <em>light.</em></h2><p>A moving beam reveals the real photo for a moment, then opens wide until every detail is visible.</p></div>
        <div class="image-flashlight-demo__frame">
          <ui-image-flashlight ui-duration="7200" ui-radius="${botanical ? '.22' : '.27'}" ui-loop style="--ui-image-flashlight-darkness:${botanical ? '.25' : '.21'}">
            <img src="/images/${botanical ? 'botanical' : 'coast'}.jpg" width="1672" height="941" alt="${botanical ? 'Botanical leaves' : 'Coastal landscape'}" />
          </ui-image-flashlight>
          <span class="image-flashlight-demo__caption">${botanical ? 'NIGHT GARDEN' : 'COASTAL DAWN'}</span>
        </div>
        <div class="image-flashlight-demo__footer"><span data-flashlight-status>LIGHT SCAN ACTIVE</span><div class="image-flashlight-demo__actions"><label>↑ Try your image<input type="file" accept="image/*" data-flashlight-upload /></label><button type="button" data-flashlight-replay>↻ Shine again</button></div></div>
      </section>`;
    }
    case 'ui-image-trace': {
      const botanical = variant === 'Botanical';
      return `<section class="image-trace-demo">
        <div class="image-trace-demo__intro"><span>IMAGE / TO / INK</span><h2>First the lines.<br><em>Then the light.</em></h2><p>The component reads a photo, traces its contours, and reveals the real image when the drawing finishes.</p></div>
        <div class="image-trace-demo__frame">
          <ui-image-trace ui-duration="3800" ui-detail="360" ui-contrast="40" style="--ui-image-trace-stroke:${botanical ? '#4e6843' : '#314e70'};--ui-image-trace-background:${botanical ? '#e9eee1' : '#e5eaf0'}">
            <img src="/images/${botanical ? 'botanical' : 'architecture'}.jpg" width="1672" height="941" alt="${botanical ? 'Botanical leaves' : 'Architectural building'}" />
          </ui-image-trace>
          <span class="image-trace-demo__caption">${botanical ? '02 / BOTANICAL STUDY' : '01 / ARCHITECTURE STUDY'}</span>
        </div>
        <div class="image-trace-demo__footer"><span>CONTOUR STUDY · FROM PIXELS</span><div class="image-trace-demo__actions"><label>↑ Try your image<input type="file" accept="image/*" data-trace-upload /></label><button type="button" data-trace-replay>↻ Draw again</button></div></div>
      </section>`;
    }
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
    case 'ui-fake-cursor': {
      const activates = variant === 'Auto click';
      const scene = activates
        ? `<div class="fake-cursor-demo__window fake-cursor-demo__window--publish">
            <div class="fake-cursor-demo__toolbar"><span class="fake-cursor-demo__dots"><i></i><i></i><i></i></span><span>campaign / overview</span><button type="button" data-cursor-target>Publish project ↗</button></div>
            <div class="fake-cursor-demo__publish-layout"><aside><span>WORKSPACE</span><strong>Overview</strong><strong>Pages</strong><strong>Assets</strong><strong>Settings</strong></aside><article><span>READY TO GO LIVE</span><h3>Your next chapter<br><em>starts here.</em></h3><p>A finished project, one action away from the world.</p><div class="fake-cursor-demo__publish-preview"><span>PROJECT PREVIEW</span><strong>Make something<br>remarkable.</strong></div><small data-fake-cursor-status>Waiting for the guided click…</small></article></div>
          </div>`
        : `<div class="fake-cursor-demo__window"><div class="fake-cursor-demo__toolbar"><span class="fake-cursor-demo__dots"><i></i><i></i><i></i></span><span>project-board.fig</span><span>● LIVE PREVIEW</span></div>
            <div class="fake-cursor-demo__canvas"><div class="fake-cursor-demo__frame"><span>YOUR WORKSPACE / 01</span><h3>Start with an idea.<br><em>Make it real.</em></h3><p>Invite your team into a space made for the next big thing.</p><button type="button" data-cursor-target> Create project <span>↗</span></button><small data-fake-cursor-status>Visual demonstration · button is still yours to click</small></div></div>
          </div>`;
      return `<section class="fake-cursor-demo">
        <div class="fake-cursor-demo__heading"><span class="eyebrow">GUIDED INTERACTION / ${activates ? '02' : '01'}</span><h2>${activates ? 'From ready <em>to published.</em>' : 'A little pointer. <em>A clear next step.</em>'}</h2><p>${activates ? 'The cursor travels to the Publish button in the upper right and clicks it.' : 'Watch the pointer demonstrate a click while the button remains under your control.'}</p></div>
        <ui-fake-cursor class="fake-cursor-demo__stage${activates ? ' fake-cursor-demo__stage--publish' : ''}" ui-target="[data-cursor-target]" ui-duration="3600" ui-label="Alex" ${activates ? 'ui-activate' : ''}>${scene}</ui-fake-cursor>
        <p class="fake-cursor-demo__note">${activates ? 'This example enables ui-activate, so the guided click triggers the button.' : 'Default mode shows the motion and click pulse without pressing the real button.'}</p>
      </section>`;
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
      const withThumbnails = variant === 'With thumbnails';
      const photos = [
        { image: 'coast', title: 'Where the sea slows time', category: 'COASTAL JOURNAL', number: '01', position: 'center 52%' },
        { image: 'architecture', title: 'The beauty of quiet lines', category: 'SPACES & FORM', number: '02', position: 'center 48%' },
        { image: 'botanical', title: 'A little closer to nature', category: 'BOTANICAL STUDY', number: '03', position: 'center 55%' },
        { image: 'coast', title: 'The light beyond the shore', category: 'OPEN HORIZONS', number: '04', position: '78% center' },
        { image: 'architecture', title: 'A different point of view', category: 'ARCHITECTURAL NOTES', number: '05', position: '24% center' },
        { image: 'botanical', title: 'The shapes of growing things', category: 'NATURAL FORMS', number: '06', position: '72% center' },
      ];
      const slides = photos.map((photo) =>
        `<ui-carousel-slide><article class="carousel-photo"><img src="/images/${photo.image}.jpg" alt="${photo.title}" draggable="false" style="object-position:${photo.position}"><div class="carousel-photo__content"><span>${photo.category} / ${photo.number}</span><h3>${photo.title}</h3><p>Explore the collection →</p></div></article></ui-carousel-slide>`,
      ).join('');
      const thumbnails = photos.map((photo) =>
        `<ui-carousel-slide><div class="carousel-photo-thumb"><img src="/images/${photo.image}.jpg" alt="" draggable="false" style="object-position:${photo.position}"><span>${photo.number} · ${photo.category}</span></div></ui-carousel-slide>`,
      ).join('');
      return `<section class="carousel-showcase">
        <div class="carousel-showcase__heading"><div><span class="eyebrow">VISUAL STORIES / ${withThumbnails ? 'THUMBNAILS' : 'EDITORIAL'}</span><h2>Moments worth <em>exploring.</em></h2></div><p>Swipe the images or use the controls to move through the collection.</p></div>
        <ui-carousel class="gallery-carousel" ui-per-view="1" ui-gap="0" ui-speed="550" aria-label="Visual stories gallery">
          <ui-carousel-inner>
            <ui-carousel-list>${slides}</ui-carousel-list>
            <ui-carousel-prev><button type="button" aria-label="Previous photo">←</button></ui-carousel-prev>
            <ui-carousel-pagination></ui-carousel-pagination>
            <ui-carousel-next><button type="button" aria-label="Next photo">→</button></ui-carousel-next>
          </ui-carousel-inner>
          ${withThumbnails ? `<ui-carousel-thumbnail ui-per-view="3" class="gallery-thumbnail"><ui-carousel-inner><ui-carousel-list>${thumbnails}</ui-carousel-list></ui-carousel-inner></ui-carousel-thumbnail>` : ''}
        </ui-carousel>
      </section>`;
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
        <div class="dot-morph-demo__intro"><span class="eyebrow">PARTICLE STUDY / ${neon ? '02' : '01'}</span><h2>Chaos becomes <em>meaning.</em></h2><p>Enter your own words below, one per line. Hover, focus, or tap the field to see the particles form each one.</p></div>
        <ui-dot-morph ui-text='${JSON.stringify(words)}' ui-duration="3000" ui-interval="1500"></ui-dot-morph>
        <div class="dot-morph-demo__footer"><label>YOUR WORDS <span>One word or short phrase per line</span><textarea data-dot-morph-input rows="3" aria-label="Words to form with particles, one per line">${words.join('\n')}</textarea></label><span>MOVE INTO THE FIELD ↗</span></div>
      </section>`;
    }
    case 'ui-logo-assembly': {
      const prism = variant === 'Prism mark';
      return `<section class="logo-assembly-demo">
        <div class="logo-assembly-demo__heading"><span class="eyebrow">PARTICLE LAB / ${prism ? '02' : '01'}</span><h2>Light becomes <em>identity.</em></h2><p>Move through the particles. Click the mark to break it apart, then watch it rebuild.</p></div>
        <div class="logo-assembly-demo__stage">
          <ui-logo-assembly ui-src="/images/assembly-${prism ? 'prism' : 'nova'}.svg" ui-count="3600" ui-particle-size="1.7" ui-speed="2300" ui-attraction="0.024" ui-repel="3.2" ui-repel-radius="110" ui-brightness="1" ui-glow="7" aria-label="${prism ? 'Prism' : 'Nova'} particle logo. Click to explode and rebuild."></ui-logo-assembly>
          <div class="logo-assembly-demo__caption"><span data-logo-status>SCATTERED / WAITING TO ASSEMBLE</span><span data-logo-count>— PARTICLES</span></div>
        </div>
        <div class="logo-assembly-demo__actions"><button type="button" data-logo-action="explode">✦ Explode</button><button type="button" data-logo-action="scatter">⁂ Scatter</button><button type="button" data-logo-action="assemble">↗ Assemble</button><button type="button" data-logo-action="switch">⇄ Change logo</button><label class="logo-assembly-demo__upload">↑ Upload SVG / PNG / WebP<input type="file" accept="image/svg+xml,image/png,image/webp" data-logo-upload /></label></div>
        <div class="logo-assembly-demo__controls">
          <label>Particles <input data-logo-setting="ui-count" type="range" min="500" max="6000" step="100" value="3600" /><output>3600</output></label>
          <label>Size <input data-logo-setting="ui-particle-size" type="range" min="0.7" max="3" step="0.1" value="1.7" /><output>1.7</output></label>
          <label>Brightness <input data-logo-setting="ui-brightness" type="range" min="0.4" max="2" step="0.1" value="1" /><output>1</output></label>
          <label>Speed <input data-logo-setting="ui-speed" type="range" min="700" max="5000" step="100" value="2300" /><output>2300</output></label>
          <label>Attraction <input data-logo-setting="ui-attraction" type="range" min="0.005" max="0.08" step="0.005" value="0.024" /><output>0.024</output></label>
          <label>Repulsion <input data-logo-setting="ui-repel" type="range" min="0" max="10" step="0.2" value="3.2" /><output>3.2</output></label>
          <label>Repel radius <input data-logo-setting="ui-repel-radius" type="range" min="30" max="240" step="10" value="110" /><output>110</output></label>
          <label>Glow <input data-logo-setting="ui-glow" type="range" min="0" max="20" step="1" value="7" /><output>7</output></label>
          <label>Particle color <input type="color" value="#8deaff" data-logo-color aria-label="Override particle color" /><button type="button" data-logo-original-color>Original colors</button></label>
          <label>Interaction <select data-logo-interaction><option value="all">Hover + click</option><option value="hover">Hover only</option><option value="click">Click only</option><option value="none">None</option></select></label>
        </div>
      </section>`;
    }
    case 'ui-sand-physics':
      return `<section class="sand-demo">
        <div class="sand-demo__heading"><span class="eyebrow">MATERIAL LAB / 001</span><h2>Make a little <em>world.</em></h2><p>Hold and drag to pour particles. Draw real walls, reverse gravity, then watch water, lava, fire and smoke interact.</p></div>
        <div class="sand-demo__stage"><ui-sand-physics ui-preset="funnel" ui-initial-count="1800" ui-auto-rate="180" ui-tool="sand" ui-cell-size="4" ui-brush-size="5" aria-label="Interactive sand simulation"></ui-sand-physics><div class="sand-demo__status"><span data-sand-count>0 PARTICLES</span><span data-sand-status>SIMULATING</span></div></div>
        <div class="sand-demo__toolbar" role="group" aria-label="Sandbox actions">
          <button type="button" data-sand-action="pause">Ⅱ Pause</button><button type="button" data-sand-action="undo">↶ Undo</button><button type="button" data-sand-action="reset">⟳ Reset</button><button type="button" data-sand-action="clear">⌫ Clear</button><button type="button" data-sand-action="save">↓ Save PNG</button>
        </div>
        <div class="sand-demo__controls">
          <label>Material / tool<select data-sand-attribute="ui-tool"><option value="sand">Sand</option><option value="water">Water</option><option value="stone">Stone</option><option value="fire">Fire</option><option value="smoke">Smoke</option><option value="lava">Lava</option><option value="wood">Wood (burnable)</option><option value="wall">Wall</option><option value="eraser">Eraser</option><option value="brush">Push brush</option><option value="attract">Attract</option><option value="explode">Explosion</option></select></label>
          <label>Gravity<select data-sand-attribute="ui-gravity"><option value="down">↓ Down</option><option value="left">← Left</option><option value="up">↑ Up</option><option value="right">→ Right</option></select></label>
          <label>Obstacle preset<select data-sand-attribute="ui-preset"><option value="funnel">Funnel</option><option value="hourglass">Hourglass</option><option value="maze">Maze</option><option value="chute">Chute</option><option value="none">Empty box</option></select></label>
          <label>Background<select data-sand-attribute="ui-background"><option value="dark">Dark</option><option value="light">Light</option><option value="transparent">Transparent</option></select></label>
          <label>Brush size <output>5</output><input type="range" min="1" max="22" value="5" data-sand-attribute="ui-brush-size"></label>
          <label>Amount <output>0.68</output><input type="range" min="0.1" max="1" step="0.05" value="0.68" data-sand-attribute="ui-amount"></label>
          <label>Simulation speed <output>1</output><input type="range" min="0.2" max="3" step="0.1" value="1" data-sand-attribute="ui-speed"></label>
          <label>Gravity strength <output>1</output><input type="range" min="0.2" max="3" step="0.1" value="1" data-sand-attribute="ui-gravity-strength"></label>
          <label>Top feed / second <output>180</output><input type="range" min="0" max="600" step="20" value="180" data-sand-attribute="ui-auto-rate"></label>
          <label>Sand color <input type="color" value="#eebd77" data-sand-attribute="ui-color"></label>
          <label>Particle size<select data-sand-attribute="ui-cell-size"><option value="3">Fine</option><option value="4" selected>Normal</option><option value="6">Coarse</option></select></label>
        </div>
        <p class="sand-demo__hint">Try: paint a wood wall, pour lava, then add water. Draw across the box to test collision; choose Explosion and click a pile to disturb it.</p>
      </section>`;
    case 'ui-image-solid': {
      const photos = ['architecture','coast','botanical','coast','architecture','botanical','architecture','botanical','coast','architecture'];
      const captions = ['A new angle','Blue hour','Soft forms','Wide horizon','Urban light','Botanical study','Still motion','Open space','Tidal lines','Afterglow'];
      return `<section class="image-solid-demo">
        <div class="image-solid-demo__heading"><span class="eyebrow">DIMENSION STUDY / 001</span><h2>Every side tells <em>a story.</em></h2><p>Drag in any direction to see the images wrap around a true 3D form. Change its geometry, then upload your own photo to a face.</p></div>
        <div class="image-solid-demo__stage"><ui-image-solid ui-shape="cube" ui-size="230" ui-height="260" ui-auto-rotate ui-spin-speed="13" aria-label="Rotatable photo sculpture">
          ${photos.map((photo,index) => `<ui-image-solid-face><img src="/images/${photo}.jpg" alt="${captions[index]}" draggable="false" /><span class="image-solid-demo__face-caption"><small>FORM / ${String(index+1).padStart(2,'0')}</small><strong>${captions[index]}</strong></span></ui-image-solid-face>`).join('')}
        </ui-image-solid><div class="image-solid-demo__scene-label"><span data-solid-shape>CUBE / 06 FACES</span><span>DRAG TO ROTATE ↗</span></div></div>
        <div class="image-solid-demo__controls">
          <label>Shape<select data-solid-setting="ui-shape"><option value="cube">Cube · 6 faces</option><option value="box">Rectangular box · 6 faces</option><option value="triangle">Triangular prism · 5 faces</option><option value="hexagon">Hexagonal prism · 8 faces</option><option value="octagon">Octagonal prism · 10 faces</option></select></label>
          <label>Rotation speed <output>13°/s</output><input data-solid-setting="ui-spin-speed" type="range" min="-60" max="60" step="1" value="13"></label>
          <label>Face to replace<select data-solid-face>${Array.from({length:10},(_,index)=>`<option value="${index}">Photo ${String(index+1).padStart(2,'0')}</option>`).join('')}</select></label>
          <label class="image-solid-demo__upload">↑ Upload photo<input data-solid-upload type="file" accept="image/*"></label>
          <button type="button" data-solid-action="spin">Ⅱ Pause rotation</button><button type="button" data-solid-action="reset">⟳ Reset view</button>
        </div>
        <p class="image-solid-demo__hint">Arrow keys rotate by 15°. Hold Shift for 30°. Press Home to return to the opening angle.</p>
      </section>`;
    }
    case 'ui-image-stack': {
      const compact = variant === 'Compact stack';
      const fan = variant === 'Fanned prints';
      const fall = variant === 'Falling frames';
      const sheet = variant === 'Contact sheet';
      const coverflow = variant === 'Coverflow rail';
      const palette = variant === 'Palette reveal';
      const corner = variant === 'Corner reveal';
      const photos = compact ? ['botanical','coast','architecture'] : fan ? ['coast','botanical','architecture','coast','botanical'] : fall ? ['botanical','architecture','coast','botanical','architecture'] : sheet ? ['architecture','coast','botanical','coast','architecture','botanical'] : palette ? ['botanical','coast','architecture','botanical'] : corner ? ['architecture','botanical','coast'] : ['architecture','coast','botanical','architecture','coast'];
      const titles = compact ? ['Quiet growth','Coastal light','Structures'] : fan ? ['Salt air','Morning garden','Concrete poetry','Blue distance','Slow afternoon'] : fall ? ['Chapter one','A softer line','The open sea','Green interlude','After the rain'] : sheet ? ['First light','Open water','Greenhouse','Blue afternoon','Geometry','Soft leaves'] : coverflow ? ['Modern lines','Salt and sky','Wild growth','Still forms','A blue ending'] : palette ? ['Golden foliage','Sunlit coast','Warm geometry','Red garden'] : corner ? ['City corner','Garden center','Coastal edge'] : ['The architecture of light','Where the sky meets water','A study in green','Lines of the city','The last blue hour'];
      const heading = compact ? 'Small stack. Big story.' : fan ? 'A handful of moments.' : fall ? 'Let the frames fall.' : sheet ? 'From pile to contact sheet.' : coverflow ? 'A gallery in perspective.' : palette ? 'Four photos. One frame.' : corner ? 'Three views, one frame.' : 'A story in every layer.';
      const kicker = compact ? 'STUDY / 02' : fan ? 'PAPER STUDY / 03' : fall ? 'MOTION STUDY / 04' : sheet ? 'CONTACT SHEET / 05' : coverflow ? 'PERSPECTIVE / 06' : palette ? 'PALETTE STUDY / 07' : corner ? 'CORNER STUDY / 08' : 'THE COLLECTION / 01';
      const style = fan ? 'fan' : fall ? 'fall' : sheet ? 'sheet' : coverflow ? 'coverflow' : palette ? 'palette' : corner ? 'corner' : '';
      const description = fan ? 'Five photographs open like prints in your hand. Hover to fan them wide, then choose any card to see it in full.' : fall ? 'Each frame drops into its own position, revealing a small gallery underneath. Choose a frame to explore it.' : sheet ? 'A pile of prints assembles into a six-photo contact sheet. Each thumbnail opens its own full-size view.' : coverflow ? 'Five frames glide into a wide perspective rail. Follow the row and select any photo to open the viewer.' : palette ? 'Four photographs meet at the center. Hover or focus a photo to bring it into full view, then select it to open the viewer.' : corner ? 'Three photographs share a diagonal frame. Hover a corner or the center to expand it, then move to an exposed edge to switch directly.' : 'Move over the stack to separate the photographs. Select any exposed edge to open that image; use the arrows to browse the collection.';
      return `<section class="image-stack-demo${compact ? ' image-stack-demo--compact' : ''}${style ? ` image-stack-demo--${style}` : ''}">
        <div class="image-stack-demo__copy"><span class="eyebrow">${kicker}</span><h2>${heading}</h2><p>${description}</p><div class="image-stack-demo__rule"><span>01 — ${String(photos.length).padStart(2,'0')}</span><span>HOVER · SELECT · EXPLORE</span></div></div>
        <div class="image-stack-demo__scene"><div class="image-stack-demo__halo"></div>${palette ? '<div class="image-stack-demo__palette-card">' : ''}<ui-image-stack ${style ? `ui-style="${style}"` : ''} ${palette ? 'ui-badge="04"' : ''} aria-label="${variant} photo collection" style="--ui-image-stack-width:${compact ? '260px' : fan ? '280px' : fall ? '290px' : sheet ? '390px' : coverflow ? '680px' : corner ? '300px' : '320px'};--ui-image-stack-height:${compact ? '330px' : fan ? '360px' : fall ? '330px' : sheet ? '380px' : coverflow ? '340px' : palette ? '320px' : corner ? '430px' : '390px'};--ui-image-stack-step:${compact ? '21px' : '17px'};--ui-image-stack-offset:${compact ? '29px' : '26px'}">
          ${photos.map((photo,index) => `<ui-image-stack-item ui-label="${titles[index]}"><img src="/images/${photo}.jpg" alt="${titles[index]}" draggable="false"><span data-stack-caption>${String(index+1).padStart(2,'0')} / ${titles[index]}</span></ui-image-stack-item>`).join('')}
        </ui-image-stack>${palette ? '<div class="image-stack-demo__palette-footer"><span>◇ &nbsp; 4 photographs</span><span>•••</span></div></div>' : ''}<span class="image-stack-demo__scene-note">${palette ? 'HOVER A PHOTO ↗' : corner ? 'HOVER A CORNER ↗' : 'CLICK A LAYER ↗'}</span></div>
      </section>`;
    }
    case 'ui-flip-book': {
      const notes = [
        { title:'The quiet coast', place:'CHAPTER 01 · COAST', image:'coast', text:'A horizon that makes every hurried thought feel a little smaller.' },
        { title:'The green hour', place:'CHAPTER 02 · GARDEN', image:'botanical', text:'Some places ask us to slow down and notice the light.' },
        { title:'Lines of a city', place:'CHAPTER 03 · FORM', image:'architecture', text:'The spaces between buildings become stories of their own.' },
      ];
      return `<section class="flip-book-demo">
        <div class="flip-book-demo__intro"><span class="eyebrow">AN INTERACTIVE JOURNAL / 01</span><h2>Stories you can <em>turn.</em></h2><p>Open the cover, then turn each leaf to discover a small collection of places and thoughts. Every page has two sides, like a real book.</p><div class="flip-book-demo__controls"><button type="button" data-book-action="toggle">Open the book</button><button type="button" data-book-action="previous" aria-label="Previous page">←</button><span data-book-counter>Closed · 4 spreads</span><button type="button" data-book-action="next" aria-label="Next page">→</button></div><p class="flip-book-demo__hint">Click or swipe the cover. Drag left/right to turn pages; keyboard: ← / →, Home, End.</p></div>
        <div class="flip-book-demo__stage"><div class="flip-book-demo__glow"></div><ui-flip-book aria-label="Atlas of Elsewhere travel journal">
          <div class="flip-book-demo__last-page" data-book-last-page><span>THE END</span><small>Every ending opens<br>another journey.</small></div>
          <ui-flip-book-cover><div class="flip-book-demo__cover"><span class="flip-book-demo__cover-kicker">THE TRAVEL EDITION · Nº 01</span><strong>Atlas<br>of<br><i>Elsewhere</i></strong><span class="flip-book-demo__cover-foot">OPEN TO EXPLORE <span>↗</span></span></div><div data-cover-back class="flip-book-demo__inside-cover"><span>ATLAS<br>OF<br>ELSEWHERE</span><small>A COLLECTION OF MOMENTS<br>VOL. 01 / 2026</small></div></ui-flip-book-cover>
          ${notes.map((note,index) => `<ui-flip-book-page><div data-page-front class="flip-book-demo__page flip-book-demo__page--photo"><img src="/images/${note.image}.jpg" alt="${note.title}"><span>${note.place}</span></div><div data-page-back class="flip-book-demo__page flip-book-demo__page--note"><small>FIELD NOTE / ${String(index+1).padStart(2,'0')}</small><strong>${note.title}</strong><p>${note.text}</p><span class="flip-book-demo__page-number">${String(index*2+2).padStart(2,'0')}</span></div></ui-flip-book-page>`).join('')}
        </ui-flip-book><div class="flip-book-demo__stage-caption"><span>THE ART OF SLOW EXPLORATION</span><span>TURN THE PAGE ↗</span></div></div>
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
  root.querySelectorAll<HTMLTextAreaElement>('[data-dot-morph-input]').forEach((input) => {
    input.addEventListener('input', () => {
      const morph = input.closest('.dot-morph-demo')?.querySelector('ui-dot-morph');
      if (!morph) return;
      const words = input.value.split(/\r?\n/).map((word) => word.trim()).filter(Boolean);
      morph.setAttribute('ui-text', JSON.stringify(words.length ? words : ['UI']));
    });
  });
}

function wireLogoAssemblyDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.logo-assembly-demo').forEach((demo) => {
    const logo = demo.querySelector('ui-logo-assembly') as HTMLElement & {
      readonly particleCount: number;
      readonly state: string;
      assemble(): void;
      explode(): void;
      scatter(): void;
      setLogo(src: string): Promise<void>;
      loadFile(file: File): Promise<void>;
    } | null;
    if (!logo) return;
    const status = demo.querySelector<HTMLElement>('[data-logo-status]');
    const count = demo.querySelector<HTMLElement>('[data-logo-count]');
    const update = (): void => {
      if (status) status.textContent = logo.hasAttribute('ui-error') ? 'COULD NOT READ LOGO' : `${logo.state.toUpperCase()} / PARTICLE FIELD`;
      if (count) count.textContent = `${logo.particleCount.toLocaleString()} PARTICLES`;
    };
    ['ui:logo-assembly:ready', 'ui:logo-assembly:assemble', 'ui:logo-assembly:assembled', 'ui:logo-assembly:scatter', 'ui:logo-assembly:explode', 'ui:logo-assembly:error'].forEach((name) => logo.addEventListener(name, update));
    demo.querySelectorAll<HTMLButtonElement>('[data-logo-action]').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset['logoAction'];
      if (action === 'explode') logo.explode();
      else if (action === 'scatter') logo.scatter();
      else if (action === 'assemble') logo.assemble();
      else if (action === 'switch') {
        const next = logo.getAttribute('ui-src')?.includes('assembly-nova') ? 'prism' : 'nova';
        void logo.setLogo(`/images/assembly-${next}.svg`).catch(update);
      }
      update();
    }));
    demo.querySelector<HTMLInputElement>('[data-logo-upload]')?.addEventListener('change', (event) => {
      const file = (event.currentTarget as HTMLInputElement).files?.[0];
      if (file) void logo.loadFile(file).then(update, update);
    });
    demo.querySelectorAll<HTMLInputElement>('[data-logo-setting]').forEach((input) => input.addEventListener('input', () => {
      const attribute = input.dataset['logoSetting'];
      if (attribute && attribute !== 'ui-count') logo.setAttribute(attribute, input.value);
      const output = input.parentElement?.querySelector('output');
      if (output) output.textContent = input.value;
      update();
    }));
    demo.querySelector<HTMLInputElement>('[data-logo-setting="ui-count"]')?.addEventListener('change', (event) => {
      logo.setAttribute('ui-count', (event.currentTarget as HTMLInputElement).value);
    });
    demo.querySelector<HTMLSelectElement>('[data-logo-interaction]')?.addEventListener('change', (event) => {
      logo.setAttribute('ui-interaction', (event.currentTarget as HTMLSelectElement).value);
    });
    demo.querySelector<HTMLInputElement>('[data-logo-color]')?.addEventListener('input', (event) => {
      logo.setAttribute('ui-color', (event.currentTarget as HTMLInputElement).value);
    });
    demo.querySelector<HTMLButtonElement>('[data-logo-original-color]')?.addEventListener('click', () => {
      logo.removeAttribute('ui-color');
    });
    update();
  });
}

function wireSandPhysicsDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.sand-demo').forEach((demo) => {
    const sand = demo.querySelector('ui-sand-physics') as HTMLElement & {
      readonly particleCount: number;
      readonly isPaused: boolean;
      togglePause(): void;
      undo(): boolean;
      reset(): void;
      clear(): void;
      saveImage(): string;
    } | null;
    if (!sand) return;
    const update = (): void => {
      const count = demo.querySelector('[data-sand-count]');
      const status = demo.querySelector('[data-sand-status]');
      if (count) count.textContent = `${sand.particleCount.toLocaleString()} PARTICLES`;
      if (status) status.textContent = sand.isPaused ? 'PAUSED' : 'SIMULATING';
      const pause = demo.querySelector<HTMLButtonElement>('[data-sand-action="pause"]');
      if (pause) pause.textContent = sand.isPaused ? '▶ Resume' : 'Ⅱ Pause';
    };
    sand.addEventListener('ui:sand-physics:change', update);
    demo.querySelectorAll<HTMLButtonElement>('[data-sand-action]').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset['sandAction'];
      if (action === 'pause') sand.togglePause();
      else if (action === 'undo') sand.undo();
      else if (action === 'reset') sand.reset();
      else if (action === 'clear') sand.clear();
      else if (action === 'save') {
        const link = document.createElement('a');
        link.href = sand.saveImage();
        link.download = 'sand-physics.png';
        link.click();
      }
      update();
    }));
    demo.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-sand-attribute]').forEach((input) => {
      const eventName = input.type === 'range' && input.dataset['sandAttribute'] !== 'ui-cell-size' ? 'input' : 'change';
      input.addEventListener(eventName, () => {
        const attribute = input.dataset['sandAttribute'];
        if (attribute) sand.setAttribute(attribute, input.value);
        const output = input.parentElement?.querySelector('output');
        if (output) output.textContent = input.value;
        update();
      });
    });
    update();
  });
}

function wireImageSolidDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.image-solid-demo').forEach((demo) => {
    const solid = demo.querySelector('ui-image-solid') as HTMLElement & { refresh(): void; reset(): void } | null;
    if (!solid) return;
    const label = demo.querySelector<HTMLElement>('[data-solid-shape]');
    const update = (): void => {
      const shape = solid.getAttribute('ui-shape') || 'cube';
      const count = shape === 'triangle' ? 5 : shape === 'hexagon' ? 8 : shape === 'octagon' ? 10 : 6;
      if (label) label.textContent = `${shape.toUpperCase()} / ${String(count).padStart(2,'0')} FACES`;
      const faceSelect = demo.querySelector<HTMLSelectElement>('[data-solid-face]');
      if (faceSelect) {
        for (const option of faceSelect.options) option.disabled = Number(option.value) >= count;
        if (Number(faceSelect.value) >= count) faceSelect.value = '0';
      }
      const spin = demo.querySelector<HTMLButtonElement>('[data-solid-action="spin"]');
      if (spin) spin.textContent = solid.hasAttribute('ui-auto-rotate') ? 'Ⅱ Pause rotation' : '▶ Auto rotate';
    };
    demo.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-solid-setting]').forEach((input) => {
      input.addEventListener(input.type === 'range' ? 'input' : 'change', () => {
        const name = input.dataset['solidSetting'];
        if (name) solid.setAttribute(name,input.value);
        const output = input.parentElement?.querySelector('output');
        if (output) output.textContent = `${input.value}°/s`;
        update();
      });
    });
    demo.querySelectorAll<HTMLButtonElement>('[data-solid-action]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset['solidAction'] === 'spin') solid.toggleAttribute('ui-auto-rotate');
      else solid.reset();
      update();
    }));
    demo.querySelector<HTMLInputElement>('[data-solid-upload]')?.addEventListener('change',(event) => {
      const input = event.currentTarget as HTMLInputElement;
      const file = input.files?.[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const index = Number(demo.querySelector<HTMLSelectElement>('[data-solid-face]')?.value || '0');
        const face = solid.querySelectorAll<HTMLElement>('ui-image-solid-face:not([data-ui-generated])')[index];
        const image = face?.querySelector('img');
        if (image && typeof reader.result === 'string') {
          image.src = reader.result;
          image.alt = file.name;
          face?.querySelector<HTMLElement>('.image-solid-demo__face-caption strong')?.replaceChildren(file.name.replace(/\.[^.]+$/,'').slice(0,25));
          solid.refresh();
        }
        input.value = '';
      };
      reader.readAsDataURL(file);
    });
    update();
  });
}

function wireFlipBookDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.flip-book-demo').forEach((demo) => {
    const book = demo.querySelector('ui-flip-book') as HTMLElement & { open(): void; close(): void; next(): void; previous(): void; page: number; pages: HTMLElement[]; openState: boolean } | null;
    if (!book) return;
    const counter = demo.querySelector<HTMLElement>('[data-book-counter]');
    const toggle = demo.querySelector<HTMLButtonElement>('[data-book-action="toggle"]');
    const update = (): void => {
      if (counter) counter.textContent = book.openState ? `Spread ${book.page + 1} / ${book.pages.length + 1}` : `Closed · ${book.pages.length + 1} spreads`;
      if (toggle) toggle.textContent = book.openState ? 'Close the book' : 'Open the book';
    };
    demo.querySelectorAll<HTMLButtonElement>('[data-book-action]').forEach((button) => button.addEventListener('click', () => {
      const action = button.dataset['bookAction'];
      if (action === 'toggle') { if (book.openState) book.close(); else book.open(); }
      else if (action === 'next') book.next();
      else if (action === 'previous') book.previous();
      update();
    }));
    for (const eventName of ['ui:flip-book:open','ui:flip-book:close','ui:flip-book:change']) book.addEventListener(eventName, update);
    update();
  });
}

function wireFakeCursorDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('ui-fake-cursor').forEach((stage) => {
    stage.querySelector<HTMLButtonElement>('[data-cursor-target]')?.addEventListener('click', () => {
      const status = stage.querySelector<HTMLElement>('[data-fake-cursor-status]');
      const count = Number(stage.getAttribute('data-click-count') || 0) + 1;
      stage.setAttribute('data-click-count', String(count));
      if (status) status.textContent = stage.hasAttribute('ui-activate')
        ? `Published ${count} ${count === 1 ? 'time' : 'times'} by the guided cursor.`
        : `Project created ${count} ${count === 1 ? 'time' : 'times'} by you.`;
    });
  });
}

function wireTextSpotlightDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('ui-text-spotlight').forEach((card) => {
    card.querySelector<HTMLButtonElement>('.ui-text-spotlight__base [data-spotlight-action]')?.addEventListener('click', () => {
      const hint = card.parentElement?.querySelector<HTMLElement>('.text-spotlight-demo__hint');
      if (hint) hint.textContent = 'DISCOVERED · THE ACTION STILL WORKS';
    });
  });
}

function wireBackgroundDemo(root: HTMLElement): void {
  const palettes: Record<string, string[]> = {
    warm: ['#ffffff', '#ffe46d', '#e6ad69'],
    ice: ['#d6f5ff', '#8ae6ee', '#ffffff'],
    neon: ['#f5a6ff', '#8b7cff', '#74f8c4'],
    mono: ['#ffffff'],
  };
  root.querySelectorAll<HTMLElement>('.background-demo').forEach((demo) => {
    const background = demo.querySelector<UiAnimatedBackground>('ui-animated-background');
    if (!background) return;
    const message = demo.querySelector<HTMLElement>('[data-background-message]');
    const report = (value: string): void => { if (message) message.textContent = value; };
    demo.querySelectorAll<HTMLInputElement>('[data-background-attr]').forEach((input) => {
      const attribute = input.dataset['backgroundAttr']!;
      const output = input.parentElement?.querySelector<HTMLOutputElement>('output');
      const update = (): void => { if (output) output.value = `${input.value}${input.dataset['unit'] || ''}`; };
      input.addEventListener('input', () => {
        update();
        if (attribute !== 'ui-particle-count' && attribute !== 'ui-font-size') background.setAttribute(attribute, input.value);
      });
      input.addEventListener('change', () => background.setAttribute(attribute, input.value));
    });
    demo.querySelector<HTMLSelectElement>('[data-background-palette]')?.addEventListener('change', (event) => {
      const palette = palettes[(event.target as HTMLSelectElement).value] ?? palettes['warm']!;
      background.colors = palette;
    });
    const shapeSelect = demo.querySelector<HTMLSelectElement>('[data-background-shape]');
    shapeSelect?.addEventListener('change', () => {
      if (shapeSelect.value === 'custom') {
        const editor = demo.querySelector<HTMLDetailsElement>('.background-demo__custom');
        if (editor) editor.open = true;
        report('Edit the SVG paths and press Apply.');
        return;
      }
      const paths = shapeSelect.value === 'all' ? BACKGROUND_PATHS : [BACKGROUND_PATHS[Number(shapeSelect.value)]!];
      background.setAttribute('ui-view-box', '0 0 100 100');
      background.svgPaths = paths;
      report(paths.length === 1 ? 'Showing one shape.' : 'Morphing through three shapes.');
    });
    demo.querySelectorAll<HTMLButtonElement>('[data-background-apply]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset['backgroundApply'] === 'words') {
        const words = [...demo.querySelectorAll<HTMLInputElement>('[data-background-word]')].map((input) => input.value.trim()).filter(Boolean);
        if (!words.length) { report('Enter at least one word.'); return; }
        background.texts = words;
        report(`${words.length} ${words.length === 1 ? 'word' : 'words'} applied.`);
        return;
      }
      const raw = demo.querySelector<HTMLTextAreaElement>('[data-background-paths]')?.value ?? '';
      const viewBox = demo.querySelector<HTMLInputElement>('[data-background-viewbox]')?.value.trim() ?? '';
      try {
        const paths: unknown = JSON.parse(raw);
        if (!Array.isArray(paths) || !paths.length || !paths.every((path) => typeof path === 'string' && /^\s*[Mm]/.test(path))) throw new Error('invalid paths');
        const bounds = viewBox.split(/[\s,]+/).map(Number);
        if (bounds.length !== 4 || !bounds.every(Number.isFinite) || bounds[2]! <= 0 || bounds[3]! <= 0) {
          report('Enter a viewBox as x y width height, with positive width and height.');
          return;
        }
        background.setAttribute('ui-view-box', viewBox);
        background.svgPaths = paths;
        if (shapeSelect) shapeSelect.value = 'custom';
        report(background.hasShapes
          ? `${paths.length} ${paths.length === 1 ? 'path' : 'paths'} applied.`
          : 'No filled pixels found. Check the path and viewBox.');
      } catch { report('Enter a JSON array of SVG path strings.'); }
    }));
    demo.querySelector<HTMLButtonElement>('[data-background-replay]')?.addEventListener('click', () => {
      background.refresh();
      report('Entrance animation restarted.');
    });
  });
}

function wireImageTraceDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-trace-replay]').forEach((button) => {
    button.addEventListener('click', () => {
      const trace = button.closest('.image-trace-demo')?.querySelector('ui-image-trace') as HTMLElement & { replay(): void } | null;
      trace?.replay();
    });
  });
  root.querySelectorAll<HTMLInputElement>('[data-trace-upload]').forEach((input) => {
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      const trace = input.closest('.image-trace-demo')?.querySelector('ui-image-trace') as HTMLElement & { refresh(): void } | null;
      const image = trace?.querySelector('img');
      if (!file || !trace || !image) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string' || !trace.isConnected) return;
        image.src = reader.result;
        image.alt = file.name;
        image.removeAttribute('width');
        image.removeAttribute('height');
        trace.refresh();
      };
      reader.readAsDataURL(file);
    });
  });
}

function wireImageFlashlightDemo(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.image-flashlight-demo').forEach((demo) => {
    const flashlight = demo.querySelector('ui-image-flashlight') as HTMLElement & { replay(): void; refresh(): void } | null;
    const status = demo.querySelector<HTMLElement>('[data-flashlight-status]');
    if (!flashlight) return;
    flashlight.addEventListener('ui-image-flashlight:start', () => { if (status) status.textContent = 'LIGHT SCAN ACTIVE'; });
    flashlight.addEventListener('ui-image-flashlight:complete', () => { if (status) status.textContent = 'FULLY ILLUMINATED'; });
    demo.querySelector<HTMLButtonElement>('[data-flashlight-replay]')?.addEventListener('click', () => flashlight.replay());
    demo.querySelector<HTMLInputElement>('[data-flashlight-upload]')?.addEventListener('change', (event) => {
      const input = event.currentTarget as HTMLInputElement;
      const file = input.files?.[0];
      const image = flashlight.querySelector<HTMLImageElement>('img:not(.ui-image-flashlight__reveal)');
      if (!file || !image) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (file !== input.files?.[0] || typeof reader.result !== 'string' || !flashlight.isConnected) return;
        image.src = reader.result;
        image.alt = file.name;
        image.removeAttribute('width');
        image.removeAttribute('height');
        flashlight.refresh();
      };
      reader.readAsDataURL(file);
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

/**
 * Gallery SPA entry. Hash-based routing.
 */

import '@ui/components';
import { EFFECTS } from '@ui/motion';
import './styles.css';
import { COMPONENTS, type ComponentEntry } from './components.js';
import { getDocForSlug } from './docs-data.js';

const appRoot = document.getElementById('app')!;
const storedTheme = localStorage.getItem('ui-theme');
document.documentElement.dataset.theme = storedTheme === 'dark' ||
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
        const matches = (card.dataset.search ?? '').includes(term);
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
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('ui-theme', next);
    updateThemeButton();
  });
  updateThemeButton();

}

function updateThemeButton(): void {
  const button = document.getElementById('gallery-theme');
  if (!button) return;
  const dark = document.documentElement.dataset.theme === 'dark';
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
    'ui-animate': '✦', 'ui-parallax': '▧', 'ui-reveal': '◌', 'ui-stagger': '≋', 'ui-toggle': '◉',
    'ui-collapse': '⌄', 'ui-accordion': '☷', 'ui-tabs': '▤', 'ui-modal': '▣',
    'ui-drawer': '◧', 'ui-popover': '▢', 'ui-lazyload': '◐', 'ui-image-zoom': '⌕',
    'ui-image-comparison': '◒', 'ui-counter': '99', 'ui-dark-mode': '☼',
    'ui-marquee': '→', 'ui-carousel': '◫',
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
}

function renderDemoBody(tag: string, variant: string): string {
  // Every demo returns a card with the running component + sample content.
  switch (tag) {
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
        <p class="demo-text">Scroll through the section. Progress runs from when the container touches the viewport bottom to when it exits the top.</p>
        <ui-parallax class="parallax-scroll-demo">
          <div class="parallax-sticky">
            <ui-parallax-scroll ui-keyframes="{'0%': {y: 80, scale: .6, opacity: .4}, '33.33%': {y: 0, scale: 1, opacity: 1}, '100%': {y: -160, scale: 2.5, opacity: 0}}" ui-breakpoints="{600: {'0%': {y: 40, scale: .6, opacity: .4}, '33.33%': {y: 0, scale: 1, opacity: 1}, '100%': {y: -80, scale: 1.5, opacity: 0}}}">
              <span class="parallax-word">SCROLL</span>
            </ui-parallax-scroll>
          </div>
        </ui-parallax>`;
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
    case 'ui-reveal':
      return `
        <p class="demo-text">Single-shot fade. Use when you don't need a full effect.</p>
        <div class="grid-3">
          ${[0, 100, 200, 300, 400, 500].map((d) => `
            <ui-reveal delay="${d}">
              <div class="demo-card">delay ${d}ms</div>
            </ui-reveal>`).join('')}
        </div>
      `;
    case 'ui-stagger':
      return `
        <p class="demo-text">Children reveal in sequence when the wrapper enters the viewport.</p>
        <ui-stagger>
          ${[1, 2, 3, 4, 5, 6].map((i) => `
            <div style="background:var(--gallery-panel);padding:0.75rem;border:1px solid var(--ui-color-border);border-radius:6px;margin:0.25rem 0">Item ${i}</div>
          `).join('')}
        </ui-stagger>
      `;
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
    case 'ui-modal':
      return `
        <p class="demo-text">Click the button to open. Escape or click the overlay to dismiss.</p>
        <button id="open-modal" class="btn primary">Open modal</button>
        <ui-modal>
          <div data-modal-overlay></div>
          <div data-modal-dialog>
            <h3>Subscribe</h3>
            <p>Get notified when new components ship. We don't spam.</p>
            <form style="display:flex;gap:0.5rem;margin-top:1rem">
              <input type="email" placeholder="you@example.com" style="flex:1;padding:0.5rem;border:1px solid #ddd;border-radius:6px">
              <button type="button" data-modal-close class="btn primary">Subscribe</button>
            </form>
            <button data-modal-close style="margin-top:0.5rem;background:none;border:none;color:#666">No thanks</button>
          </div>
        </ui-modal>
      `;
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
    case 'ui-image-zoom':
      return `
        <p class="demo-text">Click any image to zoom.</p>
        <div class="grid-3">
          ${[1, 2, 3, 4, 5, 6].map((i) => `
            <ui-image-zoom>
              <img src="https://picsum.photos/seed/z${i}/600/400"
                   style="width:100%;border-radius:8px;cursor:zoom-in"
                   loading="lazy">
            </ui-image-zoom>
          `).join('')}
        </div>
      `;
    case 'ui-image-comparison':
      return `
        <p class="demo-text">Drag to compare. Use ←/→ to move by 5%.</p>
        <div class="grid-2">
          ${[
            { a: 'before-1', b: 'after-1' },
            { a: 'before-2', b: 'after-2' },
          ].map((p, i) => `
            <div>
              <ui-image-comparison value="50" style="width:100%;height:240px">
                <img src="https://picsum.photos/seed/${p.a}/600/300" loading="lazy" style="position:absolute;width:100%;height:100%;object-fit:cover">
                <img src="https://picsum.photos/seed/${p.b}/600/300?grayscale" loading="lazy" style="position:absolute;width:100%;height:100%;object-fit:cover;clip-path:inset(0 0 0 50%)">
              </ui-image-comparison>
            </div>
          `).join('')}
        </div>
      `;
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
  root.querySelectorAll<HTMLElement>('.parallax-custom-demo').forEach((element) => {
    const scroll = element as HTMLElement & { customEffects(callback: (params: { element: HTMLElement; createValue: (key: string) => string | number; EMPTY: string }) => void): void };
    scroll.customEffects(({ element: target, createValue, EMPTY }) => {
      const value = createValue('opacityCustom');
      if (value !== EMPTY) target.style.opacity = String(value);
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
        document.querySelector('ui-modal')?.openModal();
      }
      // Drawer open
      if (t.id === 'open-left') {
        document.getElementById('drawer-left')?.openDrawer();
      }
      if (t.id === 'open-right') {
        document.getElementById('drawer-right')?.openDrawer();
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

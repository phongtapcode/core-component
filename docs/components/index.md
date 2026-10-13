# Components

All components share a predictable API — attributes are `kebab-case`, events are `ui-<name>-<event>`, and CSS variables are `--ui-<name>-<prop>`.

<style>
.comp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.comp-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem 1.25rem 1rem;
  background: var(--vp-c-bg-soft);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.comp-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.comp-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.comp-card h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  border: none;
  padding: 0;
}

.comp-badge {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.comp-badge.motion   { background: #ede9fe; color: #6d28d9; }
.comp-badge.basic    { background: #dbeafe; color: #1d4ed8; }
.comp-badge.media    { background: #dcfce7; color: #15803d; }
.comp-badge.utility  { background: #fef9c3; color: #a16207; }
.comp-badge.advanced { background: #ffe4e6; color: #be123c; }

.dark .comp-badge.motion   { background: #3b0764; color: #c4b5fd; }
.dark .comp-badge.basic    { background: #1e3a5f; color: #93c5fd; }
.dark .comp-badge.media    { background: #14532d; color: #86efac; }
.dark .comp-badge.utility  { background: #713f12; color: #fde047; }
.dark .comp-badge.advanced { background: #4c0519; color: #fda4af; }

.comp-tag {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

.comp-desc {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  flex: 1;
  margin: 0;
}

.comp-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.comp-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  text-decoration: none !important;
  transition: background 0.15s, color 0.15s;
  border: 1px solid transparent;
}

.comp-btn.docs {
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
  color: var(--vp-c-text-1) !important;
}

.comp-btn.docs:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1) !important;
}

.comp-btn.demo {
  background: var(--vp-c-brand-1);
  color: #fff !important;
}

.comp-btn.demo:hover {
  background: var(--vp-c-brand-2);
}

.comp-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  margin: 2rem 0 0.5rem;
}
</style>

## Motion

<p class="comp-section-title">Animation & reveal components</p>

<div class="comp-grid">

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Cursor</h3>
    <span class="comp-badge motion">Motion</span>
  </div>
  <p class="comp-tag">&lt;ui-cursor&gt;</p>
  <p class="comp-desc">Pointer-following item with smoothing, split regions and distortion presets.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/cursor">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-cursor" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Typing</h3>
    <span class="comp-badge motion">Motion</span>
  </div>
  <p class="comp-tag">&lt;ui-typing&gt;</p>
  <p class="comp-desc">Rotate short hero phrases with typewriter, slide, or SVG goo effects.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/typing">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-typing" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Scroll Y</h3>
    <span class="comp-badge motion">Motion</span>
  </div>
  <p class="comp-tag">&lt;ui-scroll-y&gt;</p>
  <p class="comp-desc">Full-screen panels slide upward with inertia; supports nested parallax effects.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/scroll-y">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-scroll-y" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Scroll Scene</h3>
    <span class="comp-badge motion">Motion</span>
  </div>
  <p class="comp-tag">&lt;ui-scroll-scene&gt;</p>
  <p class="comp-desc">Switch sticky storytelling scenes at configurable scroll thresholds.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/scroll-scene">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-scroll-scene" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Scroll X</h3>
    <span class="comp-badge motion">Motion</span>
  </div>
  <p class="comp-tag">&lt;ui-scroll-x&gt;</p>
  <p class="comp-desc">Full-screen story panels reveal horizontally as the page scrolls vertically.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/scroll-x">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-scroll-x" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Parallax</h3>
    <span class="comp-badge motion">Motion</span>
  </div>
  <p class="comp-tag">&lt;ui-parallax&gt;</p>
  <p class="comp-desc">Interpolate scroll keyframes and add pointer movement or 3D tilt inside a measured container.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/parallax">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-parallax" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Animate</h3>
    <span class="comp-badge motion">Motion</span>
  </div>
  <p class="comp-tag">&lt;ui-animate&gt;</p>
  <p class="comp-desc">Reveal content on viewport entry. 15 built-in effects: fade, slide, zoom, blur, rotate.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/animate">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-animate" target="_blank">▶ Demo</a>
  </div>
</div>

</div>

## Basic UI

<p class="comp-section-title">Interactive UI primitives</p>

<div class="comp-grid">

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Toggle</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-toggle&gt; / &lt;ui-toggle-trigger&gt;</p>
  <p class="comp-desc">Simple show/hide disclosure with trigger, outside click to close, portal floating, and autofocus.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/toggle">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-toggle" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Collapse</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-collapse&gt;</p>
  <p class="comp-desc">Animated show / hide with smooth CSS grid-row transition. Zero JS animation loops.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/collapse">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-collapse" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Accordion</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-accordion&gt;</p>
  <p class="comp-desc">Multiple collapsible sections. Single-open mode by default, fully composable.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/collapse#accordion">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-accordion" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Tabs</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-tabs&gt;</p>
  <p class="comp-desc">ARIA-compliant tabbed interface. Arrow key navigation, Home / End support.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/tabs">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-tabs" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Modal</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-modal&gt;</p>
  <p class="comp-desc">Dialog, drawer or lightbox with named triggers, responsive placement, touch pan and multiple animations.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/modal">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-modal" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Toast</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-toast&gt;</p>
  <p class="comp-desc">Temporary notifications with HTML templates, six placements, and automatic or manual dismissal.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/toast">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-toast" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Drawer</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-drawer&gt;</p>
  <p class="comp-desc">Slide-in side panel (left / right) with backdrop overlay and smooth animation.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/drawer">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-drawer" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Popover</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-popover&gt;</p>
  <p class="comp-desc">Click-triggered floating panel. Supports top / right / bottom / left placement.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/popover">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-popover" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Tooltip</h3>
    <span class="comp-badge basic">Basic UI</span>
  </div>
  <p class="comp-tag">&lt;ui-tooltip&gt;</p>
  <p class="comp-desc">Short hint on hover, focus, or tap, with viewport-aware placement.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/tooltip">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-tooltip" target="_blank">▶ Demo</a>
  </div>
</div>

</div>

## Media

<p class="comp-section-title">Image & media components</p>

<div class="comp-grid">

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Lazyload</h3>
    <span class="comp-badge media">Media</span>
  </div>
  <p class="comp-tag">&lt;ui-lazyload&gt;</p>
  <p class="comp-desc">IntersectionObserver-driven image loader. No layout shift, native <code>loading="lazy"</code> fallback.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/lazyload">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-lazyload" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>PhotoSwipe</h3>
    <span class="comp-badge media">Media</span>
  </div>
  <p class="comp-tag">&lt;ui-photoswipe&gt;</p>
  <p class="comp-desc">Full-screen image gallery with zoom and swipe. PhotoSwipe assets load from CDN on first use.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/photoswipe">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-photoswipe" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Image Comparison</h3>
    <span class="comp-badge media">Media</span>
  </div>
  <p class="comp-tag">&lt;ui-image-comparison&gt;</p>
  <p class="comp-desc">Drag to compare before / after images. Keyboard ← / → support.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/image-comparison">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-image-comparison" target="_blank">▶ Demo</a>
  </div>
</div>

</div>

## Utility

<p class="comp-section-title">Utility & enhancement components</p>

<div class="comp-grid">

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Counter</h3>
    <span class="comp-badge utility">Utility</span>
  </div>
  <p class="comp-tag">&lt;ui-counter&gt;</p>
  <p class="comp-desc">Animated number count-up on scroll into view. Configurable from / to / duration.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/counter">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-counter" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Dark Mode</h3>
    <span class="comp-badge utility">Utility</span>
  </div>
  <p class="comp-tag">&lt;ui-dark-mode&gt;</p>
  <p class="comp-desc">Theme manager: cycles light / dark / auto. Persists to localStorage, sets <code>data-theme</code> on root.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/dark-mode">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-dark-mode" target="_blank">▶ Demo</a>
  </div>
</div>

</div>

## Advanced

<p class="comp-section-title">Complex interactive components</p>

<div class="comp-grid">

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Marquee</h3>
    <span class="comp-badge advanced">Advanced</span>
  </div>
  <p class="comp-tag">&lt;ui-marquee&gt;</p>
  <p class="comp-desc">Gapless infinite scroller (horizontal & vertical). Parallax scroll scrubbing, and hover pause.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/marquee">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5175/#/ui-marquee" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Carousel</h3>
    <span class="comp-badge advanced">Advanced</span>
  </div>
  <p class="comp-tag">&lt;ui-carousel&gt;</p>
  <p class="comp-desc">Composable carousel with thumbnails, pagination, arrows, drag, and responsive layouts.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/carousel">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5173/#/ui-carousel" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Expandable Grid</h3>
    <span class="comp-badge advanced">Advanced</span>
  </div>
  <p class="comp-tag">&lt;ui-expandable-grid&gt;</p>
  <p class="comp-desc">Expand an image card in place while the surrounding grid moves smoothly.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/expandable-grid">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5173/#/ui-expandable-grid" target="_blank">▶ Demo</a>
  </div>
</div>

<div class="comp-card">
  <div class="comp-card-header">
    <h3>Orbit Gallery</h3>
    <span class="comp-badge advanced">Advanced</span>
  </div>
  <p class="comp-tag">&lt;ui-orbit-gallery&gt;</p>
  <p class="comp-desc">Rotate a ring of image cards in 3D, with captions and automatic spacing.</p>
  <div class="comp-actions">
    <a class="comp-btn docs" href="/components/orbit-gallery">📄 Docs</a>
    <a class="comp-btn demo" href="http://localhost:5173/#/ui-orbit-gallery" target="_blank">▶ Demo</a>
  </div>
</div>

</div>

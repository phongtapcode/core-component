import { define } from '@ui/core';

export interface ImageTracePath { d: string; length: number }
type Point = { x: number; y: number };
type Node = Point & { links: string[]; strength: number };

/** Extract connected luminance contours from a small ImageData sample. */
export function traceImageContours(data: Uint8ClampedArray, width: number, height: number, limit = 320, minContrast = 36): ImageTracePath[] {
  if (width < 2 || height < 2 || data.length < width * height * 4) return [];
  const light = new Float32Array(width * height);
  for (let i = 0; i < light.length; i++) {
    const p = i * 4;
    const alpha = data[p + 3]! / 255;
    light[i] = (data[p]! * .2126 + data[p + 1]! * .7152 + data[p + 2]! * .0722) * alpha + 255 * (1 - alpha);
  }
  // Sobel strength distinguishes a real edge from a low-contrast texture.
  const gradient = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    const gx = (light[i - width + 1]! + 2 * light[i + 1]! + light[i + width + 1]!
      - light[i - width - 1]! - 2 * light[i - 1]! - light[i + width - 1]!) / 4;
    const gy = (light[i + width - 1]! + 2 * light[i + width]! + light[i + width + 1]!
      - light[i - width - 1]! - 2 * light[i - width]! - light[i - width + 1]!) / 4;
    gradient[i] = Math.hypot(gx, gy);
  }
  const strengthAt = (x: number, y: number): number => {
    const left = Math.max(0, Math.min(width - 1, Math.floor(x)));
    const top = Math.max(0, Math.min(height - 1, Math.floor(y)));
    const right = Math.min(width - 1, left + 1);
    const bottom = Math.min(height - 1, top + 1);
    return Math.max(gradient[top * width + left]!, gradient[top * width + right]!,
      gradient[bottom * width + left]!, gradient[bottom * width + right]!);
  };
  const paths: ImageTracePath[] = [];
  const thresholds = [36, 60, 84, 108, 132, 156, 180, 204, 228];
  const perLevel = Math.ceil(Math.max(1, limit) / thresholds.length);
  for (const threshold of thresholds) {
    const levelPaths: ImageTracePath[] = [];
    const nodes = new Map<string, Node>();
    const add = (key: string, x: number, y: number): void => {
      if (!nodes.has(key)) nodes.set(key, { x, y, links: [], strength: strengthAt(x, y) });
    };
    const connect = (a: string, b: string): void => {
      nodes.get(a)!.links.push(b);
      nodes.get(b)!.links.push(a);
    };
    for (let y = 0; y < height - 1; y++) for (let x = 0; x < width - 1; x++) {
      const tl = light[y * width + x]!;
      const tr = light[y * width + x + 1]!;
      const br = light[(y + 1) * width + x + 1]!;
      const bl = light[(y + 1) * width + x]!;
      const cross = (a: number, b: number): boolean => (a < threshold) !== (b < threshold);
      const t = (a: number, b: number): number => Math.max(0, Math.min(1, (threshold - a) / (b - a)));
      const edges: string[] = [];
      if (cross(tl, tr)) { const key = `h:${x}:${y}`; add(key, x + t(tl, tr), y); edges.push(key); }
      if (cross(tr, br)) { const key = `v:${x + 1}:${y}`; add(key, x + 1, y + t(tr, br)); edges.push(key); }
      if (cross(bl, br)) { const key = `h:${x}:${y + 1}`; add(key, x + t(bl, br), y + 1); edges.push(key); }
      if (cross(tl, bl)) { const key = `v:${x}:${y}`; add(key, x, y + t(tl, bl)); edges.push(key); }
      if (edges.length === 2) connect(edges[0]!, edges[1]!);
      else if (edges.length === 4) {
        const pairs = ((tl + tr + br + bl) / 4 < threshold) ? [[0, 3], [1, 2]] : [[0, 1], [2, 3]];
        for (const [a, b] of pairs) connect(edges[a!]!, edges[b!]!);
      }
    }
    const visited = new Set<string>();
    const walk = (start: string): void => {
      const points: Node[] = [];
      let key = start;
      let previous = '';
      while (key && !visited.has(key)) {
        visited.add(key);
        const node = nodes.get(key)!;
        points.push(node);
        const next: string | undefined = node.links.find((candidate) => candidate !== previous && !visited.has(candidate));
        if (!next) {
          if (node.links.includes(start) && points.length > 2) points.push(nodes.get(start)!);
          break;
        }
        previous = key;
        key = next;
      }
      let run: Node[] = [];
      const flush = (): void => {
        if (run.length < 2 || !run.some((point) => point.strength >= minContrast)) { run = []; return; }
        let length = 0;
        for (let i = 1; i < run.length; i++) length += Math.hypot(run[i]!.x - run[i - 1]!.x, run[i]!.y - run[i - 1]!.y);
        if (length >= Math.max(4, Math.min(width, height) * .035)) {
          const d = run.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
          levelPaths.push({ d, length });
        }
        run = [];
      };
      for (const point of points) {
        if (point.strength >= minContrast * .65) run.push(point);
        else flush();
      }
      flush();
    };
    for (const [key, node] of nodes) if (node.links.length === 1 && !visited.has(key)) walk(key);
    for (const key of nodes.keys()) if (!visited.has(key)) walk(key);
    levelPaths.sort((a, b) => b.length - a.length);
    if (levelPaths.length <= perLevel) {
      paths.push(...levelPaths);
    } else {
      const longCount = Math.max(1, Math.floor(perLevel * .6));
      paths.push(...levelPaths.slice(0, longCount));
      const detailCount = perLevel - longCount;
      const remaining = levelPaths.length - longCount;
      for (let i = 0; i < detailCount; i++) {
        const index = longCount + Math.floor((i + .5) * remaining / detailCount);
        paths.push(levelPaths[index]!);
      }
    }
  }
  return paths.slice(0, Math.max(1, limit));
}

const svgNS = 'http://www.w3.org/2000/svg';
const numeric = (host: Element, name: string, fallback: number, min: number, max: number): number => {
  const value = Number(host.getAttribute(name));
  return host.hasAttribute(name) && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
};

export class UiImageTrace extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-duration', 'ui-detail', 'ui-contrast']; }

  private image: HTMLImageElement | null = null;
  private overlay: SVGSVGElement | null = null;
  private controller: AbortController | null = null;
  private finishTimer = 0;
  private generation = 0;
  private resizeObserver: ResizeObserver | null = null;
  private traceSample: { width: number; height: number } | null = null;

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateDashLengths());
      this.resizeObserver.observe(this);
    }
    this.refresh();
  }

  disconnectedCallback(): void {
    this.controller?.abort();
    this.controller = null;
    this.generation++;
    window.clearTimeout(this.finishTimer);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.refresh();
  }

  /** Re-read the child image after its src or the component settings change. */
  refresh(): void {
    this.controller?.abort();
    this.controller = new AbortController();
    const generation = ++this.generation;
    window.clearTimeout(this.finishTimer);
    this.overlay?.remove();
    this.overlay = null;
    this.traceSample = null;
    this.image = [...this.children].find((child): child is HTMLImageElement => child.localName === 'img') ?? null;
    const image = this.image;
    if (!image) { this.removeAttribute('data-state'); return; }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.setAttribute('data-state', 'complete');
      return;
    }
    this.setAttribute('data-state', 'loading');
    const run = (): void => { if (this.generation === generation) this.draw(image); };
    if (image.complete) {
      if (image.naturalWidth && image.naturalHeight) run();
      else this.complete();
    } else {
      image.addEventListener('load', run, { once: true, signal: this.controller.signal });
      image.addEventListener('error', () => this.complete(), { once: true, signal: this.controller.signal });
    }
  }

  /** Play the trace and reveal again. */
  replay(): void { this.refresh(); }

  private draw(image: HTMLImageElement): void {
    const detail = numeric(this, 'ui-detail', 320, 48, 512);
    const scale = Math.min(1, detail / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(2, Math.round(image.naturalWidth * scale));
    const height = Math.max(2, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    try {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) { this.complete(); return; }
      context.drawImage(image, 0, 0, width, height);
      const contrast = numeric(this, 'ui-contrast', 36, 0, 255);
      const contours = traceImageContours(context.getImageData(0, 0, width, height).data, width, height, 320, contrast);
      if (!contours.length) { this.complete(); return; }
      const duration = numeric(this, 'ui-duration', 3600, 400, 15000);
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'ui-image-trace__lines');
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      for (const [index, contour] of contours.entries()) {
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', contour.d);
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        // Store geometric length; rendered dash lengths are measured below.
        path.setAttribute('data-trace-length', String(contour.length));
        path.style.setProperty('--ui-trace-delay', `${Math.round(index / Math.max(1, contours.length - 1) * duration * .3)}ms`);
        path.style.setProperty('--ui-trace-draw-duration', `${Math.round(duration * .4)}ms`);
        svg.append(path);
      }
      this.style.setProperty('--ui-trace-duration', `${duration}ms`);
      this.style.setProperty('--ui-trace-reveal-delay', `${Math.round(duration * .78)}ms`);
      this.style.setProperty('--ui-trace-reveal-duration', `${Math.round(duration * .22)}ms`);
      this.insertBefore(svg, image.nextSibling);
      this.overlay = svg;
      this.traceSample = { width, height };
      this.updateDashLengths();
      // Ensure a replay during an unfinished draw restarts the image animation.
      void image.offsetWidth;
      this.setAttribute('data-state', 'drawing');
      this.dispatchEvent(new CustomEvent('ui-image-trace:ready', { detail: { count: contours.length } }));
      this.finishTimer = window.setTimeout(() => this.complete(), duration);
    } catch {
      // Canvas reading can fail for cross-origin images; the original image remains usable.
      this.complete();
    }
  }

  private updateDashLengths(): void {
    if (!this.overlay || !this.traceSample) return;
    const bounds = this.overlay.getBoundingClientRect();
    // With non-scaling strokes, CSS dash lengths use rendered pixels while
    // contour lengths come from the sampled image's SVG coordinates.
    const scale = Math.max(1, bounds.width / this.traceSample.width, bounds.height / this.traceSample.height);
    for (const path of this.overlay.querySelectorAll('path')) {
      const dashLength = Math.ceil(Number(path.getAttribute('data-trace-length')) * scale + 4);
      path.style.strokeDasharray = `${dashLength} ${dashLength}`;
      path.style.strokeDashoffset = `${dashLength}`;
    }
  }

  private complete(): void {
    window.clearTimeout(this.finishTimer);
    this.setAttribute('data-state', 'complete');
    this.overlay?.remove();
    this.overlay = null;
    this.traceSample = null;
    this.dispatchEvent(new CustomEvent('ui-image-trace:complete'));
  }
}

define('ui-image-trace', UiImageTrace);

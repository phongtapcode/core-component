/** A CSS-powered 3D image ring that keeps its card positions in sync with the DOM. */
import { define } from '@ui/core';

const TRACK = 'ui-orbit-gallery-track';
const ITEM = 'ui-orbit-gallery-item';
const FRONT = 'ui-orbit-gallery-face--front';
const BACK = 'ui-orbit-gallery-face--back';

export class UiOrbitGallery extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-duration', 'ui-direction']; }

  private observer: MutationObserver | null = null;

  connectedCallback(): void {
    if (this.observer) return;
    this.observer = new MutationObserver(() => this.sync());
    this.observer.observe(this, { childList: true, subtree: true });
    this.sync();
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  attributeChangedCallback(): void { this.sync(); }

  private sync(): void {
    const track = [...this.children].find((child) => child.localName === TRACK) as HTMLElement | undefined;
    if (!track) return;

    const items = [...track.children].filter((child): child is HTMLElement => child.localName === ITEM);
    track.style.setProperty('--ui-orbit-count', String(Math.max(items.length, 1)));
    items.forEach((item, index) => {
      item.style.setProperty('--ui-orbit-index', String(index));
      this.ensureFaces(item);
    });

    const value = Number(this.getAttribute('ui-duration'));
    if (this.hasAttribute('ui-duration') && Number.isFinite(value) && value > 0) {
      this.style.setProperty('--ui-orbit-duration', `${value}ms`);
    } else {
      this.style.removeProperty('--ui-orbit-duration');
    }
    track.style.animationDirection = this.getAttribute('ui-direction') === 'reverse' ? 'reverse' : '';
  }

  private ensureFaces(item: HTMLElement): void {
    let front = [...item.children].find((child) => child.classList.contains(FRONT)) as HTMLElement | undefined;
    if (!front) {
      front = document.createElement('div');
      front.className = `ui-orbit-gallery-face ${FRONT}`;
      front.append(...item.childNodes);
      item.append(front);
    }

    // Cards inserted later should still become part of the visible front face.
    const newContent = [...item.childNodes].filter((node) => node !== front &&
      (!(node instanceof Element) || !node.classList.contains(BACK)));
    if (newContent.length) front.append(...newContent);

    if (item.querySelector(`:scope > .${BACK}`)) return;
    const back = front.cloneNode(true) as HTMLElement;
    back.className = `ui-orbit-gallery-face ${BACK}`;
    back.setAttribute('aria-hidden', 'true');
    back.inert = true;
    back.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    back.querySelectorAll('img').forEach((image) => { image.alt = ''; });
    item.append(back);
  }
}

export class UiOrbitGalleryTrack extends HTMLElement {}
export class UiOrbitGalleryItem extends HTMLElement {}

define('ui-orbit-gallery', UiOrbitGallery);
define(TRACK, UiOrbitGalleryTrack);
define(ITEM, UiOrbitGalleryItem);

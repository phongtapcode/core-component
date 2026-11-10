/** A CSS-powered 3D image ring that keeps its card positions in sync with the DOM. */
import { define } from '@ui/core';

const TRACK = 'ui-orbit-gallery-track';
const ITEM = 'ui-orbit-gallery-item';
const FRONT = 'ui-orbit-gallery-face--front';
const BACK = 'ui-orbit-gallery-face--back';

export class UiOrbitGallery extends HTMLElement {
  static get observedAttributes(): string[] { return ['ui-duration', 'ui-direction']; }

  private observer: MutationObserver | null = null;
  private interactionController: AbortController | null = null;
  private pointerId: number | null = null;
  private startX = 0;
  private lastX = 0;
  private lastPointerTime = 0;
  private velocity = 0;
  private dragged = false;
  private suppressClick = false;
  private frameId = 0;
  private frameTime = 0;
  private spinAnimation: Animation | null = null;
  private spinDuration = 24000;
  private manualAngle = 0;
  private addedTabIndex = false;

  connectedCallback(): void {
    if (this.observer) return;
    this.observer = new MutationObserver(() => this.sync());
    this.observer.observe(this, { childList: true, subtree: true });
    this.sync();
    if (!this.hasAttribute('tabindex')) { this.tabIndex = 0; this.addedTabIndex = true; }
    this.interactionController = new AbortController();
    const { signal } = this.interactionController;
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerup', this.onPointerUp, { signal });
    this.addEventListener('pointercancel', this.onPointerCancel, { signal });
    this.addEventListener('lostpointercapture', this.onLostPointerCapture, { signal });
    this.addEventListener('dragstart', (event) => event.preventDefault(), { signal });
    this.addEventListener('click', this.onClick, { capture: true, signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.endInteraction();
    }, { signal });
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.interactionController?.abort();
    this.interactionController = null;
    this.endInteraction();
    if (this.addedTabIndex) { this.removeAttribute('tabindex'); this.addedTabIndex = false; }
  }

  attributeChangedCallback(): void { this.sync(); }

  private get track(): HTMLElement | null {
    return [...this.children].find((child) => child.localName === TRACK) as HTMLElement | null;
  }

  private prepareRotation(): void {
    const track = this.track;
    this.spinAnimation = (track?.getAnimations().find((animation) =>
      (animation as CSSAnimation).animationName === 'ui-orbit-spin')) ?? null;
    const duration = Number(this.spinAnimation?.effect?.getComputedTiming().duration);
    this.spinDuration = Number.isFinite(duration) && duration > 0 ? duration : 24000;
  }

  private rotateBy(degrees: number): void {
    const track = this.track;
    if (!track) return;
    if (this.spinAnimation) {
      const direction = this.getAttribute('ui-direction') === 'reverse' ? -1 : 1;
      const time = Number(this.spinAnimation.currentTime) || 0;
      const next = time + degrees * direction * this.spinDuration / 360;
      this.spinAnimation.currentTime = ((next % this.spinDuration) + this.spinDuration) % this.spinDuration;
    } else {
      this.manualAngle += degrees;
      track.style.setProperty('--ui-orbit-manual-angle', `${this.manualAngle.toFixed(2)}deg`);
    }
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || this.pointerId !== null) return;
    this.stopInertia();
    this.prepareRotation();
    this.pointerId = event.pointerId;
    this.startX = this.lastX = event.clientX;
    this.lastPointerTime = event.timeStamp;
    this.velocity = 0;
    this.dragged = false;
    this.suppressClick = false;
    this.setAttribute('data-interacting', '');
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    if (!this.dragged && Math.abs(event.clientX - this.startX) < 5) return;
    if (!this.dragged) {
      this.dragged = true;
      this.setAttribute('data-dragging', '');
      this.setPointerCapture?.(event.pointerId);
    }
    const dx = event.clientX - this.lastX;
    const dt = Math.max(1, event.timeStamp - this.lastPointerTime);
    const speed = Math.max(-1.2, Math.min(1.2, dx * .32 / dt));
    this.velocity = this.velocity * .35 + speed * .65;
    this.rotateBy(dx * .32);
    this.lastX = event.clientX;
    this.lastPointerTime = event.timeStamp;
    this.suppressClick = true;
    event.preventDefault();
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.pointerId = null;
    if (this.hasPointerCapture?.(event.pointerId)) this.releasePointerCapture(event.pointerId);
    this.removeAttribute('data-dragging');
    if (this.dragged && document.activeElement === this) this.blur();
    const idle = Math.max(0, event.timeStamp - this.lastPointerTime);
    if (idle > 120) this.velocity *= Math.exp(-(idle - 120) / 180);
    if (this.dragged && idle < 180 && Math.abs(this.lastX - this.startX) > 20 && Math.abs(this.velocity) < .16) {
      this.velocity = Math.sign(this.velocity || this.lastX - this.startX) * .16;
    }
    this.velocity = Math.max(-.75, Math.min(.75, this.velocity));
    if (this.dragged && Math.abs(this.velocity) > .012 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.frameTime = 0;
      this.frameId = requestAnimationFrame(this.inertiaFrame);
    } else this.endInteraction();
  };

  private onPointerCancel = (event: PointerEvent): void => {
    if (event.pointerId === this.pointerId) this.endInteraction();
  };

  private onLostPointerCapture = (event: PointerEvent): void => {
    if (event.target === this && event.pointerId === this.pointerId) this.endInteraction();
  };

  private onClick = (event: MouseEvent): void => {
    if (!this.suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.suppressClick = false;
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.target !== this || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    this.stopInertia();
    this.setAttribute('data-interacting', '');
    this.prepareRotation();
    this.rotateBy(event.key === 'ArrowRight' ? 24 : -24);
    this.endInteraction();
  };

  private inertiaFrame = (now: number): void => {
    if (!this.isConnected || document.hidden) { this.endInteraction(); return; }
    if (this.frameTime) {
      const dt = Math.min(64, Math.max(1, now - this.frameTime));
      this.rotateBy(this.velocity * dt);
      this.velocity *= Math.exp(-dt / 560);
    }
    this.frameTime = now;
    if (Math.abs(this.velocity) < .012) this.endInteraction();
    else this.frameId = requestAnimationFrame(this.inertiaFrame);
  };

  private stopInertia(): void {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.frameTime = 0;
  }

  private endInteraction(): void {
    this.stopInertia();
    this.pointerId = null;
    this.spinAnimation = null;
    this.removeAttribute('data-interacting');
    this.removeAttribute('data-dragging');
  }

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

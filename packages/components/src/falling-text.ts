import { define } from '@ui/core';
import { Bodies, Body, Composite, Constraint, Engine, Events, Query, Sleeping } from 'matter-js';

type Trigger = 'auto' | 'hover' | 'click' | 'scroll';
type Order = 'random' | 'sequence' | 'center' | 'together';
type Piece = { node: HTMLSpanElement; body: Body; x: number; y: number; width: number; height: number; released: boolean; releaseAt: number; knocked: boolean; previousX: number; previousY: number; previousAngle: number; lastPush: number };
const STEP_MS = 1000 / 120;

function numberAttr(element: Element, name: string, fallback: number, min: number, max: number): number {
  const raw = element.getAttribute(name);
  const value = raw === null ? fallback : Number(raw);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
}
function boolAttr(element: Element, name: string, fallback: boolean): boolean {
  const raw = element.getAttribute(name);
  return raw === null ? fallback : raw !== 'false';
}

/** Words or letters that fall as colliding rigid bodies and can be thrown back into the pile. */
export class UiFallingText extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['ui-text', 'ui-highlight-words', 'ui-trigger', 'ui-variant', 'ui-split', 'ui-order',
      'ui-stagger', 'ui-gravity', 'ui-bounciness', 'ui-scatter', 'ui-draggable',
      'ui-drag-stiffness', 'ui-cursor-push', 'ui-restore-delay', 'ui-wireframes'];
  }

  private controller: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private motionQuery: MediaQueryList | null = null;
  private source: HTMLSpanElement | null = null;
  private stage: HTMLDivElement | null = null;
  private pieces: Piece[] = [];
  private engine: Engine | null = null;
  private frame = 0;
  private measureFrame = 0;
  private restoreTimer = 0;
  private returnAnimations: Animation[] = [];
  private restoreGeneration = 0;
  private lastTime = 0;
  private accumulator = 0;
  private startedAt = 0;
  private clock = 0;
  private settleSince = 0;
  private visible = true;
  private state: 'idle' | 'falling' | 'settled' | 'restoring' = 'idle';
  private authoredText = '';
  private width = 0;
  private height = 0;
  private dragged: Piece | null = null;
  private dragConstraint: Constraint | null = null;
  private pointerId = -1;
  private pointerLast = { x: 0, y: 0, time: 0 };
  private pointerVelocity = { x: 0, y: 0 };
  private pointerInside = false;
  private hasEntered = false;

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    if (!this.source) this.createMarkup();
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    this.addEventListener('pointerenter', this.onPointerEnter, { signal });
    this.addEventListener('pointerleave', this.onPointerLeave, { signal });
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerup', this.onPointerUp, { signal });
    this.addEventListener('pointercancel', this.onPointerUp, { signal });
    this.addEventListener('click', this.onClick, { signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    document.addEventListener('visibilitychange', this.onVisibilityChange, { signal });
    this.motionQuery?.addEventListener('change', this.onMotionChange, { signal });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        const rect = this.getBoundingClientRect();
        if (Math.abs(rect.width - this.width) > 1 || Math.abs(rect.height - this.height) > 1) this.refresh();
      });
      this.resizeObserver.observe(this);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(([entry]) => {
        this.visible = Boolean(entry?.isIntersecting);
        if (this.visible) this.wake(); else this.stopLoop();
        if (this.visible && this.trigger === 'scroll' && !this.hasEntered) { this.hasEntered = true; this.start(); }
      });
      this.intersectionObserver.observe(this);
    }
    this.refresh();
    const generation = this.controller;
    document.fonts?.ready?.then(() => { if (this.controller === generation) this.refresh(); });
  }

  disconnectedCallback(): void {
    this.controller?.abort(); this.controller = null;
    this.resizeObserver?.disconnect(); this.resizeObserver = null;
    this.intersectionObserver?.disconnect(); this.intersectionObserver = null;
    this.motionQuery?.removeEventListener('change', this.onMotionChange); this.motionQuery = null;
    this.stopLoop(); cancelAnimationFrame(this.measureFrame); this.measureFrame = 0;
    clearTimeout(this.restoreTimer); this.restoreTimer = 0;
    this.returnAnimations.forEach((animation) => animation.cancel()); this.returnAnimations = [];
    this.releasePointer(); this.engine = null; this.pieces = [];
    this.pointerInside = false; this.hasEntered = false; this.visible = true;
    this.state = 'idle'; this.removeAttribute('data-state');
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ui-gravity' || name === 'ui-bounciness' || name === 'ui-wireframes') {
      this.updatePhysics(); return;
    }
    if (name === 'ui-trigger') { this.hasEntered = this.trigger === 'scroll' && this.visible; this.reset(); return; }
    if (name === 'ui-order' || name === 'ui-stagger' || name === 'ui-scatter' || name === 'ui-draggable' || name === 'ui-drag-stiffness' || name === 'ui-cursor-push' || name === 'ui-restore-delay') return;
    this.refresh();
  }

  get trigger(): Trigger {
    const value = this.getAttribute('ui-trigger');
    return value === 'auto' || value === 'hover' || value === 'scroll' ? value : 'click';
  }
  get active(): boolean { return this.state === 'falling' || this.state === 'settled'; }

  /** Rebuild the layout after changing its text or surrounding typography. */
  refresh(): void {
    if (!this.stage || !this.source) return;
    this.stopLoop(); clearTimeout(this.restoreTimer); this.restoreTimer = 0;
    this.returnAnimations.forEach((animation) => animation.cancel()); this.returnAnimations = [];
    this.restoreGeneration++;
    cancelAnimationFrame(this.measureFrame); this.releasePointer();
    this.engine = null; this.pieces = []; this.state = 'idle'; this.removeAttribute('data-state');
    const text = this.getAttribute('ui-text') ?? this.authoredText;
    this.source.textContent = text;
    this.stage.replaceChildren();
    const highlights = (this.getAttribute('ui-highlight-words') ?? '').split(',').map((word) => word.trim().toLocaleLowerCase()).filter(Boolean);
    const splitLetters = this.getAttribute('ui-split') === 'letters';
    const tokens = splitLetters ? Array.from(text) : text.match(/\S+|\s+/g) ?? [];
    const fragment = document.createDocumentFragment();
    for (const token of tokens) {
      if (/^\s+$/.test(token)) { fragment.append(document.createTextNode(token)); continue; }
      const span = document.createElement('span');
      span.className = 'ui-falling-text__piece';
      if (highlights.some((word) => token.toLocaleLowerCase().startsWith(word))) span.classList.add('is-highlighted');
      span.textContent = token;
      span.setAttribute('aria-hidden', 'true');
      fragment.append(span);
    }
    this.stage.append(fragment);
    this.stage.classList.toggle('ui-falling-text__stage--tiles', this.getAttribute('ui-variant') === 'tiles');
    this.stage.classList.toggle('ui-falling-text__stage--letters', splitLetters);
    this.stage.classList.toggle('ui-falling-text__stage--wireframes', boolAttr(this, 'ui-wireframes', false));
    if (this.motionQuery?.matches) { this.setAttribute('data-reduced-motion', ''); return; }
    this.removeAttribute('data-reduced-motion');
    this.measureFrame = requestAnimationFrame(() => { this.measureFrame = 0; this.measure(); });
  }

  /** Start falling, regardless of the configured trigger. */
  start(): void {
    if (!this.isConnected || this.motionQuery?.matches) return;
    if (!this.engine) { this.measureFrame && cancelAnimationFrame(this.measureFrame); this.measureFrame = 0; this.measure(); }
    if (!this.engine || this.state !== 'idle') return;
    this.state = 'falling'; this.setAttribute('data-state', 'falling');
    this.startedAt = performance.now(); this.settleSince = 0;
    this.accumulator = 0; this.clock = 0;
    const order = this.getAttribute('ui-order') as Order | null;
    const indices = this.pieces.map((_, i) => i);
    if (order === 'center') indices.sort((a, b) => Math.abs(a - (indices.length - 1) / 2) - Math.abs(b - (indices.length - 1) / 2));
    else if (order !== 'sequence' && order !== 'together') indices.sort(() => Math.random() - .5);
    const stagger = numberAttr(this, 'ui-stagger', .03, 0, .5) * 1000;
    indices.forEach((index, position) => { this.pieces[index]!.releaseAt = order === 'together' ? 0 : position * stagger; });
    this.dispatchEvent(new CustomEvent('ui:falling-text:start', { detail: { count: this.pieces.length }, bubbles: true }));
    this.wake();
  }

  /** Return every piece to its original text position; automatic triggers can run again. */
  reset(): void {
    if (!this.stage) return;
    this.stopLoop(); clearTimeout(this.restoreTimer); this.restoreTimer = 0;
    this.releasePointer();
    if (this.state !== 'idle' && this.pieces.length) {
      this.state = 'restoring'; this.setAttribute('data-state', 'restoring');
      const ordered = [...this.pieces].sort((a, b) => a.body.position.y - b.body.position.y);
      const canAnimate = typeof ordered[0]?.node.animate === 'function';
      this.returnAnimations.forEach((animation) => animation.cancel()); this.returnAnimations = [];
      const generation = ++this.restoreGeneration;
      ordered.forEach((piece, index) => {
        const from = piece.node.style.transform || 'translate3d(0,0,0) rotate(0rad)';
        const to = 'translate3d(0,0,0) rotate(0rad)';
        if (canAnimate) piece.node.style.transition = 'none';
        piece.node.style.transform = to;
        if (canAnimate) this.returnAnimations.push(piece.node.animate([{ transform: from }, { transform: to }], {
          duration: 760, delay: Math.min(index * 14, 360), easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards',
        }));
      });
      this.dispatchEvent(new CustomEvent('ui:falling-text:restore', { bubbles: true }));
      if (canAnimate) {
        Promise.all(this.returnAnimations.map((animation) => animation.finished.catch(() => null))).then(() => {
          if (this.controller && this.restoreGeneration === generation) this.refresh();
        });
      } else this.restoreTimer = window.setTimeout(() => {
        if (this.controller && this.restoreGeneration === generation) this.refresh();
      }, 650);
    } else this.refresh();
  }
  /** Reset and immediately run another fall. */
  replay(): void { this.refresh(); this.start(); }

  private createMarkup(): void {
    this.authoredText = this.textContent?.trim() || 'Let the words fall into place.';
    this.source = document.createElement('span'); this.source.className = 'ui-falling-text__source';
    this.stage = document.createElement('div'); this.stage.className = 'ui-falling-text__stage';
    this.stage.setAttribute('aria-hidden', 'true');
    this.replaceChildren(this.source, this.stage);
  }

  private measure(): void {
    if (!this.stage || !this.isConnected || this.motionQuery?.matches) return;
    const rect = this.stage.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    this.width = this.getBoundingClientRect().width; this.height = this.getBoundingClientRect().height;
    const nodes = Array.from(this.stage.querySelectorAll<HTMLSpanElement>('.ui-falling-text__piece'));
    const bounds = nodes.map((node) => node.getBoundingClientRect());
    this.engine = Engine.create({ enableSleeping: true, positionIterations: 12, velocityIterations: 10, constraintIterations: 4 });
    this.engine.gravity.y = numberAttr(this, 'ui-gravity', 1, -2, 3) * 1.4;
    const wall = 400;
    Composite.add(this.engine.world, [
      Bodies.rectangle(rect.width / 2, rect.height + wall / 2, 10000, wall, { isStatic: true, friction: .8 }),
      Bodies.rectangle(rect.width / 2, -wall / 2, 10000, wall, { isStatic: true, friction: .3 }),
      Bodies.rectangle(-wall / 2, rect.height / 2, wall, 10000, { isStatic: true, friction: .3 }),
      Bodies.rectangle(rect.width + wall / 2, rect.height / 2, wall, 10000, { isStatic: true, friction: .3 }),
    ]);
    const bounciness = numberAttr(this, 'ui-bounciness', .2, 0, 1);
    this.pieces = nodes.map((node, index) => {
      const box = bounds[index]!;
      const x = box.left - rect.left, y = box.top - rect.top;
      const radius = Math.max(0, Math.min(this.getAttribute('ui-variant') === 'tiles' ? box.height * .28 : 4, box.width / 2 - 1, box.height / 2 - 1));
      const body = Bodies.rectangle(x + box.width / 2, y + box.height / 2, Math.max(2, box.width - 1), Math.max(2, box.height - 1),
        { restitution: bounciness, friction: .4, frictionStatic: .8, frictionAir: .012,
          density: .0015, slop: .02, ...(radius > .5 ? { chamfer: { radius } } : {}) });
      Body.setStatic(body, true);
      Composite.add(this.engine!.world, body);
      node.style.left = `${x}px`; node.style.top = `${y}px`;
      node.style.width = `${box.width}px`; node.style.height = `${box.height}px`;
      node.style.position = 'absolute';
      node.dataset['index'] = String(index);
      return { node, body, x, y, width: box.width, height: box.height, released: false, releaseAt: Infinity,
        knocked: false, previousX: body.position.x, previousY: body.position.y, previousAngle: 0, lastPush: 0 };
    });
    const byBody = new Map(this.pieces.map((piece) => [piece.body, piece]));
    Events.on(this.engine, 'collisionStart', (event) => {
      const direction = Math.sign(this.engine?.gravity.y ?? 1) || 1;
      for (const pair of event.pairs) {
        const a = byBody.get(pair.bodyA);
        const b = byBody.get(pair.bodyB);
        if (!a || !b || a.released === b.released) continue;
        const moving = a.released ? a : b;
        const still = a.released ? b : a;
        if ((still.body.position.y - moving.body.position.y) * direction > still.height * .25) still.knocked = true;
      }
    });
    this.setAttribute('data-ready', '');
    if (this.trigger === 'auto') this.start();
    else if (this.trigger === 'scroll' && this.hasEntered) this.start();
  }

  private updatePhysics(): void {
    if (this.engine) this.engine.gravity.y = numberAttr(this, 'ui-gravity', 1, -2, 3) * 1.4;
    const bounce = numberAttr(this, 'ui-bounciness', .2, 0, 1);
    this.pieces.forEach(({ body }) => { body.restitution = bounce; });
    this.stage?.classList.toggle('ui-falling-text__stage--wireframes', boolAttr(this, 'ui-wireframes', false));
  }
  private release(piece: Piece): void {
    if (piece.released) return;
    piece.released = true;
    Body.setStatic(piece.body, false);
    Sleeping.set(piece.body, false);
    const scatter = numberAttr(this, 'ui-scatter', .5, 0, 1) * (piece.knocked ? .4 : 1);
    Body.setVelocity(piece.body, { x: (Math.random() - .5) * scatter * 6, y: -Math.random() * scatter * 2.5 });
    Body.setAngularVelocity(piece.body, (Math.random() - .5) * scatter * .12);
  }
  private wake(): void {
    if (!this.visible || document.hidden || this.state !== 'falling' || !this.engine || this.frame) return;
    this.lastTime = performance.now(); this.frame = requestAnimationFrame(this.tick);
  }
  private stopLoop(): void { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; }
  private tick = (time: number): void => {
    this.frame = 0;
    if (!this.engine || this.state !== 'falling' || !this.visible || document.hidden) return;
    const elapsed = Math.min(50, Math.max(0, time - this.lastTime)); this.lastTime = time;
    this.clock += elapsed || 1000 / 60;
    for (const piece of this.pieces) if (!piece.released && (this.clock >= piece.releaseAt || piece.knocked)) this.release(piece);
    this.accumulator += elapsed || STEP_MS;
    while (this.accumulator >= STEP_MS) {
      for (const piece of this.pieces) {
        piece.previousX = piece.body.position.x;
        piece.previousY = piece.body.position.y;
        piece.previousAngle = piece.body.angle;
      }
      Engine.update(this.engine, STEP_MS);
      this.accumulator -= STEP_MS;
    }
    const blend = this.accumulator / STEP_MS;
    for (const piece of this.pieces) {
      if (!piece.released) continue;
      const { body } = piece;
      const x = piece.previousX + (body.position.x - piece.previousX) * blend;
      const y = piece.previousY + (body.position.y - piece.previousY) * blend;
      const angle = piece.previousAngle + (body.angle - piece.previousAngle) * blend;
      const dx = x - (piece.x + piece.width / 2);
      const dy = y - (piece.y + piece.height / 2);
      piece.node.style.transform = `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0) rotate(${angle.toFixed(4)}rad)`;
    }
    const allReleased = this.pieces.every((piece) => piece.released);
    const settled = !this.dragged && allReleased && this.pieces.every((piece) => piece.body.speed < .05 || piece.body.isSleeping);
    if (settled) {
      if (!this.settleSince) this.settleSince = time;
      if (time - this.settleSince > 650) {
        this.state = 'settled'; this.setAttribute('data-state', 'settled');
        this.dispatchEvent(new CustomEvent('ui:falling-text:settle', { bubbles: true }));
        this.scheduleRestore(); return;
      }
    } else this.settleSince = 0;
    this.frame = requestAnimationFrame(this.tick);
  };
  private scheduleRestore(): void {
    const delay = numberAttr(this, 'ui-restore-delay', 0, 0, 30);
    if (!delay || this.pointerInside || this.dragged || this.state !== 'settled') return;
    clearTimeout(this.restoreTimer);
    this.restoreTimer = window.setTimeout(() => { this.restoreTimer = 0; if (!this.pointerInside) this.reset(); }, delay * 1000);
  }
  private onPointerEnter = (event: PointerEvent): void => {
    this.pointerInside = true; clearTimeout(this.restoreTimer);
    this.pointerLast = { x: event.clientX, y: event.clientY, time: performance.now() };
    if (this.trigger === 'hover' && this.state === 'idle') this.start();
  };
  private onPointerLeave = (): void => { this.pointerInside = false; this.scheduleRestore(); };
  private onClick = (): void => { if (this.trigger === 'click' && this.state === 'idle') this.start(); };
  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (this.state === 'idle') this.start(); else this.replay(); }
    else if (event.key === 'Escape' && this.active) this.reset();
  };
  private onPointerDown = (event: PointerEvent): void => {
    if (this.trigger === 'hover' && this.state === 'idle') this.start();
    if (!boolAttr(this, 'ui-draggable', true) || !this.active || !this.stage || !this.engine ||
      (event.pointerType === 'mouse' && event.button !== 0)) return;
    const rect = this.stage.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const hit = Query.point(this.pieces.filter((piece) => piece.released).map((piece) => piece.body), point)[0];
    const piece = this.pieces.find((piece) => piece.body === hit);
    if (!piece || !hit) return;
    this.dragged = piece; this.pointerId = event.pointerId;
    this.state = 'falling'; this.setAttribute('data-state', 'falling');
    this.pointerLast = { x: event.clientX, y: event.clientY, time: performance.now() };
    this.pointerVelocity = { x: 0, y: 0 };
    Sleeping.set(hit, false);
    this.dragConstraint = Constraint.create({ pointA: point, bodyB: hit,
      pointB: { x: point.x - hit.position.x, y: point.y - hit.position.y },
      stiffness: numberAttr(this, 'ui-drag-stiffness', .2, .05, 1), damping: .08, length: 0 });
    Composite.add(this.engine.world, this.dragConstraint);
    this.setPointerCapture?.(event.pointerId);
    this.style.cursor = 'grabbing';
    this.wake(); event.preventDefault();
  };
  private onPointerMove = (event: PointerEvent): void => {
    const now = performance.now();
    const dt = Math.max(8, now - this.pointerLast.time);
    const vx = (event.clientX - this.pointerLast.x) * 16.667 / dt;
    const vy = (event.clientY - this.pointerLast.y) * 16.667 / dt;
    if (this.dragged && this.dragConstraint && event.pointerId === this.pointerId && this.stage) {
      const rect = this.stage.getBoundingClientRect();
      this.dragConstraint.pointA.x = event.clientX - rect.left;
      this.dragConstraint.pointA.y = event.clientY - rect.top;
      this.pointerVelocity = { x: vx, y: vy };
      this.wake(); event.preventDefault();
    } else if (this.active && this.stage) {
      const push = numberAttr(this, 'ui-cursor-push', .5, 0, 2);
      const speed = Math.hypot(vx, vy);
      if (push && speed > 2) {
        const rect = this.stage.getBoundingClientRect();
        const x = event.clientX - rect.left, y = event.clientY - rect.top;
        for (const piece of this.pieces) {
          if (!piece.released || now - piece.lastPush < 60) continue;
          const reach = Math.max(piece.width, piece.height) / 2 + 18;
          const distance = Math.hypot(piece.body.position.x - x, piece.body.position.y - y);
          if (distance > reach) continue;
          piece.lastPush = now;
          const kick = Math.min(18, speed * push * .28 * (1 - (distance / reach) ** 2));
          Sleeping.set(piece.body, false);
          Body.setVelocity(piece.body, { x: piece.body.velocity.x + vx / speed * kick,
            y: piece.body.velocity.y + vy / speed * kick - kick * .5 });
          Body.setAngularVelocity(piece.body, piece.body.angularVelocity + (Math.random() - .5) * .06 * push);
          this.state = 'falling'; this.setAttribute('data-state', 'falling'); this.wake();
        }
      }
    }
    this.pointerLast = { x: event.clientX, y: event.clientY, time: now };
  };
  private onPointerUp = (event: PointerEvent): void => {
    if (!this.dragged || event.pointerId !== this.pointerId) return;
    Body.setVelocity(this.dragged.body, { x: Math.max(-18, Math.min(18, this.dragged.body.velocity.x + this.pointerVelocity.x)),
      y: Math.max(-18, Math.min(18, this.dragged.body.velocity.y + this.pointerVelocity.y)) });
    this.releasePointer(); this.state = 'falling'; this.setAttribute('data-state', 'falling'); this.wake();
  };
  private releasePointer(): void {
    if (this.engine && this.dragConstraint) Composite.remove(this.engine.world, this.dragConstraint);
    this.dragConstraint = null;
    if (this.pointerId >= 0 && this.hasPointerCapture?.(this.pointerId)) this.releasePointerCapture(this.pointerId);
    this.pointerId = -1; this.dragged = null; this.style.cursor = '';
  }
  private onVisibilityChange = (): void => { if (document.hidden) this.stopLoop(); else this.wake(); };
  private onMotionChange = (): void => this.refresh();
}

define('ui-falling-text', UiFallingText);

/** Images on the actual planes of a draggable CSS 3D solid. */
import { define } from '@ui/core';

export type ImageSolidShape = 'cube' | 'box' | 'triangle' | 'hexagon' | 'octagon';
export type ImageSolidFace = { name: string; width: number; height: number; transform: string; clipPath?: string };
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const numberAttr = (host: Element, name: string, fallback: number, min: number, max: number): number => {
  const value = Number(host.getAttribute(name));
  return host.hasAttribute(name) && Number.isFinite(value) ? clamp(value, min, max) : fallback;
};
const SHAPES = new Set<ImageSolidShape>(['cube', 'box', 'triangle', 'hexagon', 'octagon']);
const sidesFor = (shape: ImageSolidShape): number => shape === 'triangle' ? 3 : shape === 'hexagon' ? 6 : 8;
const polygon = (sides: number, top: boolean): string => {
  const shift = (top ? -1 : 1) * Math.PI / 2 - Math.PI / sides;
  const points = Array.from({ length: sides }, (_, index) => {
    const angle = shift + index * Math.PI * 2 / sides;
    return `${(50 + Math.cos(angle) * 50).toFixed(3)}% ${(50 + Math.sin(angle) * 50).toFixed(3)}%`;
  });
  return `polygon(${points.join(', ')})`;
};

/** Plane layout used by the component and available to test or build custom controls. */
export function imageSolidGeometry(shape: ImageSolidShape, width: number, height: number, depth: number): ImageSolidFace[] {
  if (shape === 'cube' || shape === 'box') {
    const w = width, h = shape === 'cube' ? width : height, d = shape === 'cube' ? width : depth;
    return [
      { name:'front', width:w, height:h, transform:`rotateY(0deg) translateZ(${d/2}px)` },
      { name:'right', width:d, height:h, transform:`rotateY(90deg) translateZ(${w/2}px)` },
      { name:'back', width:w, height:h, transform:`rotateY(180deg) translateZ(${d/2}px)` },
      { name:'left', width:d, height:h, transform:`rotateY(270deg) translateZ(${w/2}px)` },
      { name:'top', width:w, height:d, transform:`rotateX(-90deg) translateZ(${h/2}px)` },
      { name:'bottom', width:w, height:d, transform:`rotateX(90deg) translateZ(${h/2}px)` },
    ];
  }
  const sides = sidesFor(shape);
  const apothem = width / (2 * Math.tan(Math.PI / sides));
  const capRadius = width / (2 * Math.sin(Math.PI / sides));
  const capSize = capRadius * 2;
  const planes: ImageSolidFace[] = Array.from({ length: sides }, (_, index) => ({
    name:`side-${index + 1}`, width, height,
    transform:`rotateY(${index * 360 / sides}deg) translateZ(${apothem.toFixed(3)}px)`,
  }));
  planes.push(
    { name:'top', width:capSize, height:capSize, transform:`rotateX(-90deg) translateZ(${height/2}px)`, clipPath:polygon(sides,true) },
    { name:'bottom', width:capSize, height:capSize, transform:`rotateX(90deg) translateZ(${height/2}px)`, clipPath:polygon(sides,false) },
  );
  return planes;
}

export class UiImageSolid extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['ui-shape','ui-size','ui-width','ui-height','ui-depth','ui-auto-rotate','ui-spin-speed','ui-rotation-x','ui-rotation-y'];
  }

  private rotor: HTMLElement | null = null;
  private controller: AbortController | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private frame = 0;
  private previousTime = 0;
  private visible = true;
  private dragging = false;
  private pointerId = -1;
  private lastX = 0;
  private lastY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private rotationX = -18;
  private rotationY = 30;
  private reducedMotion = false;

  get shape(): ImageSolidShape {
    const value = this.getAttribute('ui-shape') as ImageSolidShape;
    return SHAPES.has(value) ? value : 'cube';
  }

  connectedCallback(): void {
    if (this.controller) return;
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!this.rotor) {
      const stage = document.createElement('div');
      stage.className = 'ui-image-solid__stage';
      const rotor = document.createElement('div');
      rotor.className = 'ui-image-solid__rotor';
      stage.append(rotor);
      this.append(stage);
      this.rotor = rotor;
    }
    if (!this.hasAttribute('role')) this.setAttribute('role','group');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label','Rotatable image sculpture');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.rotationX = numberAttr(this,'ui-rotation-x',-18,-3600,3600);
    this.rotationY = numberAttr(this,'ui-rotation-y',30,-3600,3600);
    this.addEventListener('pointerdown', this.onPointerDown, { signal });
    this.addEventListener('pointermove', this.onPointerMove, { signal });
    this.addEventListener('pointerup', this.onPointerUp, { signal });
    this.addEventListener('pointercancel', this.onPointerUp, { signal });
    this.addEventListener('lostpointercapture', this.onPointerUp, { signal });
    this.addEventListener('keydown', this.onKeyDown, { signal });
    document.addEventListener('visibilitychange', this.onVisibility, { signal });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.refresh());
      this.resizeObserver.observe(this);
    } else window.addEventListener('resize', this.onResize, { signal });
    if (typeof IntersectionObserver !== 'undefined') {
      this.visible = false;
      this.intersectionObserver = new IntersectionObserver((entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
        if (this.visible) this.start(); else this.stop();
      }, { rootMargin:'100px' });
      this.intersectionObserver.observe(this);
    }
    this.refresh();
    this.start();
  }

  disconnectedCallback(): void {
    this.controller?.abort(); this.controller = null;
    this.resizeObserver?.disconnect(); this.resizeObserver = null;
    this.intersectionObserver?.disconnect(); this.intersectionObserver = null;
    this.stop();
  }

  attributeChangedCallback(name: string): void {
    if (!this.isConnected) return;
    if (name === 'ui-rotation-x' || name === 'ui-rotation-y') {
      this.rotateTo(numberAttr(this,'ui-rotation-x',this.rotationX,-3600,3600),
        numberAttr(this,'ui-rotation-y',this.rotationY,-3600,3600));
    } else if (name === 'ui-auto-rotate' || name === 'ui-spin-speed') this.start();
    else this.refresh();
  }

  /** Recalculate faces after inserting, removing or replacing image faces. */
  refresh(): void {
    if (!this.rotor) return;
    const direct = [...this.children].filter((child) => child.localName === 'ui-image-solid-face');
    if (direct.length) this.rotor.append(...direct);
    const shape = this.shape;
    const size = numberAttr(this,'ui-size',220,70,500);
    const boxWidth = numberAttr(this,'ui-width',230,70,500);
    const boxHeight = numberAttr(this,'ui-height',270,70,500);
    const boxDepth = numberAttr(this,'ui-depth',150,40,500);
    let width = shape === 'box' ? boxWidth : size;
    let height = shape === 'cube' ? size : boxHeight;
    let depth = shape === 'box' ? boxDepth : size;
    // Fit the solid at every drag angle, including a tilted view of the caps.
    // The enclosing sphere gives a safe projected bound for both axes.
    const diameter = shape === 'cube' || shape === 'box'
      ? Math.hypot(width,height,depth)
      : Math.hypot(width / Math.sin(Math.PI / sidesFor(shape)),height);
    const availableWidth = Math.max(120,(this.clientWidth || 600) - 54);
    const availableHeight = Math.max(120,(this.clientHeight || 460) - 70);
    const fit = Math.min(1,availableWidth / diameter,availableHeight / diameter);
    width *= fit; height *= fit; depth *= fit;
    const planes = imageSolidGeometry(shape,width,height,depth);
    const userFaces = [...this.rotor.children].filter((child): child is HTMLElement =>
      child.localName === 'ui-image-solid-face' && !child.hasAttribute('data-ui-generated'));
    const used = new Set<HTMLElement>();
    const generated = [...this.rotor.children].filter((child): child is HTMLElement =>
      child.localName === 'ui-image-solid-face' && child.hasAttribute('data-ui-generated'));
    planes.forEach((plane,index) => {
      let face = userFaces.find((candidate) => candidate.getAttribute('ui-face') === plane.name && !used.has(candidate));
      if (!face) face = userFaces.find((candidate) => !candidate.hasAttribute('ui-face') && !used.has(candidate));
      if (!face) face = generated.find((candidate) => !used.has(candidate));
      if (!face) {
        face = document.createElement('ui-image-solid-face');
        face.setAttribute('data-ui-generated','');
        face.setAttribute('aria-hidden','true');
        this.rotor!.append(face);
      }
      used.add(face);
      face.hidden = false;
      face.dataset['uiSide'] = plane.name;
      face.style.width = `${plane.width}px`;
      face.style.height = `${plane.height}px`;
      face.style.transform = `translate(-50%, -50%) ${plane.transform}`;
      face.style.clipPath = plane.clipPath || '';
    });
    userFaces.forEach((face) => { if (!used.has(face)) face.hidden = true; });
    generated.forEach((face) => { if (!used.has(face)) face.remove(); });
    this.render();
  }

  rotateTo(x: number, y: number): void {
    this.rotationX = x; this.rotationY = y;
    this.velocityX = 0; this.velocityY = 0;
    this.render();
    this.dispatchEvent(new CustomEvent('ui:image-solid:rotate',{ bubbles:true, detail:{ x,y } }));
  }
  reset(): void { this.rotateTo(numberAttr(this,'ui-rotation-x',-18,-3600,3600),numberAttr(this,'ui-rotation-y',30,-3600,3600)); }

  private render(): void {
    if (this.rotor) this.rotor.style.transform = `rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
  }
  private readonly onResize = (): void => this.refresh();
  private readonly onVisibility = (): void => { if (document.hidden) this.stop(); else this.start(); };
  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.dragging) return;
    this.dragging = true;
    this.pointerId = event.pointerId;
    this.lastX = event.clientX; this.lastY = event.clientY;
    this.velocityX = 0; this.velocityY = 0;
    this.setPointerCapture?.(event.pointerId);
    this.setAttribute('data-dragging','');
    this.start();
  };
  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    event.preventDefault();
    const sensitivity = numberAttr(this,'ui-drag-sensitivity',.55,.1,3);
    const dx = (event.clientX - this.lastX) * sensitivity;
    const dy = (event.clientY - this.lastY) * sensitivity;
    this.lastX = event.clientX; this.lastY = event.clientY;
    this.rotationY += dx;
    this.rotationX -= dy;
    this.velocityY = dx;
    this.velocityX = -dy;
    this.render();
    this.dispatchEvent(new CustomEvent('ui:image-solid:rotate',{ bubbles:true, detail:{ x:this.rotationX,y:this.rotationY } }));
  };
  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.dragging = false; this.pointerId = -1;
    this.removeAttribute('data-dragging');
    if (this.hasPointerCapture?.(event.pointerId)) this.releasePointerCapture(event.pointerId);
    this.start();
  };
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const step = event.shiftKey ? 30 : 15;
    if (event.key === 'ArrowLeft') this.rotateTo(this.rotationX,this.rotationY-step);
    else if (event.key === 'ArrowRight') this.rotateTo(this.rotationX,this.rotationY+step);
    else if (event.key === 'ArrowUp') this.rotateTo(this.rotationX-step,this.rotationY);
    else if (event.key === 'ArrowDown') this.rotateTo(this.rotationX+step,this.rotationY);
    else if (event.key === 'Home') this.reset();
    else return;
    event.preventDefault();
  };

  private start(): void {
    if (this.frame || !this.visible || document.hidden || this.reducedMotion) return;
    if (!this.dragging && !this.hasAttribute('ui-auto-rotate') && Math.abs(this.velocityX) + Math.abs(this.velocityY) < .02) return;
    this.previousTime = 0;
    this.frame = requestAnimationFrame(this.tick);
  }
  private stop(): void { if (this.frame) cancelAnimationFrame(this.frame); this.frame = 0; this.previousTime = 0; }
  private readonly tick = (now: number): void => {
    this.frame = 0;
    if (!this.isConnected || !this.visible || document.hidden) return;
    const elapsed = this.previousTime ? clamp(now - this.previousTime,4,50) : 16.7;
    this.previousTime = now;
    if (!this.dragging) {
      const frames = elapsed / 16.7;
      this.rotationX += this.velocityX * frames;
      this.rotationY += this.velocityY * frames;
      const friction = Math.pow(numberAttr(this,'ui-inertia',.91,.6,.99),frames);
      this.velocityX *= friction; this.velocityY *= friction;
      if (this.hasAttribute('ui-auto-rotate')) this.rotationY += numberAttr(this,'ui-spin-speed',16,-180,180) * elapsed / 1000;
      this.render();
    }
    if (this.dragging || this.hasAttribute('ui-auto-rotate') || Math.abs(this.velocityX) + Math.abs(this.velocityY) >= .02) {
      this.frame = requestAnimationFrame(this.tick);
    }
  };
}

export class UiImageSolidFace extends HTMLElement {}
define('ui-image-solid', UiImageSolid);
define('ui-image-solid-face', UiImageSolidFace);

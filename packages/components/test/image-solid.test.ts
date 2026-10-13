import { afterEach, describe, expect, it, vi } from 'vitest';
import { imageSolidGeometry, type UiImageSolid } from '../src/image-solid.js';

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

describe('ui-image-solid', () => {
  it('lays out six box planes with matching front, side and cap dimensions', () => {
    const faces = imageSolidGeometry('box',240,280,160);
    expect(faces.map((face) => face.name)).toEqual(['front','right','back','left','top','bottom']);
    expect(faces[0]).toMatchObject({ width:240, height:280, transform:'rotateY(0deg) translateZ(80px)' });
    expect(faces[1]).toMatchObject({ width:160, height:280, transform:'rotateY(90deg) translateZ(120px)' });
    expect(faces[4]).toMatchObject({ width:240, height:160, transform:'rotateX(-90deg) translateZ(140px)' });
  });

  it('builds closed triangular and hexagonal prisms with polygon end caps', () => {
    const triangle = imageSolidGeometry('triangle',180,260,100);
    const hexagon = imageSolidGeometry('hexagon',160,260,100);
    expect(triangle).toHaveLength(5);
    expect(hexagon).toHaveLength(8);
    expect(triangle[3]?.clipPath?.split(',')).toHaveLength(3);
    expect(hexagon[6]?.clipPath?.split(',')).toHaveLength(6);
    expect(hexagon[1]?.transform).toContain('rotateY(60deg)');
  });

  it('keeps authored image faces, supplies missing planes and rotates with pointer and keyboard', () => {
    const solid = document.createElement('ui-image-solid') as UiImageSolid;
    solid.setAttribute('ui-shape','hexagon');
    Object.defineProperties(solid, {
      clientWidth: { value: 650 }, clientHeight: { value: 460 },
      setPointerCapture: { value: () => undefined },
    });
    const top = document.createElement('ui-image-solid-face');
    top.setAttribute('ui-face','top');
    top.innerHTML = '<img src="/top.jpg" alt="Top artwork">';
    solid.append(top);
    document.body.append(solid);
    expect(solid.querySelectorAll('ui-image-solid-face')).toHaveLength(8);
    expect(top.dataset['uiSide']).toBe('top');
    expect(top.querySelector('img')?.getAttribute('alt')).toBe('Top artwork');
    const rotor = solid.querySelector<HTMLElement>('.ui-image-solid__rotor')!;
    solid.dispatchEvent(new PointerEvent('pointerdown',{ pointerId:1, clientX:100, clientY:100 }));
    solid.dispatchEvent(new PointerEvent('pointermove',{ pointerId:1, clientX:140, clientY:80 }));
    expect(rotor.style.transform).toBe('rotateX(-7deg) rotateY(52deg)');
    solid.dispatchEvent(new KeyboardEvent('keydown',{ key:'ArrowRight', bubbles:true }));
    expect(rotor.style.transform).toBe('rotateX(-7deg) rotateY(67deg)');
  });

  it('scales a cube to fit its tilted diagonal on a narrow stage', () => {
    const solid = document.createElement('ui-image-solid') as UiImageSolid;
    solid.setAttribute('ui-size','230');
    Object.defineProperties(solid, {
      clientWidth: { value: 300 }, clientHeight: { value: 380 },
    });
    document.body.append(solid);
    const front = solid.querySelector<HTMLElement>('ui-image-solid-face[data-ui-side="front"]')!;
    const side = Number.parseFloat(front.style.width);
    expect(side * Math.sqrt(3)).toBeLessThanOrEqual(300 - 54 + 0.001);
  });
});

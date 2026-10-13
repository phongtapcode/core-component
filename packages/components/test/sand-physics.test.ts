import { afterEach, describe, expect, it, vi } from 'vitest';
import { SandCell, SandPhysicsEngine } from '../src/sand-physics-engine.js';
import type { UiSandPhysics } from '../src/sand-physics.js';
import '../src/sand-physics.js';

const count = (engine: SandPhysicsEngine, cell: SandCell): number => [...engine.cells].filter((value) => value === cell).length;
afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

describe('SandPhysicsEngine', () => {
  it('piles sand above a solid wall without crossing it', () => {
    const box = new SandPhysicsEngine(18, 16, () => .4);
    box.stroke(0, 10, 17, 10, 1, 'wall');
    for (let x = 5; x < 13; x++) box.set(x, 1, SandCell.Sand);
    for (let step = 0; step < 50; step++) box.step();
    expect(count(box, SandCell.Sand)).toBe(8);
    for (let y = 11; y < 16; y++) for (let x = 0; x < 18; x++) expect(box.at(x,y)).not.toBe(SandCell.Sand);
    expect([...box.cells.slice(0, 18 * 10)].some((cell) => cell === SandCell.Sand)).toBe(true);
  });

  it('changes fall direction when gravity rotates', () => {
    const box = new SandPhysicsEngine(8, 8, () => .4);
    box.set(4, 4, SandCell.Stone);
    box.gravity = 'left';
    for (let step = 0; step < 12; step++) box.step();
    expect(box.at(0, 4)).toBe(SandCell.Stone);
    box.gravity = 'up';
    for (let step = 0; step < 12; step++) box.step();
    expect(box.at(0, 0)).toBe(SandCell.Stone);
  });

  it('accelerates through empty cells but checks each cell on the path', () => {
    const box = new SandPhysicsEngine(8, 20, () => .4);
    box.set(4, 1, SandCell.Sand);
    box.step();
    expect(box.at(4,2)).toBe(SandCell.Sand);
    box.step();
    expect(box.at(4,4)).toBe(SandCell.Sand);
    box.stroke(0,8,7,8,1,'wall');
    for (let index = 0; index < 6; index++) box.step();
    for (let y = 10; y < 20; y++) for (let x = 0; x < 8; x++) expect(box.at(x,y)).not.toBe(SandCell.Sand);
  });

  it('passes drag direction into newly painted particles', () => {
    const box = new SandPhysicsEngine(14, 12, () => 0);
    box.stroke(3, 3, 3, 3, 1, 'sand', 0, 1, 4, 0);
    box.step();
    expect(box.at(5, 3)).toBe(SandCell.Sand);
  });

  it('lets water spread laterally while stone remains on a surface', () => {
    const box = new SandPhysicsEngine(14, 10, () => .4);
    box.stroke(0, 8, 13, 8, 1, 'wall');
    box.set(7, 2, SandCell.Water);
    box.set(5, 2, SandCell.Stone);
    for (let step = 0; step < 30; step++) box.step();
    const water = [...box.cells].findIndex((cell) => cell === SandCell.Water);
    const stone = [...box.cells].findIndex((cell) => cell === SandCell.Stone);
    expect(water).toBeGreaterThanOrEqual(0);
    expect(stone).toBeGreaterThanOrEqual(0);
    expect(box.particleCount).toBe(2);
    expect(Math.floor(water / 14)).toBeLessThan(7);
    expect(Math.floor(stone / 14)).toBeLessThan(7);
  });

  it('solidifies lava on contact with water and lets fire ignite wood', () => {
    const lava = new SandPhysicsEngine(8, 8, () => 0);
    lava.set(3, 3, SandCell.Lava);
    lava.set(4, 3, SandCell.Water);
    lava.step();
    expect(count(lava, SandCell.Stone)).toBe(1);
    expect(count(lava, SandCell.Smoke)).toBe(1);

    const fire = new SandPhysicsEngine(8, 8, () => 0);
    fire.set(3, 3, SandCell.Fire);
    fire.set(4, 3, SandCell.Wood);
    fire.step();
    expect(count(fire, SandCell.Fire)).toBeGreaterThan(1);
  });

  it('restores the previous drawing with undo', () => {
    const box = new SandPhysicsEngine(20, 20, () => 0);
    box.checkpoint();
    box.stroke(2, 2, 17, 17, 1, 'wall');
    expect(count(box, SandCell.Wall)).toBeGreaterThan(10);
    expect(box.undo()).toBe(true);
    expect(count(box, SandCell.Wall)).toBe(0);
  });

  it('connects the canvas, paints a pointer stroke, and undoes it through the component API', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
      createImageData: (width: number, height: number) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
      putImageData: () => undefined,
    })) as HTMLCanvasElement['getContext']);
    const sandbox = document.createElement('ui-sand-physics') as UiSandPhysics;
    sandbox.setAttribute('ui-tool', 'wall');
    Object.defineProperties(sandbox, {
      clientWidth: { value: 400 }, clientHeight: { value: 320 },
      getBoundingClientRect: { value: () => ({ left: 0, top: 0, width: 400, height: 320 }) },
      setPointerCapture: { value: () => undefined },
    });
    document.body.append(sandbox);
    expect(sandbox.simulation).not.toBeNull();
    sandbox.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 }));
    expect(sandbox.simulation?.at(25, 25)).toBe(SandCell.Wall);
    expect(sandbox.undo()).toBe(true);
    expect(sandbox.simulation?.at(25, 25)).toBe(SandCell.Empty);
  });
});

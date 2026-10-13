/** A bounded cellular sandbox. One cell holds one material, so matter cannot overlap walls. */
export const enum SandCell { Empty, Sand, Water, Stone, Fire, Smoke, Lava, Wood, Wall }
export type SandMaterial = 'sand' | 'water' | 'stone' | 'fire' | 'smoke' | 'lava' | 'wood';
export type SandGravity = 'down' | 'up' | 'left' | 'right';
export type SandPreset = 'none' | 'funnel' | 'hourglass' | 'maze' | 'chute';

const MATERIAL: Record<SandMaterial, SandCell> = {
  sand: SandCell.Sand, water: SandCell.Water, stone: SandCell.Stone,
  fire: SandCell.Fire, smoke: SandCell.Smoke, lava: SandCell.Lava, wood: SandCell.Wood,
};
const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [[1,0],[-1,0],[0,1],[0,-1]];
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
type Snapshot = { cells: Uint8Array; tones: Uint16Array; ages: Uint8Array; fallSpeed: Uint8Array };

export class SandPhysicsEngine {
  readonly cells: Uint8Array;
  readonly tones: Uint16Array;
  readonly ages: Uint8Array;
  private readonly moved: Uint32Array;
  private readonly impulseX: Int8Array;
  private readonly impulseY: Int8Array;
  private readonly impulseLife: Uint8Array;
  private readonly fallSpeed: Uint8Array;
  private readonly history: Snapshot[] = [];
  private frame = 0;
  private count = 0;
  gravity: SandGravity = 'down';
  gravityStrength = 1;

  constructor(readonly width: number, readonly height: number, private readonly rng: () => number = Math.random) {
    if (width < 1 || height < 1 || width * height > 1_000_000) throw new RangeError('Invalid sand grid size');
    const length = width * height;
    this.cells = new Uint8Array(length);
    this.tones = new Uint16Array(length);
    this.ages = new Uint8Array(length);
    this.moved = new Uint32Array(length);
    this.impulseX = new Int8Array(length);
    this.impulseY = new Int8Array(length);
    this.impulseLife = new Uint8Array(length);
    this.fallSpeed = new Uint8Array(length);
  }

  get particleCount(): number { return this.count; }
  get materialCount(): number { return this.count; }
  at(x: number, y: number): SandCell { return this.inside(x, y) ? this.cells[y * this.width + x]! : SandCell.Wall; }
  private inside(x: number, y: number): boolean { return x >= 0 && x < this.width && y >= 0 && y < this.height; }
  private index(x: number, y: number): number { return y * this.width + x; }

  set(x: number, y: number, material: SandCell, tone = 0): boolean {
    if (!this.inside(x, y)) return false;
    const index = this.index(x, y);
    const previous = this.cells[index]!;
    const wasParticle = previous !== SandCell.Empty && previous !== SandCell.Wall && previous !== SandCell.Wood;
    const isParticle = material !== SandCell.Empty && material !== SandCell.Wall && material !== SandCell.Wood;
    if (!wasParticle && isParticle) this.count++;
    else if (wasParticle && !isParticle) this.count--;
    this.cells[index] = material;
    this.tones[index] = tone;
    this.ages[index] = 0;
    this.impulseLife[index] = 0;
    this.fallSpeed[index] = 0;
    return true;
  }

  clear(keepWalls = false): void {
    if (!keepWalls) {
      this.cells.fill(0); this.tones.fill(0); this.ages.fill(0);
    } else {
      for (let index = 0; index < this.cells.length; index++) {
        if (this.cells[index] !== SandCell.Wall && this.cells[index] !== SandCell.Wood) {
          this.cells[index] = 0; this.tones[index] = 0; this.ages[index] = 0;
        }
      }
    }
    this.impulseLife.fill(0);
    this.fallSpeed.fill(0);
    this.count = 0;
  }

  checkpoint(): void {
    this.history.push({ cells: this.cells.slice(), tones: this.tones.slice(), ages: this.ages.slice(), fallSpeed: this.fallSpeed.slice() });
    if (this.history.length > 12) this.history.shift();
  }

  undo(): boolean {
    const last = this.history.pop();
    if (!last) return false;
    this.cells.set(last.cells); this.tones.set(last.tones); this.ages.set(last.ages);
    this.fallSpeed.set(last.fallSpeed);
    this.impulseLife.fill(0);
    this.count = 0;
    for (const cell of this.cells) if (cell !== SandCell.Empty && cell !== SandCell.Wall && cell !== SandCell.Wood) this.count++;
    return true;
  }

  /** A Bresenham stroke has no gaps even when pointer events are far apart. */
  stroke(x0: number, y0: number, x1: number, y1: number, radius: number, tool: SandMaterial | 'wall' | 'eraser' | 'brush' | 'attract' | 'explode', tone = 0, density = 1, momentumX = 0, momentumY = 0): void {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let error = dx - dy;
    let steps = 0;
    while (true) {
      this.paint(x0, y0, radius, tool, tone, density, momentumX, momentumY);
      if (x0 === x1 && y0 === y1) break;
      if (++steps > this.width + this.height + 200) break;
      const twice = error * 2;
      if (twice > -dy) { error -= dy; x0 += sx; }
      if (twice < dx) { error += dx; y0 += sy; }
    }
  }

  paint(cx: number, cy: number, radius: number, tool: SandMaterial | 'wall' | 'eraser' | 'brush' | 'attract' | 'explode', tone = 0, density = 1, momentumX = 0, momentumY = 0): void {
    radius = clamp(Math.round(radius), 1, 60);
    const r2 = radius * radius;
    for (let y = Math.max(0, cy - radius); y <= Math.min(this.height - 1, cy + radius); y++) {
      for (let x = Math.max(0, cx - radius); x <= Math.min(this.width - 1, cx + radius); x++) {
        const d2 = (x - cx) ** 2 + (y - cy) ** 2;
        if (d2 > r2) continue;
        const index = this.index(x, y);
        const old = this.cells[index]!;
        if (tool === 'eraser') { if (old !== SandCell.Empty) this.set(x, y, SandCell.Empty); continue; }
        if (tool === 'brush' || tool === 'attract' || tool === 'explode') {
          if (old === SandCell.Empty || old === SandCell.Wall || old === SandCell.Wood) continue;
          const angle = Math.atan2(y - cy, x - cx) + (tool === 'attract' ? Math.PI : 0) + (this.rng() - .5) * .55;
          const force = tool === 'explode' ? 6 : 3;
          this.impulseX[index] = Math.round(Math.cos(angle) * force);
          this.impulseY[index] = Math.round(Math.sin(angle) * force);
          this.impulseLife[index] = tool === 'explode' ? 14 : 5;
          continue;
        }
        if (tool === 'wall' || tool === 'wood') {
          this.set(x, y, tool === 'wall' ? SandCell.Wall : SandCell.Wood, tone);
          continue;
        }
        if (old !== SandCell.Empty || this.rng() > density) continue;
        this.set(x, y, MATERIAL[tool], tone + Math.floor(this.rng() * 12));
        if (momentumX || momentumY) {
          this.impulseX[index] = clamp(Math.round(momentumX), -6, 6);
          this.impulseY[index] = clamp(Math.round(momentumY), -6, 6);
          this.impulseLife[index] = 2 + Math.min(5, Math.round(Math.hypot(momentumX,momentumY)));
        }
      }
    }
  }

  setPreset(name: SandPreset): void {
    this.checkpoint();
    this.clear();
    const w = this.width, h = this.height;
    const line = (x0: number, y0: number, x1: number, y1: number, thick = 2): void => this.stroke(Math.round(x0*w), Math.round(y0*h), Math.round(x1*w), Math.round(y1*h), thick, 'wall');
    if (name === 'funnel') {
      line(.08,.2,.42,.68); line(.92,.2,.58,.68);
      line(.34,.88,.66,.88);
    } else if (name === 'hourglass') {
      line(.12,.12,.46,.49); line(.88,.12,.54,.49);
      line(.46,.51,.12,.9); line(.54,.51,.88,.9);
      line(.12,.9,.88,.9);
    } else if (name === 'maze') {
      line(.08,.25,.66,.25); line(.34,.44,.92,.44);
      line(.08,.64,.66,.64); line(.34,.82,.92,.82);
    } else if (name === 'chute') {
      line(.04,.15,.7,.53); line(.98,.35,.28,.8); line(.08,.91,.92,.91);
    }
  }

  private direction(): [number, number] {
    return this.gravity === 'down' ? [0, 1] : this.gravity === 'up' ? [0, -1] : this.gravity === 'left' ? [-1, 0] : [1, 0];
  }

  private move(x: number, y: number, nx: number, ny: number, stamp: number, swapWithFluid: boolean): boolean {
    if (!this.inside(nx, ny)) return false;
    const from = this.index(x, y), to = this.index(nx, ny);
    const destination = this.cells[to]!;
    if (destination !== SandCell.Empty && !(swapWithFluid && (destination === SandCell.Water || destination === SandCell.Smoke))) return false;
    if (this.moved[to] === stamp) return false;
    this.cells[to] = this.cells[from]!; this.cells[from] = destination;
    [this.tones[to], this.tones[from]] = [this.tones[from]!, this.tones[to]!];
    [this.ages[to], this.ages[from]] = [this.ages[from]!, this.ages[to]!];
    [this.impulseX[to], this.impulseX[from]] = [this.impulseX[from]!, this.impulseX[to]!];
    [this.impulseY[to], this.impulseY[from]] = [this.impulseY[from]!, this.impulseY[to]!];
    [this.impulseLife[to], this.impulseLife[from]] = [this.impulseLife[from]!, this.impulseLife[to]!];
    [this.fallSpeed[to], this.fallSpeed[from]] = [this.fallSpeed[from]!, this.fallSpeed[to]!];
    this.moved[to] = stamp; this.moved[from] = stamp;
    return true;
  }

  private react(x: number, y: number, material: SandCell): boolean {
    if (material !== SandCell.Lava && material !== SandCell.Water && material !== SandCell.Fire) return false;
    for (const [dx, dy] of NEIGHBORS) {
      const nx = x + dx!, ny = y + dy!;
      const neighbor = this.at(nx, ny);
      if ((material === SandCell.Lava && neighbor === SandCell.Water) ||
        (material === SandCell.Water && neighbor === SandCell.Lava)) {
        this.set(x, y, SandCell.Stone);
        this.set(nx, ny, SandCell.Smoke);
        return true;
      }
      if (material === SandCell.Fire && neighbor === SandCell.Wood && this.rng() < .1) {
        this.set(nx, ny, SandCell.Fire);
      }
      if (material === SandCell.Fire && neighbor === SandCell.Water) {
        this.set(x, y, SandCell.Smoke);
        return true;
      }
    }
    return false;
  }

  step(): void {
    const stamp = ++this.frame;
    const [gx, gy] = this.direction();
    const sidewaysX = gy, sidewaysY = -gx;
    const horizontalGravity = gx !== 0;
    const majorLength = horizontalGravity ? this.width : this.height;
    const minorLength = horizontalGravity ? this.height : this.width;
    const reverseMinor = this.rng() < .5;
    for (let major = 0; major < majorLength; major++) {
      const aligned = (gx > 0 || gy > 0) ? majorLength - 1 - major : major;
      for (let minor = 0; minor < minorLength; minor++) {
        const cross = reverseMinor ? minorLength - 1 - minor : minor;
        const x = horizontalGravity ? aligned : cross;
        const y = horizontalGravity ? cross : aligned;
        const index = this.index(x, y);
        const material = this.cells[index]!;
        if (material === SandCell.Empty || material === SandCell.Wall || material === SandCell.Wood || this.moved[index] === stamp) continue;
        if (this.react(x, y, material)) { this.moved[index] = stamp; continue; }
        if (material === SandCell.Fire || material === SandCell.Smoke) {
          const life = ++this.ages[index]!;
          if (life > (material === SandCell.Fire ? 25 : 65) + this.tones[index]! % 22) {
            this.set(x, y, material === SandCell.Fire ? SandCell.Smoke : SandCell.Empty);
            continue;
          }
        }
        if (material === SandCell.Lava && stamp % 4 !== 0) continue;
        if (material === SandCell.Stone && stamp % 2 !== 0) continue;
        if (material === SandCell.Smoke && stamp % 2 !== 0) continue;
        if ((this.impulseLife[index] ?? 0) > 0) {
          const ix = Math.sign(this.impulseX[index]!), iy = Math.sign(this.impulseY[index]!);
          this.impulseLife[index] = this.impulseLife[index]! - 1;
          if (this.move(x, y, x + ix, y + iy, stamp, false)) continue;
        }
        const rising = material === SandCell.Fire || material === SandCell.Smoke;
        const fx = rising ? -gx : gx, fy = rising ? -gy : gy;
        const swap = material === SandCell.Sand || material === SandCell.Stone || material === SandCell.Lava;
        const maxFall = material === SandCell.Sand || material === SandCell.Stone ? 4 : material === SandCell.Water ? 2 : 1;
        const intended = Math.min(maxFall, this.fallSpeed[index]! + 1);
        let traveled = 0;
        let currentX = x, currentY = y;
        while (traveled < intended && this.move(currentX,currentY,currentX+fx,currentY+fy,stamp,swap)) {
          currentX += fx; currentY += fy; traveled++;
        }
        if (traveled > 0) {
          this.fallSpeed[this.index(currentX,currentY)] = traveled === intended ? intended : 0;
          continue;
        }
        this.fallSpeed[index] = 0;
        if (material === SandCell.Stone) continue;
        const side = this.rng() < .5 ? 1 : -1;
        for (let attempt = 0; attempt < 2; attempt++) {
          const sign = attempt === 0 ? side : -side;
          const sx = sidewaysX * sign, sy = sidewaysY * sign;
          if (this.move(x, y, x + fx + sx, y + fy + sy, stamp, swap)) break;
          if (material === SandCell.Water || material === SandCell.Lava || material === SandCell.Smoke || material === SandCell.Fire) {
            const range = material === SandCell.Water ? 5 : material === SandCell.Lava ? 2 : 3;
            for (let distance = 1; distance <= range; distance++) {
              if (!this.inside(x + sx * distance, y + sy * distance) || this.at(x + sx * distance, y + sy * distance) !== SandCell.Empty) break;
              if (distance === range || this.at(x + sx * (distance + 1), y + sy * (distance + 1)) !== SandCell.Empty) {
                this.move(x, y, x + sx, y + sy, stamp, false);
                break;
              }
            }
            if (this.moved[index] === stamp) break;
          }
        }
      }
    }
  }
}

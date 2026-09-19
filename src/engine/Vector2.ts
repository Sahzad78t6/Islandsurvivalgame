// 2D Vector and Collision Utilities

export class Vector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v: Vector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  addScaled(v: Vector2, s: number): Vector2 {
    return new Vector2(this.x + v.x * s, this.y + v.y * s);
  }

  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  scale(s: number): Vector2 {
    return new Vector2(this.x * s, this.y * s);
  }

  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }

  distanceTo(v: Vector2): number {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  distanceToSq(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  lerp(v: Vector2, alpha: number): Vector2 {
    return new Vector2(
      this.x + (v.x - this.x) * alpha,
      this.y + (v.y - this.y) * alpha
    );
  }
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function checkAABBCollision(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function checkCircleCollision(
  x1: number, y1: number, r1: number,
  x2: number, y2: number, r2: number
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const distSq = dx * dx + dy * dy;
  const radSum = r1 + r2;
  return distSq <= radSum * radSum;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}


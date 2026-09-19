// 2D Camera with Lerp, Bounds Clamping, Screen Shake, and Multi-Target Framing

import { Vector2, clamp, lerp } from './Vector2';

export class Camera {
  public pos: Vector2 = new Vector2(0, 0);
  public targetPos: Vector2 = new Vector2(0, 0);
  public viewportWidth: number = 1280;
  public viewportHeight: number = 720;
  public zoom: number = 1.0;
  public minBounds: Vector2 = new Vector2(0, 0);
  public maxBounds: Vector2 = new Vector2(2000, 2000);

  // Screen shake
  private shakeTime: number = 0;
  private shakeIntensity: number = 0;
  public shakeOffset: Vector2 = new Vector2(0, 0);

  public baseZoom: number = 1.0;

  constructor(viewportWidth: number = 1280, viewportHeight: number = 720) {
    this.updateViewport(viewportWidth, viewportHeight);
  }

  public updateViewport(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    // Adaptive zoom: ensures adequate field of view on mobile (360px) up to 4K desktop
    const minDim = Math.min(viewportWidth, viewportHeight);
    const targetMinDim = 460; // target world units visible along shorter screen axis
    const calculatedZoom = clamp(minDim / targetMinDim, 0.75, 1.25);
    this.zoom = calculatedZoom;
    this.baseZoom = calculatedZoom;
  }

  public setBounds(minX: number, minY: number, maxX: number, maxY: number) {
    this.minBounds.set(minX, minY);
    this.maxBounds.set(maxX, maxY);
  }

  public setTarget(x: number, y: number) {
    this.targetPos.set(x, y);
  }

  public snapTo(x: number, y: number) {
    this.targetPos.set(x, y);
    this.pos.set(x, y);
  }

  public addShake(intensity: number, durationSeconds: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, durationSeconds);
  }

  public update(dt: number) {
    // Smooth camera lerp (smoother follow)
    const lerpFactor = 1.0 - Math.pow(0.001, dt);
    this.pos.x = lerp(this.pos.x, this.targetPos.x, lerpFactor);
    this.pos.y = lerp(this.pos.y, this.targetPos.y, lerpFactor);

    // Screen shake update
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const angle = Math.random() * Math.PI * 2;
      const dist = (this.shakeTime > 0 ? this.shakeIntensity : 0) * (this.shakeTime / 0.5);
      this.shakeOffset.set(Math.cos(angle) * dist, Math.sin(angle) * dist);
      if (this.shakeTime <= 0) {
        this.shakeIntensity = 0;
        this.shakeOffset.set(0, 0);
      }
    } else {
      this.shakeOffset.set(0, 0);
    }

    // Clamp camera within map bounds
    const halfW = (this.viewportWidth / 2) / this.zoom;
    const halfH = (this.viewportHeight / 2) / this.zoom;

    if (this.maxBounds.x - this.minBounds.x > this.viewportWidth / this.zoom) {
      this.pos.x = clamp(this.pos.x, this.minBounds.x + halfW, this.maxBounds.x - halfW);
    } else {
      this.pos.x = (this.minBounds.x + this.maxBounds.x) / 2;
    }

    if (this.maxBounds.y - this.minBounds.y > this.viewportHeight / this.zoom) {
      this.pos.y = clamp(this.pos.y, this.minBounds.y + halfH, this.maxBounds.y - halfH);
    } else {
      this.pos.y = (this.minBounds.y + this.maxBounds.y) / 2;
    }
  }

  public screenToWorld(screenX: number, screenY: number): Vector2 {
    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;
    const actualX = this.pos.x + this.shakeOffset.x;
    const actualY = this.pos.y + this.shakeOffset.y;

    const wx = actualX + (screenX - halfW) / this.zoom;
    const wy = actualY + (screenY - halfH) / this.zoom;
    return new Vector2(wx, wy);
  }

  public worldToScreen(worldX: number, worldY: number): Vector2 {
    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;
    const actualX = this.pos.x + this.shakeOffset.x;
    const actualY = this.pos.y + this.shakeOffset.y;

    const sx = (worldX - actualX) * this.zoom + halfW;
    const sy = (worldY - actualY) * this.zoom + halfH;
    return new Vector2(sx, sy);
  }

  public applyTransform(ctx: CanvasRenderingContext2D) {
    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;
    const actualX = this.pos.x + this.shakeOffset.x;
    const actualY = this.pos.y + this.shakeOffset.y;

    ctx.save();
    ctx.translate(halfW, halfH);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-actualX, -actualY);
  }

  public restoreTransform(ctx: CanvasRenderingContext2D) {
    ctx.restore();
  }
}


// Dynamic Weather Simulation Engine

import type { WeatherType } from '../types';
import { audioSystem } from './AudioSystem';
import { LightingSystem } from './LightingSystem';
import { Camera } from './Camera';

export interface WeatherDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  alpha: number;
}

export class WeatherSystem {
  public currentWeather: WeatherType = 'SUNNY';
  public targetWeather: WeatherType = 'SUNNY';
  public weatherTransition: number = 1.0;

  private drops: WeatherDrop[] = [];
  private thunderTimer: number = 0;
  private fogOffset: number = 0;

  constructor() {
    this.initDrops(250);
  }

  private initDrops(count: number) {
    this.drops = [];
    for (let i = 0; i < count; i++) {
      this.drops.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        vx: -60 - Math.random() * 40,
        vy: 400 + Math.random() * 200,
        len: 12 + Math.random() * 8,
        alpha: 0.4 + Math.random() * 0.4
      });
    }
  }

  public setWeather(weather: WeatherType) {
    this.currentWeather = weather;
    this.targetWeather = weather;
  }

  public update(
    dt: number,
    lighting: LightingSystem,
    camera: Camera,
    biome: string
  ) {
    this.fogOffset += dt * 15;

    audioSystem.updateBiomeAmbience(biome, this.currentWeather);

    if (this.currentWeather === 'RAIN' || this.currentWeather === 'STORM') {
      const isStorm = this.currentWeather === 'STORM';
      const count = isStorm ? 300 : 150;
      const windVx = isStorm ? -180 : -70;
      const speedVy = isStorm ? 750 : 500;

      for (let i = 0; i < count && i < this.drops.length; i++) {
        const d = this.drops[i];
        d.x += windVx * dt;
        d.y += speedVy * dt;

        if (d.y > camera.viewportHeight) {
          d.y = -20;
          d.x = Math.random() * (camera.viewportWidth + 400);
        }
        if (d.x < -100) {
          d.x = camera.viewportWidth + 100;
        }
      }

      if (isStorm) {
        this.thunderTimer -= dt;
        if (this.thunderTimer <= 0) {
          this.thunderTimer = 8 + Math.random() * 14;
          lighting.triggerLightning(1.0);
          camera.addShake(7, 0.4);
          audioSystem.playThunder();
        }
      }
    } else if (this.currentWeather === 'SNOW') {
      for (let i = 0; i < 120 && i < this.drops.length; i++) {
        const d = this.drops[i];
        d.x += (-50 + Math.sin(this.fogOffset * 0.1 + i) * 20) * dt;
        d.y += (70 + Math.cos(this.fogOffset * 0.08 + i) * 15) * dt;

        if (d.y > camera.viewportHeight) {
          d.y = -10;
          d.x = Math.random() * camera.viewportWidth;
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.currentWeather === 'RAIN' || this.currentWeather === 'STORM') {
      const isStorm = this.currentWeather === 'STORM';
      const count = isStorm ? 300 : 150;
      ctx.save();
      ctx.strokeStyle = isStorm ? 'rgba(180, 215, 255, 0.65)' : 'rgba(200, 230, 255, 0.45)';
      ctx.lineWidth = isStorm ? 1.5 : 1.0;
      ctx.beginPath();

      for (let i = 0; i < count && i < this.drops.length; i++) {
        const d = this.drops[i];
        if (d.x >= 0 && d.x <= width && d.y >= 0 && d.y <= height) {
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + (isStorm ? -6 : -3), d.y + d.len);
        }
      }
      ctx.stroke();
      ctx.restore();
    } else if (this.currentWeather === 'SNOW') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 120 && i < this.drops.length; i++) {
        const d = this.drops[i];
        if (d.x >= 0 && d.x <= width && d.y >= 0 && d.y <= height) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    } else if (this.currentWeather === 'FOG') {
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, 'rgba(200, 220, 230, 0.25)');
      grad.addColorStop(0.5, 'rgba(180, 205, 215, 0.4)');
      grad.addColorStop(1, 'rgba(210, 230, 240, 0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}


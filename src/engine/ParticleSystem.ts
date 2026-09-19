// Particle System & Floating Feedback Text Engine

import type { FloatingText } from '../types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  gravity?: number;
  friction?: number;
  shape?: 'CIRCLE' | 'SQUARE' | 'SPARK' | 'SMOKE' | 'RIPPLE';
  rot?: number;
  vRot?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  public update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.lifetime -= dt;
      if (p.lifetime <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.gravity) p.vy += p.gravity * dt;
      if (p.friction) {
        p.vx *= Math.pow(p.friction, dt * 60);
        p.vy *= Math.pow(p.friction, dt * 60);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.vRot) {
        p.rot = (p.rot || 0) + p.vRot * dt;
      }

      p.alpha = Math.max(0, p.lifetime / p.maxLifetime);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.lifetime -= dt;
      if (ft.lifetime <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'RIPPLE') {
        const radius = p.size * (1 + (1 - p.alpha) * 1.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, radius, radius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'SPARK') {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      } else if (p.shape === 'SMOKE') {
        const rad = p.size * (1 + (1 - p.alpha) * 2.0);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'SQUARE') {
        ctx.translate(p.x, p.y);
        if (p.rot) ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Render floating texts (world space)
    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1, ft.lifetime / (ft.maxLifetime * 0.3));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';

      // Outline shadow
      ctx.fillStyle = '#0a0d12';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillText(ft.text, ft.x - 1, ft.y - 1);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // --- SPAWN HELPERS ---

  public emitWoodSplinters(x: number, y: number, count: number = 8) {
    const colors = ['#8d5524', '#c68642', '#e0ac69', '#5c3a21'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 3,
        alpha: 1,
        lifetime: 0.4 + Math.random() * 0.3,
        maxLifetime: 0.7,
        gravity: 160,
        friction: 0.95,
        shape: 'SQUARE',
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 10
      });
    }
  }

  public emitStoneDust(x: number, y: number, count: number = 8) {
    const colors = ['#9e9e9e', '#757575', '#bdbdbd', '#e0e0e0'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 2.5,
        alpha: 1,
        lifetime: 0.35 + Math.random() * 0.25,
        maxLifetime: 0.6,
        gravity: 180,
        friction: 0.92,
        shape: 'SPARK'
      });
    }
  }

  public emitBushLeaves(x: number, y: number, count: number = 6) {
    const colors = ['#4caf50', '#81c784', '#2e7d32', '#ff5722'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 2,
        alpha: 1,
        lifetime: 0.5 + Math.random() * 0.3,
        maxLifetime: 0.8,
        gravity: 80,
        friction: 0.95,
        shape: 'SQUARE',
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 5
      });
    }
  }

  public emitWaterRipple(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: 'rgba(160, 225, 255, 0.7)',
      size: 10,
      alpha: 1,
      lifetime: 0.6,
      maxLifetime: 0.6,
      shape: 'RIPPLE'
    });
  }

  public emitCampfireParticles(x: number, y: number) {
    if (Math.random() < 0.4) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + 4,
        vx: (Math.random() - 0.5) * 20,
        vy: -35 - Math.random() * 35,
        color: Math.random() < 0.5 ? '#ff9800' : '#ffeb3b',
        size: 1.5 + Math.random() * 2,
        alpha: 1,
        lifetime: 0.8 + Math.random() * 0.6,
        maxLifetime: 1.4,
        shape: 'CIRCLE'
      });
    }
    if (Math.random() < 0.25) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y - 6,
        vx: (Math.random() - 0.5) * 10 + 5,
        vy: -20 - Math.random() * 15,
        color: 'rgba(80, 80, 80, 0.2)',
        size: 4 + Math.random() * 4,
        alpha: 0.5,
        lifetime: 1.2 + Math.random() * 0.8,
        maxLifetime: 2.0,
        shape: 'SMOKE'
      });
    }
  }

  public emitSnowFlurry(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      vx: -40 - Math.random() * 20,
      vy: 30 + Math.random() * 20,
      color: '#ffffff',
      size: 1.5 + Math.random() * 2,
      alpha: 0.8,
      lifetime: 1.2,
      maxLifetime: 1.2,
      shape: 'CIRCLE'
    });
  }

  public emitBeaconBeam(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y,
        vx: (Math.random() - 0.5) * 15,
        vy: -80 - Math.random() * 60,
        color: Math.random() < 0.5 ? '#00e5ff' : '#76ff03',
        size: 2.5,
        alpha: 1,
        lifetime: 0.9,
        maxLifetime: 0.9,
        shape: 'SPARK'
      });
    }
  }

  public emitFloatingText(text: string, x: number, y: number, color: string = '#4caf50') {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y: y - 10,
      color,
      lifetime: 1.2,
      maxLifetime: 1.2,
      vy: -28
    });
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}


// Island Wildlife AI (Crabs, Birds, Wild Boars, Snakes, Fish)

import { Vector2 } from '../engine/Vector2';
import { ParticleSystem } from '../engine/ParticleSystem';
import { audioSystem } from '../engine/AudioSystem';
import type { DropItem } from '../types';

export type WildlifeType = 'CRAB' | 'BIRD' | 'BOAR' | 'SNAKE' | 'FISH';

export class WildlifeEntity {
  public id: string;
  public type: WildlifeType;
  public pos: Vector2;
  public vel: Vector2 = new Vector2(0, 0);
  public speed: number = 40;
  public health: number = 30;
  public maxHealth: number = 30;
  public isDead: boolean = false;

  // AI state
  public state: 'IDLE' | 'WANDER' | 'FLEE' | 'CHARGE' = 'IDLE';
  public stateTimer: number = 0;
  public targetAngle: number = 0;
  public wanderDir: Vector2 = new Vector2(0, 0);
  public facingRight: boolean = true;
  public animTime: number = 0;

  // Combat
  public attackCooldown: number = 0;

  constructor(type: WildlifeType, x: number, y: number) {
    this.id = Math.random().toString();
    this.type = type;
    this.pos = new Vector2(x, y);

    switch (type) {
      case 'CRAB':
        this.speed = 25;
        this.health = 15;
        break;
      case 'BIRD':
        this.speed = 60;
        this.health = 10;
        break;
      case 'BOAR':
        this.speed = 70;
        this.health = 80;
        break;
      case 'SNAKE':
        this.speed = 40;
        this.health = 20;
        break;
      case 'FISH':
        this.speed = 30;
        this.health = 15;
        break;
    }
    this.maxHealth = this.health;
    this.stateTimer = 1 + Math.random() * 3;
  }

  public update(
    dt: number,
    players: { pos: Vector2; stats: { isDowned: boolean } }[],
    particles: ParticleSystem,
    _drops: DropItem[],
    onPlayerHit: (damage: number, isPoison: boolean) => void
  ) {
    if (this.isDead) return;

    this.animTime += dt * 6;
    this.stateTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Find closest living player
    let closestPlayer: { pos: Vector2; stats: { isDowned: boolean } } | null = null;
    let closestDistSq = Infinity;
    for (const p of players) {
      if (!p.stats.isDowned) {
        const dSq = this.pos.distanceToSq(p.pos);
        if (dSq < closestDistSq) {
          closestDistSq = dSq;
          closestPlayer = p;
        }
      }
    }

    const dist = Math.sqrt(closestDistSq);

    if (this.type === 'BOAR') {
      if (closestPlayer && dist < 120) {
        this.state = 'CHARGE';
        const dir = closestPlayer.pos.sub(this.pos).normalize();
        this.vel = dir.scale(this.speed * 1.6);
        this.facingRight = this.vel.x >= 0;

        if (dist < 26 && this.attackCooldown <= 0) {
          this.attackCooldown = 1.6;
          onPlayerHit(16, false);
          audioSystem.playPlayerHit();
          particles.emitFloatingText('-16 HP (BOAR CHARGE)', closestPlayer.pos.x, closestPlayer.pos.y - 15, '#f44336');
        }
      } else {
        this.updateWander();
      }
    } else if (this.type === 'SNAKE') {
      if (closestPlayer && dist < 42) {
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 2.5;
          onPlayerHit(12, true);
          audioSystem.playPlayerHit();
          particles.emitFloatingText('VENOMOUS BITE! (-12 HP)', closestPlayer.pos.x, closestPlayer.pos.y - 15, '#9c27b0');
        }
        const away = this.pos.sub(closestPlayer.pos).normalize();
        this.vel = away.scale(this.speed * 1.2);
      } else {
        this.updateWander();
      }
    } else if (this.type === 'BIRD' || this.type === 'CRAB') {
      if (closestPlayer && dist < 70) {
        this.state = 'FLEE';
        const away = this.pos.sub(closestPlayer.pos).normalize();
        this.vel = away.scale(this.speed * 1.5);
        this.facingRight = this.vel.x >= 0;
      } else {
        this.updateWander();
      }
    } else {
      this.updateWander();
    }

    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }

  private updateWander() {
    if (this.stateTimer <= 0) {
      if (Math.random() < 0.45) {
        this.state = 'IDLE';
        this.vel.set(0, 0);
        this.stateTimer = 1.5 + Math.random() * 2.5;
      } else {
        this.state = 'WANDER';
        const angle = Math.random() * Math.PI * 2;
        this.vel.set(Math.cos(angle) * this.speed * 0.5, Math.sin(angle) * this.speed * 0.5);
        this.facingRight = this.vel.x >= 0;
        this.stateTimer = 2 + Math.random() * 3;
      }
    }
  }

  public takeDamage(amount: number, drops: DropItem[], particles: ParticleSystem) {
    if (this.isDead) return;
    this.health -= amount;
    particles.emitStoneDust(this.pos.x, this.pos.y, 4);

    if (this.health <= 0) {
      this.isDead = true;
      audioSystem.playPlayerHit();

      if (this.type === 'BOAR') {
        drops.push({
          id: Math.random().toString(),
          itemId: 'raw_meat',
          quantity: 2,
          x: this.pos.x,
          y: this.pos.y,
          bobOffset: 0
        });
        particles.emitFloatingText('+2 RAW MEAT', this.pos.x, this.pos.y - 12, '#ff8a80');
      } else if (this.type === 'FISH') {
        drops.push({
          id: Math.random().toString(),
          itemId: 'fish',
          quantity: 1,
          x: this.pos.x,
          y: this.pos.y,
          bobOffset: 0
        });
        particles.emitFloatingText('+1 RAW FISH', this.pos.x, this.pos.y - 12, '#80deea');
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }

    if (this.type === 'BOAR') {
      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.ellipse(12, 1, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(17, 3, 4, 2);

      const legOffset = Math.sin(this.animTime) * 4;
      ctx.fillStyle = '#271915';
      ctx.fillRect(-10 + legOffset, 7, 4, 7);
      ctx.fillRect(6 - legOffset, 7, 4, 7);

      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(12, -2, 2, 2);
    } else if (this.type === 'CRAB') {
      ctx.fillStyle = '#e64a19';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d84315';
      ctx.beginPath();
      ctx.arc(8, -4, 4, 0, Math.PI * 2);
      ctx.arc(-8, -4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#bf360c';
      ctx.lineWidth = 1.5;
      const legWiggle = Math.sin(this.animTime * 1.5) * 2;
      ctx.strokeRect(-6 + legWiggle, 4, 12, 3);
    } else if (this.type === 'SNAKE') {
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      const wave = Math.sin(this.animTime) * 4;
      ctx.quadraticCurveTo(-2, wave, 6, 0);
      ctx.stroke();

      ctx.fillStyle = '#1b5e20';
      ctx.beginPath();
      ctx.arc(8, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'BIRD') {
      ctx.fillStyle = '#0288d1';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbc02d';
      ctx.fillRect(6, -1, 4, 2);
    } else if (this.type === 'FISH') {
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4081';
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(-12, -4);
      ctx.lineTo(-12, 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}


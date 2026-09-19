// Harvestable Resource Nodes (Trees, Rocks, Bushes, Springs, Crates)

import { ParticleSystem } from '../engine/ParticleSystem';
import { audioSystem } from '../engine/AudioSystem';
import type { DropItem } from '../types';

export type ResourceNodeType = 
  | 'PALM_TREE'
  | 'PINE_TREE'
  | 'JUNGLE_TREE'
  | 'ROCK'
  | 'BERRY_BUSH'
  | 'HERB_PATCH'
  | 'WATER_SPRING'
  | 'SUPPLY_CRATE'
  | 'RUIN_SCRAP';

export interface HarvestResult {
  itemId: string;
  count: number;
}

export class ResourceNode {
  public id: string;
  public type: ResourceNodeType;
  public x: number;
  public y: number;
  public radius: number = 24;
  public health: number = 100;
  public maxHealth: number = 100;
  public isDepleted: boolean = false;
  public shakeOffset: number = 0;
  public respawnTimer: number = 0;

  constructor(type: ResourceNodeType, x: number, y: number) {
    this.id = Math.random().toString();
    this.type = type;
    this.x = x;
    this.y = y;

    switch (type) {
      case 'PALM_TREE':
      case 'JUNGLE_TREE':
      case 'PINE_TREE':
        this.radius = 22;
        this.health = 60;
        break;
      case 'ROCK':
        this.radius = 20;
        this.health = 80;
        break;
      case 'BERRY_BUSH':
      case 'HERB_PATCH':
        this.radius = 16;
        this.health = 25;
        break;
      case 'WATER_SPRING':
        this.radius = 24;
        this.health = 99999;
        break;
      case 'SUPPLY_CRATE':
      case 'RUIN_SCRAP':
        this.radius = 20;
        this.health = 40;
        break;
    }
    this.maxHealth = this.health;
  }

  public hit(
    toolType: 'AXE' | 'PICKAXE' | 'NONE',
    gatherMultiplier: number,
    particles: ParticleSystem,
    drops: DropItem[]
  ): HarvestResult[] {
    if (this.isDepleted) return [];

    let damage = 20;
    if (this.type.includes('TREE')) {
      damage = toolType === 'AXE' ? 45 : 20;
      audioSystem.playChopWood();
      particles.emitWoodSplinters(this.x, this.y, 8);
    } else if (this.type === 'ROCK') {
      damage = toolType === 'PICKAXE' ? 45 : 15;
      audioSystem.playMineRock();
      particles.emitStoneDust(this.x, this.y, 8);
    } else if (this.type === 'BERRY_BUSH' || this.type === 'HERB_PATCH') {
      damage = 25;
      particles.emitBushLeaves(this.x, this.y, 6);
      audioSystem.playCollectItem();
    } else if (this.type === 'WATER_SPRING') {
      audioSystem.playDrink();
      particles.emitWaterRipple(this.x, this.y);
      return [{ itemId: 'clean_water', count: 1 }];
    } else if (this.type === 'SUPPLY_CRATE' || this.type === 'RUIN_SCRAP') {
      damage = toolType === 'PICKAXE' ? 40 : 25;
      audioSystem.playMineRock();
      particles.emitStoneDust(this.x, this.y, 6);
    }

    this.health -= damage;
    this.shakeOffset = 6;

    const results: HarvestResult[] = [];
    if (this.health <= 0) {
      this.isDepleted = true;
      this.health = 0;

      if (this.type === 'PALM_TREE') {
        const woodCount = Math.round(5 * gatherMultiplier);
        results.push({ itemId: 'wood', count: woodCount });
        results.push({ itemId: 'leaves', count: 3 });
        if (Math.random() < 0.6) results.push({ itemId: 'coconut', count: 2 });
      } else if (this.type === 'JUNGLE_TREE') {
        results.push({ itemId: 'wood', count: Math.round(7 * gatherMultiplier) });
        results.push({ itemId: 'leaves', count: 4 });
      } else if (this.type === 'PINE_TREE') {
        results.push({ itemId: 'wood', count: Math.round(6 * gatherMultiplier) });
      } else if (this.type === 'ROCK') {
        results.push({ itemId: 'stone', count: Math.round(5 * gatherMultiplier) });
        if (Math.random() < 0.35) results.push({ itemId: 'metal', count: 1 });
      } else if (this.type === 'BERRY_BUSH') {
        results.push({ itemId: 'berries', count: 4 });
        results.push({ itemId: 'leaves', count: 2 });
      } else if (this.type === 'HERB_PATCH') {
        results.push({ itemId: 'herbs', count: 2 });
      } else if (this.type === 'SUPPLY_CRATE') {
        results.push({ itemId: 'cloth', count: 3 });
        results.push({ itemId: 'metal', count: 2 });
        results.push({ itemId: 'rope', count: 1 });
      } else if (this.type === 'RUIN_SCRAP') {
        results.push({ itemId: 'metal', count: 4 });
        if (Math.random() < 0.5) results.push({ itemId: 'electronics', count: 1 });
      }

      for (const res of results) {
        particles.emitFloatingText(`+${res.count} ${res.itemId.toUpperCase().replace('_', ' ')}`, this.x, this.y - 15, '#81c784');
        drops.push({
          id: Math.random().toString(),
          itemId: res.itemId,
          quantity: res.count,
          x: this.x + (Math.random() - 0.5) * 20,
          y: this.y + (Math.random() - 0.5) * 20,
          bobOffset: Math.random() * Math.PI * 2
        });
      }
    } else {
      if (this.type.includes('TREE')) {
        results.push({ itemId: 'wood', count: 1 });
        particles.emitFloatingText('+1 WOOD', this.x, this.y - 10, '#c8e6c9');
      } else if (this.type === 'ROCK') {
        results.push({ itemId: 'stone', count: 1 });
        particles.emitFloatingText('+1 STONE', this.x, this.y - 10, '#cfd8dc');
      }
    }

    return results;
  }

  public update(dt: number) {
    if (this.shakeOffset > 0) {
      this.shakeOffset = Math.max(0, this.shakeOffset - dt * 25);
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const sx = this.x + (this.shakeOffset > 0 ? (Math.random() - 0.5) * this.shakeOffset : 0);
    const sy = this.y;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius * 0.7, this.radius * 1.1, this.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.isDepleted) {
      if (this.type.includes('TREE')) {
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.ellipse(sx, sy, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    if (this.type === 'PALM_TREE') {
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx - 8, sy - 28, sx - 2, sy - 54);
      ctx.stroke();

      const crownX = sx - 2;
      const crownY = sy - 54;

      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.arc(crownX - 4, crownY + 4, 4, 0, Math.PI * 2);
      ctx.arc(crownX + 4, crownY + 4, 4, 0, Math.PI * 2);
      ctx.fill();

      const angles = [-2.5, -1.8, -1.2, -0.6, 0.2, 0.9, 1.6, 2.3];
      ctx.fillStyle = '#388e3c';
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = 2;

      for (const a of angles) {
        ctx.beginPath();
        ctx.moveTo(crownX, crownY);
        const endX = crownX + Math.cos(a) * 36;
        const endY = crownY + Math.sin(a) * 22;
        const midX = crownX + Math.cos(a) * 20 - 4;
        const midY = crownY + Math.sin(a) * 14 - 8;
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();
      }
    } else if (this.type === 'JUNGLE_TREE') {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(sx - 7, sy - 36, 14, 38);

      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.arc(sx - 14, sy - 40, 24, 0, Math.PI * 2);
      ctx.arc(sx + 14, sy - 42, 26, 0, Math.PI * 2);
      ctx.arc(sx, sy - 58, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#43a047';
      ctx.beginPath();
      ctx.arc(sx - 8, sy - 44, 18, 0, Math.PI * 2);
      ctx.arc(sx + 10, sy - 46, 20, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'PINE_TREE') {
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(sx - 4, sy - 20, 8, 22);

      ctx.fillStyle = '#1b5e20';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 60);
      ctx.lineTo(sx + 18, sy - 34);
      ctx.lineTo(sx - 18, sy - 34);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(sx, sy - 44);
      ctx.lineTo(sx + 22, sy - 18);
      ctx.lineTo(sx - 22, sy - 18);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'ROCK') {
      ctx.fillStyle = '#616161';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#757575';
      ctx.beginPath();
      ctx.ellipse(sx - 4, sy - 4, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#9e9e9e';
      ctx.beginPath();
      ctx.ellipse(sx - 7, sy - 7, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'BERRY_BUSH') {
      ctx.fillStyle = '#388e3c';
      ctx.beginPath();
      ctx.arc(sx, sy, 16, 0, Math.PI * 2);
      ctx.arc(sx - 7, sy + 3, 12, 0, Math.PI * 2);
      ctx.arc(sx + 7, sy + 3, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e91e63';
      const berryOffsets = [
        [-5, -4], [4, -6], [-8, 4], [3, 5], [9, 0], [0, -1]
      ];
      for (const [bx, by] of berryOffsets) {
        ctx.beginPath();
        ctx.arc(sx + bx, sy + by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'HERB_PATCH') {
      ctx.fillStyle = '#8bc34a';
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7cb342';
      ctx.beginPath();
      ctx.arc(sx - 5, sy - 2, 8, 0, Math.PI * 2);
      ctx.arc(sx + 5, sy - 2, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e040fb';
      ctx.beginPath();
      ctx.arc(sx, sy - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'WATER_SPRING') {
      ctx.fillStyle = '#00838f';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 26, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#00bcd4';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 20, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      const r = 6 + (Math.sin(Date.now() * 0.005) + 1) * 5;
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === 'SUPPLY_CRATE') {
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(sx - 14, sy - 14, 28, 28);
      ctx.strokeStyle = '#8d6e63';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 14, sy - 14, 28, 28);
      ctx.fillStyle = '#ffb300';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CRATE', sx, sy + 4);
    } else if (this.type === 'RUIN_SCRAP') {
      ctx.fillStyle = '#546e7a';
      ctx.fillRect(sx - 16, sy - 10, 32, 20);
      ctx.fillStyle = '#78909c';
      ctx.fillRect(sx - 10, sy - 14, 20, 10);
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(sx - 12, sy - 4, 8, 4);
      ctx.fillRect(sx + 4, sy - 4, 8, 4);
    }

    ctx.restore();
  }
}


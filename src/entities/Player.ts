// Playable Survivor Characters, Movement, Stats, and Animations

import { Vector2, clamp } from '../engine/Vector2';
import type { CharacterClass, PlayerStats } from '../types';
import { Inventory, ITEM_DEFINITIONS } from '../systems/Inventory';
import { ParticleSystem } from '../engine/ParticleSystem';
import { audioSystem } from '../engine/AudioSystem';
import type { LightSource } from '../engine/LightingSystem';

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'jack',
    name: 'Jack Vance',
    title: 'The Survivalist',
    description: 'A rugged wilderness veteran with unmatched timber and mining expertise.',
    traitDescription: '+25% resource yield from trees and rocks.',
    bodyColor: '#37474f',
    hairColor: '#5d4037',
    accentColor: '#ff9800',
    maxHealth: 110,
    speedMultiplier: 1.0,
    gatherMultiplier: 1.25,
    craftSpeedMultiplier: 1.0,
    staminaRecoveryMultiplier: 1.0
  },
  {
    id: 'elena',
    name: 'Dr. Elena Rostova',
    title: 'Field Medic',
    description: 'Expedition doctor specialized in treating trauma and extracting medicine.',
    traitDescription: 'Heals 50% faster, revives teammates in 2s instead of 4s.',
    bodyColor: '#263238',
    hairColor: '#b71c1c',
    accentColor: '#e91e63',
    maxHealth: 100,
    speedMultiplier: 1.05,
    gatherMultiplier: 1.0,
    craftSpeedMultiplier: 1.1,
    staminaRecoveryMultiplier: 1.2
  },
  {
    id: 'leo',
    name: 'Leo Chen',
    title: 'Pathfinder Scout',
    description: 'Agile athlete who navigates treacherous terrain with swift endurance.',
    traitDescription: '+15% movement speed, 30% reduced stamina consumption.',
    bodyColor: '#1b5e20',
    hairColor: '#212121',
    accentColor: '#4caf50',
    maxHealth: 95,
    speedMultiplier: 1.18,
    gatherMultiplier: 1.0,
    craftSpeedMultiplier: 1.0,
    staminaRecoveryMultiplier: 1.4
  },
  {
    id: 'maya',
    name: 'Maya Lin',
    title: 'Civil Engineer',
    description: 'Resourceful structural designer who builds reinforced island fortifications.',
    traitDescription: 'Buildings have +30% health, crafts machinery 50% faster.',
    bodyColor: '#0d47a1',
    hairColor: '#ffb300',
    accentColor: '#00bcd4',
    maxHealth: 100,
    speedMultiplier: 1.0,
    gatherMultiplier: 1.1,
    craftSpeedMultiplier: 1.4,
    staminaRecoveryMultiplier: 1.0
  }
];

export class Player {
  public id: string;
  public playerIndex: number;
  public charClass: CharacterClass;
  public pos: Vector2;
  public vel: Vector2 = new Vector2(0, 0);
  public facing: Vector2 = new Vector2(0, 1);
  public radius: number = 14;

  // Stats
  public stats: PlayerStats;
  public inventory: Inventory;

  // Status effects
  public isPoisoned: boolean = false;
  public poisonTimer: number = 0;
  public isFreezing: boolean = false;

  // Animations & State
  public isMoving: boolean = false;
  public isSprinting: boolean = false;
  public animTimer: number = 0;
  public swingAnimTimer: number = 0;
  public hitFlashTimer: number = 0;
  public footstepTimer: number = 0;

  // Reviving interaction
  public revivingTeammate: Player | null = null;
  public reviveProgress: number = 0;

  // AI companion flag
  public isBot: boolean = false;
  public botActionTimer: number = 0;

  constructor(playerIndex: number, charClassId: string, spawnX: number, spawnY: number, isBot: boolean = false) {
    this.id = `player_${playerIndex + 1}`;
    this.playerIndex = playerIndex;
    this.charClass = CHARACTER_CLASSES.find(c => c.id === charClassId) || CHARACTER_CLASSES[playerIndex % CHARACTER_CLASSES.length];
    this.pos = new Vector2(spawnX, spawnY);
    this.isBot = isBot;

    this.stats = {
      health: this.charClass.maxHealth,
      maxHealth: this.charClass.maxHealth,
      hunger: 100,
      maxHunger: 100,
      thirst: 100,
      maxThirst: 100,
      stamina: 100,
      maxStamina: 100,
      isDowned: false,
      downedTimer: 35,
      isDead: false
    };

    this.inventory = new Inventory(16);
    this.giveStartingGear();
  }

  private giveStartingGear() {
    this.inventory.addItem('berries', 4);
    this.inventory.addItem('clean_water', 2);
    this.inventory.addItem('torch', 1);

    if (this.charClass.id === 'jack') {
      this.inventory.addItem('wood', 6);
      this.inventory.addItem('stone', 4);
    } else if (this.charClass.id === 'elena') {
      this.inventory.addItem('herbs', 3);
    } else if (this.charClass.id === 'maya') {
      this.inventory.addItem('rope', 2);
      this.inventory.addItem('metal', 2);
    }
  }

  public update(
    dt: number,
    inputDir: Vector2,
    sprintPressed: boolean,
    particles: ParticleSystem,
    nearFireOrWarmth: boolean,
    ambientTemp: number
  ) {
    if (this.stats.isDead) return;

    if (this.stats.isDowned) {
      this.stats.downedTimer -= dt;
      if (this.stats.downedTimer <= 0) {
        this.stats.isDead = true;
        this.stats.health = 0;
        particles.emitFloatingText('SURVIVOR LOST', this.pos.x, this.pos.y - 20, '#d32f2f');
      }

      const crawlSpeed = 22;
      this.vel = inputDir.scale(crawlSpeed);
      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;
      return;
    }

    this.stats.hunger = Math.max(0, this.stats.hunger - 0.22 * dt);
    this.stats.thirst = Math.max(0, this.stats.thirst - 0.38 * dt);

    this.isFreezing = ambientTemp <= 0 && !nearFireOrWarmth;
    if (this.isFreezing) {
      this.stats.stamina = Math.max(0, this.stats.stamina - 4 * dt);
      this.stats.health = Math.max(0, this.stats.health - 1.5 * dt);
    }

    if (this.isPoisoned) {
      this.poisonTimer -= dt;
      this.stats.health = Math.max(0, this.stats.health - 2.5 * dt);
      if (this.poisonTimer <= 0) this.isPoisoned = false;
    }

    if (this.stats.hunger <= 0) {
      this.stats.health = Math.max(0, this.stats.health - 2.0 * dt);
    }
    if (this.stats.thirst <= 0) {
      this.stats.health = Math.max(0, this.stats.health - 3.2 * dt);
    }

    if (this.stats.hunger > 75 && this.stats.thirst > 75 && this.stats.health < this.stats.maxHealth) {
      const healRate = (this.charClass.id === 'elena' ? 2.5 : 1.5) * dt;
      this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + healRate);
    }

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.stats.isDowned = true;
      this.stats.downedTimer = 35;
      audioSystem.playDownedAlarm();
      particles.emitFloatingText('DOWNED! HOLD [E] TO REVIVE', this.pos.x, this.pos.y - 20, '#ff1744');
      return;
    }

    let speed = 120 * this.charClass.speedMultiplier;
    this.isSprinting = false;

    if (inputDir.lengthSq() > 0.01) {
      this.facing.copy(inputDir.normalize());
      this.isMoving = true;

      if (sprintPressed && this.stats.stamina > 5) {
        this.isSprinting = true;
        speed *= 1.6;
        this.stats.stamina = Math.max(0, this.stats.stamina - 20 * dt);
      } else {
        this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + 8 * this.charClass.staminaRecoveryMultiplier * dt);
      }
    } else {
      this.isMoving = false;
      this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + 22 * this.charClass.staminaRecoveryMultiplier * dt);
    }

    this.vel = inputDir.scale(speed);
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    if (this.isMoving) {
      this.animTimer += dt * (this.isSprinting ? 14 : 9);
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = this.isSprinting ? 0.26 : 0.42;
        audioSystem.playFootstep('grass');
      }
    } else {
      this.animTimer += dt * 2.5;
    }

    if (this.swingAnimTimer > 0) {
      this.swingAnimTimer = Math.max(0, this.swingAnimTimer - dt * 4);
    }
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt * 3);
    }
  }

  public swingTool() {
    this.swingAnimTimer = 1.0;
  }

  public takeDamage(amount: number) {
    if (this.stats.isDead || this.stats.isDowned) return;
    this.stats.health = Math.max(0, this.stats.health - amount);
    this.hitFlashTimer = 1.0;
    audioSystem.playPlayerHit();
  }

  public eatItem(itemId: string, particles: ParticleSystem): boolean {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def || (def.category !== 'FOOD' && def.category !== 'WATER' && itemId !== 'herbs')) {
      return false;
    }

    if (this.inventory.removeItem(itemId, 1)) {
      if (def.hungerAmount) {
        this.stats.hunger = clamp(this.stats.hunger + def.hungerAmount, 0, this.stats.maxHunger);
        particles.emitFloatingText(`+${def.hungerAmount} HUNGER`, this.pos.x, this.pos.y - 15, '#ffb74d');
      }
      if (def.thirstAmount) {
        this.stats.thirst = clamp(this.stats.thirst + def.thirstAmount, 0, this.stats.maxThirst);
        particles.emitFloatingText(`+${def.thirstAmount} THIRST`, this.pos.x, this.pos.y - 15, '#4fc3f7');
      }
      if (def.healAmount) {
        this.stats.health = clamp(this.stats.health + def.healAmount, 0, this.stats.maxHealth);
        if (def.healAmount > 0) {
          particles.emitFloatingText(`+${def.healAmount} HP`, this.pos.x, this.pos.y - 20, '#81c784');
        }
      }

      if (itemId === 'herbs') {
        this.isPoisoned = false;
        particles.emitFloatingText('POISON CURED!', this.pos.x, this.pos.y - 25, '#8bc34a');
      }

      if (def.category === 'FOOD') audioSystem.playEat();
      else audioSystem.playDrink();

      return true;
    }
    return false;
  }

  public reviveOther(target: Player, dt: number, particles: ParticleSystem): boolean {
    if (!target.stats.isDowned || target.stats.isDead) return false;

    const reqTime = this.charClass.id === 'elena' ? 2.0 : 3.5;
    this.reviveProgress += dt;
    particles.emitWaterRipple(target.pos.x, target.pos.y);

    if (this.reviveProgress >= reqTime) {
      target.stats.isDowned = false;
      target.stats.health = Math.round(target.stats.maxHealth * 0.45);
      target.stats.hunger = Math.max(30, target.stats.hunger);
      target.stats.thirst = Math.max(30, target.stats.thirst);
      this.reviveProgress = 0;
      audioSystem.playRevived();
      particles.emitFloatingText('REVIVED!', target.pos.x, target.pos.y - 25, '#76ff03');
      return true;
    }
    return false;
  }

  public getLightSource(): LightSource | null {
    const active = this.inventory.getActiveItem();
    if (active) {
      if (active.itemId === 'torch') {
        return {
          x: this.pos.x,
          y: this.pos.y,
          radius: 170,
          intensity: 0.95,
          color: 'rgba(255, 160, 40, 0.45)',
          flicker: true
        };
      } else if (active.itemId === 'lantern') {
        return {
          x: this.pos.x,
          y: this.pos.y,
          radius: 260,
          intensity: 0.98,
          color: 'rgba(255, 220, 100, 0.5)',
          flicker: false
        };
      }
    }
    return {
      x: this.pos.x,
      y: this.pos.y,
      radius: 65,
      intensity: 0.5,
      color: 'rgba(180, 210, 240, 0.15)',
      flicker: false
    };
  }

  public render(ctx: CanvasRenderingContext2D) {
    if (this.stats.isDead) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.stats.isDowned) {
      ctx.fillStyle = '#ff1744';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DOWNED', 0, -22);

      ctx.fillStyle = this.charClass.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 2, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffcc80';
      ctx.beginPath();
      ctx.arc(10, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    const bob = Math.sin(this.animTimer) * 2;
    const legSwing = Math.sin(this.animTimer) * 4;

    ctx.fillStyle = '#263238';
    ctx.fillRect(-6 + legSwing, 4, 4, 8);
    ctx.fillRect(2 - legSwing, 4, 4, 8);

    ctx.fillStyle = this.charClass.bodyColor;
    ctx.beginPath();
    ctx.roundRect(-8, -12 + bob, 16, 17, 3);
    ctx.fill();

    ctx.fillStyle = this.charClass.accentColor;
    ctx.fillRect(-3, -10 + bob, 6, 12);

    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, -18 + bob, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.charClass.hairColor;
    ctx.beginPath();
    ctx.arc(0, -20 + bob, 7, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#212121';
    const lookX = this.facing.x * 2.5;
    const lookY = this.facing.y * 2.5;
    ctx.fillRect(-2 + lookX, -19 + bob + lookY, 1.5, 1.5);
    ctx.fillRect(1 + lookX, -19 + bob + lookY, 1.5, 1.5);

    const activeStack = this.inventory.getActiveItem();
    if (activeStack) {
      const def = ITEM_DEFINITIONS[activeStack.itemId];
      const swingAngle = this.swingAnimTimer > 0 ? (1 - this.swingAnimTimer) * Math.PI : 0;

      ctx.save();
      ctx.translate(8, -6 + bob);
      ctx.rotate(swingAngle);

      if (def && def.toolType === 'AXE') {
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -10);
        ctx.stroke();
        ctx.fillStyle = '#78909c';
        ctx.fillRect(6, -14, 6, 6);
      } else if (def && def.toolType === 'PICKAXE') {
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(8, -10);
        ctx.stroke();
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.moveTo(5, -15);
        ctx.lineTo(13, -12);
        ctx.lineTo(6, -8);
        ctx.closePath();
        ctx.fill();
      } else if (def && def.toolType === 'TORCH') {
        ctx.strokeStyle = '#6d4c41';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(6, -10);
        ctx.stroke();
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(6, -12, 4 + Math.sin(Date.now() * 0.02) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`P${this.playerIndex + 1}: ${this.charClass.name.split(' ')[0]}`, 0, -30);

    const hpRatio = this.stats.health / this.stats.maxHealth;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-14, -28, 28, 3.5);
    ctx.fillStyle = hpRatio > 0.4 ? '#4caf50' : hpRatio > 0.2 ? '#ff9800' : '#f44336';
    ctx.fillRect(-13, -27.5, 26 * hpRatio, 2.5);

    ctx.restore();
  }
}


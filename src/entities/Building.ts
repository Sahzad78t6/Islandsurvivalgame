// Buildable Structures and Grid Placement System

import type { BuildingDef, ItemStack } from '../types';
import { Inventory } from '../systems/Inventory';
import { audioSystem } from '../engine/AudioSystem';
import { ParticleSystem } from '../engine/ParticleSystem';

export const BUILDING_DEFINITIONS: Record<string, BuildingDef> = {
  campfire: {
    id: 'campfire',
    name: 'Campfire',
    description: 'Provides radiant light, warmth, and a cooking/purification station.',
    category: 'UTILITY',
    width: 32,
    height: 32,
    ingredients: [
      { itemId: 'wood', quantity: 8 },
      { itemId: 'stone', quantity: 4 }
    ],
    maxHealth: 100,
    color: '#ff5722'
  },
  water_purifier: {
    id: 'water_purifier',
    name: 'Water Purifier',
    description: 'Slowly condenses clean drinking water from mist and rain.',
    category: 'UTILITY',
    width: 32,
    height: 32,
    ingredients: [
      { itemId: 'wood', quantity: 4 },
      { itemId: 'stone', quantity: 6 },
      { itemId: 'metal', quantity: 2 }
    ],
    maxHealth: 120,
    color: '#00bcd4'
  },
  shelter_small: {
    id: 'shelter_small',
    name: 'Basic Lean-To Shelter',
    description: 'Simple shelter made of timber and thatch. Protects from rain and hypothermia.',
    category: 'SHELTER',
    width: 64,
    height: 48,
    ingredients: [
      { itemId: 'wood', quantity: 12 },
      { itemId: 'leaves', quantity: 8 }
    ],
    maxHealth: 150,
    color: '#795548'
  },
  shelter_large: {
    id: 'shelter_large',
    name: 'Reinforced Cabin',
    description: 'Sturdy multi-person shelter that shelters the entire co-op team.',
    category: 'SHELTER',
    width: 80,
    height: 64,
    ingredients: [
      { itemId: 'wood', quantity: 20 },
      { itemId: 'leaves', quantity: 14 },
      { itemId: 'rope', quantity: 4 }
    ],
    maxHealth: 300,
    color: '#4e342e'
  },
  storage_box: {
    id: 'storage_box',
    name: 'Storage Chest',
    description: 'Shared co-op container to store up to 12 item stacks for the team.',
    category: 'UTILITY',
    width: 32,
    height: 32,
    ingredients: [
      { itemId: 'wood', quantity: 10 },
      { itemId: 'rope', quantity: 2 }
    ],
    maxHealth: 100,
    color: '#8d6e63'
  },
  workbench: {
    id: 'workbench',
    name: 'Crafting Workbench',
    description: 'Equipped work table needed to assemble complex machinery and electronics.',
    category: 'UTILITY',
    width: 48,
    height: 32,
    ingredients: [
      { itemId: 'wood', quantity: 8 },
      { itemId: 'stone', quantity: 4 }
    ],
    maxHealth: 120,
    color: '#a1887f'
  },
  watchtower: {
    id: 'watchtower',
    name: 'Lookout Tower',
    description: 'Elevated platform that unveils landmarks and danger on the minimap.',
    category: 'DEFENSE',
    width: 48,
    height: 48,
    ingredients: [
      { itemId: 'wood', quantity: 16 },
      { itemId: 'rope', quantity: 4 }
    ],
    maxHealth: 200,
    color: '#5d4037'
  },
  emergency_beacon: {
    id: 'emergency_beacon',
    name: 'Emergency Radio Beacon',
    description: 'Transmits distress coordinates to rescue aircraft.',
    category: 'EXTRACTION',
    width: 48,
    height: 48,
    ingredients: [
      { itemId: 'metal', quantity: 8 },
      { itemId: 'electronics', quantity: 4 },
      { itemId: 'fuel', quantity: 1 }
    ],
    maxHealth: 250,
    color: '#00e5ff'
  }
};

export class BuildingInstance {
  public id: string;
  public defId: string;
  public x: number;
  public y: number;
  public health: number;
  public maxHealth: number;
  public storage: (ItemStack | null)[] = [];
  public waterStored: number = 0;
  public maxWater: number = 5;
  public isLit: boolean = true;

  constructor(defId: string, x: number, y: number) {
    this.id = Math.random().toString();
    this.defId = defId;
    this.x = x;
    this.y = y;
    const def = BUILDING_DEFINITIONS[defId];
    this.health = def ? def.maxHealth : 100;
    this.maxHealth = this.health;

    if (defId === 'storage_box') {
      this.storage = new Array(12).fill(null);
    }
  }

  public update(dt: number, weather: string, particles: ParticleSystem) {
    if (this.defId === 'campfire' && this.isLit) {
      particles.emitCampfireParticles(this.x + 16, this.y + 16);
    }

    if (this.defId === 'water_purifier') {
      const fillRate = weather === 'RAIN' || weather === 'STORM' ? 0.2 : 0.05;
      this.waterStored = Math.min(this.maxWater, this.waterStored + fillRate * dt);
    }

    if (this.defId === 'emergency_beacon') {
      particles.emitBeaconBeam(this.x + 24, this.y + 10);
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const def = BUILDING_DEFINITIONS[this.defId];
    if (!def) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(this.x + def.width / 2, this.y + def.height - 2, def.width * 0.55, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.defId === 'campfire') {
      ctx.fillStyle = '#616161';
      ctx.beginPath();
      ctx.arc(this.x + 16, this.y + 18, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#424242';
      ctx.beginPath();
      ctx.arc(this.x + 16, this.y + 18, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.x + 8, this.y + 12);
      ctx.lineTo(this.x + 24, this.y + 24);
      ctx.moveTo(this.x + 24, this.y + 12);
      ctx.lineTo(this.x + 8, this.y + 24);
      ctx.stroke();

      if (this.isLit) {
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(this.x + 16, this.y + 16, 6 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(this.x + 16, this.y + 15, 3 + Math.sin(Date.now() * 0.015) * 1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.defId === 'water_purifier') {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(this.x + 4, this.y + 12, 4, 18);
      ctx.fillRect(this.x + 24, this.y + 12, 4, 18);

      ctx.fillStyle = '#78909c';
      ctx.beginPath();
      ctx.roundRect(this.x + 2, this.y + 4, 28, 16, 4);
      ctx.fill();

      if (this.waterStored > 0.5) {
        ctx.fillStyle = '#00bcd4';
        ctx.fillRect(this.x + 6, this.y + 8, 20 * (this.waterStored / this.maxWater), 8);
      }
      ctx.fillStyle = '#cfd8dc';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(this.waterStored)}/5`, this.x + 16, this.y + 15);
    } else if (this.defId === 'shelter_small') {
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(this.x + 6, this.y + 20, 6, 24);
      ctx.fillRect(this.x + 52, this.y + 20, 6, 24);

      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.moveTo(this.x + 32, this.y + 4);
      ctx.lineTo(this.x + 62, this.y + 32);
      ctx.lineTo(this.x + 2, this.y + 32);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (this.defId === 'shelter_large') {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(this.x + 4, this.y + 18, 72, 42);

      ctx.fillStyle = '#211714';
      ctx.fillRect(this.x + 30, this.y + 34, 20, 26);

      ctx.fillStyle = '#6d4c41';
      ctx.beginPath();
      ctx.moveTo(this.x + 40, this.y + 2);
      ctx.lineTo(this.x + 78, this.y + 22);
      ctx.lineTo(this.x + 2, this.y + 22);
      ctx.closePath();
      ctx.fill();
    } else if (this.defId === 'storage_box') {
      ctx.fillStyle = '#8d5524';
      ctx.fillRect(this.x + 4, this.y + 8, 24, 20);
      ctx.strokeStyle = '#5c3a21';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x + 4, this.y + 8, 24, 20);

      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(this.x + 13, this.y + 14, 6, 6);
    } else if (this.defId === 'workbench') {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(this.x + 4, this.y + 14, 5, 16);
      ctx.fillRect(this.x + 39, this.y + 14, 5, 16);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(this.x + 2, this.y + 6, 44, 12);
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(this.x + 8, this.y + 8, 8, 3);
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(this.x + 24, this.y + 8, 12, 4);
    } else if (this.defId === 'emergency_beacon') {
      ctx.fillStyle = '#37474f';
      ctx.fillRect(this.x + 14, this.y + 20, 20, 24);
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(this.x + 24, this.y + 20);
      ctx.lineTo(this.x + 24, this.y + 6);
      ctx.stroke();
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(this.x + 24, this.y + 6, 4 + Math.sin(Date.now() * 0.008) * 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = def.color;
      ctx.fillRect(this.x, this.y, def.width, def.height);
    }

    ctx.restore();
  }
}

export class BuildingSystem {
  public static canBuild(def: BuildingDef, inventory: Inventory): boolean {
    for (const ing of def.ingredients) {
      if (inventory.getItemCount(ing.itemId) < ing.quantity) {
        return false;
      }
    }
    return true;
  }

  public static placeBuilding(
    def: BuildingDef,
    gridX: number,
    gridY: number,
    inventory: Inventory,
    buildings: BuildingInstance[],
    particles: ParticleSystem
  ): BuildingInstance | null {
    if (!this.canBuild(def, inventory)) return null;

    for (const ing of def.ingredients) {
      inventory.removeItem(ing.itemId, ing.quantity);
    }

    const b = new BuildingInstance(def.id, gridX, gridY);
    buildings.push(b);

    audioSystem.playBuildPlacement();
    particles.emitWoodSplinters(gridX + def.width / 2, gridY + def.height / 2, 12);
    particles.emitFloatingText(`BUILT ${def.name.toUpperCase()}`, gridX + def.width / 2, gridY, '#4caf50');

    return b;
  }
}


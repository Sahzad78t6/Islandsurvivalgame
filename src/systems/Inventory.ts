// Item Definitions and Inventory Management

import type { ItemDef, ItemStack, DropItem } from '../types';
import { audioSystem } from '../engine/AudioSystem';

export const ITEM_DEFINITIONS: Record<string, ItemDef> = {
  wood: {
    id: 'wood',
    name: 'Wood',
    description: 'Sturdy timber gathered from island trees. Essential for tools and shelters.',
    category: 'RESOURCE',
    stackSize: 50,
    weight: 0.5,
    iconColor: '#8d5524',
    iconSymbol: '🪵'
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    description: 'Dense rock mined from boulders. Used for heavy structures and stone tools.',
    category: 'RESOURCE',
    stackSize: 50,
    weight: 0.8,
    iconColor: '#9e9e9e',
    iconSymbol: '🪨'
  },
  leaves: {
    id: 'leaves',
    name: 'Plant Fiber / Leaves',
    description: 'Flexible foliage and natural fibers. Used to weave rope and craft roofs.',
    category: 'RESOURCE',
    stackSize: 60,
    weight: 0.1,
    iconColor: '#4caf50',
    iconSymbol: '🌿'
  },
  rope: {
    id: 'rope',
    name: 'Woven Rope',
    description: 'Strong cord braided from plant fibers. Crucial for advanced tools and construction.',
    category: 'RESOURCE',
    stackSize: 30,
    weight: 0.3,
    iconColor: '#d7ccc8',
    iconSymbol: '🪢'
  },
  berries: {
    id: 'berries',
    name: 'Wild Berries',
    description: 'Sweet, edible island berries. Satisfies slight hunger and thirst.',
    category: 'FOOD',
    stackSize: 30,
    weight: 0.1,
    iconColor: '#e91e63',
    iconSymbol: '🫐',
    hungerAmount: 18,
    thirstAmount: 10,
    healAmount: 4
  },
  coconut: {
    id: 'coconut',
    name: 'Fresh Coconut',
    description: 'Nutritious coconut cracked open. Provides both delicious meat and pure water.',
    category: 'FOOD',
    stackSize: 20,
    weight: 0.4,
    iconColor: '#795548',
    iconSymbol: '🥥',
    hungerAmount: 25,
    thirstAmount: 30,
    healAmount: 8
  },
  raw_meat: {
    id: 'raw_meat',
    name: 'Raw Meat',
    description: 'Fresh game meat. Should be cooked over a campfire before eating.',
    category: 'FOOD',
    stackSize: 15,
    weight: 0.6,
    iconColor: '#b71c1c',
    iconSymbol: '🥩',
    hungerAmount: 12,
    healAmount: -5
  },
  cooked_meat: {
    id: 'cooked_meat',
    name: 'Cooked Meat',
    description: 'Tender, fire-roasted meat. High protein nutrition.',
    category: 'FOOD',
    stackSize: 20,
    weight: 0.5,
    iconColor: '#d84315',
    iconSymbol: '🍖',
    hungerAmount: 55,
    thirstAmount: -5,
    healAmount: 25
  },
  fish: {
    id: 'fish',
    name: 'Raw Fish',
    description: 'Freshly caught river fish. Best cooked on a campfire.',
    category: 'FOOD',
    stackSize: 20,
    weight: 0.4,
    iconColor: '#00acc1',
    iconSymbol: '🐟',
    hungerAmount: 20,
    healAmount: 5
  },
  cooked_fish: {
    id: 'cooked_fish',
    name: 'Cooked Fish',
    description: 'Nutritious grilled fish. Restores significant hunger and health.',
    category: 'FOOD',
    stackSize: 20,
    weight: 0.35,
    iconColor: '#ff8f00',
    iconSymbol: '🍱',
    hungerAmount: 45,
    thirstAmount: 5,
    healAmount: 20
  },
  dirty_water: {
    id: 'dirty_water',
    name: 'River Water (Untreated)',
    description: 'Murky water from a river or pond. Drink only in emergencies or purify over fire.',
    category: 'WATER',
    stackSize: 10,
    weight: 0.5,
    iconColor: '#8d6e63',
    iconSymbol: '🍶',
    thirstAmount: 25,
    healAmount: -8
  },
  clean_water: {
    id: 'clean_water',
    name: 'Purified Water',
    description: 'Crystal-clear boiled and filtered drinking water. Refreshes immediately.',
    category: 'WATER',
    stackSize: 15,
    weight: 0.5,
    iconColor: '#29b6f6',
    iconSymbol: '💧',
    thirstAmount: 55,
    healAmount: 10
  },
  herbs: {
    id: 'herbs',
    name: 'Medicinal Herbs',
    description: 'Rare healing plants found in forest shade. Neutralizes poison and restores health.',
    category: 'RESOURCE',
    stackSize: 25,
    weight: 0.1,
    iconColor: '#8bc34a',
    iconSymbol: '🌱',
    healAmount: 30
  },
  metal: {
    id: 'metal',
    name: 'Scrap Metal',
    description: 'Salvaged metal plates and piping from island wreckage and ruined structures.',
    category: 'RESOURCE',
    stackSize: 40,
    weight: 0.9,
    iconColor: '#78909c',
    iconSymbol: '⚙️'
  },
  cloth: {
    id: 'cloth',
    name: 'Canvas Cloth',
    description: 'Sturdy fabric salvaged from sails or tents. Useful for backpacks and warm gear.',
    category: 'RESOURCE',
    stackSize: 30,
    weight: 0.2,
    iconColor: '#fff9c4',
    iconSymbol: '🧣'
  },
  fuel: {
    id: 'fuel',
    name: 'Fuel Canister',
    description: 'High-octane fuel for generators and emergency power systems.',
    category: 'RESOURCE',
    stackSize: 10,
    weight: 2.0,
    iconColor: '#f44336',
    iconSymbol: '⛽'
  },
  electronics: {
    id: 'electronics',
    name: 'Transmitter Parts',
    description: 'Circuits, quartz crystals, and radio valves for long-range communication.',
    category: 'SPECIAL',
    stackSize: 10,
    weight: 0.5,
    iconColor: '#ba68c8',
    iconSymbol: '📻'
  },
  axe: {
    id: 'axe',
    name: 'Stone Axe',
    description: 'Handcrafted axe. Chops trees and wooden barriers twice as fast.',
    category: 'TOOL',
    stackSize: 1,
    weight: 1.5,
    iconColor: '#a1887f',
    iconSymbol: '🪓',
    toolType: 'AXE',
    toolPower: 2.5,
    durability: 120
  },
  pickaxe: {
    id: 'pickaxe',
    name: 'Stone Pickaxe',
    description: 'Heavy pointed pick. Cracks open boulders, caves, and metal debris.',
    category: 'TOOL',
    stackSize: 1,
    weight: 1.8,
    iconColor: '#90a4ae',
    iconSymbol: '⛏️',
    toolType: 'PICKAXE',
    toolPower: 2.5,
    durability: 120
  },
  fishing_rod: {
    id: 'fishing_rod',
    name: 'Fishing Rod',
    description: 'Simple rod and line for catching fish in rivers and coastal lagoons.',
    category: 'TOOL',
    stackSize: 1,
    weight: 0.8,
    iconColor: '#bcaaa4',
    iconSymbol: '🎣',
    toolType: 'ROD',
    toolPower: 1.0,
    durability: 60
  },
  torch: {
    id: 'torch',
    name: 'Wooden Torch',
    description: 'A pine tar stick that emits light in darkness and keeps dangerous beasts at bay.',
    category: 'EQUIPMENT',
    stackSize: 5,
    weight: 0.4,
    iconColor: '#ffb74d',
    iconSymbol: '🔥',
    toolType: 'TORCH',
    durability: 200
  },
  lantern: {
    id: 'lantern',
    name: "Miner's Lantern",
    description: 'Refined oil lantern. Emits a wide, steady 360-degree beam of light.',
    category: 'EQUIPMENT',
    stackSize: 1,
    weight: 1.2,
    iconColor: '#ffd54f',
    iconSymbol: '🏮'
  },
  backpack: {
    id: 'backpack',
    name: 'Canvas Backpack',
    description: 'Reinforced rucksack. Increases inventory capacity by +8 slots and +20kg weight.',
    category: 'EQUIPMENT',
    stackSize: 1,
    weight: 0.5,
    iconColor: '#6d4c41',
    iconSymbol: '🎒'
  },
  protective_vest: {
    id: 'protective_vest',
    name: 'Protective Vest',
    description: 'Layered leather and canvas vest. Absorbs animal attacks and insulates from freezing.',
    category: 'EQUIPMENT',
    stackSize: 1,
    weight: 1.8,
    iconColor: '#546e7a',
    iconSymbol: '🦺'
  }
};

export class Inventory {
  public slots: (ItemStack | null)[] = [];
  public maxSlots: number = 16;
  public maxWeight: number = 35;
  public selectedHotbarIndex: number = 0;

  constructor(slotsCount: number = 16) {
    this.maxSlots = slotsCount;
    this.slots = new Array(this.maxSlots).fill(null);
  }

  public getTotalWeight(): number {
    let total = 0;
    for (const stack of this.slots) {
      if (stack) {
        const def = ITEM_DEFINITIONS[stack.itemId];
        if (def) total += def.weight * stack.quantity;
      }
    }
    return Math.round(total * 10) / 10;
  }

  public addItem(itemId: string, quantity: number = 1): number {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return quantity;

    let remaining = quantity;

    for (let i = 0; i < this.slots.length; i++) {
      const stack = this.slots[i];
      if (stack && stack.itemId === itemId && stack.quantity < def.stackSize) {
        const space = def.stackSize - stack.quantity;
        const addAmt = Math.min(space, remaining);
        stack.quantity += addAmt;
        remaining -= addAmt;
        if (remaining <= 0) break;
      }
    }

    if (remaining > 0) {
      for (let i = 0; i < this.slots.length; i++) {
        if (!this.slots[i]) {
          const addAmt = Math.min(def.stackSize, remaining);
          this.slots[i] = { itemId, quantity: addAmt };
          remaining -= addAmt;
          if (remaining <= 0) break;
        }
      }
    }

    return remaining;
  }

  public removeItem(itemId: string, quantity: number = 1): boolean {
    if (this.getItemCount(itemId) < quantity) return false;

    let needed = quantity;
    for (let i = this.slots.length - 1; i >= 0; i--) {
      const stack = this.slots[i];
      if (stack && stack.itemId === itemId) {
        if (stack.quantity <= needed) {
          needed -= stack.quantity;
          this.slots[i] = null;
        } else {
          stack.quantity -= needed;
          needed = 0;
        }
        if (needed <= 0) break;
      }
    }
    return true;
  }

  public getItemCount(itemId: string): number {
    let count = 0;
    for (const stack of this.slots) {
      if (stack && stack.itemId === itemId) {
        count += stack.quantity;
      }
    }
    return count;
  }

  public hasItem(itemId: string, count: number = 1): boolean {
    return this.getItemCount(itemId) >= count;
  }

  public getActiveItem(): ItemStack | null {
    if (this.selectedHotbarIndex >= 0 && this.selectedHotbarIndex < 6) {
      return this.slots[this.selectedHotbarIndex];
    }
    return null;
  }

  public dropSlot(
    slotIndex: number,
    worldX: number,
    worldY: number,
    dropList: DropItem[]
  ): boolean {
    const stack = this.slots[slotIndex];
    if (!stack) return false;

    dropList.push({
      id: Math.random().toString(),
      itemId: stack.itemId,
      quantity: stack.quantity,
      x: worldX + (Math.random() - 0.5) * 30,
      y: worldY + (Math.random() - 0.5) * 30,
      bobOffset: Math.random() * Math.PI * 2
    });

    this.slots[slotIndex] = null;
    audioSystem.playCollectItem();
    return true;
  }

  public upgradeBackpack() {
    this.maxSlots = 24;
    this.maxWeight = 55;
    while (this.slots.length < this.maxSlots) {
      this.slots.push(null);
    }
  }
}


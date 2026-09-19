// Crafting Recipes and Recipe Verification System

import type { CraftingRecipe } from '../types';
import { Inventory } from './Inventory';
import { audioSystem } from '../engine/AudioSystem';

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // --- SURVIVAL ---
  {
    id: 'rope',
    name: 'Woven Rope',
    category: 'SURVIVAL',
    description: 'Braid fibrous palm leaves into strong utility rope.',
    ingredients: [
      { itemId: 'leaves', quantity: 3 }
    ],
    resultItemId: 'rope',
    resultQuantity: 1,
    craftTimeSeconds: 1.0
  },
  {
    id: 'cooked_meat',
    name: 'Cook Meat (Roast)',
    category: 'SURVIVAL',
    description: 'Roast raw game meat over embers. High protein meal.',
    ingredients: [
      { itemId: 'raw_meat', quantity: 1 },
      { itemId: 'wood', quantity: 1 }
    ],
    resultItemId: 'cooked_meat',
    resultQuantity: 1,
    craftTimeSeconds: 2.0
  },
  {
    id: 'cooked_fish',
    name: 'Cook Fish (Roast)',
    category: 'SURVIVAL',
    description: 'Crisp, fire-grilled fish fillet.',
    ingredients: [
      { itemId: 'fish', quantity: 1 },
      { itemId: 'wood', quantity: 1 }
    ],
    resultItemId: 'cooked_fish',
    resultQuantity: 1,
    craftTimeSeconds: 2.0
  },
  {
    id: 'boil_water',
    name: 'Purify Water (Boil)',
    category: 'SURVIVAL',
    description: 'Boil murky river water to kill bacteria and parasites.',
    ingredients: [
      { itemId: 'dirty_water', quantity: 1 },
      { itemId: 'wood', quantity: 1 }
    ],
    resultItemId: 'clean_water',
    resultQuantity: 1,
    craftTimeSeconds: 2.0
  },
  {
    id: 'herbal_medicine',
    name: 'Medicinal Salve',
    category: 'SURVIVAL',
    description: 'Crushed forest herbs blended into a potent healing ointment.',
    ingredients: [
      { itemId: 'herbs', quantity: 2 },
      { itemId: 'clean_water', quantity: 1 }
    ],
    resultItemId: 'herbs',
    resultQuantity: 2,
    craftTimeSeconds: 2.5
  },

  // --- TOOLS ---
  {
    id: 'craft_axe',
    name: 'Stone Axe',
    category: 'TOOLS',
    description: 'A sharp stone lashed to a sturdy hardwood branch.',
    ingredients: [
      { itemId: 'wood', quantity: 4 },
      { itemId: 'stone', quantity: 3 },
      { itemId: 'rope', quantity: 1 }
    ],
    resultItemId: 'axe',
    resultQuantity: 1,
    craftTimeSeconds: 2.5
  },
  {
    id: 'craft_pickaxe',
    name: 'Stone Pickaxe',
    category: 'TOOLS',
    description: 'Heavy pointed stone pick for breaking boulders and ore.',
    ingredients: [
      { itemId: 'wood', quantity: 4 },
      { itemId: 'stone', quantity: 5 },
      { itemId: 'rope', quantity: 2 }
    ],
    resultItemId: 'pickaxe',
    resultQuantity: 1,
    craftTimeSeconds: 2.5
  },
  {
    id: 'craft_rod',
    name: 'Fishing Rod',
    category: 'TOOLS',
    description: 'Bendable branch with braided rope line for catching river fish.',
    ingredients: [
      { itemId: 'wood', quantity: 3 },
      { itemId: 'rope', quantity: 2 }
    ],
    resultItemId: 'fishing_rod',
    resultQuantity: 1,
    craftTimeSeconds: 2.0
  },
  {
    id: 'craft_torch',
    name: 'Torch',
    category: 'TOOLS',
    description: 'Wood wrapped in dry leaves and resin. Illuminates dark areas.',
    ingredients: [
      { itemId: 'wood', quantity: 2 },
      { itemId: 'leaves', quantity: 2 }
    ],
    resultItemId: 'torch',
    resultQuantity: 2,
    craftTimeSeconds: 1.5
  },

  // --- EQUIPMENT ---
  {
    id: 'craft_backpack',
    name: 'Canvas Backpack',
    category: 'EQUIPMENT',
    description: 'Expands inventory from 16 to 24 slots, +20kg capacity.',
    ingredients: [
      { itemId: 'cloth', quantity: 4 },
      { itemId: 'rope', quantity: 3 },
      { itemId: 'leaves', quantity: 4 }
    ],
    resultItemId: 'backpack',
    resultQuantity: 1,
    craftTimeSeconds: 3.5
  },
  {
    id: 'craft_vest',
    name: 'Protective Vest',
    category: 'EQUIPMENT',
    description: 'Insulates against freezing mountain winds and beast bites.',
    ingredients: [
      { itemId: 'cloth', quantity: 6 },
      { itemId: 'rope', quantity: 3 },
      { itemId: 'metal', quantity: 2 }
    ],
    resultItemId: 'protective_vest',
    resultQuantity: 1,
    craftTimeSeconds: 4.0
  },
  {
    id: 'craft_lantern',
    name: "Miner's Lantern",
    category: 'EQUIPMENT',
    description: 'Powerful wide-radius light source.',
    ingredients: [
      { itemId: 'metal', quantity: 4 },
      { itemId: 'torch', quantity: 1 },
      { itemId: 'fuel', quantity: 1 }
    ],
    resultItemId: 'lantern',
    resultQuantity: 1,
    craftTimeSeconds: 4.0
  },

  // --- ADVANCED ---
  {
    id: 'craft_radio',
    name: 'Emergency Radio',
    category: 'ADVANCED',
    description: 'Shortwave radio to transmit distress beacon signals.',
    ingredients: [
      { itemId: 'electronics', quantity: 2 },
      { itemId: 'metal', quantity: 4 },
      { itemId: 'wood', quantity: 4 }
    ],
    resultItemId: 'electronics',
    resultQuantity: 1,
    craftTimeSeconds: 4.0
  }
];

export class CraftingSystem {
  public static canCraft(recipe: CraftingRecipe, inventory: Inventory): boolean {
    for (const req of recipe.ingredients) {
      if (inventory.getItemCount(req.itemId) < req.quantity) {
        return false;
      }
    }
    return true;
  }

  public static getMissingIngredients(recipe: CraftingRecipe, inventory: Inventory): { itemId: string; missing: number }[] {
    const missing: { itemId: string; missing: number }[] = [];
    for (const req of recipe.ingredients) {
      const have = inventory.getItemCount(req.itemId);
      if (have < req.quantity) {
        missing.push({ itemId: req.itemId, missing: req.quantity - have });
      }
    }
    return missing;
  }

  public static craft(recipe: CraftingRecipe, inventory: Inventory): boolean {
    if (!this.canCraft(recipe, inventory)) {
      return false;
    }

    for (const req of recipe.ingredients) {
      inventory.removeItem(req.itemId, req.quantity);
    }

    if (recipe.resultItemId === 'backpack') {
      inventory.upgradeBackpack();
    } else {
      inventory.addItem(recipe.resultItemId, recipe.resultQuantity);
    }

    audioSystem.playCraftSuccess();
    return true;
  }
}


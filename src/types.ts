// Core Types and Data Models for ISLAND SURVIVAL

export type GameState = 
  | 'LOGIN'
  | 'TITLE'
  | 'LOBBY'
  | 'LOADING'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'VICTORY';

export type WeatherType = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'STORM' | 'FOG' | 'SNOW';

export type BiomeType = 
  | 'BEACH' 
  | 'COASTAL_FOREST' 
  | 'DEEP_FOREST' 
  | 'CAVE' 
  | 'RIVER_VALLEY' 
  | 'MOUNTAIN' 
  | 'RUINS' 
  | 'STORM_ISLAND' 
  | 'FACILITY' 
  | 'FINAL_ESCAPE';

export type ItemCategory = 'RESOURCE' | 'FOOD' | 'WATER' | 'TOOL' | 'EQUIPMENT' | 'SPECIAL';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  stackSize: number;
  weight: number; // in kg
  iconColor: string;
  iconSymbol: string;
  healAmount?: number;
  hungerAmount?: number;
  thirstAmount?: number;
  toolType?: 'AXE' | 'PICKAXE' | 'ROD' | 'TORCH' | 'WEAPON';
  toolPower?: number;
  durability?: number;
}

export interface ItemStack {
  itemId: string;
  quantity: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'SURVIVAL' | 'TOOLS' | 'EQUIPMENT' | 'ADVANCED';
  description: string;
  ingredients: { itemId: string; quantity: number }[];
  resultItemId: string;
  resultQuantity: number;
  craftTimeSeconds: number;
  requiresWorkbench?: boolean;
}

export interface BuildingDef {
  id: string;
  name: string;
  description: string;
  category: 'SHELTER' | 'UTILITY' | 'DEFENSE' | 'EXTRACTION';
  width: number;
  height: number;
  ingredients: { itemId: string; quantity: number }[];
  maxHealth: number;
  color: string;
  requiresWorkbench?: boolean;
}

export interface CharacterClass {
  id: string;
  name: string;
  title: string;
  description: string;
  traitDescription: string;
  bodyColor: string;
  hairColor: string;
  accentColor: string;
  maxHealth: number;
  speedMultiplier: number;
  gatherMultiplier: number;
  craftSpeedMultiplier: number;
  staminaRecoveryMultiplier: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  thirst: number;
  maxThirst: number;
  stamina: number;
  maxStamina: number;
  isDowned: boolean;
  downedTimer: number; // seconds left to revive
  isDead: boolean;
}

export interface ObjectiveTask {
  id: string;
  text: string;
  type: 'COLLECT' | 'BUILD' | 'DISCOVER' | 'INTERACT' | 'SURVIVE' | 'REACH';
  targetId?: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export interface LevelDefinition {
  levelNumber: number;
  id: string;
  name: string;
  subtitle: string;
  biome: BiomeType;
  mapWidth: number; // in tiles
  mapHeight: number; // in tiles
  defaultWeather: WeatherType;
  temperature: number; // in Celsius
  timeOfDay: number; // 0.0 to 1.0 (0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 0.9 = midnight)
  timeSpeed: number; // speed of day/night
  description: string;
  tip: string;
  objectives: ObjectiveTask[];
  extractionPos: { x: number; y: number };
  spawnPos: { x: number; y: number };
}

export interface DropItem {
  id: string;
  itemId: string;
  quantity: number;
  x: number;
  y: number;
  bobOffset: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  lifetime: number;
  maxLifetime: number;
  vy: number;
}


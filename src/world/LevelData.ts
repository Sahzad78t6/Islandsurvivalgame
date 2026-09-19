// 10 Progressively Difficult Level Definitions and Objectives

import type { LevelDefinition } from '../types';

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  // LEVEL 1
  {
    levelNumber: 1,
    id: 'level_1_beach',
    name: 'LEVEL 1 — BEACH',
    subtitle: 'The Crash Site & Shoreline',
    biome: 'BEACH',
    mapWidth: 50,
    mapHeight: 40,
    defaultWeather: 'SUNNY',
    temperature: 24,
    timeOfDay: 0.35,
    timeSpeed: 0.003,
    description: 'You and your fellow survivors have washed ashore on a mysterious island. Establish a temporary camp before night falls.',
    tip: 'Water is more important than food. Always carry extra fresh water.',
    spawnPos: { x: 300, y: 350 },
    extractionPos: { x: 1250, y: 400 },
    objectives: [
      { id: 'wood', text: 'Collect 10 Wood', type: 'COLLECT', targetId: 'wood', targetCount: 10, currentCount: 0, completed: false },
      { id: 'food', text: 'Collect 4 Food (Berries/Coconuts)', type: 'COLLECT', targetId: 'berries', targetCount: 4, currentCount: 0, completed: false },
      { id: 'water', text: 'Drink or Collect Fresh Water', type: 'COLLECT', targetId: 'clean_water', targetCount: 1, currentCount: 0, completed: false },
      { id: 'shelter', text: 'Build a Basic Shelter', type: 'BUILD', targetId: 'shelter_small', targetCount: 1, currentCount: 0, completed: false },
      { id: 'reach', text: 'Reach the Marked Camp Location', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 2
  {
    levelNumber: 2,
    id: 'level_2_coastal_forest',
    name: 'LEVEL 2 — COASTAL FOREST',
    subtitle: 'The Bushland & Wild Boars',
    biome: 'COASTAL_FOREST',
    mapWidth: 55,
    mapHeight: 45,
    defaultWeather: 'CLOUDY',
    temperature: 20,
    timeOfDay: 0.4,
    timeSpeed: 0.0035,
    description: 'Deeper inland, dense bushes conceal an abandoned supply crate. Beware of territorial wild boars roaming the undergrowth.',
    tip: 'Equip an axe to chop timber faster and defend against aggressive boars.',
    spawnPos: { x: 250, y: 300 },
    extractionPos: { x: 1450, y: 650 },
    objectives: [
      { id: 'axe', text: 'Craft a Stone Axe', type: 'COLLECT', targetId: 'axe', targetCount: 1, currentCount: 0, completed: false },
      { id: 'crate', text: 'Find & Salvage Abandoned Supply Crate', type: 'COLLECT', targetId: 'cloth', targetCount: 3, currentCount: 0, completed: false },
      { id: 'boar', text: 'Hunt or Avoid Boars (Collect 2 Raw Meat)', type: 'COLLECT', targetId: 'raw_meat', targetCount: 2, currentCount: 0, completed: false },
      { id: 'reach', text: 'Reach the Forest Pass', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 3
  {
    levelNumber: 3,
    id: 'level_3_deep_forest',
    name: 'LEVEL 3 — DEEP FOREST',
    subtitle: 'Canopy of Fog & Vipers',
    biome: 'DEEP_FOREST',
    mapWidth: 60,
    mapHeight: 50,
    defaultWeather: 'FOG',
    temperature: 18,
    timeOfDay: 0.55,
    timeSpeed: 0.0035,
    description: 'Thick mist envelops the jungle. Island snakes lurk beneath leaves. Find the old ranger outpost to chart a route.',
    tip: 'Medicinal herbs cure viper venom and restore health in an emergency.',
    spawnPos: { x: 200, y: 400 },
    extractionPos: { x: 1600, y: 550 },
    objectives: [
      { id: 'herbs', text: 'Gather 3 Medicinal Herbs', type: 'COLLECT', targetId: 'herbs', targetCount: 3, currentCount: 0, completed: false },
      { id: 'campfire', text: 'Build a Campfire for Warmth', type: 'BUILD', targetId: 'campfire', targetCount: 1, currentCount: 0, completed: false },
      { id: 'wood', text: 'Stockpile 15 Wood', type: 'COLLECT', targetId: 'wood', targetCount: 15, currentCount: 0, completed: false },
      { id: 'reach', text: 'Locate Old Ranger Station Trailhead', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 4
  {
    levelNumber: 4,
    id: 'level_4_cave',
    name: 'LEVEL 4 — CAVE',
    subtitle: 'Underground Caverns & Echoes',
    biome: 'CAVE',
    mapWidth: 55,
    mapHeight: 45,
    defaultWeather: 'CLOUDY',
    temperature: 12,
    timeOfDay: 0.9,
    timeSpeed: 0.002,
    description: 'Pitch-black caverns cut through the mountain ridge. You must rely on torches to navigate subterranean tunnels and find lost equipment.',
    tip: 'Never wander into caves without a lit torch or lantern.',
    spawnPos: { x: 220, y: 350 },
    extractionPos: { x: 1500, y: 700 },
    objectives: [
      { id: 'torch', text: 'Craft at least 2 Torches', type: 'COLLECT', targetId: 'torch', targetCount: 2, currentCount: 0, completed: false },
      { id: 'stone', text: 'Mine 12 Stone & Ore', type: 'COLLECT', targetId: 'stone', targetCount: 12, currentCount: 0, completed: false },
      { id: 'metal', text: 'Scavenge 3 Scrap Metal in the Tunnels', type: 'COLLECT', targetId: 'metal', targetCount: 3, currentCount: 0, completed: false },
      { id: 'reach', text: 'Navigate to the Cavern Exit Arch', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 5
  {
    levelNumber: 5,
    id: 'level_5_river_valley',
    name: 'LEVEL 5 — RIVER VALLEY',
    subtitle: 'Rushing Rapids & Waterfalls',
    biome: 'RIVER_VALLEY',
    mapWidth: 65,
    mapHeight: 45,
    defaultWeather: 'RAIN',
    temperature: 19,
    timeOfDay: 0.45,
    timeSpeed: 0.003,
    description: 'A roaring river divides the island valley. Collect timber to build a bridge across the gorge and activate the radio relay tower.',
    tip: 'Rushing river water can be boiled over a campfire to yield clean drinking water.',
    spawnPos: { x: 250, y: 450 },
    extractionPos: { x: 1750, y: 400 },
    objectives: [
      { id: 'water', text: 'Boil or Purify 2 Clean Water', type: 'COLLECT', targetId: 'clean_water', targetCount: 2, currentCount: 0, completed: false },
      { id: 'wood', text: 'Gather 18 Wood for River Crossing', type: 'COLLECT', targetId: 'wood', targetCount: 18, currentCount: 0, completed: false },
      { id: 'fish', text: 'Catch or Cook 1 Fish', type: 'COLLECT', targetId: 'cooked_fish', targetCount: 1, currentCount: 0, completed: false },
      { id: 'reach', text: 'Reach the Communication Tower Across the River', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 6
  {
    levelNumber: 6,
    id: 'level_6_mountain',
    name: 'LEVEL 6 — MOUNTAIN',
    subtitle: 'Frozen Peaks & Glacial Winds',
    biome: 'MOUNTAIN',
    mapWidth: 60,
    mapHeight: 50,
    defaultWeather: 'SNOW',
    temperature: -4,
    timeOfDay: 0.6,
    timeSpeed: 0.003,
    description: 'Blizzard conditions freeze the mountain heights. Without warmth from campfires or protective clothing, hypothermia will set in.',
    tip: 'Freezing winds drain stamina and health. Stay close to campfires to prevent hypothermia.',
    spawnPos: { x: 250, y: 700 },
    extractionPos: { x: 1550, y: 250 },
    objectives: [
      { id: 'campfire', text: 'Build 2 Warmth Campfires on the Ascent', type: 'BUILD', targetId: 'campfire', targetCount: 2, currentCount: 0, completed: false },
      { id: 'stone', text: 'Mine 10 Alpine Slate Stone', type: 'COLLECT', targetId: 'stone', targetCount: 10, currentCount: 0, completed: false },
      { id: 'reach', text: 'Reach Mountain Observation Outpost', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 7
  {
    levelNumber: 7,
    id: 'level_7_ruins',
    name: 'LEVEL 7 — ABANDONED RUINS',
    subtitle: 'Overgrown Bunkers & Relics',
    biome: 'RUINS',
    mapWidth: 65,
    mapHeight: 50,
    defaultWeather: 'CLOUDY',
    temperature: 21,
    timeOfDay: 0.45,
    timeSpeed: 0.003,
    description: 'Crumbling research facilities overgrown with ivy. Search the ruined bunkers for functional electronic parts to transmit an SOS.',
    tip: 'Rusted lockers and vehicles hold valuable electronics needed for distress calls.',
    spawnPos: { x: 300, y: 350 },
    extractionPos: { x: 1700, y: 650 },
    objectives: [
      { id: 'metal', text: 'Scavenge 8 Metal Scrap', type: 'COLLECT', targetId: 'metal', targetCount: 8, currentCount: 0, completed: false },
      { id: 'electronics', text: 'Find 2 Electronic Transmitter Parts', type: 'COLLECT', targetId: 'electronics', targetCount: 2, currentCount: 0, completed: false },
      { id: 'radio', text: 'Craft or Assemble Emergency Radio', type: 'COLLECT', targetId: 'electronics', targetCount: 2, currentCount: 0, completed: false },
      { id: 'reach', text: 'Reach the Facility Access Road', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 8
  {
    levelNumber: 8,
    id: 'level_8_storm_island',
    name: 'LEVEL 8 — STORM ISLAND',
    subtitle: 'Gale Winds & Thunder Claps',
    biome: 'STORM_ISLAND',
    mapWidth: 70,
    mapHeight: 50,
    defaultWeather: 'STORM',
    temperature: 17,
    timeOfDay: 0.75,
    timeSpeed: 0.003,
    description: 'A violent tropical hurricane batters the coastline. Flooded zones hinder travel while thunder and lightning crash down.',
    tip: 'Lightning strikes open clearings during storms. Seek high ground to avoid rising water.',
    spawnPos: { x: 280, y: 350 },
    extractionPos: { x: 1800, y: 600 },
    objectives: [
      { id: 'fuel', text: 'Collect 2 Fuel Canisters from Wreckage', type: 'COLLECT', targetId: 'fuel', targetCount: 2, currentCount: 0, completed: false },
      { id: 'shelter', text: 'Erect a Sturdy Shelter to Weather Storm', type: 'BUILD', targetId: 'shelter_small', targetCount: 1, currentCount: 0, completed: false },
      { id: 'reach', text: 'Reach the Storm Emergency Beacon', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 9
  {
    levelNumber: 9,
    id: 'level_9_facility',
    name: 'LEVEL 9 — EMERGENCY FACILITY',
    subtitle: 'Compound Generators & Power Grid',
    biome: 'FACILITY',
    mapWidth: 65,
    mapHeight: 50,
    defaultWeather: 'CLOUDY',
    temperature: 20,
    timeOfDay: 0.82,
    timeSpeed: 0.002,
    description: 'The military emergency command center. You must restore power to the backup generator to charge the long-range distress beacon.',
    tip: 'Restoring power primes the extraction radar for the rescue aircraft.',
    spawnPos: { x: 260, y: 400 },
    extractionPos: { x: 1650, y: 450 },
    objectives: [
      { id: 'fuel', text: 'Acquire 3 Fuel Canisters for Generator', type: 'COLLECT', targetId: 'fuel', targetCount: 3, currentCount: 0, completed: false },
      { id: 'metal', text: 'Collect 6 Metal Scrap for Repairs', type: 'COLLECT', targetId: 'metal', targetCount: 6, currentCount: 0, completed: false },
      { id: 'beacon', text: 'Construct/Power the Emergency Beacon', type: 'BUILD', targetId: 'emergency_beacon', targetCount: 1, currentCount: 0, completed: false },
      { id: 'reach', text: 'Proceed to the Helipad Gate', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  },

  // LEVEL 10
  {
    levelNumber: 10,
    id: 'level_10_final_escape',
    name: 'LEVEL 10 — FINAL ESCAPE',
    subtitle: 'The Helipad & Extraction',
    biome: 'FINAL_ESCAPE',
    mapWidth: 75,
    mapHeight: 55,
    defaultWeather: 'CLOUDY',
    temperature: 22,
    timeOfDay: 0.28,
    timeSpeed: 0.002,
    description: 'The final push! The rescue helicopter is approaching the ocean cliffs. Gather all surviving teammates in the extraction zone to escape!',
    tip: 'Stay together! Extraction requires all living teammates inside the landing zone.',
    spawnPos: { x: 300, y: 700 },
    extractionPos: { x: 1950, y: 350 },
    objectives: [
      { id: 'beacon', text: 'Activate Emergency Beacon Transmitter', type: 'BUILD', targetId: 'emergency_beacon', targetCount: 1, currentCount: 0, completed: false },
      { id: 'survive', text: 'Keep All Surviving Teammates Alive', type: 'SURVIVE', targetCount: 1, currentCount: 1, completed: false },
      { id: 'extract', text: 'GET TO THE EXTRACTION POINT', type: 'REACH', targetCount: 1, currentCount: 0, completed: false }
    ]
  }
];


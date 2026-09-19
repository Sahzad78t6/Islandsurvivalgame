// ISLAND SURVIVAL — Main Game Loop and Master Controller

import './style.css';
import type { GameState, LevelDefinition, DropItem, CraftingRecipe } from './types';
import { Vector2, clamp } from './engine/Vector2';
import { Camera } from './engine/Camera';
import { audioSystem } from './engine/AudioSystem';
import { ParticleSystem } from './engine/ParticleSystem';
import { LightingSystem, type LightSource } from './engine/LightingSystem';
import { WeatherSystem } from './engine/WeatherSystem';
import { TileMap, TILE_SIZE } from './world/TileMap';
import { LEVEL_DEFINITIONS } from './world/LevelData';
import { Player, CHARACTER_CLASSES } from './entities/Player';
import { ResourceNode, type ResourceNodeType } from './entities/ResourceNode';
import { WildlifeEntity } from './entities/Wildlife';
import { BuildingInstance, BUILDING_DEFINITIONS, BuildingSystem } from './entities/Building';
import { CraftingSystem } from './systems/Crafting';
import { ITEM_DEFINITIONS } from './systems/Inventory';
import { ObjectiveSystem } from './systems/ObjectiveSystem';
import { MultiplayerManager } from './multiplayer/MultiplayerManager';
import { uiManager } from './ui/UIManager';
import { domOverlay } from './ui/DOMOverlay';
import { SaveSystem } from './systems/SaveSystem';
import { MobileControls } from './ui/MobileControls';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public state: GameState = 'TITLE';
  public currentLevelIndex: number = 0;
  public survivalTime: number = 0;
  public totalResourcesCollected: number = 0;

  public camera: Camera;
  public particles: ParticleSystem;
  public lighting: LightingSystem;
  public weather: WeatherSystem;
  public tileMap: TileMap;
  public objectiveSystem: ObjectiveSystem;
  public multiplayer: MultiplayerManager;
  public mobileControls: MobileControls;
  public isForcedLandscape: boolean = false;
  public manualForceLandscape: boolean | null = null;

  public players: Player[] = [];
  public localPlayer: Player | null = null;
  public resources: ResourceNode[] = [];
  public wildlife: WildlifeEntity[] = [];
  public buildings: BuildingInstance[] = [];
  public groundDrops: DropItem[] = [];

  public isPlacingBuilding: boolean = false;
  public placingDefId: string = 'campfire';
  public mouseWorldPos: Vector2 = new Vector2(0, 0);

  private keys: Record<string, boolean> = {};
  private lastTime: number = 0;

  private isExtracting: boolean = false;
  private extractionCinematicTimer: number = 0;
  public tutorialBuildShown: boolean = false;
  public tutorialWaterShown: boolean = false;
  public tutorialExtractionShown: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not supported');
    this.ctx = context;

    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.particles = new ParticleSystem();
    this.lighting = new LightingSystem();
    this.weather = new WeatherSystem();
    this.tileMap = new TileMap(50, 40, 'BEACH');
    this.objectiveSystem = new ObjectiveSystem();
    this.multiplayer = new MultiplayerManager();

    this.mobileControls = new MobileControls();
    this.mobileControls.onAttack = () => {
      if (this.state === 'PLAYING') this.handlePlayerActionClick();
    };
    this.mobileControls.onInteract = () => {
      if (this.state === 'PLAYING') {
        this.keys['e'] = true;
        this.updateContextualPrompt(0.016);
        setTimeout(() => { this.keys['e'] = false; }, 120);
      }
    };
    this.mobileControls.onBuild = () => {
      if (this.state === 'PLAYING') this.toggleBuildMenu();
    };
    this.mobileControls.onInventory = () => {
      if (this.state === 'PLAYING') this.toggleInventory();
    };
    this.mobileControls.onToggleOrientation = () => {
      this.manualForceLandscape = this.manualForceLandscape === null ? !this.isForcedLandscape : !this.manualForceLandscape;
      this.applyOrientationLayout();
    };

    this.setupResize();
    this.setupInputs();
    this.setupOverlayEvents();

    const save = SaveSystem.load();
    if (!save.username) {
      domOverlay.renderLogin();
    } else {
      domOverlay.renderTitleScreen(save.unlockedLevel);
    }

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  public getScreenCoords(clientX: number, clientY: number): { x: number; y: number } {
    if (this.isForcedLandscape) {
      return {
        x: clientY,
        y: window.innerWidth - clientX
      };
    }
    return { x: clientX, y: clientY };
  }

  public applyOrientationLayout() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const shouldForce = this.manualForceLandscape !== null ? this.manualForceLandscape : isPortrait;
    this.isForcedLandscape = shouldForce;

    const appEl = document.getElementById('app');
    if (this.isForcedLandscape) {
      appEl?.classList.add('forced-landscape');
      const w = window.innerHeight;
      const h = window.innerWidth;
      this.canvas.width = w;
      this.canvas.height = h;
      this.camera.viewportWidth = w;
      this.camera.viewportHeight = h;
    } else {
      appEl?.classList.remove('forced-landscape');
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.camera.viewportWidth = window.innerWidth;
      this.camera.viewportHeight = window.innerHeight;
    }
    this.mobileControls.setForcedLandscape(this.isForcedLandscape);
  }

  private setupResize() {
    const resize = () => {
      this.applyOrientationLayout();
    };
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    this.applyOrientationLayout();
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      audioSystem.init();

      if (this.state === 'PLAYING') {
        if (e.key >= '1' && e.key <= '6') {
          const slot = parseInt(e.key, 10) - 1;
          if (this.localPlayer) {
            this.localPlayer.inventory.selectedHotbarIndex = slot;
            audioSystem.playUIClick();
          }
        }

        if (e.key.toLowerCase() === 'tab' || e.key.toLowerCase() === 'i') {
          e.preventDefault();
          this.toggleInventory();
        }

        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          this.handlePlayerActionClick();
        }

        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          this.toggleBuildMenu();
        }

        if (e.key === 'Escape') {
          if (this.isPlacingBuilding) {
            this.isPlacingBuilding = false;
            domOverlay.activeBuildingGhost = null;
          } else {
            domOverlay.clear();
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this.getScreenCoords(e.clientX, e.clientY);
      this.mouseWorldPos = this.camera.screenToWorld(pos.x, pos.y);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      audioSystem.init();
      if (this.state !== 'PLAYING' || !this.localPlayer) return;

      if (e.button === 0) {
        if (this.isPlacingBuilding) {
          this.confirmBuildingPlacement();
        } else {
          this.handlePlayerActionClick();
        }
      } else if (e.button === 2) {
        this.isPlacingBuilding = false;
        domOverlay.activeBuildingGhost = null;
      }
    });

    this.canvas.addEventListener('touchstart', (e: TouchEvent) => {
      audioSystem.init();
      if (this.state !== 'PLAYING' || !this.localPlayer) return;
      const touch = e.touches[0];
      if (!touch) return;
      const pos = this.getScreenCoords(touch.clientX, touch.clientY);
      const clientX = pos.x;
      const clientY = pos.y;

      // Check Hotbar Touch Selection
      const slotSize = 48;
      const gap = 8;
      const totalW = 6 * slotSize + 5 * gap;
      const startX = (this.canvas.width - totalW) / 2;
      const startY = this.canvas.height - 76;

      if (clientX >= startX - 8 && clientX <= startX + totalW + 8 && clientY >= startY - 8 && clientY <= startY + slotSize + 8) {
        for (let i = 0; i < 6; i++) {
          const sx = startX + i * (slotSize + gap);
          if (clientX >= sx && clientX <= sx + slotSize) {
            this.localPlayer.inventory.selectedHotbarIndex = i;
            audioSystem.playUIClick();
            e.preventDefault();
            return;
          }
        }
      }

      // If placing building, tap confirms placement
      if (this.isPlacingBuilding) {
        this.mouseWorldPos = this.camera.screenToWorld(touch.clientX, touch.clientY);
        this.confirmBuildingPlacement();
        e.preventDefault();
      }
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private setupOverlayEvents() {
    domOverlay.onLogout = () => {
      SaveSystem.logout();
      this.state = 'LOGIN';
      domOverlay.renderLogin();
    };

    domOverlay.onStartGame = (charClassId, levelNum, botCount, roomCode) => {
      this.currentLevelIndex = levelNum - 1;
      this.multiplayer.setRoom(roomCode, true, 0);
      this.loadLevel(this.currentLevelIndex, charClassId, botCount);
    };

    domOverlay.onNextLevel = () => {
      this.currentLevelIndex++;
      if (this.currentLevelIndex >= LEVEL_DEFINITIONS.length) {
        this.triggerFinalVictory();
      } else {
        const charId = this.localPlayer ? this.localPlayer.charClass.id : 'jack';
        this.loadLevel(this.currentLevelIndex, charId, 3);
      }
    };

    domOverlay.onRestartLevel = () => {
      const charId = this.localPlayer ? this.localPlayer.charClass.id : 'jack';
      this.loadLevel(this.currentLevelIndex, charId, 3);
    };

    domOverlay.onReturnToMenu = () => {
      this.state = 'TITLE';
        this.mobileControls.setVisible(false);
      const save = SaveSystem.load();
      domOverlay.renderTitleScreen(save.unlockedLevel);
    };

    domOverlay.onSelectBuilding = (buildingDefId) => {
      this.isPlacingBuilding = true;
      this.placingDefId = buildingDefId;
    };
  }

  private toggleInventory() {
    if (!this.localPlayer) return;
    audioSystem.playUIClick();

    domOverlay.renderInventoryAndCrafting(
      this.localPlayer,
      (recipe: CraftingRecipe) => {
        if (CraftingSystem.craft(recipe, this.localPlayer!.inventory)) {
          this.particles.emitFloatingText(`CRAFTED ${recipe.name.toUpperCase()}`, this.localPlayer!.pos.x, this.localPlayer!.pos.y - 15, '#ffb300');
          this.objectiveSystem.notifyItemCollected(recipe.resultItemId, recipe.resultQuantity, this.particles);
          this.totalResourcesCollected += recipe.resultQuantity;
        }
      },
      (itemId: string) => {
        this.localPlayer!.eatItem(itemId, this.particles);
      },
      (slotIdx: number) => {
        this.localPlayer!.inventory.dropSlot(slotIdx, this.localPlayer!.pos.x, this.localPlayer!.pos.y, this.groundDrops);
      }
    );
  }

  private toggleBuildMenu() {
    if (!this.localPlayer) return;
    audioSystem.playUIClick();

    domOverlay.renderBuildWheel(this.localPlayer, (defId: string) => {
      this.isPlacingBuilding = true;
      this.placingDefId = defId;
    });
  }

  public loadLevel(levelIdx: number, localCharClassId: string, botCount: number = 3) {
    this.state = 'LOADING';
    const levelDef = LEVEL_DEFINITIONS[levelIdx] || LEVEL_DEFINITIONS[0];

    domOverlay.renderLoadingScreen(levelDef, () => {
      this.initLevelEntities(levelDef, localCharClassId, botCount);
      this.state = 'PLAYING';
      this.mobileControls.setVisible(true);
      // Show tutorial hint on first level
      if (levelIdx === 0) {
        uiManager.showHint('🧭 LEVEL 1 BASICS: Move with [WASD]. Approach Palm Trees and press [E] or [Space] to gather Wood & Berries!', 10000);
      }
    });
  }

  private initLevelEntities(levelDef: LevelDefinition, localCharClassId: string, botCount: number) {
    this.survivalTime = 0;
    this.isExtracting = false;
    this.tutorialBuildShown = false;
    this.tutorialWaterShown = false;
    this.tutorialExtractionShown = false;
    this.extractionCinematicTimer = 0;
    this.isPlacingBuilding = false;

    this.tileMap = new TileMap(levelDef.mapWidth, levelDef.mapHeight, levelDef.biome);
    this.camera.setBounds(0, 0, levelDef.mapWidth * TILE_SIZE, levelDef.mapHeight * TILE_SIZE);

    this.weather.setWeather(levelDef.defaultWeather);
    this.lighting.timeOfDay = levelDef.timeOfDay;
    this.lighting.timeSpeed = levelDef.timeSpeed;

    this.particles.clear();
    this.groundDrops = [];
    this.buildings = [];
    this.resources = [];
    this.wildlife = [];

    this.objectiveSystem.initLevel(levelDef);

    this.players = [];
    const spawnX = levelDef.spawnPos.x;
    const spawnY = levelDef.spawnPos.y;

    this.localPlayer = new Player(0, localCharClassId, spawnX, spawnY, false);
    this.players.push(this.localPlayer);

    const remainingClasses = CHARACTER_CLASSES.filter(c => c.id !== localCharClassId);
    for (let i = 0; i < botCount && i < remainingClasses.length; i++) {
      const companion = new Player(
        i + 1,
        remainingClasses[i].id,
        spawnX + (i + 1) * 32,
        spawnY + (i % 2 === 0 ? 25 : -25),
        true
      );
      this.players.push(companion);
    }

    this.camera.snapTo(this.localPlayer.pos.x, this.localPlayer.pos.y);

    this.populateResourceNodes(levelDef);
    this.populateWildlife(levelDef);

    if (levelDef.id === 'level_9_facility') {
      this.buildings.push(new BuildingInstance('emergency_beacon', 1600, 420));
    }

    audioSystem.updateBiomeAmbience(levelDef.biome, levelDef.defaultWeather);
  }

  private populateResourceNodes(levelDef: LevelDefinition) {
    const count = 35 + levelDef.levelNumber * 6;
    const mapW = levelDef.mapWidth * TILE_SIZE;
    const mapH = levelDef.mapHeight * TILE_SIZE;

    this.resources.push(new ResourceNode('WATER_SPRING', 450, 400));
    if (levelDef.biome !== 'CAVE') {
      this.resources.push(new ResourceNode('WATER_SPRING', mapW - 350, mapH - 300));
    }

    for (let i = 0; i < count; i++) {
      const rx = 80 + Math.random() * (mapW - 160);
      const ry = 80 + Math.random() * (mapH - 160);

      if (this.tileMap.isWorldSolid(rx, ry)) continue;

      let type: ResourceNodeType = 'PALM_TREE';

      if (levelDef.biome === 'BEACH') {
        type = Math.random() < 0.5 ? 'PALM_TREE' : Math.random() < 0.75 ? 'ROCK' : 'BERRY_BUSH';
      } else if (levelDef.biome === 'COASTAL_FOREST') {
        type = Math.random() < 0.4 ? 'PALM_TREE' : Math.random() < 0.7 ? 'BERRY_BUSH' : Math.random() < 0.85 ? 'ROCK' : 'SUPPLY_CRATE';
      } else if (levelDef.biome === 'DEEP_FOREST') {
        type = Math.random() < 0.5 ? 'JUNGLE_TREE' : Math.random() < 0.75 ? 'HERB_PATCH' : 'BERRY_BUSH';
      } else if (levelDef.biome === 'CAVE') {
        type = Math.random() < 0.75 ? 'ROCK' : 'RUIN_SCRAP';
      } else if (levelDef.biome === 'MOUNTAIN') {
        type = Math.random() < 0.4 ? 'PINE_TREE' : 'ROCK';
      } else if (levelDef.biome === 'RUINS' || levelDef.biome === 'FACILITY') {
        type = Math.random() < 0.45 ? 'RUIN_SCRAP' : Math.random() < 0.75 ? 'SUPPLY_CRATE' : 'ROCK';
      } else {
        type = Math.random() < 0.4 ? 'JUNGLE_TREE' : Math.random() < 0.7 ? 'ROCK' : 'BERRY_BUSH';
      }

      this.resources.push(new ResourceNode(type, rx, ry));
    }
  }

  private populateWildlife(levelDef: LevelDefinition) {
    const mapW = levelDef.mapWidth * TILE_SIZE;
    const mapH = levelDef.mapHeight * TILE_SIZE;

    if (levelDef.biome === 'BEACH' || levelDef.biome === 'FINAL_ESCAPE') {
      for (let i = 0; i < 5; i++) {
        this.wildlife.push(new WildlifeEntity('CRAB', 150 + Math.random() * 200, 150 + Math.random() * (mapH - 300)));
      }
      for (let i = 0; i < 4; i++) {
        this.wildlife.push(new WildlifeEntity('BIRD', 300 + Math.random() * 400, 200 + Math.random() * 400));
      }
    }

    if (levelDef.biome === 'COASTAL_FOREST' || levelDef.biome === 'DEEP_FOREST' || levelDef.biome === 'RIVER_VALLEY') {
      for (let i = 0; i < 3 + levelDef.levelNumber; i++) {
        this.wildlife.push(new WildlifeEntity('BOAR', 450 + Math.random() * (mapW - 600), 200 + Math.random() * (mapH - 400)));
      }
      for (let i = 0; i < 3; i++) {
        this.wildlife.push(new WildlifeEntity('SNAKE', 350 + Math.random() * (mapW - 500), 200 + Math.random() * (mapH - 400)));
      }
    }

    if (levelDef.biome === 'RIVER_VALLEY') {
      for (let i = 0; i < 6; i++) {
        this.wildlife.push(new WildlifeEntity('FISH', 30 * TILE_SIZE, 100 + i * 150));
      }
    }
  }

  private handlePlayerActionClick() {
    if (!this.localPlayer || this.localPlayer.stats.isDowned || this.localPlayer.stats.isDead) return;

    this.localPlayer.swingTool();

    const active = this.localPlayer.inventory.getActiveItem();
    const activeDef = active ? ITEM_DEFINITIONS[active.itemId] : null;
    const toolType = activeDef && activeDef.toolType ? activeDef.toolType : 'NONE';

    let hitWildlife = false;
    for (const w of this.wildlife) {
      if (!w.isDead && this.localPlayer.pos.distanceTo(w.pos) < 55) {
        const damage = toolType === 'AXE' ? 35 : toolType === 'PICKAXE' ? 30 : 15;
        const wasDead = w.isDead;
        w.takeDamage(damage, this.groundDrops, this.particles);
        this.particles.emitFloatingText(`-${damage} HP`, w.pos.x, w.pos.y - 20, '#ff5252');
        hitWildlife = true;
        if (!wasDead && w.isDead) {
          audioSystem.playAnimalDeath();
          uiManager.showHint(`🥩 Predator defeated! Collected meat & resources. Cook raw meat at campfire before eating!`, 6000);
        }
        break;
      }
    }

    if (hitWildlife) return;

    for (const res of this.resources) {
      if (!res.isDepleted) {
        const d = this.localPlayer.pos.distanceTo(new Vector2(res.x, res.y));
        if (d < res.radius + 35) {
          const results = res.hit(toolType as any, this.localPlayer.charClass.gatherMultiplier, this.particles, this.groundDrops);
          for (const r of results) {
            this.localPlayer.inventory.addItem(r.itemId, r.count);
            this.objectiveSystem.notifyItemCollected(r.itemId, r.count, this.particles);
            this.totalResourcesCollected += r.count;
          }
          break;
        }
      }
    }
  }

  private confirmBuildingPlacement() {
    if (!this.localPlayer) return;
    const bDef = BUILDING_DEFINITIONS[this.placingDefId];
    if (!bDef) return;

    const snapX = Math.floor(this.mouseWorldPos.x / 32) * 32;
    const snapY = Math.floor(this.mouseWorldPos.y / 32) * 32;

    if (this.tileMap.isWorldSolid(snapX + bDef.width / 2, snapY + bDef.height / 2)) {
      audioSystem.playPlayerHit();
      this.particles.emitFloatingText('CANNOT BUILD ON WATER / WALLS!', snapX + bDef.width / 2, snapY, '#f44336');
      return;
    }

    const placed = BuildingSystem.placeBuilding(
      bDef,
      snapX,
      snapY,
      this.localPlayer.inventory,
      this.buildings,
      this.particles
    );

    if (placed) {
      this.objectiveSystem.notifyBuildingBuilt(bDef.id, this.particles);
      this.isPlacingBuilding = false;
      domOverlay.activeBuildingGhost = null;
    } else {
      audioSystem.playPlayerHit();
      this.particles.emitFloatingText('MISSING RESOURCES TO BUILD!', snapX + bDef.width / 2, snapY, '#f44336');
    }
  }

  private update(dt: number) {
    const levelDef = LEVEL_DEFINITIONS[this.currentLevelIndex] || LEVEL_DEFINITIONS[0];

    if (this.state === 'TITLE') {
      this.tileMap.update(dt);
      this.particles.update(dt);
      return;
    }

    if (this.state !== 'PLAYING' || !this.localPlayer) return;

    this.survivalTime += dt;

    const inputDir = new Vector2(0, 0);
    const joy = this.mobileControls.getVector();
    if (joy.lengthSq() > 0.02) {
      inputDir.x = joy.x;
      inputDir.y = joy.y;
    } else {
      if (this.keys['w'] || this.keys['arrowup']) inputDir.y -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) inputDir.y += 1;
      if (this.keys['a'] || this.keys['arrowleft']) inputDir.x -= 1;
      if (this.keys['d'] || this.keys['arrowright']) inputDir.x += 1;
      if (inputDir.lengthSq() > 0) inputDir.normalize();
    }

    const sprintPressed = !!(this.keys['shift']) || this.mobileControls.isSprinting;

    let nearWarmth = false;
    for (const b of this.buildings) {
      if (b.defId === 'campfire' && b.isLit) {
        if (this.localPlayer.pos.distanceTo(new Vector2(b.x + 16, b.y + 16)) < 140) {
          nearWarmth = true;
          break;
        }
      }
    }

    const oldX = this.localPlayer.pos.x;
    const oldY = this.localPlayer.pos.y;
    this.localPlayer.update(dt, inputDir, sprintPressed, this.particles, nearWarmth, levelDef.temperature);

    if (this.tileMap.isWorldSolid(this.localPlayer.pos.x, this.localPlayer.pos.y)) {
      this.localPlayer.pos.x = oldX;
      this.localPlayer.pos.y = oldY;
    }

    for (const p of this.players) {
      if (p !== this.localPlayer && p.isBot) {
        this.multiplayer.updateCompanionAI(
          p,
          this.localPlayer,
          this.players,
          this.resources,
          this.buildings,
          dt,
          this.particles,
          this.groundDrops
        );
      }
    }

    this.camera.setTarget(this.localPlayer.pos.x, this.localPlayer.pos.y);
    this.camera.update(dt);

    for (const w of this.wildlife) {
      w.update(
        dt,
        this.players,
        this.particles,
        this.groundDrops,
        (damage: number, isPoison: boolean) => {
          this.localPlayer!.takeDamage(damage);
          this.camera.addShake(5, 0.25);
          if (isPoison) {
            this.localPlayer!.isPoisoned = true;
            this.localPlayer!.poisonTimer = 12;
          }
        }
      );
    }

    for (const b of this.buildings) {
      b.update(dt, this.weather.currentWeather, this.particles);
    }
    for (const r of this.resources) {
      r.update(dt);
    }

    for (let i = this.groundDrops.length - 1; i >= 0; i--) {
      const drop = this.groundDrops[i];
      drop.bobOffset += dt * 3;

      const distToPlayer = this.localPlayer.pos.distanceTo(new Vector2(drop.x, drop.y));
      if (distToPlayer < 35 && !this.localPlayer.stats.isDowned) {
        const remainder = this.localPlayer.inventory.addItem(drop.itemId, drop.quantity);
        if (remainder === 0) {
          audioSystem.playCollectItem();
          this.particles.emitFloatingText(`+${drop.quantity} ${drop.itemId.toUpperCase().replace('_', ' ')}`, drop.x, drop.y - 12, '#81c784');
          this.objectiveSystem.notifyItemCollected(drop.itemId, drop.quantity, this.particles);
          this.totalResourcesCollected += drop.quantity;
          this.groundDrops.splice(i, 1);
        }
      }
    }

    this.updateContextualPrompt(dt);

    this.tileMap.update(dt);
    this.lighting.update(dt);
    this.weather.update(dt, this.lighting, this.camera, levelDef.biome);
    this.particles.update(dt);

    const extPos = new Vector2(levelDef.extractionPos.x, levelDef.extractionPos.y);
    const extractionReady = this.objectiveSystem.checkExtractionZone(this.players, extPos, 75);

    if (extractionReady && !this.isExtracting) {
      this.isExtracting = true;
      audioSystem.playLevelVictory();
      this.particles.emitFloatingText('EXTRACTION SUCCESSFUL!', extPos.x, extPos.y - 30, '#00e5ff');
    }

    if (this.isExtracting) {
      this.extractionCinematicTimer += dt;
      if (this.extractionCinematicTimer >= 2.0) {
        this.triggerLevelComplete();
      }
    }

    const allLivingDead = this.players.every(p => p.stats.isDead || (p.stats.isDowned && p.stats.downedTimer <= 0));
    if (allLivingDead) {
      this.state = 'GAME_OVER';
    this.mobileControls.setVisible(false);
      domOverlay.renderGameOverScreen(
        () => this.loadLevel(this.currentLevelIndex, this.localPlayer!.charClass.id, 3),
        () => {
          this.state = 'TITLE';
        this.mobileControls.setVisible(false);
          const s = SaveSystem.load();
          domOverlay.renderTitleScreen(s.unlockedLevel);
        }
      );
    }
  }

  private updateContextualPrompt(dt: number) {
    if (!this.localPlayer) return;
    uiManager.clearPrompt();

    for (const p of this.players) {
      if (p !== this.localPlayer && p.stats.isDowned && !p.stats.isDead) {
        if (this.localPlayer.pos.distanceTo(p.pos) < 38) {
          uiManager.setPrompt(`[E] Hold to Revive ${p.charClass.name.split(' ')[0]}`);
          if (this.keys['e']) {
            this.localPlayer.reviveOther(p, dt, this.particles);
          }
          return;
        }
      }
    }

    const nearbyThreat = this.wildlife.find((wildlife) =>
      !wildlife.isDead &&
      (wildlife.type === 'BOAR' || wildlife.type === 'SNAKE') &&
      this.localPlayer!.pos.distanceTo(wildlife.pos) < 115
    );
    if (nearbyThreat) {
      const active = this.localPlayer.inventory.getActiveItem();
      const activeDef = active ? ITEM_DEFINITIONS[active.itemId] : null;
      const toolName = activeDef?.toolType === 'AXE' ? 'AXE' : activeDef?.toolType === 'PICKAXE' ? 'PICKAXE' : 'AXE / PICKAXE';
      const advice = nearbyThreat.type === 'SNAKE'
        ? 'Keep distance; use herbs if bitten.'
        : 'Sprint sideways to avoid the charge.';
      uiManager.setPrompt(`⚠️ ${nearbyThreat.type} ATTACK! Press [Space] or [LMB] to strike with ${toolName}! | ${advice}`);
      if (this.keys['e'] || this.keys[' ']) {
        this.handlePlayerActionClick();
        this.keys['e'] = false;
        this.keys[' '] = false;
      }
      return;
    }

    for (const res of this.resources) {
      if (res.type === 'WATER_SPRING' && this.localPlayer.pos.distanceTo(new Vector2(res.x, res.y)) < 42) {
        uiManager.setPrompt('[E] Drink Fresh Spring Water');
        if (this.keys['e']) {
          this.localPlayer.stats.thirst = clamp(this.localPlayer.stats.thirst + 30, 0, 100);
          audioSystem.playDrink();
          this.particles.emitFloatingText('+30 THIRST', this.localPlayer.pos.x, this.localPlayer.pos.y - 15, '#00bcd4');
          this.keys['e'] = false;
        }
        return;
      }
    }

    for (const b of this.buildings) {
      if (b.defId === 'water_purifier' && b.waterStored >= 1) {
        if (this.localPlayer.pos.distanceTo(new Vector2(b.x + 16, b.y + 16)) < 42) {
          uiManager.setPrompt(`[E] Collect Purified Water (${Math.floor(b.waterStored)} available)`);
          if (this.keys['e']) {
            b.waterStored -= 1;
            this.localPlayer.inventory.addItem('clean_water', 1);
            audioSystem.playDrink();
            this.particles.emitFloatingText('+1 CLEAN WATER', this.localPlayer.pos.x, this.localPlayer.pos.y - 15, '#00bcd4');
            this.keys['e'] = false;
          }
          return;
        }
      }
    }

    for (const res of this.resources) {
      if (!res.isDepleted && this.localPlayer.pos.distanceTo(new Vector2(res.x, res.y)) < res.radius + 28) {
        const verb = res.type.includes('TREE') ? 'Chop' : res.type === 'ROCK' ? 'Mine' : 'Harvest';
        const name = res.type.replace('_', ' ').toLowerCase();
        uiManager.setPrompt(`[E] ${verb} ${name}`);
        if (this.keys['e']) {
          this.handlePlayerActionClick();
          this.keys['e'] = false;
        }
        return;
      }
    }
  }

  private triggerLevelComplete() {
    this.state = 'LEVEL_COMPLETE';
    this.mobileControls.setVisible(false);
    const survivorsCount = this.players.filter(p => !p.stats.isDead).length;

    SaveSystem.recordLevelCompletion(
      this.currentLevelIndex + 1,
      this.survivalTime,
      survivorsCount,
      this.totalResourcesCollected
    );
    SaveSystem.unlockNextLevel(this.currentLevelIndex + 1);

    domOverlay.renderLevelCompleteScreen(
      this.currentLevelIndex + 1,
      survivorsCount,
      this.totalResourcesCollected,
      this.survivalTime,
      () => domOverlay.onNextLevel(),
      () => {
        this.state = 'TITLE';
        this.mobileControls.setVisible(false);
        const s = SaveSystem.load();
        domOverlay.renderTitleScreen(s.unlockedLevel);
      }
    );
  }

  private triggerFinalVictory() {
    this.state = 'VICTORY';
    this.mobileControls.setVisible(false);
    audioSystem.playLevelVictory();

    domOverlay.renderFinalVictoryScreen(
      this.survivalTime,
      this.totalResourcesCollected,
      () => {
        const charId = this.localPlayer ? this.localPlayer.charClass.id : 'jack';
        this.loadLevel(0, charId, 3);
      },
      () => {
        this.state = 'TITLE';
        this.mobileControls.setVisible(false);
        const s = SaveSystem.load();
        domOverlay.renderTitleScreen(s.unlockedLevel);
      }
    );
  }

  private render() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    if (this.state === 'TITLE') {
      this.renderTitleBackground(ctx, w, h);
      return;
    }

    if (this.state === 'LOADING') return;

    const levelDef = LEVEL_DEFINITIONS[this.currentLevelIndex] || LEVEL_DEFINITIONS[0];

    this.camera.applyTransform(ctx);

    const viewMin = this.camera.screenToWorld(0, 0);
    const viewMax = this.camera.screenToWorld(w, h);

    this.tileMap.render(ctx, viewMin.x, viewMin.y, viewMax.x, viewMax.y);
    this.renderExtractionZone(ctx, levelDef);

    for (const b of this.buildings) {
      b.render(ctx);
    }

    for (const res of this.resources) {
      res.render(ctx);
    }

    this.renderGroundDrops(ctx);

    for (const wildlife of this.wildlife) {
      wildlife.render(ctx);
    }

    const sortedPlayers = [...this.players].sort((a, b) => a.pos.y - b.pos.y);
    for (const p of sortedPlayers) {
      p.render(ctx);
    }

    if (this.isPlacingBuilding) {
      this.renderGhostBuilding(ctx);
    }

    this.particles.render(ctx);

    const lights: LightSource[] = [];
    for (const p of this.players) {
      const pLight = p.getLightSource();
      if (pLight) lights.push(pLight);
    }
    for (const b of this.buildings) {
      if (b.defId === 'campfire' && b.isLit) {
        lights.push({
          x: b.x + 16,
          y: b.y + 16,
          radius: 190,
          intensity: 0.95,
          color: 'rgba(255, 140, 20, 0.45)',
          flicker: true
        });
      } else if (b.defId === 'emergency_beacon') {
        lights.push({
          x: b.x + 24,
          y: b.y + 10,
          radius: 220,
          intensity: 0.95,
          color: 'rgba(0, 229, 255, 0.5)',
          flicker: false
        });
      }
    }

    this.camera.restoreTransform(ctx);

    this.lighting.renderLighting(ctx, w, h, lights, (wx, wy) => {
      const s = this.camera.worldToScreen(wx, wy);
      return { x: s.x, y: s.y };
    });

    this.weather.render(ctx, w, h);

    if (this.localPlayer && this.state === 'PLAYING') {
      uiManager.renderHUD(
        ctx,
        w,
        h,
        this.localPlayer,
        this.players,
        this.objectiveSystem,
        levelDef,
        this.lighting,
        this.weather,
        this.tileMap,
        this.buildings,
          this.survivalTime,
          this.getNavigationTarget(levelDef)
      );
    }
  }

  private renderTitleBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const time = Date.now() * 0.001;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, '#0d1b2a');
    skyGrad.addColorStop(0.6, '#1b263b');
    skyGrad.addColorStop(1, '#415a77');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    const oceanGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    oceanGrad.addColorStop(0, '#0077b6');
    oceanGrad.addColorStop(1, '#023e8a');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    for (let i = 0; i < 6; i++) {
      const wy = h * 0.65 + i * 28;
      ctx.beginPath();
      ctx.moveTo(0, wy);
      for (let x = 0; x <= w; x += 40) {
        const offset = Math.sin(time * 2 + x * 0.02 + i) * 6;
        ctx.lineTo(x, wy + offset);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderExtractionZone(ctx: CanvasRenderingContext2D, levelDef: LevelDefinition) {
    const ex = levelDef.extractionPos.x;
    const ey = levelDef.extractionPos.y;
    const isUnlocked = this.objectiveSystem.isExtractionUnlocked;
    const pTime = Date.now() * 0.005;

    ctx.save();
    ctx.strokeStyle = isUnlocked ? '#00e5ff' : 'rgba(255, 235, 59, 0.4)';
    ctx.lineWidth = 3;
    const r = 55 + Math.sin(pTime) * 6;
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = isUnlocked ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 235, 59, 0.08)';
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(ex - 3, ey - 28, 6, 28);

    ctx.fillStyle = isUnlocked ? '#00e5ff' : '#ffb300';
    ctx.beginPath();
    ctx.arc(ex, ey - 28, 6 + Math.sin(pTime * 2) * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isUnlocked ? '#00e5ff' : '#ffd54f';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isUnlocked ? 'EXTRACTION POINT' : 'LOCKED EXTRACTION', ex, ey - 38);

    ctx.restore();
  }

  private getNavigationTarget(levelDef: LevelDefinition): { label: string; position: Vector2 } | null {
    if (!this.localPlayer) return null;

    if (this.objectiveSystem.isExtractionUnlocked) {
      return { label: 'EXTRACTION POINT', position: new Vector2(levelDef.extractionPos.x, levelDef.extractionPos.y) };
    }

    const nextObjective = this.objectiveSystem.objectives.find((objective) => !objective.completed);
    if (!nextObjective) return null;

    const resourceTypeByTarget: Record<string, ResourceNodeType> = {
      wood: 'PALM_TREE',
      stone: 'ROCK',
      berries: 'BERRY_BUSH',
      herbs: 'HERB_PATCH',
      cloth: 'SUPPLY_CRATE',
      metal: 'RUIN_SCRAP',
      fuel: 'SUPPLY_CRATE',
      clean_water: 'WATER_SPRING'
    };
    const resourceType = nextObjective.targetId ? resourceTypeByTarget[nextObjective.targetId] : undefined;
    if (resourceType) {
      const nearest = this.resources
        .filter((resource) => resource.type === resourceType && !resource.isDepleted)
        .sort((a, b) => this.localPlayer!.pos.distanceTo(new Vector2(a.x, a.y)) - this.localPlayer!.pos.distanceTo(new Vector2(b.x, b.y)))[0];
      if (nearest) {
        return { label: nextObjective.text, position: new Vector2(nearest.x, nearest.y) };
      }
    }

    return { label: nextObjective.text, position: new Vector2(levelDef.extractionPos.x, levelDef.extractionPos.y) };
  }

  private renderGroundDrops(ctx: CanvasRenderingContext2D) {
    for (const d of this.groundDrops) {
      const def = ITEM_DEFINITIONS[d.itemId];
      const bob = Math.sin(d.bobOffset) * 4;

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 4, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText(def ? def.iconSymbol : '📦', d.x, d.y + bob);

      if (d.quantity > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${d.quantity}`, d.x + 8, d.y + bob + 4);
      }

      ctx.restore();
    }
  }

  private renderGhostBuilding(ctx: CanvasRenderingContext2D) {
    const bDef = BUILDING_DEFINITIONS[this.placingDefId];
    if (!bDef || !this.localPlayer) return;

    const snapX = Math.floor(this.mouseWorldPos.x / 32) * 32;
    const snapY = Math.floor(this.mouseWorldPos.y / 32) * 32;

    const isColliding = this.tileMap.isWorldSolid(snapX + bDef.width / 2, snapY + bDef.height / 2);
    const canAfford = BuildingSystem.canBuild(bDef, this.localPlayer.inventory);
    const isValid = !isColliding && canAfford;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(snapX, snapY, bDef.width, bDef.height);

    ctx.fillStyle = isValid ? 'rgba(76, 175, 80, 0.45)' : 'rgba(244, 67, 54, 0.45)';
    ctx.fillRect(snapX, snapY, bDef.width, bDef.height);

    ctx.strokeStyle = isValid ? '#4caf50' : '#f44336';
    ctx.lineWidth = 2;
    ctx.strokeRect(snapX, snapY, bDef.width, bDef.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isValid ? `[L-CLICK] Place ${bDef.name}` : `[BLOCKED] Invalid Spot`, snapX + bDef.width / 2, snapY - 8);

    ctx.restore();
  }

  private gameLoop(time: number) {
    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameEngine();
});

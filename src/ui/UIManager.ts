import type { LevelDefinition, CraftingRecipe } from '../types';
import { Player } from '../entities/Player';
import { LightingSystem } from '../engine/LightingSystem';
import { WeatherSystem } from '../engine/WeatherSystem';
import { TileMap } from '../world/TileMap';
import { BuildingInstance } from '../entities/Building';
import { ObjectiveSystem } from '../systems/ObjectiveSystem';
import { CRAFTING_RECIPES } from '../systems/Crafting';
import { ITEM_DEFINITIONS } from '../systems/Inventory';
import { Vector2 } from '../engine/Vector2';

export class UIManager {
  public isInventoryOpen: boolean = false;
  public isCraftingOpen: boolean = false;
  public selectedRecipe: CraftingRecipe | null = null;
  public selectedRecipeCategory: string = 'SURVIVAL';

  public isSettingsOpen: boolean = false;
  public isHowToPlayOpen: boolean = false;
  public isCreditsOpen: boolean = false;

  public promptText: string = '';
  public showFullObjectivesOnMobile: boolean = false;

  constructor() {
    this.selectedRecipe = CRAFTING_RECIPES[0];
  }

  public setPrompt(text: string) {
    this.promptText = text;
  }

  public clearPrompt() {
    this.promptText = '';
  }

  // Show a transient hint overlay that auto-clears after a duration
  public showHint(message: string, durationMs: number = 5000) {
    this.promptText = message;
    setTimeout(() => {
      this.clearPrompt();
    }, durationMs);
  }

  public renderHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    localPlayer: Player,
    allPlayers: Player[],
    objectiveSystem: ObjectiveSystem,
    levelDef: LevelDefinition,
    lighting: LightingSystem,
    weather: WeatherSystem,
    tileMap: TileMap,
    buildings: BuildingInstance[],
    survivalTimeSeconds: number,
    navigationTarget: { label: string; position: Vector2 } | null
  ) {
    const isCompact = width < 880;

    // 1. Top Left: Player Status
    this.renderPlayerStatusHUD(ctx, localPlayer, allPlayers, isCompact);

    // 2. Top Right: Environment & Weather
    this.renderEnvironmentHUD(ctx, width, lighting, weather, levelDef, survivalTimeSeconds, isCompact);

    // 3. Right Side under Environment: Minimap (Safe from hotbar and action buttons!)
    this.renderMinimap(ctx, width, height, localPlayer, allPlayers, levelDef, tileMap, buildings, objectiveSystem, isCompact);

    // 4. Top Center: Objectives and Compass Waypoint
    this.renderObjectiveHUD(ctx, width, objectiveSystem, levelDef, localPlayer, navigationTarget, isCompact);

    // 5. Bottom Center: Hotbar
    this.renderHotbarHUD(ctx, width, height, localPlayer, isCompact);
  }

  private renderPlayerStatusHUD(ctx: CanvasRenderingContext2D, localPlayer: Player, _allPlayers: Player[], isCompact: boolean) {
    ctx.save();
    const cardW = isCompact ? 180 : 230;
    const cardH = isCompact ? 96 : 118;
    const barW = isCompact ? 100 : 136;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(14, 14, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isCompact ? 12 : 13}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${localPlayer.charClass.name}`, 22, isCompact ? 30 : 34);

    ctx.fillStyle = localPlayer.charClass.accentColor;
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(localPlayer.charClass.title.toUpperCase(), 22, isCompact ? 42 : 47);

    const bars = [
      { label: '❤️ HP', val: localPlayer.stats.health, max: localPlayer.stats.maxHealth, color: '#f44336' },
      { label: '🍖 FOOD', val: localPlayer.stats.hunger, max: localPlayer.stats.maxHunger, color: '#ff9800' },
      { label: '💧 WATER', val: localPlayer.stats.thirst, max: localPlayer.stats.maxThirst, color: '#00bcd4' },
      { label: '⚡ STAM', val: localPlayer.stats.stamina, max: localPlayer.stats.maxStamina, color: '#4caf50' }
    ];

    bars.forEach((b, i) => {
      const by = (isCompact ? 48 : 55) + i * (isCompact ? 11 : 14);
      ctx.fillStyle = '#b0bec5';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(b.label, 22, by + 7);

      const barX = isCompact ? 70 : 82;
      const barH = isCompact ? 6 : 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, by, barW, barH);

      const ratio = Math.max(0, Math.min(1, b.val / b.max));
      ctx.fillStyle = b.color;
      ctx.fillRect(barX, by, barW * ratio, barH);
    });

    let badgeY = cardH + 20;
    if (localPlayer.stats.hunger < 25) {
      this.drawWarningBadge(ctx, 14, badgeY, '⚠️ LOW FOOD', '#ff9800');
      badgeY += 18;
    }
    if (localPlayer.stats.thirst < 25) {
      this.drawWarningBadge(ctx, 14, badgeY, '⚠️ DEHYDRATED', '#00bcd4');
      badgeY += 18;
    }
    if (localPlayer.isFreezing) {
      this.drawWarningBadge(ctx, 14, badgeY, '❄️ FREEZING', '#80d8ff');
      badgeY += 18;
    }
    if (localPlayer.isPoisoned) {
      this.drawWarningBadge(ctx, 14, badgeY, '☣️ POISONED', '#e040fb');
      badgeY += 18;
    }

    ctx.restore();
  }

  private drawWarningBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, 140, 16, 4);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(text, x + 6, y + 11);
  }

  private renderObjectiveHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    objSystem: ObjectiveSystem,
    levelDef: LevelDefinition,
    player: Player,
    navigationTarget: { label: string; position: Vector2 } | null,
    isCompact: boolean
  ) {
    ctx.save();

    // In horizontal/compact mode, render a sleek non-overlapping top center pill
    const maxBoxW = isCompact ? Math.min(320, width - 360) : 380;
    if (maxBoxW < 180) {
      ctx.restore();
      return; // Not enough horizontal space to display without collision
    }

    const boxX = (width - maxBoxW) / 2;

    if (isCompact) {
      // Sleek single/double row compact header on mobile
      const boxH = 46;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : '#ffb300';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, 14, maxBoxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : '#ffb300';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      const title = objSystem.isExtractionUnlocked ? '⚡ EXTRACTION READY' : `OBJECTIVE: ${levelDef.name.split('—')[1] || levelDef.name}`;
      ctx.fillText(title, width / 2, 28);

      if (navigationTarget) {
        const delta = navigationTarget.position.sub(player.pos);
        const distance = Math.round(delta.length());
        const angle = Math.atan2(delta.y, delta.x);

        const arrowX = boxX + 18;
        const arrowY = 40;
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = '#ffca28';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(4, 5);
        ctx.lineTo(0, 3);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        const navText = `${navigationTarget.label} (${distance}m)`;
        ctx.fillText(navText.length > 34 ? navText.slice(0, 32) + '...' : navText, boxX + 28, 43);
      }
    } else {
      // Full widescreen objectives box
      const boxH = 74 + Math.min(objSystem.objectives.length, 4) * 16;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, 14, maxBoxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : '#ffb300';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        objSystem.isExtractionUnlocked ? '⚡ REACH EXTRACTION POINT' : `OBJECTIVES: ${levelDef.name}`,
        width / 2,
        30
      );

      if (navigationTarget) {
        const delta = navigationTarget.position.sub(player.pos);
        const distance = Math.round(delta.length());
        const angle = Math.atan2(delta.y, delta.x);
        const arrowX = boxX + 24;
        const arrowY = 46;
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = '#ffca28';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffca28';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`WAYPOINT: ${navigationTarget.label} | ${distance}m`, boxX + 36, 49);
      }

      ctx.font = '10px "Segoe UI", sans-serif';
      objSystem.objectives.slice(0, 4).forEach((obj, idx) => {
        const oy = 66 + idx * 16;
        ctx.fillStyle = obj.completed ? '#81c784' : '#cfd8dc';
        const icon = obj.completed ? '✅' : '⬜';
        const progress = obj.type === 'REACH' ? '' : ` (${obj.currentCount}/${obj.targetCount})`;
        ctx.fillText(`${icon} ${obj.text}${progress}`, boxX + 16, oy);
      });
    }

    ctx.restore();
  }

  private renderEnvironmentHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    lighting: LightingSystem,
    weather: WeatherSystem,
    _levelDef: LevelDefinition,
    survivalTimeSeconds: number,
    isCompact: boolean
  ) {
    ctx.save();
    const boxW = isCompact ? 120 : 150;
    const boxH = isCompact ? 46 : 52;
    const boxX = width - boxW - 14;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, 14, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isCompact ? 10 : 11}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`🕒 ${lighting.getTimeString()}`, width - 22, 29);

    const mins = Math.floor(survivalTimeSeconds / 60);
    const secs = Math.floor(survivalTimeSeconds % 60);
    ctx.fillStyle = '#ffca28';
    ctx.font = `bold ${isCompact ? 9 : 10}px monospace`;
    ctx.fillText(`${weather.currentWeather} | ${mins}:${secs.toString().padStart(2, '0')}`, width - 22, isCompact ? 48 : 53);

    ctx.restore();
  }

  private renderHotbarHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: Player,
    isCompact: boolean
  ) {
    ctx.save();

    if (this.promptText) {
      ctx.fillStyle = 'rgba(10, 15, 25, 0.92)';
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 1.5;
      const pWidth = Math.min(width - 40, ctx.measureText(this.promptText).width + 36);
      const px = (width - pWidth) / 2;
      const py = height - (isCompact ? 86 : 108);

      ctx.beginPath();
      ctx.roundRect(px, py, pWidth, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${isCompact ? 11 : 12}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this.promptText, width / 2, py + 17);
    }

    const slotSize = isCompact ? 40 : 46;
    const gap = isCompact ? 6 : 8;
    const totalW = 6 * slotSize + 5 * gap;
    const startX = (width - totalW) / 2;
    const startY = height - (isCompact ? 54 : 64);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(startX - 8, startY - 6, totalW + 16, slotSize + 12, 8);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const sx = startX + i * (slotSize + gap);
      const isSelected = player.inventory.selectedHotbarIndex === i;

      ctx.fillStyle = isSelected ? 'rgba(255, 179, 0, 0.28)' : 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(sx, startY, slotSize, slotSize);

      ctx.strokeStyle = isSelected ? '#ffb300' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(sx, startY, slotSize, slotSize);

      ctx.fillStyle = isSelected ? '#ffb300' : '#90a4ae';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}`, sx + 3, startY + 10);

      const stack = player.inventory.slots[i];
      if (stack) {
        const def = ITEM_DEFINITIONS[stack.itemId];
        if (def) {
          ctx.font = `${isCompact ? 18 : 22}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText(def.iconSymbol, sx + slotSize / 2, startY + slotSize / 2 + (isCompact ? 5 : 7));

          if (stack.quantity > 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${stack.quantity}`, sx + slotSize - 3, startY + slotSize - 3);
          }
        }
      }
    }

    ctx.restore();
  }

  private renderMinimap(
    ctx: CanvasRenderingContext2D,
    width: number,
    _height: number,
    player: Player,
    allPlayers: Player[],
    levelDef: LevelDefinition,
    tileMap: TileMap,
    buildings: BuildingInstance[],
    objSystem: ObjectiveSystem,
    isCompact: boolean
  ) {
    ctx.save();
    // In horizontal mode, place minimap underneath Environment HUD on top-right!
    // This leaves the bottom completely clear for Hotbar and Action Buttons!
    const mapSize = isCompact ? 96 : 115;
    const mx = width - mapSize - 14;
    const my = isCompact ? 68 : 74;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(mx, my, mapSize, mapSize, 8);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mx + 2, my + 2, mapSize - 4, mapSize - 4, 6);
    ctx.clip();

    const worldW = tileMap.width * 32;
    const worldH = tileMap.height * 32;
    const scaleX = (mapSize - 8) / worldW;
    const scaleY = (mapSize - 8) / worldH;

    for (const b of buildings) {
      const bx = mx + 4 + b.x * scaleX;
      const by = my + 4 + b.y * scaleY;
      ctx.fillStyle = b.defId === 'campfire' ? '#ff9800' : '#8d6e63';
      ctx.fillRect(bx - 1.5, by - 1.5, 3, 3);
    }

    const ex = mx + 4 + levelDef.extractionPos.x * scaleX;
    const ey = my + 4 + levelDef.extractionPos.y * scaleY;
    const pGlow = Math.sin(Date.now() * 0.008) * 1.5;
    ctx.fillStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : '#ffd54f';
    ctx.beginPath();
    ctx.arc(ex, ey, 3.5 + pGlow, 0, Math.PI * 2);
    ctx.fill();

    for (const tm of allPlayers) {
      if (tm !== player && !tm.stats.isDead) {
        const tx = mx + 4 + tm.pos.x * scaleX;
        const ty = my + 4 + tm.pos.y * scaleY;
        ctx.fillStyle = tm.stats.isDowned ? '#ff1744' : tm.charClass.accentColor;
        ctx.beginPath();
        ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const px = mx + 4 + player.pos.x * scaleX;
    const py = my + 4 + player.pos.y * scaleY;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = '#90a4ae';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MINIMAP', mx + 5, my + 11);

    ctx.restore();
  }
}

export const uiManager = new UIManager();

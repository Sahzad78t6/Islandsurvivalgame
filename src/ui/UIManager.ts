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

  public getHotbarLayout(width: number, height: number) {
    const isUltraCompact = width < 500;
    const isCompact = width < 880;
    const slotSize = isUltraCompact ? 36 : isCompact ? 40 : 46;
    const gap = isUltraCompact ? 4 : isCompact ? 6 : 8;
    const totalW = 6 * slotSize + 5 * gap;
    const startX = (width - totalW) / 2;
    const startY = height - (isUltraCompact ? 48 : isCompact ? 54 : 64);
    return { slotSize, gap, totalW, startX, startY, isUltraCompact, isCompact };
  }

  public getHotbarSlotAt(screenX: number, screenY: number, width: number, height: number): number | null {
    const { slotSize, gap, totalW, startX, startY } = this.getHotbarLayout(width, height);
    // Generous touch padding (8px)
    if (screenX >= startX - 8 && screenX <= startX + totalW + 8 && screenY >= startY - 8 && screenY <= startY + slotSize + 16) {
      for (let i = 0; i < 6; i++) {
        const sx = startX + i * (slotSize + gap);
        if (screenX >= sx - 4 && screenX <= sx + slotSize + 4) {
          return i;
        }
      }
    }
    return null;
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
    const isUltraCompact = width < 500;
    const isCompact = width < 880;

    // 1. Top Left: Player Status
    this.renderPlayerStatusHUD(ctx, localPlayer, allPlayers, isCompact, isUltraCompact);

    // 2. Top Right: Environment & Weather
    this.renderEnvironmentHUD(ctx, width, lighting, weather, levelDef, survivalTimeSeconds, isCompact, isUltraCompact);

    // 3. Right Side under Environment: Minimap
    this.renderMinimap(ctx, width, height, localPlayer, allPlayers, levelDef, tileMap, buildings, objectiveSystem, isCompact, isUltraCompact);

    // 4. Top Center: Objectives and Compass Waypoint
    this.renderObjectiveHUD(ctx, width, objectiveSystem, levelDef, localPlayer, navigationTarget, isCompact, isUltraCompact);

    // 5. Bottom Center: Hotbar
    this.renderHotbarHUD(ctx, width, height, localPlayer, isCompact, isUltraCompact);
  }

  private renderPlayerStatusHUD(ctx: CanvasRenderingContext2D, localPlayer: Player, _allPlayers: Player[], isCompact: boolean, isUltraCompact: boolean) {
    ctx.save();
    const cardW = isUltraCompact ? 142 : isCompact ? 180 : 230;
    const cardH = isUltraCompact ? 76 : isCompact ? 96 : 118;
    const barW = isUltraCompact ? 76 : isCompact ? 100 : 136;
    const startX = 10;
    const startY = 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(startX, startY, cardW, cardH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isUltraCompact ? 10 : isCompact ? 12 : 13}px "Segoe UI", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(`${localPlayer.charClass.name}`, startX + 8, startY + (isUltraCompact ? 13 : isCompact ? 16 : 18));

    if (!isUltraCompact) {
      ctx.fillStyle = localPlayer.charClass.accentColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(localPlayer.charClass.title.toUpperCase(), startX + 8, isCompact ? 28 : 32);
    }

    const bars = [
      { label: '❤️', val: localPlayer.stats.health, max: localPlayer.stats.maxHealth, color: '#f44336' },
      { label: '🍖', val: localPlayer.stats.hunger, max: localPlayer.stats.maxHunger, color: '#ff9800' },
      { label: '💧', val: localPlayer.stats.thirst, max: localPlayer.stats.maxThirst, color: '#00bcd4' },
      { label: '⚡', val: localPlayer.stats.stamina, max: localPlayer.stats.maxStamina, color: '#4caf50' }
    ];

    bars.forEach((b, i) => {
      const by = startY + (isUltraCompact ? 20 : isCompact ? 36 : 42) + i * (isUltraCompact ? 12 : isCompact ? 13 : 16);
      ctx.fillStyle = '#b0bec5';
      ctx.font = `bold ${isUltraCompact ? 8 : 9}px sans-serif`;
      ctx.fillText(b.label, startX + 6, by + (isUltraCompact ? 7 : 8));

      const barX = startX + (isUltraCompact ? 24 : isCompact ? 48 : 56);
      const barH = isUltraCompact ? 5 : isCompact ? 6 : 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, by + 1, barW, barH);

      const ratio = Math.max(0, Math.min(1, b.val / b.max));
      ctx.fillStyle = b.color;
      ctx.fillRect(barX, by + 1, barW * ratio, barH);
    });

    let badgeY = startY + cardH + 6;
    if (localPlayer.stats.hunger < 25) {
      this.drawWarningBadge(ctx, startX, badgeY, '⚠️ LOW FOOD', '#ff9800');
      badgeY += 16;
    }
    if (localPlayer.stats.thirst < 25) {
      this.drawWarningBadge(ctx, startX, badgeY, '⚠️ DEHYDRATED', '#00bcd4');
      badgeY += 16;
    }
    if (localPlayer.isFreezing) {
      this.drawWarningBadge(ctx, startX, badgeY, '❄️ FREEZING', '#80d8ff');
      badgeY += 16;
    }
    if (localPlayer.isPoisoned) {
      this.drawWarningBadge(ctx, startX, badgeY, '☣️ POISONED', '#e040fb');
      badgeY += 16;
    }

    ctx.restore();
  }

  private drawWarningBadge(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, 120, 14, 4);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(text, x + 6, y + 10);
  }

  private renderObjectiveHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    objSystem: ObjectiveSystem,
    levelDef: LevelDefinition,
    player: Player,
    navigationTarget: { label: string; position: Vector2 } | null,
    isCompact: boolean,
    isUltraCompact: boolean
  ) {
    ctx.save();

    const maxBoxW = isUltraCompact ? Math.min(220, width - 200) : isCompact ? Math.min(300, width - 320) : 380;
    if (maxBoxW < 120) {
      ctx.restore();
      return;
    }

    const boxX = (width - maxBoxW) / 2;

    if (isCompact || isUltraCompact) {
      const boxH = isUltraCompact ? 38 : 46;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : '#ffb300';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, 10, maxBoxW, boxH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : '#ffb300';
      ctx.font = `bold ${isUltraCompact ? 9 : 10}px sans-serif`;
      ctx.textAlign = 'center';
      const title = objSystem.isExtractionUnlocked ? '⚡ EXTRACTION READY' : `OBJECTIVE`;
      ctx.fillText(title, width / 2, isUltraCompact ? 22 : 25);

      if (navigationTarget) {
        const delta = navigationTarget.position.sub(player.pos);
        const distance = Math.round(delta.length());
        const angle = Math.atan2(delta.y, delta.x);

        const arrowX = boxX + 14;
        const arrowY = isUltraCompact ? 29 : 35;
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = '#ffca28';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(3, 4);
        ctx.lineTo(0, 2);
        ctx.lineTo(-3, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'left';
        const navText = `${navigationTarget.label} (${distance}m)`;
        ctx.fillText(navText.length > 26 ? navText.slice(0, 24) + '...' : navText, boxX + 22, isUltraCompact ? 32 : 38);
      }
    } else {
      const boxH = 74 + Math.min(objSystem.objectives.length, 4) * 16;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, 12, maxBoxW, boxH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = objSystem.isExtractionUnlocked ? '#00e5ff' : '#ffb300';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        objSystem.isExtractionUnlocked ? '⚡ REACH EXTRACTION POINT' : `OBJECTIVES: ${levelDef.name}`,
        width / 2,
        28
      );

      if (navigationTarget) {
        const delta = navigationTarget.position.sub(player.pos);
        const distance = Math.round(delta.length());
        const angle = Math.atan2(delta.y, delta.x);
        const arrowX = boxX + 20;
        const arrowY = 44;
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

        ctx.fillStyle = '#ffca28';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`WAYPOINT: ${navigationTarget.label} | ${distance}m`, boxX + 32, 47);
      }

      ctx.font = '10px "Segoe UI", sans-serif';
      objSystem.objectives.slice(0, 4).forEach((obj, idx) => {
        const oy = 64 + idx * 16;
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
    isCompact: boolean,
    isUltraCompact: boolean
  ) {
    ctx.save();
    const boxW = isUltraCompact ? 90 : isCompact ? 116 : 144;
    const boxH = isUltraCompact ? 36 : isCompact ? 44 : 50;
    const boxX = width - boxW - 10;
    const boxY = 10;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isUltraCompact ? 9 : isCompact ? 10 : 11}px monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(`🕒 ${lighting.getTimeString()}`, width - 16, boxY + (isUltraCompact ? 13 : 15));

    const mins = Math.floor(survivalTimeSeconds / 60);
    const secs = Math.floor(survivalTimeSeconds % 60);
    ctx.fillStyle = '#ffca28';
    ctx.font = `bold ${isUltraCompact ? 8 : 9}px monospace`;
    ctx.fillText(`${weather.currentWeather} ${mins}:${secs.toString().padStart(2, '0')}`, width - 16, boxY + (isUltraCompact ? 28 : 34));

    ctx.restore();
  }

  private renderHotbarHUD(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    player: Player,
    isCompact: boolean,
    isUltraCompact: boolean
  ) {
    ctx.save();

    if (this.promptText) {
      ctx.fillStyle = 'rgba(10, 15, 25, 0.94)';
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 1.5;
      const pWidth = Math.min(width - 24, ctx.measureText(this.promptText).width + 32);
      const px = (width - pWidth) / 2;
      const py = height - (isUltraCompact ? 76 : isCompact ? 86 : 106);

      ctx.beginPath();
      ctx.roundRect(px, py, pWidth, isUltraCompact ? 22 : 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${isUltraCompact ? 10 : isCompact ? 11 : 12}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(this.promptText, width / 2, py + (isUltraCompact ? 15 : 17));
    }

    const { slotSize, gap, totalW, startX, startY } = this.getHotbarLayout(width, height);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(startX - 6, startY - 4, totalW + 12, slotSize + 8, 6);
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
      ctx.font = `bold ${isUltraCompact ? 8 : 9}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}`, sx + 2, startY + (isUltraCompact ? 8 : 10));

      const stack = player.inventory.slots[i];
      if (stack) {
        const def = ITEM_DEFINITIONS[stack.itemId];
        if (def) {
          ctx.font = `${isUltraCompact ? 16 : isCompact ? 18 : 22}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText(def.iconSymbol, sx + slotSize / 2, startY + slotSize / 2 + (isUltraCompact ? 4 : isCompact ? 5 : 7));

          if (stack.quantity > 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${isUltraCompact ? 8 : 9}px monospace`;
            ctx.textAlign = 'right';
            ctx.fillText(`${stack.quantity}`, sx + slotSize - 2, startY + slotSize - 2);
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
    isCompact: boolean,
    isUltraCompact: boolean
  ) {
    ctx.save();
    const mapSize = isUltraCompact ? 68 : isCompact ? 84 : 110;
    const mx = width - mapSize - 10;
    const my = isUltraCompact ? 50 : isCompact ? 58 : 66;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(mx, my, mapSize, mapSize, 6);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mx + 2, my + 2, mapSize - 4, mapSize - 4, 4);
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
    ctx.arc(ex, ey, 3 + pGlow, 0, Math.PI * 2);
    ctx.fill();

    for (const tm of allPlayers) {
      if (tm !== player && !tm.stats.isDead) {
        const tx = mx + 4 + tm.pos.x * scaleX;
        const ty = my + 4 + tm.pos.y * scaleY;
        ctx.fillStyle = tm.stats.isDowned ? '#ff1744' : tm.charClass.accentColor;
        ctx.beginPath();
        ctx.arc(tx, ty, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const px = mx + 4 + player.pos.x * scaleX;
    const py = my + 4 + player.pos.y * scaleY;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = '#90a4ae';
    ctx.font = `bold ${isUltraCompact ? 7 : 8}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText('MAP', mx + 4, my + 9);

    ctx.restore();
  }
}

export const uiManager = new UIManager();

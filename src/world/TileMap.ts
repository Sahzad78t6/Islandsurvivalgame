// Procedural TileMap, Biome Generation, and Multi-layer World Renderer

import type { BiomeType } from '../types';

export const TILE_SIZE = 32;

export type TileType = 
  | 'WATER_DEEP'
  | 'WATER_SHALLOW'
  | 'SAND'
  | 'DIRT'
  | 'GRASS'
  | 'DENSE_GRASS'
  | 'STONE_FLOOR'
  | 'CAVE_WALL'
  | 'SNOW'
  | 'ICE'
  | 'ASPHALT'
  | 'CONCRETE'
  | 'METAL_GRATE'
  | 'BRIDGE_WOOD'
  | 'HELIPAD';

export class TileMap {
  public width: number;
  public height: number;
  public biome: BiomeType;
  public tiles: TileType[][];
  public solidGrid: boolean[][];

  private waterAnimTime: number = 0;

  constructor(width: number = 50, height: number = 40, biome: BiomeType = 'BEACH') {
    this.width = width;
    this.height = height;
    this.biome = biome;
    this.tiles = [];
    this.solidGrid = [];

    this.generateBiome(biome);
  }

  public generateBiome(biome: BiomeType) {
    this.biome = biome;
    this.tiles = [];
    this.solidGrid = [];

    for (let y = 0; y < this.height; y++) {
      const row: TileType[] = [];
      const solidRow: boolean[] = [];

      for (let x = 0; x < this.width; x++) {
        let tile: TileType = 'SAND';
        let isSolid = false;

        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          tile = biome === 'CAVE' ? 'CAVE_WALL' : 'WATER_DEEP';
          isSolid = true;
        } else {
          switch (biome) {
            case 'BEACH': {
              if (x < 4) {
                tile = 'WATER_DEEP';
                isSolid = true;
              } else if (x < 7) {
                tile = 'WATER_SHALLOW';
              } else if (x < 36) {
                tile = 'SAND';
              } else {
                tile = 'GRASS';
              }
              break;
            }

            case 'COASTAL_FOREST': {
              if (x < 3) {
                tile = 'WATER_DEEP';
                isSolid = true;
              } else if (x < 5) {
                tile = 'SAND';
              } else {
                const trailY = Math.floor(this.height * 0.45 + Math.sin(x * 0.2) * 5);
                if (Math.abs(y - trailY) <= 1) {
                  tile = 'DIRT';
                } else if ((x + y * 3) % 7 === 0) {
                  tile = 'DENSE_GRASS';
                } else {
                  tile = 'GRASS';
                }
              }
              break;
            }

            case 'DEEP_FOREST': {
              if ((x * 13 + y * 7) % 19 === 0) {
                tile = 'DIRT';
              } else if ((x * 5 + y * 11) % 9 === 0) {
                tile = 'DENSE_GRASS';
              } else {
                tile = 'GRASS';
              }
              break;
            }

            case 'CAVE': {
              const cavernNoise = Math.sin(x * 0.25) * Math.cos(y * 0.25);
              if (cavernNoise > 0.45 && !(x > 15 && x < 25 && y > 15 && y < 25)) {
                tile = 'CAVE_WALL';
                isSolid = true;
              } else if ((x * 7 + y * 13) % 23 === 0) {
                tile = 'WATER_SHALLOW';
              } else {
                tile = 'STONE_FLOOR';
              }
              break;
            }

            case 'RIVER_VALLEY': {
              const riverCenter = 30 + Math.floor(Math.sin(y * 0.3) * 3);
              if (Math.abs(x - riverCenter) <= 2) {
                if (y >= 18 && y <= 22) {
                  tile = 'BRIDGE_WOOD';
                  isSolid = false;
                } else {
                  tile = 'WATER_DEEP';
                  isSolid = true;
                }
              } else if (Math.abs(x - riverCenter) <= 4) {
                tile = 'WATER_SHALLOW';
              } else {
                tile = 'GRASS';
              }
              break;
            }

            case 'MOUNTAIN': {
              const cliffNoise = Math.sin(x * 0.3) + Math.cos(y * 0.3);
              if (cliffNoise > 1.3) {
                tile = 'CAVE_WALL';
                isSolid = true;
              } else if ((x + y) % 6 === 0) {
                tile = 'ICE';
              } else {
                tile = 'SNOW';
              }
              break;
            }

            case 'RUINS': {
              if ((x > 15 && x < 45) && (y > 10 && y < 35)) {
                if ((x === 16 || x === 44 || y === 11 || y === 34) && !(x === 30 || y === 22)) {
                  tile = 'CONCRETE';
                  isSolid = true;
                } else if ((x + y) % 3 === 0) {
                  tile = 'ASPHALT';
                } else {
                  tile = 'CONCRETE';
                }
              } else {
                tile = 'DENSE_GRASS';
              }
              break;
            }

            case 'STORM_ISLAND': {
              if ((x * 11 + y * 17) % 13 === 0) {
                tile = 'WATER_SHALLOW';
              } else if ((x * 7 + y * 5) % 9 === 0) {
                tile = 'DIRT';
              } else {
                tile = 'SAND';
              }
              break;
            }

            case 'FACILITY': {
              if (x === 10 || x === 45 || y === 8 || y === 38) {
                if (x === 10 && (y === 22 || y === 23)) {
                  tile = 'METAL_GRATE';
                } else if (x === 45 && (y === 22 || y === 23)) {
                  tile = 'METAL_GRATE';
                } else {
                  tile = 'CONCRETE';
                  isSolid = true;
                }
              } else if ((x + y) % 4 === 0) {
                tile = 'METAL_GRATE';
              } else {
                tile = 'CONCRETE';
              }
              break;
            }

            case 'FINAL_ESCAPE': {
              if (x < 5) {
                tile = 'WATER_DEEP';
                isSolid = true;
              } else if (x >= 56 && x <= 64 && y >= 8 && y <= 16) {
                tile = 'HELIPAD';
              } else if (x < 12) {
                tile = 'SAND';
              } else {
                tile = 'GRASS';
              }
              break;
            }
          }
        }

        row.push(tile);
        solidRow.push(isSolid);
      }
      this.tiles.push(row);
      this.solidGrid.push(solidRow);
    }
  }

  public isWorldSolid(x: number, y: number): boolean {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return true;
    }
    return this.solidGrid[ty][tx];
  }

  public update(dt: number) {
    this.waterAnimTime += dt * 2.5;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    viewMinX: number,
    viewMinY: number,
    viewMaxX: number,
    viewMaxY: number
  ) {
    const startTileX = Math.max(0, Math.floor(viewMinX / TILE_SIZE));
    const endTileX = Math.min(this.width - 1, Math.ceil(viewMaxX / TILE_SIZE));
    const startTileY = Math.max(0, Math.floor(viewMinY / TILE_SIZE));
    const endTileY = Math.min(this.height - 1, Math.ceil(viewMaxY / TILE_SIZE));

    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const tile = this.tiles[ty][tx];
        const px = tx * TILE_SIZE;
        const py = ty * TILE_SIZE;

        switch (tile) {
          case 'SAND':
            ctx.fillStyle = (tx + ty) % 2 === 0 ? '#e6c88b' : '#dfbf82';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            break;

          case 'GRASS':
            ctx.fillStyle = (tx + ty) % 2 === 0 ? '#4caf50' : '#43a047';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            break;

          case 'DENSE_GRASS':
            ctx.fillStyle = '#2e7d32';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#388e3c';
            ctx.fillRect(px + 4, py + 4, 8, 8);
            ctx.fillRect(px + 18, py + 16, 8, 8);
            break;

          case 'DIRT':
            ctx.fillStyle = (tx + ty) % 2 === 0 ? '#795548' : '#6d4c41';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            break;

          case 'WATER_DEEP':
            ctx.fillStyle = '#01579b';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(2, 136, 209, 0.4)';
            const waveY = Math.sin(this.waterAnimTime + tx * 0.5) * 4;
            ctx.fillRect(px, py + 12 + waveY, TILE_SIZE, 6);
            break;

          case 'WATER_SHALLOW':
            ctx.fillStyle = '#00acc1';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            const foamWave = Math.sin(this.waterAnimTime * 1.5 + ty * 0.4) * 3;
            ctx.fillRect(px, py + 14 + foamWave, TILE_SIZE, 3);
            break;

          case 'STONE_FLOOR':
            ctx.fillStyle = (tx + ty) % 2 === 0 ? '#424242' : '#37474f';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#263238';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            break;

          case 'CAVE_WALL':
            ctx.fillStyle = '#212121';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#181818';
            ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            break;

          case 'SNOW':
            ctx.fillStyle = (tx + ty) % 2 === 0 ? '#eceff1' : '#cfd8dc';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            break;

          case 'ICE':
            ctx.fillStyle = '#b3e5fc';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            break;

          case 'ASPHALT':
            ctx.fillStyle = '#37474f';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            if ((tx * 3 + ty) % 5 === 0) {
              ctx.strokeStyle = '#263238';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(px + 4, py + 8);
              ctx.lineTo(px + 24, py + 22);
              ctx.stroke();
            }
            break;

          case 'CONCRETE':
            ctx.fillStyle = '#78909c';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#546e7a';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            break;

          case 'METAL_GRATE':
            ctx.fillStyle = '#455a64';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#90a4ae';
            ctx.lineWidth = 1;
            for (let i = 4; i < TILE_SIZE; i += 8) {
              ctx.beginPath();
              ctx.moveTo(px + i, py);
              ctx.lineTo(px + i, py + TILE_SIZE);
              ctx.stroke();
            }
            break;

          case 'BRIDGE_WOOD':
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#8d6e63';
            ctx.lineWidth = 2;
            for (let i = 6; i < TILE_SIZE; i += 8) {
              ctx.beginPath();
              ctx.moveTo(px, py + i);
              ctx.lineTo(px + TILE_SIZE, py + i);
              ctx.stroke();
            }
            break;

          case 'HELIPAD':
            ctx.fillStyle = '#263238';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#ffb300';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            break;
        }
      }
    }

    if (this.biome === 'FINAL_ESCAPE') {
      const hx = 60 * TILE_SIZE;
      const hy = 12 * TILE_SIZE;
      ctx.save();
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(hx, hy, 85, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', hx, hy);

      const pGlow = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 235, 59, ${0.4 + pGlow * 0.6})`;
      const corners = [
        [-80, -80], [80, -80], [-80, 80], [80, 80]
      ];
      for (const [cx, cy] of corners) {
        ctx.beginPath();
        ctx.arc(hx + cx, hy + cy, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}


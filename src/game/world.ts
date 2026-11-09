/**
 * Hollowfall - World & Chunk Data Management
 * Двухслойный воксельный мир (Свет и Тень), разбитый на чанки 32x32 на типизированных массивах
 */

import { AABB, InventorySlot, LayerType, LiquidType, TileType, WallType } from './types.ts';

export const CHUNK_SIZE = 32;
export const TILE_SIZE = 16; // 16x16 pixels per tile

export interface Chunk {
  cx: number;
  cy: number;
  tiles: Uint16Array;
  walls: Uint8Array;
  liquids: Uint8Array;
  light: Uint8Array;
  dirty: boolean;
  cachedCanvas?: HTMLCanvasElement;
}

export class World {
  public width: number;   // in tiles
  public height: number;  // in tiles
  public chunksX: number;
  public chunksY: number;

  // Dual layer chunks: [layer][chunkIndex]
  private chunks: [Map<number, Chunk>, Map<number, Chunk>];
  public activeLayer: LayerType = LayerType.LIGHT;

  // Chest inventories: key `${layer}_${tx}_${ty}` -> 30 slots
  public chests: Map<string, (InventorySlot | null)[]> = new Map();

  // World time & cycle: 0..86400 (seconds in full day/night cycle)
  public time: number = 28800; // 08:00 AM start
  public timeSpeed: number = 60; // 1 real sec = 60 world sec

  constructor(width: number = 800, height: number = 400) {
    this.width = width;
    this.height = height;
    this.chunksX = Math.ceil(width / CHUNK_SIZE);
    this.chunksY = Math.ceil(height / CHUNK_SIZE);

    this.chunks = [new Map(), new Map()];
  }

  private getChunkKey(cx: number, cy: number): number {
    return cy * this.chunksX + cx;
  }

  public getOrCreateChunk(layer: LayerType, cx: number, cy: number): Chunk {
    if (cx < 0 || cx >= this.chunksX || cy < 0 || cy >= this.chunksY) {
      // Empty dummy chunk for out of bounds
      return {
        cx,
        cy,
        tiles: new Uint16Array(CHUNK_SIZE * CHUNK_SIZE),
        walls: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
        liquids: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
        light: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
        dirty: false,
      };
    }
    const key = this.getChunkKey(cx, cy);
    const map = this.chunks[layer];
    let chunk = map.get(key);
    if (!chunk) {
      chunk = {
        cx,
        cy,
        tiles: new Uint16Array(CHUNK_SIZE * CHUNK_SIZE),
        walls: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
        liquids: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
        light: new Uint8Array(CHUNK_SIZE * CHUNK_SIZE),
        dirty: true,
      };
      map.set(key, chunk);
    }
    return chunk;
  }

  public getTile(layer: LayerType, tx: number, ty: number): TileType {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return TileType.STONE; // Solid border
    }
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(layer, cx, cy);
    const lx = tx % CHUNK_SIZE;
    const ly = ty % CHUNK_SIZE;
    return chunk.tiles[ly * CHUNK_SIZE + lx] as TileType;
  }

  public setTile(layer: LayerType, tx: number, ty: number, tile: TileType): boolean {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return false;
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(layer, cx, cy);
    const lx = tx % CHUNK_SIZE;
    const ly = ty % CHUNK_SIZE;
    const idx = ly * CHUNK_SIZE + lx;

    if (chunk.tiles[idx] === tile) return false;
    chunk.tiles[idx] = tile;
    chunk.dirty = true;

    // Mark neighbor chunks dirty if on edge
    if (lx === 0 && cx > 0) this.getOrCreateChunk(layer, cx - 1, cy).dirty = true;
    if (lx === CHUNK_SIZE - 1 && cx < this.chunksX - 1) this.getOrCreateChunk(layer, cx + 1, cy).dirty = true;
    if (ly === 0 && cy > 0) this.getOrCreateChunk(layer, cx, cy - 1).dirty = true;
    if (ly === CHUNK_SIZE - 1 && cy < this.chunksY - 1) this.getOrCreateChunk(layer, cx, cy + 1).dirty = true;

    return true;
  }

  public getWall(layer: LayerType, tx: number, ty: number): WallType {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return WallType.NONE;
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(layer, cx, cy);
    return chunk.walls[(ty % CHUNK_SIZE) * CHUNK_SIZE + (tx % CHUNK_SIZE)] as WallType;
  }

  public setWall(layer: LayerType, tx: number, ty: number, wall: WallType): void {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return;
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(layer, cx, cy);
    chunk.walls[(ty % CHUNK_SIZE) * CHUNK_SIZE + (tx % CHUNK_SIZE)] = wall;
    chunk.dirty = true;
  }

  public getLight(layer: LayerType, tx: number, ty: number): number {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return 0;
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(layer, cx, cy);
    return chunk.light[(ty % CHUNK_SIZE) * CHUNK_SIZE + (tx % CHUNK_SIZE)];
  }

  public setLight(layer: LayerType, tx: number, ty: number, level: number): void {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return;
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(layer, cx, cy);
    chunk.light[(ty % CHUNK_SIZE) * CHUNK_SIZE + (tx % CHUNK_SIZE)] = Math.min(15, Math.max(0, level));
  }

  public getLiquid(layer: LayerType, tx: number, ty: number): { type: LiquidType; level: number } {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return { type: LiquidType.NONE, level: 0 };
    }
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(layer, cx, cy);
    const val = chunk.liquids[(ty % CHUNK_SIZE) * CHUNK_SIZE + (tx % CHUNK_SIZE)];
    return {
      type: (val >> 6) as LiquidType,
      level: val & 0x3f,
    };
  }

  public setLiquid(layer: LayerType, tx: number, ty: number, type: LiquidType, level: number): void {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return;
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cy = Math.floor(ty / CHUNK_SIZE);
    const chunk = this.getOrCreateChunk(layer, cx, cy);
    const val = ((type & 0x03) << 6) | (Math.min(32, Math.max(0, level)) & 0x3f);
    chunk.liquids[(ty % CHUNK_SIZE) * CHUNK_SIZE + (tx % CHUNK_SIZE)] = val;
  }

  public isSolid(layer: LayerType, tx: number, ty: number): boolean {
    const tile = this.getTile(layer, tx, ty);
    return World.isTileSolid(tile);
  }

  public static isTileSolid(tile: TileType): boolean {
    if (tile === TileType.AIR) return false;
    if (tile === TileType.LEAVES) return false; // CRITICAL: Tree leaves are non-solid background canopy!
    if (tile === TileType.PLATFORM) return false; // Handled specially
    if (tile === TileType.DOOR_OPEN) return false;
    if (tile === TileType.TORCH || tile === TileType.SHADOW_TORCH) return false;
    if (tile === TileType.ROPE) return false;
    if (tile === TileType.CHEST || tile === TileType.WORKBENCH || tile === TileType.FURNACE || tile === TileType.ANVIL || tile === TileType.PHASE_ALTAR || tile === TileType.CHAIR || tile === TileType.TABLE || tile === TileType.POT) {
      return false; // Solid base, but entities can walk across or interact
    }
    return true;
  }

  /**
   * Terraria-style tree felling: when a trunk tile is broken with an axe,
   * all connected trunk tiles above it and the leaf crown topple down into loot!
   */
  public fellTree(layer: LayerType, tx: number, ty: number): { x: number; y: number; tile: TileType }[] {
    const broken: { x: number; y: number; tile: TileType }[] = [];
    
    // Break the target trunk block
    this.setTile(layer, tx, ty, TileType.AIR);
    broken.push({ x: tx, y: ty, tile: TileType.WOOD });

    // Track upwards breaking all contiguous trunk tiles
    let currentY = ty - 1;
    let trunkTopY = ty;
    while (currentY >= 0) {
      const t = this.getTile(layer, tx, currentY);
      if (t === TileType.WOOD) {
        this.setTile(layer, tx, currentY, TileType.AIR);
        broken.push({ x: tx, y: currentY, tile: TileType.WOOD });
        trunkTopY = currentY;
        currentY--;
      } else {
        break;
      }
    }

    // Clear connected leaves in the canopy radius around trunk top
    for (let dy = -3; dy <= 2; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const lx = tx + dx;
        const ly = trunkTopY + dy;
        if (this.getTile(layer, lx, ly) === TileType.LEAVES) {
          this.setTile(layer, lx, ly, TileType.AIR);
          broken.push({ x: lx, y: ly, tile: TileType.LEAVES });
        }
      }
    }

    return broken;
  }

  public static isPlatform(tile: TileType): boolean {
    return tile === TileType.PLATFORM;
  }

  public static isRope(tile: TileType): boolean {
    return tile === TileType.ROPE;
  }

  public static getLightEmission(tile: TileType): number {
    switch (tile) {
      case TileType.TORCH: return 14;
      case TileType.SHADOW_TORCH: return 13;
      case TileType.LUMINESCENT_MUSHROOM: return 10;
      case TileType.PRISMATIC_CRYSTAL: return 12;
      case TileType.MAGMA_ROCK: return 13;
      case TileType.ECHO_SHARD_ORE: return 9;
      case TileType.VOID_CRYSTAL: return 11;
      case TileType.CRYSTAL_BRIDGE: return 10;
      case TileType.FURNACE: return 11;
      case TileType.PHASE_ALTAR: return 13;
      default: return 0;
    }
  }

  /**
   * Fast AABB box collision against tiles
   */
  public checkAABBCollision(
    layer: LayerType,
    box: AABB,
    ignorePlatforms: boolean = false,
    vy: number = 0
  ): { collided: boolean; tiles: { x: number; y: number; tile: TileType }[] } {
    const minTX = Math.floor(box.x / TILE_SIZE);
    const maxTX = Math.floor((box.x + box.w - 0.01) / TILE_SIZE);
    const minTY = Math.floor(box.y / TILE_SIZE);
    const maxTY = Math.floor((box.y + box.h - 0.01) / TILE_SIZE);

    const hits: { x: number; y: number; tile: TileType }[] = [];

    for (let ty = minTY; ty <= maxTY; ty++) {
      for (let tx = minTX; tx <= maxTX; tx++) {
        const tile = this.getTile(layer, tx, ty);
        if (World.isTileSolid(tile)) {
          hits.push({ x: tx, y: ty, tile });
        } else if (tile === TileType.PLATFORM && !ignorePlatforms && vy > 0) {
          // One-way platform: only collides if entity's feet were above or at platform level
          const platTop = ty * TILE_SIZE;
          const entityFeet = box.y + box.h;
          if (entityFeet >= platTop && entityFeet - vy <= platTop + 4) {
            hits.push({ x: tx, y: ty, tile });
          }
        }
      }
    }

    return {
      collided: hits.length > 0,
      tiles: hits,
    };
  }

  /**
   * Fast lighting recalculation for visible region
   */
  public computeLightingRegion(layer: LayerType, minCX: number, minCY: number, maxCX: number, maxCY: number): void {
    const queue: [number, number, number][] = [];
    const minTX = Math.max(0, minCX * CHUNK_SIZE);
    const maxTX = Math.min(this.width - 1, (maxCX + 1) * CHUNK_SIZE - 1);
    const minTY = Math.max(0, minCY * CHUNK_SIZE);
    const maxTY = Math.min(this.height - 1, (maxCY + 1) * CHUNK_SIZE - 1);

    // 1. Clear light in region
    for (let ty = minTY; ty <= maxTY; ty++) {
      for (let tx = minTX; tx <= maxTX; tx++) {
        this.setLight(layer, tx, ty, 0);
      }
    }

    // 2. Seed sunlight from top & emitters
    const sunLevel = layer === LayerType.LIGHT ? 15 : 6; // Shadow realm has darker ambient sky

    for (let tx = minTX; tx <= maxTX; tx++) {
      let absorbed = false;
      for (let ty = 0; ty <= maxTY; ty++) {
        const tile = this.getTile(layer, tx, ty);
        const wall = this.getWall(layer, tx, ty);

        if (!absorbed && tile === TileType.AIR && wall === WallType.NONE) {
          if (ty >= minTY) {
            this.setLight(layer, tx, ty, sunLevel);
            queue.push([tx, ty, sunLevel]);
          }
        } else {
          absorbed = true;
        }

        // Check emitter
        const emission = World.getLightEmission(tile);
        if (emission > 0 && ty >= minTY) {
          this.setLight(layer, tx, ty, emission);
          queue.push([tx, ty, emission]);
        }
      }
    }

    // 3. Fast BFS propagation
    let head = 0;
    while (head < queue.length) {
      const [x, y, lvl] = queue[head++];
      if (lvl <= 1) continue;

      const nLvl = lvl - 1;
      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < minTX || nx > maxTX || ny < minTY || ny > maxTY) continue;
        const cur = this.getLight(layer, nx, ny);
        const solid = World.isTileSolid(this.getTile(layer, nx, ny));
        const effectiveNLvl = solid ? Math.max(0, nLvl - 2) : nLvl;

        if (effectiveNLvl > cur) {
          this.setLight(layer, nx, ny, effectiveNLvl);
          if (effectiveNLvl > 1) {
            queue.push([nx, ny, effectiveNLvl]);
          }
        }
      }
    }
  }

  /**
   * Liquid cellular automata step
   */
  public stepLiquids(layer: LayerType, minTX: number, maxTX: number, minTY: number, maxTY: number): void {
    let budget = 400; // max cell transitions per frame to prevent lag
    for (let ty = maxTY; ty >= minTY && budget > 0; ty--) {
      for (let tx = minTX; tx <= maxTX && budget > 0; tx++) {
        const cur = this.getLiquid(layer, tx, ty);
        if (cur.type === LiquidType.NONE || cur.level === 0) continue;

        // Flow downwards
        const belowTile = this.getTile(layer, tx, ty + 1);
        if (!World.isTileSolid(belowTile) && ty + 1 < this.height) {
          const belowLiq = this.getLiquid(layer, tx, ty + 1);
          if (belowLiq.type === LiquidType.NONE || belowLiq.type === cur.type) {
            const transfer = Math.min(cur.level, 32 - belowLiq.level);
            if (transfer > 0) {
              this.setLiquid(layer, tx, ty, cur.type, cur.level - transfer);
              this.setLiquid(layer, tx, ty + 1, cur.type, belowLiq.level + transfer);
              budget--;
              continue;
            }
          } else if (
            (cur.type === LiquidType.WATER && belowLiq.type === LiquidType.LAVA) ||
            (cur.type === LiquidType.LAVA && belowLiq.type === LiquidType.WATER)
          ) {
            // Water meets Lava -> solidify into Obsidianite!
            this.setLiquid(layer, tx, ty, LiquidType.NONE, 0);
            this.setLiquid(layer, tx, ty + 1, LiquidType.NONE, 0);
            this.setTile(layer, tx, ty + 1, TileType.OBSIDIANITE_ORE);
            budget--;
            continue;
          }
        }

        // Flow sideways
        const leftTile = this.getTile(layer, tx - 1, ty);
        const rightTile = this.getTile(layer, tx + 1, ty);
        const leftLiq = this.getLiquid(layer, tx - 1, ty);
        const rightLiq = this.getLiquid(layer, tx + 1, ty);

        if (!World.isTileSolid(leftTile) && leftLiq.level < cur.level - 1 && tx > 0) {
          const transfer = Math.floor((cur.level - leftLiq.level) / 2);
          if (transfer > 0) {
            this.setLiquid(layer, tx, ty, cur.type, cur.level - transfer);
            this.setLiquid(layer, tx - 1, ty, cur.type, leftLiq.level + transfer);
            budget--;
          }
        } else if (!World.isTileSolid(rightTile) && rightLiq.level < cur.level - 1 && tx < this.width - 1) {
          const transfer = Math.floor((cur.level - rightLiq.level) / 2);
          if (transfer > 0) {
            this.setLiquid(layer, tx, ty, cur.type, cur.level - transfer);
            this.setLiquid(layer, tx + 1, ty, cur.type, rightLiq.level + transfer);
            budget--;
          }
        }
      }
    }
  }

  /**
   * Advance day-night cycle
   */
  public updateTime(dt: number): void {
    this.time = (this.time + dt * this.timeSpeed) % 86400;
  }

  public isDay(): boolean {
    return this.time >= 21600 && this.time < 64800; // 06:00 to 18:00
  }

  public getTimeString(): string {
    const totalMinutes = Math.floor(this.time / 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}

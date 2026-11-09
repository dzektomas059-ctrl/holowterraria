/**
 * Hollowfall - Dual-Layer Procedural World Generator
 * Процедурная генерация Светлого и Теневого слоёв с биомами, пещерами, рудами и сундуками
 */

import { PerlinNoise, PRNG } from './noise.ts';
import { InventorySlot, LayerType, LiquidType, TileType, WallType } from './types.ts';
import { World } from './world.ts';

export interface WorldGenConfig {
  seed: number;
  width: number;
  height: number;
  onProgress?: (stage: string, percent: number) => void;
}

export async function generateWorld(config: WorldGenConfig): Promise<{ world: World; spawnX: number; spawnY: number }> {
  const { seed, width, height, onProgress } = config;
  const world = new World(width, height);
  const rng = new PRNG(seed);
  const perlinTerrain = new PerlinNoise(seed);
  const perlinCaves = new PerlinNoise(seed + 101);
  const perlinOres = new PerlinNoise(seed + 202);
  const perlinShadow = new PerlinNoise(seed + 303);

  const report = (stage: string, pct: number) => {
    if (onProgress) onProgress(stage, pct);
  };

  const surfaceY: number[] = new Array(width);
  const surfaceBase = Math.floor(height * 0.35);

  // 1. Calculate surface heightmap
  report('Формирование рельефа...', 10);
  for (let x = 0; x < width; x++) {
    const n = perlinTerrain.octaveNoise2D(x * 0.005, 0, 4, 0.5);
    const detail = perlinTerrain.noise2D(x * 0.03, 10) * 0.2;
    surfaceY[x] = Math.floor(surfaceBase + (n + detail - 0.5) * 60);
  }

  // 2. Fill Light Layer terrain
  report('Заполнение Светлого мира: почва и пещеры...', 25);
  for (let x = 0; x < width; x++) {
    const sY = surfaceY[x];
    const biome = getBiomeAt(x, width);

    for (let y = 0; y < height; y++) {
      if (y < sY) {
        // Sky
        world.setTile(LayerType.LIGHT, x, y, TileType.AIR);
        world.setWall(LayerType.LIGHT, x, y, WallType.NONE);
      } else if (y === sY) {
        // Surface grass
        if (biome === 'snow') {
          world.setTile(LayerType.LIGHT, x, y, TileType.SNOW);
        } else if (biome === 'desert') {
          world.setTile(LayerType.LIGHT, x, y, TileType.SAND);
        } else {
          world.setTile(LayerType.LIGHT, x, y, TileType.GRASS);
        }
        world.setWall(LayerType.LIGHT, x, y, WallType.NONE);
      } else if (y < sY + 6) {
        // Dirt / Sand sub-surface
        if (biome === 'desert') {
          world.setTile(LayerType.LIGHT, x, y, TileType.SAND);
        } else if (biome === 'snow') {
          world.setTile(LayerType.LIGHT, x, y, TileType.SNOW);
        } else {
          world.setTile(LayerType.LIGHT, x, y, TileType.DIRT);
          world.setWall(LayerType.LIGHT, x, y, WallType.DIRT_WALL);
        }
      } else {
        // Underground Stone & Caves
        const caveNoise = perlinCaves.octaveNoise2D(x * 0.035, y * 0.035, 3, 0.5);
        const caveNoise2 = perlinCaves.octaveNoise2D((x + 50) * 0.03, (y + 50) * 0.03, 3, 0.5);
        const isCave = (caveNoise > 0.62 && caveNoise < 0.78) || (caveNoise2 > 0.64 && caveNoise2 < 0.76);

        if (isCave) {
          world.setTile(LayerType.LIGHT, x, y, TileType.AIR);
          world.setWall(LayerType.LIGHT, x, y, WallType.STONE_WALL);
        } else {
          if (y > height - 60) {
            // Magma rock near the core
            world.setTile(LayerType.LIGHT, x, y, TileType.MAGMA_ROCK);
          } else if (biome === 'snow' && y < sY + 40 && rng.next() < 0.4) {
            world.setTile(LayerType.LIGHT, x, y, TileType.ICE);
          } else {
            world.setTile(LayerType.LIGHT, x, y, TileType.STONE);
          }
          world.setWall(LayerType.LIGHT, x, y, WallType.STONE_WALL);
        }
      }
    }
  }

  // 3. Generate Ores & Crystals in Light Layer
  report('Генерация ценных жил и руд...', 40);
  for (let x = 1; x < width - 1; x++) {
    const sY = surfaceY[x];
    for (let y = sY + 6; y < height - 10; y++) {
      if (world.getTile(LayerType.LIGHT, x, y) === TileType.STONE) {
        const oreNoise = perlinOres.noise2D(x * 0.1, y * 0.1);
        const depth = (y - sY) / (height - sY);

        if (oreNoise > 0.82) {
          if (depth > 0.7) {
            world.setTile(LayerType.LIGHT, x, y, TileType.GOLD_ORE);
          } else if (depth > 0.45) {
            world.setTile(LayerType.LIGHT, x, y, TileType.SILVER_ORE);
          } else if (depth > 0.2) {
            world.setTile(LayerType.LIGHT, x, y, TileType.IRON_ORE);
          } else {
            world.setTile(LayerType.LIGHT, x, y, TileType.COPPER_ORE);
          }
        } else if (depth > 0.6 && oreNoise > 0.77 && rng.next() < 0.2) {
          world.setTile(LayerType.LIGHT, x, y, TileType.PRISMATIC_CRYSTAL);
        }
      }
    }
  }

  // 4. Fill Shadow Layer
  report('Искажение реальности: сотворение Теневого слоя...', 55);
  for (let x = 0; x < width; x++) {
    const sY = surfaceY[x];
    for (let y = 0; y < height; y++) {
      if (y < sY - 2) {
        world.setTile(LayerType.SHADOW, x, y, TileType.AIR);
        world.setWall(LayerType.SHADOW, x, y, WallType.NONE);
      } else {
        // Shadow realm has inverted rift holes and unique shadow stone
        const shadowNoise = perlinShadow.octaveNoise2D(x * 0.04, y * 0.04, 3, 0.5);
        const isShadowRift = shadowNoise > 0.58 && shadowNoise < 0.75;

        // Special feature: where light layer is solid wall, shadow layer may have a passage!
        const lightTile = world.getTile(LayerType.LIGHT, x, y);
        const lightIsSolid = World.isTileSolid(lightTile);

        if (isShadowRift) {
          // Open rift corridor in Shadow realm
          world.setTile(LayerType.SHADOW, x, y, TileType.AIR);
          world.setWall(LayerType.SHADOW, x, y, WallType.SHADOW_WALL);
        } else if (!lightIsSolid && y > sY + 10 && rng.next() < 0.15) {
          // Where Light layer has empty air / chasm, Shadow layer provides an ethereal Crystal Bridge!
          world.setTile(LayerType.SHADOW, x, y, TileType.CRYSTAL_BRIDGE);
          world.setWall(LayerType.SHADOW, x, y, WallType.SHADOW_WALL);
        } else {
          // Solid Shadow Stone
          world.setTile(LayerType.SHADOW, x, y, TileType.SHADOW_STONE);
          world.setWall(LayerType.SHADOW, x, y, WallType.SHADOW_WALL);

          // Shadow Exclusive Ores: Echo Shards, Obsidianite, Void Crystals
          const sOre = perlinOres.noise2D((x + 200) * 0.08, (y + 200) * 0.08);
          if (sOre > 0.81) {
            world.setTile(LayerType.SHADOW, x, y, TileType.ECHO_SHARD_ORE);
          } else if (sOre > 0.75 && y > sY + 60) {
            world.setTile(LayerType.SHADOW, x, y, TileType.OBSIDIANITE_ORE);
          } else if (sOre > 0.72 && y > height - 70) {
            world.setTile(LayerType.SHADOW, x, y, TileType.VOID_CRYSTAL);
          }
        }
      }
    }
  }

  // 5. Water, Lava & Shadow Plasma Pools
  report('Заполнение озер, магмы и теневой плазмы...', 70);
  for (let x = 10; x < width - 10; x += 4) {
    const sY = surfaceY[x];
    for (let y = sY + 20; y < height - 10; y += 4) {
      if (world.getTile(LayerType.LIGHT, x, y) === TileType.AIR && world.isSolid(LayerType.LIGHT, x, y + 1)) {
        if (y > height - 40) {
          // Deep lava lakes
          fillLiquidPocket(world, LayerType.LIGHT, x, y, LiquidType.LAVA, 20);
        } else if (rng.next() < 0.08) {
          // Underground water cavern
          fillLiquidPocket(world, LayerType.LIGHT, x, y, LiquidType.WATER, 24);
        }
      }
      // Shadow plasma
      if (world.getTile(LayerType.SHADOW, x, y) === TileType.AIR && world.isSolid(LayerType.SHADOW, x, y + 1)) {
        if (rng.next() < 0.05) {
          fillLiquidPocket(world, LayerType.SHADOW, x, y, LiquidType.SHADOW_PLASMA, 18);
        }
      }
    }
  }

  // 6. Trees, Foliage & Surface Plants
  report('Выращивание деревьев и растительности...', 82);
  for (let x = 5; x < width - 5; x += rng.rangeInt(3, 7)) {
    const sY = surfaceY[x];
    const surfaceTile = world.getTile(LayerType.LIGHT, x, sY);

    if (surfaceTile === TileType.GRASS) {
      growTree(world, LayerType.LIGHT, x, sY - 1, rng.rangeInt(5, 9));
    }
  }

  // 7. Underground Cabins & Treasure Chests
  report('Строительство древних руин и размещение сундуков...', 92);
  const chestSpots: [number, number][] = [];
  const cabinCount = Math.floor(width / 70);

  for (let c = 0; c < cabinCount; c++) {
    const cx = rng.rangeInt(30, width - 40);
    const cy = rng.rangeInt(surfaceY[cx] + 25, height - 40);
    buildUndergroundCabin(world, LayerType.LIGHT, cx, cy, rng);
    chestSpots.push([cx, cy]);
  }

  // 8. Find safe player spawn point near world center
  report('Поиск точки появления героя...', 98);
  const midX = Math.floor(width / 2);
  let spawnX = midX;
  let spawnY = surfaceY[midX] - 2;

  // Clear trees/blocks directly at spawn
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -4; dy <= 0; dy++) {
      world.setTile(LayerType.LIGHT, midX + dx, spawnY + dy, TileType.AIR);
      world.setTile(LayerType.SHADOW, midX + dx, spawnY + dy, TileType.AIR);
    }
    world.setTile(LayerType.LIGHT, midX + dx, spawnY + 1, TileType.GRASS);
    world.setTile(LayerType.SHADOW, midX + dx, spawnY + 1, TileType.SHADOW_STONE);
  }

  // Precompute initial lighting around spawn
  const spawnChunkX = Math.floor(spawnX / 32);
  const spawnChunkY = Math.floor(spawnY / 32);
  world.computeLightingRegion(LayerType.LIGHT, spawnChunkX - 2, spawnChunkY - 2, spawnChunkX + 2, spawnChunkY + 2);
  world.computeLightingRegion(LayerType.SHADOW, spawnChunkX - 2, spawnChunkY - 2, spawnChunkX + 2, spawnChunkY + 2);

  report('Мир Hollowfall готов!', 100);

  return { world, spawnX, spawnY };
}

function getBiomeAt(x: number, width: number): 'snow' | 'plains' | 'forest' | 'desert' {
  const norm = x / width;
  if (norm < 0.22) return 'snow';
  if (norm < 0.5) return 'plains';
  if (norm < 0.78) return 'forest';
  return 'desert';
}

function growTree(world: World, layer: LayerType, x: number, startY: number, treeHeight: number): void {
  for (let y = 0; y < treeHeight; y++) {
    world.setTile(layer, x, startY - y, TileType.WOOD);
  }
  // Foliage crown
  const crownY = startY - treeHeight;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 1; dy++) {
      if (Math.abs(dx) + Math.abs(dy) <= 3) {
        if (world.getTile(layer, x + dx, crownY + dy) === TileType.AIR) {
          world.setTile(layer, x + dx, crownY + dy, TileType.LEAVES);
        }
      }
    }
  }
}

function fillLiquidPocket(
  world: World,
  layer: LayerType,
  startX: number,
  startY: number,
  type: LiquidType,
  maxCells: number
): void {
  let count = 0;
  for (let dy = 0; dy < 4 && count < maxCells; dy++) {
    for (let dx = -3; dx <= 3 && count < maxCells; dx++) {
      const tx = startX + dx;
      const ty = startY + dy;
      if (world.getTile(layer, tx, ty) === TileType.AIR) {
        world.setLiquid(layer, tx, ty, type, 28);
        count++;
      }
    }
  }
}

function buildUndergroundCabin(world: World, layer: LayerType, startX: number, startY: number, rng: PRNG): void {
  const w = 10;
  const h = 6;

  // Clear & frame
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tx = startX + x;
      const ty = startY + y;
      if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
        world.setTile(layer, tx, ty, TileType.PLANKS);
      } else {
        world.setTile(layer, tx, ty, TileType.AIR);
        world.setWall(layer, tx, ty, WallType.WOOD_WALL);
      }
    }
  }

  // Add door
  world.setTile(layer, startX, startY + h - 2, TileType.DOOR_CLOSED);

  // Add torch
  world.setTile(layer, startX + 2, startY + 2, TileType.TORCH);

  // Add chest with loot
  const chestX = startX + w - 3;
  const chestY = startY + h - 2;
  world.setTile(layer, chestX, chestY, TileType.CHEST);

  const chestSlots: (InventorySlot | null)[] = new Array(30).fill(null);
  const possibleLoots: { itemId: string; min: number; max: number; chance: number }[] = [
    { itemId: 'double_jump_boots', min: 1, max: 1, chance: 0.35 },
    { itemId: 'grappling_hook', min: 1, max: 1, chance: 0.4 },
    { itemId: 'shadow_ring', min: 1, max: 1, chance: 0.25 },
    { itemId: 'healing_charm', min: 1, max: 1, chance: 0.3 },
    { itemId: 'lesser_healing_potion', min: 3, max: 8, chance: 0.9 },
    { itemId: 'gold_bar', min: 2, max: 5, chance: 0.7 },
    { itemId: 'iron_bar', min: 5, max: 12, chance: 0.85 },
    { itemId: 'torch', min: 15, max: 30, chance: 0.95 },
    { itemId: 'rope', min: 20, max: 40, chance: 0.9 },
  ];

  let slotIdx = 0;
  for (const loot of possibleLoots) {
    if (rng.next() < loot.chance && slotIdx < 30) {
      chestSlots[slotIdx++] = {
        itemId: loot.itemId,
        count: rng.rangeInt(loot.min, loot.max),
      };
    }
  }
  world.chests.set(`${layer}_${chestX}_${chestY}`, chestSlots);
}

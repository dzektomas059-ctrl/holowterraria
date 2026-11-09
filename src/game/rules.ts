/**
 * Hollowfall - Pure Game Rules & Mechanics
 * Чистые математические и логические функции для расчёта урона, инвентаря, фазового сдвига и жилья NPC
 */

import { InventorySlot, ItemCategory, TileType, WallType } from './types.ts';

export interface DamageResult {
  damage: number;
  isCrit: boolean;
  absorbed: number;
}

/**
 * Calculates net damage dealt considering defense, variance, and critical hit
 */
export function calculateDamage(
  attackDamage: number,
  targetDefense: number,
  critChance: number = 4,
  varianceMultiplier: number = 1.0, // used for deterministic tests or random in-game (0.85..1.15)
  ignoreDefensePercent: number = 0
): DamageResult {
  const effectiveDefense = Math.floor((targetDefense * (1 - ignoreDefensePercent)) * 0.5);
  const baseNet = Math.max(1, attackDamage - effectiveDefense);
  let finalDamage = Math.max(1, Math.round(baseNet * varianceMultiplier));
  const isCrit = critChance > 0 && Math.random() * 100 < critChance;
  if (isCrit) {
    finalDamage = Math.round(finalDamage * 1.5);
  }
  const absorbed = Math.max(0, attackDamage - Math.max(1, attackDamage - effectiveDefense));
  return {
    damage: finalDamage,
    isCrit,
    absorbed,
  };
}

/**
 * Deterministic damage calculation for testing
 */
export function calculateDamageDeterministic(
  attackDamage: number,
  targetDefense: number,
  isCrit: boolean = false,
  variance: number = 1.0
): number {
  const effectiveDefense = Math.floor(targetDefense * 0.5);
  const baseNet = Math.max(1, attackDamage - effectiveDefense);
  let finalDamage = Math.max(1, Math.round(baseNet * variance));
  if (isCrit) {
    finalDamage = Math.round(finalDamage * 1.5);
  }
  return finalDamage;
}

/**
 * Attempts to add items into inventory slots. Returns remaining count (0 if completely added).
 */
export function addItemToInventory(
  slots: (InventorySlot | null)[],
  itemId: string,
  count: number,
  maxStack: number = 999
): number {
  let remaining = count;

  // 1. First pass: fill existing non-full stacks
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot && slot.itemId === itemId && slot.count < maxStack) {
      const space = maxStack - slot.count;
      const toAdd = Math.min(space, remaining);
      slot.count += toAdd;
      remaining -= toAdd;
      if (remaining <= 0) return 0;
    }
  }

  // 2. Second pass: occupy empty slots
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === null) {
      const toAdd = Math.min(maxStack, remaining);
      slots[i] = { itemId, count: toAdd };
      remaining -= toAdd;
      if (remaining <= 0) return 0;
    }
  }

  return remaining;
}

/**
 * Checks if Phase Shift can be triggered
 */
export function canPhaseShift(
  currentEcho: number,
  cost: number,
  cooldownTimer: number
): { canShift: boolean; reason?: 'no_energy' | 'cooldown' } {
  if (cooldownTimer > 0) {
    return { canShift: false, reason: 'cooldown' };
  }
  if (currentEcho < cost) {
    return { canShift: false, reason: 'no_energy' };
  }
  return { canShift: true };
}

/**
 * Calculates fall damage based on tiles fallen
 */
export function calculateFallDamage(tilesFallen: number, safeTiles: number = 25): number {
  if (tilesFallen <= safeTiles) return 0;
  const excess = tilesFallen - safeTiles;
  // Terraria style: roughly 10 dmg per extra tile fallen
  return Math.round(excess * 10);
}

/**
 * Validates whether a tile can be mined by a specific tool
 */
export function isToolSuitable(
  tile: TileType,
  category: ItemCategory,
  pickPower: number = 0,
  axePower: number = 0
): { suitable: boolean; hardness: number } {
  // Tree / Wood
  if (tile === TileType.WOOD || tile === TileType.LEAVES) {
    if (category === ItemCategory.TOOL_AXE) {
      return { suitable: true, hardness: 100 / Math.max(1, axePower) };
    }
    return { suitable: false, hardness: 999 };
  }

  // Rocks and Ores require pickaxe
  if (
    tile === TileType.STONE ||
    tile === TileType.COPPER_ORE ||
    tile === TileType.TIN_ORE ||
    tile === TileType.IRON_ORE ||
    tile === TileType.SILVER_ORE ||
    tile === TileType.GOLD_ORE ||
    tile === TileType.STONE_BRICKS ||
    tile === TileType.SHADOW_STONE ||
    tile === TileType.ECHO_SHARD_ORE ||
    tile === TileType.OBSIDIANITE_ORE ||
    tile === TileType.VOID_CRYSTAL ||
    tile === TileType.PRISMATIC_CRYSTAL
  ) {
    if (category !== ItemCategory.TOOL_PICKAXE) {
      return { suitable: false, hardness: 999 };
    }
    // High tier ores require better pickaxes
    if (tile === TileType.GOLD_ORE && pickPower < 50) return { suitable: false, hardness: 999 };
    if (tile === TileType.OBSIDIANITE_ORE && pickPower < 70) return { suitable: false, hardness: 999 };
    if (tile === TileType.VOID_CRYSTAL && pickPower < 85) return { suitable: false, hardness: 999 };

    return { suitable: true, hardness: Math.max(1, 150 / Math.max(1, pickPower)) };
  }

  // Soft blocks (dirt, sand, snow, mud) can be mined by any pickaxe or bare hands
  return { suitable: true, hardness: Math.max(1, 60 / Math.max(20, pickPower)) };
}

/**
 * Checks basic house requirements for an NPC room
 */
export interface HouseValidationResult {
  valid: boolean;
  hasLight: boolean;
  hasDoor: boolean;
  hasComfort: boolean; // chair
  hasTable: boolean;   // table or workbench
  hasWalls: boolean;
  sizeOk: boolean;
}

export function validateHouseStructure(
  width: number,
  height: number,
  hasDoor: boolean,
  hasLight: boolean,
  hasChair: boolean,
  hasTableOrBench: boolean,
  wallCoveragePercent: number
): HouseValidationResult {
  const area = width * height;
  const sizeOk = area >= 30 && area <= 600 && width >= 4 && height >= 4;
  const hasWalls = wallCoveragePercent >= 0.85; // at least 85% backwalls filled

  const valid = sizeOk && hasDoor && hasLight && hasChair && hasTableOrBench && hasWalls;
  return {
    valid,
    hasLight,
    hasDoor,
    hasComfort: hasChair,
    hasTable: hasTableOrBench,
    hasWalls,
    sizeOk,
  };
}

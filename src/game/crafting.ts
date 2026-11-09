/**
 * Hollowfall - Crafting System & Recipes
 * Рецепты крафта по станциям (ручной, верстак, печь, наковальня, фазовый алтарь)
 */

import { CraftingRecipe, InventorySlot, TileType } from './types.ts';

export const RECIPES: CraftingRecipe[] = [
  // --- Hand Crafting (Ручной крафт) ---
  {
    id: 'craft_planks',
    station: 'hand',
    ingredients: [{ itemId: 'wood', count: 1 }],
    result: { itemId: 'planks', count: 4 },
  },
  {
    id: 'craft_workbench',
    station: 'hand',
    ingredients: [{ itemId: 'wood', count: 10 }],
    result: { itemId: 'workbench', count: 1 },
  },
  {
    id: 'craft_torch',
    station: 'hand',
    ingredients: [
      { itemId: 'gel', count: 1 },
      { itemId: 'wood', count: 1 },
    ],
    result: { itemId: 'torch', count: 3 },
  },
  {
    id: 'craft_platform',
    station: 'hand',
    ingredients: [{ itemId: 'wood', count: 1 }],
    result: { itemId: 'platform', count: 2 },
  },
  {
    id: 'craft_rope',
    station: 'hand',
    ingredients: [{ itemId: 'silk', count: 1 }],
    result: { itemId: 'rope', count: 5 },
  },
  {
    id: 'craft_wooden_sword',
    station: 'hand',
    ingredients: [{ itemId: 'wood', count: 7 }],
    result: { itemId: 'wooden_sword', count: 1 },
  },

  // --- Workbench Recipes (Верстак) ---
  {
    id: 'craft_door',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 6 }],
    result: { itemId: 'door', count: 1 },
  },
  {
    id: 'craft_chair',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 4 }],
    result: { itemId: 'chair', count: 1 },
  },
  {
    id: 'craft_table',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 8 }],
    result: { itemId: 'table', count: 1 },
  },
  {
    id: 'craft_chest',
    station: TileType.WORKBENCH,
    ingredients: [
      { itemId: 'wood', count: 8 },
      { itemId: 'iron_bar', count: 2 },
    ],
    result: { itemId: 'chest', count: 1 },
  },
  {
    id: 'craft_wooden_bow',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 10 }],
    result: { itemId: 'wooden_bow', count: 1 },
  },
  {
    id: 'craft_wooden_arrow',
    station: TileType.WORKBENCH,
    ingredients: [
      { itemId: 'wood', count: 1 },
      { itemId: 'stone', count: 1 },
    ],
    result: { itemId: 'wooden_arrow', count: 10 },
  },
  {
    id: 'craft_wooden_hammer',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 8 }],
    result: { itemId: 'wooden_hammer', count: 1 },
  },
  {
    id: 'craft_furnace',
    station: TileType.WORKBENCH,
    ingredients: [
      { itemId: 'stone', count: 20 },
      { itemId: 'wood', count: 4 },
      { itemId: 'torch', count: 3 },
    ],
    result: { itemId: 'furnace', count: 1 },
  },
  {
    id: 'craft_wood_wall',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 1 }],
    result: { itemId: 'wood_wall', count: 4 },
  },
  {
    id: 'craft_stone_wall',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'stone', count: 1 }],
    result: { itemId: 'stone_wall', count: 4 },
  },
  {
    id: 'craft_wood_helmet',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 12 }],
    result: { itemId: 'wood_helmet', count: 1 },
  },
  {
    id: 'craft_wood_chest',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 20 }],
    result: { itemId: 'wood_chest', count: 1 },
  },
  {
    id: 'craft_wood_legs',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'wood', count: 15 }],
    result: { itemId: 'wood_legs', count: 1 },
  },

  // --- Furnace Recipes (Печь) ---
  {
    id: 'smelt_copper',
    station: TileType.FURNACE,
    ingredients: [{ itemId: 'copper_ore', count: 3 }],
    result: { itemId: 'copper_bar', count: 1 },
  },
  {
    id: 'smelt_iron',
    station: TileType.FURNACE,
    ingredients: [{ itemId: 'iron_ore', count: 3 }],
    result: { itemId: 'iron_bar', count: 1 },
  },
  {
    id: 'smelt_gold',
    station: TileType.FURNACE,
    ingredients: [{ itemId: 'gold_ore', count: 4 }],
    result: { itemId: 'gold_bar', count: 1 },
  },
  {
    id: 'smelt_glass',
    station: TileType.FURNACE,
    ingredients: [{ itemId: 'sand', count: 2 }],
    result: { itemId: 'glass', count: 1 },
  },
  {
    id: 'craft_stone_bricks',
    station: TileType.FURNACE,
    ingredients: [{ itemId: 'stone', count: 2 }],
    result: { itemId: 'stone_bricks', count: 1 },
  },
  {
    id: 'craft_lesser_healing',
    station: TileType.FURNACE,
    ingredients: [
      { itemId: 'luminescent_mushroom', count: 2 },
      { itemId: 'gel', count: 2 },
    ],
    result: { itemId: 'lesser_healing_potion', count: 1 },
  },

  // --- Anvil Recipes (Наковальня) ---
  {
    id: 'craft_anvil',
    station: TileType.WORKBENCH,
    ingredients: [{ itemId: 'iron_bar', count: 5 }],
    result: { itemId: 'anvil', count: 1 },
  },
  {
    id: 'craft_copper_pickaxe',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'copper_bar', count: 8 },
      { itemId: 'wood', count: 4 },
    ],
    result: { itemId: 'copper_pickaxe', count: 1 },
  },
  {
    id: 'craft_copper_axe',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'copper_bar', count: 6 },
      { itemId: 'wood', count: 3 },
    ],
    result: { itemId: 'copper_axe', count: 1 },
  },
  {
    id: 'craft_copper_broadsword',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'copper_bar', count: 8 }],
    result: { itemId: 'copper_broadsword', count: 1 },
  },
  {
    id: 'craft_copper_helmet',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'copper_bar', count: 10 }],
    result: { itemId: 'copper_helmet', count: 1 },
  },
  {
    id: 'craft_copper_chest',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'copper_bar', count: 15 }],
    result: { itemId: 'copper_chest', count: 1 },
  },
  {
    id: 'craft_copper_legs',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'copper_bar', count: 12 }],
    result: { itemId: 'copper_legs', count: 1 },
  },
  {
    id: 'craft_iron_pickaxe',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'iron_bar', count: 10 },
      { itemId: 'wood', count: 4 },
    ],
    result: { itemId: 'iron_pickaxe', count: 1 },
  },
  {
    id: 'craft_iron_axe',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'iron_bar', count: 8 },
      { itemId: 'wood', count: 3 },
    ],
    result: { itemId: 'iron_axe', count: 1 },
  },
  {
    id: 'craft_iron_broadsword',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'iron_bar', count: 8 }],
    result: { itemId: 'iron_broadsword', count: 1 },
  },
  {
    id: 'craft_iron_bow',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'iron_bar', count: 7 },
      { itemId: 'silk', count: 2 },
    ],
    result: { itemId: 'iron_bow', count: 1 },
  },
  {
    id: 'craft_grappling_hook',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'iron_bar', count: 6 },
      { itemId: 'rope', count: 15 },
    ],
    result: { itemId: 'grappling_hook', count: 1 },
  },
  {
    id: 'craft_iron_helmet',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'iron_bar', count: 12 }],
    result: { itemId: 'iron_helmet', count: 1 },
  },
  {
    id: 'craft_iron_chest',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'iron_bar', count: 20 }],
    result: { itemId: 'iron_chest', count: 1 },
  },
  {
    id: 'craft_iron_legs',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'iron_bar', count: 15 }],
    result: { itemId: 'iron_legs', count: 1 },
  },
  {
    id: 'craft_gold_pickaxe',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'gold_bar', count: 12 },
      { itemId: 'wood', count: 4 },
    ],
    result: { itemId: 'gold_pickaxe', count: 1 },
  },
  {
    id: 'craft_gold_broadsword',
    station: TileType.ANVIL,
    ingredients: [{ itemId: 'gold_bar', count: 10 }],
    result: { itemId: 'gold_broadsword', count: 1 },
  },
  {
    id: 'craft_amethyst_staff',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'prismatic_crystal', count: 8 },
      { itemId: 'iron_bar', count: 6 },
    ],
    result: { itemId: 'amethyst_staff', count: 1 },
  },
  {
    id: 'craft_phase_altar',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'stone_bricks', count: 20 },
      { itemId: 'iron_bar', count: 8 },
      { itemId: 'prismatic_crystal', count: 5 },
    ],
    result: { itemId: 'phase_altar', count: 1 },
  },
  {
    id: 'craft_lithovore_core',
    station: TileType.ANVIL,
    ingredients: [
      { itemId: 'stone', count: 30 },
      { itemId: 'iron_bar', count: 5 },
      { itemId: 'prismatic_crystal', count: 3 },
    ],
    result: { itemId: 'lithovore_core', count: 1 },
  },

  // --- Phase Altar Recipes (Фазовый алтарь - слияние Света и Тени) ---
  {
    id: 'craft_shadow_steel',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'iron_bar', count: 1 },
      { itemId: 'echo_shard', count: 2 },
    ],
    result: { itemId: 'shadow_steel', count: 1 },
  },
  {
    id: 'craft_shadow_pickaxe',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'shadow_steel', count: 12 },
      { itemId: 'obsidianite', count: 6 },
    ],
    result: { itemId: 'shadow_pickaxe', count: 1 },
  },
  {
    id: 'craft_phase_blade',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'shadow_steel', count: 10 },
      { itemId: 'echo_shard', count: 8 },
      { itemId: 'gold_bar', count: 4 },
    ],
    result: { itemId: 'phase_blade', count: 1 },
  },
  {
    id: 'craft_shadow_bow',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'shadow_steel', count: 8 },
      { itemId: 'obsidianite', count: 5 },
      { itemId: 'silk', count: 5 },
    ],
    result: { itemId: 'shadow_bow', count: 1 },
  },
  {
    id: 'craft_phase_arrow',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'wooden_arrow', count: 25 },
      { itemId: 'echo_shard', count: 1 },
    ],
    result: { itemId: 'phase_arrow', count: 25 },
  },
  {
    id: 'craft_rift_wand',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'void_crystal', count: 5 },
      { itemId: 'shadow_steel', count: 6 },
    ],
    result: { itemId: 'rift_wand', count: 1 },
  },
  {
    id: 'craft_double_jump_boots',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'echo_shard', count: 10 },
      { itemId: 'silk', count: 10 },
      { itemId: 'iron_bar', count: 5 },
    ],
    result: { itemId: 'double_jump_boots', count: 1 },
  },
  {
    id: 'craft_shadow_ring',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'gold_bar', count: 5 },
      { itemId: 'echo_shard', count: 8 },
    ],
    result: { itemId: 'shadow_ring', count: 1 },
  },
  {
    id: 'craft_phase_capacitor',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'shadow_steel', count: 8 },
      { itemId: 'prismatic_crystal', count: 8 },
      { itemId: 'void_crystal', count: 4 },
    ],
    result: { itemId: 'phase_capacitor', count: 1 },
  },
  {
    id: 'craft_shadow_helmet',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'shadow_steel', count: 14 },
      { itemId: 'obsidianite', count: 4 },
    ],
    result: { itemId: 'shadow_helmet', count: 1 },
  },
  {
    id: 'craft_shadow_chest',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'shadow_steel', count: 22 },
      { itemId: 'obsidianite', count: 8 },
    ],
    result: { itemId: 'shadow_chest', count: 1 },
  },
  {
    id: 'craft_shadow_legs',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'shadow_steel', count: 16 },
      { itemId: 'obsidianite', count: 6 },
    ],
    result: { itemId: 'shadow_legs', count: 1 },
  },
  {
    id: 'craft_void_eye_totem',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'obsidianite', count: 10 },
      { itemId: 'bone', count: 15 },
      { itemId: 'echo_shard', count: 5 },
    ],
    result: { itemId: 'void_eye_totem', count: 1 },
  },
  {
    id: 'craft_rift_bell',
    station: TileType.PHASE_ALTAR,
    ingredients: [
      { itemId: 'shadow_steel', count: 15 },
      { itemId: 'void_crystal', count: 8 },
      { itemId: 'gold_bar', count: 10 },
    ],
    result: { itemId: 'rift_bell', count: 1 },
  },
];

/**
 * Checks if player inventory has sufficient materials for a recipe
 */
export function canCraft(recipe: CraftingRecipe, inventory: (InventorySlot | null)[]): boolean {
  for (const req of recipe.ingredients) {
    let available = 0;
    for (const slot of inventory) {
      if (slot && slot.itemId === req.itemId) {
        available += slot.count;
      }
    }
    if (available < req.count) return false;
  }
  return true;
}

/**
 * Deducts recipe materials from inventory
 */
export function consumeMaterials(recipe: CraftingRecipe, inventory: (InventorySlot | null)[]): void {
  for (const req of recipe.ingredients) {
    let needed = req.count;
    for (let i = 0; i < inventory.length && needed > 0; i++) {
      const slot = inventory[i];
      if (slot && slot.itemId === req.itemId) {
        if (slot.count <= needed) {
          needed -= slot.count;
          inventory[i] = null;
        } else {
          slot.count -= needed;
          needed = 0;
        }
      }
    }
  }
}

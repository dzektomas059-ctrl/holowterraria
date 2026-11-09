/**
 * Hollowfall - Core Types & Definitions
 * Типы данных, энумы и структуры для 2D-песочницы
 */

export enum LayerType {
  LIGHT = 0,
  SHADOW = 1,
}

export enum TileType {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  PLANKS = 6,
  COPPER_ORE = 7,
  TIN_ORE = 8,
  IRON_ORE = 9,
  SILVER_ORE = 10,
  GOLD_ORE = 11,
  SAND = 12,
  SNOW = 13,
  ICE = 14,
  MUD = 15,
  LUMINESCENT_MUSHROOM = 16,
  PRISMATIC_CRYSTAL = 17,
  MAGMA_ROCK = 18,
  
  // Shadow Layer Exclusive & Transformed Blocks
  SHADOW_STONE = 19,
  WARPED_MUD = 20,
  ECHO_SHARD_ORE = 21,
  OBSIDIANITE_ORE = 22,
  VOID_CRYSTAL = 23,
  SHADOW_ROOT = 24,

  // Furniture & Functional Blocks
  PLATFORM = 25,
  DOOR_CLOSED = 26,
  DOOR_OPEN = 27,
  TORCH = 28,
  SHADOW_TORCH = 29,
  WORKBENCH = 30,
  FURNACE = 31,
  ANVIL = 32,
  PHASE_ALTAR = 33,
  CHEST = 34,
  CHAIR = 35,
  TABLE = 36,
  POT = 37,
  ROPE = 38,
  GLASS = 39,
  STONE_BRICKS = 40,
  SHADOW_BRICKS = 41,
  CRYSTAL_BRIDGE = 42, // Special bridge appearing in Shadow realm
}

export enum WallType {
  NONE = 0,
  DIRT_WALL = 1,
  STONE_WALL = 2,
  WOOD_WALL = 3,
  STONE_BRICK_WALL = 4,
  SHADOW_WALL = 5,
  GLASS_WALL = 6,
}

export enum LiquidType {
  NONE = 0,
  WATER = 1,
  LAVA = 2,
  SHADOW_PLASMA = 3,
}

export enum BiomeType {
  // Light layer biomes
  PLAINS = 'plains',
  FOREST = 'forest',
  DESERT = 'desert',
  SNOW = 'snow',
  MUSHROOM = 'mushroom',
  DEEP_CAVERNS = 'deep_caverns',
  MAGMA_CORE = 'magma_core',

  // Shadow layer biomes
  WARPED_MARSH = 'warped_marsh',
  PHANTOM_WASTE = 'phantom_waste',
  VOID_RIFTS = 'void_rifts',
  OBSIDIAN_DEPTHS = 'obsidian_depths',
  NULL_CORE = 'null_core',
}

export enum ItemRarity {
  COMMON = 0,     // White
  UNCOMMON = 1,   // Green
  RARE = 2,       // Blue
  EPIC = 3,       // Purple
  LEGENDARY = 4,  // Amber/Gold
  PHASE = 5,      // Vibrant Magenta/Cyan
}

export enum ItemCategory {
  WEAPON_MELEE = 'weapon_melee',
  WEAPON_RANGED = 'weapon_ranged',
  WEAPON_MAGIC = 'weapon_magic',
  TOOL_PICKAXE = 'tool_pickaxe',
  TOOL_AXE = 'tool_axe',
  TOOL_HAMMER = 'tool_hammer',
  ARMOR_HEAD = 'armor_head',
  ARMOR_CHEST = 'armor_chest',
  ARMOR_LEGS = 'armor_legs',
  ACCESSORY = 'accessory',
  BLOCK = 'block',
  WALL = 'wall',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
  SPECIAL = 'special',
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  category: ItemCategory;
  maxStack: number;
  tileType?: TileType;
  wallType?: WallType;
  damage?: number;
  knockback?: number;
  critChance?: number; // 0..100
  defense?: number;
  pickPower?: number; // % mining power
  axePower?: number;
  hammerPower?: number;
  useTime?: number; // Frames/ticks cooldown
  manaCost?: number;
  healAmount?: number;
  manaHeal?: number;
  speed?: number; // Projectile speed
  projectileType?: string;
  color?: string; // UI sprite primary color
  secondaryColor?: string;
  iconType?: string; // Identifier for procedural icon rendering
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  station: TileType | 'hand'; // 'hand' or WORKBENCH, FURNACE, ANVIL, PHASE_ALTAR
  ingredients: { itemId: string; count: number }[];
  result: { itemId: string; count: number };
}

// Character Customization
export type Gender = 'male' | 'female';
export type Difficulty = 'softcore' | 'classic' | 'hardcore';

export interface CharacterAppearance {
  gender: Gender;
  hairStyle: number; // 0..7
  hairColor: string;
  skinColor: string;
  eyeColor: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
}

export interface CharacterData {
  id: string;
  name: string;
  difficulty: Difficulty;
  appearance: CharacterAppearance;
  createdAt: number;
  playTime: number; // in seconds
  hp: number;
  maxHp: number;
  echoEnergy: number;
  maxEchoEnergy: number;
  inventory: (InventorySlot | null)[]; // 50 slots (10 hotbar + 40 main)
  equipment: {
    helmet: InventorySlot | null;
    chest: InventorySlot | null;
    legs: InventorySlot | null;
    accessory1: InventorySlot | null;
    accessory2: InventorySlot | null;
    accessory3: InventorySlot | null;
  };
}

export interface WorldMeta {
  id: string;
  name: string;
  seed: number;
  width: number; // Tiles
  height: number; // Tiles
  createdAt: number;
  lastPlayed: number;
  defeatedBosses: string[];
}

export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

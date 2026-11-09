/**
 * Hollowfall - Central Pixel-Art Texture & Sprite Engine
 * Генерирует и кэширует аутентичные 16x16 / 32x32 pixel-art спрайты в стиле Terraria
 * без внешних тяжелых ассетов, с поддержкой nearest-neighbor масштабирования
 */

import { ItemCategory, ItemRarity, TileType, WallType } from './types.ts';

// Offscreen canvas cache for fast blitting
const textureCache: Map<string, HTMLCanvasElement> = new Map();
const dataUrlCache: Map<string, string> = new Map();

/**
 * Creates an offscreen canvas of specified size with nearest-neighbor rendering
 */
function createPixelCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

// ==========================================
// 1. TILE TEXTURES (16x16 pixel-art)
// ==========================================

export function getTileTexture(tile: TileType, variant: number = 0): HTMLCanvasElement {
  const key = `tile_${tile}_${variant % 4}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const { canvas, ctx } = createPixelCanvas(16, 16);

  switch (tile) {
    case TileType.DIRT:
      drawDirtTexture(ctx, variant);
      break;

    case TileType.GRASS:
      drawGrassTexture(ctx, variant);
      break;

    case TileType.STONE:
      drawStoneTexture(ctx, variant);
      break;

    case TileType.COPPER_ORE:
      drawOreTexture(ctx, variant, '#b45309', '#d97706', '#f59e0b');
      break;

    case TileType.TIN_ORE:
      drawOreTexture(ctx, variant, '#78716c', '#a8a29e', '#e7e5e4');
      break;

    case TileType.IRON_ORE:
      drawOreTexture(ctx, variant, '#94a3b8', '#cbd5e1', '#f1f5f9');
      break;

    case TileType.SILVER_ORE:
      drawOreTexture(ctx, variant, '#93c5fd', '#bfdbfe', '#ffffff');
      break;

    case TileType.GOLD_ORE:
      drawOreTexture(ctx, variant, '#ca8a04', '#eab308', '#fef08a');
      break;

    case TileType.ECHO_SHARD_ORE:
      drawOreTexture(ctx, variant, '#0891b2', '#06b6d4', '#67e8f9', true);
      break;

    case TileType.OBSIDIANITE_ORE:
      drawOreTexture(ctx, variant, '#312e81', '#4338ca', '#818cf8');
      break;

    case TileType.VOID_CRYSTAL:
      drawOreTexture(ctx, variant, '#701a75', '#a21caf', '#f0abfc', true);
      break;

    case TileType.WOOD:
      drawWoodBarkTexture(ctx, variant);
      break;

    case TileType.LEAVES:
      drawFoliageTexture(ctx, variant);
      break;

    case TileType.PLANKS:
      drawPlanksTexture(ctx);
      break;

    case TileType.STONE_BRICKS:
      drawStoneBricksTexture(ctx);
      break;

    case TileType.SAND:
      drawSandTexture(ctx, variant);
      break;

    case TileType.SNOW:
      drawSnowTexture(ctx, variant);
      break;

    case TileType.ICE:
      drawIceTexture(ctx, variant);
      break;

    case TileType.SHADOW_STONE:
      drawShadowStoneTexture(ctx, variant);
      break;

    case TileType.PLATFORM:
      drawPlatformTexture(ctx);
      break;

    case TileType.TORCH:
      drawTorchTexture(ctx, false);
      break;

    case TileType.SHADOW_TORCH:
      drawTorchTexture(ctx, true);
      break;

    case TileType.WORKBENCH:
      drawWorkbenchTexture(ctx);
      break;

    case TileType.FURNACE:
      drawFurnaceTexture(ctx);
      break;

    case TileType.ANVIL:
      drawAnvilTexture(ctx);
      break;

    case TileType.CHEST:
      drawChestTexture(ctx);
      break;

    case TileType.PHASE_ALTAR:
      drawPhaseAltarTexture(ctx);
      break;

    case TileType.DOOR_CLOSED:
      drawDoorTexture(ctx, true);
      break;

    case TileType.DOOR_OPEN:
      drawDoorTexture(ctx, false);
      break;

    default:
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 16, 16);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(0.5, 0.5, 15, 15);
      break;
  }

  textureCache.set(key, canvas);
  return canvas;
}

// ------------------------------------------
// Detailed procedural block drawer functions
// ------------------------------------------

function drawDirtTexture(ctx: CanvasRenderingContext2D, variant: number) {
  // Base rich earth tones
  ctx.fillStyle = '#783e16';
  ctx.fillRect(0, 0, 16, 16);

  // Mottled organic dirt specks
  const specks = [
    [2, 3, '#5c2e0b'], [8, 2, '#8d4b1c'], [13, 4, '#5c2e0b'],
    [5, 7, '#8d4b1c'], [10, 8, '#5c2e0b'], [3, 11, '#8d4b1c'],
    [12, 12, '#5c2e0b'], [7, 13, '#431f06'], [14, 9, '#8d4b1c'],
    [1, 8, '#5c2e0b'], [9, 14, '#8d4b1c'], [6, 4, '#431f06'],
  ];

  for (const [x, y, color] of specks) {
    const rx = ((x as number) + variant * 3) % 15;
    const ry = ((y as number) + variant * 2) % 15;
    ctx.fillStyle = color as string;
    ctx.fillRect(rx, ry, 2, 2);
  }

  // Small embedded stone pebble
  ctx.fillStyle = '#78716c';
  ctx.fillRect(4 + (variant % 3) * 3, 5 + (variant % 2) * 4, 3, 2);
  ctx.fillStyle = '#a8a29e';
  ctx.fillRect(4 + (variant % 3) * 3, 5 + (variant % 2) * 4, 2, 1);
}

function drawGrassTexture(ctx: CanvasRenderingContext2D, variant: number) {
  // Underlying dirt
  drawDirtTexture(ctx, variant);

  // Terraria vibrant grass top cap (4-6 pixels with hanging roots/blades)
  ctx.fillStyle = '#15803d'; // Dark outline/shadow under grass
  ctx.fillRect(0, 0, 16, 5);

  ctx.fillStyle = '#16a34a'; // Mid grass
  ctx.fillRect(0, 0, 16, 4);

  ctx.fillStyle = '#22c55e'; // Bright highlight top blade edge
  ctx.fillRect(0, 0, 16, 2);

  // Hanging overhanging grass fringe spikes (organic look)
  const fringeX = [1, 4, 7, 10, 13, 15];
  for (const fx of fringeX) {
    const len = ((fx + variant) % 3) + 3;
    ctx.fillStyle = '#15803d';
    ctx.fillRect(fx, 4, 2, len);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(fx, 4, 1, Math.max(1, len - 1));
  }
}

function drawStoneTexture(ctx: CanvasRenderingContext2D, variant: number) {
  // Natural stone with fracture lines & shading
  ctx.fillStyle = '#64748b'; // Slate midtone
  ctx.fillRect(0, 0, 16, 16);

  // Dark stone cracks & shadows
  ctx.fillStyle = '#334155';
  ctx.fillRect(2, 4, 5, 1);
  ctx.fillRect(6, 5, 4, 1);
  ctx.fillRect(9, 6, 5, 1);
  ctx.fillRect(4, 11, 8, 1);
  ctx.fillRect(11, 12, 3, 1);

  // Highlights on upper facets
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(2, 3, 4, 1);
  ctx.fillRect(7, 4, 3, 1);
  ctx.fillRect(4, 10, 7, 1);
  ctx.fillRect(1, 1, 3, 2);
  ctx.fillRect(12, 2, 3, 2);

  // Ambient grit
  ctx.fillStyle = '#475569';
  ctx.fillRect(1, 8, 3, 3);
  ctx.fillRect(10, 8, 4, 3);
}

function drawOreTexture(
  ctx: CanvasRenderingContext2D,
  variant: number,
  cDark: string,
  cMid: string,
  cLight: string,
  glow: boolean = false
) {
  // Base stone background
  drawStoneTexture(ctx, variant);

  // Ore clusters (chunky natural crystals embedded in rock)
  const clusterPos = [
    [3, 4, 5, 4],
    [9, 8, 5, 5],
    [4, 11, 4, 3],
  ];

  for (const [cx, cy, cw, ch] of clusterPos) {
    // Ore dark outline
    ctx.fillStyle = cDark;
    ctx.fillRect(cx, cy, cw, ch);

    // Ore mid facet
    ctx.fillStyle = cMid;
    ctx.fillRect(cx + 1, cy + 1, cw - 2, ch - 2);

    // Ore specular sparkle/glint
    ctx.fillStyle = cLight;
    ctx.fillRect(cx + 1, cy + 1, 2, 1);
    ctx.fillRect(cx + cw - 2, cy + ch - 2, 1, 1);
  }

  if (glow) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(4, 5, 1, 1);
    ctx.fillRect(10, 9, 1, 1);
  }
}

function drawWoodBarkTexture(ctx: CanvasRenderingContext2D, variant: number) {
  // Rich tree bark with vertical grain lines
  ctx.fillStyle = '#5c2c06'; // Deep bark base
  ctx.fillRect(0, 0, 16, 16);

  // Vertical wood ridges
  ctx.fillStyle = '#78350f';
  ctx.fillRect(2, 0, 3, 16);
  ctx.fillRect(8, 0, 3, 16);
  ctx.fillRect(13, 0, 2, 16);

  // Highlights on ridges
  ctx.fillStyle = '#92400e';
  ctx.fillRect(3, 0, 1, 16);
  ctx.fillRect(9, 0, 1, 16);

  // Subtle bark knot
  if (variant % 2 === 0) {
    ctx.fillStyle = '#431f06';
    ctx.fillRect(5, 6, 4, 4);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(6, 7, 2, 2);
  }
}

function drawFoliageTexture(ctx: CanvasRenderingContext2D, variant: number) {
  // Lush Terraria leaf canopy texture (organic clustered leaves)
  ctx.fillStyle = '#14532d'; // Deep shadow green
  ctx.fillRect(0, 0, 16, 16);

  // Midtone leaf blobs
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(1, 2, 6, 6);
  ctx.fillRect(8, 1, 7, 7);
  ctx.fillRect(3, 8, 7, 7);
  ctx.fillRect(10, 8, 5, 6);

  // Bright sunny highlights
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(2, 3, 3, 2);
  ctx.fillRect(9, 2, 4, 3);
  ctx.fillRect(4, 9, 3, 2);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(3, 3, 1, 1);
  ctx.fillRect(10, 2, 1, 1);
}

function drawPlanksTexture(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 16, 16);

  // Horizontal plank seams
  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 7, 16, 1);
  ctx.fillRect(0, 15, 16, 1);

  // Vertical staggered board joints
  ctx.fillRect(7, 0, 1, 7);
  ctx.fillRect(12, 8, 1, 7);

  // Wood grain highlights
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 1, 16, 1);
  ctx.fillRect(0, 9, 16, 1);

  // Tiny iron nails
  ctx.fillStyle = '#451a03';
  ctx.fillRect(6, 3, 1, 1);
  ctx.fillRect(13, 11, 1, 1);
}

function drawStoneBricksTexture(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#52525b';
  ctx.fillRect(0, 0, 16, 16);

  // Mortar lines
  ctx.fillStyle = '#27272a';
  ctx.fillRect(0, 7, 16, 1);
  ctx.fillRect(0, 15, 16, 1);
  ctx.fillRect(8, 0, 1, 7);
  ctx.fillRect(4, 8, 1, 7);
  ctx.fillRect(12, 8, 1, 7);

  // Bevel highlights
  ctx.fillStyle = '#71717a';
  ctx.fillRect(0, 0, 8, 1);
  ctx.fillRect(9, 0, 7, 1);
  ctx.fillRect(0, 8, 4, 1);
  ctx.fillRect(5, 8, 7, 1);
  ctx.fillRect(13, 8, 3, 1);
}

function drawSandTexture(ctx: CanvasRenderingContext2D, variant: number) {
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 0, 16, 16);

  // Sand ripples & dunes
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(1, 4, 6, 1);
  ctx.fillRect(8, 8, 7, 1);
  ctx.fillRect(3, 12, 6, 1);

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(1, 3, 5, 1);
  ctx.fillRect(8, 7, 6, 1);
  ctx.fillRect(3, 11, 5, 1);
}

function drawSnowTexture(ctx: CanvasRenderingContext2D, variant: number) {
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 16, 16);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(1, 4, 4, 2);
  ctx.fillRect(7, 9, 5, 2);
  ctx.fillRect(12, 3, 3, 2);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(2, 6, 3, 1);
  ctx.fillRect(8, 11, 4, 1);
}

function drawIceTexture(ctx: CanvasRenderingContext2D, variant: number) {
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(0, 0, 16, 16);

  // Translucent ice shards & glints
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(2, 5, 6, 1);
  ctx.fillRect(7, 6, 5, 1);
  ctx.fillRect(4, 12, 8, 1);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(2, 4, 5, 1);
  ctx.fillRect(7, 5, 4, 1);
  ctx.fillRect(4, 11, 6, 1);
}

function drawShadowStoneTexture(ctx: CanvasRenderingContext2D, variant: number) {
  // Shadow dimension obsidian rock
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, 16, 16);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(2, 5, 6, 2);
  ctx.fillRect(9, 10, 5, 2);

  ctx.fillStyle = '#3730a3';
  ctx.fillRect(3, 4, 4, 1);
  ctx.fillRect(10, 9, 3, 1);

  // Eerie violet veins
  ctx.fillStyle = '#c084fc';
  ctx.fillRect(5, 7, 2, 1);
  ctx.fillRect(11, 4, 1, 2);
}

function drawPlatformTexture(ctx: CanvasRenderingContext2D) {
  // Thin wooden platform with support braces
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 16, 4);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 16, 1);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 3, 16, 1);

  // Support posts
  ctx.fillRect(2, 4, 3, 3);
  ctx.fillRect(11, 4, 3, 3);
}

function drawTorchTexture(ctx: CanvasRenderingContext2D, isShadow: boolean) {
  // Wooden stick handle
  ctx.fillStyle = '#78350f';
  ctx.fillRect(6, 6, 4, 10);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(9, 6, 1, 10);

  // Fiery flame head
  if (isShadow) {
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(5, 2, 6, 5);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(6, 1, 4, 4);
    ctx.fillStyle = '#fdf4ff';
    ctx.fillRect(7, 2, 2, 2);
  } else {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(5, 2, 6, 5);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(6, 1, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 2, 2, 2);
  }
}

function drawWorkbenchTexture(ctx: CanvasRenderingContext2D) {
  // Table top
  ctx.fillStyle = '#b45309';
  ctx.fillRect(1, 4, 14, 4);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(1, 4, 14, 1);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(1, 7, 14, 1);

  // Legs
  ctx.fillStyle = '#78350f';
  ctx.fillRect(2, 8, 3, 8);
  ctx.fillRect(11, 8, 3, 8);

  // Mini saw / vice tool on bench
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(4, 2, 3, 2);
  ctx.fillStyle = '#475569';
  ctx.fillRect(10, 2, 2, 2);
}

function drawFurnaceTexture(ctx: CanvasRenderingContext2D) {
  // Stone chimney dome
  ctx.fillStyle = '#52525b';
  ctx.fillRect(2, 2, 12, 14);
  ctx.fillStyle = '#71717a';
  ctx.fillRect(3, 2, 10, 2);

  // Glowing hot hearth
  ctx.fillStyle = '#18181b';
  ctx.fillRect(4, 7, 8, 7);

  ctx.fillStyle = '#ea580c';
  ctx.fillRect(5, 8, 6, 5);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(6, 10, 4, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(7, 11, 2, 1);
}

function drawAnvilTexture(ctx: CanvasRenderingContext2D) {
  // Blacksmith anvil top horn & face
  ctx.fillStyle = '#64748b';
  ctx.fillRect(1, 4, 14, 4);
  ctx.fillRect(0, 4, 2, 2); // Horn tip

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(2, 4, 12, 1); // Specular rim

  // Waist & sturdy foot
  ctx.fillStyle = '#475569';
  ctx.fillRect(5, 8, 6, 3);
  ctx.fillStyle = '#334155';
  ctx.fillRect(2, 11, 12, 5);
}

function drawChestTexture(ctx: CanvasRenderingContext2D) {
  // Wood chest body
  ctx.fillStyle = '#78350f';
  ctx.fillRect(1, 4, 14, 11);

  // Gold / iron reinforcement bands
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(1, 4, 14, 2); // Lid top
  ctx.fillRect(4, 4, 2, 11); // Left strap
  ctx.fillRect(10, 4, 2, 11); // Right strap
  ctx.fillRect(1, 9, 14, 1); // Split seam

  // Golden keyhole lock
  ctx.fillStyle = '#facc15';
  ctx.fillRect(7, 8, 2, 3);
  ctx.fillStyle = '#000000';
  ctx.fillRect(7.5, 9, 1, 1);
}

function drawPhaseAltarTexture(ctx: CanvasRenderingContext2D) {
  // Mystical glowing runic altar
  ctx.fillStyle = '#312e81';
  ctx.fillRect(1, 6, 14, 10);
  ctx.fillStyle = '#4338ca';
  ctx.fillRect(2, 4, 12, 2);

  // Floating pulsating cyan rift gem
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(6, 1, 4, 4);
  ctx.fillStyle = '#a5f3fc';
  ctx.fillRect(7, 2, 2, 2);

  // Runic sigils
  ctx.fillStyle = '#e879f9';
  ctx.fillRect(4, 9, 2, 4);
  ctx.fillRect(10, 9, 2, 4);
}

function drawDoorTexture(ctx: CanvasRenderingContext2D, closed: boolean) {
  if (closed) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(2, 0, 12, 16);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(4, 2, 8, 5);
    ctx.fillRect(4, 9, 8, 5);
    // Brass door handle
    ctx.fillStyle = '#facc15';
    ctx.fillRect(3, 8, 2, 2);
  } else {
    // Open door swung sideways
    ctx.fillStyle = '#451a03';
    ctx.fillRect(1, 0, 4, 16);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(2, 1, 2, 14);
  }
}

// ==========================================
// 2. ITEM PIXEL-ART ICONS (32x32 Data URLs)
// ==========================================

/**
 * Returns a crisp 32x32 pixel-art data URL for an item.
 * NEVER renders plain letters or text.
 */
export function getItemIconDataUrl(itemId: string): string {
  const cached = dataUrlCache.get(itemId);
  if (cached) return cached;

  const { canvas, ctx } = createPixelCanvas(32, 32);

  // Render authentic pixel-art icon for this item ID
  drawPixelArtItem(ctx, itemId);

  const dataUrl = canvas.toDataURL('image/png');
  dataUrlCache.set(itemId, dataUrl);
  return dataUrl;
}

function drawPixelArtItem(ctx: CanvasRenderingContext2D, itemId: string) {
  ctx.clearRect(0, 0, 32, 32);

  // Map item categories & IDs to iconic pixel drawings
  if (itemId.includes('pickaxe')) {
    drawPickaxeIcon(ctx, itemId);
  } else if (itemId.includes('axe')) {
    drawAxeIcon(ctx, itemId);
  } else if (itemId.includes('sword') || itemId.includes('broadsword') || itemId.includes('blade')) {
    drawSwordIcon(ctx, itemId);
  } else if (itemId.includes('bow')) {
    drawBowIcon(ctx, itemId);
  } else if (itemId.includes('arrow')) {
    drawArrowIcon(ctx, itemId);
  } else if (itemId.includes('staff') || itemId.includes('wand')) {
    drawStaffIcon(ctx, itemId);
  } else if (itemId.includes('helmet') || itemId.includes('hat') || itemId.includes('mask')) {
    drawHelmetIcon(ctx, itemId);
  } else if (itemId.includes('chest') && !itemId.includes('chest_')) {
    drawChestplateIcon(ctx, itemId);
  } else if (itemId.includes('legs') || itemId.includes('boots')) {
    drawBootsIcon(ctx, itemId);
  } else if (itemId.includes('potion') || itemId.includes('elixir')) {
    drawPotionIcon(ctx, itemId);
  } else if (itemId.includes('bar') || itemId.includes('ingot')) {
    drawIngotIcon(ctx, itemId);
  } else if (itemId.includes('torch')) {
    drawTorchIcon(ctx, itemId);
  } else if (itemId.includes('hook')) {
    drawGrapplingHookIcon(ctx);
  } else if (itemId.includes('ring')) {
    drawRingIcon(ctx, itemId);
  } else if (itemId.includes('core') || itemId.includes('totem') || itemId.includes('bell')) {
    drawBossSummonIcon(ctx, itemId);
  } else if (itemId.includes('shard') || itemId.includes('crystal')) {
    drawCrystalIcon(ctx, itemId);
  } else {
    // Block, material or generic object
    drawBlockIcon(ctx, itemId);
  }
}

// ------------------------------------------
// Individual Item Icon Pixel Painters
// ------------------------------------------

function drawSwordIcon(ctx: CanvasRenderingContext2D, id: string) {
  // Determine metal palette
  let bladeColor = '#cbd5e1';
  let bladeHighlight = '#ffffff';
  let hiltColor = '#78350f';
  let guardColor = '#facc15';

  if (id.includes('copper')) {
    bladeColor = '#ea580c';
    bladeHighlight = '#fed7aa';
  } else if (id.includes('gold')) {
    bladeColor = '#eab308';
    bladeHighlight = '#fef08a';
  } else if (id.includes('wood')) {
    bladeColor = '#92400e';
    bladeHighlight = '#d97706';
    guardColor = '#78350f';
  } else if (id.includes('phase') || id.includes('rift') || id.includes('shadow')) {
    bladeColor = '#06b6d4';
    bladeHighlight = '#a5f3fc';
    guardColor = '#a855f7';
  }

  // Draw angled broadsword (bottom-left to top-right diagonal)
  // Blade body
  for (let i = 0; i < 14; i++) {
    const x = 12 + i;
    const y = 20 - i;
    ctx.fillStyle = bladeColor;
    ctx.fillRect(x, y, 3, 3);
    ctx.fillStyle = bladeHighlight;
    ctx.fillRect(x, y, 1, 1);
  }

  // Crossguard
  ctx.fillStyle = guardColor;
  ctx.fillRect(9, 21, 6, 2);
  ctx.fillRect(11, 19, 2, 6);

  // Handle & pommel
  ctx.fillStyle = hiltColor;
  ctx.fillRect(7, 24, 3, 3);
  ctx.fillStyle = guardColor;
  ctx.fillRect(5, 26, 3, 3); // Pommel
}

function drawPickaxeIcon(ctx: CanvasRenderingContext2D, id: string) {
  let headColor = '#94a3b8';
  let headLight = '#ffffff';
  if (id.includes('copper')) {
    headColor = '#ea580c';
    headLight = '#ffedd5';
  } else if (id.includes('gold')) {
    headColor = '#eab308';
    headLight = '#fef08a';
  } else if (id.includes('rift')) {
    headColor = '#06b6d4';
    headLight = '#cffafe';
  }

  // Wooden haft (diagonal)
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(7 + i, 25 - i, 2, 2);
  }

  // Curved pick head
  ctx.fillStyle = headColor;
  ctx.fillRect(19, 5, 8, 3);
  ctx.fillRect(23, 3, 3, 8);
  ctx.fillRect(26, 2, 3, 3); // Upper tip
  ctx.fillRect(21, 10, 3, 3); // Lower tip

  ctx.fillStyle = headLight;
  ctx.fillRect(20, 5, 6, 1);
}

function drawAxeIcon(ctx: CanvasRenderingContext2D, id: string) {
  let bladeColor = '#94a3b8';
  let bladeLight = '#f8fafc';
  if (id.includes('copper')) {
    bladeColor = '#ea580c';
    bladeLight = '#fed7aa';
  }

  // Haft
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(7 + i, 25 - i, 2, 2);
  }

  // Axe head
  ctx.fillStyle = bladeColor;
  ctx.fillRect(18, 5, 9, 8);
  ctx.fillRect(21, 3, 6, 3);
  ctx.fillRect(21, 12, 6, 3);

  // Cutting edge highlight
  ctx.fillStyle = bladeLight;
  ctx.fillRect(26, 4, 2, 10);
}

function drawBowIcon(ctx: CanvasRenderingContext2D, id: string) {
  ctx.fillStyle = id.includes('iron') ? '#94a3b8' : id.includes('warp') ? '#818cf8' : '#78350f';

  // Curved stave
  ctx.fillRect(6, 6, 4, 3);
  ctx.fillRect(9, 9, 3, 4);
  ctx.fillRect(11, 13, 3, 6);
  ctx.fillRect(9, 19, 3, 4);
  ctx.fillRect(6, 23, 4, 3);

  // White bowstring
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(7, 9, 1, 14);
}

function drawArrowIcon(ctx: CanvasRenderingContext2D, id: string) {
  // Arrow shaft
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(8 + i, 23 - i, 2, 2);
  }
  // Arrowhead
  ctx.fillStyle = id.includes('phase') ? '#06b6d4' : '#94a3b8';
  ctx.fillRect(22, 6, 5, 5);
  ctx.fillRect(25, 4, 3, 3);
  // Fletching feathers
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(6, 22, 4, 4);
}

function drawStaffIcon(ctx: CanvasRenderingContext2D, id: string) {
  // Staff rod
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(6 + i, 25 - i, 2, 2);
  }
  // Glowing orb head
  ctx.fillStyle = id.includes('amethyst') ? '#c084fc' : '#38bdf8';
  ctx.fillRect(20, 4, 8, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(22, 6, 4, 4);
}

function drawHelmetIcon(ctx: CanvasRenderingContext2D, id: string) {
  const base = id.includes('iron') ? '#94a3b8' : id.includes('copper') ? '#ea580c' : id.includes('shadow') ? '#312e81' : '#78350f';
  ctx.fillStyle = base;
  ctx.fillRect(8, 7, 16, 14);
  ctx.fillRect(10, 5, 12, 3);

  // Visor eye slit
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(10, 13, 12, 3);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(10, 6, 10, 2);
}

function drawChestplateIcon(ctx: CanvasRenderingContext2D, id: string) {
  const base = id.includes('iron') ? '#94a3b8' : id.includes('copper') ? '#ea580c' : id.includes('shadow') ? '#312e81' : '#78350f';
  ctx.fillStyle = base;
  ctx.fillRect(7, 8, 18, 16);
  ctx.fillRect(5, 8, 4, 8); // Shoulders
  ctx.fillRect(23, 8, 4, 8);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(9, 10, 6, 6);
}

function drawBootsIcon(ctx: CanvasRenderingContext2D, id: string) {
  const base = id.includes('double') ? '#0284c7' : id.includes('shadow') ? '#4338ca' : '#78350f';
  ctx.fillStyle = base;
  // Left boot
  ctx.fillRect(7, 14, 6, 12);
  ctx.fillRect(4, 21, 9, 5);
  // Right boot
  ctx.fillRect(19, 14, 6, 12);
  ctx.fillRect(19, 21, 9, 5);

  if (id.includes('double')) {
    // Ethereal wings on boots
    ctx.fillStyle = '#a5f3fc';
    ctx.fillRect(2, 13, 4, 3);
    ctx.fillRect(26, 13, 4, 3);
  }
}

function drawPotionIcon(ctx: CanvasRenderingContext2D, id: string) {
  // Glass bottle neck & rim
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(13, 5, 6, 2);
  ctx.fillStyle = '#475569';
  ctx.fillRect(14, 7, 4, 4);

  // Cork
  ctx.fillStyle = '#78350f';
  ctx.fillRect(14, 3, 4, 3);

  // Flask round body
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(9, 11, 14, 15);
  ctx.fillRect(11, 9, 10, 3);

  // Liquid
  const liquidColor = id.includes('health') ? '#ef4444' : id.includes('echo') ? '#06b6d4' : '#8b5cf6';
  ctx.fillStyle = liquidColor;
  ctx.fillRect(10, 13, 12, 12);

  // Glass shine reflection
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(11, 14, 3, 5);
}

function drawIngotIcon(ctx: CanvasRenderingContext2D, id: string) {
  let main = '#cbd5e1';
  let light = '#ffffff';
  let dark = '#64748b';

  if (id.includes('gold')) {
    main = '#eab308';
    light = '#fef08a';
    dark = '#a16207';
  } else if (id.includes('copper')) {
    main = '#ea580c';
    light = '#fed7aa';
    dark = '#9a3412';
  } else if (id.includes('shadow')) {
    main = '#6366f1';
    light = '#c7d2fe';
    dark = '#312e81';
  }

  // Trapezoid metal bar
  ctx.fillStyle = dark;
  ctx.fillRect(5, 12, 22, 11);

  ctx.fillStyle = main;
  ctx.fillRect(6, 10, 20, 11);

  // Bevel top face
  ctx.fillStyle = light;
  ctx.fillRect(8, 10, 16, 3);
}

function drawTorchIcon(ctx: CanvasRenderingContext2D, id: string) {
  const isShadow = id.includes('shadow');
  ctx.fillStyle = '#78350f';
  ctx.fillRect(14, 12, 4, 16);

  ctx.fillStyle = isShadow ? '#a855f7' : '#f97316';
  ctx.fillRect(11, 5, 10, 9);
  ctx.fillStyle = isShadow ? '#e879f9' : '#facc15';
  ctx.fillRect(13, 4, 6, 7);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(15, 5, 2, 3);
}

function drawGrapplingHookIcon(ctx: CanvasRenderingContext2D) {
  // Steel three-pronged claw hook
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(14, 8, 4, 14); // Shaft

  // Prongs
  ctx.fillRect(9, 5, 5, 3);
  ctx.fillRect(7, 3, 3, 4);
  ctx.fillRect(18, 5, 5, 3);
  ctx.fillRect(22, 3, 3, 4);

  // Rope coil
  ctx.fillStyle = '#d97706';
  ctx.fillRect(12, 19, 8, 7);
}

function drawRingIcon(ctx: CanvasRenderingContext2D, id: string) {
  ctx.fillStyle = '#eab308'; // Gold band
  ctx.fillRect(10, 10, 12, 12);
  ctx.fillStyle = '#0f172a'; // Hole
  ctx.fillRect(13, 13, 6, 6);

  // Embedded Gem
  ctx.fillStyle = id.includes('shadow') ? '#a855f7' : '#06b6d4';
  ctx.fillRect(13, 7, 6, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(15, 8, 2, 2);
}

function drawBossSummonIcon(ctx: CanvasRenderingContext2D, id: string) {
  if (id.includes('core')) {
    // Ancient stone core
    ctx.fillStyle = '#f97316';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(12, 12, 8, 8);
  } else if (id.includes('eye')) {
    // Void eye
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(6, 10, 20, 12);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(12, 12, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(15, 14, 3, 3);
  } else {
    // Rift bell
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(10, 7, 12, 15);
    ctx.fillRect(7, 18, 18, 5);
  }
}

function drawCrystalIcon(ctx: CanvasRenderingContext2D, id: string) {
  const isVoid = id.includes('void');
  const isEcho = id.includes('echo');
  const color = isVoid ? '#c084fc' : isEcho ? '#06b6d4' : '#e879f9';

  ctx.fillStyle = color;
  ctx.fillRect(12, 6, 8, 18);
  ctx.fillRect(8, 10, 16, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(14, 8, 4, 12);
}

function drawBlockIcon(ctx: CanvasRenderingContext2D, id: string) {
  // Renders a mini 20x20 3D isometric/beveled block icon
  let color = '#78350f';
  if (id === 'stone' || id.includes('stone')) color = '#64748b';
  else if (id === 'dirt' || id.includes('dirt')) color = '#854d0e';
  else if (id === 'wood' || id.includes('wood')) color = '#78350f';
  else if (id.includes('sand')) color = '#eab308';
  else if (id.includes('snow')) color = '#f1f5f9';
  else if (id.includes('ice')) color = '#93c5fd';
  else if (id.includes('brick')) color = '#52525b';
  else if (id.includes('chest')) color = '#ca8a04';
  else if (id.includes('workbench')) color = '#d97706';
  else if (id.includes('furnace')) color = '#475569';
  else if (id.includes('anvil')) color = '#334155';

  ctx.fillStyle = color;
  ctx.fillRect(6, 6, 20, 20);

  // 3D Bevel
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(6, 6, 20, 3);
  ctx.fillRect(6, 6, 3, 20);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(6, 23, 20, 3);
  ctx.fillRect(23, 6, 3, 20);
}

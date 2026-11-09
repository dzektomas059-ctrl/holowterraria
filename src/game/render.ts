/**
 * Hollowfall - Procedural Pixel-Art Canvas 2D Renderer
 * Рендерер: чанки с offscreen-кешированием, динамический свет, параллакс-небо,
 * процедурная анимация персонажа (м/ж, 8 причёсок, броня), боссы и эффект Фазового сдвига
 */

import { ITEMS } from './items.ts';
import { Boss, DroppedItem, Enemy, ParticlePool, Projectile, TownNPC } from './entities.ts';
import { Player } from './player.ts';
import { CharacterAppearance, ItemCategory, LayerType, LiquidType, TileType, WallType } from './types.ts';
import { CHUNK_SIZE, TILE_SIZE, World } from './world.ts';
import { getTileTexture } from './textures.ts';

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  isCrit: boolean;
}

export class Renderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  // Camera
  public cameraX: number = 0;
  public cameraY: number = 0;
  public zoom: number = 2.0; // Pixel-art 2x scale
  public screenWidth: number = 1280;
  public screenHeight: number = 720;

  // Juice & FX
  public trauma: number = 0; // Camera shake
  public phaseShiftWave: { x: number; y: number; radius: number; maxRadius: number; active: boolean } = {
    x: 0,
    y: 0,
    radius: 0,
    maxRadius: 600,
    active: false,
  };
  public floatingTexts: FloatingText[] = [];

  // Lighting overlay canvas
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;

  // Minimap canvas
  public minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;

  // Title screen live animation
  private titleTime: number = 0;
  private titleClouds: { x: number; y: number; speed: number; w: number; h: number }[] = [
    { x: 50, y: 70, speed: 12, w: 120, h: 40 },
    { x: 300, y: 130, speed: 8, w: 160, h: 50 },
    { x: 600, y: 60, speed: 15, w: 140, h: 45 },
    { x: 850, y: 110, speed: 10, w: 180, h: 55 },
    { x: 1200, y: 80, speed: 11, w: 130, h: 42 },
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;

    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d')!;

    this.minimapCanvas = document.createElement('canvas');
    this.minimapCanvas.width = 160;
    this.minimapCanvas.height = 100;
    this.minimapCtx = this.minimapCanvas.getContext('2d')!;

    this.resize();
  }

  public resize(): void {
    this.screenWidth = window.innerWidth;
    this.screenHeight = window.innerHeight;
    this.canvas.width = this.screenWidth;
    this.canvas.height = this.screenHeight;

    this.lightCanvas.width = Math.ceil(this.screenWidth / this.zoom);
    this.lightCanvas.height = Math.ceil(this.screenHeight / this.zoom);

    this.ctx.imageSmoothingEnabled = false;
  }

  public addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  public triggerPhaseShiftEffect(worldX: number, worldY: number): void {
    this.phaseShiftWave.active = true;
    this.phaseShiftWave.x = worldX;
    this.phaseShiftWave.y = worldY;
    this.phaseShiftWave.radius = 10;
    this.addTrauma(0.5);
  }

  public addFloatingText(x: number, y: number, text: string, color: string = '#fff', isCrit: boolean = false): void {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 0.9,
      maxLife: 0.9,
      isCrit,
    });
  }

  public render(
    world: World,
    player: Player,
    enemies: Enemy[],
    bosses: Boss[],
    npcs: TownNPC[],
    projectiles: Projectile[],
    droppedItems: DroppedItem[],
    particlePool: ParticlePool,
    cursorWorld: { x: number; y: number },
    dt: number,
    debugMode: boolean = false
  ): void {
    // 1. Camera Follow Player with Smooth Deadzone & Shake
    const targetCamX = player.x - this.screenWidth / (2 * this.zoom);
    const targetCamY = player.y - player.height / 2 - this.screenHeight / (2 * this.zoom);
    this.cameraX += (targetCamX - this.cameraX) * 0.12;
    this.cameraY += (targetCamY - this.cameraY) * 0.12;

    // Shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.4);
      const shakeMag = this.trauma * this.trauma * 14;
      shakeX = (Math.random() - 0.5) * shakeMag;
      shakeY = (Math.random() - 0.5) * shakeMag;
    }

    const curCamX = Math.round(this.cameraX + shakeX);
    const curCamY = Math.round(this.cameraY + shakeY);

    // 2. Parallax Sky & Background
    this.renderBackground(world, curCamX, curCamY);

    // Save world transform
    this.ctx.save();
    this.ctx.scale(this.zoom, this.zoom);
    this.ctx.translate(-curCamX, -curCamY);

    // 3. Render Chunks (Tiles & Walls)
    const minCX = Math.max(0, Math.floor(curCamX / (CHUNK_SIZE * TILE_SIZE)));
    const maxCX = Math.min(world.chunksX - 1, Math.floor((curCamX + this.screenWidth / this.zoom) / (CHUNK_SIZE * TILE_SIZE)));
    const minCY = Math.max(0, Math.floor(curCamY / (CHUNK_SIZE * TILE_SIZE)));
    const maxCY = Math.min(world.chunksY - 1, Math.floor((curCamY + this.screenHeight / this.zoom) / (CHUNK_SIZE * TILE_SIZE)));

    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        this.renderChunk(world, world.activeLayer, cx, cy);
      }
    }

    // 4. Render Liquids
    this.renderLiquids(world, world.activeLayer, curCamX, curCamY);

    // 5. Render Dropped Items
    for (const item of droppedItems) {
      if (item.active && item.layer === world.activeLayer) {
        this.renderDroppedItem(item);
      }
    }

    // 6. Render Town NPCs
    for (const npc of npcs) {
      this.renderTownNPC(npc);
    }

    // 7. Render Enemies
    for (const enemy of enemies) {
      if (enemy.active && enemy.layer === world.activeLayer) {
        this.renderEnemy(enemy);
      }
    }

    // 8. Render Bosses
    for (const boss of bosses) {
      if (boss.active && (boss.layer === world.activeLayer || boss.id === 'phase_weaver')) {
        this.renderBoss(boss);
      }
    }

    // 9. Render Player
    this.renderPlayer(player);

    // 10. Render Grappling Hook Line
    if (player.hook.active) {
      this.ctx.strokeStyle = '#94a3b8';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y - player.height / 2);
      this.ctx.lineTo(player.hook.hookX, player.hook.hookY);
      this.ctx.stroke();

      // Hook anchor tip
      this.ctx.fillStyle = '#64748b';
      this.ctx.fillRect(player.hook.hookX - 2, player.hook.hookY - 2, 4, 4);
    }

    // 11. Render Projectiles
    for (const proj of projectiles) {
      if (proj.active && proj.layer === world.activeLayer) {
        this.renderProjectile(proj);
      }
    }

    // 12. Render Particles
    this.renderParticles(particlePool);

    // 13. Smart Cursor & Mining Highlight
    this.renderCursorHighlight(world, player, cursorWorld);

    // 14. Floating Damage Text
    this.renderFloatingTexts(dt);

    this.ctx.restore();

    // 15. Dynamic Lighting Pass (Soft Darkness & Light Blending)
    this.renderLightingOverlay(world, curCamX, curCamY);

    // 16. Phase Shift Visual Shockwave Ripple
    if (this.phaseShiftWave.active) {
      this.renderPhaseShiftWave(curCamX, curCamY, dt);
    }

    // 17. Minimap Rendering
    this.renderMinimap(world, player, bosses);

    // 18. Debug Info (F3)
    if (debugMode) {
      this.renderDebugOverlay(world, player, enemies, bosses);
    }
  }

  // ==========================================
  // BACKGROUND PARALLAX
  // ==========================================
  private renderBackground(world: World, camX: number, camY: number): void {
    const isLight = world.activeLayer === LayerType.LIGHT;
    const isDay = world.isDay();

    if (isLight) {
      // Light Realm: Sunlit sky or starlit night
      let skyTop = '#38bdf8';
      let skyBottom = '#bae6fd';
      if (!isDay) {
        skyTop = '#020617';
        skyBottom = '#0f172a';
      }

      const grad = this.ctx.createLinearGradient(0, 0, 0, this.screenHeight);
      grad.addColorStop(0, skyTop);
      grad.addColorStop(1, skyBottom);
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

      // Distant Parallax Mountains
      this.ctx.fillStyle = isDay ? '#64748b' : '#1e293b';
      this.drawParallaxHills(camX * 0.1, 140, 60, this.screenHeight * 0.65);

      // Midground Green/Snowy Hills
      this.ctx.fillStyle = isDay ? '#166534' : '#064e3b';
      this.drawParallaxHills(camX * 0.25, 90, 45, this.screenHeight * 0.78);
    } else {
      // Shadow Realm: Cosmic rift with eerie purple/cyan glow
      const grad = this.ctx.createLinearGradient(0, 0, 0, this.screenHeight);
      grad.addColorStop(0, '#090514');
      grad.addColorStop(0.5, '#1e1138');
      grad.addColorStop(1, '#0b1329');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

      // Void monoliths in parallax
      this.ctx.fillStyle = '#2e1065';
      this.drawParallaxHills(camX * 0.15, 120, 80, this.screenHeight * 0.7);

      // Floating dimensional crystals in sky
      const t = Date.now() * 0.001;
      this.ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 240 - camX * 0.05 + 1000) % (this.screenWidth + 200)) - 100;
        const cy = 90 + Math.sin(t + i) * 20;
        this.ctx.fillRect(cx, cy, 6, 12);
      }
    }
  }

  private drawParallaxHills(scrollX: number, step: number, amp: number, baseY: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.screenHeight);
    for (let x = -step; x <= this.screenWidth + step; x += step) {
      const worldOffset = (x + scrollX) * 0.01;
      const y = baseY + Math.sin(worldOffset) * amp + Math.cos(worldOffset * 2.3) * (amp * 0.4);
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(this.screenWidth, this.screenHeight);
    this.ctx.closePath();
    this.ctx.fill();
  }

  // ==========================================
  // CHUNK RENDERING & CACHING
  // ==========================================
  private renderChunk(world: World, layer: LayerType, cx: number, cy: number): void {
    const chunk = world.getOrCreateChunk(layer, cx, cy);

    if (chunk.dirty || !chunk.cachedCanvas) {
      if (!chunk.cachedCanvas) {
        chunk.cachedCanvas = document.createElement('canvas');
        chunk.cachedCanvas.width = CHUNK_SIZE * TILE_SIZE;
        chunk.cachedCanvas.height = CHUNK_SIZE * TILE_SIZE;
      }
      const cctx = chunk.cachedCanvas.getContext('2d')!;
      cctx.clearRect(0, 0, chunk.cachedCanvas.width, chunk.cachedCanvas.height);

      // Draw Walls First
      for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const wall = chunk.walls[ly * CHUNK_SIZE + lx] as WallType;
          if (wall !== WallType.NONE) {
            cctx.fillStyle = this.getWallColor(wall);
            cctx.fillRect(lx * TILE_SIZE, ly * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            // Shading brick grid
            cctx.fillStyle = 'rgba(0,0,0,0.18)';
            cctx.strokeRect(lx * TILE_SIZE + 0.5, ly * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
          }
        }
      }

      // Draw Tiles
      for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const tile = chunk.tiles[ly * CHUNK_SIZE + lx] as TileType;
          if (tile !== TileType.AIR) {
            const variant = (lx * 3 + ly * 7 + cx * 11 + cy * 13) % 4;
            this.drawProceduralTile(cctx, tile, lx * TILE_SIZE, ly * TILE_SIZE, variant);
          }
        }
      }

      chunk.dirty = false;
    }

    // Blit cached chunk
    this.ctx.drawImage(chunk.cachedCanvas, cx * CHUNK_SIZE * TILE_SIZE, cy * CHUNK_SIZE * TILE_SIZE);
  }

  private drawProceduralTile(cctx: CanvasRenderingContext2D, tile: TileType, px: number, py: number, variant: number = 0): void {
    const tex = getTileTexture(tile, variant);
    if (tex) {
      cctx.drawImage(tex, px, py);
      return;
    }

    switch (tile) {
      case TileType.DIRT:
        cctx.fillStyle = '#854d0e';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#713f12';
        cctx.fillRect(px + 3, py + 3, 3, 3);
        cctx.fillRect(px + 10, py + 8, 3, 3);
        break;

      case TileType.GRASS:
        cctx.fillStyle = '#854d0e';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#22c55e';
        cctx.fillRect(px, py, TILE_SIZE, 4);
        cctx.fillStyle = '#16a34a';
        cctx.fillRect(px + 2, py + 4, 3, 2);
        cctx.fillRect(px + 9, py + 4, 3, 2);
        break;

      case TileType.STONE:
        cctx.fillStyle = '#64748b';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#475569';
        cctx.fillRect(px + 4, py + 4, 4, 3);
        cctx.fillRect(px + 10, py + 9, 3, 4);
        break;

      case TileType.COPPER_ORE:
        cctx.fillStyle = '#64748b';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#ea580c';
        cctx.fillRect(px + 3, py + 4, 4, 3);
        cctx.fillRect(px + 9, py + 8, 4, 4);
        break;

      case TileType.IRON_ORE:
        cctx.fillStyle = '#64748b';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#cbd5e1';
        cctx.fillRect(px + 3, py + 4, 4, 4);
        cctx.fillRect(px + 9, py + 9, 4, 3);
        break;

      case TileType.GOLD_ORE:
        cctx.fillStyle = '#64748b';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#facc15';
        cctx.fillRect(px + 4, py + 3, 4, 4);
        cctx.fillRect(px + 8, py + 9, 4, 4);
        break;

      case TileType.WOOD:
        cctx.fillStyle = '#78350f';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#92400e';
        cctx.fillRect(px + 3, py, 4, TILE_SIZE);
        break;

      case TileType.LEAVES:
        cctx.fillStyle = '#15803d';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#22c55e';
        cctx.fillRect(px + 2, py + 2, 5, 5);
        cctx.fillRect(px + 8, py + 8, 5, 5);
        break;

      case TileType.PLANKS:
        cctx.fillStyle = '#b45309';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.strokeStyle = '#78350f';
        cctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        break;

      case TileType.STONE_BRICKS:
        cctx.fillStyle = '#52525b';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.strokeStyle = '#27272a';
        cctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        break;

      case TileType.PLATFORM:
        cctx.fillStyle = '#d97706';
        cctx.fillRect(px, py, TILE_SIZE, 4);
        cctx.fillStyle = '#92400e';
        cctx.fillRect(px + 2, py + 4, 3, 3);
        cctx.fillRect(px + 11, py + 4, 3, 3);
        break;

      case TileType.TORCH:
        cctx.fillStyle = '#78350f';
        cctx.fillRect(px + 6, py + 6, 4, 10);
        cctx.fillStyle = '#f59e0b';
        cctx.fillRect(px + 5, py + 2, 6, 5);
        cctx.fillStyle = '#ef4444';
        cctx.fillRect(px + 7, py + 1, 2, 3);
        break;

      case TileType.SHADOW_TORCH:
        cctx.fillStyle = '#1e1b4b';
        cctx.fillRect(px + 6, py + 6, 4, 10);
        cctx.fillStyle = '#818cf8';
        cctx.fillRect(px + 5, py + 2, 6, 5);
        cctx.fillStyle = '#38bdf8';
        cctx.fillRect(px + 7, py + 1, 2, 3);
        break;

      case TileType.WORKBENCH:
        cctx.fillStyle = '#92400e';
        cctx.fillRect(px + 1, py + 4, 14, 4);
        cctx.fillRect(px + 2, py + 8, 3, 8);
        cctx.fillRect(px + 11, py + 8, 3, 8);
        break;

      case TileType.FURNACE:
        cctx.fillStyle = '#52525b';
        cctx.fillRect(px + 1, py + 2, 14, 14);
        cctx.fillStyle = '#ea580c';
        cctx.fillRect(px + 5, py + 7, 6, 6);
        break;

      case TileType.ANVIL:
        cctx.fillStyle = '#334155';
        cctx.fillRect(px + 2, py + 5, 12, 4);
        cctx.fillRect(px + 4, py + 9, 8, 7);
        break;

      case TileType.PHASE_ALTAR:
        cctx.fillStyle = '#312e81';
        cctx.fillRect(px + 1, py + 3, 14, 13);
        cctx.fillStyle = '#06b6d4';
        cctx.fillRect(px + 5, py + 6, 6, 6);
        break;

      case TileType.CHEST:
        cctx.fillStyle = '#ca8a04';
        cctx.fillRect(px + 1, py + 3, 14, 13);
        cctx.fillStyle = '#854d0e';
        cctx.fillRect(px + 2, py + 7, 12, 2);
        cctx.fillStyle = '#eab308';
        cctx.fillRect(px + 6, py + 6, 4, 4);
        break;

      case TileType.DOOR_CLOSED:
        cctx.fillStyle = '#78350f';
        cctx.fillRect(px + 4, py, 8, TILE_SIZE);
        cctx.fillStyle = '#eab308';
        cctx.fillRect(px + 5, py + 7, 2, 2);
        break;

      case TileType.DOOR_OPEN:
        cctx.fillStyle = '#78350f';
        cctx.fillRect(px + 1, py, 3, TILE_SIZE);
        break;

      case TileType.ROPE:
        cctx.fillStyle = '#ca8a04';
        cctx.fillRect(px + 7, py, 2, TILE_SIZE);
        cctx.fillStyle = '#a16207';
        cctx.fillRect(px + 6, py + 3, 4, 2);
        cctx.fillRect(px + 6, py + 9, 4, 2);
        break;

      // Shadow Blocks
      case TileType.SHADOW_STONE:
        cctx.fillStyle = '#1e1b4b';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#312e81';
        cctx.fillRect(px + 3, py + 3, 4, 4);
        cctx.fillRect(px + 9, py + 9, 4, 3);
        break;

      case TileType.ECHO_SHARD_ORE:
        cctx.fillStyle = '#1e1b4b';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#06b6d4';
        cctx.fillRect(px + 4, py + 3, 4, 5);
        cctx.fillRect(px + 8, py + 8, 4, 4);
        break;

      case TileType.OBSIDIANITE_ORE:
        cctx.fillStyle = '#0f172a';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#6b21a8';
        cctx.fillRect(px + 3, py + 4, 5, 5);
        cctx.fillRect(px + 9, py + 8, 4, 4);
        break;

      case TileType.VOID_CRYSTAL:
        cctx.fillStyle = '#1e1b4b';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        cctx.fillStyle = '#a855f7';
        cctx.fillRect(px + 3, py + 2, 10, 12);
        break;

      case TileType.CRYSTAL_BRIDGE:
        cctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
        cctx.fillRect(px, py, TILE_SIZE, 6);
        cctx.fillStyle = '#bae6fd';
        cctx.fillRect(px + 2, py + 1, TILE_SIZE - 4, 2);
        break;

      default:
        cctx.fillStyle = '#ec4899';
        cctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        break;
    }
  }

  private getWallColor(wall: WallType): string {
    switch (wall) {
      case WallType.DIRT_WALL: return '#4a2810';
      case WallType.STONE_WALL: return '#334155';
      case WallType.WOOD_WALL: return '#451a03';
      case WallType.STONE_BRICK_WALL: return '#18181b';
      case WallType.SHADOW_WALL: return '#0f0c29';
      case WallType.GLASS_WALL: return 'rgba(165, 243, 252, 0.25)';
      default: return '#000';
    }
  }

  // ==========================================
  // LIQUIDS
  // ==========================================
  private renderLiquids(world: World, layer: LayerType, camX: number, camY: number): void {
    const minTX = Math.max(0, Math.floor(camX / TILE_SIZE));
    const maxTX = Math.min(world.width - 1, Math.floor((camX + this.screenWidth / this.zoom) / TILE_SIZE));
    const minTY = Math.max(0, Math.floor(camY / TILE_SIZE));
    const maxTY = Math.min(world.height - 1, Math.floor((camY + this.screenHeight / this.zoom) / TILE_SIZE));

    for (let ty = minTY; ty <= maxTY; ty++) {
      for (let tx = minTX; tx <= maxTX; tx++) {
        const liq = world.getLiquid(layer, tx, ty);
        if (liq.type !== LiquidType.NONE && liq.level > 0) {
          const heightPct = liq.level / 32;
          const px = tx * TILE_SIZE;
          const py = ty * TILE_SIZE + (1 - heightPct) * TILE_SIZE;
          const h = heightPct * TILE_SIZE;

          if (liq.type === LiquidType.WATER) {
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.65)';
          } else if (liq.type === LiquidType.LAVA) {
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
          } else {
            this.ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
          }
          this.ctx.fillRect(px, py, TILE_SIZE, h);
        }
      }
    }
  }

  // ==========================================
  // PROCEDURAL PLAYER RENDERING
  // ==========================================
  private renderPlayer(player: Player): void {
    const p = player;
    const ap = p.appearance;
    const px = Math.round(p.x);
    const py = Math.round(p.y);

    this.ctx.save();
    this.ctx.translate(px, py);
    if (p.facingLeft) {
      this.ctx.scale(-1, 1);
    }

    // Invincibility flashing
    if (p.invincibilityTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      this.ctx.globalAlpha = 0.4;
    }

    // Walking animation cycle
    const walkBob = p.onGround && Math.abs(p.vx) > 0.1 ? Math.sin(p.walkAnimTime) * 1.5 : 0;
    const legSwing = p.onGround && Math.abs(p.vx) > 0.1 ? Math.sin(p.walkAnimTime) * 4 : 0;

    // 1. Legs / Pants
    const legColor = p.equipment.legs ? ITEMS[p.equipment.legs.itemId]?.color || ap.pantsColor : ap.pantsColor;
    this.ctx.fillStyle = legColor;
    this.ctx.fillRect(-5 - legSwing * 0.5, -9, 4, 9); // Left leg
    this.ctx.fillRect(1 + legSwing * 0.5, -9, 4, 9);  // Right leg

    // Shoes
    this.ctx.fillStyle = ap.shoeColor;
    this.ctx.fillRect(-5 - legSwing * 0.5, -2, 5, 2);
    this.ctx.fillRect(1 + legSwing * 0.5, -2, 5, 2);

    // 2. Torso & Shirt
    const chestColor = p.equipment.chest ? ITEMS[p.equipment.chest.itemId]?.color || ap.shirtColor : ap.shirtColor;
    this.ctx.fillStyle = chestColor;
    this.ctx.fillRect(-5, -19 + walkBob, 10, 10);

    // Female styling waist taper
    if (ap.gender === 'female') {
      this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
      this.ctx.fillRect(-5, -14 + walkBob, 1, 5);
      this.ctx.fillRect(4, -14 + walkBob, 1, 5);
    }

    // 3. Head & Skin
    this.ctx.fillStyle = ap.skinColor;
    this.ctx.fillRect(-4, -26 + walkBob, 8, 7);

    // Eyes
    this.ctx.fillStyle = ap.eyeColor;
    this.ctx.fillRect(1, -24 + walkBob, 2, 2);

    // 4. Hair Styles (0..7)
    const hairColor = ap.hairColor;
    this.ctx.fillStyle = hairColor;
    switch (ap.hairStyle) {
      case 0: // Short Crop
        this.ctx.fillRect(-5, -28 + walkBob, 10, 3);
        this.ctx.fillRect(-5, -26 + walkBob, 3, 3);
        break;
      case 1: // Messy Anime Spikes
        this.ctx.fillRect(-5, -29 + walkBob, 10, 4);
        this.ctx.fillRect(-2, -31 + walkBob, 4, 3);
        break;
      case 2: // Long Ponytail
        this.ctx.fillRect(-5, -28 + walkBob, 10, 3);
        this.ctx.fillRect(-7, -26 + walkBob, 3, 10);
        break;
      case 3: // Side Bob
        this.ctx.fillRect(-5, -28 + walkBob, 10, 4);
        this.ctx.fillRect(-6, -26 + walkBob, 3, 8);
        this.ctx.fillRect(2, -26 + walkBob, 3, 6);
        break;
      case 4: // Braids
        this.ctx.fillRect(-5, -28 + walkBob, 10, 3);
        this.ctx.fillRect(-6, -25 + walkBob, 2, 9);
        this.ctx.fillRect(4, -25 + walkBob, 2, 9);
        break;
      case 5: // Mohawk
        this.ctx.fillRect(-1, -31 + walkBob, 3, 7);
        break;
      case 6: // Wizard Hat / Floppy
        this.ctx.fillRect(-6, -28 + walkBob, 12, 3);
        this.ctx.fillRect(-3, -33 + walkBob, 6, 5);
        break;
      default: // Classic Parted
        this.ctx.fillRect(-5, -28 + walkBob, 10, 3);
        this.ctx.fillRect(-5, -26 + walkBob, 4, 4);
        break;
    }

    // Helmet override on top of head if equipped
    if (p.equipment.helmet) {
      const helmColor = ITEMS[p.equipment.helmet.itemId]?.color || '#94a3b8';
      this.ctx.fillStyle = helmColor;
      this.ctx.fillRect(-5, -28 + walkBob, 10, 5);
      this.ctx.fillRect(-5, -24 + walkBob, 3, 4);
    }

    // 5. Arm & Weapon Swing
    const activeItem = p.inventory[p.selectedSlot];
    const armX = 1;
    const armY = -15 + walkBob;

    this.ctx.save();
    this.ctx.translate(armX, armY);

    if (p.isSwinging) {
      const swingProgress = 1 - p.swingTimer / p.swingDuration;
      const angleOffset = (swingProgress - 0.5) * Math.PI * 1.4;
      this.ctx.rotate(angleOffset);
    }

    // Arm sleeve
    this.ctx.fillStyle = chestColor;
    this.ctx.fillRect(-2, 0, 4, 6);
    this.ctx.fillStyle = ap.skinColor;
    this.ctx.fillRect(-2, 6, 3, 3);

    // Render Held Item (Sword, Pickaxe, Bow)
    if (activeItem) {
      const def = ITEMS[activeItem.itemId];
      if (def) {
        this.ctx.fillStyle = def.color || '#fff';
        if (def.category === ItemCategory.WEAPON_MELEE || def.category === ItemCategory.TOOL_PICKAXE) {
          // Blade / Tool head
          this.ctx.fillRect(0, 5, 3, 14);
          if (def.category === ItemCategory.TOOL_PICKAXE) {
            this.ctx.fillRect(-3, 17, 9, 3);
          }
        } else if (def.category === ItemCategory.WEAPON_RANGED) {
          // Bow curve
          this.ctx.fillRect(4, 2, 2, 10);
        } else if (def.category === ItemCategory.BLOCK) {
          // Miniature block
          this.ctx.fillRect(2, 4, 6, 6);
        }
      }
    }

    this.ctx.restore();
    this.ctx.restore();
  }

  // ==========================================
  // ENEMIES & BOSSES
  // ==========================================
  private renderEnemy(e: Enemy): void {
    const px = Math.round(e.x);
    const py = Math.round(e.y);

    this.ctx.save();
    this.ctx.translate(px, py);
    if (e.facingLeft) this.ctx.scale(-1, 1);

    if (e.hitFlashTimer > 0) {
      this.ctx.fillStyle = '#ffffff';
    } else {
      this.ctx.fillStyle = e.def.color;
    }

    // Draw Mob Body
    const w = e.def.width;
    const h = e.def.height;
    this.ctx.fillRect(-w / 2, -h, w, h);

    // Eye indicator
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(w / 4, -h * 0.7, 2, 2);

    this.ctx.restore();
  }

  private renderBoss(b: Boss): void {
    const px = Math.round(b.x);
    const py = Math.round(b.y);

    this.ctx.save();
    this.ctx.translate(px, py);

    // Hit Flash
    const flash = b.hitFlashTimer > 0;

    if (b.id === 'lithovore') {
      // Rock Titan Body
      this.ctx.fillStyle = flash ? '#fff' : '#52525b';
      this.ctx.fillRect(-30, -50, 60, 50);

      // Glowing Magma Core
      this.ctx.fillStyle = '#ea580c';
      this.ctx.fillRect(-12, -35, 24, 20);

      // Heavy Horns
      this.ctx.fillStyle = '#27272a';
      this.ctx.fillRect(-36, -60, 10, 16);
      this.ctx.fillRect(26, -60, 10, 16);
    } else if (b.id === 'voidgazer') {
      // Void Demon Eye
      this.ctx.fillStyle = flash ? '#fff' : '#2e1065';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 32, 0, Math.PI * 2);
      this.ctx.fill();

      // Iris & Pupil
      this.ctx.fillStyle = b.phase === 2 ? '#ef4444' : '#a855f7';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
      this.ctx.fill();

      // Telegraph laser sight if aiming dash
      if (b.isTelegraphing) {
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(b.vx * 20, b.vy * 20);
        this.ctx.stroke();
      }
    } else if (b.id === 'phase_weaver') {
      // Celestial Weaver
      this.ctx.fillStyle = flash ? '#fff' : '#06b6d4';
      this.ctx.fillRect(-20, -30, 40, 60);

      // Shield sphere if active
      if (b.shieldActive) {
        this.ctx.strokeStyle = '#38bdf8';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 45, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();

    // Boss Health Bar above boss
    const barW = 100;
    const barH = 6;
    const hpPct = Math.max(0, b.hp / b.maxHp);
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(b.x - barW / 2, b.y - b.height / 2 - 20, barW, barH);
    this.ctx.fillStyle = b.shieldActive ? '#06b6d4' : '#ef4444';
    this.ctx.fillRect(b.x - barW / 2, b.y - b.height / 2 - 20, barW * hpPct, barH);
  }

  private renderTownNPC(npc: TownNPC): void {
    const px = Math.round(npc.x);
    const py = Math.round(npc.y);

    this.ctx.save();
    this.ctx.translate(px, py);

    // Body & Hat
    this.ctx.fillStyle = '#475569';
    this.ctx.fillRect(-4, -20, 8, 12);
    this.ctx.fillStyle = '#fed7aa';
    this.ctx.fillRect(-3, -26, 6, 6);
    this.ctx.fillStyle = '#b45309';
    this.ctx.fillRect(-5, -28, 10, 3); // Hat

    // Name Tag
    this.ctx.fillStyle = '#e2e8f0';
    this.ctx.font = '9px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(npc.name, 0, -32);

    this.ctx.restore();
  }

  private renderDroppedItem(item: DroppedItem): void {
    const def = ITEMS[item.itemId];
    const px = Math.round(item.x);
    const py = Math.round(item.y + Math.sin(item.bobTimer) * 3);

    this.ctx.fillStyle = def?.color || '#fff';
    this.ctx.fillRect(px - 4, py - 4, 8, 8);

    // Sparkle
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(px - 2, py - 2, 2, 2);
  }

  private renderProjectile(proj: Projectile): void {
    this.ctx.fillStyle = proj.color;
    this.ctx.fillRect(proj.x - proj.width / 2, proj.y - proj.height / 2, proj.width, proj.height);
  }

  private renderParticles(pool: ParticlePool): void {
    for (const p of pool.particles) {
      if (p.active) {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life / p.maxLife;
        this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    this.ctx.globalAlpha = 1.0;
  }

  private renderCursorHighlight(world: World, player: Player, cursorWorld: { x: number; y: number }): void {
    const tx = Math.floor(cursorWorld.x / TILE_SIZE);
    const ty = Math.floor(cursorWorld.y / TILE_SIZE);
    const dist = Math.hypot(tx * TILE_SIZE + 8 - player.x, ty * TILE_SIZE + 8 - (player.y - player.height / 2));
    const reachable = dist < 95;

    this.ctx.strokeStyle = reachable ? 'rgba(255, 255, 255, 0.6)' : 'rgba(239, 68, 68, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(tx * TILE_SIZE + 0.5, ty * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }

  private renderFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 25; // Float upwards
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      } else {
        this.ctx.fillStyle = ft.color;
        this.ctx.font = ft.isCrit ? 'bold 13px sans-serif' : '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(ft.text, ft.x, ft.y);
      }
    }
  }

  // ==========================================
  // LIGHTING & SPECIAL EFFECTS
  // ==========================================
  private renderLightingOverlay(world: World, camX: number, camY: number): void {
    this.lightCtx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    const isLight = world.activeLayer === LayerType.LIGHT;
    const isDay = world.isDay();
    const baseDarkness = isLight ? (isDay ? 0.05 : 0.75) : 0.85;

    // Fill darkness
    this.lightCtx.fillStyle = `rgba(5, 5, 12, ${baseDarkness})`;
    this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // Punch light holes using tile light map
    this.lightCtx.globalCompositeOperation = 'destination-out';

    const minTX = Math.max(0, Math.floor(camX / TILE_SIZE));
    const maxTX = Math.min(world.width - 1, Math.floor((camX + this.screenWidth / this.zoom) / TILE_SIZE) + 1);
    const minTY = Math.max(0, Math.floor(camY / TILE_SIZE));
    const maxTY = Math.min(world.height - 1, Math.floor((camY + this.screenHeight / this.zoom) / TILE_SIZE) + 1);

    for (let ty = minTY; ty <= maxTY; ty++) {
      for (let tx = minTX; tx <= maxTX; tx++) {
        const lvl = world.getLight(world.activeLayer, tx, ty);
        if (lvl > 1) {
          const lx = tx * TILE_SIZE - camX;
          const ly = ty * TILE_SIZE - camY;
          const rad = (lvl / 15) * 36;
          const grad = this.lightCtx.createRadialGradient(lx + 8, ly + 8, 4, lx + 8, ly + 8, rad);
          grad.addColorStop(0, 'rgba(0,0,0,0.95)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          this.lightCtx.fillStyle = grad;
          this.lightCtx.beginPath();
          this.lightCtx.arc(lx + 8, ly + 8, rad, 0, Math.PI * 2);
          this.lightCtx.fill();
        }
      }
    }

    this.lightCtx.globalCompositeOperation = 'source-over';

    // Blit darkness over scene
    this.ctx.drawImage(this.lightCanvas, 0, 0, this.screenWidth, this.screenHeight);
  }

  private renderPhaseShiftWave(camX: number, camY: number, dt: number): void {
    const wave = this.phaseShiftWave;
    wave.radius += dt * 900;
    if (wave.radius > wave.maxRadius) {
      wave.active = false;
      return;
    }

    const screenX = (wave.x - camX) * this.zoom;
    const screenY = (wave.y - camY) * this.zoom;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, wave.radius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, wave.radius - 6, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  // ==========================================
  // MINIMAP
  // ==========================================
  private renderMinimap(world: World, player: Player, bosses: Boss[]): void {
    const mw = this.minimapCanvas.width;
    const mh = this.minimapCanvas.height;
    this.minimapCtx.fillStyle = '#0f172a';
    this.minimapCtx.fillRect(0, 0, mw, mh);

    // Map scale around player
    const centerTX = Math.floor(player.x / TILE_SIZE);
    const centerTY = Math.floor(player.y / TILE_SIZE);
    const startTX = Math.max(0, centerTX - Math.floor(mw / 2));
    const startTY = Math.max(0, centerTY - Math.floor(mh / 2));

    for (let my = 0; my < mh; my++) {
      for (let mx = 0; mx < mw; mx++) {
        const tx = startTX + mx;
        const ty = startTY + my;
        const tile = world.getTile(world.activeLayer, tx, ty);
        if (tile !== TileType.AIR) {
          this.minimapCtx.fillStyle = world.activeLayer === LayerType.LIGHT ? '#475569' : '#312e81';
          this.minimapCtx.fillRect(mx, my, 1, 1);
        }
      }
    }

    // Player marker
    this.minimapCtx.fillStyle = '#22c55e';
    this.minimapCtx.fillRect(Math.floor(mw / 2) - 1, Math.floor(mh / 2) - 1, 3, 3);

    // Boss marker
    for (const b of bosses) {
      if (b.active) {
        const bmx = Math.floor(b.x / TILE_SIZE) - startTX;
        const bmy = Math.floor(b.y / TILE_SIZE) - startTY;
        if (bmx >= 0 && bmx < mw && bmy >= 0 && bmy < mh) {
          this.minimapCtx.fillStyle = '#ef4444';
          this.minimapCtx.fillRect(bmx - 2, bmy - 2, 5, 5);
        }
      }
    }

    // Draw minimap on top right corner of main canvas
    const margin = 16;
    const renderX = this.screenWidth - mw - margin;
    const renderY = margin;

    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(renderX - 1, renderY - 1, mw + 2, mh + 2);
    this.ctx.drawImage(this.minimapCanvas, renderX, renderY);

    // Layer Badge
    this.ctx.fillStyle = world.activeLayer === LayerType.LIGHT ? '#f59e0b' : '#a855f7';
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.fillText(world.activeLayer === LayerType.LIGHT ? 'СВЕТ' : 'ТЕНЬ [Q]', renderX + 6, renderY + mh - 6);
  }

  // ==========================================
  // DEBUG OVERLAY (F3)
  // ==========================================
  private renderDebugOverlay(world: World, player: Player, enemies: Enemy[], bosses: Boss[]): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(16, 80, 240, 140);
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.font = '11px monospace';
    this.ctx.fillText(`Hollowfall v1.0.0 Debug (F3)`, 26, 100);
    this.ctx.fillText(`Слой: ${world.activeLayer === LayerType.LIGHT ? 'Светлый' : 'Теневой'}`, 26, 118);
    this.ctx.fillText(`Позиция: X=${Math.round(player.x)} Y=${Math.round(player.y)}`, 26, 136);
    this.ctx.fillText(`Скорость: Vx=${player.vx.toFixed(1)} Vy=${player.vy.toFixed(1)}`, 26, 154);
    this.ctx.fillText(`Сущности: ${enemies.length} врагов, ${bosses.length} боссов`, 26, 172);
    this.ctx.fillText(`Время мира: ${world.getTimeString()} (${world.isDay() ? 'День' : 'Ночь'})`, 26, 190);
    this.ctx.fillText(`FPS: 60`, 26, 208);
  }

  // ==========================================
  // TERRARIA-STYLE LIVE TITLE SCREEN BACKGROUND
  // ==========================================
  public renderTitleScreen(dt: number): void {
    this.titleTime += dt;
    const w = this.screenWidth;
    const h = this.screenHeight;

    // 1. Vibrant Terraria Blue Sky
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#2ea5ff');
    skyGrad.addColorStop(0.45, '#73c8ff');
    skyGrad.addColorStop(1, '#d5f0ff');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, h);

    // 2. Glowing Sun with Soft Lens Flare
    const sunX = w * 0.4;
    const sunY = h * 0.22;
    const sunGrad = this.ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 140);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.2, '#fffbeb');
    sunGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.4)');
    sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#fef08a';
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
    this.ctx.fill();

    // 3. Drifting Fluffy Pixel Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    for (const c of this.titleClouds) {
      c.x += c.speed * dt;
      if (c.x > w + 200) c.x = -250;

      // Draw tiered pixel cloud
      this.ctx.beginPath();
      this.ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.4, 0, 0, Math.PI * 2);
      this.ctx.ellipse(c.x - c.w * 0.2, c.y + 6, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
      this.ctx.ellipse(c.x + c.w * 0.22, c.y + 8, c.w * 0.38, c.h * 0.32, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 4. Distant Parallax Mountains
    this.ctx.fillStyle = '#6fa8dc';
    this.drawTitleMountains(0, 180, 75, h * 0.62);

    this.ctx.fillStyle = '#45818e';
    this.drawTitleMountains(20, 130, 60, h * 0.70);

    // 5. Iconic Giant Terraria Stone Cliff (Left Center)
    const cliffX = w * 0.22;
    const cliffY = h * 0.44;
    const cliffW = 160;
    const cliffH = h - cliffY;

    // Cliff Rock Body
    this.ctx.fillStyle = '#6b7280';
    this.ctx.beginPath();
    this.ctx.moveTo(cliffX - cliffW * 0.4, h);
    this.ctx.lineTo(cliffX - cliffW * 0.5, cliffY + 20);
    this.ctx.quadraticCurveTo(cliffX - cliffW * 0.55, cliffY, cliffX - cliffW * 0.4, cliffY);
    this.ctx.lineTo(cliffX + cliffW * 0.5, cliffY);
    this.ctx.quadraticCurveTo(cliffX + cliffW * 0.4, cliffY + 60, cliffX + cliffW * 0.3, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Cliff Shadow & Texture
    this.ctx.fillStyle = '#4b5563';
    this.ctx.fillRect(cliffX - cliffW * 0.35, cliffY + 30, 50, 80);
    this.ctx.fillRect(cliffX + cliffW * 0.05, cliffY + 50, 40, 100);

    // Cliff Top Grass
    this.ctx.fillStyle = '#22c55e';
    this.ctx.fillRect(cliffX - cliffW * 0.52, cliffY - 2, cliffW * 1.05, 10);
    this.ctx.fillStyle = '#16a34a';
    this.ctx.fillRect(cliffX - cliffW * 0.5, cliffY + 8, cliffW, 4);

    // 6. Foreground Rolling Green Ground
    const groundY = h * 0.76;
    this.ctx.fillStyle = '#78350f'; // Dirt under
    this.ctx.fillRect(0, groundY + 12, w, h - groundY);

    this.ctx.fillStyle = '#22c55e'; // Top Grass
    this.ctx.fillRect(0, groundY, w, 12);
    this.ctx.fillStyle = '#16a34a';
    this.ctx.fillRect(0, groundY + 12, w, 4);

    // Grass tufts
    for (let gx = 10; gx < w; gx += 28) {
      this.ctx.fillStyle = '#4ade80';
      this.ctx.fillRect(gx, groundY - 4, 3, 5);
      this.ctx.fillRect(gx + 3, groundY - 6, 2, 7);
    }

    // 7. Sunflowers on the left
    this.drawTitleSunflower(w * 0.08, groundY);
    this.drawTitleSunflower(w * 0.12, groundY);

    // 8. Tall Terraria Trees
    this.drawTitleTree(w * 0.28, groundY, 140);
    this.drawTitleTree(w * 0.46, groundY, 160);

    // 9. Cozy Wooden Cabin with Shingled Roof & Torch
    const houseX = w * 0.62;
    const houseY = groundY - 95;
    const houseW = 140;
    const houseH = 95;

    // Planks walls
    this.ctx.fillStyle = '#92400e';
    this.ctx.fillRect(houseX, houseY, houseW, houseH);
    this.ctx.fillStyle = '#78350f';
    for (let py = houseY; py < houseY + houseH; py += 12) {
      this.ctx.fillRect(houseX, py, houseW, 1.5);
    }

    // Shingled Roof
    this.ctx.fillStyle = '#475569';
    this.ctx.fillRect(houseX - 8, houseY - 14, houseW + 16, 14);
    this.ctx.fillStyle = '#334155';
    this.ctx.fillRect(houseX - 12, houseY - 6, houseW + 24, 6);

    // Door
    this.ctx.fillStyle = '#451a03';
    this.ctx.fillRect(houseX + 16, houseY + houseH - 42, 22, 42);
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillRect(houseX + 32, houseY + houseH - 24, 3, 3); // Knob

    // Window with cyan glass
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.fillRect(houseX + 80, houseY + 28, 36, 32);
    this.ctx.fillStyle = '#0284c7';
    this.ctx.fillRect(houseX + 97, houseY + 28, 2, 32);
    this.ctx.fillRect(houseX + 80, houseY + 43, 36, 2);

    // Warm Flickering Torch inside / on wall
    const torchFlicker = Math.sin(this.titleTime * 8) * 3;
    this.ctx.fillStyle = '#ea580c';
    this.ctx.fillRect(houseX + 50, houseY + 36, 4, 10);
    this.ctx.fillStyle = '#facc15';
    this.ctx.beginPath();
    this.ctx.arc(houseX + 52, houseY + 32, 6 + torchFlicker * 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    // 10. Little Animated Characters (Hero & Guide on grass)
    const charBob = Math.sin(this.titleTime * 3) * 1.5;
    this.drawTitleCharacter(w * 0.20, groundY + charBob, '#ef4444', '#eab308');
    this.drawTitleCharacter(w * 0.23, groundY + charBob * 0.8, '#8b5cf6', '#38bdf8');
    this.drawTitleCharacter(w * 0.56, groundY - charBob, '#10b981', '#78350f');

    // 11. Drifting Ambient Sparkles / Dandelion seeds
    for (let i = 0; i < 18; i++) {
      const px = ((i * 90 + this.titleTime * 25) % (w + 100)) - 50;
      const py = h * 0.5 + Math.sin(this.titleTime + i * 2) * 80;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      this.ctx.fillRect(px, py, 2.5, 2.5);
    }
  }

  private drawTitleMountains(offset: number, step: number, amp: number, baseY: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.screenHeight);
    for (let x = -step; x <= this.screenWidth + step; x += step) {
      const y = baseY + Math.sin((x + offset) * 0.007) * amp + Math.cos((x + offset) * 0.016) * (amp * 0.5);
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(this.screenWidth, this.screenHeight);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private drawTitleSunflower(x: number, groundY: number): void {
    // Stem
    this.ctx.fillStyle = '#15803d';
    this.ctx.fillRect(x + 5, groundY - 45, 4, 45);
    // Leaf
    this.ctx.fillRect(x - 4, groundY - 25, 10, 4);
    // Flower petals
    this.ctx.fillStyle = '#facc15';
    this.ctx.beginPath();
    this.ctx.arc(x + 7, groundY - 48, 14, 0, Math.PI * 2);
    this.ctx.fill();
    // Center
    this.ctx.fillStyle = '#78350f';
    this.ctx.beginPath();
    this.ctx.arc(x + 7, groundY - 48, 7, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawTitleTree(x: number, groundY: number, treeHeight: number): void {
    const sway = Math.sin(this.titleTime * 1.5 + x) * 6;
    // Trunk
    this.ctx.fillStyle = '#78350f';
    this.ctx.fillRect(x - 5, groundY - treeHeight, 10, treeHeight);
    this.ctx.fillStyle = '#92400e';
    this.ctx.fillRect(x - 2, groundY - treeHeight, 4, treeHeight);

    // Foliage crown
    const crownY = groundY - treeHeight - 15;
    this.ctx.fillStyle = '#15803d';
    this.ctx.beginPath();
    this.ctx.arc(x + sway, crownY, 38, 0, Math.PI * 2);
    this.ctx.arc(x - 20 + sway, crownY + 10, 26, 0, Math.PI * 2);
    this.ctx.arc(x + 20 + sway, crownY + 10, 26, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#22c55e';
    this.ctx.beginPath();
    this.ctx.arc(x - 6 + sway, crownY - 10, 18, 0, Math.PI * 2);
    this.ctx.arc(x + 12 + sway, crownY - 5, 20, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawTitleCharacter(x: number, y: number, shirtCol: string, hairCol: string): void {
    this.ctx.fillStyle = '#1d4ed8'; // Pants
    this.ctx.fillRect(x - 4, y - 8, 3, 8);
    this.ctx.fillRect(x + 1, y - 8, 3, 8);

    this.ctx.fillStyle = shirtCol; // Shirt
    this.ctx.fillRect(x - 5, y - 18, 10, 10);

    this.ctx.fillStyle = '#fcd34d'; // Head
    this.ctx.fillRect(x - 4, y - 25, 8, 7);

    this.ctx.fillStyle = '#0284c7'; // Eyes
    this.ctx.fillRect(x + 1, y - 23, 2, 2);

    this.ctx.fillStyle = hairCol; // Hair
    this.ctx.fillRect(x - 5, y - 28, 10, 4);
    this.ctx.fillRect(x - 2, y - 30, 4, 3);
  }
}


/**
 * Hollowfall - Entities, Enemies, Bosses, Town NPCs, Projectiles & Particle Pools
 * Сущности: 15+ врагов, 3 уникальных босса (включая Ткача Разломов с фазовой механикой), NPC и пулы частиц
 */

import { calculateDamage } from './rules.ts';
import { gameEvents } from './events.ts';
import { ITEMS } from './items.ts';
import { Player } from './player.ts';
import { AABB, InventorySlot, ItemRarity, LayerType, TileType } from './types.ts';
import { TILE_SIZE, World } from './world.ts';

export type EntityType = 'enemy' | 'boss' | 'npc' | 'projectile' | 'dropped_item';

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export class ParticlePool {
  public particles: Particle[];
  private cursor: number = 0;

  constructor(capacity: number = 500) {
    this.particles = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.particles[i] = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#fff',
        size: 2,
        life: 0,
        maxLife: 1,
      };
    }
  }

  public spawn(x: number, y: number, vx: number, vy: number, color: string, size: number = 2, maxLife: number = 0.5): void {
    const p = this.particles[this.cursor];
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.color = color;
    p.size = size;
    p.life = maxLife;
    p.maxLife = maxLife;
    this.cursor = (this.cursor + 1) % this.particles.length;
  }

  public spawnBurst(x: number, y: number, count: number, color: string, speed: number = 2): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.5 + Math.random() * 0.8) * speed;
      this.spawn(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd - 1, color, 2 + Math.random() * 2, 0.4 + Math.random() * 0.4);
    }
  }

  public update(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1; // gravity
        }
      }
    }
  }
}

export class Projectile {
  public active: boolean = true;
  public id: string;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public damage: number;
  public isHostile: boolean;
  public lifeTime: number = 4;
  public width: number = 8;
  public height: number = 8;
  public color: string = '#f59e0b';
  public layer: LayerType;

  constructor(id: string, x: number, y: number, vx: number, vy: number, damage: number, isHostile: boolean, layer: LayerType) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isHostile = isHostile;
    this.layer = layer;
    if (id === 'magic_bolt') this.color = '#38bdf8';
    if (id === 'void_bolt') this.color = '#a855f7';
    if (id === 'boulder') {
      this.width = 16;
      this.height = 16;
      this.color = '#71717a';
    }
  }

  public update(dt: number, world: World): boolean {
    this.lifeTime -= dt;
    if (this.lifeTime <= 0) return false;

    this.x += this.vx;
    this.y += this.vy;

    // Gravity on physical projectiles
    if (this.id === 'wooden_arrow' || this.id === 'boulder') {
      this.vy += 0.25;
    }

    // Tile collision check
    const tx = Math.floor(this.x / TILE_SIZE);
    const ty = Math.floor(this.y / TILE_SIZE);
    if (world.isSolid(this.layer, tx, ty)) {
      return false; // Impacted block
    }
    return true;
  }
}

export class DroppedItem {
  public active: boolean = true;
  public itemId: string;
  public count: number;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public layer: LayerType;
  public bobTimer: number = Math.random() * 10;

  constructor(itemId: string, count: number, x: number, y: number, layer: LayerType) {
    this.itemId = itemId;
    this.count = count;
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -3;
  }

  public update(dt: number, world: World, player: Player): boolean {
    this.bobTimer += dt * 3;

    // Gravity & physics
    this.vy += 0.25;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;

    // Solid collision with floor
    const tx = Math.floor(this.x / TILE_SIZE);
    const ty = Math.floor(this.y / TILE_SIZE);
    if (world.isSolid(this.layer, tx, ty)) {
      this.y = ty * TILE_SIZE;
      this.vy = 0;
    }

    // Magnet toward player if nearby (< 55px)
    if (world.activeLayer === this.layer) {
      const dx = player.x - this.x;
      const dy = (player.y - player.height / 2) - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 60) {
        this.vx += (dx / dist) * 0.8;
        this.vy += (dy / dist) * 0.8;

        if (dist < 18) {
          // Collected by player!
          const rem = player.inventory.findIndex(s => s === null || (s.itemId === this.itemId && s.count < (ITEMS[this.itemId]?.maxStack || 999)));
          if (rem !== -1) {
            const slot = player.inventory[rem];
            if (slot) {
              slot.count += this.count;
            } else {
              player.inventory[rem] = { itemId: this.itemId, count: this.count };
            }
            this.active = false;
            gameEvents.emit('ITEM_COLLECTED', { itemId: this.itemId, count: this.count });
            return false;
          }
        }
      }
    }

    return true;
  }
}

export interface EnemyDef {
  id: string;
  name: string;
  layer: LayerType;
  hp: number;
  damage: number;
  defense: number;
  speed: number;
  flying: boolean;
  width: number;
  height: number;
  color: string;
  drops: { itemId: string; min: number; max: number; chance: number }[];
}

export const ENEMY_TYPES: Record<string, EnemyDef> = {
  // --- Light Layer Mobs ---
  green_slime: {
    id: 'green_slime',
    name: 'Зеленый слизень',
    layer: LayerType.LIGHT,
    hp: 20,
    damage: 8,
    defense: 1,
    speed: 1.5,
    flying: false,
    width: 16,
    height: 12,
    color: '#22c55e',
    drops: [{ itemId: 'gel', min: 1, max: 3, chance: 1.0 }],
  },
  blue_slime: {
    id: 'blue_slime',
    name: 'Синий слизень',
    layer: LayerType.LIGHT,
    hp: 30,
    damage: 12,
    defense: 2,
    speed: 1.6,
    flying: false,
    width: 18,
    height: 14,
    color: '#3b82f6',
    drops: [{ itemId: 'gel', min: 2, max: 4, chance: 1.0 }],
  },
  forest_wolf: {
    id: 'forest_wolf',
    name: 'Лесной волк',
    layer: LayerType.LIGHT,
    hp: 45,
    damage: 16,
    defense: 3,
    speed: 2.8,
    flying: false,
    width: 24,
    height: 16,
    color: '#78716c',
    drops: [{ itemId: 'bone', min: 1, max: 2, chance: 0.6 }],
  },
  cave_bat: {
    id: 'cave_bat',
    name: 'Пещерная мышь',
    layer: LayerType.LIGHT,
    hp: 25,
    damage: 14,
    defense: 1,
    speed: 2.2,
    flying: true,
    width: 14,
    height: 12,
    color: '#475569',
    drops: [{ itemId: 'bone', min: 1, max: 2, chance: 0.4 }],
  },
  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: 'Скелет-страж',
    layer: LayerType.LIGHT,
    hp: 60,
    damage: 22,
    defense: 5,
    speed: 1.4,
    flying: false,
    width: 16,
    height: 28,
    color: '#e2e8f0',
    drops: [
      { itemId: 'bone', min: 2, max: 5, chance: 1.0 },
      { itemId: 'iron_bar', min: 1, max: 2, chance: 0.3 },
    ],
  },
  dune_bug: {
    id: 'dune_bug',
    name: 'Песчаный жук',
    layer: LayerType.LIGHT,
    hp: 40,
    damage: 18,
    defense: 6,
    speed: 2.0,
    flying: false,
    width: 18,
    height: 14,
    color: '#d97706',
    drops: [{ itemId: 'sand', min: 2, max: 5, chance: 0.7 }],
  },
  crystal_spider: {
    id: 'crystal_spider',
    name: 'Кристальный паук',
    layer: LayerType.LIGHT,
    hp: 55,
    damage: 24,
    defense: 4,
    speed: 2.5,
    flying: false,
    width: 20,
    height: 16,
    color: '#f43f5e',
    drops: [
      { itemId: 'silk', min: 2, max: 4, chance: 0.9 },
      { itemId: 'prismatic_crystal', min: 1, max: 2, chance: 0.4 },
    ],
  },
  magma_crawler: {
    id: 'magma_crawler',
    name: 'Магматический ползун',
    layer: LayerType.LIGHT,
    hp: 80,
    damage: 30,
    defense: 8,
    speed: 1.2,
    flying: false,
    width: 22,
    height: 16,
    color: '#ef4444',
    drops: [{ itemId: 'obsidianite', min: 1, max: 3, chance: 0.5 }],
  },

  // --- Shadow Layer Mobs ---
  shadow_creeper: {
    id: 'shadow_creeper',
    name: 'Теневой ползун',
    layer: LayerType.SHADOW,
    hp: 50,
    damage: 25,
    defense: 3,
    speed: 1.8,
    flying: false,
    width: 18,
    height: 16,
    color: '#312e81',
    drops: [{ itemId: 'echo_shard', min: 1, max: 3, chance: 0.8 }],
  },
  void_stalker: {
    id: 'void_stalker',
    name: 'Охотник Пустоты',
    layer: LayerType.SHADOW,
    hp: 75,
    damage: 34,
    defense: 6,
    speed: 3.2,
    flying: false,
    width: 18,
    height: 28,
    color: '#581c87',
    drops: [
      { itemId: 'echo_shard', min: 2, max: 4, chance: 0.9 },
      { itemId: 'void_crystal', min: 1, max: 1, chance: 0.25 },
    ],
  },
  phantom_harpy: {
    id: 'phantom_harpy',
    name: 'Призрачная гарпия',
    layer: LayerType.SHADOW,
    hp: 65,
    damage: 28,
    defense: 3,
    speed: 2.6,
    flying: true,
    width: 22,
    height: 20,
    color: '#6366f1',
    drops: [{ itemId: 'echo_shard', min: 1, max: 3, chance: 0.7 }],
  },
  rift_spore: {
    id: 'rift_spore',
    name: 'Спора Разлома',
    layer: LayerType.SHADOW,
    hp: 40,
    damage: 20,
    defense: 2,
    speed: 1.5,
    flying: true,
    width: 16,
    height: 16,
    color: '#a855f7',
    drops: [{ itemId: 'echo_shard', min: 1, max: 2, chance: 0.6 }],
  },
  abyssal_eye: {
    id: 'abyssal_eye',
    name: 'Око Бездны',
    layer: LayerType.SHADOW,
    hp: 90,
    damage: 32,
    defense: 5,
    speed: 2.0,
    flying: true,
    width: 22,
    height: 22,
    color: '#9333ea',
    drops: [
      { itemId: 'echo_shard', min: 2, max: 4, chance: 0.8 },
      { itemId: 'void_crystal', min: 1, max: 2, chance: 0.35 },
    ],
  },
  void_golem: {
    id: 'void_golem',
    name: 'Голем Пустоты',
    layer: LayerType.SHADOW,
    hp: 130,
    damage: 42,
    defense: 12,
    speed: 1.0,
    flying: false,
    width: 28,
    height: 36,
    color: '#1e1b4b',
    drops: [
      { itemId: 'obsidianite', min: 2, max: 6, chance: 1.0 },
      { itemId: 'void_crystal', min: 1, max: 3, chance: 0.5 },
    ],
  },
  phase_wanderer: {
    id: 'phase_wanderer',
    name: 'Странник Фаз',
    layer: LayerType.SHADOW,
    hp: 85,
    damage: 36,
    defense: 7,
    speed: 2.4,
    flying: false,
    width: 18,
    height: 28,
    color: '#06b6d4',
    drops: [{ itemId: 'echo_shard', min: 3, max: 6, chance: 1.0 }],
  },
};

export class Enemy {
  public def: EnemyDef;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public hp: number;
  public maxHp: number;
  public layer: LayerType;
  public hitFlashTimer: number = 0;
  public facingLeft: boolean = false;
  public jumpCooldown: number = 0;
  public active: boolean = true;

  constructor(def: EnemyDef, x: number, y: number) {
    this.def = def;
    this.x = x;
    this.y = y;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.layer = def.layer;
  }

  public getAABB(): AABB {
    return {
      x: this.x - this.def.width / 2,
      y: this.y - this.def.height,
      w: this.def.width,
      h: this.def.height,
    };
  }

  public update(dt: number, world: World, player: Player): { attackedPlayer: boolean } {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

    let attackedPlayer = false;

    // AI only tracks player if in same layer
    const sameLayer = world.activeLayer === this.layer;
    const dx = player.x - this.x;
    const dy = (player.y - player.height / 2) - (this.y - this.def.height / 2);
    const dist = Math.hypot(dx, dy);

    this.facingLeft = dx < 0;

    if (this.def.flying) {
      if (sameLayer && dist < 320) {
        this.vx = (dx / dist) * this.def.speed;
        this.vy = (dy / dist) * this.def.speed;
      } else {
        this.vx *= 0.95;
        this.vy = Math.sin(Date.now() * 0.003) * 0.5;
      }
      this.x += this.vx;
      this.y += this.vy;
    } else {
      // Ground AI
      if (sameLayer && dist < 260) {
        this.vx = (dx > 0 ? 1 : -1) * this.def.speed;

        // Jump over obstacles
        const frontTX = Math.floor((this.x + (dx > 0 ? 10 : -10)) / TILE_SIZE);
        const feetTY = Math.floor((this.y - 4) / TILE_SIZE);
        if (world.isSolid(this.layer, frontTX, feetTY) && this.jumpCooldown <= 0) {
          this.vy = -5.8;
          this.jumpCooldown = 0.8;
        }
      } else {
        this.vx *= 0.8;
      }

      this.vy += 0.35; // gravity
      this.x += this.vx;

      // Solid collision resolution
      this.y += this.vy;
      const box = this.getAABB();
      const col = world.checkAABBCollision(this.layer, box, false, this.vy);
      if (col.collided && this.vy > 0) {
        const minY = Math.min(...col.tiles.map(t => t.y));
        this.y = minY * TILE_SIZE;
        this.vy = 0;
      }
    }

    // Touch damage to player
    if (sameLayer && dist < (this.def.width + player.width) / 2) {
      const kbX = (player.x > this.x ? 1 : -1) * 6;
      player.takeDamage(this.def.damage, kbX, -3.5);
      attackedPlayer = true;
    }

    return { attackedPlayer };
  }

  public takeDamage(amount: number, knockbackX: number = 0): { killed: boolean; damageDealt: number } {
    const calc = calculateDamage(amount, this.def.defense);
    this.hp -= calc.damage;
    this.hitFlashTimer = 0.12;
    this.vx = knockbackX;
    this.vy = -2.5;

    if (this.hp <= 0) {
      this.active = false;
      return { killed: true, damageDealt: calc.damage };
    }
    return { killed: false, damageDealt: calc.damage };
  }
}

// ==========================================
// BOSSES
// ==========================================

export class Boss {
  public id: string;
  public name: string;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public hp: number;
  public maxHp: number;
  public layer: LayerType;
  public width: number;
  public height: number;
  public phase: number = 1;
  public attackTimer: number = 0;
  public telegraphTimer: number = 0;
  public isTelegraphing: boolean = false;
  public shieldActive: boolean = false;
  public pylonCount: number = 0; // For Phase Weaver boss
  public active: boolean = true;
  public hitFlashTimer: number = 0;

  constructor(id: string, name: string, x: number, y: number, maxHp: number, layer: LayerType, width: number, height: number) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.hp = maxHp;
    this.maxHp = maxHp;
    this.layer = layer;
    this.width = width;
    this.height = height;

    if (id === 'phase_weaver') {
      this.shieldActive = true;
      this.pylonCount = 3;
    }
  }

  public getAABB(): AABB {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      w: this.width,
      h: this.height,
    };
  }

  public update(dt: number, world: World, player: Player): {
    projectilesToSpawn: Projectile[];
    spawnRipples: boolean;
  } {
    const spawned: Projectile[] = [];
    let spawnRipples = false;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    this.attackTimer += dt;

    const dx = player.x - this.x;
    const dy = (player.y - player.height / 2) - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    // --- BOSS 1: The Primordial Lithovore ---
    if (this.id === 'lithovore') {
      this.vy += 0.35; // Heavy titan
      this.x += this.vx;
      this.y += this.vy;

      // Col floor
      const tx = Math.floor(this.x / TILE_SIZE);
      const ty = Math.floor(this.y / TILE_SIZE);
      if (world.isSolid(this.layer, tx, ty)) {
        this.y = ty * TILE_SIZE;
        this.vy = 0;
      }

      if (this.attackTimer > 3.0) {
        this.attackTimer = 0;
        // Boulder throw
        spawned.push(new Projectile('boulder', this.x, this.y - 20, (dx / dist) * 7, -6, 32, true, this.layer));
        // Jump slam towards player
        this.vy = -9;
        this.vx = (dx > 0 ? 1 : -1) * 4;
      }
    }

    // --- BOSS 2: The Voidgazer ---
    else if (this.id === 'voidgazer') {
      // Flying multi-phase eye
      if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
        this.phase = 2; // Enraged tooth charge phase!
        spawnRipples = true;
      }

      if (this.phase === 1) {
        // Hover above player & shoot void bolts
        const targetX = player.x + Math.sin(Date.now() * 0.002) * 120;
        const targetY = player.y - 140;
        this.vx += (targetX - this.x) * 0.03;
        this.vy += (targetY - this.y) * 0.03;
        this.vx *= 0.94;
        this.vy *= 0.94;
        this.x += this.vx;
        this.y += this.vy;

        if (this.attackTimer > 2.0) {
          this.attackTimer = 0;
          spawned.push(new Projectile('void_bolt', this.x, this.y, (dx / dist) * 8, (dy / dist) * 8, 26, true, this.layer));
        }
      } else {
        // Enraged phase: charge telegraph & high speed dash
        if (this.telegraphTimer > 0) {
          this.telegraphTimer -= dt;
          this.vx *= 0.85;
          this.vy *= 0.85;
        } else if (this.attackTimer > 2.5) {
          // Start telegraph
          this.isTelegraphing = true;
          this.telegraphTimer = 0.6;
          this.attackTimer = 0;
          // Aim dash
          this.vx = (dx / dist) * 14;
          this.vy = (dy / dist) * 14;
        } else {
          this.isTelegraphing = false;
        }
        this.x += this.vx;
        this.y += this.vy;
      }
    }

    // --- BOSS 3: The Phase Weaver (Requires Phase Shift) ---
    else if (this.id === 'phase_weaver') {
      // Floats and warps between layers!
      const targetX = player.x + Math.cos(Date.now() * 0.002) * 100;
      const targetY = player.y - 100 + Math.sin(Date.now() * 0.003) * 40;
      this.vx += (targetX - this.x) * 0.04;
      this.vy += (targetY - this.y) * 0.04;
      this.vx *= 0.92;
      this.vy *= 0.92;
      this.x += this.vx;
      this.y += this.vy;

      // Check pylons in Shadow realm: if 0, shield drops!
      if (this.pylonCount <= 0) {
        this.shieldActive = false;
      }

      if (this.attackTimer > 2.2) {
        this.attackTimer = 0;
        // Dual dimensional spread
        for (let a = -0.4; a <= 0.4; a += 0.4) {
          const angle = Math.atan2(dy, dx) + a;
          spawned.push(new Projectile('void_bolt', this.x, this.y, Math.cos(angle) * 7, Math.sin(angle) * 7, 30, true, this.layer));
        }
      }
    }

    // Touch damage to player if on same layer
    if (world.activeLayer === this.layer && dist < (this.width + player.width) / 2) {
      player.takeDamage(35, (player.x > this.x ? 1 : -1) * 8, -4);
    }

    return { projectilesToSpawn: spawned, spawnRipples };
  }

  public takeDamage(amount: number): { killed: boolean; damageDealt: number } {
    if (this.shieldActive) {
      // Immune while shield is active in Phase Weaver
      return { killed: false, damageDealt: 0 };
    }

    const calc = calculateDamage(amount, 8);
    this.hp -= calc.damage;
    this.hitFlashTimer = 0.15;

    if (this.hp <= 0) {
      this.active = false;
      return { killed: true, damageDealt: calc.damage };
    }
    return { killed: false, damageDealt: calc.damage };
  }
}

// ==========================================
// TOWN NPCS
// ==========================================

export interface TownNPC {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  dialogues: string[];
  shopItems: { itemId: string; price: number }[];
}

export const TOWN_NPCS: TownNPC[] = [
  {
    id: 'guide',
    name: 'Советник Элиан',
    role: 'Проводник',
    x: 0,
    y: 0,
    dialogues: [
      'Добро пожаловать в Hollowfall! Этот мир хранит тайну двух измерений: Светлого и Теневого.',
      'Нажми [Q], чтобы совершить Фазовый сдвиг. Расходуется энергия Эха, но это открывает скрытые пути!',
      'Сруби деревья топором, открой инвентарь [Tab] и создай Верстак. Он откроет десятки новых чертежей.',
      'Если построишь дом со стенами, дверью, стулом, столом и светом — к тебе поселятся полезные торговцы!',
      'В Теневом слое ищи Осколки Эха и Обсидианит. Из них куется броня и оружие невероятной мощи.',
    ],
    shopItems: [],
  },
  {
    id: 'merchant',
    name: 'Брун',
    role: 'Торговец',
    x: 0,
    y: 0,
    dialogues: [
      'Свежие припасы для бесстрашного исследователя недр!',
      'Факелы, веревки, целебные снадобья — без них под землю лучше не соваться.',
    ],
    shopItems: [
      { itemId: 'torch', price: 1 },
      { itemId: 'rope', price: 1 },
      { itemId: 'lesser_healing_potion', price: 5 },
      { itemId: 'iron_pickaxe', price: 20 },
    ],
  },
  {
    id: 'blacksmith',
    name: 'Торин',
    role: 'Кузнец',
    x: 0,
    y: 0,
    dialogues: [
      'Молот и наковальня — вот истинные хозяева этого мира!',
      'Принеси мне руду и слитки, и я помогу тебе выковать экипировку против стражей Бездны.',
    ],
    shopItems: [
      { itemId: 'anvil', price: 15 },
      { itemId: 'iron_bar', price: 4 },
      { itemId: 'copper_bar', price: 2 },
      { itemId: 'grappling_hook', price: 35 },
    ],
  },
  {
    id: 'mystic',
    name: 'Астра',
    role: 'Фазовый Мистик',
    x: 0,
    y: 0,
    dialogues: [
      'Я чувствую вибрации Теневого слоя... ткань реальности истончается.',
      'Ты обуздал Фазовый сдвиг? Возьми эти артефакты, если осмелишься бросить вызов Ткачу Разломов!',
    ],
    shopItems: [
      { itemId: 'echo_elixir', price: 15 },
      { itemId: 'shadow_ring', price: 60 },
      { itemId: 'double_jump_boots', price: 80 },
      { itemId: 'lithovore_core', price: 50 },
      { itemId: 'void_eye_totem', price: 65 },
      { itemId: 'rift_bell', price: 100 },
    ],
  },
];

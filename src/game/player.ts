/**
 * Hollowfall - Player Controller & Physics
 * Физика движения, двойной прыжок, крюк-кошка, фазовый сдвиг (Q), копание, атака
 */

import { calculateDamage, calculateFallDamage, canPhaseShift, isToolSuitable } from './rules.ts';
import { ITEMS } from './items.ts';
import { AABB, CharacterAppearance, CharacterData, InventorySlot, ItemCategory, LayerType, TileType, WallType } from './types.ts';
import { TILE_SIZE, World } from './world.ts';

export interface GrapplingHookState {
  active: boolean;
  hookX: number;
  hookY: number;
  targetX: number;
  targetY: number;
  attached: boolean;
  speed: number;
}

export class Player {
  // World position in pixels
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 14;  // hit box width
  public height: number = 26; // hit box height

  // State flags
  public onGround: boolean = false;
  public onRope: boolean = false;
  public inWater: boolean = false;
  public facingLeft: boolean = false;

  // Jump physics & juice
  public coyoteTimer: number = 0;
  public jumpBufferTimer: number = 0;
  public canDoubleJump: boolean = false;
  public highestYDuringFall: number = 0;

  // Stats
  public hp: number = 100;
  public maxHp: number = 100;
  public echoEnergy: number = 100;
  public maxEchoEnergy: number = 100;
  public oxygen: number = 100;
  public invincibilityTimer: number = 0;
  public phaseShiftCooldown: number = 0;

  // Tools & Combat
  public selectedSlot: number = 0;
  public swingAngle: number = 0;
  public isSwinging: boolean = false;
  public swingTimer: number = 0;
  public swingDuration: number = 0.2;
  public miningTile: { x: number; y: number; damage: number } | null = null;

  // Grappling hook
  public hook: GrapplingHookState = {
    active: false,
    hookX: 0,
    hookY: 0,
    targetX: 0,
    targetY: 0,
    attached: false,
    speed: 18,
  };

  // Appearance & Inventory
  public appearance: CharacterAppearance;
  public name: string = 'Герой';
  public inventory: (InventorySlot | null)[] = new Array(50).fill(null);
  public equipment: CharacterData['equipment'] = {
    helmet: null,
    chest: null,
    legs: null,
    accessory1: null,
    accessory2: null,
    accessory3: null,
  };

  // Animation ticks
  public walkAnimTime: number = 0;

  constructor(x: number, y: number, appearance: CharacterAppearance, name: string = 'Герой') {
    this.x = x;
    this.y = y;
    this.appearance = appearance;
    this.name = name;
    this.highestYDuringFall = y;
  }

  public getAABB(): AABB {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      w: this.width,
      h: this.height,
    };
  }

  public update(dt: number, world: World, inputs: {
    moveLeft: boolean;
    moveRight: boolean;
    moveUp: boolean;
    moveDown: boolean;
    jump: boolean;
    jumpJustPressed: boolean;
    useItem: boolean;
    phaseShift: boolean;
    grapple: boolean;
    aimWorldX: number;
    aimWorldY: number;
  }): {
    phaseShiftTriggered: boolean;
    spawnedProjectile?: { type: string; x: number; y: number; vx: number; vy: number; damage: number };
    minedTile?: { x: number; y: number; tile: TileType };
    felledTiles?: { x: number; y: number; tile: TileType }[];
    placedTile?: { x: number; y: number; tile: TileType };
  } {
    const result: {
      phaseShiftTriggered: boolean;
      spawnedProjectile?: { type: string; x: number; y: number; vx: number; vy: number; damage: number };
      minedTile?: { x: number; y: number; tile: TileType };
      felledTiles?: { x: number; y: number; tile: TileType }[];
      placedTile?: { x: number; y: number; tile: TileType };
    } = { phaseShiftTriggered: false };

    // 1. Timers & Regen
    if (this.invincibilityTimer > 0) this.invincibilityTimer -= dt;
    if (this.phaseShiftCooldown > 0) this.phaseShiftCooldown -= dt;
    if (this.swingTimer > 0) {
      this.swingTimer -= dt;
      if (this.swingTimer <= 0) this.isSwinging = false;
    }

    // Echo Energy & HP Passive Regen
    const hasShadowRing = this.hasAccessory('shadow_ring');
    const echoRegenSpeed = hasShadowRing ? 18 : 12; // points per sec
    if (this.echoEnergy < this.maxEchoEnergy) {
      this.echoEnergy = Math.min(this.maxEchoEnergy, this.echoEnergy + dt * echoRegenSpeed);
    }

    // 2. Phase Shift (Q)
    if (inputs.phaseShift) {
      const shiftCost = hasShadowRing ? 13 : 20;
      const check = canPhaseShift(this.echoEnergy, shiftCost, this.phaseShiftCooldown);
      if (check.canShift) {
        this.echoEnergy -= shiftCost;
        this.phaseShiftCooldown = this.hasAccessory('phase_capacitor') ? 0.6 : 1.2;
        world.activeLayer = world.activeLayer === LayerType.LIGHT ? LayerType.SHADOW : LayerType.LIGHT;
        result.phaseShiftTriggered = true;

        // Unstuck check: if landing inside solid blocks in other layer, push upwards gently
        this.unstuckPlayer(world);
      }
    }

    // 3. Grappling Hook Logic
    if (inputs.grapple && !this.hook.active && this.hasAccessory('grappling_hook')) {
      this.hook.active = true;
      this.hook.hookX = this.x;
      this.hook.hookY = this.y - this.height / 2;
      const dx = inputs.aimWorldX - this.hook.hookX;
      const dy = inputs.aimWorldY - this.hook.hookY;
      const dist = Math.hypot(dx, dy) || 1;
      this.hook.targetX = dx / dist;
      this.hook.targetY = dy / dist;
      this.hook.attached = false;
    }

    if (this.hook.active) {
      if (!this.hook.attached) {
        this.hook.hookX += this.hook.targetX * this.hook.speed;
        this.hook.hookY += this.hook.targetY * this.hook.speed;

        // Check if hook hit a solid tile
        const htx = Math.floor(this.hook.hookX / TILE_SIZE);
        const hty = Math.floor(this.hook.hookY / TILE_SIZE);
        if (world.isSolid(world.activeLayer, htx, hty)) {
          this.hook.attached = true;
        }

        // Max distance ~350px
        if (Math.hypot(this.hook.hookX - this.x, this.hook.hookY - this.y) > 350) {
          this.hook.active = false;
        }
      } else {
        // Pull player toward hook point
        const pullX = this.hook.hookX - this.x;
        const pullY = this.hook.hookY - (this.y - this.height / 2);
        const dist = Math.hypot(pullX, pullY);
        if (dist > 15) {
          this.vx = (pullX / dist) * 7;
          this.vy = (pullY / dist) * 7;
        } else {
          // Reached hook point
          this.vx = 0;
          this.vy = 0;
          if (inputs.jumpJustPressed) {
            this.hook.active = false;
            this.vy = -5.5;
          }
        }
        if (inputs.jumpJustPressed || inputs.moveDown) {
          this.hook.active = false;
        }
      }
    }

    // 4. Rope & Water status
    const currentTX = Math.floor(this.x / TILE_SIZE);
    const currentTY = Math.floor((this.y - this.height / 2) / TILE_SIZE);
    this.onRope = World.isRope(world.getTile(world.activeLayer, currentTX, currentTY));
    const liq = world.getLiquid(world.activeLayer, currentTX, currentTY);
    this.inWater = liq.level > 10;

    // 5. Horizontal Movement — Calibrated to Terraria 3.5 - 4.0 blocks/sec
    // 3.5 blocks/sec * 16px = 56px/sec -> ~1.15 px/frame max speed
    const moveSpeed = this.hasAccessory('shadow_legs') ? 1.45 : 1.15;
    const accel = this.onGround ? 0.16 : 0.09;
    const friction = this.onGround ? 0.78 : 0.94;

    if (inputs.moveLeft) {
      this.vx -= accel;
      if (this.vx < -moveSpeed) this.vx = -moveSpeed;
      this.facingLeft = true;
      this.walkAnimTime += dt * 8;
    } else if (inputs.moveRight) {
      this.vx += accel;
      if (this.vx > moveSpeed) this.vx = moveSpeed;
      this.facingLeft = false;
      this.walkAnimTime += dt * 8;
    } else {
      this.vx *= friction;
      if (Math.abs(this.vx) < 0.04) this.vx = 0;
    }

    // 6. Vertical Movement & Jumping — Terraria jump curve
    if (this.onGround) {
      this.coyoteTimer = 0.14;
      this.canDoubleJump = this.hasAccessory('double_jump_boots');
      // Check fall damage
      if (this.highestYDuringFall < this.y) {
        const tilesFallen = (this.y - this.highestYDuringFall) / TILE_SIZE;
        const fallDmg = calculateFallDamage(tilesFallen, 25);
        if (fallDmg > 0) {
          this.takeDamage(fallDmg);
        }
      }
      this.highestYDuringFall = this.y;
    } else {
      this.coyoteTimer -= dt;
      if (this.y < this.highestYDuringFall) {
        this.highestYDuringFall = this.y;
      }
    }

    if (inputs.jumpJustPressed) {
      this.jumpBufferTimer = 0.14;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    if (this.onRope) {
      this.vy = 0;
      if (inputs.moveUp) this.vy = -1.8;
      if (inputs.moveDown) this.vy = 1.8;
      if (inputs.jumpJustPressed) {
        this.vy = -4.2;
      }
    } else if (this.inWater) {
      // Swimming
      this.vy += 0.08;
      if (inputs.moveUp || inputs.jump) {
        this.vy = -1.6;
      }
      this.vy = Math.min(this.vy, 2.0);
    } else {
      // Normal Terraria Gravity curve
      const gravity = 0.22;
      this.vy += gravity;
      if (this.vy > 8.0) this.vy = 8.0; // terminal fall velocity

      // Jump execution: launches player ~3.5 blocks high
      if (this.jumpBufferTimer > 0) {
        if (this.coyoteTimer > 0) {
          this.vy = -4.8;
          this.jumpBufferTimer = 0;
          this.coyoteTimer = 0;
        } else if (this.canDoubleJump) {
          this.vy = -4.4;
          this.canDoubleJump = false;
          this.jumpBufferTimer = 0;
        }
      }

      // Variable jump cut (releasing space early cuts upward velocity smoothly)
      if (!inputs.jump && this.vy < -1.5) {
        this.vy *= 0.52;
      }
    }

    // 7. Physics Collision Resolution
    const ignorePlatforms = inputs.moveDown && inputs.jump;
    this.resolveCollisions(world, ignorePlatforms);

    // 8. Item Usage & Actions (Mining, Placing, Tree Felling)
    if (inputs.useItem && !this.isSwinging) {
      const activeItem = this.inventory[this.selectedSlot];
      if (activeItem) {
        const itemDef = ITEMS[activeItem.itemId];
        if (itemDef) {
          this.isSwinging = true;
          this.swingTimer = (itemDef.useTime || 16) / 60;
          this.swingDuration = this.swingTimer;

          // Swing angle calculation towards cursor
          const angle = Math.atan2(inputs.aimWorldY - (this.y - this.height / 2), inputs.aimWorldX - this.x);
          this.swingAngle = angle;

          // Action by category
          if (itemDef.category === ItemCategory.WEAPON_RANGED && itemDef.projectileType) {
            // Shoot arrow
            const speed = itemDef.speed || 8;
            result.spawnedProjectile = {
              type: itemDef.projectileType,
              x: this.x,
              y: this.y - this.height / 2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              damage: itemDef.damage || 10,
            };
          } else if (itemDef.category === ItemCategory.WEAPON_MAGIC) {
            // Magic projectile if enough mana
            const cost = itemDef.manaCost || 5;
            if (this.echoEnergy >= cost) {
              this.echoEnergy -= cost;
              result.spawnedProjectile = {
                type: 'magic_bolt',
                x: this.x,
                y: this.y - this.height / 2,
                vx: Math.cos(angle) * 7,
                vy: Math.sin(angle) * 7,
                damage: itemDef.damage || 15,
              };
            }
          } else if (itemDef.category === ItemCategory.TOOL_PICKAXE || itemDef.category === ItemCategory.TOOL_AXE) {
            // Mine target block within reach (~5.5 tiles)
            const targetTX = Math.floor(inputs.aimWorldX / TILE_SIZE);
            const targetTY = Math.floor(inputs.aimWorldY / TILE_SIZE);
            const dist = Math.hypot(targetTX * TILE_SIZE + 8 - this.x, targetTY * TILE_SIZE + 8 - (this.y - this.height / 2));

            if (dist < 90) {
              const tile = world.getTile(world.activeLayer, targetTX, targetTY);
              if (tile !== TileType.AIR) {
                const pickPow = itemDef.pickPower || 30;
                const axePow = itemDef.axePower || 30;
                const suit = isToolSuitable(tile, itemDef.category, pickPow, axePow);
                if (suit.suitable) {
                  // If it's a tree trunk being chopped with an axe -> Fell entire tree!
                  if (tile === TileType.WOOD && itemDef.category === ItemCategory.TOOL_AXE) {
                    const felled = world.fellTree(world.activeLayer, targetTX, targetTY);
                    result.felledTiles = felled;
                  } else {
                    world.setTile(world.activeLayer, targetTX, targetTY, TileType.AIR);
                    result.minedTile = { x: targetTX, y: targetTY, tile };
                  }
                }
              }
            }
          } else if (itemDef.category === ItemCategory.BLOCK && itemDef.tileType !== undefined) {
            // Place block
            const targetTX = Math.floor(inputs.aimWorldX / TILE_SIZE);
            const targetTY = Math.floor(inputs.aimWorldY / TILE_SIZE);
            const dist = Math.hypot(targetTX * TILE_SIZE + 8 - this.x, targetTY * TILE_SIZE + 8 - (this.y - this.height / 2));

            if (dist < 90 && world.getTile(world.activeLayer, targetTX, targetTY) === TileType.AIR) {
              world.setTile(world.activeLayer, targetTX, targetTY, itemDef.tileType);
              activeItem.count--;
              if (activeItem.count <= 0) {
                this.inventory[this.selectedSlot] = null;
              }
              result.placedTile = { x: targetTX, y: targetTY, tile: itemDef.tileType };
            }
          } else if (itemDef.category === ItemCategory.CONSUMABLE && itemDef.healAmount) {
            // Drink potion
            this.hp = Math.min(this.maxHp, this.hp + itemDef.healAmount);
            activeItem.count--;
            if (activeItem.count <= 0) {
              this.inventory[this.selectedSlot] = null;
            }
          }
        }
      }
    }

    return result;
  }

  private resolveCollisions(world: World, ignorePlatforms: boolean): void {
    const layer = world.activeLayer;

    // Horizontal pass
    this.x += this.vx;
    let box = this.getAABB();
    let col = world.checkAABBCollision(layer, box, true);
    if (col.collided) {
      if (this.vx > 0) {
        // Collided with right wall
        const minHitX = Math.min(...col.tiles.map(t => t.x));
        this.x = minHitX * TILE_SIZE - this.width / 2;
      } else if (this.vx < 0) {
        // Collided with left wall
        const maxHitX = Math.max(...col.tiles.map(t => t.x));
        this.x = (maxHitX + 1) * TILE_SIZE + this.width / 2;
      }
      this.vx = 0;
    }

    // Vertical pass
    this.y += this.vy;
    box = this.getAABB();
    col = world.checkAABBCollision(layer, box, ignorePlatforms, this.vy);
    this.onGround = false;

    if (col.collided) {
      if (this.vy > 0) {
        // Landed on floor
        const minHitY = Math.min(...col.tiles.map(t => t.y));
        this.y = minHitY * TILE_SIZE;
        this.onGround = true;
      } else if (this.vy < 0) {
        // Bumped head on ceiling
        const maxHitY = Math.max(...col.tiles.map(t => t.y));
        this.y = (maxHitY + 1) * TILE_SIZE + this.height;
      }
      this.vy = 0;
    }
  }

  private unstuckPlayer(world: World): void {
    const layer = world.activeLayer;
    let box = this.getAABB();
    let col = world.checkAABBCollision(layer, box, true);

    if (col.collided) {
      // Try pushing up up to 4 tiles
      for (let dy = 1; dy <= 4; dy++) {
        this.y -= dy * 8;
        box = this.getAABB();
        col = world.checkAABBCollision(layer, box, true);
        if (!col.collided) return;
      }
    }
  }

  public takeDamage(amount: number, knockbackX: number = 0, knockbackY: number = 0): boolean {
    if (this.invincibilityTimer > 0) return false;

    const totalDef = this.getTotalDefense();
    const dmgRes = calculateDamage(amount, totalDef);
    this.hp = Math.max(0, this.hp - dmgRes.damage);
    this.invincibilityTimer = 0.6; // 0.6s i-frames
    this.vx = knockbackX;
    this.vy = knockbackY || -3;

    return true;
  }

  public getTotalDefense(): number {
    let def = 0;
    const eq = this.equipment;
    if (eq.helmet && ITEMS[eq.helmet.itemId]?.defense) def += ITEMS[eq.helmet.itemId].defense!;
    if (eq.chest && ITEMS[eq.chest.itemId]?.defense) def += ITEMS[eq.chest.itemId].defense!;
    if (eq.legs && ITEMS[eq.legs.itemId]?.defense) def += ITEMS[eq.legs.itemId].defense!;
    return def;
  }

  public hasAccessory(id: string): boolean {
    const eq = this.equipment;
    return (
      eq.accessory1?.itemId === id ||
      eq.accessory2?.itemId === id ||
      eq.accessory3?.itemId === id ||
      eq.legs?.itemId === id ||
      eq.chest?.itemId === id ||
      eq.helmet?.itemId === id
    );
  }
}

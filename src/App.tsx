/**
 * Hollowfall - 2D Sandbox Adventure Game
 * Главный координирующий модуль: 60 FPS игровой цикл, состояния 'title' | 'playing' | 'paused' | 'gameover',
 * спавн врагов, призыв боссов, автосохранение и поддержка ?autostart=1
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SoundEngine } from './game/audio.ts';
import { Boss, DroppedItem, Enemy, ENEMY_TYPES, ParticlePool, Projectile, TownNPC, TOWN_NPCS } from './game/entities.ts';
import { InputManager } from './game/input.ts';
import { ITEMS } from './game/items.ts';
import { Player } from './game/player.ts';
import { Renderer } from './game/render.ts';
import { SaveManager, TileDelta } from './game/save.ts';
import { CharacterData, InventorySlot, LayerType, TileType, WorldMeta } from './game/types.ts';
import { TILE_SIZE, World } from './game/world.ts';
import { generateWorld } from './game/worldgen.ts';

// UI Components
import { AchievementsModal } from './components/AchievementsModal.tsx';
import { CharacterCreator } from './components/CharacterCreator.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { Hotbar } from './components/Hotbar.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { MobileControls } from './components/MobileControls.tsx';
import { NPCModal } from './components/NPCModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { QuestJournalModal } from './components/QuestJournalModal.tsx';
import { QuestTrackerHUD, GameToastContainer } from './components/QuestTrackerHUD.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { WorldCreator } from './components/WorldCreator.tsx';
import { gameEvents } from './game/events.ts';
import { addItemToInventory } from './game/rules.ts';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core decoupled engines
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const particlePoolRef = useRef<ParticlePool>(new ParticlePool(500));

  // Simulation references
  const worldRef = useRef<World | null>(null);
  const playerRef = useRef<Player | null>(null);
  const enemiesRef = useRef<Enemy[]>([]);
  const bossesRef = useRef<Boss[]>([]);
  const npcsRef = useRef<TownNPC[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const droppedItemsRef = useRef<DroppedItem[]>([]);
  const modifiedDeltasRef = useRef<TileDelta[]>([]);

  // React UI States
  const [gameState, setGameState] = useState<GameState>('title');
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [worlds, setWorlds] = useState<WorldMeta[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  // Modals
  const [showCharCreator, setShowCharCreator] = useState(false);
  const [showWorldCreator, setShowWorldCreator] = useState(false);
  const [worldGenerating, setWorldGenerating] = useState(false);
  const [worldGenStage, setWorldGenStage] = useState('');
  const [worldGenPercent, setWorldGenPercent] = useState(0);

  const [showInventory, setShowInventory] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeNpc, setActiveNpc] = useState<TownNPC | null>(null);
  const [openChestSlots, setOpenChestSlots] = useState<(InventorySlot | null)[] | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // HUD Throttle States
  const [hudHp, setHudHp] = useState(100);
  const [hudMaxHp, setHudMaxHp] = useState(100);
  const [hudEcho, setHudEcho] = useState(100);
  const [hudMaxEcho, setHudMaxEcho] = useState(100);
  const [hudSelectedSlot, setHudSelectedSlot] = useState(0);
  const [hudActiveLayer, setHudActiveLayer] = useState<LayerType>(LayerType.LIGHT);
  const [hudCooldown, setHudCooldown] = useState(0);
  const [muted, setMuted] = useState(false);
  const [sfxVol, setSfxVol] = useState(0.5);
  const [musicVol, setMusicVol] = useState(0.35);
  const [zoomLevel, setZoomLevel] = useState(2.0);

  // Sync dataset.state with body
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Load Saved Characters & Worlds
  useEffect(() => {
    let chars = SaveManager.getCharacters();
    let wrlds = SaveManager.getWorlds();

    // Default character if empty
    if (chars.length === 0) {
      const defaultChar: CharacterData = {
        id: 'char_default',
        name: 'Странник',
        difficulty: 'classic',
        appearance: {
          gender: 'male',
          hairStyle: 1,
          hairColor: '#eab308',
          skinColor: '#fcd34d',
          eyeColor: '#0284c7',
          shirtColor: '#ef4444',
          pantsColor: '#1d4ed8',
          shoeColor: '#451a03',
        },
        createdAt: Date.now(),
        playTime: 0,
        hp: 100,
        maxHp: 100,
        echoEnergy: 100,
        maxEchoEnergy: 100,
        inventory: [
          { itemId: 'copper_broadsword', count: 1 },
          { itemId: 'copper_pickaxe', count: 1 },
          { itemId: 'copper_axe', count: 1 },
          { itemId: 'torch', count: 25 },
          { itemId: 'wood', count: 60 },
          { itemId: 'lesser_healing_potion', count: 5 },
          { itemId: 'double_jump_boots', count: 1 },
          { itemId: 'grappling_hook', count: 1 },
          ...new Array(42).fill(null),
        ],
        equipment: {
          helmet: null,
          chest: null,
          legs: null,
          accessory1: { itemId: 'double_jump_boots', count: 1 },
          accessory2: { itemId: 'grappling_hook', count: 1 },
          accessory3: null,
        },
      };
      SaveManager.saveCharacter(defaultChar);
      chars = [defaultChar];
    }

    setCharacters(chars);
    setSelectedCharId(chars[0]?.id || null);

    setWorlds(wrlds);
    setSelectedWorldId(wrlds[0]?.id || null);

    // Check ?autostart=1 query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      // Fast start default world
      handleFastAutostart(chars[0]);
    }
  }, []);

  // Initialize Engines
  useEffect(() => {
    soundEngineRef.current = new SoundEngine();
    inputManagerRef.current = new InputManager();

    if (canvasRef.current) {
      rendererRef.current = new Renderer(canvasRef.current);
    }

    const handleResize = () => {
      rendererRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fast autostart helper for ?autostart=1
  const handleFastAutostart = async (char: CharacterData) => {
    const seed = 1234567;
    const { world, spawnX, spawnY } = await generateWorld({
      seed,
      width: 500,
      height: 300,
    });
    worldRef.current = world;

    const player = new Player(spawnX * TILE_SIZE, spawnY * TILE_SIZE, char.appearance, char.name);
    player.inventory = [...char.inventory];
    player.equipment = { ...char.equipment };
    playerRef.current = player;

    // Spawn Town Guide
    npcsRef.current = [
      {
        ...TOWN_NPCS[0],
        x: (spawnX + 3) * TILE_SIZE,
        y: spawnY * TILE_SIZE,
      },
    ];

    setGameState('playing');
  };

  // World Generation Handler
  const handleStartWorldGeneration = async (name: string, seed: number, width: number, height: number) => {
    setWorldGenerating(true);
    const { world, spawnX, spawnY } = await generateWorld({
      seed,
      width,
      height,
      onProgress: (stage, pct) => {
        setWorldGenStage(stage);
        setWorldGenPercent(pct);
      },
    });

    worldRef.current = world;

    const newWorldMeta: WorldMeta = {
      id: `world_${Date.now()}`,
      name,
      seed,
      width,
      height,
      createdAt: Date.now(),
      lastPlayed: Date.now(),
      defeatedBosses: [],
    };
    SaveManager.saveWorldMeta(newWorldMeta);
    setWorlds(SaveManager.getWorlds());
    setSelectedWorldId(newWorldMeta.id);

    setWorldGenerating(false);
    setShowWorldCreator(false);
  };

  // Enter Game World
  const handleStartGame = () => {
    const char = characters.find((c) => c.id === selectedCharId);
    const worldMeta = worlds.find((w) => w.id === selectedWorldId);
    if (!char || !worldMeta) return;

    soundEngineRef.current?.init();

    // If world not generated in memory yet, generate it now
    if (!worldRef.current) {
      setWorldGenerating(true);
      setShowWorldCreator(true);
      generateWorld({
        seed: worldMeta.seed,
        width: worldMeta.width,
        height: worldMeta.height,
        onProgress: (stage, pct) => {
          setWorldGenStage(stage);
          setWorldGenPercent(pct);
        },
      }).then(({ world, spawnX, spawnY }) => {
        worldRef.current = world;

        // Apply saved deltas if any
        const deltas = SaveManager.loadWorldDelta(worldMeta.id);
        for (const d of deltas) {
          if (d.tile !== undefined) world.setTile(d.layer, d.x, d.y, d.tile);
          if (d.wall !== undefined) world.setWall(d.layer, d.x, d.y, d.wall);
        }

        const player = new Player(spawnX * TILE_SIZE, spawnY * TILE_SIZE, char.appearance, char.name);
        player.inventory = [...char.inventory];
        player.equipment = { ...char.equipment };
        playerRef.current = player;

        // NPCs
        npcsRef.current = [
          { ...TOWN_NPCS[0], x: (spawnX + 3) * TILE_SIZE, y: spawnY * TILE_SIZE },
          { ...TOWN_NPCS[1], x: (spawnX - 4) * TILE_SIZE, y: spawnY * TILE_SIZE },
        ];

        setWorldGenerating(false);
        setShowWorldCreator(false);
        setGameState('playing');
      });
    } else {
      setGameState('playing');
    }
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let enemySpawnTimer = 0;
    let autosaveTimer = 0;
    let timeSurvivedTimer = 0;
    let moveThrottleTimer = 0;

    const gameLoop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // Clamped dt to prevent tunneling

      const world = worldRef.current;
      const player = playerRef.current;
      const inputs = inputManagerRef.current;
      const renderer = rendererRef.current;
      const sound = soundEngineRef.current;
      const particles = particlePoolRef.current;

      if (gameState === 'title' && renderer) {
        renderer.renderTitleScreen(dt);
      } else if (gameState === 'playing' && world && player && inputs && renderer) {
        // 1. Advance World Time & Fluids
        world.updateTime(dt);

        // Tick Time Survived for achievements & quests
        timeSurvivedTimer += dt;
        if (timeSurvivedTimer >= 1.0) {
          timeSurvivedTimer -= 1.0;
          gameEvents.emit('TIME_SURVIVED', { seconds: 1 });
        }

        // Throttle player movement tracking event (every 0.25s)
        moveThrottleTimer += dt;
        if (moveThrottleTimer >= 0.25) {
          moveThrottleTimer = 0;
          gameEvents.emit('PLAYER_MOVED', {
            x: player.x,
            y: player.y,
            depth: Math.floor(player.y / TILE_SIZE),
            biome: world.activeLayer === LayerType.LIGHT ? 'surface' : 'shadow',
          });
        }

        // Convert mouse screen to world coordinates
        const curCamX = renderer.cameraX;
        const curCamY = renderer.cameraY;
        const aimWorldX = curCamX + inputs.mouseScreenX / renderer.zoom;
        const aimWorldY = curCamY + inputs.mouseScreenY / renderer.zoom;

        // Hotbar wheel selection or keys 1..9, 0
        if (inputs.wheelDelta !== 0) {
          player.selectedSlot = (player.selectedSlot + (inputs.wheelDelta > 0 ? 1 : 9)) % 10;
        }
        for (let i = 0; i < 10; i++) {
          const key = i === 9 ? 'Digit0' : `Digit${i + 1}`;
          if (inputs.isJustPressed(key)) {
            player.selectedSlot = i;
          }
        }

        // Toggles
        if (inputs.getInventoryToggle()) {
          setShowInventory((prev) => !prev);
        }
        if (inputs.getPauseToggle()) {
          setGameState('paused');
        }
        if (inputs.getDebugToggle()) {
          setDebugMode((prev) => !prev);
        }

        // 2. Update Player
        const pResult = player.update(dt, world, {
          moveLeft: inputs.getMoveLeft(),
          moveRight: inputs.getMoveRight(),
          moveUp: inputs.getMoveUp(),
          moveDown: inputs.getMoveDown(),
          jump: inputs.getJump(),
          jumpJustPressed: inputs.getJumpJustPressed(),
          useItem: inputs.mouseLeftHeld,
          phaseShift: inputs.getPhaseShift(),
          grapple: inputs.getGrapple(),
          aimWorldX,
          aimWorldY,
        });

        // Trigger Phase Shift FX
        if (pResult.phaseShiftTriggered) {
          renderer.triggerPhaseShiftEffect(player.x, player.y);
          sound?.playPhaseShift();
          gameEvents.emit('PHASE_SHIFTED', {
            fromLayer: world.activeLayer === LayerType.LIGHT ? LayerType.SHADOW : LayerType.LIGHT,
            toLayer: world.activeLayer,
          });
        }

        // Player mined a single tile
        if (pResult.minedTile) {
          const { x, y, tile } = pResult.minedTile;
          particles.spawnBurst(x * TILE_SIZE + 8, y * TILE_SIZE + 8, 8, '#71717a');
          sound?.playDig(true);
          gameEvents.emit('BLOCK_MINED', { tile, x, y });

          // Spawn dropped item
          const itemDefKey = Object.keys(ITEMS).find((k) => ITEMS[k].tileType === tile) || 'stone';
          droppedItemsRef.current.push(
            new DroppedItem(itemDefKey, 1, x * TILE_SIZE + 8, y * TILE_SIZE + 8, world.activeLayer)
          );

          // Record delta
          modifiedDeltasRef.current.push({ layer: world.activeLayer, x, y, tile: TileType.AIR });
        }

        // Player felled an entire tree with an axe (Terraria-style)
        if (pResult.felledTiles) {
          for (const ft of pResult.felledTiles) {
            if (ft.tile === TileType.WOOD) {
              droppedItemsRef.current.push(
                new DroppedItem('wood', 1, ft.x * TILE_SIZE + 8, ft.y * TILE_SIZE + 8, world.activeLayer)
              );
              particles.spawnBurst(ft.x * TILE_SIZE + 8, ft.y * TILE_SIZE + 8, 6, '#78350f');
              gameEvents.emit('BLOCK_MINED', { tile: TileType.WOOD, x: ft.x, y: ft.y });
            } else if (ft.tile === TileType.LEAVES) {
              particles.spawnBurst(ft.x * TILE_SIZE + 8, ft.y * TILE_SIZE + 8, 5, '#22c55e');
            }
            modifiedDeltasRef.current.push({ layer: world.activeLayer, x: ft.x, y: ft.y, tile: TileType.AIR });
          }
          sound?.playDig(true);
        }

        // Player placed a tile
        if (pResult.placedTile) {
          const { x, y, tile } = pResult.placedTile;
          sound?.playDig(false);
          modifiedDeltasRef.current.push({ layer: world.activeLayer, x, y, tile });
          gameEvents.emit('BLOCK_PLACED', { tile, x, y });
        }

        // Player spawned projectile (arrow or spell)
        if (pResult.spawnedProjectile) {
          const sp = pResult.spawnedProjectile;
          projectilesRef.current.push(
            new Projectile(sp.type, sp.x, sp.y, sp.vx, sp.vy, sp.damage, false, world.activeLayer)
          );
          sound?.playSwing();
        }

        // Right-Click interactions: Doors, Chests, NPCs, Boss Summons
        if (inputs.mouseRightJustPressed) {
          const targetTX = Math.floor(aimWorldX / TILE_SIZE);
          const targetTY = Math.floor(aimWorldY / TILE_SIZE);
          const clickedTile = world.getTile(world.activeLayer, targetTX, targetTY);

          // Open/close door
          if (clickedTile === TileType.DOOR_CLOSED) {
            world.setTile(world.activeLayer, targetTX, targetTY, TileType.DOOR_OPEN);
            sound?.playDig(false);
          } else if (clickedTile === TileType.DOOR_OPEN) {
            world.setTile(world.activeLayer, targetTX, targetTY, TileType.DOOR_CLOSED);
            sound?.playDig(false);
          }
          // Open chest
          else if (clickedTile === TileType.CHEST) {
            const chestKey = `${world.activeLayer}_${targetTX}_${targetTY}`;
            let cSlots = world.chests.get(chestKey);
            if (!cSlots) {
              cSlots = new Array(30).fill(null);
              world.chests.set(chestKey, cSlots);
            }
            setOpenChestSlots(cSlots);
            setShowInventory(true);
            gameEvents.emit('CHEST_OPENED', { x: targetTX, y: targetTY });
          }

          // Check if right clicked an NPC
          for (const npc of npcsRef.current) {
            if (Math.hypot(aimWorldX - npc.x, aimWorldY - npc.y) < 28) {
              setActiveNpc(npc);
              break;
            }
          }

          // Check Boss Summon from active slot
          const activeItem = player.inventory[player.selectedSlot];
          if (activeItem) {
            if (activeItem.itemId === 'lithovore_core') {
              bossesRef.current.push(
                new Boss('lithovore', 'Корнекаменный Исполин', player.x + 100, player.y - 20, 900, world.activeLayer, 60, 50)
              );
              renderer.addFloatingText(player.x, player.y - 40, 'ДРЕВНИЙ ИСПОЛИН ПРОБУДИЛСЯ!', '#f97316', true);
              sound?.playBossRoar();
              activeItem.count--;
              if (activeItem.count <= 0) player.inventory[player.selectedSlot] = null;
            } else if (activeItem.itemId === 'void_eye_totem') {
              bossesRef.current.push(
                new Boss('voidgazer', 'Око Пустоты', player.x, player.y - 180, 1200, world.activeLayer, 64, 64)
              );
              renderer.addFloatingText(player.x, player.y - 40, 'ОКО ПУСТОТЫ ВЗИРАЕТ НА ВАС!', '#a855f7', true);
              sound?.playBossRoar();
              activeItem.count--;
              if (activeItem.count <= 0) player.inventory[player.selectedSlot] = null;
            } else if (activeItem.itemId === 'rift_bell') {
              bossesRef.current.push(
                new Boss('phase_weaver', 'Ткач Разломов', player.x, player.y - 160, 2000, world.activeLayer, 50, 70)
              );
              renderer.addFloatingText(player.x, player.y - 40, 'ТКАЧ РАЗЛОМОВ РАЗРЫВАЕТ РЕАЛЬНОСТЬ!', '#ec4899', true);
              sound?.playBossRoar();
              activeItem.count--;
              if (activeItem.count <= 0) player.inventory[player.selectedSlot] = null;
            }
          }
        }

        // 3. Enemy Spawner (Fair ramp)
        enemySpawnTimer += dt;
        if (enemySpawnTimer > 6.0 && enemiesRef.current.length < 12) {
          enemySpawnTimer = 0;
          const spawnDist = (Math.random() > 0.5 ? 1 : -1) * (250 + Math.random() * 150);
          const spawnX = player.x + spawnDist;
          const spawnY = player.y - 40;

          // Choose mob based on layer & day/night
          let typeKey = 'green_slime';
          if (world.activeLayer === LayerType.LIGHT) {
            typeKey = world.isDay() ? (Math.random() < 0.6 ? 'green_slime' : 'blue_slime') : 'skeleton_warrior';
          } else {
            typeKey = Math.random() < 0.5 ? 'shadow_creeper' : 'void_stalker';
          }

          if (ENEMY_TYPES[typeKey]) {
            enemiesRef.current.push(new Enemy(ENEMY_TYPES[typeKey], spawnX, spawnY));
          }
        }

        // 4. Update Enemies
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          const eRes = enemy.update(dt, world, player);
          if (eRes.attackedPlayer) {
            sound?.playPlayerHurt();
            renderer.addTrauma(0.3);
          }

          // Check Player Weapon Hitbox against Enemy
          if (player.isSwinging && enemy.active && enemy.layer === world.activeLayer) {
            const edist = Math.hypot(enemy.x - player.x, enemy.y - (player.y - player.height / 2));
            if (edist < 44) {
              const activeWeapon = player.inventory[player.selectedSlot];
              const wDmg = (activeWeapon && ITEMS[activeWeapon.itemId]?.damage) || 8;
              const kbX = (enemy.x > player.x ? 1 : -1) * 7;
              const dmgRes = enemy.takeDamage(wDmg, kbX);

              sound?.playHit();
              particles.spawnBurst(enemy.x, enemy.y - 10, 6, enemy.def.color);
              renderer.addFloatingText(enemy.x, enemy.y - 20, `${dmgRes.damageDealt}`, '#e2e8f0');

              if (dmgRes.killed) {
                gameEvents.emit('ENEMY_KILLED', { enemyId: enemy.def.id, isBoss: false, layer: enemy.layer });
                // Drop loot
                for (const drop of enemy.def.drops) {
                  if (Math.random() < drop.chance) {
                    droppedItemsRef.current.push(
                      new DroppedItem(drop.itemId, drop.min, enemy.x, enemy.y, enemy.layer)
                    );
                  }
                }
              }
            }
          }

          if (!enemy.active) {
            enemiesRef.current.splice(i, 1);
          }
        }

        // 5. Update Bosses
        for (let i = bossesRef.current.length - 1; i >= 0; i--) {
          const boss = bossesRef.current[i];
          const bRes = boss.update(dt, world, player);

          for (const sp of bRes.projectilesToSpawn) {
            projectilesRef.current.push(sp);
          }
          if (bRes.spawnRipples) {
            renderer.triggerPhaseShiftEffect(boss.x, boss.y);
          }

          // Player melee attack against Boss
          if (player.isSwinging && boss.active && (boss.layer === world.activeLayer || boss.id === 'phase_weaver')) {
            const bdist = Math.hypot(boss.x - player.x, boss.y - (player.y - player.height / 2));
            if (bdist < (boss.width + player.width) / 2 + 35) {
              const activeWeapon = player.inventory[player.selectedSlot];
              const wDmg = (activeWeapon && ITEMS[activeWeapon.itemId]?.damage) || 10;
              const hitRes = boss.takeDamage(wDmg);

              sound?.playHit();
              particles.spawnBurst(boss.x, boss.y, 8, '#f59e0b');
              renderer.addFloatingText(
                boss.x,
                boss.y - 30,
                hitRes.damageDealt > 0 ? `${hitRes.damageDealt}` : 'ЩИТ!',
                hitRes.damageDealt > 0 ? '#ef4444' : '#38bdf8',
                true
              );

              if (hitRes.killed) {
                gameEvents.emit('BOSS_KILLED', { bossId: boss.id, bossName: boss.name });
                renderer.addFloatingText(boss.x, boss.y - 50, `${boss.name} ПОВЕРЖЕН!`, '#eab308', true);
                // Epic drops
                droppedItemsRef.current.push(new DroppedItem('echo_shard', 15, boss.x, boss.y, boss.layer));
                droppedItemsRef.current.push(new DroppedItem('gold_bar', 10, boss.x, boss.y, boss.layer));
                bossesRef.current.splice(i, 1);
              }
            }
          }
        }

        // 6. Update Projectiles
        for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
          const proj = projectilesRef.current[i];
          const alive = proj.update(dt, world);

          if (!alive) {
            projectilesRef.current.splice(i, 1);
            continue;
          }

          // Hostile projectile hits player
          if (proj.isHostile && proj.layer === world.activeLayer) {
            const pDist = Math.hypot(player.x - proj.x, player.y - player.height / 2 - proj.y);
            if (pDist < 16) {
              player.takeDamage(proj.damage, proj.vx > 0 ? 4 : -4, -2.5);
              sound?.playPlayerHurt();
              projectilesRef.current.splice(i, 1);
              continue;
            }
          }

          // Friendly projectile hits enemies or bosses
          if (!proj.isHostile && proj.layer === world.activeLayer) {
            for (const enemy of enemiesRef.current) {
              if (enemy.active && Math.hypot(enemy.x - proj.x, enemy.y - enemy.def.height / 2 - proj.y) < 18) {
                enemy.takeDamage(proj.damage, proj.vx > 0 ? 5 : -5);
                sound?.playHit();
                projectilesRef.current.splice(i, 1);
                break;
              }
            }
          }
        }

        // 7. Update Dropped Items
        for (let i = droppedItemsRef.current.length - 1; i >= 0; i--) {
          const item = droppedItemsRef.current[i];
          const alive = item.update(dt, world, player);
          if (!alive) {
            droppedItemsRef.current.splice(i, 1);
          }
        }

        // 8. Update Particles
        particles.update(dt);

        // 9. Update Sound Music track
        sound?.updateMusicTrack(world.activeLayer, world.isDay(), bossesRef.current.length > 0);

        // 10. Check Player Death
        if (player.hp <= 0) {
          setGameState('gameover');
        }

        // 11. Render Frame
        renderer.render(
          world,
          player,
          enemiesRef.current,
          bossesRef.current,
          npcsRef.current,
          projectilesRef.current,
          droppedItemsRef.current,
          particles,
          { x: aimWorldX, y: aimWorldY },
          dt,
          debugMode
        );

        // Throttled HUD Sync
        setHudHp(player.hp);
        setHudMaxHp(player.maxHp);
        setHudEcho(player.echoEnergy);
        setHudMaxEcho(player.maxEchoEnergy);
        setHudSelectedSlot(player.selectedSlot);
        setHudActiveLayer(world.activeLayer);
        setHudCooldown(player.phaseShiftCooldown);

        // Autosave every 60s
        autosaveTimer += dt;
        if (autosaveTimer >= 60) {
          autosaveTimer = 0;
          handleAutoSave();
        }

        // Input end of frame cleanup
        inputs.endFrame();
      }

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, debugMode]);

  // Autosave
  const handleAutoSave = useCallback(() => {
    const player = playerRef.current;
    const selectedChar = characters.find((c) => c.id === selectedCharId);
    if (player && selectedChar) {
      selectedChar.inventory = [...player.inventory];
      selectedChar.equipment = { ...player.equipment };
      selectedChar.hp = player.hp;
      selectedChar.echoEnergy = player.echoEnergy;
      SaveManager.saveCharacter(selectedChar);
    }
    if (selectedWorldId) {
      SaveManager.saveWorldDelta(selectedWorldId, modifiedDeltasRef.current);
    }
  }, [characters, selectedCharId, selectedWorldId]);

  // Respawn after Death
  const handleRespawn = () => {
    const player = playerRef.current;
    if (player) {
      player.hp = player.maxHp;
      player.echoEnergy = player.maxEchoEnergy;
      player.vx = 0;
      player.vy = 0;
    }
    setGameState('playing');
  };

  // Export Save File
  const handleExportSave = () => {
    const char = characters.find((c) => c.id === selectedCharId);
    const worldMeta = worlds.find((w) => w.id === selectedWorldId);
    if (char) {
      SaveManager.exportSaveFile(char, worldMeta, modifiedDeltasRef.current);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans">
      
      {/* Isolated Canvas Render Viewport */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Title Screen View */}
      {gameState === 'title' && (
        <TitleScreen
          characters={characters}
          worlds={worlds}
          selectedCharId={selectedCharId}
          selectedWorldId={selectedWorldId}
          onSelectChar={setSelectedCharId}
          onSelectWorld={setSelectedWorldId}
          onOpenCreateChar={() => setShowCharCreator(true)}
          onOpenCreateWorld={() => setShowWorldCreator(true)}
          onDeleteChar={(id) => {
            SaveManager.deleteCharacter(id);
            setCharacters(SaveManager.getCharacters());
          }}
          onDeleteWorld={(id) => {
            SaveManager.deleteWorld(id);
            setWorlds(SaveManager.getWorlds());
          }}
          onStartGame={handleStartGame}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenQuests={() => setShowQuests(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Global In-Game Notifications Toast Container */}
      <GameToastContainer />

      {/* In-Game Playing HUD */}
      {gameState === 'playing' && playerRef.current && (
        <>
          <Hotbar
            slots={playerRef.current.inventory}
            selectedSlot={hudSelectedSlot}
            onSelectSlot={(idx) => {
              if (playerRef.current) playerRef.current.selectedSlot = idx;
            }}
            hp={hudHp}
            maxHp={hudMaxHp}
            echo={hudEcho}
            maxEcho={hudMaxEcho}
            activeLayer={hudActiveLayer}
            shiftCooldown={hudCooldown}
            onPhaseShift={() => {
              if (inputManagerRef.current) inputManagerRef.current.touchPhaseShift = true;
            }}
            onToggleInventory={() => setShowInventory((prev) => !prev)}
            onToggleMap={() => setShowMap((prev) => !prev)}
            onTogglePause={() => setGameState('paused')}
            onToggleAchievements={() => setShowAchievements(true)}
            onToggleQuests={() => setShowQuests(true)}
            muted={muted}
            onToggleMute={() => {
              const nextMuted = !muted;
              setMuted(nextMuted);
              soundEngineRef.current?.setMuted(nextMuted);
            }}
          />

          {/* Real-time Quest Tracker HUD */}
          <QuestTrackerHUD onOpenJournal={() => setShowQuests(true)} />

          {/* Mobile Touch Controls */}
          {inputManagerRef.current && (
            <MobileControls
              inputManager={inputManagerRef.current}
              onToggleInventory={() => setShowInventory((prev) => !prev)}
            />
          )}
        </>
      )}

      {/* Character Creator Modal */}
      {showCharCreator && (
        <CharacterCreator
          onCreated={(newChar) => {
            SaveManager.saveCharacter(newChar);
            const updated = SaveManager.getCharacters();
            setCharacters(updated);
            setSelectedCharId(newChar.id);
            setShowCharCreator(false);
          }}
          onCancel={() => setShowCharCreator(false)}
        />
      )}

      {/* World Creator Modal */}
      {showWorldCreator && (
        <WorldCreator
          onStartGeneration={handleStartWorldGeneration}
          onCancel={() => setShowWorldCreator(false)}
          generating={worldGenerating}
          progressStage={worldGenStage}
          progressPercent={worldGenPercent}
        />
      )}

      {/* Inventory & Crafting Modal */}
      {showInventory && playerRef.current && (
        <InventoryModal
          inventory={playerRef.current.inventory}
          equipment={playerRef.current.equipment}
          chestSlots={openChestSlots}
          nearStation={TileType.WORKBENCH}
          onClose={() => {
            setShowInventory(false);
            setOpenChestSlots(null);
          }}
          onUpdateInventory={(inv) => {
            if (playerRef.current) playerRef.current.inventory = inv;
          }}
          onUpdateEquipment={(eq) => {
            if (playerRef.current) playerRef.current.equipment = eq;
          }}
          onUpdateChest={(slots) => setOpenChestSlots(slots)}
        />
      )}

      {/* Town NPC Modal */}
      {activeNpc && playerRef.current && (
        <NPCModal
          npc={activeNpc}
          inventory={playerRef.current.inventory}
          onClose={() => setActiveNpc(null)}
          onUpdateInventory={(inv) => {
            if (playerRef.current) playerRef.current.inventory = inv;
          }}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onSaveExport={handleExportSave}
          onExitTitle={() => {
            handleAutoSave();
            setGameState('title');
          }}
          sfxVolume={sfxVol}
          musicVolume={musicVol}
          onSfxVolumeChange={(v) => {
            setSfxVol(v);
            if (soundEngineRef.current) soundEngineRef.current.sfxVolume = v;
          }}
          onMusicVolumeChange={(v) => {
            setMusicVol(v);
            if (soundEngineRef.current) soundEngineRef.current.musicVolume = v;
          }}
          zoom={zoomLevel}
          onZoomChange={(z) => {
            setZoomLevel(z);
            if (rendererRef.current) {
              rendererRef.current.zoom = z;
              rendererRef.current.resize();
            }
          }}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          charName={playerRef.current?.name || 'Герой'}
          playTime={360}
          onRespawn={handleRespawn}
          onExitTitle={() => setGameState('title')}
        />
      )}

      {/* Terraria-Styled Achievements Modal */}
      {showAchievements && (
        <AchievementsModal
          onClose={() => setShowAchievements(false)}
        />
      )}

      {/* Terraria-Styled Quest Journal Modal */}
      {showQuests && (
        <QuestJournalModal
          playerInventory={playerRef.current?.inventory || []}
          onClose={() => setShowQuests(false)}
          onUpdateInventory={(inv) => {
            if (playerRef.current) playerRef.current.inventory = inv;
          }}
        />
      )}

      {/* Terraria-Styled Settings Menu Modal (Image 1 replica) */}
      {showSettings && (
        <SettingsModal
          sfxVolume={sfxVol}
          musicVolume={musicVol}
          onSfxVolumeChange={(v) => {
            setSfxVol(v);
            if (soundEngineRef.current) soundEngineRef.current.sfxVolume = v;
          }}
          onMusicVolumeChange={(v) => {
            setMusicVol(v);
            if (soundEngineRef.current) soundEngineRef.current.musicVolume = v;
          }}
          zoom={zoomLevel}
          onZoomChange={(z) => {
            setZoomLevel(z);
            if (rendererRef.current) {
              rendererRef.current.zoom = z;
              rendererRef.current.resize();
            }
          }}
          onOpenAchievements={() => {
            setShowSettings(false);
            setShowAchievements(true);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

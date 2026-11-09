/**
 * Hollowfall - Centralized Achievement System
 * Система достижений, привязанная к реальным игровым событиям
 */

import { gameEvents } from './events.ts';

export type AchievementCategory = 'exploration' | 'combat' | 'crafting' | 'phase' | 'progression' | 'secrets';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  current: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
  reward?: string;
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // 1. Exploration
  {
    id: 'first_step',
    title: 'Первый шаг',
    description: 'Ты впервые ступил на неизведанные земли Hollowfall.',
    category: 'exploration',
    current: 0,
    target: 1,
    unlocked: false,
    icon: 'compass',
    reward: '20 Опыта',
  },
  {
    id: 'deep_delver',
    title: 'Следопыт глубин',
    description: 'Спустись в тёмные пещеры ниже уровня поверхности.',
    category: 'exploration',
    current: 0,
    target: 50,
    unlocked: false,
    icon: 'pickaxe',
    reward: 'Титул: Спелеолог',
  },
  {
    id: 'ancient_secrets',
    title: 'Тайны древних',
    description: 'Отыщи заброшенную подземную хижину с сокровищами.',
    category: 'secrets',
    current: 0,
    target: 1,
    unlocked: false,
    icon: 'key',
    reward: 'Особый амулет',
  },

  // 2. Combat
  {
    id: 'first_blood',
    title: 'Первая кровь',
    description: 'Твоё путешествие начинается с первого поверженного врага.',
    category: 'combat',
    current: 0,
    target: 1,
    unlocked: false,
    icon: 'sword',
  },
  {
    id: 'shadow_hunter',
    title: 'Охотник на тени',
    description: 'Даже самые опасные существа не смогли тебя остановить. Уничтожь 30 противников.',
    category: 'combat',
    current: 0,
    target: 30,
    unlocked: false,
    icon: 'skull',
    reward: 'Золотой слиток x5',
  },
  {
    id: 'boss_slayer',
    title: 'Истребитель титанов',
    description: 'Сокруши древнего босса в честном поединке.',
    category: 'combat',
    current: 0,
    target: 1,
    unlocked: false,
    icon: 'crown',
    reward: 'Эмблема Доблести',
  },

  // 3. Crafting
  {
    id: 'artisan',
    title: 'Ремесленник',
    description: 'Из простых материалов рождаются великие вещи. Создай 10 предметов.',
    category: 'crafting',
    current: 0,
    target: 10,
    unlocked: false,
    icon: 'hammer',
  },
  {
    id: 'master_smith',
    title: 'Кузнец Hollowfall',
    description: 'Настоящее мастерство требует терпения. Выкуй 5 предметов на наковальне или фазовом алтаре.',
    category: 'crafting',
    current: 0,
    target: 5,
    unlocked: false,
    icon: 'anvil',
    reward: 'Железный слиток x10',
  },
  {
    id: 'collector',
    title: 'Коллекционер',
    description: 'Каждая находка имеет свою историю. Собери 25 различных предметов.',
    category: 'progression',
    current: 0,
    target: 25,
    unlocked: false,
    icon: 'box',
  },

  // 4. Phase Shift
  {
    id: 'between_worlds',
    title: 'Между мирами',
    description: 'Реальность — лишь одна из форм существования. Соверши фазовый сдвиг 15 раз.',
    category: 'phase',
    current: 0,
    target: 15,
    unlocked: false,
    icon: 'sparkles',
    reward: 'Эликсир Эха x3',
  },
  {
    id: 'beyond_horizon',
    title: 'За гранью',
    description: 'Добудь редкие Осколки Эха в глубинах Теневого слоя.',
    category: 'phase',
    current: 0,
    target: 10,
    unlocked: false,
    icon: 'gem',
  },
  {
    id: 'abyss_conqueror',
    title: 'Повелитель Бездны',
    description: 'Одолей Ткача Разломов, разрушив его теневой барьер.',
    category: 'phase',
    current: 0,
    target: 1,
    unlocked: false,
    icon: 'eye',
    reward: 'Теневая сталь x15',
  },

  // 5. Progression & Building
  {
    id: 'home_sweet_home',
    title: 'Уютный кров',
    description: 'Построй надёжный дом со стенами, дверью и освещением для жителя.',
    category: 'progression',
    current: 0,
    target: 1,
    unlocked: false,
    icon: 'home',
  },
  {
    id: 'survivor',
    title: 'Выживший',
    description: 'Этот мир полон опасностей. Выживи в мире Hollowfall не менее 10 минут.',
    category: 'progression',
    current: 0,
    target: 600, // seconds
    unlocked: false,
    icon: 'shield',
  },
];

const STORAGE_ACHIEVEMENTS_KEY = 'hollowfall_achievements_v2';

export class AchievementManager {
  private achievements: Map<string, Achievement> = new Map();
  private collectedItemIds: Set<string> = new Set();
  private unsubs: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    // 1. Initialize base list
    for (const a of INITIAL_ACHIEVEMENTS) {
      this.achievements.set(a.id, { ...a });
    }

    // 2. Load saved progress from storage
    this.loadFromStorage();

    // 3. Bind event listeners
    this.bindEvents();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_ACHIEVEMENTS_KEY);
      if (saved) {
        const parsed: Record<string, Partial<Achievement>> = JSON.parse(saved);
        for (const [id, data] of Object.entries(parsed)) {
          const ach = this.achievements.get(id);
          if (ach) {
            ach.current = data.current ?? ach.current;
            ach.unlocked = data.unlocked ?? ach.unlocked;
            ach.unlockedAt = data.unlockedAt;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load achievements from storage:', e);
    }
  }

  public saveToStorage(): void {
    try {
      const serializable: Record<string, { current: number; unlocked: boolean; unlockedAt?: number }> = {};
      for (const [id, a] of this.achievements.entries()) {
        serializable[id] = {
          current: a.current,
          unlocked: a.unlocked,
          unlockedAt: a.unlockedAt,
        };
      }
      localStorage.setItem(STORAGE_ACHIEVEMENTS_KEY, JSON.stringify(serializable));
    } catch (e) {
      console.warn('Failed to save achievements to storage:', e);
    }
  }

  private bindEvents(): void {
    // Player entered world
    this.unsubs.push(
      gameEvents.on('PLAYER_MOVED', (data) => {
        this.progress('first_step', 1);
        if (data.depth > 30) {
          this.progress('deep_delver', Math.floor(data.depth));
        }
      })
    );

    // Enemy killed
    this.unsubs.push(
      gameEvents.on('ENEMY_KILLED', () => {
        this.progress('first_blood', 1);
        this.progress('shadow_hunter', 1, true);
      })
    );

    // Boss killed
    this.unsubs.push(
      gameEvents.on('BOSS_KILLED', (data) => {
        this.progress('boss_slayer', 1);
        if (data.bossId === 'phase_weaver') {
          this.progress('abyss_conqueror', 1);
        }
      })
    );

    // Items crafted
    this.unsubs.push(
      gameEvents.on('ITEM_CRAFTED', (data) => {
        this.progress('artisan', data.count, true);
        if (data.station === 'ANVIL' || data.station === 'PHASE_ALTAR') {
          this.progress('master_smith', data.count, true);
        }
      })
    );

    // Items collected
    this.unsubs.push(
      gameEvents.on('ITEM_COLLECTED', (data) => {
        this.collectedItemIds.add(data.itemId);
        this.progress('collector', this.collectedItemIds.size);
        if (data.itemId === 'echo_shard') {
          this.progress('beyond_horizon', data.count, true);
        }
      })
    );

    // Phase Shift
    this.unsubs.push(
      gameEvents.on('PHASE_SHIFTED', () => {
        this.progress('between_worlds', 1, true);
      })
    );

    // Chest opened
    this.unsubs.push(
      gameEvents.on('CHEST_OPENED', () => {
        this.progress('ancient_secrets', 1);
      })
    );

    // Room validated
    this.unsubs.push(
      gameEvents.on('ROOM_VALIDATED', () => {
        this.progress('home_sweet_home', 1);
      })
    );

    // Time survived
    this.unsubs.push(
      gameEvents.on('TIME_SURVIVED', (data) => {
        this.progress('survivor', Math.floor(data.seconds));
      })
    );
  }

  public progress(id: string, amount: number, isIncremental: boolean = false): void {
    const ach = this.achievements.get(id);
    if (!ach || ach.unlocked) return;

    if (isIncremental) {
      ach.current = Math.min(ach.target, ach.current + amount);
    } else {
      ach.current = Math.min(ach.target, Math.max(ach.current, amount));
    }

    if (ach.current >= ach.target) {
      ach.unlocked = true;
      ach.unlockedAt = Date.now();
      this.saveToStorage();

      // Emit global unlock event for HUD toasts and sound
      gameEvents.emit('ACHIEVEMENT_UNLOCKED', {
        achievementId: ach.id,
        title: ach.title,
        icon: ach.icon,
      });
    } else {
      this.saveToStorage();
    }
  }

  public getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  public getAchievementsByCategory(cat: AchievementCategory): Achievement[] {
    return this.getAchievements().filter((a) => a.category === cat);
  }

  public getCompletionPercentage(): number {
    const list = this.getAchievements();
    if (list.length === 0) return 0;
    const unlocked = list.filter((a) => a.unlocked).length;
    return Math.round((unlocked / list.length) * 100);
  }

  public destroy(): void {
    for (const un of this.unsubs) un();
    this.unsubs = [];
  }
}

export const achievementManager = new AchievementManager();

/**
 * Hollowfall - Procedural Quest Generator & Quest Manager
 * Процедурные задания от жителей (Торговец, Кузнец, Странник) с реальными игровыми наградами
 */

import { gameEvents } from './events.ts';
import { ITEMS } from './items.ts';
import { addItemToInventory } from './rules.ts';
import { InventorySlot } from './types.ts';

export type QuestType = 'GATHER' | 'KILL' | 'EXPLORE' | 'CRAFT' | 'PHASE_SHIFT';
export type QuestDifficulty = 'COMMON' | 'RARE' | 'EPIC';
export type QuestStatus = 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'CLAIMED';

export interface QuestReward {
  itemId: string;
  count: number;
  label: string;
}

export interface Quest {
  id: string;
  npcId: 'merchant' | 'blacksmith' | 'guide';
  npcName: string;
  npcRole: string;
  type: QuestType;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  targetId: string; // itemId or enemyId
  current: number;
  required: number;
  rewards: QuestReward[];
  tracked: boolean;
  createdAt: number;
}

const STORAGE_QUESTS_KEY = 'hollowfall_quests_v2';

export class QuestManager {
  private quests: Map<string, Quest> = new Map();
  private unsubs: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    this.loadFromStorage();
    if (this.quests.size === 0) {
      this.generateInitialQuests();
    }
    this.bindEvents();
  }

  private generateInitialQuests(): void {
    // Guaranteed balanced starter quests
    const starterQuests: Quest[] = [
      {
        id: 'quest_wood_gather',
        npcId: 'merchant',
        npcName: 'Брун',
        npcRole: 'Торговец',
        type: 'GATHER',
        title: 'Заготовка древесины',
        description: 'Принеси 25 древесины для укрепления стен нашего лагеря.',
        difficulty: 'COMMON',
        status: 'AVAILABLE',
        targetId: 'wood',
        current: 0,
        required: 25,
        rewards: [
          { itemId: 'torch', count: 15, label: 'Факел x15' },
          { itemId: 'copper_bar', count: 3, label: 'Медный слиток x3' },
        ],
        tracked: true,
        createdAt: Date.now(),
      },
      {
        id: 'quest_slime_hunt',
        npcId: 'guide',
        npcName: 'Советник Элиан',
        npcRole: 'Странник',
        type: 'KILL',
        title: 'Угроза на опушке',
        description: 'Слизни заполонили окрестности. Уничтожь 5 слизней, чтобы обезопасить путь.',
        difficulty: 'COMMON',
        status: 'AVAILABLE',
        targetId: 'slime',
        current: 0,
        required: 5,
        rewards: [
          { itemId: 'lesser_healing_potion', count: 4, label: 'Зелье здоровья x4' },
          { itemId: 'wooden_arrow', count: 30, label: 'Стрелы x30' },
        ],
        tracked: true,
        createdAt: Date.now(),
      },
      {
        id: 'quest_iron_smelt',
        npcId: 'blacksmith',
        npcName: 'Торин',
        npcRole: 'Кузнец',
        type: 'CRAFT',
        title: 'Первая плавка железа',
        description: 'Отыщи в кавернах железную руду и выплавь 4 железных слитка в печи.',
        difficulty: 'RARE',
        status: 'AVAILABLE',
        targetId: 'iron_bar',
        current: 0,
        required: 4,
        rewards: [
          { itemId: 'iron_pickaxe', count: 1, label: 'Железная кирка' },
          { itemId: 'gold_bar', count: 2, label: 'Золотой слиток x2' },
        ],
        tracked: false,
        createdAt: Date.now(),
      },
      {
        id: 'quest_phase_study',
        npcId: 'guide',
        npcName: 'Советник Элиан',
        npcRole: 'Странник',
        type: 'PHASE_SHIFT',
        title: 'Прокол пространства',
        description: 'Используй Фазовый сдвиг [Q] 5 раз, чтобы настроить резонанс Эха.',
        difficulty: 'COMMON',
        status: 'AVAILABLE',
        targetId: 'phase_shift',
        current: 0,
        required: 5,
        rewards: [
          { itemId: 'echo_elixir', count: 2, label: 'Эликсир Эха x2' },
        ],
        tracked: false,
        createdAt: Date.now(),
      },
      {
        id: 'quest_echo_shard',
        npcId: 'blacksmith',
        npcName: 'Торин',
        npcRole: 'Кузнец',
        type: 'GATHER',
        title: 'Осколки иного мира',
        description: 'Соверши сдвиг в Теневой слой и добудь 8 Осколков Эха для ковки Теневой стали.',
        difficulty: 'EPIC',
        status: 'AVAILABLE',
        targetId: 'echo_shard',
        current: 0,
        required: 8,
        rewards: [
          { itemId: 'shadow_ring', count: 1, label: 'Кольцо Фазового Эха' },
          { itemId: 'gold_bar', count: 5, label: 'Золотой слиток x5' },
        ],
        tracked: false,
        createdAt: Date.now(),
      },
    ];

    for (const q of starterQuests) {
      this.quests.set(q.id, q);
    }
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_QUESTS_KEY);
      if (data) {
        const parsed: Quest[] = JSON.parse(data);
        for (const q of parsed) {
          this.quests.set(q.id, q);
        }
      }
    } catch (e) {
      console.warn('Failed to load quests from storage:', e);
    }
  }

  public saveToStorage(): void {
    try {
      const array = Array.from(this.quests.values());
      localStorage.setItem(STORAGE_QUESTS_KEY, JSON.stringify(array));
    } catch (e) {
      console.warn('Failed to save quests to storage:', e);
    }
  }

  private bindEvents(): void {
    // 1. Gather (Block mined or Item collected)
    this.unsubs.push(
      gameEvents.on('ITEM_COLLECTED', (data) => {
        this.progressQuests('GATHER', data.itemId, data.count);
      })
    );

    // 2. Kill enemies
    this.unsubs.push(
      gameEvents.on('ENEMY_KILLED', (data) => {
        this.progressQuests('KILL', data.enemyId, 1);
        if (data.enemyId.includes('slime')) {
          this.progressQuests('KILL', 'slime', 1);
        }
      })
    );

    // 3. Craft items
    this.unsubs.push(
      gameEvents.on('ITEM_CRAFTED', (data) => {
        this.progressQuests('CRAFT', data.itemId, data.count);
      })
    );

    // 4. Phase Shift
    this.unsubs.push(
      gameEvents.on('PHASE_SHIFTED', () => {
        this.progressQuests('PHASE_SHIFT', 'phase_shift', 1);
      })
    );
  }

  public progressQuests(type: QuestType, targetId: string, amount: number): void {
    let changed = false;

    for (const quest of this.quests.values()) {
      if (quest.status === 'ACTIVE' && quest.type === type && (quest.targetId === targetId || quest.targetId === 'any')) {
        quest.current = Math.min(quest.required, quest.current + amount);
        changed = true;

        gameEvents.emit('QUEST_PROGRESS', {
          questId: quest.id,
          current: quest.current,
          target: quest.required,
        });

        if (quest.current >= quest.required) {
          quest.status = 'COMPLETED';
          gameEvents.emit('QUEST_COMPLETED', {
            questId: quest.id,
            questTitle: quest.title,
          });
        }
      }
    }

    if (changed) {
      this.saveToStorage();
    }
  }

  public acceptQuest(id: string): void {
    const q = this.quests.get(id);
    if (q && q.status === 'AVAILABLE') {
      q.status = 'ACTIVE';
      q.tracked = true;
      this.saveToStorage();
    }
  }

  public toggleTracking(id: string): void {
    const q = this.quests.get(id);
    if (q) {
      q.tracked = !q.tracked;
      this.saveToStorage();
    }
  }

  public claimReward(id: string, playerInventory: (InventorySlot | null)[]): boolean {
    const q = this.quests.get(id);
    if (!q || q.status !== 'COMPLETED') return false;

    // Distribute real items into inventory
    for (const reward of q.rewards) {
      addItemToInventory(playerInventory, reward.itemId, reward.count, ITEMS[reward.itemId]?.maxStack || 999);
    }

    q.status = 'CLAIMED';
    this.saveToStorage();

    // Check if we should generate a follow-up quest
    this.generateProceduralFollowUp(q.npcId);
    return true;
  }

  private generateProceduralFollowUp(npcId: 'merchant' | 'blacksmith' | 'guide'): void {
    const time = Date.now();
    const id = `quest_${npcId}_${time}`;

    let newQuest: Quest;
    if (npcId === 'merchant') {
      newQuest = {
        id,
        npcId,
        npcName: 'Брун',
        npcRole: 'Торговец',
        type: 'GATHER',
        title: 'Поставка камня и руды',
        description: 'Лавке нужны 30 камней для укрепления фундамента складов.',
        difficulty: 'COMMON',
        status: 'AVAILABLE',
        targetId: 'stone',
        current: 0,
        required: 30,
        rewards: [
          { itemId: 'torch', count: 20, label: 'Факелы x20' },
          { itemId: 'iron_bar', count: 3, label: 'Железный слиток x3' },
        ],
        tracked: false,
        createdAt: time,
      };
    } else if (npcId === 'blacksmith') {
      newQuest = {
        id,
        npcId,
        npcName: 'Торин',
        npcRole: 'Кузнец',
        type: 'CRAFT',
        title: 'Заказ на железный клинок',
        description: 'Выкуй прочный железный меч для вооружения дозора.',
        difficulty: 'RARE',
        status: 'AVAILABLE',
        targetId: 'iron_broadsword',
        current: 0,
        required: 1,
        rewards: [
          { itemId: 'gold_bar', count: 4, label: 'Золотой слиток x4' },
          { itemId: 'silk', count: 6, label: 'Шёлк x6' },
        ],
        tracked: false,
        createdAt: time,
      };
    } else {
      newQuest = {
        id,
        npcId,
        npcName: 'Советник Элиан',
        npcRole: 'Странник',
        type: 'KILL',
        title: 'Ночной патруль',
        description: 'Уничтожь 3 скелетов-стражей, рыщущих в подземельях.',
        difficulty: 'RARE',
        status: 'AVAILABLE',
        targetId: 'skeleton_warrior',
        current: 0,
        required: 3,
        rewards: [
          { itemId: 'greater_healing_potion', count: 2, label: 'Большое зелье x2' },
          { itemId: 'gold_bar', count: 3, label: 'Золотой слиток x3' },
        ],
        tracked: false,
        createdAt: time,
      };
    }

    this.quests.set(newQuest.id, newQuest);
    this.saveToStorage();
  }

  public getQuests(): Quest[] {
    return Array.from(this.quests.values());
  }

  public getTrackedQuests(): Quest[] {
    return this.getQuests().filter((q) => q.status === 'ACTIVE' && q.tracked);
  }

  public destroy(): void {
    for (const un of this.unsubs) un();
    this.unsubs = [];
  }
}

export const questManager = new QuestManager();

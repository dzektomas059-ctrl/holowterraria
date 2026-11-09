/**
 * Hollowfall - Central Game Event Bus
 * Шина игровых событий для связи мира, достижений, квестов и интерфейса
 */

export type GameEventType =
  | 'PLAYER_MOVED'
  | 'BLOCK_MINED'
  | 'BLOCK_PLACED'
  | 'ITEM_CRAFTED'
  | 'ITEM_COLLECTED'
  | 'ENEMY_KILLED'
  | 'BOSS_KILLED'
  | 'PHASE_SHIFTED'
  | 'LOCATION_DISCOVERED'
  | 'TIME_SURVIVED'
  | 'ROOM_VALIDATED'
  | 'CHEST_OPENED'
  | 'QUEST_PROGRESS'
  | 'QUEST_COMPLETED'
  | 'ACHIEVEMENT_UNLOCKED';

export interface GameEventData {
  PLAYER_MOVED: { x: number; y: number; depth: number; biome: string };
  BLOCK_MINED: { tile: number; x: number; y: number };
  BLOCK_PLACED: { tile: number; x: number; y: number };
  ITEM_CRAFTED: { itemId: string; count: number; station: string };
  ITEM_COLLECTED: { itemId: string; count: number };
  ENEMY_KILLED: { enemyId: string; isBoss: boolean; layer: number };
  BOSS_KILLED: { bossId: string; bossName: string };
  PHASE_SHIFTED: { fromLayer: number; toLayer: number };
  LOCATION_DISCOVERED: { locationId: string; name: string };
  TIME_SURVIVED: { seconds: number };
  ROOM_VALIDATED: { npcId: string };
  CHEST_OPENED: { x: number; y: number };
  QUEST_PROGRESS: { questId: string; current: number; target: number };
  QUEST_COMPLETED: { questId: string; questTitle: string };
  ACHIEVEMENT_UNLOCKED: { achievementId: string; title: string; icon: string };
}

type EventListener<K extends GameEventType> = (data: GameEventData[K]) => void;

class EventBus {
  private listeners: Map<GameEventType, Set<Function>> = new Map();

  public on<K extends GameEventType>(event: K, listener: EventListener<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  public emit<K extends GameEventType>(event: K, data: GameEventData[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(data);
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const gameEvents = new EventBus();

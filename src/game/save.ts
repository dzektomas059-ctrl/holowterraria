/**
 * Hollowfall - Save & Storage Manager
 * Сохранение персонажей и дельт миров в LocalStorage / IndexedDB с экспортом/импортом JSON
 */

import { CharacterData, InventorySlot, LayerType, TileType, WallType, WorldMeta } from './types.ts';
import { World } from './world.ts';

const STORAGE_CHARS_KEY = 'hollowfall_characters_v1';
const STORAGE_WORLDS_KEY = 'hollowfall_worlds_v1';
const STORAGE_DELTAS_PREFIX = 'hollowfall_delta_';

export interface TileDelta {
  layer: LayerType;
  x: number;
  y: number;
  tile?: TileType;
  wall?: WallType;
}

export class SaveManager {
  // Characters
  public static getCharacters(): CharacterData[] {
    try {
      const data = localStorage.getItem(STORAGE_CHARS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveCharacter(char: CharacterData): void {
    const list = this.getCharacters();
    const idx = list.findIndex(c => c.id === char.id);
    if (idx !== -1) {
      list[idx] = char;
    } else {
      list.push(char);
    }
    localStorage.setItem(STORAGE_CHARS_KEY, JSON.stringify(list));
  }

  public static deleteCharacter(id: string): void {
    const list = this.getCharacters().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_CHARS_KEY, JSON.stringify(list));
  }

  // Worlds
  public static getWorlds(): WorldMeta[] {
    try {
      const data = localStorage.getItem(STORAGE_WORLDS_KEY);
      const list: WorldMeta[] = data ? JSON.parse(data) : [];
      if (list.length === 0) {
        const defaultWorld: WorldMeta = {
          id: 'world_default',
          name: 'Астральный Предел',
          seed: 133742,
          width: 600,
          height: 320,
          createdAt: Date.now(),
          lastPlayed: Date.now(),
          defeatedBosses: [],
        };
        list.push(defaultWorld);
        this.saveWorldMeta(defaultWorld);
      }
      return list;
    } catch {
      return [{
        id: 'world_default',
        name: 'Астральный Предел',
        seed: 133742,
        width: 600,
        height: 320,
        createdAt: Date.now(),
        lastPlayed: Date.now(),
        defeatedBosses: [],
      }];
    }
  }

  public static saveWorldMeta(meta: WorldMeta): void {
    const list = this.getWorlds();
    const idx = list.findIndex(w => w.id === meta.id);
    if (idx !== -1) {
      list[idx] = meta;
    } else {
      list.push(meta);
    }
    localStorage.setItem(STORAGE_WORLDS_KEY, JSON.stringify(list));
  }

  public static deleteWorld(id: string): void {
    const list = this.getWorlds().filter(w => w.id !== id);
    localStorage.setItem(STORAGE_WORLDS_KEY, JSON.stringify(list));
    localStorage.removeItem(`${STORAGE_DELTAS_PREFIX}${id}`);
  }

  // World Deltas
  public static saveWorldDelta(worldId: string, deltas: TileDelta[]): void {
    try {
      localStorage.setItem(`${STORAGE_DELTAS_PREFIX}${worldId}`, JSON.stringify(deltas));
    } catch (e) {
      console.warn('Storage quota limit reached for deltas', e);
    }
  }

  public static loadWorldDelta(worldId: string): TileDelta[] {
    try {
      const data = localStorage.getItem(`${STORAGE_DELTAS_PREFIX}${worldId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // Export / Import
  public static exportSaveFile(char: CharacterData, worldMeta?: WorldMeta, deltas?: TileDelta[]): void {
    const bundle = {
      version: 1,
      timestamp: Date.now(),
      character: char,
      worldMeta,
      deltas,
    };
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hollowfall_save_${char.name.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public static async importSaveFile(file: File): Promise<{
    character?: CharacterData;
    worldMeta?: WorldMeta;
    deltas?: TileDelta[];
  }> {
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.character) {
      this.saveCharacter(data.character);
    }
    if (data.worldMeta) {
      this.saveWorldMeta(data.worldMeta);
    }
    if (data.worldMeta && data.deltas) {
      this.saveWorldDelta(data.worldMeta.id, data.deltas);
    }
    return data;
  }
}

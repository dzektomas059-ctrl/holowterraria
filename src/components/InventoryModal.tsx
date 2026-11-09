/**
 * Hollowfall - Inventory, Crafting, Equipment & Chest Storage Window
 * 50 слотов инвентаря, экипировка брони и аксессуаров, сундуки и система крафта по станциям
 */

import React, { useState } from 'react';
import { canCraft, consumeMaterials, RECIPES } from '../game/crafting.ts';
import { gameEvents } from '../game/events.ts';
import { ITEMS } from '../game/items.ts';
import { addItemToInventory } from '../game/rules.ts';
import { CraftingRecipe, InventorySlot, ItemCategory, ItemDef, ItemRarity, TileType } from '../game/types.ts';
import { X, Search, Shield, Zap, Sparkles, Hammer, Box, ArrowRight, ArrowLeft } from 'lucide-react';
import { ItemIcon } from './ItemIcon.tsx';

interface InventoryModalProps {
  inventory: (InventorySlot | null)[];
  equipment: {
    helmet: InventorySlot | null;
    chest: InventorySlot | null;
    legs: InventorySlot | null;
    accessory1: InventorySlot | null;
    accessory2: InventorySlot | null;
    accessory3: InventorySlot | null;
  };
  chestSlots: (InventorySlot | null)[] | null;
  nearStation: TileType | null;
  onClose: () => void;
  onUpdateInventory: (inv: (InventorySlot | null)[]) => void;
  onUpdateEquipment: (eq: InventoryModalProps['equipment']) => void;
  onUpdateChest?: (slots: (InventorySlot | null)[]) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  equipment,
  chestSlots,
  nearStation,
  onClose,
  onUpdateInventory,
  onUpdateEquipment,
  onUpdateChest,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [stationFilter, setStationFilter] = useState<'all' | 'hand' | TileType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<ItemDef | null>(null);

  // Filter recipes
  const filteredRecipes = RECIPES.filter((r) => {
    if (stationFilter !== 'all' && r.station !== stationFilter) return false;
    if (searchQuery.trim()) {
      const resName = ITEMS[r.result.itemId]?.name.toLowerCase() || '';
      if (!resName.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  // Handle slot click (move / swap)
  const handleSlotClick = (index: number, e: React.MouseEvent) => {
    if (e.shiftKey && chestSlots && onUpdateChest) {
      // Quick move between inventory and chest
      const item = inventory[index];
      if (!item) return;

      const newChest = [...chestSlots];
      const newInv = [...inventory];
      const rem = addItemToInventory(newChest, item.itemId, item.count, ITEMS[item.itemId]?.maxStack || 999);
      if (rem === 0) {
        newInv[index] = null;
      } else {
        item.count = rem;
      }
      onUpdateInventory(newInv);
      onUpdateChest(newChest);
    }
  };

  const handleChestSlotClick = (index: number, e: React.MouseEvent) => {
    if (e.shiftKey && chestSlots && onUpdateChest) {
      const item = chestSlots[index];
      if (!item) return;

      const newInv = [...inventory];
      const newChest = [...chestSlots];
      const rem = addItemToInventory(newInv, item.itemId, item.count, ITEMS[item.itemId]?.maxStack || 999);
      if (rem === 0) {
        newChest[index] = null;
      } else {
        item.count = rem;
      }
      onUpdateInventory(newInv);
      onUpdateChest(newChest);
    }
  };

  // Chest take all / store all
  const handleTakeAllFromChest = () => {
    if (!chestSlots || !onUpdateChest) return;
    const newInv = [...inventory];
    const newChest = [...chestSlots];

    for (let i = 0; i < newChest.length; i++) {
      const item = newChest[i];
      if (item) {
        const rem = addItemToInventory(newInv, item.itemId, item.count, ITEMS[item.itemId]?.maxStack || 999);
        if (rem === 0) {
          newChest[i] = null;
        } else {
          item.count = rem;
        }
      }
    }
    onUpdateInventory(newInv);
    onUpdateChest(newChest);
  };

  // Crafting execution
  const handleCraft = (recipe: CraftingRecipe) => {
    if (!canCraft(recipe, inventory)) return;

    const newInv = [...inventory];
    consumeMaterials(recipe, newInv);
    addItemToInventory(newInv, recipe.result.itemId, recipe.result.count, ITEMS[recipe.result.itemId]?.maxStack || 999);
    onUpdateInventory(newInv);

    gameEvents.emit('ITEM_CRAFTED', {
      itemId: recipe.result.itemId,
      count: recipe.result.count,
      station: String(recipe.station),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Рюкзак и Мастерская
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Grid Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto">
          
          {/* Left Column: Inventory & Equipment (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Equipment Cluster */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-2">
                Экипировка героя
              </span>
              <div className="flex flex-wrap gap-2">
                {/* Helmet */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg border-2 border-[#3b3687] bg-[#1a1744] flex items-center justify-center relative shadow-inner">
                    <span className="text-[9px] text-slate-400 absolute top-0.5 left-1 font-mono">Шлем</span>
                    {equipment.helmet && (
                      <ItemIcon itemId={equipment.helmet.itemId} size={28} />
                    )}
                  </div>
                </div>

                {/* Chestplate */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg border-2 border-[#3b3687] bg-[#1a1744] flex items-center justify-center relative shadow-inner">
                    <span className="text-[9px] text-slate-400 absolute top-0.5 left-1 font-mono">Броня</span>
                    {equipment.chest && (
                      <ItemIcon itemId={equipment.chest.itemId} size={28} />
                    )}
                  </div>
                </div>

                {/* Greaves */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-lg border-2 border-[#3b3687] bg-[#1a1744] flex items-center justify-center relative shadow-inner">
                    <span className="text-[9px] text-slate-400 absolute top-0.5 left-1 font-mono">Обувь</span>
                    {equipment.legs && (
                      <ItemIcon itemId={equipment.legs.itemId} size={28} />
                    )}
                  </div>
                </div>

                <div className="w-px h-10 bg-[#3b3687] mx-1 self-center" />

                {/* Accessories 1, 2, 3 */}
                {[equipment.accessory1, equipment.accessory2, equipment.accessory3].map((acc, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-lg border-2 border-[#581c87] bg-[#2e1065]/40 flex items-center justify-center relative shadow-inner">
                      <span className="text-[9px] text-purple-300 absolute top-0.5 left-1 font-mono">Акс {idx + 1}</span>
                      {acc && (
                        <ItemIcon itemId={acc.itemId} size={28} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Inventory: 50 Slots (10 hotbar + 40 main) */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Инвентарь (50 слотов)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ЛКМ Выбрать · ПКМ Разделить · Shift+Клик В сундук</span>
              </div>

              <div className="grid grid-cols-10 gap-1.5">
                {inventory.map((slot, idx) => {
                  const def = slot ? ITEMS[slot.itemId] : null;
                  const isHotbar = idx < 10;

                  return (
                    <div
                      key={idx}
                      onClick={(e) => handleSlotClick(idx, e)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (!slot || slot.count <= 1) return;
                        const emptyIdx = inventory.findIndex((s) => s === null);
                        if (emptyIdx === -1) return;
                        const splitCount = Math.floor(slot.count / 2);
                        const newInv = [...inventory];
                        newInv[idx] = { ...slot, count: slot.count - splitCount };
                        newInv[emptyIdx] = { itemId: slot.itemId, count: splitCount };
                        onUpdateInventory(newInv);
                      }}
                      onMouseEnter={() => setHoveredItem(def || null)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`relative w-10 h-10 rounded-lg border flex items-center justify-center cursor-pointer select-none transition-all ${
                        isHotbar
                          ? 'border-[#3b3687] bg-[#1a1744] hover:border-[#facc15]'
                          : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
                      }`}
                    >
                      {slot && def && (
                        <ItemIcon itemId={slot.itemId} size={26} />
                      )}

                      {slot && slot.count > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-white leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                          {slot.count}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chest View (If currently opened) */}
            {chestSlots && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      Содержимое сундука (30 слотов)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTakeAllFromChest}
                    className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-colors"
                  >
                    Забрать всё
                  </button>
                </div>

                <div className="grid grid-cols-10 gap-1.5">
                  {chestSlots.map((cSlot, cIdx) => {
                    const cDef = cSlot ? ITEMS[cSlot.itemId] : null;
                    return (
                      <div
                        key={cIdx}
                        onClick={(e) => handleChestSlotClick(cIdx, e)}
                        onMouseEnter={() => setHoveredItem(cDef || null)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className="relative w-10 h-10 rounded-lg border border-amber-500/30 bg-[#161240] flex items-center justify-center cursor-pointer hover:border-amber-400"
                      >
                        {cSlot && cDef && (
                          <ItemIcon itemId={cSlot.itemId} size={26} />
                        )}
                        {cSlot && cSlot.count > 1 && (
                          <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-amber-200 leading-none drop-shadow">
                            {cSlot.count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Crafting Recipes & Workshop (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center gap-2">
              <Hammer className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Крафт и Рецепты</span>
            </div>

            {/* Station Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'Все' },
                { id: 'hand', label: 'Ручной' },
                { id: TileType.WORKBENCH, label: 'Верстак' },
                { id: TileType.FURNACE, label: 'Печь' },
                { id: TileType.ANVIL, label: 'Наковальня' },
                { id: TileType.PHASE_ALTAR, label: 'Фазовый алтарь' },
              ].map((st) => (
                <button
                  key={st.label}
                  type="button"
                  onClick={() => setStationFilter(st.id as any)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    stationFilter === st.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Поиск чертежа..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:border-cyan-400 outline-none"
              />
            </div>

            {/* Recipes Scrollable List */}
            <div className="flex-1 max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {filteredRecipes.map((recipe) => {
                const resDef = ITEMS[recipe.result.itemId];
                const affordable = canCraft(recipe, inventory);
                const isSelected = selectedRecipe?.id === recipe.id;

                return (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/50'
                        : affordable
                        ? 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                        : 'border-slate-800/60 bg-slate-950/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-[#1a1744] border border-[#3b3687]">
                        <ItemIcon itemId={recipe.result.itemId} size={28} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {resDef?.name} {recipe.result.count > 1 ? `x${recipe.result.count}` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {recipe.ingredients.map((ing) => `${ITEMS[ing.itemId]?.name} (${ing.count})`).join(', ')}
                        </div>
                      </div>
                    </div>

                    {affordable && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Доступно
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Craft Button Panel */}
            {selectedRecipe && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-300">
                  Создать: <span className="font-bold text-cyan-300">{ITEMS[selectedRecipe.result.itemId]?.name}</span>
                </div>
                <button
                  type="button"
                  disabled={!canCraft(selectedRecipe, inventory)}
                  onClick={() => handleCraft(selectedRecipe)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                    canCraft(selectedRecipe, inventory)
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg active:scale-95 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Создать
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Tooltip Bar */}
        {hoveredItem && (
          <div className="border-t border-slate-800 bg-slate-950 px-6 py-2.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-cyan-300 mr-2">{hoveredItem.name}</span>
              <span className="text-slate-400">{hoveredItem.description}</span>
            </div>
            <div className="flex gap-3 text-[11px] font-mono text-slate-300">
              {hoveredItem.damage && <span>Урон: {hoveredItem.damage}</span>}
              {hoveredItem.defense && <span>Защита: +{hoveredItem.defense}</span>}
              {hoveredItem.pickPower && <span>Кирка: {hoveredItem.pickPower}%</span>}
              {hoveredItem.axePower && <span>Топор: {hoveredItem.axePower}%</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

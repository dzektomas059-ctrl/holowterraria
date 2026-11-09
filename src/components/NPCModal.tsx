/**
 * Hollowfall - Town NPC Dialogue & Merchant Trading Modal
 * Диалоги с жителями (Советник Элиан, Торговец Брун, Кузнец Торин, Мистик Астра) и покупка товаров
 */

import React, { useState } from 'react';
import { ITEMS } from '../game/items.ts';
import { addItemToInventory } from '../game/rules.ts';
import { TownNPC } from '../game/entities.ts';
import { InventorySlot } from '../game/types.ts';
import { MessageSquare, ShoppingBag, X, Check } from 'lucide-react';
import { ItemIcon } from './ItemIcon.tsx';

interface NPCModalProps {
  npc: TownNPC;
  inventory: (InventorySlot | null)[];
  onClose: () => void;
  onUpdateInventory: (inv: (InventorySlot | null)[]) => void;
}

export const NPCModal: React.FC<NPCModalProps> = ({
  npc,
  inventory,
  onClose,
  onUpdateInventory,
}) => {
  const [dialogueIdx, setDialogueIdx] = useState(0);

  // Coins total in inventory
  let coinsCount = 0;
  for (const slot of inventory) {
    if (slot && (slot.itemId === 'copper_bar' || slot.itemId === 'gold_bar' || slot.itemId === 'iron_bar')) {
      coinsCount += slot.count; // Use bars as currency
    }
  }

  const handleNextDialogue = () => {
    setDialogueIdx((prev) => (prev + 1) % npc.dialogues.length);
  };

  const handleBuy = (itemId: string, price: number) => {
    // Check if player has at least 'price' iron bars or copper bars
    let remainingCost = price;
    const newInv = [...inventory];

    for (let i = 0; i < newInv.length && remainingCost > 0; i++) {
      const slot = newInv[i];
      if (slot && (slot.itemId === 'iron_bar' || slot.itemId === 'copper_bar')) {
        if (slot.count <= remainingCost) {
          remainingCost -= slot.count;
          newInv[i] = null;
        } else {
          slot.count -= remainingCost;
          remainingCost = 0;
        }
      }
    }

    if (remainingCost === 0) {
      // Successfully bought item!
      addItemToInventory(newInv, itemId, 1, ITEMS[itemId]?.maxStack || 999);
      onUpdateInventory(newInv);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl p-6 text-slate-100 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-400 flex items-center justify-center text-lg font-bold text-cyan-300">
              {npc.name.slice(0, 1)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{npc.name}</h3>
              <p className="text-xs text-indigo-400 font-mono">{npc.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Speech Bubble */}
        <div
          onClick={handleNextDialogue}
          className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 text-sm text-slate-200 cursor-pointer hover:border-slate-700 transition-all select-none"
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="italic leading-relaxed">«{npc.dialogues[dialogueIdx]}»</p>
          </div>
          <span className="block text-right text-[10px] text-slate-500 mt-2 font-mono">
            Нажмите для продолжения совета... ({dialogueIdx + 1}/{npc.dialogues.length})
          </span>
        </div>

        {/* Shop Items (If Merchant) */}
        {npc.shopItems.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Товары лавки
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Оплата: металлические слитки (у вас: {coinsCount})
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {npc.shopItems.map((item) => {
                const def = ITEMS[item.itemId];
                const canAfford = coinsCount >= item.price;

                return (
                  <div
                    key={item.itemId}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-[#1a1744] border border-[#3b3687]">
                        <ItemIcon itemId={item.itemId} size={26} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{def?.name}</div>
                        <div className="text-[10px] text-slate-400">{def?.description}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item.itemId, item.price)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        canAfford
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer active:scale-95 shadow'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {item.price} слитков
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

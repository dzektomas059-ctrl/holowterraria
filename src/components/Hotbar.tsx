/**
 * Hollowfall - In-Game HUD & Hotbar Cluster
 * Хотбар на 10 слотов, полосы здоровья (HP) и энергии Эха, статус Фазового сдвига [Q]
 */

import React from 'react';
import { ITEMS } from '../game/items.ts';
import { InventorySlot, LayerType } from '../game/types.ts';
import { Heart, Zap, Sparkles, Volume2, VolumeX, Pause, Backpack, Map as MapIcon, HelpCircle, Trophy, Scroll } from 'lucide-react';
import { ItemIcon } from './ItemIcon.tsx';

interface HotbarProps {
  slots: (InventorySlot | null)[]; // 10 hotbar slots
  selectedSlot: number;
  onSelectSlot: (idx: number) => void;
  hp: number;
  maxHp: number;
  echo: number;
  maxEcho: number;
  activeLayer: LayerType;
  shiftCooldown: number;
  onPhaseShift: () => void;
  onToggleInventory: () => void;
  onToggleMap: () => void;
  onTogglePause: () => void;
  onToggleAchievements?: () => void;
  onToggleQuests?: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const Hotbar: React.FC<HotbarProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  hp,
  maxHp,
  echo,
  maxEcho,
  activeLayer,
  shiftCooldown,
  onPhaseShift,
  onToggleInventory,
  onToggleMap,
  onTogglePause,
  onToggleAchievements,
  onToggleQuests,
  muted,
  onToggleMute,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const echoPct = Math.max(0, Math.min(100, (echo / maxEcho) * 100));

  return (
    <div className="fixed inset-0 pointer-events-none z-30 p-3 flex flex-col justify-between">
      
      {/* Top Header Cluster: Health, Echo, Hotbar, Controls */}
      <div className="flex items-start justify-between gap-4">
        
        {/* Left Side: Vitals & Hotbar */}
        <div className="pointer-events-auto flex flex-col gap-2">
          
          {/* Health & Echo Bars */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 shadow-lg backdrop-blur-sm">
            {/* Health */}
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
              <div className="w-28 sm:w-36 h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-red-300 tabular-nums">
                {Math.round(hp)}/{maxHp}
              </span>
            </div>

            <div className="w-px h-4 bg-slate-800" />

            {/* Echo Energy */}
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400 fill-current" />
              <div className="w-24 sm:w-32 h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-400 transition-all duration-150"
                  style={{ width: `${echoPct}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-cyan-300 tabular-nums">
                {Math.round(echo)}/{maxEcho}
              </span>
            </div>
          </div>

          {/* 10 Hotbar Slots (Terraria Beveled Style) */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-1 p-1.5 bg-[#17143f]/90 border-2 border-[#3b3687] rounded-xl shadow-2xl backdrop-blur-md overflow-x-auto max-w-[94vw]">
              {slots.slice(0, 10).map((slot, idx) => {
                const itemDef = slot ? ITEMS[slot.itemId] : null;
                const isSelected = selectedSlot === idx;

                return (
                  <div
                    key={idx}
                    onClick={() => onSelectSlot(idx)}
                    className={`relative w-11 h-11 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'border-[#facc15] bg-[#312a75] shadow-[0_0_12px_rgba(250,204,21,0.6)] scale-105 z-10'
                        : 'border-[#2d2864] bg-[#1a1744]/90 hover:border-[#4d4699] hover:bg-[#25205e]'
                    }`}
                  >
                    {/* Slot Number Badge */}
                    <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-[#94a3b8] leading-none">
                      {idx === 9 ? '0' : idx + 1}
                    </span>

                    {/* Terraria Pixel-Art Item Icon */}
                    {slot && itemDef && (
                      <div className="flex items-center justify-center w-8 h-8">
                        <ItemIcon itemId={slot.itemId} size={28} />
                      </div>
                    )}

                    {/* Stack Count */}
                    {slot && slot.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-mono font-black text-white leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {slot.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Active Item Name & Stats Banner */}
            {slots[selectedSlot] && ITEMS[slots[selectedSlot]!.itemId] && (
              <div className="flex items-center gap-2 px-3 py-1 bg-black/75 border border-[#3b3687]/80 rounded-lg text-xs font-mono backdrop-blur-sm self-start">
                <span className="font-bold text-[#facc15] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {ITEMS[slots[selectedSlot]!.itemId].name}
                </span>
                {ITEMS[slots[selectedSlot]!.itemId].damage && (
                  <span className="text-red-300 font-semibold">
                    ({ITEMS[slots[selectedSlot]!.itemId].damage} урона)
                  </span>
                )}
                {ITEMS[slots[selectedSlot]!.itemId].pickPower && (
                  <span className="text-cyan-300 font-semibold">
                    (Кирка: {ITEMS[slots[selectedSlot]!.itemId].pickPower}%)
                  </span>
                )}
                {ITEMS[slots[selectedSlot]!.itemId].axePower && (
                  <span className="text-amber-300 font-semibold">
                    (Топор: {ITEMS[slots[selectedSlot]!.itemId].axePower}%)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: Phase Shift Button & Utility Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          
          {/* Phase Shift Button [Q] */}
          <button
            type="button"
            onClick={onPhaseShift}
            disabled={shiftCooldown > 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-bold text-xs shadow-lg transition-all ${
              activeLayer === LayerType.LIGHT
                ? 'border-cyan-500 bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900/90 shadow-cyan-950/60'
                : 'border-purple-500 bg-purple-950/80 text-purple-200 hover:bg-purple-900/90 shadow-purple-950/60'
            } ${shiftCooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
            title="Переключить реальность между Светлым и Теневым слоями"
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-spin-slow" />
            <div className="text-left">
              <div className="text-[10px] leading-tight opacity-75">
                {activeLayer === LayerType.LIGHT ? 'Светлый мир' : 'Теневой слой'}
              </div>
              <div className="text-xs leading-none">
                Фазовый сдвиг <span className="font-mono text-cyan-400">[Q]</span>
              </div>
            </div>
            {shiftCooldown > 0 && (
              <span className="text-[10px] font-mono bg-black/60 px-1 rounded text-cyan-300">
                {shiftCooldown.toFixed(1)}с
              </span>
            )}
          </button>

          {/* Quick Buttons */}
          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 shadow-lg backdrop-blur-sm">
            <button
              type="button"
              onClick={onToggleAchievements}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Достижения"
            >
              <Trophy className="w-4 h-4 text-[#facc15]" />
            </button>
            <button
              type="button"
              onClick={onToggleQuests}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Журнал заданий"
            >
              <Scroll className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={onToggleInventory}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Инвентарь и крафт [Tab]"
            >
              <Backpack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleMap}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Полноэкранная карта [M]"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Звук [Mute]"
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              type="button"
              onClick={onTogglePause}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Пауза [Esc]"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

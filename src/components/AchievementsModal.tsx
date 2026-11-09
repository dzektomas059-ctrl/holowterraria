/**
 * Hollowfall - Achievements Screen (Terraria-style)
 * Окно достижений в стиле Terraria с категориями, прогресс-барами и наградами
 */

import React, { useState } from 'react';
import { Achievement, AchievementCategory, achievementManager } from '../game/achievements.ts';
import { Trophy, Compass, Swords, Hammer, Sparkles, Shield, Key, X, CheckCircle, Lock } from 'lucide-react';

interface AchievementsModalProps {
  onClose: () => void;
}

const CATEGORIES: { id: AchievementCategory | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'Все', icon: Trophy },
  { id: 'exploration', label: 'Исследование', icon: Compass },
  { id: 'combat', label: 'Бой', icon: Swords },
  { id: 'crafting', label: 'Крафт', icon: Hammer },
  { id: 'phase', label: 'Фазовый сдвиг', icon: Sparkles },
  { id: 'progression', label: 'Прогрессия', icon: Shield },
  { id: 'secrets', label: 'Секреты', icon: Key },
];

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const [selectedCat, setSelectedCat] = useState<AchievementCategory | 'all'>('all');
  const allAchievements = achievementManager.getAchievements();
  const completionPct = achievementManager.getCompletionPercentage();

  const filtered = selectedCat === 'all'
    ? allAchievements
    : allAchievements.filter((a) => a.category === selectedCat);

  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      {/* Terraria-styled dialog frame: royal blue/indigo with double pixel borders */}
      <div className="relative flex flex-col w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-2xl border-4 border-[#3b3687] bg-[#1a1744] shadow-[0_0_30px_rgba(0,0,0,0.9)] text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#2b2767] bg-[#231f5a] px-6 py-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-[#facc15] drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            <div>
              <h2 className="text-xl font-bold tracking-wider text-[#facc15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                ДОСТИЖЕНИЯ HOLLOWFALL
              </h2>
              <p className="text-xs text-[#93c5fd] font-mono">
                Разблокировано: <span className="font-bold text-white">{unlockedCount}</span> из {allAchievements.length} ({completionPct}%)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#484299] bg-[#2f2a70] hover:bg-[#3b358c] text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="px-6 pt-3 pb-2 bg-[#201c52] border-b border-[#2b2767]">
          <div className="w-full bg-[#120f33] rounded-full h-3 border border-[#3b3687] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#eab308] via-[#facc15] to-[#38bdf8] transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-2 px-6 py-2.5 bg-[#17143f] border-b border-[#2b2767]">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  active
                    ? 'border-[#facc15] bg-[#3a3485] text-[#facc15] shadow-md shadow-[#facc15]/20 scale-105'
                    : 'border-[#2e2969] bg-[#201c52] text-slate-300 hover:border-[#484299]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Achievements Grid */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((ach) => {
              const progressPct = Math.min(100, Math.round((ach.current / ach.target) * 100));

              return (
                <div
                  key={ach.id}
                  className={`relative flex items-start gap-3.5 p-3.5 rounded-xl border-2 transition-all ${
                    ach.unlocked
                      ? 'border-[#facc15]/60 bg-[#252061] shadow-md shadow-[#facc15]/10'
                      : 'border-[#2b2767] bg-[#16133b] opacity-80'
                  }`}
                >
                  {/* Icon Socket */}
                  <div
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center shrink-0 shadow-inner ${
                      ach.unlocked
                        ? 'border-[#facc15] bg-gradient-to-b from-[#ca8a04] to-[#854d0e] text-white'
                        : 'border-[#3b3687] bg-[#0f0d2b] text-slate-500'
                    }`}
                  >
                    {ach.unlocked ? (
                      <CheckCircle className="w-6 h-6 text-[#fef08a]" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-sm font-bold truncate ${
                          ach.unlocked ? 'text-[#facc15]' : 'text-slate-300'
                        }`}
                      >
                        {ach.title}
                      </h4>
                      {ach.unlocked && (
                        <span className="text-[10px] font-mono text-[#4ade80] bg-[#14532d]/60 px-1.5 py-0.5 rounded border border-[#22c55e]/30">
                          Получено
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300/80 leading-relaxed mt-0.5 line-clamp-2">
                      {ach.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Прогресс:</span>
                        <span className="font-bold text-slate-200">
                          {ach.current} / {ach.target}
                        </span>
                      </div>
                      <div className="w-full bg-[#0d0b24] rounded-full h-2 border border-[#2e2969] overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            ach.unlocked ? 'bg-[#22c55e]' : 'bg-[#38bdf8]'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {ach.reward && (
                      <div className="mt-2 text-[10px] text-[#fcd34d] font-mono">
                        Награда: <span className="font-bold text-white">{ach.reward}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#2b2767] bg-[#231f5a] px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-[#484299] bg-[#2f2a70] hover:bg-[#3b358c] text-white text-xs font-bold uppercase tracking-wider transition-all"
          >
            Закрыть меню
          </button>
        </div>
      </div>
    </div>
  );
};

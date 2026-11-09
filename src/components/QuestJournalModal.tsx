/**
 * Hollowfall - Quest Journal Modal (Terraria-style)
 * Журнал заданий: отслеживание квестов, фильтрация по статусу и получение наград
 */

import React, { useState } from 'react';
import { questManager, Quest, QuestStatus } from '../game/quests.ts';
import { InventorySlot } from '../game/types.ts';
import { Scroll, CheckCircle2, Clock, Award, X, Check, Eye } from 'lucide-react';

interface QuestJournalModalProps {
  playerInventory: (InventorySlot | null)[];
  onClose: () => void;
  onUpdateInventory: (inv: (InventorySlot | null)[]) => void;
}

export const QuestJournalModal: React.FC<QuestJournalModalProps> = ({
  playerInventory,
  onClose,
  onUpdateInventory,
}) => {
  const [tab, setTab] = useState<QuestStatus>('ACTIVE');
  const allQuests = questManager.getQuests();

  const filtered = allQuests.filter((q) => {
    if (tab === 'ACTIVE') return q.status === 'ACTIVE';
    if (tab === 'AVAILABLE') return q.status === 'AVAILABLE';
    return q.status === 'COMPLETED' || q.status === 'CLAIMED';
  });

  const handleAccept = (id: string) => {
    questManager.acceptQuest(id);
    setTab('ACTIVE');
  };

  const handleToggleTrack = (id: string) => {
    questManager.toggleTracking(id);
  };

  const handleClaim = (id: string) => {
    const newInv = [...playerInventory];
    const success = questManager.claimReward(id, newInv);
    if (success) {
      onUpdateInventory(newInv);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-2xl border-4 border-[#3b3687] bg-[#1a1744] shadow-[0_0_30px_rgba(0,0,0,0.9)] text-slate-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#2b2767] bg-[#231f5a] px-6 py-4">
          <div className="flex items-center gap-3">
            <Scroll className="w-6 h-6 text-[#facc15] drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            <div>
              <h2 className="text-xl font-bold tracking-wider text-[#facc15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                ЖУРНАЛ ЗАДАНИЙ ЖИТЕЛЕЙ
              </h2>
              <p className="text-xs text-[#93c5fd] font-mono">
                Поручения от Торговца, Кузнеца и Странника Hollowfall
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

        {/* Status Tabs */}
        <div className="flex gap-2 px-6 py-2.5 bg-[#17143f] border-b border-[#2b2767]">
          {[
            { id: 'ACTIVE' as QuestStatus, label: 'Активные', count: allQuests.filter(q => q.status === 'ACTIVE').length },
            { id: 'AVAILABLE' as QuestStatus, label: 'Доступные', count: allQuests.filter(q => q.status === 'AVAILABLE').length },
            { id: 'COMPLETED' as QuestStatus, label: 'Завершённые', count: allQuests.filter(q => q.status === 'COMPLETED' || q.status === 'CLAIMED').length },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === t.id
                  ? 'border border-[#facc15] bg-[#3a3485] text-[#facc15] shadow-md shadow-[#facc15]/20 scale-105'
                  : 'border border-[#2e2969] bg-[#201c52] text-slate-300 hover:border-[#484299]'
              }`}
            >
              <span>{t.label}</span>
              <span className="text-[10px] bg-[#120f33] px-2 py-0.5 rounded-full font-mono text-[#38bdf8]">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quests List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Scroll className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm">Нет заданий в данной категории</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((quest) => {
                const progressPct = Math.min(100, Math.round((quest.current / quest.required) * 100));

                return (
                  <div
                    key={quest.id}
                    className="flex flex-col justify-between p-4 rounded-xl border-2 border-[#2b2767] bg-[#1e1a50] shadow-md"
                  >
                    <div>
                      {/* Quest Top Bar */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-mono text-[#38bdf8] bg-[#0c2444] px-2 py-0.5 rounded border border-[#0284c7]/40">
                          {quest.npcName} ({quest.npcRole})
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            quest.difficulty === 'EPIC'
                              ? 'bg-[#581c87] text-[#e9d5ff] border border-[#a855f7]'
                              : quest.difficulty === 'RARE'
                              ? 'bg-[#1e3a8a] text-[#bfdbfe] border border-[#3b82f6]'
                              : 'bg-[#1e293b] text-slate-300 border border-slate-700'
                          }`}
                        >
                          {quest.difficulty === 'EPIC' ? 'Эпический' : quest.difficulty === 'RARE' ? 'Редкий' : 'Обычный'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#facc15]">{quest.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">{quest.description}</p>

                      {/* Progress */}
                      {quest.status !== 'AVAILABLE' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span>Цель:</span>
                            <span className="font-bold text-slate-200">
                              {quest.current} / {quest.required}
                            </span>
                          </div>
                          <div className="w-full bg-[#0d0b24] rounded-full h-2 border border-[#2e2969] overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#38bdf8] to-[#22c55e] transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Rewards */}
                      <div className="mt-3 pt-2.5 border-t border-[#2b2767]">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Награда:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {quest.rewards.map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono font-bold text-[#fef08a] bg-[#713f12]/40 px-2 py-0.5 rounded border border-[#ca8a04]/40"
                            >
                              {r.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-[#2b2767] flex items-center justify-between">
                      {quest.status === 'AVAILABLE' && (
                        <button
                          type="button"
                          onClick={() => handleAccept(quest.id)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#2563eb] hover:brightness-110 text-white text-xs font-bold uppercase transition-all shadow"
                        >
                          Принять поручение
                        </button>
                      )}

                      {quest.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleToggleTrack(quest.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            quest.tracked
                              ? 'bg-[#3b82f6]/40 text-[#93c5fd] border border-[#3b82f6]'
                              : 'bg-[#120f33] text-slate-400 border border-[#2b2767]'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{quest.tracked ? 'Отслеживается на HUD' : 'Включить трекинг'}</span>
                        </button>
                      )}

                      {quest.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => handleClaim(quest.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#22c55e] hover:brightness-110 text-white text-xs font-bold uppercase transition-all shadow-lg animate-pulse"
                        >
                          <Award className="w-4 h-4" /> Получить награду!
                        </button>
                      )}

                      {quest.status === 'CLAIMED' && (
                        <span className="text-xs font-mono text-[#22c55e] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Награда получена
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#2b2767] bg-[#231f5a] px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-[#484299] bg-[#2f2a70] hover:bg-[#3b358c] text-white text-xs font-bold uppercase tracking-wider transition-all"
          >
            Закрыть журнал
          </button>
        </div>
      </div>
    </div>
  );
};

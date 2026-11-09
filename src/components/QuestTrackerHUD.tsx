/**
 * Hollowfall - In-Game Quest Tracker HUD & Notification Toasts
 * Компактный трекер активных заданий прямо в игровом процессе и уведомления о достижениях
 */

import React, { useEffect, useState } from 'react';
import { gameEvents } from '../game/events.ts';
import { questManager, Quest } from '../game/quests.ts';
import { Scroll, ChevronRight, ChevronDown, Trophy, Award } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'achievement' | 'quest';
  title: string;
  subtitle: string;
}

export const QuestTrackerHUD: React.FC<{ onOpenJournal: () => void }> = ({ onOpenJournal }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [trackedQuests, setTrackedQuests] = useState<Quest[]>([]);

  useEffect(() => {
    setTrackedQuests(questManager.getTrackedQuests());

    const un1 = gameEvents.on('QUEST_PROGRESS', () => {
      setTrackedQuests(questManager.getTrackedQuests());
    });
    const un2 = gameEvents.on('QUEST_COMPLETED', () => {
      setTrackedQuests(questManager.getTrackedQuests());
    });

    return () => {
      un1();
      un2();
    };
  }, []);

  if (trackedQuests.length === 0) return null;

  return (
    <div className="fixed top-16 right-3 z-30 pointer-events-auto max-w-xs w-64 select-none">
      <div className="rounded-xl border-2 border-[#3b3687] bg-[#1a1744]/90 shadow-xl backdrop-blur-sm overflow-hidden text-slate-100 text-xs">
        {/* Header */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between px-3 py-1.5 bg-[#252061] border-b border-[#3b3687] cursor-pointer hover:bg-[#2e2875] transition-colors"
        >
          <div className="flex items-center gap-1.5 text-[#facc15] font-bold">
            <Scroll className="w-3.5 h-3.5" />
            <span>Задания ({trackedQuests.length})</span>
          </div>
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>

        {/* Quests List */}
        {!collapsed && (
          <div className="p-2 space-y-2 max-h-48 overflow-y-auto">
            {trackedQuests.map((q) => {
              const pct = Math.min(100, Math.round((q.current / q.required) * 100));
              const isDone = q.status === 'COMPLETED';

              return (
                <div
                  key={q.id}
                  onClick={onOpenJournal}
                  className="p-1.5 rounded-lg border border-[#2b2767] bg-[#120f33]/60 cursor-pointer hover:border-[#facc15]/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-200 truncate">{q.title}</span>
                    <span className={`text-[10px] font-mono ${isDone ? 'text-[#4ade80] font-bold' : 'text-[#38bdf8]'}`}>
                      {q.current}/{q.required}
                    </span>
                  </div>

                  <div className="w-full bg-[#0d0b24] rounded-full h-1.5 border border-[#2e2969] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${isDone ? 'bg-[#22c55e]' : 'bg-[#38bdf8]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

let toastCounter = 0;

export const GameToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unAch = gameEvents.on('ACHIEVEMENT_UNLOCKED', (data) => {
      addToast({
        id: `ach_${Date.now()}_${++toastCounter}`,
        type: 'achievement',
        title: 'Достижение разблокировано!',
        subtitle: data.title,
      });
    });

    const unQst = gameEvents.on('QUEST_COMPLETED', (data) => {
      addToast({
        id: `qst_${Date.now()}_${++toastCounter}`,
        type: 'quest',
        title: 'Задание выполнено!',
        subtitle: data.questTitle,
      });
    });

    return () => {
      unAch();
      unQst();
    };
  }, []);

  const addToast = (item: ToastItem) => {
    setToasts((prev) => [...prev, item]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== item.id));
    }, 4500);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none select-none max-w-sm w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ${
            t.type === 'achievement'
              ? 'border-[#facc15] bg-[#221c54]/95 text-white shadow-[#facc15]/20'
              : 'border-[#22c55e] bg-[#0f2e1b]/95 text-white shadow-[#22c55e]/20'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              t.type === 'achievement'
                ? 'bg-[#ca8a04] border-[#fef08a] text-white shadow-md'
                : 'bg-[#15803d] border-[#86efac] text-white shadow-md'
            }`}
          >
            {t.type === 'achievement' ? <Trophy className="w-5 h-5" /> : <Award className="w-5 h-5" />}
          </div>

          <div className="min-w-0 flex-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block ${
                t.type === 'achievement' ? 'text-[#facc15]' : 'text-[#4ade80]'
              }`}
            >
              {t.title}
            </span>
            <span className="text-xs font-bold text-white truncate block drop-shadow">
              {t.subtitle}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

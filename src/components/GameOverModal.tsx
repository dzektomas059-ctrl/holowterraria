/**
 * Hollowfall - Game Over / Defeat Modal
 * Экран гибели героя: статистика забега и кнопка возрождения (data-start="true")
 */

import React from 'react';
import { RotateCcw, Skull } from 'lucide-react';

interface GameOverModalProps {
  charName: string;
  playTime: number; // in seconds
  onRespawn: () => void;
  onExitTitle: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  charName,
  playTime,
  onRespawn,
  onExitTitle,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}м ${s}с`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-slate-900 shadow-2xl p-6 text-slate-100 text-center space-y-5">
        
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto shadow-lg shadow-red-950/80 animate-pulse">
          <Skull className="w-8 h-8 text-red-400" />
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-widest text-red-500 uppercase">
            ВЫ ПОГИБЛИ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Тело {charName} растворилось в разломах Бездны...
          </p>
        </div>

        {/* Stats */}
        <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono space-y-1.5 text-left">
          <div className="flex justify-between text-slate-400">
            <span>Время в мире:</span>
            <span className="text-slate-200 font-bold">{formatTime(playTime)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Точка возрождения:</span>
            <span className="text-cyan-300 font-bold">У костра на поверхности</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            data-start="true"
            type="button"
            onClick={onRespawn}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-900/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Возродиться в мире
          </button>

          <button
            type="button"
            onClick={onExitTitle}
            className="w-full py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
          >
            Выйти в главное меню
          </button>
        </div>
      </div>
    </div>
  );
};

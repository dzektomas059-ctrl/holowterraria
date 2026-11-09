/**
 * Hollowfall - World Creator & Generator Progress Modal
 * Создание мира: выбор имени, сида, размера и прогресс-бар генерации
 */

import React, { useState } from 'react';
import { WorldMeta } from '../game/types.ts';
import { Globe, Sparkles, Check, ChevronLeft, Dna } from 'lucide-react';

interface WorldCreatorProps {
  onStartGeneration: (name: string, seed: number, width: number, height: number) => void;
  onCancel: () => void;
  generating: boolean;
  progressStage: string;
  progressPercent: number;
}

export const WorldCreator: React.FC<WorldCreatorProps> = ({
  onStartGeneration,
  onCancel,
  generating,
  progressStage,
  progressPercent,
}) => {
  const [worldName, setWorldName] = useState('Астральный Предел');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 9999999));
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('small');

  const getDimensions = () => {
    switch (size) {
      case 'small': return { w: 600, h: 320, label: 'Компактный (600×320)' };
      case 'medium': return { w: 900, h: 420, label: 'Стандартный (900×420)' };
      case 'large': return { w: 1400, h: 550, label: 'Большой (1400×550)' };
    }
  };

  const handleGenerate = () => {
    const dim = getDimensions();
    onStartGeneration(worldName.trim() || 'Астральный Предел', seed, dim.w, dim.h);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl p-6 text-slate-100">
        
        {generating ? (
          // Generation Progress Bar view
          <div className="py-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-cyan-400 animate-spin" />
              <Globe className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-100 mb-1">Сотворение мира Hollowfall</h3>
              <p className="text-sm text-cyan-400 font-medium animate-pulse">{progressStage}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs font-mono text-slate-400">{progressPercent}% завершено</div>
          </div>
        ) : (
          // Setup Form
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                  Создание нового мира
                </h2>
              </div>
              <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 p-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* World Name */}
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Название мира</label>
              <input
                type="text"
                value={worldName}
                maxLength={24}
                onChange={(e) => setWorldName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 outline-none text-sm text-slate-100 font-medium"
              />
            </div>

            {/* Seed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs uppercase font-semibold text-slate-400">Зерно генерации (Seed)</label>
                <button
                  type="button"
                  onClick={() => setSeed(Math.floor(Math.random() * 9999999))}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Dna className="w-3 h-3" /> Случайный
                </button>
              </div>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 outline-none text-sm text-slate-100 font-mono"
              />
            </div>

            {/* World Size */}
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-2">Размер мира</label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`py-2 px-2 rounded-lg border text-xs font-medium text-center transition-all ${
                      size === s
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {s === 'small' ? 'Малый' : s === 'medium' ? 'Средний' : 'Большой'}
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {s === 'small' ? '600×320' : s === 'medium' ? '900×420' : '1400×550'}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Малый размер рекомендуется для мгновенной генерации и максимального FPS в браузере.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" /> Сотворить мир
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Hollowfall - Pause Menu & Settings Modal
 * Пауза: продолжить, настройки звука, сохранение и выход
 */

import React from 'react';
import { Play, Download, Volume2, ZoomIn, LogOut } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onSaveExport: () => void;
  onExitTitle: () => void;
  sfxVolume: number;
  musicVolume: number;
  onSfxVolumeChange: (val: number) => void;
  onMusicVolumeChange: (val: number) => void;
  zoom: number;
  onZoomChange: (val: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onSaveExport,
  onExitTitle,
  sfxVolume,
  musicVolume,
  onSfxVolumeChange,
  onMusicVolumeChange,
  zoom,
  onZoomChange,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl p-6 text-slate-100 space-y-5">
        
        <div className="text-center border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            ПАУЗА
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Мир Hollowfall ожидает вашего возвращения</p>
        </div>

        {/* Audio Sliders */}
        <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Эффекты (SFX)</span>
              <span className="font-mono text-cyan-400">{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Музыка (Эмбиент)</span>
              <span className="font-mono text-purple-400">{Math.round(musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-purple-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Масштаб пикселей</span>
              <span className="font-mono text-indigo-400">{zoom.toFixed(1)}x</span>
            </div>
            <div className="flex gap-2">
              {[1.5, 2.0, 2.5].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => onZoomChange(z)}
                  className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-all ${
                    zoom === z
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-current" /> Продолжить (Esc)
          </button>

          <button
            type="button"
            onClick={onSaveExport}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" /> Экспорт сохранения (.json)
          </button>

          <button
            type="button"
            onClick={onExitTitle}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" /> Сохранить и выйти в меню
          </button>
        </div>
      </div>
    </div>
  );
};

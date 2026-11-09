/**
 * Hollowfall - Settings Menu Modal (Directly Matched to Terraria Settings Image)
 * В точности воссозданное меню настроек из Terraria (Изображение 1):
 * Двухколоночный макет, ползунки громкости, зума, интерфейса и переключатели геймплея
 */

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface SettingsModalProps {
  sfxVolume: number;
  musicVolume: number;
  onSfxVolumeChange: (val: number) => void;
  onMusicVolumeChange: (val: number) => void;
  zoom: number;
  onZoomChange: (val: number) => void;
  onOpenAchievements?: () => void;
  onClose: () => void;
  onSaveExit?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  sfxVolume,
  musicVolume,
  onSfxVolumeChange,
  onMusicVolumeChange,
  zoom,
  onZoomChange,
  onOpenAchievements,
  onClose,
  onSaveExit,
}) => {
  const [activeTab, setActiveTab] = useState<'General' | 'Interface' | 'Video' | 'Cursor' | 'Controls'>('General');
  const [autosave, setAutosave] = useState(true);
  const [smartDoors, setSmartDoors] = useState(true);
  const [smartCursor, setSmartCursor] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none font-sans">
      {/* Terraria Box Frame (from Image 1) */}
      <div className="relative w-full max-w-2xl rounded-2xl border-4 border-[#3c358b] bg-[#1d184f] shadow-[0_0_35px_rgba(0,0,0,0.95)] p-6 text-slate-100">
        
        {/* Title */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#93c5fd] animate-pulse" />
            <h2 className="text-2xl font-black tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Settings Menu
            </h2>
            <Sparkles className="w-4 h-4 text-[#93c5fd] animate-pulse" />
          </div>
        </div>

        {/* Two-Column Layout (Matching Image 1) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Menu Items */}
          <div className="md:col-span-5 rounded-xl border-2 border-[#2b256d] bg-[#161240] p-4 flex flex-col justify-between space-y-2">
            <div className="space-y-1.5">
              {(['General', 'Interface', 'Video', 'Cursor', 'Controls'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-lg font-bold tracking-wide transition-all ${
                    activeTab === tab
                      ? 'text-[#facc15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] bg-[#262061] scale-102'
                      : 'text-slate-300 hover:text-white hover:bg-[#201a54]'
                  }`}
                  style={{ textShadow: activeTab === tab ? '2px 2px 0px #000' : 'none' }}
                >
                  {tab}
                </button>
              ))}

              {onOpenAchievements && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAchievements();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-lg font-bold tracking-wide text-slate-300 hover:text-[#facc15] hover:bg-[#201a54] transition-all"
                >
                  Achievements
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-[#2b256d] space-y-1.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full text-left px-3 py-1.5 rounded-lg text-base font-bold text-slate-300 hover:text-white hover:bg-[#201a54] transition-all"
              >
                Close Menu
              </button>
              {onSaveExit && (
                <button
                  type="button"
                  onClick={onSaveExit}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-base font-bold text-[#f87171] hover:text-[#ef4444] hover:bg-[#201a54] transition-all"
                >
                  Save & Exit
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Settings Details (Matching Image 1) */}
          <div className="md:col-span-7 rounded-xl border-2 border-[#2b256d] bg-[#161240] p-5 space-y-6">
            
            {/* Volume Section */}
            <div>
              <h3 className="text-sm font-bold text-[#facc15] uppercase tracking-wider mb-3 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Volume
              </h3>

              <div className="space-y-2.5 text-xs">
                {/* Music */}
                <div className="flex items-center justify-between gap-3">
                  <span className="w-24 text-slate-200">Music: {Math.round(musicVolume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={musicVolume}
                    onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-3 rounded-lg accent-[#facc15] bg-[#0d0a29] border border-[#3c358b] cursor-pointer"
                  />
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between gap-3">
                  <span className="w-24 text-slate-200">Sound: {Math.round(sfxVolume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sfxVolume}
                    onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-3 rounded-lg accent-[#facc15] bg-[#0d0a29] border border-[#3c358b] cursor-pointer"
                  />
                </div>

                {/* Ambient */}
                <div className="flex items-center justify-between gap-3">
                  <span className="w-24 text-slate-200">Ambient: {Math.round(sfxVolume * 90)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sfxVolume * 0.9}
                    onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-3 rounded-lg accent-[#facc15] bg-[#0d0a29] border border-[#3c358b] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Zoom & Scaling Section */}
            <div className="pt-3 border-t border-[#2b256d]">
              <h3 className="text-sm font-bold text-[#facc15] uppercase tracking-wider mb-3 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Zoom & Visuals
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="w-24 text-slate-200">Zoom: {Math.round(zoom * 50)}%</span>
                  <div className="flex-1 flex gap-2">
                    {[1.5, 2.0, 2.5].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => onZoomChange(z)}
                        className={`flex-1 py-1 rounded border text-xs font-bold transition-all ${
                          zoom === z
                            ? 'border-[#facc15] bg-[#262061] text-[#facc15]'
                            : 'border-[#3c358b] bg-[#0d0a29] text-slate-400 hover:text-white'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="w-24 text-slate-200">UI Scale: 100%</span>
                  <input
                    type="range"
                    min="80"
                    max="120"
                    defaultValue="100"
                    disabled
                    className="flex-1 h-3 rounded-lg accent-[#facc15] bg-[#0d0a29] border border-[#3c358b]"
                  />
                </div>
              </div>
            </div>

            {/* Gameplay Toggles Section */}
            <div className="pt-3 border-t border-[#2b256d]">
              <h3 className="text-sm font-bold text-[#facc15] uppercase tracking-wider mb-2 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Gameplay
              </h3>

              <div className="space-y-1.5 text-xs">
                <div
                  onClick={() => setAutosave(!autosave)}
                  className="flex justify-between items-center px-3 py-1.5 rounded bg-[#0d0a29] border border-[#2b256d] cursor-pointer hover:border-[#3c358b]"
                >
                  <span className="text-slate-300">Autosave</span>
                  <span className={`font-bold ${autosave ? 'text-[#4ade80]' : 'text-slate-500'}`}>
                    {autosave ? 'On' : 'Off'}
                  </span>
                </div>

                <div
                  onClick={() => setSmartDoors(!smartDoors)}
                  className="flex justify-between items-center px-3 py-1.5 rounded bg-[#0d0a29] border border-[#2b256d] cursor-pointer hover:border-[#3c358b]"
                >
                  <span className="text-slate-300">Smart Doors</span>
                  <span className={`font-bold ${smartDoors ? 'text-[#38bdf8]' : 'text-slate-500'}`}>
                    {smartDoors ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div
                  onClick={() => setSmartCursor(!smartCursor)}
                  className="flex justify-between items-center px-3 py-1.5 rounded bg-[#0d0a29] border border-[#2b256d] cursor-pointer hover:border-[#3c358b]"
                >
                  <span className="text-slate-300">Smart Cursor Grid</span>
                  <span className={`font-bold ${smartCursor ? 'text-[#facc15]' : 'text-slate-500'}`}>
                    {smartCursor ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

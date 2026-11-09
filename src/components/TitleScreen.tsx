/**
 * Hollowfall - Authentic Terraria-Style Title Screen
 * Точное воспроизведение атмосферы главного меню Terraria (Изображения 2 и 3):
 * Стилизованный логотип, забавные сплэш-тексты, вертикальный список кнопок с золотым свечением при наведении
 */

import React, { useEffect, useState } from 'react';
import { CharacterData, WorldMeta } from '../game/types.ts';
import { Swords, Play, Globe, Trophy, Scroll, Settings, LogOut, Plus, Trash2, Check } from 'lucide-react';

interface TitleScreenProps {
  characters: CharacterData[];
  worlds: WorldMeta[];
  selectedCharId: string | null;
  selectedWorldId: string | null;
  onSelectChar: (id: string) => void;
  onSelectWorld: (id: string) => void;
  onOpenCreateChar: () => void;
  onOpenCreateWorld: () => void;
  onDeleteChar: (id: string) => void;
  onDeleteWorld: (id: string) => void;
  onStartGame: () => void;
  onOpenAchievements: () => void;
  onOpenQuests: () => void;
  onOpenSettings: () => void;
}

const SPLASH_TEXTS = [
  "Don't play at 3 AM!",
  "Also try Terraria!",
  "Phase shift into the unknown!",
  "100% Procedural Pixel Art!",
  "Don't dig straight down!",
  "The Void is watching you...",
  "Now with 2 parallel dimensions!",
  "Beware of the Phase Weaver!",
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  characters,
  worlds,
  selectedCharId,
  selectedWorldId,
  onSelectChar,
  onSelectWorld,
  onOpenCreateChar,
  onOpenCreateWorld,
  onDeleteChar,
  onDeleteWorld,
  onStartGame,
  onOpenAchievements,
  onOpenQuests,
  onOpenSettings,
}) => {
  const [splashText] = useState(() => SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)]);
  const [showSlotsDrawer, setShowSlotsDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'chars' | 'worlds'>('chars');

  const selectedChar = characters.find((c) => c.id === selectedCharId) || characters[0];
  const selectedWorld = worlds.find((w) => w.id === selectedWorldId) || worlds[0];

  // Enter or Space starts game immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Enter' || e.code === 'Space') && !showSlotsDrawer) {
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, showSlotsDrawer]);

  const handleSinglePlayer = () => {
    // If user has character and world, start directly, otherwise open drawer
    if (selectedChar && selectedWorld) {
      onStartGame();
    } else {
      setShowSlotsDrawer(true);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden pointer-events-none">
      
      {/* Top Header: Terraria-Style Stylized Logo */}
      <div className="relative pointer-events-auto flex flex-col items-center justify-center pt-2 md:pt-6">
        
        {/* Custom Terraria-like Logo Lockup */}
        <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
          {/* Logo Leaves & Shard Ornament */}
          <div className="flex items-center justify-center gap-2">
            <svg className="w-12 h-12 md:w-16 md:h-16 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]" viewBox="0 0 50 50">
              <polygon points="25,2 47,15 47,35 25,48 3,35 3,15" fill="#15803d" stroke="#86efac" strokeWidth="2.5" />
              <polygon points="25,9 39,18 39,32 25,41 11,32 11,18" fill="#166534" />
              <polygon points="25,14 33,20 33,30 25,36 17,30 17,20" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="1.5" />
            </svg>

            <h1
              className="text-5xl md:text-7xl font-black tracking-widest text-[#facc15] uppercase"
              style={{
                fontFamily: '"Impact", "Arial Black", sans-serif',
                textShadow:
                  '4px 4px 0px #78350f, 6px 6px 0px #451a03, 8px 8px 12px rgba(0,0,0,0.8), 0 0 20px rgba(250,204,21,0.5)',
                WebkitTextStroke: '2px #78350f',
              }}
            >
              HOLLOWFALL
            </h1>
          </div>

          {/* Playful Yellow Splash Text (Direct Terraria Feature from Image 3) */}
          <div
            className="absolute -bottom-4 right-2 md:right-8 text-xs md:text-sm font-bold text-[#fef08a] italic tracking-wide transform -rotate-6 animate-pulse"
            style={{
              textShadow: '2px 2px 0px #713f12, 0 0 8px rgba(254,240,138,0.8)',
            }}
          >
            {splashText}
          </div>
        </div>
      </div>

      {/* Right / Center Menu Column (Matching Terraria Images 2 & 3) */}
      <div className="relative pointer-events-auto flex flex-col items-center md:items-end justify-center max-w-sm ml-auto mr-4 md:mr-16 my-auto space-y-2.5">
        
        {/* Single Player (Primary CTA with data-start="true") */}
        <button
          data-start="true"
          type="button"
          onClick={handleSinglePlayer}
          className="group flex items-center justify-start md:justify-end gap-3 w-64 px-4 py-2 text-2xl md:text-3xl font-black text-slate-100 hover:text-[#facc15] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-right"
          style={{
            fontFamily: '"Impact", "Arial Black", sans-serif',
            textShadow: '3px 3px 0px #000, 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          <Swords className="w-6 h-6 text-[#facc15] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          <span>Single Player</span>
        </button>

        {/* Continue (Direct into current world) */}
        <button
          type="button"
          onClick={onStartGame}
          className="group flex items-center justify-start md:justify-end gap-3 w-64 px-4 py-1.5 text-xl md:text-2xl font-black text-slate-200 hover:text-[#facc15] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-right"
          style={{
            fontFamily: '"Impact", "Arial Black", sans-serif',
            textShadow: '3px 3px 0px #000, 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          <Play className="w-5 h-5 text-[#facc15] fill-current opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          <span>Continue</span>
        </button>

        {/* Worlds & Characters */}
        <button
          type="button"
          onClick={() => setShowSlotsDrawer(true)}
          className="group flex items-center justify-start md:justify-end gap-3 w-64 px-4 py-1.5 text-xl md:text-2xl font-black text-slate-200 hover:text-[#facc15] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-right"
          style={{
            fontFamily: '"Impact", "Arial Black", sans-serif',
            textShadow: '3px 3px 0px #000, 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          <Globe className="w-5 h-5 text-[#facc15] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          <span>World Select</span>
        </button>

        {/* Achievements */}
        <button
          type="button"
          onClick={onOpenAchievements}
          className="group flex items-center justify-start md:justify-end gap-3 w-64 px-4 py-1.5 text-xl md:text-2xl font-black text-slate-200 hover:text-[#facc15] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-right"
          style={{
            fontFamily: '"Impact", "Arial Black", sans-serif',
            textShadow: '3px 3px 0px #000, 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          <Trophy className="w-5 h-5 text-[#facc15] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          <span>Achievements</span>
        </button>

        {/* Quests */}
        <button
          type="button"
          onClick={onOpenQuests}
          className="group flex items-center justify-start md:justify-end gap-3 w-64 px-4 py-1.5 text-xl md:text-2xl font-black text-slate-200 hover:text-[#facc15] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-right"
          style={{
            fontFamily: '"Impact", "Arial Black", sans-serif',
            textShadow: '3px 3px 0px #000, 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          <Scroll className="w-5 h-5 text-[#facc15] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          <span>Quests</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="group flex items-center justify-start md:justify-end gap-3 w-64 px-4 py-1.5 text-xl md:text-2xl font-black text-slate-200 hover:text-[#facc15] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-right"
          style={{
            fontFamily: '"Impact", "Arial Black", sans-serif',
            textShadow: '3px 3px 0px #000, 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          <Settings className="w-5 h-5 text-[#facc15] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          <span>Settings</span>
        </button>

        {/* Exit */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="group flex items-center justify-start md:justify-end gap-3 w-64 px-4 py-1.5 text-xl md:text-2xl font-black text-slate-300 hover:text-[#f87171] transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-right"
          style={{
            fontFamily: '"Impact", "Arial Black", sans-serif',
            textShadow: '3px 3px 0px #000, 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          <LogOut className="w-5 h-5 text-[#f87171] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          <span>Exit</span>
        </button>

        {/* Selected Slot Information Pill */}
        <div className="pt-2 text-right text-xs font-mono text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
          Герой: <span className="text-[#facc15] font-bold">{selectedChar?.name || 'Странник'}</span> | Мир:{' '}
          <span className="text-[#38bdf8] font-bold">{selectedWorld?.name || 'Астральный Предел'}</span>
        </div>
      </div>

      {/* Bottom Footer: Terraria Version line */}
      <div className="relative pointer-events-auto flex items-center justify-between text-xs text-white/80 font-mono tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        <div>v1.2.0 • Hollowfall Phase Engine</div>
        <div className="hidden sm:block">WASD Передвижение · Пробел Прыжок · Q Фазовый сдвиг · E Крюк · Tab Инвентарь · Esc Меню</div>
      </div>

      {/* Modal Drawer: Worlds & Character Selection */}
      {showSlotsDrawer && (
        <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border-4 border-[#3b3687] bg-[#1a1744] shadow-2xl p-6 text-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b-2 border-[#2b2767] pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerTab('chars')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    drawerTab === 'chars'
                      ? 'bg-[#3a3485] text-[#facc15] border border-[#facc15]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Персонажи ({characters.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('worlds')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    drawerTab === 'worlds'
                      ? 'bg-[#3a3485] text-[#facc15] border border-[#facc15]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Миры ({worlds.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSlotsDrawer(false)}
                className="px-3 py-1 rounded bg-[#2b2767] hover:bg-[#3b3687] text-xs font-bold"
              >
                Закрыть
              </button>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {drawerTab === 'chars' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {characters.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelectChar(c.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedCharId === c.id
                          ? 'border-[#facc15] bg-[#29236d] shadow-md'
                          : 'border-[#2b2767] bg-[#161240] hover:border-[#3c358b]'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          HP {c.maxHp} • Эхо {c.maxEchoEnergy}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChar(c.id);
                        }}
                        className="text-slate-500 hover:text-red-400 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setShowSlotsDrawer(false);
                      onOpenCreateChar();
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#3b3687] hover:border-[#facc15] text-slate-300 hover:text-[#facc15] text-xs font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" /> Новый персонаж
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {worlds.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => onSelectWorld(w.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedWorldId === w.id
                          ? 'border-[#facc15] bg-[#29236d] shadow-md'
                          : 'border-[#2b2767] bg-[#161240] hover:border-[#3c358b]'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{w.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {w.width}×{w.height} • Сид: {w.seed}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteWorld(w.id);
                        }}
                        className="text-slate-500 hover:text-red-400 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setShowSlotsDrawer(false);
                      onOpenCreateWorld();
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[#3b3687] hover:border-[#facc15] text-slate-300 hover:text-[#facc15] text-xs font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" /> Сотворить мир
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t-2 border-[#2b2767] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSlotsDrawer(false);
                  onStartGame();
                }}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#eab308] to-[#ca8a04] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg"
              >
                Выбрать и войти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

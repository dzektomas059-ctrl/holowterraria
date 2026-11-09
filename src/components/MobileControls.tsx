/**
 * Hollowfall - Mobile Touch Controls Overlay
 * Экранный виртуальный джойстик и кнопки действий для смартфонов и планшетов
 */

import React, { useRef } from 'react';
import { ArrowUp, Sparkles, Anchor, Swords, Backpack } from 'lucide-react';
import { InputManager } from '../game/input.ts';

interface MobileControlsProps {
  inputManager: InputManager;
  onToggleInventory: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ inputManager, onToggleInventory }) => {
  const stickRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    updateStick(e.touches[0]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    updateStick(e.touches[0]);
  };

  const handleTouchEnd = () => {
    inputManager.touchStick.active = false;
    inputManager.touchStick.dx = 0;
    inputManager.touchStick.dy = 0;
  };

  const updateStick = (touch: React.Touch) => {
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const maxRadius = rect.width / 2;
    const clampedDist = Math.min(dist, maxRadius);

    inputManager.touchStick.active = true;
    inputManager.touchStick.dx = (dx / dist) * (clampedDist / maxRadius);
    inputManager.touchStick.dy = (dy / dist) * (clampedDist / maxRadius);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none">
      
      {/* Left Virtual Joystick */}
      <div
        ref={stickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="pointer-events-auto absolute bottom-8 left-8 w-32 h-32 rounded-full border-2 border-white/20 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center active:border-cyan-400"
      >
        <div
          className="w-12 h-12 rounded-full bg-cyan-500/50 border border-white/40 shadow-lg pointer-events-none transition-transform"
          style={{
            transform: `translate(${inputManager.touchStick.dx * 35}px, ${inputManager.touchStick.dy * 35}px)`,
          }}
        />
      </div>

      {/* Right Action Buttons */}
      <div className="pointer-events-auto absolute bottom-8 right-8 flex flex-col items-end gap-3">
        <div className="flex gap-2">
          {/* Phase Shift */}
          <button
            type="button"
            onTouchStart={() => (inputManager.touchPhaseShift = true)}
            className="w-12 h-12 rounded-full bg-purple-600/70 border border-purple-400/50 flex items-center justify-center text-white shadow-lg active:scale-95"
            title="Фазовый сдвиг [Q]"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Grappling Hook */}
          <button
            type="button"
            onTouchStart={() => (inputManager.touchHook = true)}
            className="w-12 h-12 rounded-full bg-slate-700/70 border border-slate-500/50 flex items-center justify-center text-white shadow-lg active:scale-95"
            title="Крюк [E]"
          >
            <Anchor className="w-5 h-5" />
          </button>

          {/* Bag */}
          <button
            type="button"
            onClick={onToggleInventory}
            className="w-12 h-12 rounded-full bg-amber-600/70 border border-amber-400/50 flex items-center justify-center text-white shadow-lg active:scale-95"
            title="Рюкзак [Tab]"
          >
            <Backpack className="w-5 h-5" />
          </button>
        </div>

        {/* Jump Button (Big) */}
        <button
          type="button"
          onTouchStart={() => {
            inputManager.touchJump = true;
            inputManager.touchJumpJustPressed = true;
          }}
          onTouchEnd={() => (inputManager.touchJump = false)}
          className="w-16 h-16 rounded-full bg-cyan-600/80 border-2 border-cyan-300 flex items-center justify-center text-white shadow-xl active:scale-95"
          title="Прыжок [Пробел]"
        >
          <ArrowUp className="w-7 h-7 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

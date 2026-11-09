/**
 * Hollowfall - Character Creator & Preview
 * Экран создания персонажа (м/ж, 8 причёсок, палитра цветов, живое превью)
 */

import React, { useEffect, useRef, useState } from 'react';
import { CharacterAppearance, CharacterData, Difficulty, Gender } from '../game/types.ts';
import { Sparkles, User, Shield, ChevronLeft, Check } from 'lucide-react';

interface CharacterCreatorProps {
  onCreated: (char: CharacterData) => void;
  onCancel: () => void;
}

const DEFAULT_APPEARANCE: CharacterAppearance = {
  gender: 'male',
  hairStyle: 1,
  hairColor: '#eab308',
  skinColor: '#fcd34d',
  eyeColor: '#0284c7',
  shirtColor: '#ef4444',
  pantsColor: '#1d4ed8',
  shoeColor: '#451a03',
};

const HAIR_STYLES = [
  'Короткая',
  'Взъерошенная',
  'Длинный хвост',
  'Каре',
  'Косички',
  'Ирокез',
  'Шляпа мага',
  'Классика',
];

const COLOR_PALETTES = {
  hair: ['#1e1b4b', '#78350f', '#eab308', '#dc2626', '#38bdf8', '#c084fc', '#f3f4f6', '#15803d'],
  skin: ['#fef3c7', '#fde68a', '#fcd34d', '#f59e0b', '#b45309', '#78350f'],
  clothes: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#334155'],
};

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCreated, onCancel }) => {
  const [name, setName] = useState('Странник');
  const [gender, setGender] = useState<Gender>('male');
  const [hairStyle, setHairStyle] = useState(1);
  const [hairColor, setHairColor] = useState('#eab308');
  const [skinColor, setSkinColor] = useState('#fcd34d');
  const [eyeColor, setEyeColor] = useState('#0284c7');
  const [shirtColor, setShirtColor] = useState('#ef4444');
  const [pantsColor, setPantsColor] = useState('#1d4ed8');
  const [shoeColor, setShoeColor] = useState('#451a03');
  const [difficulty, setDifficulty] = useState<Difficulty>('classic');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Live Canvas Preview Animation
  useEffect(() => {
    let animId: number;
    let t = 0;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const render = () => {
      t += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height * 0.78;
      const scale = 5;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);

      const bob = Math.sin(t) * 0.8;
      const waveArm = Math.sin(t * 1.5) * 0.35;

      // Legs / Pants
      ctx.fillStyle = pantsColor;
      ctx.fillRect(-5, -8, 4, 8);
      ctx.fillRect(1, -8, 4, 8);

      // Shoes
      ctx.fillStyle = shoeColor;
      ctx.fillRect(-5, -2, 5, 2);
      ctx.fillRect(1, -2, 5, 2);

      // Shirt
      ctx.fillStyle = shirtColor;
      ctx.fillRect(-5, -18 + bob, 10, 10);
      if (gender === 'female') {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(-5, -13 + bob, 1, 5);
        ctx.fillRect(4, -13 + bob, 1, 5);
      }

      // Head & Skin
      ctx.fillStyle = skinColor;
      ctx.fillRect(-4, -25 + bob, 8, 7);

      // Eyes
      ctx.fillStyle = eyeColor;
      ctx.fillRect(1, -23 + bob, 2, 2);

      // Hair
      ctx.fillStyle = hairColor;
      switch (hairStyle) {
        case 0:
          ctx.fillRect(-5, -27 + bob, 10, 3);
          ctx.fillRect(-5, -25 + bob, 3, 3);
          break;
        case 1:
          ctx.fillRect(-5, -28 + bob, 10, 4);
          ctx.fillRect(-2, -30 + bob, 4, 3);
          break;
        case 2:
          ctx.fillRect(-5, -27 + bob, 10, 3);
          ctx.fillRect(-7, -25 + bob, 3, 10);
          break;
        case 3:
          ctx.fillRect(-5, -27 + bob, 10, 4);
          ctx.fillRect(-6, -25 + bob, 3, 8);
          break;
        case 4:
          ctx.fillRect(-5, -27 + bob, 10, 3);
          ctx.fillRect(-6, -24 + bob, 2, 8);
          ctx.fillRect(4, -24 + bob, 2, 8);
          break;
        case 5:
          ctx.fillRect(-1, -30 + bob, 3, 7);
          break;
        case 6:
          ctx.fillRect(-6, -27 + bob, 12, 3);
          ctx.fillRect(-3, -32 + bob, 6, 5);
          break;
        default:
          ctx.fillRect(-5, -27 + bob, 10, 3);
          ctx.fillRect(-5, -25 + bob, 4, 4);
          break;
      }

      // Waving Arm
      ctx.save();
      ctx.translate(3, -15 + bob);
      ctx.rotate(waveArm);
      ctx.fillStyle = shirtColor;
      ctx.fillRect(-1, 0, 3, 6);
      ctx.fillStyle = skinColor;
      ctx.fillRect(-1, 6, 3, 3);
      ctx.restore();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gender, hairStyle, hairColor, skinColor, eyeColor, shirtColor, pantsColor, shoeColor]);

  const handleCreate = () => {
    const newChar: CharacterData = {
      id: `char_${Date.now()}`,
      name: name.trim() || 'Странник',
      difficulty,
      appearance: {
        gender,
        hairStyle,
        hairColor,
        skinColor,
        eyeColor,
        shirtColor,
        pantsColor,
        shoeColor,
      },
      createdAt: Date.now(),
      playTime: 0,
      hp: 100,
      maxHp: 100,
      echoEnergy: 100,
      maxEchoEnergy: 100,
      inventory: [
        { itemId: 'copper_broadsword', count: 1 },
        { itemId: 'copper_pickaxe', count: 1 },
        { itemId: 'copper_axe', count: 1 },
        { itemId: 'torch', count: 20 },
        { itemId: 'wood', count: 50 },
        ...new Array(45).fill(null),
      ],
      equipment: {
        helmet: null,
        chest: null,
        legs: null,
        accessory1: null,
        accessory2: null,
        accessory3: null,
      },
    };
    onCreated(newChar);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex flex-col md:flex-row w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-900 shadow-2xl text-slate-100">
        
        {/* Left Column: Live Preview */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-950/40 to-slate-950/80 border-b md:border-b-0 md:border-r border-slate-800 w-full md:w-80">
          <div className="flex items-center gap-2 mb-4 text-cyan-400 font-semibold tracking-wider text-sm uppercase">
            <Sparkles className="w-4 h-4" /> Живое превью
          </div>

          <div className="relative w-48 h-56 rounded-xl border border-indigo-500/30 bg-slate-950/60 shadow-inner flex items-center justify-center overflow-hidden">
            <canvas ref={previewCanvasRef} width={180} height={200} className="w-full h-full" />
          </div>

          <div className="mt-4 text-center">
            <div className="text-xl font-bold text-slate-200">{name || 'Без имени'}</div>
            <div className="text-xs text-indigo-400 font-mono mt-1">
              {gender === 'male' ? 'Мужчина' : 'Женщина'} • {HAIR_STYLES[hairStyle]}
            </div>
          </div>
        </div>

        {/* Right Column: Customization Controls */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              Создание персонажа
            </h2>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Name & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Имя героя</label>
              <input
                type="text"
                value={name}
                maxLength={18}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 outline-none text-sm text-slate-100 font-medium"
                placeholder="Имя..."
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-semibold text-slate-400 mb-1">Пол</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                    gender === 'male'
                      ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200 shadow-md'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Мужчина
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-950/50 text-pink-200 shadow-md'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Женщина
                </button>
              </div>
            </div>
          </div>

          {/* Hairstyle Selector */}
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-2">
              Прическа ({hairStyle + 1}/8): <span className="text-cyan-400">{HAIR_STYLES[hairStyle]}</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {HAIR_STYLES.map((styleName, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setHairStyle(idx)}
                  className={`py-2 px-1 rounded-lg border text-xs font-medium truncate transition-all ${
                    hairStyle === idx
                      ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {styleName}
                </button>
              ))}
            </div>
          </div>

          {/* Color Palettes */}
          <div className="space-y-3">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">Цвет волос</span>
              <div className="flex gap-2">
                {COLOR_PALETTES.hair.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHairColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      hairColor === c ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">Цвет кожи</span>
              <div className="flex gap-2">
                {COLOR_PALETTES.skin.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSkinColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      skinColor === c ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">Цвет рубашки</span>
              <div className="flex gap-2">
                {COLOR_PALETTES.clothes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setShirtColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      shirtColor === c ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">Цвет штанов</span>
              <div className="flex gap-2">
                {COLOR_PALETTES.clothes.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPantsColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      pantsColor === c ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs uppercase font-semibold text-slate-400 mb-2">Сложность</label>
            <div className="grid grid-cols-3 gap-2">
              {(['softcore', 'classic', 'hardcore'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all ${
                    difficulty === d
                      ? 'border-indigo-400 bg-indigo-950/60 text-indigo-200 shadow'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {d === 'softcore' ? 'Мягкая' : d === 'classic' ? 'Классика' : 'Хардкор'}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" /> Создать героя
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

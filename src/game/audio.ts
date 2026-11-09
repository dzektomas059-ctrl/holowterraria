/**
 * Hollowfall - Procedural Web Audio Sound Synthesizer & Dynamic Ambient Music
 * 100% процедурные звуковые эффекты (SFX) и генеративная музыка через Web Audio API
 */

import { LayerType } from './types.ts';

export class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public sfxVolume: number = 0.5;
  public musicVolume: number = 0.35;

  private musicOscillators: OscillatorNode[] = [];
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private currentMusicMood: string = '';

  constructor() {
    // Initialized on first user gesture
  }

  public init(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.startMusic();
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects ---

  public playFootstep(material: 'grass' | 'stone' | 'wood' | 'snow'): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let freq = 120;
    if (material === 'stone') freq = 180;
    if (material === 'wood') freq = 140;
    if (material === 'snow') freq = 90;

    osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 30, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playDig(stone: boolean = false): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = stone ? 'triangle' : 'sine';
    const baseFreq = stone ? 340 : 160;
    osc.frequency.setValueAtTime(baseFreq + (Math.random() - 0.5) * 40, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playBlockBreak(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playSwing(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playHit(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.14);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playPhaseShift(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass sweep
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(90, now);
    bass.frequency.exponentialRampToValueAtTime(25, now + 0.45);
    bassGain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    bass.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bass.start(now);
    bass.stop(now + 0.46);

    // Ethereal crystal shimmer
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(580, now);
    chime.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
    chimeGain.gain.setValueAtTime(this.sfxVolume * 0.35, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(now);
    chime.stop(now + 0.36);
  }

  public playDoubleJump(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);

    gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playGrapple(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playPlayerHurt(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playBossRoar(): void {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.9);

    gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.92);
  }

  // --- Dynamic Procedural Music ---

  public updateMusicTrack(layer: LayerType, isDay: boolean, inBossFight: boolean): void {
    if (!this.ctx || !this.enabled) return;

    let targetMood = 'day';
    if (inBossFight) {
      targetMood = 'boss';
    } else if (layer === LayerType.SHADOW) {
      targetMood = 'shadow';
    } else if (!isDay) {
      targetMood = 'night';
    }

    if (this.currentMusicMood !== targetMood) {
      this.currentMusicMood = targetMood;
    }
  }

  private startMusic(): void {
    if (!this.ctx) return;

    // Generative chord progression
    const dayNotes = [261.63, 329.63, 392.00, 523.25, 440.00]; // C, E, G, C, A (warm major)
    const nightNotes = [220.00, 261.63, 329.63, 349.23, 196.00]; // A minor tranquil
    const shadowNotes = [130.81, 155.56, 196.00, 207.65, 293.66]; // Dark diminished/cosmic
    const bossNotes = [110.00, 116.54, 138.59, 164.81, 82.41]; // Heavy pounding tension

    let step = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.enabled || !this.ctx || this.musicVolume <= 0) return;

      let notes = dayNotes;
      if (this.currentMusicMood === 'shadow') notes = shadowNotes;
      if (this.currentMusicMood === 'night') notes = nightNotes;
      if (this.currentMusicMood === 'boss') notes = bossNotes;

      const note = notes[step % notes.length];
      step++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = this.currentMusicMood === 'boss' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(note, now);

      const duration = this.currentMusicMood === 'boss' ? 0.35 : 2.2;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(this.musicVolume * 0.12, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.1);
    }, 1800);
  }

  public setMuted(muted: boolean): void {
    this.enabled = !muted;
    if (this.ctx && muted) {
      this.ctx.suspend();
    } else if (this.ctx && !muted) {
      this.ctx.resume();
    }
  }
}

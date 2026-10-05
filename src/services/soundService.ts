/**
 * ChefMate Sound FX Engine
 * High-fidelity, zero-dependency procedural audio synthesis using Web Audio API.
 * Provides distinct, customized acoustic feedback for every button & gesture in the app.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedMute = localStorage.getItem('chefmate_sound_muted');
        if (savedMute !== null) {
          this.isMuted = savedMute === 'true';
        }
      } catch {}
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('chefmate_sound_muted', String(this.isMuted));
    } catch {}
    if (!this.isMuted) {
      this.playPop(520);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /** 1. Bouncy Bubble Pop — Ingredient Added to Pantry Bowl */
  public playPop(frequency: number = 440) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(frequency * 2.2, now + 0.08);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  /** 2. Soft Pop Down — Ingredient Removed from Bowl */
  public playPopDown() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /** 3. Hot Pan Sizzle & Sparkle — "Find Recipes" Action Button */
  public playSizzle() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.38);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3400, ctx.currentTime);
      filter.Q.setValueAtTime(3.0, ctx.currentTime);

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.37);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.38);
    } catch {}
  }

  /** 4. Lush Harmonic Chord — Save Recipe (Heart) */
  public playHeart() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);

        gain.gain.setValueAtTime(0.001, now + idx * 0.035);
        gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.035 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.4);
      });
    } catch {}
  }

  /** 5. Soft Descending Tone — Unsave Recipe */
  public playUnsave() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [659.25, 523.25]; // E5 -> C5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.16);
      });
    } catch {}
  }

  /** 6. Crystalline Arpeggio — Opening Recipe Card */
  public playRecipeOpen() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A major chime

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);

        gain.gain.setValueAtTime(0.001, now + idx * 0.03);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.03 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.34);
      });
    } catch {}
  }

  /** 7. Warm Woody Marimba Tap — Home Bottom Tab */
  public playHomeTab() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.06);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  }

  /** 8. Fiery Swish & Spark — Popular Recipes Bottom Tab */
  public playFlameTab() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.09);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {}
  }

  /** 9. Crisp Mechanical Glass Tick — Recent / History Bottom Tab */
  public playClockTab() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.setValueAtTime(1400, now + 0.02);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  /** 10. Elastic Rebound Tap — Back Button */
  public playBack() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /** 11. Dual Futuristic Beep — Voice Search (Mic) */
  public playMicStart() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [780, 1040].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.14, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.07);
      });
    } catch {}
  }

  /** 12. Lens Shutter Snap — Camera AI Scanner */
  public playCameraShutter() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Click 1 (mechanical curtain)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(200, now + 0.03);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.05);

      // Click 2 (shutter release)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2200, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain2.gain.setValueAtTime(0.18, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.1);
    } catch {}
  }

  /** 13. Magic Glockenspiel Sparkle — Custom Ingredient Add */
  public playSparkle() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const tones = [880, 1108.73, 1318.51, 1760]; // A5 -> A6 sparkle

      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.24);
      });
    } catch {}
  }

  /** 14. Tactile Switch Pop — Category / Filter Chips */
  public playFilterClick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.035);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /** 15. Coin Jingle / Ka-Ching — Quick Commerce Instant Delivery Order */
  public playCoin() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const coins = [1046.5, 1318.51, 2093.0]; // C6, E6, C7 bright brass chime

      coins.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.36);
      });
    } catch {}
  }

  /** 16. Stopwatch Toggle Click — Cooking Timer Start / Pause */
  public playTimerToggle(starting: boolean = true) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(starting ? 880 : 580, now);
      osc.frequency.exponentialRampToValueAtTime(starting ? 1100 : 440, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /** 17. Rewind Clink — Timer Reset */
  public playTimerReset() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [480, 600, 720].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.02);

        gain.gain.setValueAtTime(0.1, now + idx * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.02);
        osc.stop(now + idx * 0.02 + 0.04);
      });
    } catch {}
  }

  /** 18. Forward Cooking Step Whoosh & Chime */
  public playStepNext() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /** 19. Backward Step Tone */
  public playStepPrev() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.07);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /** 20. Grand Chef Victory Fanfare — Recipe Cooked / Completed */
  public playSuccessFanfare() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const fanfare = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 triumph

      fanfare.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.7);
      });
    } catch {}
  }

  /** 21. Paper Airplane Whoosh — Share Recipe */
  public playShare() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.12);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  /** 22. Sweep Swoosh — Clear Bowl / Reset */
  public playSwoosh() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  /** 23. General Tactile Click */
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }

  /** 24. Tab Switch Sound */
  public playTabSwitch() {
    this.playClick();
  }
}

export const sounds = new SoundService();

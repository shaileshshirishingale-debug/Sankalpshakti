import confetti from 'canvas-confetti';

const SOUND_PREF_KEY = 'my_sankalp_sound_enabled';

export const isSoundEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(SOUND_PREF_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

export const setSoundEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(SOUND_PREF_KEY, String(enabled));
  } catch {
    // ignore
  }
};

// Singleton Web Audio Context to avoid creating multiple contexts (prevents browser context limit exhaustion)
let sharedAudioCtx: AudioContext | null = null;

const getSharedAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    // Resume context if suspended (common when user has not yet interacted with the page)
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

// Gentle soothing synthesized chime using Web Audio API
export const playGentleChime = () => {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    // Pleasant Tibetan bell / meditation chime chord (frequencies: E5 ~659Hz, B5 ~987Hz)
    const freqs = [659.25, 987.77];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + idx * 0.05;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.85);
    });
  } catch {
    // Graceful fallback if audio is blocked or unsupported
  }
};

// Grand celebration chime when a whole day is completed
export const playCelebrationChime = () => {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + idx * 0.12;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.7);
    });
  } catch {
    // Ignore audio error
  }
};

// Micro confetti burst around a clicked element
export const triggerMicroConfetti = (originX?: number, originY?: number) => {
  try {
    const x = originX !== undefined ? originX / window.innerWidth : 0.5;
    const y = originY !== undefined ? originY / window.innerHeight : 0.5;

    confetti({
      particleCount: 28,
      spread: 55,
      startVelocity: 22,
      origin: { x, y },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'],
      ticks: 120,
      disableForReducedMotion: true,
    });
  } catch {
    // Confetti fallback
  }
};

// Grand celebration burst for Complete Day
export const triggerDayCompletionCelebration = () => {
  try {
    confetti({
      particleCount: 90,
      spread: 90,
      origin: { y: 0.65 },
      colors: ['#f59e0b', '#10b981', '#fbbf24', '#34d399', '#6366f1'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0.15, y: 0.7 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 0.85, y: 0.7 },
      });
    }, 250);
  } catch {
    // Ignore confetti errors
  }
};

const MUTE_KEY = 'brainmaster-sound-muted';

let ctx: AudioContext | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

const listeners = new Set<(m: boolean) => void>();

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* localStorage nicht verfügbar */
  }
  listeners.forEach(l => l(muted));
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

export function subscribeMuted(listener: (m: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getCtx(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Note {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  endFreq?: number;
}

function play(notes: Note[]): void {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  for (const n of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t0 = now + n.start;
    const t1 = t0 + n.duration;
    const vol = n.volume ?? 0.15;
    osc.type = n.type ?? 'sine';
    osc.frequency.setValueAtTime(n.freq, t0);
    if (n.endFreq) osc.frequency.exponentialRampToValueAtTime(n.endFreq, t1);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  }
}

export function playCorrect(): void {
  play([
    { freq: 660, start: 0, duration: 0.12 },
    { freq: 880, start: 0.09, duration: 0.18 },
  ]);
}

export function playWrong(): void {
  play([
    { freq: 330, start: 0, duration: 0.18, type: 'triangle', volume: 0.12 },
    { freq: 262, start: 0.14, duration: 0.25, type: 'triangle', volume: 0.1 },
  ]);
}

export function playAchievement(): void {
  const seq = [523, 659, 784, 1047, 1319];
  play([
    ...seq.map((freq, i) => ({ freq, start: i * 0.09, duration: 0.2, type: 'triangle' as const })),
    { freq: 1047, start: 0.5, duration: 0.5, volume: 0.1 },
    { freq: 1319, start: 0.5, duration: 0.5, volume: 0.1 },
    { freq: 1568, start: 0.5, duration: 0.5, volume: 0.1 },
  ]);
}

export function playDailyChallengeComplete(): void {
  play([
    { freq: 523, start: 0, duration: 0.15, type: 'square', volume: 0.06 },
    { freq: 523, start: 0.16, duration: 0.15, type: 'square', volume: 0.06 },
    { freq: 523, start: 0.32, duration: 0.15, type: 'square', volume: 0.06 },
    { freq: 659, start: 0.48, duration: 0.3, type: 'square', volume: 0.06 },
    { freq: 784, start: 0.8, duration: 0.6, type: 'triangle', volume: 0.15 },
    { freq: 1047, start: 0.8, duration: 0.6, type: 'sine', volume: 0.1 },
  ]);
}

export function playLevelUp(): void {
  play([
    { freq: 392, start: 0, duration: 0.4, endFreq: 1175, type: 'triangle', volume: 0.12 },
    { freq: 784, start: 0.4, duration: 0.15 },
    { freq: 1175, start: 0.5, duration: 0.45 },
  ]);
}

export function playGameStart(): void {
  play([{ freq: 440, start: 0, duration: 0.15, volume: 0.08 }, { freq: 587, start: 0.1, duration: 0.2, volume: 0.08 }]);
}

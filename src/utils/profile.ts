import type { UserProgress, ExerciseType } from '../types';

export const NAME_KEY = 'gehirntraining_username';
export const IQ_KEY = 'gehirntraining_iq';

export const EXERCISES: { type: ExerciseType; label: string; emoji: string; color: string }[] = [
  { type: 'logic', label: 'Logik', emoji: '🧩', color: '#60a5fa' },
  { type: 'memory', label: 'Memory', emoji: '🃏', color: '#c084fc' },
  { type: 'math', label: 'Mathe', emoji: '🧮', color: '#4ade80' },
  { type: 'words', label: 'Wörter', emoji: '📝', color: '#fb923c' },
];

export function exerciseLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 25)) + 1;
}

export interface Rank { title: string; emoji: string; from: string; to: string }

export function getRank(level: number): Rank {
  if (level <= 10) return { title: 'Anfänger', emoji: '🌱', from: '#64748b', to: '#334155' };
  if (level <= 20) return { title: 'Lehrling', emoji: '📘', from: '#b45309', to: '#78350f' };
  if (level <= 30) return { title: 'Fortgeschrittener', emoji: '⚡', from: '#0ea5e9', to: '#1e3a8a' };
  if (level <= 40) return { title: 'Experte', emoji: '💎', from: '#8b5cf6', to: '#4c1d95' };
  if (level <= 50) return { title: 'Meister', emoji: '👑', from: '#f59e0b', to: '#92400e' };
  return { title: 'Grossmeister', emoji: '🏆', from: '#ec4899', to: '#7c1d3f' };
}

export function getAchievements(p: UserProgress): { total: number; unlocked: number } {
  const s = p.exerciseStats;
  const days = trainingDays(p);
  const checks = [
    p.gamesPlayed >= 1, p.gamesPlayed >= 10, p.gamesPlayed >= 50,
    p.currentStreak >= 3 || p.longestStreak >= 3, p.longestStreak >= 7, p.longestStreak >= 30,
    p.totalPoints >= 500, p.totalPoints >= 2000,
    p.level >= 5, days >= 7,
    Object.values(s).every(x => x.played > 0),
    Object.values(s).some(x => x.bestScore >= 100),
  ];
  return { total: checks.length, unlocked: checks.filter(Boolean).length };
}

export function trainingDays(p: UserProgress): number {
  return Math.max(p.trainingDays || 0, p.dailyProgress.length);
}

export function buildProfile(p: UserProgress) {
  const raw = EXERCISES.map(e => exerciseLevel(p.exerciseStats[e.type].totalPoints));
  const level = Math.max(1, raw.reduce((a, b) => a + b, 0) - 3);
  const iqRaw = localStorage.getItem(IQ_KEY);
  return {
    name: localStorage.getItem(NAME_KEY) || '',
    iq: iqRaw ? Number(iqRaw) || null : null,
    level,
    rank: getRank(level),
    bars: EXERCISES.map((e, i) => ({ ...e, value: Math.min(10, raw[i]) })),
    streak: p.currentStreak,
    ach: getAchievements(p),
    days: trainingDays(p),
  };
}

export type Profile = ReturnType<typeof buildProfile>;

export function avatarFor(name: string): { emoji: string; bg: string } {
  const icons = ['🦊', '🐼', '🦉', '🐙', '🦁', '🐯', '🐨', '🦄', '🐲', '🦅'];
  let h = 0;
  for (const c of name || 'Brainmaster') h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { emoji: icons[h % icons.length], bg: `hsl(${h % 360},70%,60%)` };
}

export function renderCardPng(pr: Profile): Promise<Blob> {
  const W = 600, H = 880;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, pr.rank.from); g.addColorStop(1, pr.rank.to);
  const rr = (X: number, Y: number, w: number, h: number, r: number) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };
  x.fillStyle = g; rr(0, 0, W, H, 40); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 6; rr(14, 14, W - 28, H - 28, 30); x.stroke();
  x.fillStyle = '#fff'; x.textAlign = 'center';
  x.font = 'bold 26px sans-serif'; x.fillText('🧠 BRAINMASTER', W / 2, 70);
  const av = avatarFor(pr.name);
  x.fillStyle = av.bg; x.beginPath(); x.arc(W / 2, 170, 70, 0, Math.PI * 2); x.fill();
  x.lineWidth = 5; x.strokeStyle = '#fff'; x.stroke();
  x.fillStyle = '#fff'; x.font = '70px sans-serif'; x.fillText(av.emoji, W / 2, 196);
  x.font = 'bold 38px sans-serif'; x.fillText(pr.name || 'Namenlos', W / 2, 285);
  x.font = 'bold 24px sans-serif'; x.fillText(`${pr.rank.emoji} ${pr.rank.title}`, W / 2, 322);
  const box = (X: number, label: string, val: string) => {
    x.fillStyle = 'rgba(255,255,255,0.18)'; rr(X, 350, 160, 100, 18); x.fill();
    x.fillStyle = '#fff'; x.font = 'bold 36px sans-serif'; x.fillText(val, X + 80, 405);
    x.font = '16px sans-serif'; x.fillText(label, X + 80, 435);
  };
  box(40, 'Gesamt-Level', String(pr.level));
  box(220, 'IQ', pr.iq ? String(pr.iq) : '–');
  box(400, 'Streak', `🔥 ${pr.streak}`);
  pr.bars.forEach((b, i) => {
    const y = 500 + i * 50;
    x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = 'bold 20px sans-serif';
    x.fillText(`${b.emoji} ${b.label}`, 40, y + 20);
    x.fillStyle = 'rgba(0,0,0,0.3)'; rr(190, y, 290, 26, 13); x.fill();
    x.fillStyle = b.color; rr(190, y, Math.max(26, 290 * b.value / 10), 26, 13); x.fill();
    x.fillStyle = '#fff'; x.fillText(`${b.value}/10`, 495, y + 20);
  });
  x.textAlign = 'center';
  x.font = 'bold 22px sans-serif';
  x.fillText(`${pr.ach.unlocked}/${pr.ach.total} 🏆 Achievements`, W / 3 - 10, 760);
  x.fillText(`📅 ${pr.days} Trainings-Tage`, (2 * W) / 3 + 20, 760);
  x.font = '16px sans-serif'; x.fillStyle = 'rgba(255,255,255,0.7)';
  x.fillText('Trainiere dein Gehirn täglich!', W / 2, 835);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('PNG'))), 'image/png'));
}

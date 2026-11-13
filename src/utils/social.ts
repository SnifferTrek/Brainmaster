import type { UserProgress, ExerciseType } from '../types';
import { calculateLevel } from './storage';

export const EXERCISE_TYPES: ExerciseType[] = ['logic', 'memory', 'math', 'words'];
export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  logic: '🧩 Logik-Rätsel',
  memory: '🃏 Gedächtnis',
  math: '🧮 Kopfrechnen',
  words: '📝 Wortspiele',
};

export interface Profile {
  id: string;
  name: string;
}

export interface SharedStats {
  id: string;
  name: string;
  points: number;
  streak: number;
  longestStreak: number;
  level: number;
  games: number;
  ex: Record<ExerciseType, { p: number; l: number }>;
  ts: number;
}

const PROFILE_KEY = 'gehirntraining_profile';
const FRIENDS_KEY = 'gehirntraining_friends';

export function getProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function createProfile(name: string): Profile {
  const id = Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4);
  const profile = { id, name: name.trim().slice(0, 24) };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function buildStats(profile: Profile, p: UserProgress): SharedStats {
  const ex = {} as SharedStats['ex'];
  for (const t of EXERCISE_TYPES) {
    const pts = p.exerciseStats[t].totalPoints;
    ex[t] = { p: pts, l: calculateLevel(pts) };
  }
  return {
    id: profile.id,
    name: profile.name,
    points: p.totalPoints,
    streak: p.currentStreak,
    longestStreak: p.longestStreak,
    level: p.level,
    games: p.gamesPlayed,
    ex,
    ts: Date.now(),
  };
}

function toB64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

export function createShareLink(stats: SharedStats): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('share', toB64(JSON.stringify(stats)));
  return url.toString();
}

export function decodeShare(code: string): SharedStats | null {
  try {
    const d = JSON.parse(fromB64(code));
    if (!d || typeof d.id !== 'string' || typeof d.name !== 'string' || typeof d.points !== 'number' || !d.ex) return null;
    for (const t of EXERCISE_TYPES) if (!d.ex[t]) return null;
    return { ...d, name: String(d.name).slice(0, 24) };
  } catch {
    return null;
  }
}

export function getFriends(): SharedStats[] {
  try {
    return JSON.parse(localStorage.getItem(FRIENDS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveFriend(f: SharedStats): SharedStats[] {
  const list = getFriends().filter(x => x.id !== f.id);
  list.push(f);
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(list));
  return list;
}

export function removeFriend(id: string): SharedStats[] {
  const list = getFriends().filter(x => x.id !== id);
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(list));
  return list;
}

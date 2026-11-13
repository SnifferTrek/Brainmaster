import type { ExerciseType, UserProgress } from '../types';
import { getProgress, saveProgress, calculateLevel } from './storage';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  bonus: number;
  target: number;
  unit: string;
}

export interface LiveStats {
  mathBest: number;
  mathRun: number;
  logicBest: number;
  logicRun: number;
  memoryScore: number;
  sessionPoints: number;
  currentScore: number;
}

export interface CompletedChallenge {
  date: string;
  id: string;
  bonus: number;
}

const CHALLENGES_KEY = 'gehirntraining_challenges';

export const CHALLENGES: Challenge[] = [
  { id: 'math5', title: 'Fehlerfreie Rechner', description: 'Löse 5 Mathe-Aufgaben ohne Fehler', emoji: '🧮', bonus: 50, target: 5, unit: 'richtig in Folge' },
  { id: 'memory50', title: 'Gedächtnis-Profi', description: 'Erreiche 50 Punkte bei Memory', emoji: '🃏', bonus: 40, target: 50, unit: 'Punkte' },
  { id: 'all4', title: 'Allrounder', description: 'Spiele alle 4 Übungstypen', emoji: '🎯', bonus: 30, target: 4, unit: 'Übungstypen' },
  { id: 'logic3', title: 'Logik-Serie', description: 'Erreiche eine 3er-Streak bei Logik', emoji: '🧩', bonus: 60, target: 3, unit: 'richtig in Folge' },
  { id: 'session100', title: 'Punktejäger', description: 'Sammle 100 Punkte in einer Session', emoji: '💯', bonus: 70, target: 100, unit: 'Punkte' },
];

export const emptyLiveStats = (sessionPoints = 0): LiveStats => ({
  mathBest: 0, mathRun: 0, logicBest: 0, logicRun: 0, memoryScore: 0, sessionPoints, currentScore: 0,
});

export function localDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getChallengeForDate(dateStr = localDateString()): Challenge {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return CHALLENGES[dayNumber % CHALLENGES.length];
}

export function getCompletedChallenges(): CompletedChallenge[] {
  try {
    const raw = localStorage.getItem(CHALLENGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading challenges:', e);
  }
  return [];
}

export function isChallengeCompleted(id: string, date = localDateString()): boolean {
  return getCompletedChallenges().some(c => c.id === id && c.date === date);
}

export function getChallengeValue(
  challenge: Challenge,
  live: LiveStats,
  playedToday: ExerciseType[],
): number {
  switch (challenge.id) {
    case 'math5': return live.mathBest;
    case 'logic3': return live.logicBest;
    case 'memory50': return live.memoryScore;
    case 'all4': return playedToday.length;
    case 'session100': return live.sessionPoints + live.currentScore;
    default: return 0;
  }
}

export function completeChallenge(challenge: Challenge): UserProgress | null {
  const date = localDateString();
  if (isChallengeCompleted(challenge.id, date)) return null;
  const list = getCompletedChallenges();
  list.push({ date, id: challenge.id, bonus: challenge.bonus });
  try {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving challenges:', e);
  }
  const progress = getProgress();
  progress.totalPoints += challenge.bonus;
  progress.level = calculateLevel(progress.totalPoints);
  saveProgress(progress);
  return progress;
}

export function msUntilMidnight(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

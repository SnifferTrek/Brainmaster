import type { ExerciseType, GameResult, UserProgress } from '../types';
import { getTrainingPlan } from './iqTrainingPlan';
import { getRecommendation } from './trainingPlan';

export interface SessionConfig {
  budgetMinutes: number;
  queue: ExerciseType[];
}

export interface SessionRoundRecord {
  type: ExerciseType;
  result: GameResult;
}

const SESSION_KEY = 'brainmaster_session_active';

const ALL_TYPES: ExerciseType[] = ['logic', 'memory', 'math', 'words'];

export function buildSessionConfig(progress: UserProgress): SessionConfig {
  const plan = getTrainingPlan();
  const rec = getRecommendation(progress);
  const budgetMinutes = plan?.dailyMinutes ?? 10;
  let queue: ExerciseType[];

  if (plan?.planModules?.length) {
    queue = [...new Set(plan.planModules.filter(t => ALL_TYPES.includes(t)))];
  } else {
    const openToday = rec.exercises.filter(e => !rec.done.includes(e));
    queue =
      openToday.length > 0
        ? openToday
        : rec.exercises.length > 0
          ? [...rec.exercises]
          : [...ALL_TYPES];
  }

  return { budgetMinutes, queue };
}

export function exerciseLabel(type: ExerciseType): string {
  const map: Record<ExerciseType, string> = {
    logic: 'Logik',
    memory: 'Gedächtnis',
    math: 'Mathe',
    words: 'Wörter',
  };
  return map[type];
}

export function markSessionActive(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isSessionActive(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function formatSessionTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

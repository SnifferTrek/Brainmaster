import type { UserProgress, ExerciseType } from '../types';
import { getTodayProgress } from './storage';

export type GoalId = 'memory' | 'logic' | 'math' | 'words' | 'balanced' | 'weakness';

export const GOALS: { id: GoalId; title: string; description: string; emoji: string }[] = [
  { id: 'memory', title: 'Gedächtnis verbessern', description: 'Fokus auf Memory-Übungen', emoji: '🃏' },
  { id: 'logic', title: 'Logisches Denken schärfen', description: 'Fokus auf Logik-Übungen', emoji: '🧩' },
  { id: 'math', title: 'Kopfrechnen stärken', description: 'Fokus auf Mathe-Übungen', emoji: '🧮' },
  { id: 'words', title: 'Wortschatz erweitern', description: 'Fokus auf Wort-Übungen', emoji: '📝' },
  { id: 'balanced', title: 'Ausgewogenes Training', description: 'Alle Bereiche gleichmässig', emoji: '⚖️' },
  { id: 'weakness', title: 'Schwächen ausgleichen', description: 'Fokus auf Übungen mit niedrigster Erfolgsrate', emoji: '💪' },
];

const GOAL_KEY = 'gehirntraining_goal';
const ALL: ExerciseType[] = ['memory', 'logic', 'math', 'words'];

export function getGoal(): GoalId | null {
  try {
    const g = localStorage.getItem(GOAL_KEY);
    return GOALS.some(x => x.id === g) ? (g as GoalId) : null;
  } catch {
    return null;
  }
}

export function saveGoal(goal: GoalId): void {
  try {
    localStorage.setItem(GOAL_KEY, goal);
  } catch (e) {
    console.error('Error saving goal:', e);
  }
}

export function getSuccessRate(progress: UserProgress, type: ExerciseType): number | null {
  const s = progress.exerciseStats[type];
  if (!s.played) return null;
  if (s.totalMaxScore) return s.totalPoints / s.totalMaxScore;
  return s.bestScore ? s.totalPoints / s.played / s.bestScore : 0;
}

export interface Recommendation {
  exercises: ExerciseType[];
  done: ExerciseType[];
  next: ExerciseType | null;
}

export function getRecommendation(progress: UserProgress): Recommendation {
  const goal = getGoal();
  const today = getTodayProgress().exercisesCompleted;
  let exercises: ExerciseType[];

  if (goal === 'balanced' || goal === null) {
    exercises = [...ALL];
  } else if (goal === 'weakness') {
    exercises = [...ALL].sort((a, b) => {
      const ra = getSuccessRate(progress, a);
      const rb = getSuccessRate(progress, b);
      return (ra ?? -1) - (rb ?? -1);
    });
  } else {
    const others = ALL.filter(t => t !== goal).sort(
      (a, b) => (getSuccessRate(progress, a) ?? -1) - (getSuccessRate(progress, b) ?? -1)
    );
    exercises = [goal, ...others.slice(0, 2)];
  }

  const done = exercises.filter(e => today.includes(e));
  const next = exercises.find(e => !today.includes(e)) ?? null;
  return { exercises, done, next };
}

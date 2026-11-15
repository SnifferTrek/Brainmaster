import type { UserProgress, ExerciseType } from '../types';
import type { Category } from '../iq/questions';
import { getTodayProgress } from './storage';
import { getTrainingPlan } from './iqTrainingPlan';

const CATEGORY_TO_EXERCISE: Record<Category, ExerciseType> = {
  sequence: 'logic',
  pattern: 'logic',
  logic: 'logic',
  analogy: 'words',
  spatial: 'logic',
  math: 'math',
};

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
  const iqPlan = getTrainingPlan();
  const goal = getGoal();
  const today = getTodayProgress().exercisesCompleted;
  let exercises: ExerciseType[];

  if (iqPlan?.planModules && iqPlan.planModules.length > 0) {
    const selected = iqPlan.planModules.filter(t => ALL.includes(t));
    const rest = ALL.filter(t => !selected.includes(t));
    exercises = [...selected, ...rest];
  } else if (iqPlan && iqPlan.focusAreas.length > 0) {
    const primary = iqPlan.focusAreas[0];
    const focusExercise = primary
      ? ({ sequence: 'logic', pattern: 'logic', logic: 'logic', analogy: 'words', spatial: 'logic', math: 'math' } as const)[
          primary
        ]
      : 'logic';
    const extras = (iqPlan.extraModules ?? []).filter(e => e !== focusExercise);
    const rest = ALL.filter(t => t !== focusExercise && !extras.includes(t));
    exercises = [focusExercise, ...extras, ...rest];
  } else if (goal === 'balanced' || goal === null) {
    exercises = [...ALL];
  } else if (goal === 'weakness') {
    exercises = [...ALL].sort((a, b) => {
      const ra = getSuccessRate(progress, a);
      const rb = getSuccessRate(progress, b);
      return (ra ?? -1) - (rb ?? -1);
    });
  } else {
    const others = ALL.filter(t => t !== goal).sort(
      (a, b) => (getSuccessRate(progress, a) ?? -1) - (getSuccessRate(progress, b) ?? -1),
    );
    exercises = [goal, ...others.slice(0, 2)];
  }

  const seen = new Set<ExerciseType>();
  exercises = exercises.filter(e => {
    if (seen.has(e)) return false;
    seen.add(e);
    return true;
  });

  const done = exercises.filter(e => today.includes(e));
  const next = exercises.find(e => !today.includes(e)) ?? null;
  return { exercises, done, next };
}

export interface DailyGoalStatus {
  total: number;
  done: number;
  reached: boolean;
}

/** Tagesziel = alle geplanten Module bzw. Tages-Empfehlungen mindestens einmal heute. */
export function getDailyGoalStatus(progress: UserProgress): DailyGoalStatus {
  const iqPlan = getTrainingPlan();
  const today = getTodayProgress().exercisesCompleted;
  let targets: ExerciseType[];

  if (iqPlan?.planModules?.length) {
    targets = [...new Set(iqPlan.planModules.filter(t => ALL.includes(t)))];
  } else {
    targets = getRecommendation(progress).exercises;
  }

  const done = targets.filter(t => today.includes(t)).length;
  const total = targets.length;
  return {
    total,
    done,
    reached: total > 0 && done >= total,
  };
}

/** Übungstypen aus IQ-Analyse / Trainingsziel — nur diese erscheinen unter «Für dich vorbereitet». */
export function getPreparedExerciseTypes(progress: UserProgress): ExerciseType[] {
  const iqPlan = getTrainingPlan();
  if (iqPlan?.focusAreas?.length) {
    const types = iqPlan.focusAreas.map(c => CATEGORY_TO_EXERCISE[c]);
    return [...new Set(types)].filter(t => ALL.includes(t));
  }

  const goal = getGoal();
  if (goal && goal !== 'balanced' && goal !== 'weakness') {
    return ALL.includes(goal) ? [goal] : ['logic'];
  }

  if (goal === 'weakness') {
    const ranked = [...ALL].sort((a, b) => {
      const ra = getSuccessRate(progress, a);
      const rb = getSuccessRate(progress, b);
      return (ra ?? -1) - (rb ?? -1);
    });
    return ranked.slice(0, 2);
  }

  const next = getRecommendation(progress).next;
  return [next ?? 'logic'];
}

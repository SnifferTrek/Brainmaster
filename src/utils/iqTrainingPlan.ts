import type { Category } from '../iq/questions';
import type { ExerciseType } from '../types';
import { saveGoal, type GoalId } from './trainingPlan';

const PLAN_KEY = 'brainmaster_training_plan';

export interface TrainingPlanSettings {
  dailyMinutes: number;
  focusAreas: Category[];
  extraModules?: ExerciseType[];
  reminderEnabled: boolean;
  reminderHour?: number;
  createdAt: string;
}

export type TrainingPlanInput = Omit<TrainingPlanSettings, 'createdAt'>;

export function saveTrainingPlan(plan: TrainingPlanInput): void {
  const full: TrainingPlanSettings = { ...plan, createdAt: new Date().toISOString() };
  localStorage.setItem(PLAN_KEY, JSON.stringify(full));
  applyPlanToGoals(plan.focusAreas);
}

export function getTrainingPlan(): TrainingPlanSettings | null {
  try {
    const stored = localStorage.getItem(PLAN_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as TrainingPlanSettings;
    return parsed.createdAt ? parsed : { ...parsed, createdAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

const CATEGORY_TO_GOAL: Record<Category, GoalId> = {
  sequence: 'logic',
  pattern: 'logic',
  logic: 'logic',
  analogy: 'words',
  spatial: 'logic',
  math: 'math',
};

export function applyPlanToGoals(focusAreas: Category[]): void {
  const primary = focusAreas[0];
  if (primary) saveGoal(CATEGORY_TO_GOAL[primary]);
  else saveGoal('balanced');
}

export function categoryToExerciseLabel(c: Category): string {
  const map: Record<Category, string> = {
    sequence: 'Logik / Zahlen',
    pattern: 'Logik',
    logic: 'Logik',
    analogy: 'Wörter',
    spatial: 'Logik',
    math: 'Mathe',
  };
  return map[c];
}

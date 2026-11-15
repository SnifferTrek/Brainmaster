import type { Category } from '../iq/questions';
import type { ExerciseType } from '../types';
import { getReminderPrefs } from './reminder';
import { saveGoal, type GoalId } from './trainingPlan';

const PLAN_KEY = 'brainmaster_training_plan';

export interface TrainingPlanSettings {
  dailyMinutes: number;
  focusAreas: Category[];
  planModules?: ExerciseType[];
  extraModules?: ExerciseType[];
  reminderEnabled: boolean;
  reminderHour?: number;
  createdAt: string;
}

const ALL_EXERCISES: ExerciseType[] = ['logic', 'memory', 'math', 'words'];

export function getPlanModules(): ExerciseType[] {
  return getTrainingPlan()?.planModules ?? [];
}

export function isPlanModuleSelected(t: ExerciseType): boolean {
  const m = getPlanModules();
  return m.length > 0 ? m.includes(t) : false;
}

export function setPlanModules(modules: ExerciseType[]): void {
  const plan = getTrainingPlan();
  const unique = [...new Set(modules)].filter(m => ALL_EXERCISES.includes(m));
  if (plan) {
    saveTrainingPlan({ ...plan, planModules: unique.length > 0 ? unique : undefined });
  } else if (unique.length > 0) {
    saveTrainingPlan({
      dailyMinutes: 10,
      focusAreas: [],
      planModules: unique,
      reminderEnabled: getReminderPrefs().enabled,
      reminderHour: getReminderPrefs().hour,
    });
  }
}

export function togglePlanModule(t: ExerciseType): ExerciseType[] {
  const plan = getTrainingPlan();
  const current = plan?.planModules ?? [];
  const next = current.includes(t) ? current.filter(x => x !== t) : [...current, t];
  if (plan) {
    saveTrainingPlan({ ...plan, planModules: next.length > 0 ? next : undefined });
  } else {
    saveTrainingPlan({
      dailyMinutes: 10,
      focusAreas: [],
      planModules: next,
      reminderEnabled: getReminderPrefs().enabled,
      reminderHour: getReminderPrefs().hour,
    });
  }
  return next;
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
  working_memory: 'memory',
  processing_speed: 'logic',
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
    working_memory: 'Gedächtnis',
    processing_speed: 'Logik / Tempo',
  };
  return map[c];
}

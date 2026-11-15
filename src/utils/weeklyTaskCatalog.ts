import catalog from '../data/weeklyTasks.json';
import type { WeeklyChallengeTask } from './weeklyChallenge';

const ENABLED_KEY = 'brainmaster_weekly_tasks_enabled';

export const WEEKLY_TASK_CATEGORIES = [
  'alle',
  'sprache',
  'bewegung',
  'sozial',
  'sinne',
  'kreativ',
  'fokus',
  'alltag',
  'natur',
  'lernen',
  'gedächtnis',
] as const;

export type WeeklyTaskCategory = (typeof WEEKLY_TASK_CATEGORIES)[number];

export interface WeeklyTasksFile {
  version: number;
  tasks: WeeklyChallengeTask[];
}

export const weeklyTasksCatalog: WeeklyChallengeTask[] = (catalog as WeeklyTasksFile).tasks;

/** Alle IDs, die in der Wochen-Rotation erscheinen dürfen. Leer = wieder alle Standard-8 aktiv (Migration). */
export function getEnabledTaskIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ENABLED_KEY);
    if (!raw) {
      return new Set(weeklyTasksCatalog.map(t => t.id));
    }
    const ids = JSON.parse(raw) as string[];
    const valid = ids.filter(id => weeklyTasksCatalog.some(t => t.id === id));
    if (valid.length === 0) {
      return new Set(weeklyTasksCatalog.map(t => t.id));
    }
    return new Set(valid);
  } catch {
    return new Set(weeklyTasksCatalog.map(t => t.id));
  }
}

export function saveEnabledTaskIds(ids: Iterable<string>): void {
  localStorage.setItem(ENABLED_KEY, JSON.stringify([...ids]));
}

export function isTaskEnabled(id: string): boolean {
  return getEnabledTaskIds().has(id);
}

export function setTaskEnabled(id: string, enabled: boolean): void {
  const next = getEnabledTaskIds();
  if (enabled) next.add(id);
  else next.delete(id);
  if (next.size === 0) {
    next.add(id);
  }
  saveEnabledTaskIds(next);
}

export function setAllTasksEnabled(enabled: boolean): void {
  if (enabled) {
    saveEnabledTaskIds(weeklyTasksCatalog.map(t => t.id));
  } else {
    saveEnabledTaskIds([weeklyTasksCatalog[0].id]);
  }
}

export function getActiveWeeklyTasks(): WeeklyChallengeTask[] {
  const enabled = getEnabledTaskIds();
  return weeklyTasksCatalog.filter(t => enabled.has(t.id));
}

export function countEnabledTasks(): { enabled: number; total: number } {
  const enabled = getEnabledTaskIds().size;
  return { enabled, total: weeklyTasksCatalog.length };
}
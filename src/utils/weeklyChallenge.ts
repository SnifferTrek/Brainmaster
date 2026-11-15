import { getActiveWeeklyTasks, weeklyTasksCatalog } from './weeklyTaskCatalog';

const STORAGE_KEY = 'brainmaster_weekly_challenge';

export interface WeeklyChallengeTask {
  id: string;
  title: string;
  hint: string;
  emoji: string;
  category?: string;
}

/** @deprecated Nutze weeklyTasksCatalog aus weeklyTaskCatalog.ts — Export für Abwärtskompatibilität */
export const WEEKLY_TASKS: WeeklyChallengeTask[] = weeklyTasksCatalog;

export interface WeeklyChallengeState {
  weekKey: string;
  taskId: string;
  completedAt: string | null;
}

function getISOWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function loadState(): WeeklyChallengeState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WeeklyChallengeState;
  } catch {
    return null;
  }
}

function saveState(state: WeeklyChallengeState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function findTaskById(taskId: string): WeeklyChallengeTask | undefined {
  return weeklyTasksCatalog.find(t => t.id === taskId);
}

function pickTaskForWeek(weekKey: string): WeeklyChallengeTask {
  const pool = getActiveWeeklyTasks();
  const list = pool.length > 0 ? pool : weeklyTasksCatalog;
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) hash = (hash * 31 + weekKey.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

export function getCurrentWeeklyChallenge(): { weekKey: string; task: WeeklyChallengeTask; completed: boolean } {
  const weekKey = getISOWeekKey();
  const stored = loadState();
  const pool = getActiveWeeklyTasks();
  const poolIds = new Set(pool.map(t => t.id));

  if (stored?.weekKey === weekKey) {
    const fromStored = findTaskById(stored.taskId);
    const task =
      fromStored && poolIds.has(fromStored.id) ? fromStored : pickTaskForWeek(weekKey);
    if (fromStored && !poolIds.has(fromStored.id)) {
      saveState({ weekKey, taskId: task.id, completedAt: stored.completedAt });
    }
    return { weekKey, task, completed: !!stored.completedAt };
  }
  const task = pickTaskForWeek(weekKey);
  saveState({ weekKey, taskId: task.id, completedAt: null });
  return { weekKey, task, completed: false };
}

export function toggleWeeklyChallengeDone(): boolean {
  const weekKey = getISOWeekKey();
  const current = getCurrentWeeklyChallenge();
  const nextDone = !current.completed;
  saveState({
    weekKey,
    taskId: current.task.id,
    completedAt: nextDone ? new Date().toISOString() : null,
  });
  return nextDone;
}

export function formatWeekLabel(weekKey: string): string {
  const week = weekKey.split('-W')[1] ?? '';
  return week ? `Kalenderwoche ${parseInt(week, 10)}` : weekKey;
}

/** Nach Änderung der Häkchen: Woche neu zuordnen, wenn aktuelle Aufgabe deaktiviert wurde. */
export function refreshWeeklyChallengeAfterCatalogChange(): void {
  const weekKey = getISOWeekKey();
  const stored = loadState();
  const pool = getActiveWeeklyTasks();
  if (pool.length === 0) return;
  if (stored?.weekKey === weekKey) {
    if (!pool.some(t => t.id === stored.taskId)) {
      const task = pickTaskForWeek(weekKey);
      saveState({ weekKey, taskId: task.id, completedAt: null });
    }
  }
}
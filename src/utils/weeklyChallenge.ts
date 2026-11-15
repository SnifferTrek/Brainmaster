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
  /** null = Vorschlag, Nutzer muss akzeptieren oder wechseln */
  acceptedAt: string | null;
  completedAt: string | null;
  /** Diese Woche nicht mehr vorschlagen (bereits / später) */
  skippedTaskIds: string[];
  deferredTaskIds: string[];
}

export interface WeeklyChallengeView {
  weekKey: string;
  task: WeeklyChallengeTask;
  accepted: boolean;
  completed: boolean;
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
    const parsed = JSON.parse(raw) as WeeklyChallengeState & { acceptedAt?: string | null };
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

function normalizeState(stored: WeeklyChallengeState & { acceptedAt?: string | null }): WeeklyChallengeState {
  const legacyAutoAccept = !('acceptedAt' in stored);
  return {
    weekKey: stored.weekKey,
    taskId: stored.taskId,
    acceptedAt: legacyAutoAccept ? new Date().toISOString() : stored.acceptedAt ?? null,
    completedAt: stored.completedAt ?? null,
    skippedTaskIds: stored.skippedTaskIds ?? [],
    deferredTaskIds: stored.deferredTaskIds ?? [],
  };
}

function createEmptyStateForWeek(weekKey: string): WeeklyChallengeState {
  const task = pickNextTask(weekKey, new Set());
  return {
    weekKey,
    taskId: task.id,
    acceptedAt: null,
    completedAt: null,
    skippedTaskIds: [],
    deferredTaskIds: [],
  };
}

function saveState(state: WeeklyChallengeState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function findTaskById(taskId: string): WeeklyChallengeTask | undefined {
  return weeklyTasksCatalog.find(t => t.id === taskId);
}

function getPoolExcluding(exclude: Set<string>): WeeklyChallengeTask[] {
  const pool = getActiveWeeklyTasks().filter(t => !exclude.has(t.id));
  if (pool.length > 0) return pool;
  const fallback = weeklyTasksCatalog.filter(t => !exclude.has(t.id));
  if (fallback.length > 0) return fallback;
  return getActiveWeeklyTasks().length > 0 ? getActiveWeeklyTasks() : weeklyTasksCatalog;
}

function pickNextTask(weekKey: string, exclude: Set<string>): WeeklyChallengeTask {
  const list = getPoolExcluding(exclude);
  let hash = exclude.size;
  for (let i = 0; i < weekKey.length; i++) hash = (hash * 31 + weekKey.charCodeAt(i)) >>> 0;
  hash = (hash * 31 + exclude.size) >>> 0;
  return list[hash % list.length];
}

function resolveTaskForState(state: WeeklyChallengeState): WeeklyChallengeTask {
  const poolIds = new Set(getActiveWeeklyTasks().map(t => t.id));
  const found = findTaskById(state.taskId);
  if (found && poolIds.has(found.id)) return found;
  const next = pickNextTask(state.weekKey, new Set(state.skippedTaskIds));
  return next;
}

export function getCurrentWeeklyChallenge(): WeeklyChallengeView {
  const weekKey = getISOWeekKey();
  let stored = loadState();

  if (!stored || stored.weekKey !== weekKey) {
    stored = createEmptyStateForWeek(weekKey);
    saveState(stored);
  }

  const task = resolveTaskForState(stored);
  if (task.id !== stored.taskId) {
    stored = { ...stored, taskId: task.id, acceptedAt: null, completedAt: null };
    saveState(stored);
  }

  return {
    weekKey,
    task,
    accepted: !!stored.acceptedAt,
    completed: !!stored.completedAt,
  };
}

function currentStateOrWeek(): WeeklyChallengeState {
  const weekKey = getISOWeekKey();
  let stored = loadState();
  if (!stored || stored.weekKey !== weekKey) {
    stored = createEmptyStateForWeek(weekKey);
    saveState(stored);
  }
  return stored;
}

export type WeeklySkipReason = 'already' | 'later';

export function acceptWeeklyChallenge(taskId?: string): void {
  const state = currentStateOrWeek();
  const task = taskId ? findTaskById(taskId) : resolveTaskForState(state);
  if (!task) return;
  saveState({
    ...state,
    taskId: task.id,
    acceptedAt: new Date().toISOString(),
    completedAt: null,
  });
}

/** Vorschlag für eine bestimmte Aufgabe (z. B. aus Katalog) — noch nicht akzeptiert */
export function proposeWeeklyChallengeTask(taskId: string): void {
  const task = findTaskById(taskId);
  if (!task) return;
  const state = currentStateOrWeek();
  saveState({
    ...state,
    taskId: task.id,
    acceptedAt: null,
    completedAt: null,
  });
}

export function skipWeeklyChallenge(reason: WeeklySkipReason): WeeklyChallengeTask {
  const state = currentStateOrWeek();
  const skip = new Set(state.skippedTaskIds);
  skip.add(state.taskId);
  const deferred = [...state.deferredTaskIds];
  if (reason === 'later' && !deferred.includes(state.taskId)) {
    deferred.push(state.taskId);
  }
  const next = pickNextTask(state.weekKey, skip);
  saveState({
    ...state,
    taskId: next.id,
    acceptedAt: null,
    completedAt: null,
    skippedTaskIds: [...skip],
    deferredTaskIds: deferred,
  });
  return next;
}

export function toggleWeeklyChallengeDone(): boolean {
  const state = currentStateOrWeek();
  if (!state.acceptedAt) return false;
  const nextDone = !state.completedAt;
  saveState({
    ...state,
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
  if (pool.length === 0 || !stored || stored.weekKey !== weekKey) return;
  if (!pool.some(t => t.id === stored.taskId)) {
    const skip = new Set(stored.skippedTaskIds);
    const task = pickNextTask(weekKey, skip);
    saveState({
      ...stored,
      taskId: task.id,
      acceptedAt: stored.acceptedAt,
      completedAt: null,
    });
  }
}
const STORAGE_KEY = 'brainmaster_weekly_challenge';

export interface WeeklyChallengeTask {
  id: string;
  title: string;
  hint: string;
  emoji: string;
}

/** Rotierende Impulse für Körper, Alltag & Sprache — nicht automatisch messbar, Nutzer markiert selbst. */
export const WEEKLY_TASKS: WeeklyChallengeTask[] = [
  {
    id: 'words5',
    title: '5 Wörter in einer anderen Sprache',
    hint: 'z. B. Vokabeln notieren oder flüstern beim Spazieren',
    emoji: '🗣️',
  },
  {
    id: 'new-route',
    title: 'Einen anderen Weg fahren oder gehen',
    hint: 'Neue Route zur Arbeit, zum Einkaufen oder Spaziergang',
    emoji: '🛤️',
  },
  {
    id: 'no-phone-walk',
    title: '10 Minuten spazieren ohne Handy',
    hint: 'Bewusst wahrnehmen: Geräusche, Gerüche, Richtungen',
    emoji: '🚶',
  },
  {
    id: 'explain',
    title: 'Einem Kind etwas Einfaches erklären',
    hint: 'Oder einem Freund ein Konzept in 3 Sätzen',
    emoji: '💬',
  },
  {
    id: 'write-hand',
    title: 'Eine Notiz handschriftlich schreiben',
    hint: 'Einkaufsliste, Tagebuch oder Postkarte',
    emoji: '✍️',
  },
  {
    id: 'music-focus',
    title: 'Ein Lied aktiv anhören',
    hint: 'Text oder Instrumente bewusst erkennen',
    emoji: '🎧',
  },
  {
    id: 'cook-new',
    title: 'Ein neues Rezept oder Zutat ausprobieren',
    hint: 'Kleine Abwandlung reicht',
    emoji: '🍳',
  },
  {
    id: 'gratitude',
    title: '3 Dinge aufschreiben, die gut liefen',
    hint: 'Fördert Aufmerksamkeit und Positivität',
    emoji: '📝',
  },
];

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

function pickTaskForWeek(weekKey: string): WeeklyChallengeTask {
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) hash = (hash * 31 + weekKey.charCodeAt(i)) >>> 0;
  return WEEKLY_TASKS[hash % WEEKLY_TASKS.length];
}

export function getCurrentWeeklyChallenge(): { weekKey: string; task: WeeklyChallengeTask; completed: boolean } {
  const weekKey = getISOWeekKey();
  const stored = loadState();
  if (stored?.weekKey === weekKey) {
    const task = WEEKLY_TASKS.find(t => t.id === stored.taskId) ?? pickTaskForWeek(weekKey);
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
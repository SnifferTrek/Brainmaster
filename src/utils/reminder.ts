import { getTrainingPlan, saveTrainingPlan } from './iqTrainingPlan';
import { getTodayProgress } from './storage';
import { getRecommendation } from './trainingPlan';
import type { UserProgress } from '../types';

const REMINDER_KEY = 'brainmaster_reminder_prefs';

export interface ReminderPrefs {
  enabled: boolean;
  hour: number;
}

const DEFAULT: ReminderPrefs = { enabled: false, hour: 18 };

function readPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw) return { ...DEFAULT, ...(JSON.parse(raw) as ReminderPrefs) };
  } catch {
    /* ignore */
  }
  const plan = getTrainingPlan();
  if (plan) return { enabled: plan.reminderEnabled, hour: plan.reminderHour ?? DEFAULT.hour };
  return { ...DEFAULT };
}

function writePrefs(prefs: ReminderPrefs): void {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(prefs));
  const plan = getTrainingPlan();
  if (plan) {
    saveTrainingPlan({
      dailyMinutes: plan.dailyMinutes,
      focusAreas: plan.focusAreas,
      extraModules: plan.extraModules,
      reminderEnabled: prefs.enabled,
      reminderHour: prefs.hour,
    });
  }
}

export function getReminderPrefs(): ReminderPrefs {
  return readPrefs();
}

export function setReminderEnabled(enabled: boolean): void {
  writePrefs({ ...readPrefs(), enabled });
}

export function setReminderHour(hour: number): void {
  const h = Math.min(23, Math.max(0, Math.round(hour)));
  writePrefs({ ...readPrefs(), hour: h });
}

/** Heute noch kein Training, Erinnerung aktiv → Banner auf dem Start-Tab. */
export function shouldShowReminderBanner(progress: UserProgress): boolean {
  const { enabled } = readPrefs();
  if (!enabled) return false;
  const today = getTodayProgress().exercisesCompleted;
  if (today.length > 0) return false;
  const rec = getRecommendation(progress);
  return rec.next !== null || getTrainingPlan() !== null;
}

export function reminderBannerText(): string {
  const { hour } = readPrefs();
  const h = String(hour).padStart(2, '0');
  return `Heute noch nicht trainiert — Tägliche Erinnerung um ${h}:00 Uhr.`;
}

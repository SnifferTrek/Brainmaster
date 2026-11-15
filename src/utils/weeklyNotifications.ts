import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getCurrentWeeklyChallenge, formatWeekLabel } from './weeklyChallenge';

const PREFS_KEY = 'brainmaster_weekly_notif_prefs';
const NOTIFICATION_ID = 9001;

export interface WeeklyNotificationPrefs {
  enabled: boolean;
  /** Capacitor: 1 = Sonntag … 7 = Samstag; Standard Montag = 2 */
  weekday: number;
  hour: number;
}

const DEFAULT: WeeklyNotificationPrefs = { enabled: false, weekday: 2, hour: 9 };

export function getWeeklyNotificationPrefs(): WeeklyNotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT, ...(JSON.parse(raw) as WeeklyNotificationPrefs) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT };
}

export function setWeeklyNotificationPrefs(partial: Partial<WeeklyNotificationPrefs>): WeeklyNotificationPrefs {
  const next = { ...getWeeklyNotificationPrefs(), ...partial };
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

export function isNativeNotificationsAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/** Plant Wiederholung wöchentlich; Text = aktueller Impuls (beim Sync aktualisiert). */
export async function syncWeeklyNotification(): Promise<'scheduled' | 'disabled' | 'web' | 'denied' | 'error'> {
  const prefs = getWeeklyNotificationPrefs();
  if (!Capacitor.isNativePlatform()) return 'web';

  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    if (!prefs.enabled) return 'disabled';

    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return 'denied';

    const { task, weekKey } = getCurrentWeeklyChallenge();
    const weekday = Math.min(7, Math.max(1, prefs.weekday));
    const hour = Math.min(23, Math.max(0, prefs.hour));

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: 'Brainmaster — Impuls der Woche',
          body: `${task.emoji} ${task.title} · ${formatWeekLabel(weekKey)}`,
          schedule: {
            on: { weekday, hour, minute: 0 },
            repeats: true,
            every: 'week',
          },
        },
      ],
    });
    return 'scheduled';
  } catch {
    return 'error';
  }
}

export const WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: 'Sonntag' },
  { value: 2, label: 'Montag' },
  { value: 3, label: 'Dienstag' },
  { value: 4, label: 'Mittwoch' },
  { value: 5, label: 'Donnerstag' },
  { value: 6, label: 'Freitag' },
  { value: 7, label: 'Samstag' },
];
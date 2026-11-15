import { useEffect, useMemo, useRef, useState } from 'react';
import ProfileCard from './ProfileCard';
import type { UserProgress } from '../types';
import { getReminderPrefs, setReminderEnabled, setReminderHour } from '../utils/reminder';
import {
  getWeeklyNotificationPrefs,
  setWeeklyNotificationPrefs,
  syncWeeklyNotification,
  WEEKDAY_LABELS,
  isNativeNotificationsAvailable,
} from '../utils/weeklyNotifications';
import WeeklyTaskCatalog from './WeeklyTaskCatalog';
import { refreshWeeklyChallengeAfterCatalogChange } from '../utils/weeklyChallenge';
import { consumeWeeklyCatalogFocus } from '../utils/weeklyCatalogFocus';
import { NAME_KEY, buildProfile } from '../utils/profile';
import { getProfile } from '../utils/social';

interface SettingsProps {
  progress: UserProgress;
  onBack: () => void;
  onRepeatIntro: () => void;
  onShare: () => void;
  onShowFriends: () => void;
  friendCount: number;
}

export default function Settings({
  progress,
  onBack,
  onRepeatIntro,
  onShare,
  onShowFriends,
  friendCount,
}: SettingsProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [reminder, setReminder] = useState(() => getReminderPrefs());
  const [weeklyNotif, setWeeklyNotif] = useState(() => getWeeklyNotificationPrefs());
  const [notifStatus, setNotifStatus] = useState<string | null>(null);
  const catalogRef = useRef<HTMLElement>(null);
  const displayName = localStorage.getItem(NAME_KEY) || getProfile()?.name || '';
  const profilePreview = useMemo(() => buildProfile(progress), [progress, displayName]);

  const toggleReminder = () => {
    const next = !reminder.enabled;
    setReminderEnabled(next);
    setReminder({ ...reminder, enabled: next });
  };

  const changeHour = (h: number) => {
    setReminderHour(h);
    setReminder({ ...reminder, hour: h });
  };

  const applyWeeklyNotif = async (partial: Partial<typeof weeklyNotif>) => {
    const next = setWeeklyNotificationPrefs(partial);
    setWeeklyNotif(next);
    const result = await syncWeeklyNotification();
    if (result === 'scheduled') setNotifStatus('Wochenimpuls wird am Sperrbildschirm eingeplant.');
  else if (result === 'denied') setNotifStatus('Bitte Benachrichtigungen in den iOS-Einstellungen erlauben.');
  else if (result === 'web') setNotifStatus('Nur in der installierten iOS-App verfügbar.');
  else if (result === 'disabled') setNotifStatus(null);
    else setNotifStatus('Planung fehlgeschlagen — bitte erneut versuchen.');
    if (result === 'scheduled') setTimeout(() => setNotifStatus(null), 4000);
  };

  const toggleWeeklyNotif = () => applyWeeklyNotif({ enabled: !weeklyNotif.enabled });

  const handleCatalogChange = () => {
    refreshWeeklyChallengeAfterCatalogChange();
    syncWeeklyNotification().catch(() => {});
  };

  useEffect(() => {
    if (consumeWeeklyCatalogFocus() && catalogRef.current) {
      catalogRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-800 mb-4 text-sm">← Zurück</button>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Einstellungen</h1>

      <section className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Community</h2>
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50/80 mb-3 hover:bg-gray-50"
        >
          <ProfilePreview
            displayName={displayName}
            rank={profilePreview.rank.title}
            emoji={profilePreview.rank.emoji}
            level={profilePreview.level}
          />
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onShare} className="card-hover text-center py-4">
            <div className="text-2xl">📤</div>
            <div className="text-sm font-medium text-gray-700">Fortschritt teilen</div>
          </button>
          <button type="button" onClick={onShowFriends} className="card-hover text-center py-4">
            <div className="text-2xl">👥</div>
            <div className="text-sm font-medium text-gray-700">Freunde{friendCount > 0 ? ` (${friendCount})` : ''}</div>
          </button>
        </div>
        {showProfile && <ProfileCard progress={progress} onClose={() => setShowProfile(false)} />}
      </section>

      <section ref={catalogRef} className="card mb-4 border border-violet-100">
        <h2 className="text-sm font-semibold text-violet-700 uppercase tracking-wide mb-1">Wochenaktionen</h2>
        <p className="text-xs text-gray-500 mb-3">
          100 Ideen im Katalog — tippe zum Aktivieren (Häkchen). Nur markierte kommen als «Impuls der Woche» vor.
        </p>
        <WeeklyTaskCatalog onSelectionChange={handleCatalogChange} />
      </section>

      <section className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Training</h2>
        <div className="flex items-center justify-between gap-4 py-3 min-h-[56px]">
          <span className="font-medium text-gray-800 text-base">Tägliche Erinnerung</span>
          {reminder.enabled && (
            <select
              className="rounded-lg border border-gray-200 px-2 py-2 text-sm max-w-[5.5rem]"
              value={reminder.hour}
              onChange={e => changeHour(Number(e.target.value))}
              aria-label="Erinnerungs-Uhrzeit"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
          )}
          <button
            type="button"
            role="switch"
            aria-checked={reminder.enabled}
            onClick={toggleReminder}
            className={`relative shrink-0 w-16 h-10 rounded-full transition-colors ${reminder.enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 left-1 w-8 h-8 rounded-full bg-white shadow transition-transform ${reminder.enabled ? 'translate-x-6' : ''}`}
            />
          </button>
        </div>

        <div className="border-t border-gray-100 mt-4 pt-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0">
              <span className="font-medium text-gray-800 text-base block">Wochenimpuls (Sperrbildschirm)</span>
              <span className="text-xs text-gray-500">Lokale Benachrichtigung mit der Aufgabe der Woche</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={weeklyNotif.enabled}
              onClick={toggleWeeklyNotif}
              className={`relative shrink-0 w-16 h-10 rounded-full transition-colors ${weeklyNotif.enabled ? 'bg-violet-600' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-1 left-1 w-8 h-8 rounded-full bg-white shadow transition-transform ${weeklyNotif.enabled ? 'translate-x-6' : ''}`}
              />
            </button>
          </div>
          {weeklyNotif.enabled && isNativeNotificationsAvailable() && (
            <div className="flex flex-wrap gap-2 mb-2">
              <select
                className="rounded-lg border border-gray-200 px-2 py-2 text-sm flex-1 min-w-[8rem]"
                value={weeklyNotif.weekday}
                onChange={e => applyWeeklyNotif({ weekday: Number(e.target.value) })}
                aria-label="Wochentag"
              >
                {WEEKDAY_LABELS.map(d => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-gray-200 px-2 py-2 text-sm max-w-[5.5rem]"
                value={weeklyNotif.hour}
                onChange={e => applyWeeklyNotif({ hour: Number(e.target.value) })}
                aria-label="Uhrzeit Wochenimpuls"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          )}
          {notifStatus && <p className="text-xs text-violet-800 mb-2">{notifStatus}</p>}
          <p className="text-[10px] text-gray-400 mt-2">
            Benachrichtigung nutzt dieselben aktivierten Wochenaktionen wie oben.
          </p>
        </div>
      </section>

      <section className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">App</h2>
        <button
          type="button"
          onClick={onRepeatIntro}
          className="w-full text-left py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-800 font-medium"
        >
          Einführung wiederholen
        </button>
      </section>

      <section className="card border border-red-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Daten</h2>
        <p className="text-sm text-gray-500 mb-3">
          Löscht alle lokalen Daten und startet die App wie beim ersten Mal.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Wirklich alle Daten löschen und als Erstbenutzer neu starten?')) {
              localStorage.clear();
              sessionStorage.clear();
              window.location.reload();
            }
          }}
          className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100"
        >
          Als Erstbenutzer starten
        </button>
      </section>
    </div>
  );
}

function ProfilePreview({
  displayName,
  rank,
  emoji,
  level,
}: {
  displayName: string;
  rank: string;
  emoji: string;
  level: number;
}) {
  const name = displayName.trim() || `Spieler · Stufe ${level}`;
  return (
    <>
      <div className="text-xs text-gray-500 mb-1">Profil · So sehen dich Freunde im Vergleich</div>
      <div className="font-semibold text-gray-800">{name}</div>
      <div className="text-sm text-gray-600 mt-0.5">
        {emoji} {rank}
      </div>
    </>
  );
}

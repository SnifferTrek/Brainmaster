import { useMemo, useState } from 'react';
import ProfileCard from './ProfileCard';
import type { UserProgress } from '../types';
import { getReminderPrefs, setReminderEnabled, setReminderHour } from '../utils/reminder';
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

import { useState } from 'react';
import ProfileCard from './ProfileCard';
import type { UserProgress } from '../types';
import { getReminderPrefs, setReminderEnabled, setReminderHour } from '../utils/reminder';

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
        <div className="grid grid-cols-3 gap-3">
          <button type="button" onClick={() => setShowProfile(true)} className="card-hover text-center py-4">
            <div className="text-2xl">🎴</div>
            <div className="text-sm font-medium text-gray-700">Profil</div>
          </button>
          <button type="button" onClick={onShare} className="card-hover text-center py-4">
            <div className="text-2xl">📤</div>
            <div className="text-sm font-medium text-gray-700">Teilen</div>
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
        <div className="flex items-center justify-between py-2 mb-3">
          <div>
            <span className="font-medium text-gray-800">Tägliche Erinnerung</span>
            <p className="text-xs text-gray-500 mt-0.5">Hinweis auf dem Start-Tab, wenn du heute noch nicht trainiert hast</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminder.enabled}
            onClick={toggleReminder}
            className={`relative w-14 h-8 rounded-full transition-colors ${reminder.enabled ? 'bg-primary-600' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${reminder.enabled ? 'translate-x-6' : ''}`}
            />
          </button>
        </div>
        {reminder.enabled && (
          <label className="block text-sm text-gray-600">
            Erinnerungs-Uhrzeit (optional)
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              value={reminder.hour}
              onChange={e => changeHour(Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
          </label>
        )}
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

import { getRecommendation } from '../utils/trainingPlan';
import type { UserProgress, ExerciseType } from '../types';
import { getDifficultyLabel } from '../utils/storage';
import { effectiveLevelHint, getEffectiveLevelInfo } from '../utils/trainingLevel';
import { getTrainingPlan } from '../utils/iqTrainingPlan';
import { reminderBannerText, shouldShowReminderBanner } from '../utils/reminder';

interface DashboardProps {
  progress: UserProgress;
  onSelectExercise: (type: ExerciseType) => void;
  onStartIQ: () => void;
  onShowPlan: () => void;
  onStartSession: () => void;
}

const exercises = [
  { type: 'logic' as ExerciseType, title: 'Logik-Rätsel', emoji: '🧩' },
  { type: 'memory' as ExerciseType, title: 'Gedächtnis', emoji: '🃏' },
  { type: 'math' as ExerciseType, title: 'Kopfrechnen', emoji: '🧮' },
  { type: 'words' as ExerciseType, title: 'Wortspiele', emoji: '📝' },
];

export default function Dashboard({ progress, onSelectExercise, onStartIQ, onShowPlan, onStartSession }: DashboardProps) {
  const recommended = getRecommendation(progress).next;
  const levelInfo = getEffectiveLevelInfo();
  const levelHint = effectiveLevelHint(levelInfo);
  const iqPlan = getTrainingPlan();
  const startType = recommended ?? 'logic';
  const startMeta = exercises.find(e => e.type === startType)!;
  const showReminder = shouldShowReminderBanner(progress);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
      <header className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          🧠 Gehirntraining
        </h1>
        <p className="text-gray-500 text-sm">Kurz starten, dranbleiben.</p>
      </header>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 card py-3 text-center">
          <div className="text-xl font-bold text-gray-800">⭐ {levelInfo.effective}</div>
          <div className="text-xs text-gray-500">Übungsstufe</div>
        </div>
        <div className="flex-1 card py-3 text-center">
          <div className="text-xl font-bold text-gray-800">🔥 {progress.currentStreak}</div>
          <div className="text-xs text-gray-500">Tage Streak</div>
        </div>
        <div className="flex-1 card py-3 text-center">
          <div className="text-xl font-bold text-gray-800">L{progress.level}</div>
          <div className="text-xs text-gray-500">Level</div>
        </div>
      </div>

      {levelHint && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {levelHint}
        </p>
      )}

      {showReminder && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="font-semibold">🔔 </span>
          {reminderBannerText()}
          <button type="button" onClick={onStartSession} className="block mt-2 font-semibold text-blue-700 underline">
            Jetzt trainieren
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={iqPlan ? onStartSession : () => onSelectExercise(startType)}
        className="w-full mb-6 p-6 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 text-white text-left shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="text-sm font-medium opacity-90 mb-1">{iqPlan ? 'Los — Training-Session' : 'Training starten'}</div>
        <div className="text-2xl font-bold flex items-center gap-2">
          <span>{startMeta.emoji}</span> {iqPlan ? 'Plan-Training starten' : startMeta.title}
        </div>
        <p className="text-sm mt-2 opacity-90">
          {iqPlan
            ? `${iqPlan.dailyMinutes} Min · Schwerpunkt ${startMeta.title}`
            : `Stufe ${progress.difficulty[startType].level} · ${getDifficultyLabel(progress.difficulty[startType].level)}`}
        </p>
      </button>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Alle Übungen</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {exercises.map(exercise => (
          <button
            key={exercise.type}
            type="button"
            onClick={() => onSelectExercise(exercise.type)}
            className="card-hover text-left p-4"
          >
            <span className="text-2xl">{exercise.emoji}</span>
            <div className="font-semibold text-gray-800 mt-1">{exercise.title}</div>
            <p className="text-xs text-gray-500 mt-1">Stufe {progress.difficulty[exercise.type].level}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onShowPlan}
          className="card py-4 text-center font-semibold text-gray-700 hover:bg-gray-50"
        >
          🎯 Plan
        </button>
        <button
          type="button"
          onClick={onStartIQ}
          className="card py-4 text-center font-semibold text-blue-800 bg-blue-50 border border-blue-100 hover:bg-blue-100"
        >
          🧠 IQ-Test
        </button>
      </div>
    </div>
  );
}

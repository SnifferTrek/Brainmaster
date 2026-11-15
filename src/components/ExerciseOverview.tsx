import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExerciseType, UserProgress } from '../types';
import { getPlanModules, togglePlanModule, isPlanModuleSelected } from '../utils/iqTrainingPlan';
import { effectiveLevelHint, getEffectiveLevelInfo } from '../utils/trainingLevel';
import { getDailyGoalStatus, getPreparedExerciseTypes } from '../utils/trainingPlan';
import { StartScreenBrand } from './BrainLogo';
import WeeklyChallengeCard from './WeeklyChallengeCard';

const CATEGORIES: { type: ExerciseType; label: string; emoji: string }[] = [
  { type: 'logic', label: 'Logik', emoji: '🧩' },
  { type: 'memory', label: 'Gedächtnis', emoji: '🃏' },
  { type: 'math', label: 'Kopfrechnen', emoji: '🧮' },
  { type: 'words', label: 'Wortspiele', emoji: '📝' },
];

const TAB_BASE =
  'flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-semibold leading-tight transition-all sm:text-xs';

function tabSingle(active: boolean) {
  return `${TAB_BASE} ${
    active
      ? 'bg-primary-100 text-primary-900 ring-2 ring-primary-500 shadow-sm'
      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
  }`;
}

function tabMulti(marked: boolean) {
  return `${TAB_BASE} ${
    marked
      ? 'bg-primary-100 text-primary-900 ring-2 ring-primary-500 shadow-sm'
      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
  }`;
}

interface ExerciseOverviewProps {
  type: ExerciseType;
  progress: UserProgress;
  onChangeCategory: (type: ExerciseType) => void;
  onStart: () => void;
  onShowPlan: () => void;
  onStartIQ: () => void;
  onOpenWeeklyCatalog?: () => void;
}

export default function ExerciseOverview({
  type,
  progress,
  onChangeCategory,
  onStart,
  onShowPlan,
  onStartIQ,
  onOpenWeeklyCatalog,
}: ExerciseOverviewProps) {
  const [, bump] = useState(0);
  const levelInfo = getEffectiveLevelInfo();
  const levelHint = effectiveLevelHint(levelInfo);

  const preparedTypes = useMemo(() => getPreparedExerciseTypes(progress), [progress]);

  const preparedTabs = useMemo(
    () => CATEGORIES.filter(c => preparedTypes.includes(c.type)),
    [preparedTypes],
  );

  useEffect(() => {
    if (preparedTypes.length > 0 && !preparedTypes.includes(type)) {
      onChangeCategory(preparedTypes[0]);
    }
  }, [preparedTypes, type, onChangeCategory]);

  const refresh = useCallback(() => bump(n => n + 1), []);

  const toggleExtra = (t: ExerciseType) => {
    togglePlanModule(t);
    refresh();
  };

  const preparedCols = Math.max(preparedTabs.length, 1);
  const dailyGoal = useMemo(() => getDailyGoalStatus(progress), [progress]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
      <header className="mb-4">
        <StartScreenBrand />
        <div className="flex gap-2 mt-4 text-center text-xs">
          <span className="flex-1 card py-2">
            <span className="font-bold text-gray-800">⭐ {levelInfo.effective}</span>
            <span className="block text-gray-500">Übungsstufe</span>
          </span>
          <span className="flex-1 card py-2">
            <span className="font-bold text-gray-800">🔥 {progress.currentStreak}</span>
            <span className="block text-gray-500">Streak</span>
          </span>
        </div>
      </header>

      <WeeklyChallengeCard onOpenCatalog={onOpenWeeklyCatalog} />

      {levelHint && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {levelHint}
        </p>
      )}

      {dailyGoal.reached && (
        <div className="mb-4 rounded-2xl border-2 border-green-300 bg-green-50 px-4 py-4 text-center">
          <p className="text-lg font-bold text-green-900">Tagesziel erreicht</p>
          <p className="text-sm text-green-800 mt-1">
            {dailyGoal.done}/{dailyGoal.total} Übungen für heute erledigt — super!
          </p>
          <p className="text-xs text-green-700 mt-2">Optional: weiter trainieren oder für heute pausieren.</p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Für dich vorbereitet</h2>
        {preparedTabs.length === 0 ? (
          <p className="text-sm text-gray-500 mb-2">
            Nach IQ-Test oder Trainingsziel erscheinen hier deine Schwerpunkte.
          </p>
        ) : (
          <div
            className="grid gap-2 mb-2"
            style={{ gridTemplateColumns: `repeat(${preparedCols}, minmax(0, 1fr))` }}
          >
            {preparedTabs.map(cat => (
              <button
                key={cat.type}
                type="button"
                onClick={() => onChangeCategory(cat.type)}
                aria-pressed={cat.type === type}
                className={tabSingle(cat.type === type)}
              >
                <span className="text-lg leading-none">{cat.emoji}</span>
                <span className="w-full truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Zusätzlich möchte ich trainieren</h2>
        <p className="text-xs text-gray-500 mb-3">Mehrere Bereiche anklicken — alle Markierungen bleiben aktiv.</p>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(cat => {
            const marked = isPlanModuleSelected(cat.type);
            return (
              <button
                key={`extra-${cat.type}`}
                type="button"
                onClick={() => toggleExtra(cat.type)}
                aria-pressed={marked}
                className={tabMulti(marked)}
              >
                <span className="text-lg leading-none">{cat.emoji}</span>
                <span className="w-full truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={onStart}
        className={`w-full py-5 rounded-2xl text-white font-extrabold text-xl shadow-lg hover:shadow-xl transition-shadow ${
          dailyGoal.reached
            ? 'mb-3 bg-gray-800 hover:bg-gray-900'
            : 'mb-6 bg-gradient-to-r from-primary-600 to-accent-600'
        }`}
      >
        {dailyGoal.reached ? 'Weiterlernen' : 'Übungen starten'}
      </button>
      {dailyGoal.reached && (
        <p className="text-xs text-center text-gray-500 mb-6">Zusatzübungen zählen fürs Tagesziel nicht mehr — sind freiwillig.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onShowPlan} className="card py-4 text-center font-semibold text-gray-700 hover:bg-gray-50">
          Plan
        </button>
        <button
          type="button"
          onClick={onStartIQ}
          className="card py-4 text-center font-semibold text-blue-800 bg-blue-50 border border-blue-100 hover:bg-blue-100"
        >
          IQ-Test
        </button>
      </div>
      {getPlanModules().length > 0 && (
        <p className="text-xs text-center text-gray-400 mt-4">
          Zusätzlich im Plan: {getPlanModules().length} Bereich(e)
        </p>
      )}
    </div>
  );
}
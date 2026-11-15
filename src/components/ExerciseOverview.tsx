import { useCallback, useState } from 'react';
import type { ExerciseType, UserProgress } from '../types';
import { getDifficultyLabel } from '../utils/storage';
import { getPlanModules, togglePlanModule, isPlanModuleSelected } from '../utils/iqTrainingPlan';
import { effectiveLevelHint, getEffectiveLevelInfo } from '../utils/trainingLevel';

interface DrillCard {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
}

const CATEGORIES: { type: ExerciseType; label: string; emoji: string }[] = [
  { type: 'logic', label: 'Logik', emoji: '🧩' },
  { type: 'memory', label: 'Gedächtnis', emoji: '🃏' },
  { type: 'math', label: 'Kopfrechnen', emoji: '🧮' },
  { type: 'words', label: 'Wortspiele', emoji: '📝' },
];

const DRILLS: Record<ExerciseType, DrillCard[]> = {
  logic: [
    { id: 'sequence', title: 'Zahlenfolgen', subtitle: 'Muster erkennen', emoji: '🔢' },
    { id: 'pattern', title: 'Muster', subtitle: 'Regeln finden', emoji: '🧩' },
    { id: 'odd', title: 'Ausreißer', subtitle: 'Das Ungleiche finden', emoji: '🎯' },
  ],
  memory: [
    { id: 'pairs', title: 'Paare finden', subtitle: 'Klassisches Memory', emoji: '🃏' },
    { id: 'sequence', title: 'Merksequenz', subtitle: 'Reihenfolge behalten', emoji: '🧠' },
  ],
  math: [
    { id: 'mental', title: 'Kopfrechnen', subtitle: 'Schnell & sicher', emoji: '🧮' },
    { id: 'compare', title: 'Vergleiche', subtitle: 'Grösser / kleiner', emoji: '⚖️' },
  ],
  words: [
    { id: 'anagram', title: 'Anagramme', subtitle: 'Buchstaben sortieren', emoji: '🔤' },
    { id: 'association', title: 'Assoziationen', subtitle: 'Wörter verbinden', emoji: '🔗' },
    { id: 'chain', title: 'Wortketten', subtitle: 'Gemeinsamkeiten', emoji: '⛓️' },
  ],
};

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
}

export default function ExerciseOverview({
  type,
  progress,
  onChangeCategory,
  onStart,
  onShowPlan,
  onStartIQ,
}: ExerciseOverviewProps) {
  const [, bump] = useState(0);
  const level = progress.difficulty[type].level;
  const levelInfo = getEffectiveLevelInfo();
  const levelHint = effectiveLevelHint(levelInfo);

  const refresh = useCallback(() => bump(n => n + 1), []);

  const toggleExtra = (t: ExerciseType) => {
    togglePlanModule(t);
    refresh();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
      <header className="mb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          Gehirntraining
        </h1>
        <div className="flex gap-2 mt-3 text-center text-xs">
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

      {levelHint && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {levelHint}
        </p>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Für dich vorbereitet</h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {CATEGORIES.map(cat => (
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

        <p className="text-gray-500 text-sm mb-4">
          {CATEGORIES.find(c => c.type === type)?.label} · Stufe {level} ({getDifficultyLabel(level)})
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DRILLS[type].map(drill => (
            <div key={drill.id} className="card text-left p-4 min-h-[88px]">
              <span className="text-2xl">{drill.emoji}</span>
              <div className="font-semibold text-gray-800 mt-1">{drill.title}</div>
              <p className="text-xs text-gray-500">{drill.subtitle}</p>
            </div>
          ))}
        </div>
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
        className="w-full mb-6 py-5 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-extrabold text-xl shadow-lg hover:shadow-xl transition-shadow"
      >
        Übungen starten
      </button>

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
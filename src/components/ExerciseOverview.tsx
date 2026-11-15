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

const PREPARED_TITLE: Record<ExerciseType, string> = {
  logic: 'Für dich vorbereitet: Logik',
  memory: 'Für dich vorbereitet: Gedächtnis',
  math: 'Für dich vorbereitet: Kopfrechnen',
  words: 'Für dich vorbereitet: Wortspiele',
};

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

interface ExerciseOverviewProps {
  type: ExerciseType;
  progress: UserProgress;
  onChangeCategory: (type: ExerciseType) => void;
  onStart: () => void;
  onShowPlan: () => void;
  onStartIQ: () => void;
}

function PlanCircle({ selected, onToggle }: { selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-sm transition-colors ${
        selected
          ? 'bg-primary-600 border-primary-600 text-white'
          : 'bg-white border-gray-300 text-gray-300 hover:border-primary-400'
      }`}
      aria-label={selected ? 'Aus Plan entfernen' : 'Zum Plan hinzufügen'}
      aria-pressed={selected}
    >
      {selected ? '✓' : ''}
    </button>
  );
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
  const selected = isPlanModuleSelected(type);
  const levelInfo = getEffectiveLevelInfo();
  const levelHint = effectiveLevelHint(levelInfo);

  const refresh = useCallback(() => bump(n => n + 1), []);

  const togglePlan = () => {
    togglePlanModule(type);
    refresh();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
      <header className="mb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          🧠 Gehirntraining
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

      <div className="grid grid-cols-4 gap-1.5 mb-5">
        {CATEGORIES.map(cat => {
          const active = cat.type === type;
          return (
            <button
              key={cat.type}
              type="button"
              onClick={() => onChangeCategory(cat.type)}
              className={`rounded-xl py-2 px-1 text-center text-[10px] sm:text-xs font-semibold transition-all ${
                active
                  ? 'bg-primary-100 text-primary-900 ring-2 ring-primary-500 shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-base block">{cat.emoji}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-1">{PREPARED_TITLE[type]}</h2>
      <p className="text-gray-500 text-sm mb-6">
        Stufe {level} ({getDifficultyLabel(level)}) · Kreis unten rechts anklicken für Tagesplan
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {DRILLS[type].map(drill => (
          <div
            key={drill.id}
            className="card relative text-left p-4 pr-12 min-h-[88px]"
          >
            <span className="text-2xl">{drill.emoji}</span>
            <div className="font-semibold text-gray-800 mt-1">{drill.title}</div>
            <p className="text-xs text-gray-500">{drill.subtitle}</p>
            <div className="absolute bottom-3 right-3">
              <PlanCircle selected={selected} onToggle={togglePlan} />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="w-full mb-6 py-5 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-extrabold text-xl shadow-lg hover:shadow-xl transition-shadow"
      >
        Übungen starten
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onShowPlan} className="card py-4 text-center font-semibold text-gray-700 hover:bg-gray-50">
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
      {getPlanModules().length > 0 && (
        <p className="text-xs text-center text-gray-400 mt-4">
          Im Plan: {getPlanModules().length} Modul(e) ausgewählt
        </p>
      )}
    </div>
  );
}
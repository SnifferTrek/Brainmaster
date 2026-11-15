import { useCallback, useState } from 'react';
import type { ExerciseType, UserProgress } from '../types';
import { getDifficultyLabel } from '../utils/storage';
import { getPlanModules, togglePlanModule, isPlanModuleSelected } from '../utils/iqTrainingPlan';

interface DrillCard {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
}

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
  onBack: () => void;
  onStart: () => void;
  onShowPlan: () => void;
  onStartIQ: () => void;
}

function SelectionBadge({ selected }: { selected: boolean }) {
  return (
    <span
      className={`absolute bottom-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-sm ${
        selected ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-transparent'
      }`}
      aria-hidden
    >
      {selected ? '✓' : ''}
    </span>
  );
}

export default function ExerciseOverview({
  type,
  progress,
  onBack,
  onStart,
  onShowPlan,
  onStartIQ,
}: ExerciseOverviewProps) {
  const [, bump] = useState(0);
  const level = progress.difficulty[type].level;
  const selected = isPlanModuleSelected(type);

  const refresh = useCallback(() => bump(n => n + 1), []);

  const togglePlan = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlanModule(type);
    refresh();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28">
      <button type="button" onClick={onBack} className="text-gray-500 hover:text-gray-800 mb-4 text-sm">
        ← Zurück
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">{PREPARED_TITLE[type]}</h1>
      <p className="text-gray-500 text-sm mb-6">
        Stufe {level} ({getDifficultyLabel(level)}) · Kreis unten rechts = im Tagesplan
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {DRILLS[type].map(drill => (
          <button
            key={drill.id}
            type="button"
            onClick={onStart}
            className="card-hover relative text-left p-4 pr-12 min-h-[88px]"
          >
            <span className="text-2xl">{drill.emoji}</span>
            <div className="font-semibold text-gray-800 mt-1">{drill.title}</div>
            <p className="text-xs text-gray-500">{drill.subtitle}</p>
            <span
              role="button"
              tabIndex={0}
              onClick={togglePlan}
              onKeyDown={ev => ev.key === 'Enter' && togglePlan(ev as unknown as React.MouseEvent)}
              className="absolute bottom-3 right-3"
              aria-label={selected ? 'Aus Plan entfernen' : 'Zum Plan hinzufügen'}
            >
              <SelectionBadge selected={selected} />
            </span>
          </button>
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
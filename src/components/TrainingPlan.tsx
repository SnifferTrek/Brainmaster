import { useCallback, useState } from 'react';
import type { UserProgress, ExerciseType } from '../types';
import { GOALS, getGoal, saveGoal, getRecommendation, getSuccessRate } from '../utils/trainingPlan';
import type { GoalId } from '../utils/trainingPlan';
import { CATEGORY_INFO, CATEGORY_ORDER } from '../iq/questions';
import type { Category } from '../iq/questions';
import { getTrainingPlan, saveTrainingPlan } from '../utils/iqTrainingPlan';
import { getReminderPrefs } from '../utils/reminder';

interface ExerciseInfo {
  type: ExerciseType;
  title: string;
  emoji: string;
}

export function TrainingPlanCard({
  progress,
  exercises,
  onSelectExercise,
  onOpenPlan,
}: {
  progress: UserProgress;
  exercises: ExerciseInfo[];
  onSelectExercise: (t: ExerciseType) => void;
  onOpenPlan: () => void;
}) {
  const goalId = getGoal();
  const goal = GOALS.find(g => g.id === goalId);
  const rec = getRecommendation(progress);
  const info = (t: ExerciseType) => exercises.find(e => e.type === t)!;
  const pct = (rec.done.length / rec.exercises.length) * 100;

  if (!goal) {
    return (
      <div className="card mb-8 text-center">
        <div className="text-3xl mb-2">🎯</div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Dein Trainingsplan</h2>
        <p className="text-gray-500 text-sm mb-4">Wähle ein Trainingsziel und erhalte passende Empfehlungen.</p>
        <button onClick={onOpenPlan} className="px-5 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700">
          Trainingsplan
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-8 border border-primary-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">Trainingsplan</div>
          <h2 className="text-lg font-bold text-gray-800">{goal.emoji} {goal.title}</h2>
        </div>
        <button onClick={onOpenPlan} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 whitespace-nowrap">
          Ziel ändern
        </button>
      </div>

      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span className="font-semibold">Empfohlen für heute</span>
        <span>{rec.done.length}/{rec.exercises.length} Übungen heute</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2 mb-4">
        {rec.exercises.map(t => {
          const done = rec.done.includes(t);
          const isNext = rec.next === t;
          const rate = getSuccessRate(progress, t);
          return (
            <button
              key={t}
              onClick={() => onSelectExercise(t)}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left ${
                isNext ? 'bg-primary-50 ring-2 ring-primary-400' : done ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <span className="font-medium text-gray-800">
                {info(t).emoji} {info(t).title}
                {rate !== null && goalId === 'weakness' && (
                  <span className="ml-2 text-xs text-gray-400">Erfolgsrate {Math.round(rate * 100)}%</span>
                )}
              </span>
              {done ? (
                <span className="text-xs text-green-700 font-medium">Erledigt</span>
              ) : isNext ? (
                <span className="text-xs text-primary-700 font-semibold">Empfohlen</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {rec.next ? (
        <button
          onClick={() => onSelectExercise(rec.next!)}
          className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700"
        >
          Jetzt starten: {info(rec.next).title}
        </button>
      ) : (
        <p className="text-center text-green-700 font-semibold">Heutiges Pensum geschafft.</p>
      )}
    </div>
  );
}

const ALL_EX: { type: ExerciseType; title: string; emoji: string }[] = [
  { type: 'logic', title: 'Logik', emoji: '🧩' },
  { type: 'memory', title: 'Gedächtnis', emoji: '🃏' },
  { type: 'math', title: 'Mathe', emoji: '🧮' },
  { type: 'words', title: 'Wörter', emoji: '📝' },
];

const MINUTE_OPTIONS = [5, 10, 15, 20, 30];

const GOAL_SHORT: Record<GoalId, string> = {
  memory: 'Gedächtnis',
  logic: 'Logik',
  math: 'Mathe',
  words: 'Wörter',
  balanced: 'Ausgewogen',
  weakness: 'Schwächen',
};

const CHIP =
  'flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-[10px] font-semibold leading-tight transition-all sm:text-xs';

function chipActive(on: boolean) {
  return `${CHIP} ${on ? 'bg-primary-100 text-primary-900 ring-2 ring-primary-500 shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`;
}

export default function TrainingPlan({
  progress: _progress,
  onBack,
  onStartSession,
}: {
  progress: UserProgress;
  onBack: () => void;
  onSelectExercise?: (t: ExerciseType) => void;
  onStartSession?: () => void;
}) {
  const iqPlan = getTrainingPlan();
  const [selected, setSelected] = useState<GoalId | null>(getGoal());
  const [dailyMinutes, setDailyMinutes] = useState(iqPlan?.dailyMinutes ?? 10);
  const [focusDraft, setFocusDraft] = useState<Category[]>(iqPlan?.focusAreas ?? []);
  const [moduleDraft, setModuleDraft] = useState<ExerciseType[]>(
    iqPlan?.planModules?.length ? iqPlan.planModules : iqPlan?.extraModules ?? [],
  );
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const showSaved = useCallback((msg: string) => {
    setSavedBanner(msg);
    window.setTimeout(() => setSavedBanner(null), 3200);
  }, []);

  const toggleFocus = (c: Category) => {
    setFocusDraft(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));
  };

  const toggleModule = (t: ExerciseType) => {
    setModuleDraft(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  const savePlanSettings = useCallback(
    (andBack = false) => {
      const prefs = getReminderPrefs();
      saveTrainingPlan({
        dailyMinutes,
        focusAreas: focusDraft,
        planModules: moduleDraft.length > 0 ? moduleDraft : undefined,
        extraModules: undefined,
        reminderEnabled: prefs.enabled,
        reminderHour: prefs.hour,
      });
      if (selected) saveGoal(selected);
      showSaved('Plan gespeichert');
      if (andBack) onBack();
    },
    [dailyMinutes, focusDraft, moduleDraft, selected, showSaved, onBack],
  );

  const selectedGoal = GOALS.find(g => g.id === selected);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28">
      <button type="button" onClick={onBack} className="text-gray-500 hover:text-gray-800 mb-4">
        ← Zurück
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Trainingsplan</h1>
      <p className="text-gray-600 text-sm mb-4">Trainingszeit, Module und Schwerpunkte.</p>

      {savedBanner && (
        <div
          className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800 animate-fadeIn"
          role="status"
        >
          {savedBanner}
        </div>
      )}

      <div className="card mb-6 border border-primary-100">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">Zeit pro Tag</h2>
        <div className="grid grid-cols-5 gap-2 mb-6">
          {MINUTE_OPTIONS.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setDailyMinutes(m)}
              className={chipActive(dailyMinutes === m)}
            >
              <span className="text-sm font-bold">{m}</span>
              <span className="text-[9px] text-gray-500 font-medium">Min</span>
            </button>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-gray-800 mb-2">Module im Plan</h2>
        <p className="text-xs text-gray-500 mb-2">Mehrere Bereiche möglich — wie auf dem Startbildschirm.</p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {ALL_EX.map(ex => (
            <button
              key={ex.type}
              type="button"
              onClick={() => toggleModule(ex.type)}
              aria-pressed={moduleDraft.includes(ex.type)}
              className={chipActive(moduleDraft.includes(ex.type))}
            >
              <span className="text-lg leading-none">{ex.emoji}</span>
              <span className="w-full truncate">{ex.title}</span>
            </button>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-gray-800 mb-2">IQ-Schwerpunkte (optional)</h2>
        <div className="grid grid-cols-3 gap-2 mb-4 sm:grid-cols-3">
          {CATEGORY_ORDER.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => toggleFocus(c)}
              aria-pressed={focusDraft.includes(c)}
              className={chipActive(focusDraft.includes(c))}
            >
              <span className="text-[10px] sm:text-xs w-full truncate">{CATEGORY_INFO[c].short}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={() => savePlanSettings(false)} className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 mb-2">
          Plan speichern
        </button>
        {onStartSession && (
          <button
            type="button"
            onClick={() => {
              savePlanSettings(false);
              onStartSession();
            }}
            className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800"
          >
            Los — Training starten
          </button>
        )}
      </div>

      <section className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Schwerpunkt ohne IQ-Test</h2>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Steuert, welche Übungstypen die App zuerst empfiehlt, wenn kein IQ-Plan aktiv ist. Einmal wählen — mit «Plan
          speichern» übernehmen.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {GOALS.map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelected(g.id)}
              aria-pressed={selected === g.id}
              className={chipActive(selected === g.id)}
              title={g.description}
            >
              <span className="text-lg leading-none">{g.emoji}</span>
              <span className="w-full truncate px-0.5">{GOAL_SHORT[g.id]}</span>
            </button>
          ))}
        </div>
        {selectedGoal && (
          <p className="text-xs text-gray-600 mt-3 px-1">{selectedGoal.description}</p>
        )}
      </section>
    </div>
  );
}
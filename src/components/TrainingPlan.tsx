import { useState } from 'react';
import type { UserProgress, ExerciseType } from '../types';
import { GOALS, getGoal, saveGoal, getRecommendation, getSuccessRate } from '../utils/trainingPlan';
import type { GoalId } from '../utils/trainingPlan';
import { CATEGORY_INFO } from '../iq/questions';
import { getTrainingPlan, saveTrainingPlan } from '../utils/iqTrainingPlan';
import ChallengeCard from './ChallengeCard';
import { getChallengeForDate, getChallengeValue, isChallengeCompleted } from '../utils/challenges';
import { getTodayProgress } from '../utils/storage';

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
          🎯 Trainingsplan
        </button>
      </div>
    );
  }

  return (
    <div className="card mb-8 border border-primary-200">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">🎯 Trainingsplan</div>
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
                <span className="text-xs text-green-700 font-medium">✓ Erledigt</span>
              ) : isNext ? (
                <span className="text-xs text-primary-700 font-semibold">👉 Empfohlene Übung</span>
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
        <p className="text-center text-green-700 font-semibold">🎉 Tagesziel erreicht! Super gemacht.</p>
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
  const [selected, setSelected] = useState<GoalId | null>(getGoal());
  const iqPlan = getTrainingPlan();
  const [extraDraft, setExtraDraft] = useState<ExerciseType[]>(iqPlan?.extraModules ?? []);

  const toggleExtra = (t: ExerciseType) => {
    setExtraDraft(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  const saveExtras = () => {
    if (!iqPlan) return;
    saveTrainingPlan({
      dailyMinutes: iqPlan.dailyMinutes,
      focusAreas: iqPlan.focusAreas,
      reminderEnabled: iqPlan.reminderEnabled,
      reminderHour: iqPlan.reminderHour,
      extraModules: extraDraft.length > 0 ? extraDraft : undefined,
    });
  };

  const challenge = getChallengeForDate();
  const challengeDone = isChallengeCompleted(challenge.id);
  const challengeValue = getChallengeValue(challenge, { currentScore: 0, sessionPoints: 0, memoryScore: 0, mathBest: 0, logicBest: 0, mathRun: 0, logicRun: 0 }, getTodayProgress().exercisesCompleted);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-28">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-800 mb-4">← Zurück</button>
      <h1 className="text-3xl font-bold text-gray-800 mb-1">🎯 Trainingsplan</h1>
      <p className="text-gray-600 mb-6">Schwerpunkte aus dem IQ-Test oder ein klassisches Tagesziel.</p>

      <ChallengeCard challenge={challenge} completed={challengeDone} value={challengeValue} />

      {iqPlan && (
        <div className="card mb-6 border-2 border-green-200 bg-green-50/50 mt-4">
          <p className="text-sm text-gray-700 mb-4">
            <b>{iqPlan.dailyMinutes} Min</b> · Schwerpunkte:{' '}
            <b>{iqPlan.focusAreas.map(k => CATEGORY_INFO[k].short).join(', ')}</b>
          </p>
          <details className="text-sm text-gray-600 mb-4">
            <summary className="cursor-pointer font-medium text-gray-700">Zusatz-Module (optional)</summary>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {ALL_EX.map(ex => (
                <button
                  key={ex.type}
                  type="button"
                  onClick={() => toggleExtra(ex.type)}
                  className={`p-2 rounded-lg border text-sm font-medium ${
                    extraDraft.includes(ex.type)
                      ? 'border-green-500 bg-white text-green-800'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {ex.emoji} {ex.title}
                </button>
              ))}
            </div>
            <button type="button" onClick={saveExtras} className="w-full mt-3 py-2 rounded-xl bg-green-600 text-white font-semibold text-sm">
              Speichern
            </button>
          </details>
          {onStartSession && (
            <button
              type="button"
              onClick={onStartSession}
              className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-700"
            >
              Los — Training starten
            </button>
          )}
        </div>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Tagesziel (klassisch)</h2>
      <div className="space-y-3 mb-6">
        {GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => setSelected(g.id)}
            className={`card-hover w-full text-left flex items-center gap-4 ${selected === g.id ? 'ring-4 ring-primary-400' : ''}`}
          >
            <span className="text-3xl">{g.emoji}</span>
            <span>
              <span className="block font-semibold text-gray-800">{g.title}</span>
              <span className="block text-sm text-gray-500">{g.description}</span>
            </span>
            {selected === g.id && <span className="ml-auto text-primary-600 font-bold">✓</span>}
          </button>
        ))}
      </div>
      <button
        disabled={!selected}
        onClick={() => { if (selected) { saveGoal(selected); onBack(); } }}
        className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-40"
      >
        Ziel speichern
      </button>
    </div>
  );
}

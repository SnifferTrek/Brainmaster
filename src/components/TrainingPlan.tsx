import { useState } from 'react';
import type { UserProgress, ExerciseType } from '../types';
import { GOALS, getGoal, saveGoal, getRecommendation, getSuccessRate } from '../utils/trainingPlan';
import type { GoalId } from '../utils/trainingPlan';

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

export default function TrainingPlan({ progress, onBack }: { progress: UserProgress; onBack: () => void }) {
  const [selected, setSelected] = useState<GoalId | null>(getGoal());
  void progress;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-800 mb-4">← Zurück</button>
      <h1 className="text-3xl font-bold text-gray-800 mb-1">🎯 Trainingsplan</h1>
      <p className="text-gray-600 mb-6">Wähle dein Trainingsziel. Wir empfehlen dir täglich passende Übungen.</p>
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

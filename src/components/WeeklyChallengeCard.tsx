import { useCallback, useState } from 'react';
import {
  formatWeekLabel,
  getCurrentWeeklyChallenge,
  toggleWeeklyChallengeDone,
} from '../utils/weeklyChallenge';

export default function WeeklyChallengeCard() {
  const [, bump] = useState(0);
  const refresh = useCallback(() => bump(n => n + 1), []);

  const { weekKey, task, completed } = getCurrentWeeklyChallenge();

  return (
    <section className="mb-6 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">Impuls der Woche</p>
          <p className="text-xs text-gray-500">{formatWeekLabel(weekKey)}</p>
        </div>
        <span className="text-2xl" aria-hidden>
          {task.emoji}
        </span>
      </div>
      <h3 className="font-bold text-gray-900 text-sm mb-1">{task.title}</h3>
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">{task.hint}</p>
      <button
        type="button"
        onClick={() => {
          toggleWeeklyChallengeDone();
          refresh();
        }}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
          completed
            ? 'border-green-500 bg-green-50 text-green-900'
            : 'border-violet-300 bg-white text-violet-900 hover:bg-violet-50'
        }`}
        aria-pressed={completed}
      >
        {completed ? 'Erledigt diese Woche' : 'Als erledigt markieren'}
      </button>
      <p className="text-[10px] text-center text-gray-400 mt-2">
        Real-Welt-Aufgabe — eigenständig umsetzen, jede Woche neu.
      </p>
    </section>
  );
}
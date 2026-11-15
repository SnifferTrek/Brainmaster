import { useCallback, useState } from 'react';
import {
  acceptWeeklyChallenge,
  formatWeekLabel,
  getCurrentWeeklyChallenge,
  skipWeeklyChallenge,
  toggleWeeklyChallengeDone,
} from '../utils/weeklyChallenge';
import WeeklyTaskChoiceActions from './WeeklyTaskChoiceActions';

interface WeeklyChallengeCardProps {
  onOpenCatalog?: () => void;
}

export default function WeeklyChallengeCard({ onOpenCatalog }: WeeklyChallengeCardProps) {
  const [, bump] = useState(0);
  const [open, setOpen] = useState(false);
  const refresh = useCallback(() => bump(n => n + 1), []);

  const { weekKey, task, accepted, completed } = getCurrentWeeklyChallenge();
  const weekLabel = formatWeekLabel(weekKey);
  const statusLabel = completed ? 'Erledigt' : 'Offen';

  const afterChange = () => {
    refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left active:bg-amber-100/80 min-h-[44px] shadow-sm"
        aria-label={`Impuls der Woche, ${weekLabel}, ${statusLabel}`}
      >
        <span className="flex-1 min-w-0 text-sm text-amber-950 truncate">
          <span className="font-semibold">Impuls der Woche</span>
          <span className="text-amber-900/70"> · {weekLabel}</span>
        </span>
        <span
          className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
            completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900 border border-amber-300/80'
          }`}
        >
          {statusLabel}
        </span>
        <span className="text-gray-400 text-sm shrink-0" aria-hidden>
          ›
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/40 p-4 pb-28"
          role="dialog"
          aria-modal
          aria-labelledby="weekly-impulse-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 id="weekly-impulse-title" className="text-sm font-semibold text-gray-800">
                  Impuls der Woche
                </h2>
                <p className="text-xs text-gray-500">{weekLabel}</p>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full h-fit ${
                  completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {statusLabel}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-500 text-lg leading-none px-1 -mr-1"
                aria-label="Schliessen"
              >
                ✕
              </button>
            </div>

            <div className="flex items-start gap-3 mb-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
              <span className="text-3xl leading-none">{task.emoji}</span>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm">{task.title}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{task.hint}</p>
              </div>
            </div>

            {!accepted ? (
              <WeeklyTaskChoiceActions
                task={task}
                onAccept={() => {
                  acceptWeeklyChallenge();
                  afterChange();
                }}
                onSkipAlready={() => {
                  skipWeeklyChallenge('already');
                  afterChange();
                }}
                onSkipLater={() => {
                  skipWeeklyChallenge('later');
                  afterChange();
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  toggleWeeklyChallengeDone();
                  afterChange();
                }}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  completed
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-violet-300 bg-white text-violet-900'
                }`}
                aria-pressed={completed}
              >
                {completed ? 'Erledigt — tippe zum Zurücksetzen' : 'Als erledigt markieren'}
              </button>
            )}

            {onOpenCatalog && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenCatalog();
                }}
                className="w-full mt-3 py-2 text-xs font-medium text-violet-700 underline"
              >
                100 Wochenaktionen verwalten
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
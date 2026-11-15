import type { WeeklyChallengeTask } from '../utils/weeklyChallenge';

interface WeeklyTaskChoiceActionsProps {
  task: WeeklyChallengeTask;
  compact?: boolean;
  onAccept: () => void;
  onSkipAlready: () => void;
  onSkipLater: () => void;
}

export default function WeeklyTaskChoiceActions({
  task,
  compact,
  onAccept,
  onSkipAlready,
  onSkipLater,
}: WeeklyTaskChoiceActionsProps) {
  const btn = compact ? 'py-2 text-xs' : 'py-2.5 text-sm';
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 leading-relaxed">
        <span className="font-semibold text-gray-800">{task.emoji} {task.title}</span>
        {' — '}
        Was möchtest du?
      </p>
      <button
        type="button"
        onClick={onAccept}
        className={`w-full rounded-xl font-semibold border-2 border-violet-600 bg-violet-600 text-white ${btn}`}
      >
        Aufgabe akzeptieren
      </button>
      <button
        type="button"
        onClick={onSkipAlready}
        className={`w-full rounded-xl font-medium border border-gray-200 bg-white text-gray-800 ${btn}`}
      >
        Andere Aufgabe (mache ich bereits)
      </button>
      <button
        type="button"
        onClick={onSkipLater}
        className={`w-full rounded-xl font-medium border border-gray-200 bg-gray-50 text-gray-700 ${btn}`}
      >
        Andere Aufgabe (löse ich später)
      </button>
    </div>
  );
}
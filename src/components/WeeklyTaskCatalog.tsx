import { type MouseEvent, useMemo, useState } from 'react';
import {
  WEEKLY_TASK_CATEGORIES,
  countEnabledTasks,
  getEnabledTaskIds,
  setAllTasksEnabled,
  setTaskEnabled,
  weeklyTasksCatalog,
  type WeeklyTaskCategory,
} from '../utils/weeklyTaskCatalog';
import type { WeeklyChallengeTask } from '../utils/weeklyChallenge';
import { acceptWeeklyChallenge, proposeWeeklyChallengeTask, skipWeeklyChallenge } from '../utils/weeklyChallenge';
import WeeklyTaskChoiceActions from './WeeklyTaskChoiceActions';

interface WeeklyTaskCatalogProps {
  onSelectionChange?: () => void;
  onWeekTaskUpdated?: () => void;
}

export default function WeeklyTaskCatalog({ onSelectionChange, onWeekTaskUpdated }: WeeklyTaskCatalogProps) {
  const [filter, setFilter] = useState<WeeklyTaskCategory>('alle');
  const [tick, setTick] = useState(0);
  const [pendingChoice, setPendingChoice] = useState<WeeklyChallengeTask | null>(null);

  const enabled = useMemo(() => getEnabledTaskIds(), [tick]);
  const { enabled: enabledCount, total } = countEnabledTasks();

  const filtered = useMemo(() => {
    if (filter === 'alle') return weeklyTasksCatalog;
    return weeklyTasksCatalog.filter(t => t.category === filter);
  }, [filter]);

  const togglePool = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const on = enabled.has(id);
    setTaskEnabled(id, !on);
    setTick(n => n + 1);
    onSelectionChange?.();
  };

  const openChoice = (t: WeeklyChallengeTask) => {
    proposeWeeklyChallengeTask(t.id);
    setPendingChoice(t);
  };

  const closeChoice = () => setPendingChoice(null);

  const afterWeekChange = () => {
    setTick(n => n + 1);
    closeChoice();
    onWeekTaskUpdated?.();
    onSelectionChange?.();
  };

  const labelFor = (cat: string) => {
    const labels: Record<string, string> = {
      alle: 'Alle',
      sprache: 'Sprache',
      bewegung: 'Bewegung',
      sozial: 'Sozial',
      sinne: 'Sinne',
      kreativ: 'Kreativ',
      fokus: 'Fokus',
      alltag: 'Alltag',
      natur: 'Natur',
      lernen: 'Lernen',
      gedächtnis: 'Gedächtnis',
    };
    return labels[cat] ?? cat;
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-gray-600">
          {enabledCount} von {total} für die Rotation aktiv
        </span>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setAllTasksEnabled(true);
              setTick(n => n + 1);
              onSelectionChange?.();
            }}
            className="text-primary-700 font-medium"
          >
            Alle an
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => {
              setAllTasksEnabled(false);
              setTick(n => n + 1);
              onSelectionChange?.();
            }}
            className="text-gray-600"
          >
            Nur erste
          </button>
        </div>
      </div>
      <p className="text-[11px] text-gray-500 mb-2">
        Links: in Rotation ein/aus. Aufgabe antippen: akzeptieren oder andere wählen.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {WEEKLY_TASK_CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              filter === cat ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {labelFor(cat)}
          </button>
        ))}
      </div>
      <ul className="space-y-1.5 text-sm text-gray-700 max-h-[min(24rem,55vh)] overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50">
        {filtered.map(t => {
          const on = enabled.has(t.id);
          return (
            <li key={t.id}>
              <div
                className={`flex items-start gap-2 py-2 px-1 rounded-xl min-h-[3.25rem] ${
                  on ? 'bg-violet-50/80 border border-violet-100' : 'bg-white border border-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={e => togglePool(t.id, e)}
                  className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 ${
                    on ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-300 bg-white text-transparent'
                  }`}
                  aria-label={on ? 'Aus Rotation entfernen' : 'In Rotation aufnehmen'}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => openChoice(t)}
                  className="flex-1 flex items-start gap-2 text-left py-0.5 min-w-0"
                >
                  <span className="text-xl leading-none shrink-0">{t.emoji}</span>
                  <span className="min-w-0">
                    <span className={`font-medium block ${on ? 'text-gray-900' : 'text-gray-500'}`}>{t.title}</span>
                    <span className="text-[11px] text-gray-500 block">{t.hint}</span>
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {pendingChoice && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 pb-28" role="dialog" aria-modal>
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-900 text-sm">Impuls der Woche</h3>
              <button type="button" onClick={closeChoice} className="text-gray-500 text-sm px-2">
                Schließen
              </button>
            </div>
            <WeeklyTaskChoiceActions
              task={pendingChoice}
              compact
              onAccept={() => {
                acceptWeeklyChallenge(pendingChoice.id);
                afterWeekChange();
              }}
              onSkipAlready={() => {
                proposeWeeklyChallengeTask(pendingChoice.id);
                skipWeeklyChallenge('already');
                afterWeekChange();
              }}
              onSkipLater={() => {
                proposeWeeklyChallengeTask(pendingChoice.id);
                skipWeeklyChallenge('later');
                afterWeekChange();
              }}
            />
          </div>
        </div>
      )}

      {total < 100 && (
        <p className="text-xs text-amber-800 mt-2">Nur {total} Aufgaben geladen — bitte App neu bauen (npm run build, cap sync).</p>
      )}
    </div>
  );
}
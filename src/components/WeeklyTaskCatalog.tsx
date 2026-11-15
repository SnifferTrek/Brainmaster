import { useMemo, useState } from 'react';
import {
  WEEKLY_TASK_CATEGORIES,
  countEnabledTasks,
  getEnabledTaskIds,
  setAllTasksEnabled,
  setTaskEnabled,
  weeklyTasksCatalog,
  type WeeklyTaskCategory,
} from '../utils/weeklyTaskCatalog';

interface WeeklyTaskCatalogProps {
  onSelectionChange?: () => void;
}

export default function WeeklyTaskCatalog({ onSelectionChange }: WeeklyTaskCatalogProps) {
  const [filter, setFilter] = useState<WeeklyTaskCategory>('alle');
  const [tick, setTick] = useState(0);

  const enabled = useMemo(() => getEnabledTaskIds(), [tick]);
  const { enabled: enabledCount, total } = countEnabledTasks();

  const filtered = useMemo(() => {
    if (filter === 'alle') return weeklyTasksCatalog;
    return weeklyTasksCatalog.filter(t => t.category === filter);
  }, [filter]);

  const toggle = (id: string) => {
    const on = enabled.has(id);
    setTaskEnabled(id, !on);
    setTick(n => n + 1);
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
      <ul className="space-y-1.5 text-sm text-gray-700 max-h-[min(24rem,55vh)] overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50 -webkit-overflow-scrolling-touch">
        {filtered.map(t => {
          const on = enabled.has(t.id);
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className={`w-full flex items-start gap-3 py-2.5 px-2 rounded-xl text-left min-h-[3.25rem] active:scale-[0.99] transition-colors ${
                  on ? 'bg-violet-50 border border-violet-200' : 'bg-white border border-transparent'
                }`}
                aria-pressed={on}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
                    on ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-300 bg-white text-transparent'
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="text-xl leading-none shrink-0">{t.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className={`font-medium block text-left ${on ? 'text-gray-900' : 'text-gray-500'}`}>{t.title}</span>
                  <span className="text-[11px] text-gray-500 block text-left">{t.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {total < 100 && (
        <p className="text-xs text-amber-800 mt-2">Nur {total} Aufgaben geladen — bitte App neu bauen (npm run build, cap sync).</p>
      )}
    </div>
  );
}
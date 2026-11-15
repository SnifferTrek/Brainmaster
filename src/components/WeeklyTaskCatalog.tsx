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
      <ul className="space-y-1 text-sm text-gray-700 max-h-64 overflow-y-auto border border-gray-100 rounded-xl p-2 bg-gray-50/50">
        {filtered.map(t => {
          const on = enabled.has(t.id);
          return (
            <li key={t.id}>
              <label className="flex items-start gap-2 py-1.5 px-1 rounded-lg hover:bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(t.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-lg leading-none shrink-0">{t.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className={`font-medium block ${on ? 'text-gray-900' : 'text-gray-400'}`}>{t.title}</span>
                  <span className="text-[11px] text-gray-500 block">{t.hint}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] text-gray-400 mt-2">
        Katalog: <code className="text-gray-500">src/data/weeklyTasks.json</code> (100 Ideen, JSON bearbeitbar).
      </p>
    </div>
  );
}
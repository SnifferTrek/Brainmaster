type TabView = 'dashboard' | 'plan' | 'statistics' | 'achievements' | 'settings';

const TAB_ITEMS: { view: TabView; label: string; icon: TabView }[] = [
  { view: 'dashboard', label: 'Start', icon: 'dashboard' },
  { view: 'plan', label: 'Plan', icon: 'plan' },
  { view: 'statistics', label: 'Statistik', icon: 'statistics' },
  { view: 'achievements', label: 'Erfolge', icon: 'achievements' },
  { view: 'settings', label: 'Mehr', icon: 'settings' },
];

function stroke(active: boolean) {
  return active ? 2.1 : 1.65;
}

function TabIcon({ name, active }: { name: TabView; active: boolean }) {
  const w = stroke(active);
  const cls = 'block h-[22px] w-[22px]';

  switch (name) {
    case 'dashboard':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M4 10.2 12 3.8l8 6.4V19a1.2 1.2 0 0 1-1.2 1.2H15v-6.2H9V20.2H5.2A1.2 1.2 0 0 1 4 19v-8.8Z" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'plan':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="8.5" strokeWidth={w} />
          <circle cx="12" cy="12" r="3.2" strokeWidth={w} />
          <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" strokeWidth={w} strokeLinecap="round" />
        </svg>
      );
    case 'statistics':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M5 19V11M10 19V6M15 19v-5M20 19V9" strokeWidth={w} strokeLinecap="round" />
          <path d="M4 19h17" strokeWidth={w} strokeLinecap="round" />
        </svg>
      );
    case 'achievements':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M8 5h8v3.5a4 4 0 0 1-8 0V5Z" strokeWidth={w} strokeLinejoin="round" />
          <path d="M6.5 8.5H4.2v2.2a2.8 2.8 0 0 0 2.8 2.8h0A2.8 2.8 0 0 0 9.8 10.7V8.5" strokeWidth={w} strokeLinecap="round" />
          <path d="M17.5 8.5h2.3v2.2a2.8 2.8 0 0 1-2.8 2.8h0a2.8 2.8 0 0 1-2.8-2.8V8.5" strokeWidth={w} strokeLinecap="round" />
          <path d="M12 12.5v6.5M9.5 21h5" strokeWidth={w} strokeLinecap="round" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="3.2" strokeWidth={w} />
          <path
            d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
            strokeWidth={w}
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function isTabView(view: string): view is TabView {
  return TAB_ITEMS.some(t => t.view === view);
}

export type { TabView };

interface TabBarProps {
  currentView: TabView;
  onSelect: (view: TabView) => void;
}

export default function TabBar({ currentView, onSelect }: TabBarProps) {
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
    >
      <nav
        className="pointer-events-auto flex w-[calc(100%-1.25rem)] max-w-lg items-stretch gap-0.5 rounded-[1.75rem] border border-gray-200/80 bg-white/95 px-1 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl"
        aria-label="Hauptnavigation"
      >
        {TAB_ITEMS.map(t => {
          const active = currentView === t.view;
          return (
            <button
              key={t.view}
              type="button"
              onClick={() => onSelect(t.view)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-0.5 py-2 transition-all duration-200 ${
                active ? 'bg-gray-200/90 text-gray-950 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <TabIcon name={t.icon} active={active} />
              <span
                className={`max-w-full truncate text-center text-[9px] font-medium leading-none tracking-tight sm:text-[10px] ${
                  active ? 'text-gray-950' : 'text-gray-500'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
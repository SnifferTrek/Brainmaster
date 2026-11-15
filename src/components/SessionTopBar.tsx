import { SoundToggleButton } from './SoundToggle';

interface SessionTopBarProps {
  left: React.ReactNode;
  onAbort: () => void;
  abortLabel?: string;
}

export default function SessionTopBar({ left, onAbort, abortLabel = 'Abbrechen' }: SessionTopBarProps) {
  return (
    <div
      className="sticky top-0 z-30 -mx-4 px-4 mb-3 flex items-center justify-between gap-3 border-b border-gray-100 bg-white/95 backdrop-blur-sm pb-2"
      style={{ paddingTop: 'max(0.35rem, env(safe-area-inset-top, 0px))' }}
    >
      <div className="min-w-0 flex-1 text-sm text-gray-600 leading-tight">{left}</div>
      <div className="flex items-center gap-1.5 shrink-0">
        <SoundToggleButton
          className="w-9 h-9 rounded-full bg-white border border-gray-200 text-base flex items-center justify-center shadow-sm active:scale-95 transition shrink-0"
          style={undefined}
        />
        <button type="button" onClick={onAbort} className="text-red-600 text-sm font-semibold px-1 min-h-[36px]">
          {abortLabel}
        </button>
      </div>
    </div>
  );
}
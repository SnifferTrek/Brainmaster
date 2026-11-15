import { useEffect, useState, type CSSProperties } from 'react';
import { isMuted, toggleMuted, subscribeMuted, playGameStart } from '../utils/sounds';

type SoundToggleButtonProps = {
  className?: string;
  style?: CSSProperties;
};

export function SoundToggleButton({ className, style }: SoundToggleButtonProps) {
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => subscribeMuted(setMutedState), []);

  const handleClick = () => {
    const nowMuted = toggleMuted();
    if (!nowMuted) playGameStart();
  };

  const base =
    className ??
    'fixed right-4 z-40 w-11 h-11 rounded-full bg-white shadow-md border border-gray-200 text-xl flex items-center justify-center hover:scale-105 active:scale-95 transition';

  const defaultStyle =
    style ?? ({ top: 'calc(env(safe-area-inset-top, 0px) + 0.625rem)' } as React.CSSProperties);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={muted ? 'Sounds einschalten' : 'Sounds ausschalten'}
      title={muted ? 'Sounds einschalten' : 'Sounds ausschalten'}
      className={base}
      style={defaultStyle}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

export default function SoundToggle() {
  return <SoundToggleButton />;
}
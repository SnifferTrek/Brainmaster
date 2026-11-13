import { useEffect, useState } from 'react';
import { isMuted, toggleMuted, subscribeMuted, playGameStart } from '../utils/sounds';

export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => subscribeMuted(setMutedState), []);

  const handleClick = () => {
    const nowMuted = toggleMuted();
    if (!nowMuted) playGameStart();
  };

  return (
    <button
      onClick={handleClick}
      aria-label={muted ? 'Sounds einschalten' : 'Sounds ausschalten'}
      title={muted ? 'Sounds einschalten' : 'Sounds ausschalten'}
      className="fixed top-4 right-4 z-40 w-11 h-11 rounded-full bg-white shadow-md border border-gray-200 text-xl flex items-center justify-center hover:scale-105 active:scale-95 transition"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

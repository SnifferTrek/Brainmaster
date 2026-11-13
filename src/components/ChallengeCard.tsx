import { useEffect, useState } from 'react';
import type { Challenge } from '../utils/challenges';
import { formatCountdown, msUntilMidnight } from '../utils/challenges';

interface Props {
  challenge: Challenge;
  value: number;
  completed: boolean;
  compact?: boolean;
}

export function useCountdown(): string {
  const [ms, setMs] = useState(msUntilMidnight());
  useEffect(() => {
    const t = setInterval(() => setMs(msUntilMidnight()), 1000);
    return () => clearInterval(t);
  }, []);
  return formatCountdown(ms);
}

export default function ChallengeCard({ challenge, value, completed, compact }: Props) {
  const countdown = useCountdown();
  const shown = completed ? challenge.target : Math.min(value, challenge.target);
  const pct = (shown / challenge.target) * 100;

  if (compact) {
    return (
      <div className="bg-white/95 backdrop-blur shadow-md rounded-2xl px-4 py-2 max-w-4xl mx-auto border border-amber-200">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-semibold text-gray-700">📋 {challenge.description}</span>
          <span className={completed ? 'text-success-700 font-semibold' : 'text-gray-500'}>
            {completed ? 'Abgeschlossen ✓' : `${shown}/${challenge.target} · +${challenge.bonus}`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${completed ? 'bg-success-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`card mb-8 border-2 ${completed ? 'border-success-400 bg-success-50' : 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-800">📋 Tägliche Challenge</h2>
        {completed ? (
          <span className="bg-success-100 text-success-700 text-sm px-3 py-1 rounded-full font-semibold">Abgeschlossen ✓</span>
        ) : (
          <span className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full font-semibold">+{challenge.bonus} Bonuspunkte</span>
        )}
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div className="text-4xl">{challenge.emoji}</div>
        <div>
          <div className="font-semibold text-gray-800">{challenge.title}</div>
          <div className="text-gray-600 text-sm">{challenge.description}</div>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${completed ? 'bg-success-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>{shown} / {challenge.target} {challenge.unit}</span>
        <span>⏳ Nächste Challenge in {countdown}</span>
      </div>
    </div>
  );
}

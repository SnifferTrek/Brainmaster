import { useEffect, useState } from 'react';
import type { AchievementId } from '../types';
import { ACHIEVEMENT_DEFINITIONS } from '../utils/storage';

interface AchievementToastProps {
  achievementIds: AchievementId[];
  onComplete: () => void;
}

export default function AchievementToast({ achievementIds, onComplete }: AchievementToastProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const achievement = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementIds[currentIndex]);

  useEffect(() => {
    if (!achievement) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      if (currentIndex < achievementIds.length - 1) {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setIsVisible(true);
        }, 300);
      } else {
        setIsVisible(false);
        setTimeout(onComplete, 300);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentIndex, achievementIds.length, onComplete, achievement]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-4 min-w-[320px] max-w-md">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl animate-bounce-slow">
          {achievement.emoji}
        </div>
        
        <div className="flex-1">
          <p className="text-amber-100 text-sm font-medium">🎉 Achievement freigeschaltet!</p>
          <h3 className="text-xl font-bold">{achievement.name}</h3>
          <p className="text-amber-100 text-sm">{achievement.description}</p>
        </div>
        
        {achievementIds.length > 1 && (
          <div className="text-sm text-amber-200">
            {currentIndex + 1}/{achievementIds.length}
          </div>
        )}
      </div>
    </div>
  );
}

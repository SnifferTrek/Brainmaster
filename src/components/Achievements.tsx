import { useMemo } from 'react';
import type { Achievement } from '../types';
import { getAchievementsList, ACHIEVEMENT_DEFINITIONS } from '../utils/storage';

interface AchievementsProps {
  onBack: () => void;
  embedded?: boolean;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = !!achievement.unlockedAt;
  
  return (
    <div
      className={`relative rounded-2xl p-4 transition-all duration-300 ${
        isUnlocked
          ? 'bg-white shadow-lg border-2 border-amber-200'
          : 'bg-gray-100 border-2 border-gray-200 opacity-60'
      }`}
    >
      {isUnlocked && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
          ✓
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
            isUnlocked
              ? 'bg-gradient-to-br from-amber-100 to-amber-200'
              : 'bg-gray-200 grayscale'
          }`}
        >
          {achievement.emoji}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-bold ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
            {achievement.name}
          </h3>
          <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
            {achievement.description}
          </p>
          {isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-amber-600 mt-1">
              🏆 Freigeschaltet am {formatDate(achievement.unlockedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Achievements({ onBack, embedded }: AchievementsProps) {
  const achievements = useMemo(() => getAchievementsList(), []);
  
  const pointsAchievements = achievements.filter(a => a.category === 'points');
  const streakAchievements = achievements.filter(a => a.category === 'streak');
  const levelAchievements = achievements.filter(a => a.category === 'level');
  
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalCount = ACHIEVEMENT_DEFINITIONS.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  return (
    <div className={`max-w-4xl mx-auto px-4 ${embedded ? 'py-4 pb-28' : 'py-8'}`}>
      {!embedded && (
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <span>←</span> Zurück
          </button>
          <h1 className="text-2xl font-bold text-gray-800">🏆 Achievements</h1>
          <div className="w-20" />
        </div>
      )}
      {embedded && (
        <h1 className="text-xl font-bold text-gray-800 mb-4">🏆 Achievements</h1>
      )}

      {/* Progress Overview */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Dein Fortschritt</h2>
            <p className="text-gray-500 text-sm">
              {unlockedCount} von {totalCount} Achievements freigeschaltet
            </p>
          </div>
          <div className="text-4xl">
            {progressPercent === 100 ? '🎉' : progressPercent >= 50 ? '🌟' : '🎯'}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-amber-400 to-amber-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-right text-sm text-gray-500 mt-1">
          {progressPercent.toFixed(0)}%
        </p>
      </div>

      {/* Points Achievements */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💰</span> Punkte-Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pointsAchievements.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>

      {/* Streak Achievements */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>🔥</span> Streak-Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streakAchievements.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>

      {/* Level Achievements */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> Level-Achievements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {levelAchievements.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>

      {/* Motivational Footer */}
      <div className="text-center text-gray-400 text-sm mt-8">
        {unlockedCount === totalCount ? (
          <p>🎊 Unglaublich! Du hast alle Achievements freigeschaltet! 🎊</p>
        ) : unlockedCount >= totalCount / 2 ? (
          <p>Weiter so! Du bist auf dem besten Weg! 💪</p>
        ) : (
          <p>Spiele weiter, um mehr Achievements freizuschalten! 🚀</p>
        )}
      </div>
    </div>
  );
}

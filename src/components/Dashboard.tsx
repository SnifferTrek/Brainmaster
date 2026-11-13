import type { UserProgress, ExerciseType } from '../types';
import { getPointsForNextLevel, getPointsForCurrentLevel, getTodayProgress } from '../utils/storage';

interface DashboardProps {
  progress: UserProgress;
  onSelectExercise: (type: ExerciseType) => void;
  onShare: () => void;
  onShowFriends: () => void;
  friendCount: number;
}

const exercises = [
  {
    type: 'logic' as ExerciseType,
    title: 'Logik-Rätsel',
    description: 'Zahlenfolgen & Muster',
    emoji: '🧩',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    type: 'memory' as ExerciseType,
    title: 'Gedächtnis',
    description: 'Memory & Sequenzen',
    emoji: '🃏',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    type: 'math' as ExerciseType,
    title: 'Kopfrechnen',
    description: 'Schnelle Mathe',
    emoji: '🧮',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
  },
  {
    type: 'words' as ExerciseType,
    title: 'Wortspiele',
    description: 'Anagramme & mehr',
    emoji: '📝',
    color: 'from-orange-400 to-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export default function Dashboard({ progress, onSelectExercise, onShare, onShowFriends, friendCount }: DashboardProps) {
  const todayProgress = getTodayProgress();
  const pointsForNext = getPointsForNextLevel(progress.level);
  const pointsForCurrent = getPointsForCurrentLevel(progress.level);
  const levelProgress = ((progress.totalPoints - pointsForCurrent) / (pointsForNext - pointsForCurrent)) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          🧠 Gehirntraining
        </h1>
        <p className="text-gray-600">Trainiere dein Gehirn täglich!</p>
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={onShare} className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium">📤 Teilen</button>
          {friendCount > 0 && (
            <button onClick={onShowFriends} className="px-4 py-2 rounded-xl bg-white border text-sm font-medium">👥 Freunde ({friendCount})</button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Streak */}
        <div className="card text-center">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-2xl font-bold text-gray-800">{progress.currentStreak}</div>
          <div className="text-sm text-gray-500">Tage Streak</div>
        </div>

        {/* Level */}
        <div className="card text-center">
          <div className="text-3xl mb-1">⭐</div>
          <div className="text-2xl font-bold text-gray-800">Level {progress.level}</div>
          <div className="text-sm text-gray-500">{progress.totalPoints} Punkte</div>
        </div>

        {/* Today */}
        <div className="card text-center">
          <div className="text-3xl mb-1">📅</div>
          <div className="text-2xl font-bold text-gray-800">{todayProgress.points}</div>
          <div className="text-sm text-gray-500">Punkte heute</div>
        </div>

        {/* Games */}
        <div className="card text-center">
          <div className="text-3xl mb-1">🎮</div>
          <div className="text-2xl font-bold text-gray-800">{progress.gamesPlayed}</div>
          <div className="text-sm text-gray-500">Spiele gesamt</div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700">Level {progress.level}</span>
          <span className="text-sm text-gray-500">
            {progress.totalPoints} / {pointsForNext} Punkte
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(levelProgress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Noch {pointsForNext - progress.totalPoints} Punkte bis Level {progress.level + 1}
        </p>
      </div>

      {/* Exercise Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tägliche Übungen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map(exercise => {
            const isCompleted = todayProgress.exercisesCompleted.includes(exercise.type);
            const stats = progress.exerciseStats[exercise.type];
            
            return (
              <button
                key={exercise.type}
                onClick={() => onSelectExercise(exercise.type)}
                className={`card-hover text-left relative overflow-hidden ${
                  isCompleted ? 'ring-2 ring-success-400' : ''
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-20 bg-gradient-to-br ${exercise.color}`} />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl ${exercise.bgColor} flex items-center justify-center text-2xl`}>
                      {exercise.emoji}
                    </div>
                    {isCompleted && (
                      <span className="bg-success-100 text-success-700 text-xs px-2 py-1 rounded-full font-medium">
                        ✓ Heute gespielt
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {exercise.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">{exercise.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>🏆 Best: {stats.bestScore}</span>
                    <span>🎯 Gespielt: {stats.played}x</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Streak Motivation */}
      {progress.currentStreak > 0 && (
        <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🔥</div>
            <div>
              <h3 className="font-bold text-amber-800">
                {progress.currentStreak} Tage Streak!
              </h3>
              <p className="text-amber-600 text-sm">
                {progress.currentStreak >= 7
                  ? 'Unglaublich! Eine ganze Woche am Stück!'
                  : progress.currentStreak >= 3
                  ? 'Super! Bleib dran!'
                  : 'Guter Start! Spiele morgen wieder!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {progress.gamesPlayed > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Statistik</h2>
          <div className="card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {exercises.map(exercise => {
                const stats = progress.exerciseStats[exercise.type];
                return (
                  <div key={exercise.type} className={`${exercise.bgColor} rounded-xl p-4 text-center`}>
                    <div className="text-2xl mb-2">{exercise.emoji}</div>
                    <div className="font-bold text-gray-800">{stats.totalPoints}</div>
                    <div className="text-xs text-gray-500">Punkte gesamt</div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Längster Streak</span>
                <span className="font-semibold text-gray-700">{progress.longestStreak} Tage</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-400 text-sm">
        <p>Trainiere täglich für beste Ergebnisse! 💪</p>
      </footer>
    </div>
  );
}

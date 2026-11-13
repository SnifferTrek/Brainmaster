import { useState } from 'react';
import { getRecommendation } from '../utils/trainingPlan';
import TrainingPlan, { TrainingPlanCard } from './TrainingPlan';
import type { ReactNode } from 'react';
import type { UserProgress, ExerciseType } from '../types';
import { getPointsForNextLevel, getPointsForCurrentLevel, getTodayProgress, getDifficultyLabel, getUnlockedCount, ACHIEVEMENT_DEFINITIONS } from '../utils/storage';

interface DashboardProps {
  onRepeatIntro: () => void;
  progress: UserProgress;
  onSelectExercise: (type: ExerciseType) => void;
  onStartIQ: () => void;
  onShare: () => void;
  onShowFriends: () => void;
  friendCount: number;
  challengeCard?: ReactNode;
  onShowStatistics: () => void;
  onShowAchievements: () => void;
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

export default function Dashboard({ progress, onSelectExercise, onStartIQ, onShowStatistics, onShowAchievements, onRepeatIntro, challengeCard, onShare, onShowFriends, friendCount }: DashboardProps) {
  const [showPlan, setShowPlan] = useState(false);
  const todayProgress = getTodayProgress();
  const recommended = getRecommendation(progress).next;
  const pointsForNext = getPointsForNextLevel(progress.level);
  const pointsForCurrent = getPointsForCurrentLevel(progress.level);
  const levelProgress = ((progress.totalPoints - pointsForCurrent) / (pointsForNext - pointsForCurrent)) * 100;
  const unlockedAchievements = getUnlockedCount();
  const totalAchievements = ACHIEVEMENT_DEFINITIONS.length;

  if (showPlan) {
    return <TrainingPlan progress={progress} onBack={() => setShowPlan(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          🧠 Gehirntraining
        </h1>
        <p className="text-gray-600">Trainiere dein Gehirn täglich!</p>
        
        {/* Navigation Buttons */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={onShowStatistics}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <span>📊</span>
            Statistiken
          </button>
          <button
            onClick={onShowAchievements}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-full text-sm font-medium text-amber-700 hover:from-amber-100 hover:to-amber-200 transition-all shadow-sm"
          >
            <span>🏆</span>
            Achievements
            <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">
              {unlockedAchievements}/{totalAchievements}
            </span>
          </button>
          <button
            onClick={() => setShowPlan(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-all shadow-sm"
          >
            <span>🎯</span>
            Trainingsplan
          </button>
          <button onClick={onShare} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-all shadow-sm">📤 Teilen</button>
          {friendCount > 0 && (
            <button onClick={onShowFriends} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm">👥 Freunde ({friendCount})</button>
          )}
        </div>
      </div>

      {challengeCard}

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

      <TrainingPlanCard
        progress={progress}
        exercises={exercises}
        onSelectExercise={onSelectExercise}
        onOpenPlan={() => setShowPlan(true)}
      />

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

      <button
        onClick={onStartIQ}
        className="w-full mb-8 p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-700 text-white text-left shadow-lg hover:shadow-xl transition-shadow flex items-center gap-4"
      >
        <span className="text-4xl">🧠</span>
        <span className="flex-1">
          <span className="block text-xl font-bold">🧠 IQ-Test</span>
          <span className="block text-sm text-blue-100">30 Fragen · ca. 15–20 Min. · Geschätzter IQ mit Profil-Analyse</span>
        </span>
        <span className="text-2xl">→</span>
      </button>

      {/* Exercise Selection */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tägliche Übungen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map(exercise => {
            const isCompleted = todayProgress.exercisesCompleted.includes(exercise.type);
            const stats = progress.exerciseStats[exercise.type];
            const isRecommended = recommended === exercise.type;
            const diffLevel = progress.difficulty[exercise.type].level;
            
            return (
              <button
                key={exercise.type}
                onClick={() => onSelectExercise(exercise.type)}
                className={`card-hover text-left relative overflow-hidden ${
                  isRecommended ? 'ring-4 ring-primary-400 shadow-lg' : isCompleted ? 'ring-2 ring-success-400' : ''
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-20 bg-gradient-to-br ${exercise.color}`} />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl ${exercise.bgColor} flex items-center justify-center text-2xl`}>
                      {exercise.emoji}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                        Stufe {diffLevel}
                      </span>
                      {isRecommended && (
                        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                          👉 Als Nächstes empfohlen
                        </span>
                      )}
                      {isCompleted && !isRecommended && (
                        <span className="bg-success-100 text-success-700 text-xs px-2 py-1 rounded-full font-medium">
                          ✓ Heute gespielt
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {exercise.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-1">{exercise.description}</p>
                  <p className="text-xs text-amber-600 mb-3">{getDifficultyLabel(diffLevel)}</p>
                  
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
        <button onClick={onRepeatIntro} className="mt-2 underline hover:text-gray-600">Einführung wiederholen</button>
      </footer>
    </div>
  );
}

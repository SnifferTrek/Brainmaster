import { useState } from 'react';
import { getRecommendation } from '../utils/trainingPlan';
import { TrainingPlanCard } from './TrainingPlan';
import type { ReactNode } from 'react';
import type { UserProgress, ExerciseType } from '../types';
import ProfileCard from './ProfileCard';
import { getPointsForNextLevel, getPointsForCurrentLevel, getTodayProgress, getDifficultyLabel } from '../utils/storage';

interface DashboardProps {
  onRepeatIntro: () => void;
  progress: UserProgress;
  onSelectExercise: (type: ExerciseType) => void;
  onStartIQ: () => void;
  onShare: () => void;
  onShowFriends: () => void;
  friendCount: number;
  challengeCard?: ReactNode;
  onShowPlan: () => void;
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

export default function Dashboard({ progress, onSelectExercise, onStartIQ, onShowPlan, onRepeatIntro, challengeCard, onShare, onShowFriends, friendCount }: DashboardProps) {
  const [showProfile, setShowProfile] = useState(false);
  const todayProgress = getTodayProgress();
  const recommended = getRecommendation(progress).next;
  const pointsForNext = getPointsForNextLevel(progress.level);
  const pointsForCurrent = getPointsForCurrentLevel(progress.level);
  const levelProgress = ((progress.totalPoints - pointsForCurrent) / (pointsForNext - pointsForCurrent)) * 100;

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          🧠 Gehirntraining
        </h1>
        <p className="text-gray-600">Trainiere dein Gehirn täglich!</p>
      </header>

      <div className="card mb-6">
        <div className="grid grid-cols-3 divide-x divide-gray-100 text-center mb-4">
          <div><div className="text-2xl font-bold text-gray-800">🔥 {progress.currentStreak}</div><div className="text-xs text-gray-500">Tage Streak</div></div>
          <div><div className="text-2xl font-bold text-gray-800">📅 {todayProgress.points}</div><div className="text-xs text-gray-500">Punkte heute</div></div>
          <div><div className="text-2xl font-bold text-gray-800">🎮 {progress.gamesPlayed}</div><div className="text-xs text-gray-500">Spiele gesamt</div></div>
        </div>
        <div className="flex items-center justify-between mb-1 text-sm">
          <span className="font-semibold text-gray-700">⭐ Level {progress.level}</span>
          <span className="text-gray-500">{progress.totalPoints} / {pointsForNext} Punkte</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(levelProgress, 100))}%` }} />
        </div>
      </div>

      {challengeCard && <div className="mb-8">{challengeCard}</div>}

      <Section title="Empfehlung">
        <TrainingPlanCard
          progress={progress}
          exercises={exercises}
          onSelectExercise={onSelectExercise}
          onOpenPlan={onShowPlan}
        />
      </Section>

      <Section title="Tägliche Übungen">
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
                    <div className={`w-12 h-12 rounded-xl ${exercise.bgColor} flex items-center justify-center text-2xl`}>{exercise.emoji}</div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">Stufe {diffLevel}</span>
                      {isRecommended && <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full font-medium">👉 Empfohlen</span>}
                      {isCompleted && !isRecommended && <span className="bg-success-100 text-success-700 text-xs px-2 py-1 rounded-full font-medium">✓ Heute gespielt</span>}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{exercise.title}</h3>
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
      </Section>

      <Section title="IQ-Test">
        <button
          onClick={onStartIQ}
          className="w-full p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-700 text-white text-left shadow-lg hover:shadow-xl transition-shadow flex items-center gap-4"
        >
          <span className="text-4xl">🧠</span>
          <span className="flex-1">
            <span className="block text-xl font-bold">IQ-Test</span>
            <span className="block text-sm text-blue-100">30 Fragen · ca. 15–20 Min. · Geschätzter IQ mit Profil-Analyse</span>
          </span>
          <span className="text-2xl">→</span>
        </button>
      </Section>

      <Section title="Community">
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setShowProfile(true)} className="card-hover text-center py-4"><div className="text-2xl">🎴</div><div className="text-sm font-medium text-gray-700">Profil</div></button>
          <button onClick={onShare} className="card-hover text-center py-4"><div className="text-2xl">📤</div><div className="text-sm font-medium text-gray-700">Teilen</div></button>
          <button onClick={onShowFriends} className="card-hover text-center py-4"><div className="text-2xl">👥</div><div className="text-sm font-medium text-gray-700">Freunde{friendCount > 0 ? ` (${friendCount})` : ''}</div></button>
        </div>
        {showProfile && <ProfileCard progress={progress} onClose={() => setShowProfile(false)} />}
      </Section>

      <footer className="text-center text-gray-400 text-sm">
        <button onClick={onRepeatIntro} className="underline hover:text-gray-600">Einführung wiederholen</button>
      </footer>
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import type { UserProgress, ExerciseType, GameResult, AchievementId } from './types';
import { getProgress, updateProgressWithResult, getDifficulty, checkAndUnlockAchievements } from './utils/storage';
import Dashboard from './components/Dashboard';
import LogicGame from './components/LogicGame';
import MemoryGame from './components/MemoryGame';
import MathGame from './components/MathGame';
import WordGame from './components/WordGame';
import Statistics from './components/Statistics';
import Achievements from './components/Achievements';
import AchievementToast from './components/AchievementToast';
import Onboarding from './components/Onboarding';
import { isOnboardingDone } from './utils/onboarding';
import { saveProgress, getPointsForCurrentLevel } from './utils/storage';

type View = 'dashboard' | 'statistics' | 'achievements' | ExerciseType;

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [newAchievements, setNewAchievements] = useState<AchievementId[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());

  const handleOnboardingFinish = useCallback((startLevel: number | null) => {
    if (startLevel && startLevel > 1) {
      const p = getProgress();
      if (p.totalPoints === 0) {
        p.totalPoints = getPointsForCurrentLevel(startLevel);
        p.level = startLevel;
        saveProgress(p);
      }
    }
    setProgress(getProgress());
    setShowOnboarding(false);
    setCurrentView('dashboard');
  }, []);

  useEffect(() => {
    const loadedProgress = getProgress();
    setProgress(loadedProgress);
    checkAndUnlockAchievements(loadedProgress);
  }, []);

  const handleSelectExercise = useCallback((type: ExerciseType) => {
    setCurrentView(type);
  }, []);

  const handleShowStatistics = useCallback(() => {
    setCurrentView('statistics');
  }, []);

  const handleShowAchievements = useCallback(() => {
    setCurrentView('achievements');
  }, []);

  const handleGameComplete = useCallback((result: GameResult) => {
    const newProgress = updateProgressWithResult(result);
    setProgress(newProgress);
    setLastScore(result.score);
    setShowCelebration(true);
    
    const unlockedAchievements = checkAndUnlockAchievements(newProgress);
    
    setTimeout(() => {
      setShowCelebration(false);
      if (unlockedAchievements.length > 0) {
        setNewAchievements(unlockedAchievements);
      }
      setCurrentView('dashboard');
    }, 2000);
  }, []);

  const handleAchievementToastComplete = useCallback(() => {
    setNewAchievements([]);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentView('dashboard');
  }, []);

  const renderGame = () => {
    switch (currentView) {
      case 'logic':
        return <LogicGame onComplete={handleGameComplete} onBack={handleBack} difficulty={getDifficulty('logic')} />;
      case 'memory':
        return <MemoryGame onComplete={handleGameComplete} onBack={handleBack} difficulty={getDifficulty('memory')} />;
      case 'math':
        return <MathGame onComplete={handleGameComplete} onBack={handleBack} difficulty={getDifficulty('math')} />;
      case 'words':
        return <WordGame onComplete={handleGameComplete} onBack={handleBack} difficulty={getDifficulty('words')} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {showOnboarding && <Onboarding onFinish={handleOnboardingFinish} />}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl animate-scaleIn max-w-sm mx-4">
            <div className="text-6xl mb-4 animate-bounce-slow">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Großartig!</h2>
            <p className="text-gray-600 mb-4">
              Du hast <span className="font-bold text-primary-600">+{lastScore}</span> Punkte verdient!
            </p>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="text-2xl animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {newAchievements.length > 0 && (
        <AchievementToast 
          achievementIds={newAchievements} 
          onComplete={handleAchievementToastComplete} 
        />
      )}

      {currentView === 'dashboard' ? (
        <Dashboard 
          progress={progress} 
          onSelectExercise={handleSelectExercise} 
          onShowStatistics={handleShowStatistics}
          onShowAchievements={handleShowAchievements}
          onRepeatIntro={() => setShowOnboarding(true)}
        />
      ) : currentView === 'statistics' ? (
        <Statistics progress={progress} onBack={handleBack} />
      ) : currentView === 'achievements' ? (
        <Achievements onBack={handleBack} />
      ) : (
        <div className="px-4 py-8">
          {renderGame()}
        </div>
      )}
    </div>
  );
}

export default App;

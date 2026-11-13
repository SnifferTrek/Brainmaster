import { useState, useCallback, useEffect, useRef } from 'react';
import type { UserProgress, ExerciseType, GameResult, AchievementId } from './types';
import { playLevelUp, playAchievement, playDailyChallengeComplete } from './utils/sounds';
import SoundToggle from './components/SoundToggle';
import { getProgress, getTodayProgress, updateProgressWithResult, getDifficulty, checkAndUnlockAchievements } from './utils/storage';
import Dashboard from './components/Dashboard';
import LogicGame from './components/LogicGame';
import MemoryGame from './components/MemoryGame';
import MathGame from './components/MathGame';
import WordGame from './components/WordGame';
import ChallengeCard from './components/ChallengeCard';
import {
  getChallengeForDate, completeChallenge, isChallengeCompleted, getChallengeValue,
  emptyLiveStats, type Challenge, type LiveStats,
} from './utils/challenges';
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

  const [live, setLive] = useState<LiveStats>(emptyLiveStats());
  const [toast, setToast] = useState<Challenge | null>(null);
  const [challenge, setChallenge] = useState<Challenge>(() => getChallengeForDate());
  const [completed, setCompleted] = useState(() => isChallengeCompleted(getChallengeForDate().id));
  const sessionPoints = useRef(0);

  useEffect(() => {
    const loadedProgress = getProgress();
    setProgress(loadedProgress);
    checkAndUnlockAchievements(loadedProgress);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const c = getChallengeForDate();
      setChallenge(prev => (prev.id === c.id ? prev : c));
      setCompleted(isChallengeCompleted(c.id));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (completed) return;
    const value = getChallengeValue(challenge, live, getTodayProgress().exercisesCompleted);
    if (value >= challenge.target) {
      const updated = completeChallenge(challenge);
      if (updated) {
        setProgress(updated);
        setToast(challenge);
        setTimeout(() => setToast(null), 5000);
      }
      setCompleted(true);
    }
  }, [live, challenge, completed, progress]);

  const handleSelectExercise = useCallback((type: ExerciseType) => {
    setLive(prev => ({ ...emptyLiveStats(sessionPoints.current), memoryScore: prev.memoryScore, mathBest: prev.mathBest, logicBest: prev.logicBest }));
    setCurrentView(type);
  }, []);

  const handleAnswer = useCallback((type: 'math' | 'logic', correct: boolean) => {
    setLive(prev => {
      const run = correct ? (type === 'math' ? prev.mathRun : prev.logicRun) + 1 : 0;
      return type === 'math'
        ? { ...prev, mathRun: run, mathBest: Math.max(prev.mathBest, run) }
        : { ...prev, logicRun: run, logicBest: Math.max(prev.logicBest, run) };
    });
  }, []);

  const handleScoreChange = useCallback((score: number) => {
    setLive(prev => (prev.currentScore === score ? prev : { ...prev, currentScore: score }));
  }, []);

  const handleShowStatistics = useCallback(() => {
    setCurrentView('statistics');
  }, []);

  const handleShowAchievements = useCallback(() => {
    setCurrentView('achievements');
  }, []);

  const handleGameComplete = useCallback((result: GameResult) => {
    const oldLevel = getProgress().level;
    const doneBefore = getTodayProgress().exercisesCompleted.length;
    const newProgress = updateProgressWithResult(result);
    const allDone = doneBefore < 4 && getTodayProgress().exercisesCompleted.length >= 4;
    if (newProgress.level > oldLevel) playLevelUp();
    else if (allDone) playDailyChallengeComplete();
    else if (result.score >= result.maxScore) playAchievement();
    sessionPoints.current += result.score;
    setLive(prev => ({
      ...prev,
      currentScore: 0,
      sessionPoints: sessionPoints.current,
      memoryScore: result.type === 'memory' ? Math.max(prev.memoryScore, result.score) : prev.memoryScore,
    }));
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
        return <LogicGame onComplete={handleGameComplete} onBack={handleBack} difficulty={getDifficulty('logic')} onAnswer={c => handleAnswer('logic', c)} onScoreChange={handleScoreChange} />;
      case 'memory':
        return <MemoryGame onComplete={handleGameComplete} onBack={handleBack} difficulty={getDifficulty('memory')} />;
      case 'math':
        return <MathGame onComplete={handleGameComplete} onBack={handleBack} difficulty={getDifficulty('math')} onAnswer={c => handleAnswer('math', c)} onScoreChange={handleScoreChange} />;
      case 'words':
        return <WordGame onComplete={handleGameComplete} onBack={handleBack} difficulty={getDifficulty('words')} onScoreChange={handleScoreChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-scaleIn w-[92%] max-w-sm">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
            <div className="text-4xl">🏆</div>
            <div>
              <div className="font-bold">Challenge abgeschlossen!</div>
              <div className="text-sm">{toast.description} · +{toast.bonus} Bonuspunkte</div>
            </div>
          </div>
        </div>
      )}

      <SoundToggle />
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
          challengeCard={
            <ChallengeCard
              challenge={challenge}
              completed={completed}
              value={getChallengeValue(challenge, live, getTodayProgress().exercisesCompleted)}
            />
          }
        />
      ) : currentView === 'statistics' ? (
        <Statistics progress={progress} onBack={handleBack} />
      ) : currentView === 'achievements' ? (
        <Achievements onBack={handleBack} />
      ) : (
        <div className="px-4 py-8">
          <div className="mb-4">
            <ChallengeCard
              compact
              challenge={challenge}
              completed={completed}
              value={getChallengeValue(challenge, live, getTodayProgress().exercisesCompleted)}
            />
          </div>
          {renderGame()}
        </div>
      )}
    </div>
  );
}

export default App;

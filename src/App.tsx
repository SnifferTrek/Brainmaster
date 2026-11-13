import { useState, useCallback, useEffect } from 'react';
import type { UserProgress, ExerciseType, GameResult } from './types';
import { getProgress, updateProgressWithResult } from './utils/storage';
import Dashboard from './components/Dashboard';
import LogicGame from './components/LogicGame';
import MemoryGame from './components/MemoryGame';
import MathGame from './components/MathGame';
import WordGame from './components/WordGame';
import IQTest from './iq/IQTest';

type View = 'dashboard' | 'iq' | ExerciseType;

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const handleSelectExercise = useCallback((type: ExerciseType) => {
    setCurrentView(type);
  }, []);

  const handleGameComplete = useCallback((result: GameResult) => {
    const newProgress = updateProgressWithResult(result);
    setProgress(newProgress);
    setLastScore(result.score);
    setShowCelebration(true);
    
    setTimeout(() => {
      setShowCelebration(false);
      setCurrentView('dashboard');
    }, 2000);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentView('dashboard');
  }, []);

  const renderGame = () => {
    switch (currentView) {
      case 'iq':
        return <IQTest onBack={handleBack} />;
      case 'logic':
        return <LogicGame onComplete={handleGameComplete} onBack={handleBack} />;
      case 'memory':
        return <MemoryGame onComplete={handleGameComplete} onBack={handleBack} />;
      case 'math':
        return <MathGame onComplete={handleGameComplete} onBack={handleBack} />;
      case 'words':
        return <WordGame onComplete={handleGameComplete} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
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

      {currentView === 'dashboard' ? (
        <Dashboard progress={progress} onSelectExercise={handleSelectExercise} onStartIQ={() => setCurrentView('iq')} />
      ) : (
        <div className="px-4 py-8">
          {renderGame()}
        </div>
      )}
    </div>
  );
}

export default App;

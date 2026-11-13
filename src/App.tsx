import { useState, useCallback, useEffect, useRef } from 'react';
import type { UserProgress, ExerciseType, GameResult, AchievementId } from './types';
import TrainingSession from './components/TrainingSession';
import { playLevelUp, playAchievement, playDailyChallengeComplete } from './utils/sounds';
import SoundToggle from './components/SoundToggle';
import { getProgress, getTodayProgress, updateProgressWithResult, getDifficulty, checkAndUnlockAchievements } from './utils/storage';
import Dashboard from './components/Dashboard';
import LogicGame from './components/LogicGame';
import MemoryGame from './components/MemoryGame';
import MathGame from './components/MathGame';
import WordGame from './components/WordGame';
import IQTest from './iq/IQTest';
import { NameModal, ShareModal, CompareModal, FriendsModal } from './components/Social';
import { getProfile, createProfile, buildStats, createShareLink, decodeShare, getFriends, saveFriend, removeFriend } from './utils/social';
import type { Profile, SharedStats } from './utils/social';
import ChallengeCard from './components/ChallengeCard';
import {
  getChallengeForDate, completeChallenge, isChallengeCompleted, getChallengeValue,
  emptyLiveStats, type Challenge, type LiveStats,
} from './utils/challenges';
import Statistics from './components/Statistics';
import Achievements from './components/Achievements';
import AchievementToast from './components/AchievementToast';
import TrainingPlan from './components/TrainingPlan';
import Onboarding from './components/Onboarding';
import { isOnboardingDone } from './utils/onboarding';
import { applyPlacementLevel } from './utils/trainingLevel';
import Settings from './components/Settings';

type View = 'dashboard' | 'plan' | 'statistics' | 'achievements' | 'settings' | 'iq' | 'session' | ExerciseType;

const TABS: { view: View; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Start', icon: '🏠' },
  { view: 'plan', label: 'Plan', icon: '🎯' },
  { view: 'statistics', label: 'Statistik', icon: '📊' },
  { view: 'achievements', label: 'Erfolge', icon: '🏆' },
  { view: 'settings', label: 'Einstellungen', icon: '⚙️' },
];

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [newAchievements, setNewAchievements] = useState<AchievementId[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());

  const [profile, setProfile] = useState<Profile | null>(getProfile());
  const [friends, setFriends] = useState<SharedStats[]>(getFriends());
  const [modal, setModal] = useState<'name' | 'share' | 'friends' | 'compare' | null>(null);
  const [afterName, setAfterName] = useState<'share' | 'compare' | null>(null);
  const [incoming, setIncoming] = useState<SharedStats | null>(null);
  const [compareWith, setCompareWith] = useState<SharedStats | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);

  const openIncoming = useCallback((f: SharedStats) => {
    if (getProfile()) {
      setFriends(saveFriend(f));
      setCompareWith(f);
      setModal('compare');
    } else {
      setIncoming(f);
      setAfterName('compare');
      setModal('name');
    }
  }, []);

  useEffect(() => {
    setProgress(getProgress());
    const code = new URLSearchParams(window.location.search).get('share');
    if (code) {
      const f = decodeShare(code);
      window.history.replaceState({}, '', window.location.pathname);
      if (f) openIncoming(f);
      else setInvalidLink(true);
    }
  }, [openIncoming]);

  const handleSaveName = (name: string) => {
    const p = createProfile(name);
    setProfile(p);
    if (afterName === 'compare' && incoming) {
      setFriends(saveFriend(incoming));
      setCompareWith(incoming);
      setIncoming(null);
      setModal('compare');
    } else if (afterName === 'share') {
      setModal('share');
    } else setModal(null);
    setAfterName(null);
  };

  const handleShare = () => {
    if (!profile) {
      setAfterName('share');
      setModal('name');
    } else setModal('share');
  };

  const myStats = profile ? buildStats(profile, progress) : null;
  const handleOnboardingFinish = useCallback((startLevel: number | null) => {
    if (startLevel != null && startLevel >= 1) {
      applyPlacementLevel(startLevel);
    }
    setProgress(getProgress());
    setShowOnboarding(false);
    setCurrentView('dashboard');
  }, []);

  const handleOnboardingStartIQTest = useCallback((startLevel: number) => {
    if (startLevel >= 1) {
      applyPlacementLevel(startLevel);
    }
    setProgress(getProgress());
    setShowOnboarding(false);
    setCurrentView('iq');
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

  const handleStartSession = useCallback(() => {
    setLive(emptyLiveStats(sessionPoints.current));
    setCurrentView('session');
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

  const isTab = TABS.some(t => t.view === currentView);

  const renderGame = () => {
    switch (currentView) {
      case 'iq':
        return (
          <IQTest
            onBack={handleBack}
            onSelectExercise={handleSelectExercise}
            onOpenStatistics={() => setCurrentView('statistics')}
            onStartTraining={() => {
              setProgress(getProgress());
              handleStartSession();
            }}
          />
        );
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
      {showOnboarding && <Onboarding onFinish={handleOnboardingFinish} onStartIQTest={handleOnboardingStartIQTest} />}
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

      {invalidLink && (
        <div className="bg-red-100 text-red-700 text-center text-sm p-2" onClick={() => setInvalidLink(false)}>
          Der Share-Link ist ungültig. (Tippen zum Schließen)
        </div>
      )}
      {modal === 'name' && <NameModal onSave={handleSaveName} onClose={() => { setModal(null); setAfterName(null); setIncoming(null); }} />}
      {modal === 'share' && myStats && <ShareModal link={createShareLink(myStats)} onClose={() => setModal(null)} />}
      {modal === 'compare' && myStats && compareWith && <CompareModal me={myStats} friend={compareWith} onClose={() => setModal(null)} />}
      {modal === 'friends' && myStats && (
        <FriendsModal
          me={myStats}
          friends={friends}
          onCompare={f => { setCompareWith(f); setModal('compare'); }}
          onRemove={id => setFriends(removeFriend(id))}
          onClose={() => setModal(null)}
        />
      )}

      {newAchievements.length > 0 && (
        <AchievementToast 
          achievementIds={newAchievements} 
          onComplete={handleAchievementToastComplete} 
        />
      )}

      <div className={isTab ? 'pb-[calc(5.5rem+env(safe-area-inset-bottom))]' : ''}>
        {currentView === 'dashboard' ? (
          <Dashboard
            progress={progress}
            onSelectExercise={handleSelectExercise}
            onShowPlan={() => setCurrentView('plan')}
            onStartIQ={() => setCurrentView('iq')}
            onStartSession={handleStartSession}
          />
        ) : currentView === 'session' ? (
          <TrainingSession
            progress={progress}
            onProgress={setProgress}
            onExit={() => {
              setProgress(getProgress());
              setCurrentView('dashboard');
            }}
            onNewAchievements={setNewAchievements}
          />
        ) : currentView === 'plan' ? (
          <TrainingPlan progress={progress} onBack={handleBack} onSelectExercise={handleSelectExercise} onStartSession={handleStartSession} />
        ) : currentView === 'statistics' ? (
          <Statistics progress={progress} onBack={handleBack} />
        ) : currentView === 'achievements' ? (
          <div className="max-w-4xl mx-auto px-4 pt-6">
            <Achievements onBack={handleBack} embedded />
          </div>
        ) : currentView === 'settings' ? (
          <Settings
            progress={progress}
            onBack={handleBack}
            onRepeatIntro={() => setShowOnboarding(true)}
            onShare={handleShare}
            onShowFriends={() => setModal('friends')}
            friendCount={friends.length}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-8">
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

      {isTab && (
        <nav
          className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-2 border-gray-200 shadow-[0_-6px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
        >
          <div className="max-w-xl mx-auto grid grid-cols-5 px-1 pt-1">
            {TABS.map(t => {
              const active = currentView === t.view;
              return (
                <button
                  key={t.view}
                  onClick={() => setCurrentView(t.view)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${
                    active
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {active && (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary-600" />
                  )}
                  <span className={`text-lg sm:text-xl ${active ? 'scale-110' : ''} transition-transform`}>{t.icon}</span>
                  <span className="leading-tight text-center">{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;

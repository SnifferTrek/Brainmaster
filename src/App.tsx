import { useState, useCallback, useEffect } from 'react';
import type { UserProgress, ExerciseType, GameResult } from './types';
import { getProgress, updateProgressWithResult } from './utils/storage';
import Dashboard from './components/Dashboard';
import LogicGame from './components/LogicGame';
import MemoryGame from './components/MemoryGame';
import MathGame from './components/MathGame';
import WordGame from './components/WordGame';
import { NameModal, ShareModal, CompareModal, FriendsModal } from './components/Social';
import { getProfile, createProfile, buildStats, createShareLink, decodeShare, getFriends, saveFriend, removeFriend } from './utils/social';
import type { Profile, SharedStats } from './utils/social';

type View = 'dashboard' | ExerciseType;

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(getProgress());
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastScore, setLastScore] = useState(0);

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

      {currentView === 'dashboard' ? (
        <Dashboard progress={progress} onSelectExercise={handleSelectExercise} onShare={handleShare} friendCount={friends.length} onShowFriends={() => setModal('friends')} />
      ) : (
        <div className="px-4 py-8">
          {renderGame()}
        </div>
      )}
    </div>
  );
}

export default App;

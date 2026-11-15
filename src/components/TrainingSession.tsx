import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AchievementId, GameResult, UserProgress } from '../types';
import { getDifficulty, getProgress, updateProgressWithResult, checkAndUnlockAchievements } from '../utils/storage';
import { getDailyGoalStatus } from '../utils/trainingPlan';
import {
  buildSessionConfig,
  exerciseLabel,
  formatSessionTime,
  markSessionActive,
  type SessionRoundRecord,
} from '../utils/trainingSession';
import { getTrainingPlan } from '../utils/iqTrainingPlan';
import { CATEGORY_INFO } from '../iq/questions';
import LogicGame from './LogicGame';
import MemoryGame from './MemoryGame';
import MathGame from './MathGame';
import WordGame from './WordGame';

type Phase = 'exercise' | 'round-result' | 'summary';

interface TrainingSessionProps {
  progress: UserProgress;
  onProgress: (p: UserProgress) => void;
  onExit: () => void;
  onNewAchievements?: (ids: AchievementId[]) => void;
}

export default function TrainingSession({ progress, onProgress, onExit, onNewAchievements }: TrainingSessionProps) {
  const config = useMemo(() => buildSessionConfig(progress), [progress]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('exercise');
  const [rounds, setRounds] = useState<SessionRoundRecord[]>([]);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [extendAfterTime, setExtendAfterTime] = useState(false);
  const startMs = useRef(Date.now());
  const budgetSec = config.budgetMinutes * 60;
  const [elapsedSec, setElapsedSec] = useState(0);

  const totalPlanned = config.queue.length;
  const currentType = config.queue[queueIndex % config.queue.length];
  const plan = getTrainingPlan();
  const timeUp = !extendAfterTime && elapsedSec >= budgetSec;

  const sessionExerciseIndex =
    phase === 'exercise' ? Math.min(rounds.length + 1, totalPlanned) : Math.min(rounds.length, totalPlanned);
  const onExtraRound = rounds.length >= totalPlanned;
  const sessionProgressLabel = onExtraRound
    ? `Zusatz · ${exerciseLabel(currentType)}`
    : `Übung ${sessionExerciseIndex}/${totalPlanned}`;

  useEffect(() => {
    markSessionActive(true);
    return () => markSessionActive(false);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startMs.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const remainingSec = Math.max(0, budgetSec - elapsedSec);

  const persistResult = useCallback(
    (result: GameResult) => {
      const next = updateProgressWithResult(result);
      onProgress(next);
      const unlocked = checkAndUnlockAchievements(next);
      if (unlocked.length > 0) onNewAchievements?.(unlocked);
    },
    [onProgress, onNewAchievements],
  );

  const handleExerciseComplete = useCallback(
    (result: GameResult) => {
      persistResult(result);
      setLastResult(result);
      setRounds(prev => [...prev, { type: result.type, result }]);
      setPhase('round-result');
    },
    [persistResult],
  );

  const goNextExercise = () => {
    setLastResult(null);
    setQueueIndex(i => i + 1);
    setPhase('exercise');
  };

  const endSession = () => {
    markSessionActive(false);
    if (rounds.length > 0) setPhase('summary');
    else onExit();
  };

  const finishSummary = () => {
    markSessionActive(false);
    onExit();
  };

  const planLine = plan
  ? `${plan.dailyMinutes} Min · ${plan.focusAreas.map(f => CATEGORY_INFO[f].short).join(', ')}`
  : `${config.budgetMinutes} Min Training`;

  const renderGame = () => {
    const diff = getDifficulty(currentType);
    const common = {
      onBack: () => {
        if (confirm('Session beenden und zum Start zurück?')) endSession();
      },
      difficulty: diff,
      onComplete: handleExerciseComplete,
      sessionMode: true as const,
    };
    switch (currentType) {
      case 'logic':
        return <LogicGame {...common} onAnswer={() => {}} onScoreChange={() => {}} />;
      case 'memory':
        return <MemoryGame {...common} />;
      case 'math':
        return <MathGame {...common} onAnswer={() => {}} onScoreChange={() => {}} />;
      case 'words':
        return <WordGame {...common} onScoreChange={() => {}} />;
    }
  };

  if (phase === 'summary') {
    const totalPts = rounds.reduce((s, r) => s + r.result.score, 0);
    const dailyGoal = getDailyGoalStatus(getProgress());
    return (
      <div className="max-w-lg mx-auto px-4 py-8 pb-28 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Session abgeschlossen</h1>
        {dailyGoal.reached && (
          <div className="rounded-xl border-2 border-green-300 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-900">
            Tagesziel erreicht — {dailyGoal.done}/{dailyGoal.total} für heute
          </div>
        )}
        <p className="text-center text-gray-500 text-sm">{planLine}</p>
        <div className="card text-center">
          <div className="text-4xl font-bold text-primary-600">{totalPts}</div>
          <div className="text-gray-600">Punkte gesamt</div>
          <p className="text-sm text-gray-500 mt-2">{rounds.length} Übung(en) · {formatSessionTime(elapsedSec)}</p>
        </div>
        <ul className="space-y-2">
          {rounds.map((r, i) => (
            <li key={i} className="card py-3 px-4 flex justify-between text-sm">
              <span>{exerciseLabel(r.type)}</span>
              <span className="font-semibold">+{r.result.score} · {r.result.correctAnswers}/{r.result.totalQuestions}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={finishSummary} className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold text-lg">
          Zum Dashboard
        </button>
      </div>
    );
  }

  if (phase === 'round-result' && lastResult) {
    const dailyGoal = getDailyGoalStatus(getProgress());
    const sessionPlanDone = rounds.length >= totalPlanned;

    return (
      <div className="max-w-lg mx-auto px-4 py-8 pb-28 space-y-4">
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>
            {rounds.length}/{totalPlanned} erledigt · noch {timeUp ? '0:00' : formatSessionTime(remainingSec)}
          </span>
          <button type="button" onClick={endSession} className="text-red-600 font-medium">
            Abbrechen
          </button>
        </div>
        <div className="card text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{exerciseLabel(lastResult.type)} — Runde fertig</h2>
          <div className="text-4xl font-bold text-primary-600">+{lastResult.score}</div>
          <p className="text-sm text-gray-500 mt-2">
            {lastResult.correctAnswers}/{lastResult.totalQuestions} richtig
          </p>
        </div>
        {timeUp && (
          <div className="card bg-amber-50 border border-amber-200 text-center py-3">
            <p className="font-semibold text-amber-900">Übungszeit für heute fertig</p>
            <p className="text-sm text-amber-800 mt-1">Dein Plan war {config.budgetMinutes} Minuten.</p>
          </div>
        )}
        {(dailyGoal.reached || sessionPlanDone) && (
          <div className="card bg-green-50 border-2 border-green-300 text-center py-4">
            <p className="text-lg font-bold text-green-900">
              {dailyGoal.reached ? 'Tagesziel erreicht' : 'Session-Plan geschafft'}
            </p>
            <p className="text-sm text-green-800 mt-1">
              {dailyGoal.reached
                ? `${dailyGoal.done}/${dailyGoal.total} Übungen für heute erledigt.`
                : `${totalPlanned}/${totalPlanned} Übungen dieser Session abgeschlossen.`}
            </p>
          </div>
        )}
        {!dailyGoal.reached && rounds.length < totalPlanned && (
          <p className="text-center text-sm text-primary-800 font-semibold">
            Noch {totalPlanned - rounds.length} von {totalPlanned} Übung(en) im Plan
          </p>
        )}
        <p className="text-center text-gray-700 font-medium">
          {dailyGoal.reached || sessionPlanDone ? 'Möchtest du trotzdem weiterlernen?' : 'Willst du weiterfahren?'}
        </p>
        <button
          type="button"
          onClick={() => {
            if (timeUp) setExtendAfterTime(true);
            goNextExercise();
          }}
          className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold text-lg"
        >
          {dailyGoal.reached || sessionPlanDone
            ? 'Weiterlernen'
            : timeUp
              ? 'Trotzdem weiterfahren'
              : rounds.length < totalPlanned
                ? `Weiter — Übung ${rounds.length + 1}/${totalPlanned}`
                : 'Nächste Übung (Zusatz)'}
        </button>
        <button type="button" onClick={endSession} className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold">
          {dailyGoal.reached ? 'Fertig für heute' : 'Session beenden'}
        </button>
      </div>
    );
  }

  const sessionPct = totalPlanned > 0 ? Math.min(100, (rounds.length / totalPlanned) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-8">
      <div className="flex justify-between items-center mb-2 text-sm gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-gray-800">{sessionProgressLabel}</div>
          <div className="text-gray-500 truncate">{exerciseLabel(currentType)} · {planLine}</div>
        </div>
        <div className="text-right shrink-0">
          <div className={`font-mono font-bold ${remainingSec <= 60 && !extendAfterTime ? 'text-red-600' : 'text-primary-700'}`}>
            {extendAfterTime ? '∞' : formatSessionTime(remainingSec)}
          </div>
          <button type="button" onClick={endSession} className="text-red-600 text-xs font-medium mt-1">
            Session abbrechen
          </button>
        </div>
      </div>
      {!onExtraRound && totalPlanned > 1 && (
        <div className="mb-4">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1">
            <span>Fortschritt Session</span>
            <span>
              {rounds.length}/{totalPlanned} fertig
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${sessionPct}%` }}
            />
          </div>
        </div>
      )}
      {renderGame()}
    </div>
  );
}

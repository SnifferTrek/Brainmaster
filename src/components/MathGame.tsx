import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameResult } from '../types';
import { playCorrect, playWrong, playGameStart } from '../utils/sounds';

interface MathGameProps {
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

function generateProblem(difficulty: number): MathProblem {
  const operations = ['+', '-', '×'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let a: number, b: number, answer: number;
  
  const maxNum = 10 + difficulty * 5;
  
  switch (operation) {
    case '+':
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * maxNum) + 5;
      b = Math.floor(Math.random() * Math.min(a, maxNum)) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * Math.min(12, maxNum / 2)) + 1;
      b = Math.floor(Math.random() * Math.min(12, maxNum / 2)) + 1;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }
  
  const options = [answer];
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + offset;
    if (wrong !== answer && wrong >= 0 && !options.includes(wrong)) {
      options.push(wrong);
    }
  }
  
  return {
    question: `${a} ${operation} ${b} = ?`,
    answer,
    options: options.sort(() => Math.random() - 0.5),
  };
}

export default function MathGame({ onComplete, onBack }: MathGameProps) {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [answered, setAnswered] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    playGameStart();
    const initialProblems: MathProblem[] = [];
    for (let i = 0; i < 20; i++) {
      initialProblems.push(generateProblem(Math.floor(i / 5)));
    }
    setProblems(initialProblems);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameComplete && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [gameComplete]);

  const handleAnswer = useCallback((selectedAnswer: number) => {
    if (gameComplete || showFeedback) return;

    const currentProblem = problems[currentIndex];
    const isCorrect = selectedAnswer === currentProblem.answer;
    
    setShowFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) playCorrect(); else playWrong();
    setAnswered(prev => prev + 1);

    if (isCorrect) {
      const streakBonus = Math.min(streak, 5) * 2;
      setScore(prev => prev + 10 + streakBonus);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setShowFeedback(null);
      if (currentIndex < problems.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        const newProblems = [...problems];
        for (let i = 0; i < 10; i++) {
          newProblems.push(generateProblem(Math.floor((currentIndex + i) / 5)));
        }
        setProblems(newProblems);
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  }, [currentIndex, problems, streak, gameComplete, showFeedback]);

  const handleFinish = useCallback(() => {
    onComplete({
      type: 'math',
      score: Math.min(score, 150),
      maxScore: 150,
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
    });
  }, [onComplete, score, startTime]);

  if (problems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (gameComplete) {
    const finalScore = Math.min(score, 150);
    return (
      <div className="card max-w-lg mx-auto text-center animate-scaleIn">
        <div className="text-6xl mb-4">🔢</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Zeit abgelaufen!</h2>
        <p className="text-gray-600 mb-4">Du hast {answered} Aufgaben bearbeitet</p>
        
        <div className="bg-gradient-to-r from-primary-100 to-accent-100 rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold text-primary-600">{finalScore}</div>
          <div className="text-gray-600">von 150 Punkten</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500">Aufgaben</div>
            <div className="text-xl font-bold text-gray-700">{answered}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500">Punkte/Aufgabe</div>
            <div className="text-xl font-bold text-gray-700">
              {answered > 0 ? (score / answered).toFixed(1) : '0'}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button onClick={onBack} className="btn-secondary">
            Zurück
          </button>
          <button onClick={handleFinish} className="btn-primary">
            Punkte sammeln
          </button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentIndex];
  const progressPercent = (timeLeft / 60) * 100;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <span>←</span> Zurück
        </button>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            timeLeft <= 10 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
          }`}>
            ⏱️ {timeLeft}s
          </span>
          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            {score} Punkte
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            timeLeft <= 10 ? 'bg-red-500' : 'bg-primary-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className={`card transition-all duration-300 ${
        showFeedback === 'correct' ? 'ring-4 ring-success-400' :
        showFeedback === 'wrong' ? 'ring-4 ring-red-400' : ''
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧮</span>
            <span className="text-sm font-medium text-gray-500">Kopfrechnen</span>
          </div>
          {streak > 0 && (
            <span className="bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-sm font-bold animate-bounce-slow">
              🔥 {streak}x Streak
            </span>
          )}
        </div>

        <div className="text-center py-8">
          <div className="text-5xl font-bold text-gray-800 mb-2">
            {currentProblem.question}
          </div>
          <p className="text-gray-500">Wähle die richtige Antwort!</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {currentProblem.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={showFeedback !== null}
              className={`p-4 rounded-xl text-2xl font-bold transition-all duration-200 ${
                showFeedback !== null
                  ? option === currentProblem.answer
                    ? 'bg-success-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                  : 'bg-gray-100 hover:bg-primary-100 hover:text-primary-700 text-gray-700 hover:scale-105 active:scale-95'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center items-center gap-2 mt-4 text-sm text-gray-500">
        <span>Aufgabe #{answered + 1}</span>
        {streak >= 3 && <span className="text-accent-600 font-semibold">• Bonus aktiv!</span>}
      </div>
    </div>
  );
}

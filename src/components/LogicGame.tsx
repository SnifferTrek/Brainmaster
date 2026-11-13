import { useState, useEffect, useCallback } from 'react';
import type { GameResult } from '../types';
import { getDifficultyLabel } from '../utils/storage';

interface LogicGameProps {
  onComplete: (result: GameResult) => void;
  onBack: () => void;
  difficulty: number;
}

type PuzzleType = 'sequence' | 'pattern' | 'oddOne';

interface Puzzle {
  type: PuzzleType;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

function generateSequencePuzzle(difficulty: number): Puzzle {
  const easyPatterns = [
    { start: 2, step: 2 },
    { start: 1, step: 3 },
    { start: 5, step: 5 },
  ];
  
  const mediumPatterns = [
    { start: 2, step: 3 },
    { start: 1, multiplier: 2 },
    { start: 3, step: 7 },
  ];
  
  const hardPatterns = [
    { start: 1, multiplier: 3 },
    { start: 2, square: true },
    { start: 1, fibonacci: true },
    { start: 5, multiplier: 2, add: 1 },
  ];
  
  let patterns;
  if (difficulty <= 3) {
    patterns = easyPatterns;
  } else if (difficulty <= 6) {
    patterns = [...easyPatterns, ...mediumPatterns];
  } else {
    patterns = [...mediumPatterns, ...hardPatterns];
  }
  
  const pattern = patterns[Math.floor(Math.random() * patterns.length)] as Record<string, number | boolean>;
  const sequenceLength = Math.min(3 + Math.floor(difficulty / 3), 6);
  const sequence: number[] = [];
  let current = (pattern.start as number) || 1;
  
  for (let i = 0; i < sequenceLength; i++) {
    sequence.push(current);
    if (pattern.fibonacci) {
      if (i === 0) current = 1;
      else current = sequence[i] + (sequence[i - 1] || 0);
    } else if (pattern.square) {
      current = (i + 2) * (i + 2);
    } else if (pattern.multiplier) {
      current *= pattern.multiplier as number;
      if (pattern.add) current += pattern.add as number;
    } else if (pattern.step) {
      current += pattern.step as number;
    }
  }
  
  const correct = current;
  const options = [correct];
  const spread = Math.max(5, Math.floor(correct * 0.2));
  
  while (options.length < 4) {
    const wrong = correct + (Math.floor(Math.random() * spread * 2) - spread);
    if (wrong !== correct && !options.includes(wrong) && wrong > 0) {
      options.push(wrong);
    }
  }
  
  const shuffled = options.sort(() => Math.random() - 0.5);
  
  return {
    type: 'sequence',
    question: `Welche Zahl kommt als nächstes?\n${sequence.join(', ')}, ?`,
    options: shuffled.map(String),
    correctAnswer: shuffled.indexOf(correct),
    explanation: `Die Folge folgt einem Muster. Die richtige Antwort ist ${correct}.`,
  };
}

function generatePatternPuzzle(difficulty: number): Puzzle {
  const easyPatterns = [
    { shapes: ['🔴', '🔵', '🔴', '🔵', '🔴'], answer: '🔵', name: 'Rot-Blau Wechsel' },
    { shapes: ['🟢', '🟡', '🟢', '🟡', '🟢'], answer: '🟡', name: 'Grün-Gelb Wechsel' },
    { shapes: ['🔺', '🔻', '🔺', '🔻', '🔺'], answer: '🔻', name: 'Dreieck Wechsel' },
  ];
  
  const mediumPatterns = [
    { shapes: ['⭐', '⭐', '🌙', '⭐', '⭐'], answer: '🌙', name: 'Stern-Stern-Mond' },
    { shapes: ['❤️', '💙', '💚', '❤️', '💙'], answer: '💚', name: 'Herz-Farben Folge' },
    { shapes: ['🔴', '🔴', '🔵', '🔵', '🔴', '🔴'], answer: '🔵', name: 'Doppel-Wechsel' },
  ];
  
  const hardPatterns = [
    { shapes: ['🔴', '🔵', '🔵', '🔴', '🔵', '🔵', '🔴'], answer: '🔵', name: '1-2 Muster' },
    { shapes: ['⭐', '🌙', '⭐', '⭐', '🌙', '⭐', '⭐', '⭐'], answer: '🌙', name: 'Fibonacci-Muster' },
    { shapes: ['🟢', '🟡', '🔴', '🟢', '🟡', '🔴', '🟢'], answer: '🟡', name: 'Dreier-Folge' },
    { shapes: ['🔺', '🔻', '🔺', '🔺', '🔻', '🔺', '🔺', '🔺'], answer: '🔻', name: 'Aufbau-Muster' },
  ];
  
  let patterns;
  if (difficulty <= 3) {
    patterns = easyPatterns;
  } else if (difficulty <= 6) {
    patterns = [...easyPatterns, ...mediumPatterns];
  } else {
    patterns = [...mediumPatterns, ...hardPatterns];
  }
  
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const options = ['🔴', '🔵', '⭐', '🌙', '🟢', '🟡', '🔺', '🔻', '❤️', '💙', '💚'];
  
  const correctOption = pattern.answer;
  const wrongOptions = options.filter(o => o !== correctOption).sort(() => Math.random() - 0.5).slice(0, 3);
  const allOptions = [correctOption, ...wrongOptions].sort(() => Math.random() - 0.5);
  
  return {
    type: 'pattern',
    question: `Welches Symbol kommt als nächstes?\n${pattern.shapes.join(' ')} ?`,
    options: allOptions,
    correctAnswer: allOptions.indexOf(correctOption),
    explanation: `Das Muster ist: ${pattern.name}`,
  };
}

function generateOddOnePuzzle(difficulty: number): Puzzle {
  const easySets = [
    { items: ['Hund', 'Katze', 'Auto', 'Vogel'], odd: 2, explanation: 'Auto ist kein Tier' },
    { items: ['Apfel', 'Birne', 'Karotte', 'Banane'], odd: 2, explanation: 'Karotte ist kein Obst' },
    { items: ['Rot', 'Blau', 'Tisch', 'Grün'], odd: 2, explanation: 'Tisch ist keine Farbe' },
  ];
  
  const mediumSets = [
    { items: ['2', '4', '7', '8'], odd: 2, explanation: '7 ist keine gerade Zahl' },
    { items: ['Berlin', 'Hamburg', 'Deutschland', 'München'], odd: 2, explanation: 'Deutschland ist keine Stadt' },
    { items: ['Sonne', 'Mond', 'Stern', 'Wolke'], odd: 3, explanation: 'Wolke ist kein Himmelskörper' },
    { items: ['Piano', 'Gitarre', 'Trommel', 'Mikrofon'], odd: 3, explanation: 'Mikrofon ist kein Instrument' },
  ];
  
  const hardSets = [
    { items: ['Silber', 'Gold', 'Bronze', 'Holz'], odd: 3, explanation: 'Holz ist kein Metall' },
    { items: ['Quadrat', 'Kreis', 'Dreieck', 'Linie'], odd: 3, explanation: 'Linie ist keine Fläche' },
    { items: ['Addition', 'Subtraktion', 'Division', 'Nummer'], odd: 3, explanation: 'Nummer ist keine Operation' },
    { items: ['Mars', 'Venus', 'Sonne', 'Jupiter'], odd: 2, explanation: 'Sonne ist kein Planet' },
    { items: ['Demokratie', 'Monarchie', 'Republik', 'Nation'], odd: 3, explanation: 'Nation ist keine Regierungsform' },
  ];
  
  let sets;
  if (difficulty <= 3) {
    sets = easySets;
  } else if (difficulty <= 6) {
    sets = [...easySets, ...mediumSets];
  } else {
    sets = [...mediumSets, ...hardSets];
  }
  
  const set = sets[Math.floor(Math.random() * sets.length)];
  const shuffledItems = [...set.items].sort(() => Math.random() - 0.5);
  const oddItem = set.items[set.odd];
  
  return {
    type: 'oddOne',
    question: 'Welches passt nicht zu den anderen?',
    options: shuffledItems,
    correctAnswer: shuffledItems.indexOf(oddItem),
    explanation: set.explanation,
  };
}

function generatePuzzle(difficulty: number): Puzzle {
  const generators = [
    () => generateSequencePuzzle(difficulty),
    () => generatePatternPuzzle(difficulty),
    () => generateOddOnePuzzle(difficulty)
  ];
  return generators[Math.floor(Math.random() * generators.length)]();
}

export default function LogicGame({ onComplete, onBack, difficulty }: LogicGameProps) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);

  const numQuestions = Math.min(5 + Math.floor(difficulty / 2), 8);

  useEffect(() => {
    const newPuzzles: Puzzle[] = [];
    for (let i = 0; i < numQuestions; i++) {
      newPuzzles.push(generatePuzzle(difficulty));
    }
    setPuzzles(newPuzzles);
  }, [difficulty, numQuestions]);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === puzzles[currentIndex].correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      const basePoints = 20;
      const difficultyBonus = Math.floor(difficulty * 1.5);
      setScore(prev => prev + basePoints + difficultyBonus);
      setCorrectCount(prev => prev + 1);
    }
    setShowResult(true);
  }, [showResult, puzzles, currentIndex, difficulty]);

  const handleNext = useCallback(() => {
    if (currentIndex < puzzles.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameComplete(true);
    }
  }, [currentIndex, puzzles.length]);

  const handleFinish = useCallback(() => {
    onComplete({
      type: 'logic',
      score,
      maxScore: numQuestions * (20 + Math.floor(difficulty * 1.5)),
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
      correctAnswers: correctCount,
      totalQuestions: numQuestions,
    });
  }, [onComplete, score, startTime, correctCount, numQuestions, difficulty]);

  if (puzzles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (gameComplete) {
    const maxScore = numQuestions * (20 + Math.floor(difficulty * 1.5));
    return (
      <div className="card max-w-lg mx-auto text-center animate-scaleIn">
        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Geschafft!</h2>
        <p className="text-gray-600 mb-4">Du hast das Logik-Training abgeschlossen</p>
        
        <div className="bg-gradient-to-r from-primary-100 to-accent-100 rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold text-primary-600">{score}</div>
          <div className="text-gray-600">von {maxScore} Punkten</div>
          <div className="text-sm text-gray-500 mt-2">
            {correctCount}/{numQuestions} richtig • Stufe {difficulty} ({getDifficultyLabel(difficulty)})
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

  const currentPuzzle = puzzles[currentIndex];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <span>←</span> Zurück
        </button>
        <div className="flex items-center gap-4">
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
            Stufe {difficulty}
          </span>
          <span className="text-sm text-gray-500">Frage {currentIndex + 1}/{puzzles.length}</span>
          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
            {score} Punkte
          </span>
        </div>
      </div>

      <div className="card animate-slideUp">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🧩</span>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {currentPuzzle.type === 'sequence' ? 'Zahlenfolge' : 
             currentPuzzle.type === 'pattern' ? 'Muster' : 'Ausreißer'}
          </span>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-6 whitespace-pre-line">
          {currentPuzzle.question}
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {currentPuzzle.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={`p-4 rounded-xl text-lg font-medium transition-all duration-300 ${
                showResult
                  ? index === currentPuzzle.correctAnswer
                    ? 'bg-success-500 text-white scale-105'
                    : index === selectedAnswer
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                  : 'bg-gray-100 hover:bg-primary-100 hover:text-primary-700 text-gray-700'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {showResult && (
          <div className={`p-4 rounded-xl mb-4 animate-fadeIn ${
            isCorrect ? 'bg-success-50 border border-success-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`font-semibold ${isCorrect ? 'text-success-700' : 'text-red-700'}`}>
              {isCorrect ? '🎉 Richtig!' : '❌ Falsch!'}
            </p>
            <p className="text-gray-600 text-sm mt-1">{currentPuzzle.explanation}</p>
          </div>
        )}

        {showResult && (
          <button onClick={handleNext} className="btn-primary w-full">
            {currentIndex < puzzles.length - 1 ? 'Nächste Frage' : 'Ergebnis anzeigen'}
          </button>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {puzzles.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-primary-500 scale-125'
                : index < currentIndex
                ? 'bg-success-400'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

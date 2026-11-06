import { useState, useEffect, useCallback } from 'react';
import type { GameResult } from '../types';

interface LogicGameProps {
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}

type PuzzleType = 'sequence' | 'pattern' | 'oddOne';

interface Puzzle {
  type: PuzzleType;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

function generateSequencePuzzle(): Puzzle {
  const patterns = [
    { start: 2, step: 3, answer: (n: number[]) => n[n.length - 1] + 3 },
    { start: 1, step: 2, answer: (n: number[]) => n[n.length - 1] + 2 },
    { start: 5, step: 5, answer: (n: number[]) => n[n.length - 1] + 5 },
    { start: 1, multiplier: 2, answer: (n: number[]) => n[n.length - 1] * 2 },
    { start: 3, multiplier: 2, answer: (n: number[]) => n[n.length - 1] * 2 },
  ];
  
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const sequence: number[] = [];
  let current = pattern.start;
  
  for (let i = 0; i < 4; i++) {
    sequence.push(current);
    if ('step' in pattern && pattern.step !== undefined) {
      current += pattern.step;
    } else if ('multiplier' in pattern && pattern.multiplier !== undefined) {
      current *= pattern.multiplier;
    }
  }
  
  const correct = current;
  const options = [correct];
  
  while (options.length < 4) {
    const wrong = correct + (Math.floor(Math.random() * 10) - 5);
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

function generatePatternPuzzle(): Puzzle {
  const patterns = [
    { shapes: ['🔴', '🔵', '🔴', '🔵', '🔴'], answer: '🔵', name: 'Rot-Blau Wechsel' },
    { shapes: ['⭐', '⭐', '🌙', '⭐', '⭐'], answer: '🌙', name: 'Stern-Stern-Mond' },
    { shapes: ['🟢', '🟡', '🟢', '🟡', '🟢'], answer: '🟡', name: 'Grün-Gelb Wechsel' },
    { shapes: ['🔺', '🔻', '🔺', '🔻', '🔺'], answer: '🔻', name: 'Dreieck Wechsel' },
    { shapes: ['❤️', '💙', '💚', '❤️', '💙'], answer: '💚', name: 'Herz-Farben Folge' },
  ];
  
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

function generateOddOnePuzzle(): Puzzle {
  const sets = [
    { items: ['Hund', 'Katze', 'Auto', 'Vogel'], odd: 2, explanation: 'Auto ist kein Tier' },
    { items: ['Apfel', 'Birne', 'Karotte', 'Banane'], odd: 2, explanation: 'Karotte ist kein Obst' },
    { items: ['2', '4', '7', '8'], odd: 2, explanation: '7 ist keine gerade Zahl' },
    { items: ['Rot', 'Blau', 'Tisch', 'Grün'], odd: 2, explanation: 'Tisch ist keine Farbe' },
    { items: ['Berlin', 'Hamburg', 'Deutschland', 'München'], odd: 2, explanation: 'Deutschland ist keine Stadt' },
    { items: ['Sonne', 'Mond', 'Stern', 'Wolke'], odd: 3, explanation: 'Wolke ist kein Himmelskörper' },
  ];
  
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

function generatePuzzle(): Puzzle {
  const generators = [generateSequencePuzzle, generatePatternPuzzle, generateOddOnePuzzle];
  return generators[Math.floor(Math.random() * generators.length)]();
}

export default function LogicGame({ onComplete, onBack }: LogicGameProps) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    const newPuzzles: Puzzle[] = [];
    for (let i = 0; i < 5; i++) {
      newPuzzles.push(generatePuzzle());
    }
    setPuzzles(newPuzzles);
  }, []);

  const handleAnswer = useCallback((answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === puzzles[currentIndex].correctAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 20);
    }
    setShowResult(true);
  }, [showResult, puzzles, currentIndex]);

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
      maxScore: 100,
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
    });
  }, [onComplete, score, startTime]);

  if (puzzles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="card max-w-lg mx-auto text-center animate-scaleIn">
        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Geschafft!</h2>
        <p className="text-gray-600 mb-4">Du hast das Logik-Training abgeschlossen</p>
        
        <div className="bg-gradient-to-r from-primary-100 to-accent-100 rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold text-primary-600">{score}</div>
          <div className="text-gray-600">von 100 Punkten</div>
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

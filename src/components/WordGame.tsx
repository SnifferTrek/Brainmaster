import { useState, useEffect, useCallback } from 'react';
import type { GameResult } from '../types';
import { playCorrect, playWrong, playGameStart } from '../utils/sounds';

interface WordGameProps {
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}

type PuzzleType = 'anagram' | 'association' | 'wordChain';

interface WordPuzzle {
  type: PuzzleType;
  question: string;
  hint?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const ANAGRAMS = [
  { scrambled: 'HCUS', word: 'SUCH', hint: 'Etwas suchen' },
  { scrambled: 'EILBE', word: 'LIEBE', hint: 'Ein starkes Gefühl' },
  { scrambled: 'AUMTR', word: 'TRAUM', hint: 'Passiert beim Schlafen' },
  { scrambled: 'OSNEN', word: 'SONNE', hint: 'Scheint am Tag' },
  { scrambled: 'DMON', word: 'MOND', hint: 'Scheint in der Nacht' },
  { scrambled: 'AUMB', word: 'BAUM', hint: 'Wächst im Wald' },
  { scrambled: 'LBEMU', word: 'BLUME', hint: 'Wächst im Garten' },
  { scrambled: 'ASSREW', word: 'WASSER', hint: 'Zum Trinken' },
  { scrambled: 'EFEUR', word: 'FEUER', hint: 'Es ist heiß' },
  { scrambled: 'NDWI', word: 'WIND', hint: 'Man spürt ihn draußen' },
];

const ASSOCIATIONS = [
  { 
    words: ['Kaffee', 'Milch', 'Zucker'], 
    answer: 'Tasse', 
    wrong: ['Teller', 'Gabel', 'Messer'],
    explanation: 'Alle gehören zum Kaffeetrinken'
  },
  { 
    words: ['Sonne', 'Sand', 'Meer'], 
    answer: 'Strand', 
    wrong: ['Berg', 'Wald', 'Stadt'],
    explanation: 'Alle findet man am Strand'
  },
  { 
    words: ['Stift', 'Papier', 'Radiergummi'], 
    answer: 'Schule', 
    wrong: ['Küche', 'Bad', 'Garten'],
    explanation: 'Alle braucht man in der Schule'
  },
  { 
    words: ['Bett', 'Kissen', 'Decke'], 
    answer: 'Schlaf', 
    wrong: ['Arbeit', 'Sport', 'Essen'],
    explanation: 'Alle gehören zum Schlafen'
  },
  { 
    words: ['Mehl', 'Eier', 'Butter'], 
    answer: 'Kuchen', 
    wrong: ['Suppe', 'Salat', 'Brot'],
    explanation: 'Alle sind Zutaten für Kuchen'
  },
];

const WORD_CHAINS = [
  { 
    start: 'Apfel', 
    chain: ['Baum', 'Wald', 'Tier'], 
    answer: 'Natur',
    wrong: ['Stadt', 'Auto', 'Computer'],
    explanation: 'Alles gehört zur Natur'
  },
  { 
    start: 'Musik', 
    chain: ['Instrument', 'Konzert', 'Künstler'], 
    answer: 'Bühne',
    wrong: ['Küche', 'Garten', 'Keller'],
    explanation: 'Alles gehört zur Musikaufführung'
  },
  { 
    start: 'Fußball', 
    chain: ['Tor', 'Mannschaft', 'Trainer'], 
    answer: 'Stadion',
    wrong: ['Kino', 'Theater', 'Museum'],
    explanation: 'Alles gehört zum Fußball'
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function generateAnagramPuzzle(): WordPuzzle {
  const anagram = ANAGRAMS[Math.floor(Math.random() * ANAGRAMS.length)];
  const wrongWords = ANAGRAMS
    .filter(a => a.word !== anagram.word)
    .map(a => a.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  const options = shuffleArray([anagram.word, ...wrongWords]);
  
  return {
    type: 'anagram',
    question: `Welches Wort versteckt sich hier?\n${anagram.scrambled}`,
    hint: anagram.hint,
    options,
    correctAnswer: options.indexOf(anagram.word),
    explanation: `${anagram.scrambled} ergibt ${anagram.word}`,
  };
}

function generateAssociationPuzzle(): WordPuzzle {
  const assoc = ASSOCIATIONS[Math.floor(Math.random() * ASSOCIATIONS.length)];
  const options = shuffleArray([assoc.answer, ...assoc.wrong]);
  
  return {
    type: 'association',
    question: `Was verbindet diese Wörter?\n${assoc.words.join(' • ')}`,
    options,
    correctAnswer: options.indexOf(assoc.answer),
    explanation: assoc.explanation,
  };
}

function generateWordChainPuzzle(): WordPuzzle {
  const chain = WORD_CHAINS[Math.floor(Math.random() * WORD_CHAINS.length)];
  const options = shuffleArray([chain.answer, ...chain.wrong]);
  
  return {
    type: 'wordChain',
    question: `Welches Wort passt zur Kette?\n${chain.start} → ${chain.chain.join(' → ')} → ?`,
    options,
    correctAnswer: options.indexOf(chain.answer),
    explanation: chain.explanation,
  };
}

function generatePuzzle(): WordPuzzle {
  const generators = [generateAnagramPuzzle, generateAssociationPuzzle, generateWordChainPuzzle];
  return generators[Math.floor(Math.random() * generators.length)]();
}

export default function WordGame({ onComplete, onBack }: WordGameProps) {
  const [puzzles, setPuzzles] = useState<WordPuzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    playGameStart();
    const newPuzzles: WordPuzzle[] = [];
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
    if (correct) playCorrect(); else playWrong();
    if (correct) {
      const points = showHint ? 15 : 20;
      setScore(prev => prev + points);
    }
    setShowResult(true);
  }, [showResult, puzzles, currentIndex, showHint]);

  const handleNext = useCallback(() => {
    if (currentIndex < puzzles.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      setGameComplete(true);
    }
  }, [currentIndex, puzzles.length]);

  const handleFinish = useCallback(() => {
    onComplete({
      type: 'words',
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
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Wortspiel beendet!</h2>
        <p className="text-gray-600 mb-4">Du hast alle Worträtsel gelöst</p>
        
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
  const typeLabels = {
    anagram: 'Anagramm',
    association: 'Wortassoziation',
    wordChain: 'Wortkette',
  };
  const typeEmojis = {
    anagram: '🔤',
    association: '🔗',
    wordChain: '⛓️',
  };

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeEmojis[currentPuzzle.type]}</span>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {typeLabels[currentPuzzle.type]}
            </span>
          </div>
          {currentPuzzle.hint && !showResult && !showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="text-sm text-primary-500 hover:text-primary-700"
            >
              💡 Hinweis
            </button>
          )}
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4 whitespace-pre-line">
          {currentPuzzle.question}
        </h2>

        {showHint && currentPuzzle.hint && !showResult && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 animate-fadeIn">
            <p className="text-amber-700 text-sm">
              💡 {currentPuzzle.hint}
            </p>
          </div>
        )}

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

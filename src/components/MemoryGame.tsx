import { useState, useEffect, useCallback } from 'react';
import type { GameResult } from '../types';
import { playCorrect, playWrong, playGameStart } from '../utils/sounds';
import { getDifficultyLabel } from '../utils/storage';

interface MemoryGameProps {
  onComplete: (result: GameResult) => void;
  onBack: () => void;
  difficulty: number;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🥝', '🍑', '🍒', '🍌', '🥭', '🍍', '🥥'];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function MemoryGame({ onComplete, onBack, difficulty }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const numPairs = Math.min(4 + Math.floor(difficulty / 2), 10);
  const previewTime = Math.max(3000 - (difficulty * 200), 500);
  const flipBackTime = Math.max(1200 - (difficulty * 80), 400);

  useEffect(() => {
    playGameStart();
    const selectedEmojis = shuffleArray(EMOJIS).slice(0, numPairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    const shuffledCards = shuffleArray(cardPairs).map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: true,
      isMatched: false,
    }));
    setCards(shuffledCards);

    const timer = setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
      setShowPreview(false);
    }, previewTime);

    return () => clearTimeout(timer);
  }, [numPairs, previewTime]);

  const handleCardClick = useCallback((cardId: number) => {
    if (isChecking || showPreview) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    if (flippedCards.length >= 2) return;

    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);

      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first)!;
      const secondCard = newCards.find(c => c.id === second)!;

      if (firstCard.emoji === secondCard.emoji) {
        playCorrect();
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first || c.id === second
                ? { ...c, isMatched: true }
                : c
            )
          );
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === numPairs) {
              setGameComplete(true);
            }
            return newMatches;
          });
          setFlippedCards([]);
          setIsChecking(false);
        }, 500);
      } else {
        playWrong();
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first || c.id === second
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setIsChecking(false);
        }, flipBackTime);
      }
    }
  }, [cards, flippedCards, isChecking, showPreview, numPairs, flipBackTime]);

  const calculateScore = useCallback(() => {
    const baseScore = 80 + (difficulty * 10);
    const optimalMoves = numPairs;
    const movePenalty = Math.max(0, (moves - optimalMoves) * 3);
    const difficultyBonus = difficulty * 5;
    return Math.max(20, baseScore - movePenalty + difficultyBonus);
  }, [moves, difficulty, numPairs]);

  const handleFinish = useCallback(() => {
    const perfectMoves = numPairs;
    const successRate = Math.max(0, 1 - ((moves - perfectMoves) / (numPairs * 2)));
    const correctEquivalent = Math.round(numPairs * successRate);
    
    onComplete({
      type: 'memory',
      score: calculateScore(),
      maxScore: 80 + (difficulty * 10) + (difficulty * 5),
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
      correctAnswers: correctEquivalent,
      totalQuestions: numPairs,
    });
  }, [onComplete, calculateScore, startTime, moves, numPairs, difficulty]);

  if (gameComplete) {
    const score = calculateScore();
    const maxScore = 80 + (difficulty * 10) + (difficulty * 5);
    return (
      <div className="card max-w-lg mx-auto text-center animate-scaleIn">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Alle Paare gefunden!</h2>
        <p className="text-gray-600 mb-4">Du hast {moves} Züge gebraucht</p>
        
        <div className="bg-gradient-to-r from-primary-100 to-accent-100 rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold text-primary-600">{score}</div>
          <div className="text-gray-600">von {maxScore} Punkten</div>
          <div className="text-sm text-gray-500 mt-2">
            Stufe {difficulty} ({getDifficultyLabel(difficulty)}) • {numPairs} Paare
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500">Züge</div>
            <div className="text-xl font-bold text-gray-700">{moves}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-gray-500">Zeit</div>
            <div className="text-xl font-bold text-gray-700">
              {Math.floor((Date.now() - startTime) / 1000)}s
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

  const gridCols = numPairs <= 6 ? 4 : numPairs <= 8 ? 4 : 5;

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
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
            Züge: {moves}
          </span>
          <span className="bg-success-100 text-success-700 px-3 py-1 rounded-full text-sm">
            Paare: {matches}/{numPairs}
          </span>
        </div>
      </div>

      {showPreview && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-center animate-pulse">
          <p className="text-amber-700 text-sm">Merke dir die Positionen!</p>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🃏</span>
          <h2 className="text-xl font-semibold text-gray-800">Memory</h2>
        </div>
        
        <p className="text-gray-600 mb-6">Finde alle passenden Paare!</p>

        <div className={`grid gap-3 ${gridCols === 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched || card.isFlipped || isChecking}
              className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all duration-300 transform ${
                card.isMatched
                  ? 'bg-success-100 scale-95 opacity-60'
                  : card.isFlipped
                  ? 'bg-primary-100 scale-105 rotate-0'
                  : 'bg-gradient-to-br from-primary-400 to-accent-400 hover:scale-105 hover:shadow-lg'
              }`}
              style={{
                perspective: '1000px',
              }}
            >
              {card.isFlipped || card.isMatched ? (
                <span className="animate-scaleIn">{card.emoji}</span>
              ) : (
                <span className="text-white text-xl">?</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-gray-500 text-sm mt-4">
        Klicke auf zwei Karten, um sie umzudrehen
      </p>
    </div>
  );
}

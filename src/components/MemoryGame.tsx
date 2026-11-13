import { useState, useEffect, useCallback } from 'react';
import type { GameResult } from '../types';
import { playCorrect, playWrong, playGameStart } from '../utils/sounds';

interface MemoryGameProps {
  onComplete: (result: GameResult) => void;
  onBack: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🥝', '🍑', '🍒'];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function MemoryGame({ onComplete, onBack }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    playGameStart();
    const selectedEmojis = shuffleArray(EMOJIS).slice(0, 6);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    const shuffledCards = shuffleArray(cardPairs).map((emoji, index) => ({
      id: index,
      emoji,
      isFlipped: false,
      isMatched: false,
    }));
    setCards(shuffledCards);
  }, []);

  const handleCardClick = useCallback((cardId: number) => {
    if (isChecking) return;
    
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
            if (newMatches === 6) {
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
        }, 1000);
      }
    }
  }, [cards, flippedCards, isChecking]);

  const calculateScore = useCallback(() => {
    const baseScore = 100;
    const movePenalty = Math.max(0, (moves - 6) * 5);
    return Math.max(20, baseScore - movePenalty);
  }, [moves]);

  const handleFinish = useCallback(() => {
    onComplete({
      type: 'memory',
      score: calculateScore(),
      maxScore: 100,
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
    });
  }, [onComplete, calculateScore, startTime]);

  if (gameComplete) {
    const score = calculateScore();
    return (
      <div className="card max-w-lg mx-auto text-center animate-scaleIn">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Alle Paare gefunden!</h2>
        <p className="text-gray-600 mb-4">Du hast {moves} Züge gebraucht</p>
        
        <div className="bg-gradient-to-r from-primary-100 to-accent-100 rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold text-primary-600">{score}</div>
          <div className="text-gray-600">von 100 Punkten</div>
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

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <span>←</span> Zurück
        </button>
        <div className="flex items-center gap-4">
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
            Züge: {moves}
          </span>
          <span className="bg-success-100 text-success-700 px-3 py-1 rounded-full text-sm">
            Paare: {matches}/6
          </span>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🃏</span>
          <h2 className="text-xl font-semibold text-gray-800">Memory</h2>
        </div>
        
        <p className="text-gray-600 mb-6">Finde alle passenden Paare!</p>

        <div className="grid grid-cols-4 gap-3">
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

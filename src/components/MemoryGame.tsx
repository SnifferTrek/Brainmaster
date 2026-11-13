import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { GameResult } from '../types';
import { playCorrect, playWrong, playGameStart } from '../utils/sounds';
import { getDifficultyLabel } from '../utils/storage';
import { drillSignature, generateUnique } from '../utils/questionSignature';

interface MemoryGameProps {
  onComplete: (result: GameResult) => void;
  onBack: () => void;
  difficulty: number;
  sessionMode?: boolean;
}

type RoundKind = 'order' | 'missing' | 'grid' | 'pattern' | 'logic' | 'numbers';

type Show =
  | { type: 'items'; items: string[]; numbered?: boolean }
  | { type: 'grid'; size: number; cells: number[] }
  | { type: 'text'; lines: string[] };

interface Round {
  kind: RoundKind;
  title: string;
  hint: string;
  show: Show;
  question: string;
  options: string[];
  answer: number;
}

const KIND_META: Record<RoundKind, { label: string; emoji: string }> = {
  order: { label: 'Reihenfolge', emoji: '🔢' },
  missing: { label: 'Fehlendes Element', emoji: '🕵️' },
  grid: { label: 'Raster', emoji: '🔲' },
  pattern: { label: 'Muster', emoji: '🎨' },
  logic: { label: 'Logik', emoji: '🧩' },
  numbers: { label: 'Zahlen', emoji: '🔟' },
};

const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🥝', '🍑', '🍒', '🍌', '🥭', '🍍', '🥥', '🐶', '🐱', '🐸', '🦊', '🐼', '🦁'];
const SHAPES = ['🔺', '🔵', '🟩', '⭐', '🟧', '💜'];
const NAMES = ['Anna', 'Ben', 'Clara', 'David', 'Eva', 'Felix', 'Greta'];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}
const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function withAnswer(correct: string, wrong: string[]) {
  const options = shuffle([correct, ...wrong.filter(w => w !== correct)].slice(0, 4));
  return { options, answer: options.indexOf(correct) };
}

function makeRound(kind: RoundKind, d: number): Round {
  switch (kind) {
    case 'order': {
      const n = Math.min(3 + Math.ceil(d / 2), 7);
      const items = shuffle(EMOJIS).slice(0, n);
      const pos = rnd(0, n - 1);
      const ordinal = ['ersten', 'zweiten', 'dritten', 'vierten', 'fünften', 'sechsten', 'siebten'][pos];
      return {
        kind, title: 'Reihenfolge merken', hint: 'Merke dir die Reihenfolge!',
        show: { type: 'items', items, numbered: true },
        question: `Welches Symbol stand an ${ordinal} Stelle?`,
        ...withAnswer(items[pos], shuffle(items.filter((_, i) => i !== pos)).concat(shuffle(EMOJIS.filter(e => !items.includes(e))))),
      };
    }
    case 'missing': {
      const n = Math.min(4 + Math.floor(d / 2), 8);
      const pool = shuffle(EMOJIS);
      const items = pool.slice(0, n);
      const missing = pool[n];
      return {
        kind, title: 'Was war nicht dabei?', hint: 'Präge dir alle Symbole ein!',
        show: { type: 'items', items },
        question: 'Welches Symbol war NICHT dabei?',
        ...withAnswer(missing, shuffle(items)),
      };
    }
    case 'grid': {
      const size = d >= 6 ? 4 : 3;
      const count = Math.min(2 + Math.floor(d / 2), size * size - 4);
      const cells = shuffle(Array.from({ length: size * size }, (_, i) => i)).slice(0, count);
      const nums = new Set<number>([count]);
      while (nums.size < 4) nums.add(Math.max(1, count + rnd(-2, 2)));
      return {
        kind, title: 'Felder zählen', hint: 'Wie viele Felder leuchten?',
        show: { type: 'grid', size, cells },
        question: 'Wie viele Felder waren markiert?',
        ...withAnswer(String(count), [...nums].map(String)),
      };
    }
    case 'pattern': {
      const unit = shuffle(SHAPES).slice(0, rnd(2, d >= 5 ? 4 : 3));
      const len = unit.length * 2 + rnd(0, 1);
      const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
      const variants = new Set<string>();
      while (variants.size < 3) {
        const v = [...seq];
        const i = rnd(0, v.length - 1);
        v[i] = shuffle(SHAPES.filter(s => s !== v[i]))[0];
        const s = v.join(' ');
        if (s !== seq.join(' ')) variants.add(s);
      }
      return {
        kind, title: 'Muster erkennen', hint: 'Welches Muster siehst du?',
        show: { type: 'items', items: seq },
        question: 'Welches Muster wurde gezeigt?',
        ...withAnswer(seq.join(' '), [...variants]),
      };
    }
    case 'logic': {
      const n = Math.min(3 + Math.floor(d / 4), 4);
      const people = shuffle(NAMES).slice(0, n);
      const lines = people.slice(0, -1).map((p, i) => `${p} ist größer als ${people[i + 1]}.`);
      const askTallest = Math.random() < 0.5;
      return {
        kind, title: 'Logik merken', hint: 'Merke dir die Aussagen und schlussfolgere!',
        show: { type: 'text', lines: shuffle(lines) },
        question: askTallest ? 'Wer ist am größten?' : 'Wer ist am kleinsten?',
        ...withAnswer(askTallest ? people[0] : people[n - 1], people),
      };
    }
    case 'numbers': {
      const n = Math.min(3 + Math.floor(d / 2), 7);
      const nums = Array.from({ length: n }, () => rnd(2, 9 + d * 2));
      const sum = nums.reduce((a, b) => a + b, 0);
      return {
        kind, title: 'Zahlen merken', hint: 'Merke dir die Zahlen und rechne im Kopf!',
        show: { type: 'items', items: nums.map(String) },
        question: 'Wie lautet die Summe aller Zahlen?',
        ...withAnswer(String(sum), [sum - 1, sum + 1, sum - 2, sum + 2, sum + 10].map(String)),
      };
    }
  }
}

const KINDS: RoundKind[] = ['order', 'missing', 'grid', 'pattern', 'logic', 'numbers'];
const TOTAL_ROUNDS = 16;

function roundSig(r: Round): string {
  return drillSignature(`${r.kind}:${r.question}`, r.options[r.answer] ?? '');
}

function buildRounds(d: number): Round[] {
  const kinds: RoundKind[] = [];
  while (kinds.length < TOTAL_ROUNDS) kinds.push(...shuffle(KINDS));
  const rounds: Round[] = [];
  for (const k of kinds.slice(0, TOTAL_ROUNDS)) {
    const prev = rounds.length ? roundSig(rounds[rounds.length - 1]) : null;
    rounds.push(generateUnique(roundSig, () => makeRound(k, d), prev));
  }
  return rounds;
}

type Phase = 'memorize' | 'fading' | 'question' | 'feedback';

function ShowView({ show }: { show: Show }) {
  if (show.type === 'items') {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {show.items.map((it, i) => (
          <div key={i} className="relative w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center text-3xl font-bold text-primary-700">
            {it}
            {show.numbered && <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">{i + 1}</span>}
          </div>
        ))}
      </div>
    );
  }
  if (show.type === 'grid') {
    return (
      <div className={`grid gap-2 mx-auto w-56 ${show.size === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {Array.from({ length: show.size * show.size }, (_, i) => (
          <div key={i} className={`aspect-square rounded-lg ${show.cells.includes(i) ? 'bg-accent-500' : 'bg-gray-100'}`} />
        ))}
      </div>
    );
  }
  return (
    <ul className="space-y-2 text-center text-lg text-gray-800">
      {show.lines.map((l, i) => <li key={i} className="bg-primary-50 rounded-xl px-4 py-2">{l}</li>)}
    </ul>
  );
}

export default function MemoryGame({ onComplete, onBack, difficulty, sessionMode }: MemoryGameProps) {
  const rounds = useMemo(() => buildRounds(difficulty), [difficulty]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('memorize');
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const startTime = useRef(Date.now());
  const timers = useRef<number[]>([]);

  const round = rounds[idx];
  const memorizeMs = round
    ? Math.max(2500, 2000 + (round.show.type === 'items' ? round.show.items.length * 600 : round.show.type === 'text' ? 4500 : 2500) - difficulty * 150)
    : 0;
  const maxScore = 80 + difficulty * 15;

  useEffect(() => { playGameStart(); const t = timers.current; return () => t.forEach(clearTimeout); }, []);

  useEffect(() => {
    if (done) return;
    if (phase === 'memorize') {
      const t = window.setTimeout(() => setPhase('fading'), memorizeMs);
      return () => clearTimeout(t);
    }
    if (phase === 'fading') {
      const t = window.setTimeout(() => setPhase('question'), 700);
      return () => clearTimeout(t);
    }
  }, [idx, phase, done, memorizeMs]);

  const skipMemorize = () => {
    if (phase === 'memorize') setPhase('fading');
  };

  const choose = (i: number) => {
    if (phase !== 'question') return;
    setPicked(i);
    setPhase('feedback');
    const ok = i === round.answer;
    if (ok) { setCorrect(c => c + 1); playCorrect(); } else playWrong();
    timers.current.push(window.setTimeout(() => {
      if (idx + 1 >= rounds.length) setDone(true);
      else { setIdx(idx + 1); setPicked(null); setPhase('memorize'); }
    }, 1100));
  };

  const score = Math.round((correct / rounds.length) * maxScore);
  const seconds = () => Math.floor((Date.now() - startTime.current) / 1000);

  const handleFinish = useCallback(() => {
    onComplete({
      type: 'memory', score, maxScore, timeSpent: seconds(),
      correctAnswers: correct, totalQuestions: rounds.length,
    });
  }, [onComplete, score, maxScore, correct, rounds.length]);

  useEffect(() => {
    if (sessionMode && done) handleFinish();
  }, [sessionMode, done, handleFinish]);

  if (done && !sessionMode) {
    return (
      <div className="card max-w-lg mx-auto text-center animate-scaleIn">
        <div className="text-6xl mb-4">{correct / rounds.length >= 0.7 ? '🏆' : '🧠'}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Gedächtnistest beendet!</h2>
        <p className="text-gray-600 mb-4">{correct} von {rounds.length} Fragen richtig</p>
        <div className="bg-gradient-to-r from-primary-100 to-accent-100 rounded-xl p-6 mb-6">
          <div className="text-4xl font-bold text-primary-600">{score}</div>
          <div className="text-gray-600">von {maxScore} Punkten</div>
          <div className="text-sm text-gray-500 mt-2">Stufe {difficulty} ({getDifficultyLabel(difficulty)})</div>
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={onBack} className="btn-secondary">Zurück</button>
          <button onClick={handleFinish} className="btn-primary">Punkte sammeln</button>
        </div>
      </div>
    );
  }

  const meta = KIND_META[round.kind];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
          <span>←</span> Zurück
        </button>
        <div className="flex items-center gap-2">
          <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">Stufe {difficulty}</span>
          <span className="bg-success-100 text-success-700 px-3 py-1 rounded-full text-sm">✓ {correct}</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all" style={{ width: `${(idx / rounds.length) * 100}%` }} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.emoji}</span>
            <h2 className="text-lg font-semibold text-gray-800">{meta.label}</h2>
          </div>
          <span className="text-sm text-gray-500">Frage {idx + 1}/{rounds.length}</span>
        </div>

        <div className="min-h-[240px] flex flex-col justify-center">
          {phase === 'memorize' ? (
            <div>
              <p className="text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4 text-sm">
                {round.hint}
              </p>
              <ShowView show={round.show} />
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-5 overflow-hidden">
                <div key={idx} className="h-1.5 bg-amber-400 rounded-full origin-left" style={{ animation: `memShrink ${memorizeMs}ms linear forwards` }} />
              </div>
              <button onClick={skipMemorize} className="block mx-auto mt-3 text-xs text-gray-400 underline">Ich bin bereit</button>
            </div>
          ) : phase === 'fading' ? (
            <div className="flex flex-col items-center justify-center py-8 animate-pulse">
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-gray-500 text-lg font-medium">Bereit?</p>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <p className="text-center text-xl font-semibold text-gray-800 mb-5">{round.question}</p>
              <div className="grid grid-cols-2 gap-3">
                {round.options.map((o, i) => {
                  const fb = phase === 'feedback';
                  const style = fb && i === round.answer ? 'bg-success-100 border-success-400 text-success-700'
                    : fb && i === picked ? 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-white border-gray-200 hover:border-primary-400 hover:bg-primary-50';
                  return (
                    <button key={i} onClick={() => choose(i)} disabled={fb}
                      className={`border-2 rounded-xl p-4 text-xl font-medium transition-all ${style}`}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes memShrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
    </div>
  );
}

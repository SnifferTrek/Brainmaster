import { useState, useRef, useEffect } from 'react';
import { saveOnboarding } from '../utils/onboarding';
import type { OnboardingMode } from '../utils/onboarding';

interface Question {
  type: 'logic' | 'memory' | 'math' | 'words';
  label: string;
  q: string;
  options: string[];
  answer: number;
  timeLimit: number;
  memorize?: string;
  memorizeItems?: string[];
}

interface AnswerRecord {
  correct: boolean;
  timeUsed: number;
  timeLimit: number;
}

const QUESTIONS: Question[] = [
  { type: 'logic', label: '🧩 Logik', q: 'Welche Zahl kommt als nächstes? 2, 4, 8, 16, ?', options: ['24', '32', '30', '20'], answer: 1, timeLimit: 15 },
  { type: 'logic', label: '🧩 Logik', q: 'Welche Zahl kommt als nächstes? 3, 6, 11, 18, ?', options: ['25', '27', '26', '29'], answer: 2, timeLimit: 20 },
  {
    type: 'memory',
    label: '🧠 Gedächtnis',
    memorize: 'Merke dir diese Zahlen:',
    memorizeItems: ['7', '3', '9', '1'],
    q: 'Welche Zahl stand an dritter Stelle?',
    options: ['3', '9', '1', '7'],
    answer: 1,
    timeLimit: 10,
  },
  {
    type: 'memory',
    label: '🧠 Gedächtnis',
    memorize: 'Merke dir diese Wörter:',
    memorizeItems: ['Apfel', 'Hund', 'Tisch', 'Mond', 'Auto'],
    q: 'Welches Wort stand an vierter Stelle?',
    options: ['Tisch', 'Hund', 'Mond', 'Auto'],
    answer: 2,
    timeLimit: 12,
  },
  { type: 'math', label: '🔢 Mathe', q: '17 + 26 = ?', options: ['41', '43', '42', '33'], answer: 1, timeLimit: 10 },
  { type: 'math', label: '🔢 Mathe', q: '12 × 7 − 15 = ?', options: ['69', '79', '84', '67'], answer: 0, timeLimit: 15 },
  { type: 'words', label: '📝 Wörter', q: 'Welches Wort ist das Gegenteil von „mutig"?', options: ['stark', 'ängstlich', 'klug', 'laut'], answer: 1, timeLimit: 8 },
  { type: 'words', label: '📝 Wörter', q: 'Welches Wort passt nicht: Rose, Tulpe, Eiche, Nelke?', options: ['Rose', 'Tulpe', 'Eiche', 'Nelke'], answer: 2, timeLimit: 10 },
];

const TOUR = [
  { emoji: '📅', title: 'Tägliche Übungen', text: 'Tägliche Übungen verbessern dein Gehirn.' },
  { emoji: '📈', title: 'Automatische Anpassung', text: 'Dein Level passt sich automatisch an.' },
  { emoji: '🏆', title: 'Achievements', text: 'Sammle Achievements und verfolge deinen Fortschritt.' },
  { emoji: '🎯', title: 'IQ-Test', text: 'Mache den IQ-Test, um dich zu messen.' },
];

const MAX_LEVEL = 10;

type Step = 'welcome' | 'mode' | 'test' | 'result' | 'tourAsk' | 'tour' | 'done';

function MemorizeAutoAdvance({ ms, onDone }: { ms: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [ms, onDone]);
  return null;
}

/**
 * Einstufungs-Stufe 1–10: Genauigkeit (65 %) + Tempo bei richtigen Antworten (35 %).
 * Voller Zeit-Anteil nur bei ≥75 % Restzeit; darunter linearer Abzug — langsame Treffer
 * heben die Stufe nicht künstlich. Stufe 10 nur bei ≥95 % richtig und hohem Zeit-Score.
 */
function calculateLevel(answers: AnswerRecord[]): number {
  if (answers.length === 0) return 1;

  const correctCount = answers.filter(a => a.correct).length;
  const correctRatio = correctCount / answers.length;

  const correctAnswers = answers.filter(a => a.correct);
  let timeScore = 0;
  if (correctAnswers.length > 0) {
    timeScore =
      correctAnswers.reduce((sum, a) => {
        const restRatio = Math.max(0, 1 - a.timeUsed / a.timeLimit);
        const factor = restRatio >= 0.75 ? 1 : restRatio / 0.75;
        return sum + factor;
      }, 0) / correctAnswers.length;
  }

  const combinedScore = correctRatio * 0.65 + timeScore * 0.35;
  let level = Math.min(MAX_LEVEL, Math.max(1, Math.ceil(combinedScore * MAX_LEVEL)));

  if (level >= 10 && (correctRatio < 0.95 || timeScore < 0.85)) {
    level = 9;
  }

  return level;
}

interface OnboardingProps {
  onFinish: (startLevel: number | null, mode: OnboardingMode) => void;
  onStartIQTest?: (startLevel: number) => void;
}

export default function Onboarding({ onFinish, onStartIQTest }: OnboardingProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<OnboardingMode>('practice');
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [tourIndex, setTourIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [memoryPhase, setMemoryPhase] = useState<'memorize' | 'answer'>('answer');
  
  const questionStartTime = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLevel = calculateLevel(answers);
  const correctCount = answers.filter(a => a.correct).length;

  useEffect(() => {
    if (step !== 'test' || qIndex >= QUESTIONS.length) return;
    const q = QUESTIONS[qIndex];
    if (q.type === 'memory' && q.memorizeItems) {
      setMemoryPhase('memorize');
      setPicked(null);
      return;
    }
    setMemoryPhase('answer');
  }, [step, qIndex]);

  useEffect(() => {
    if (step !== 'test' || qIndex >= QUESTIONS.length || memoryPhase !== 'answer') return;
    const q = QUESTIONS[qIndex];
    questionStartTime.current = Date.now();
    setTimeLeft(q.timeLimit);
    setPicked(null);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime.current) / 1000;
      const remaining = Math.max(0, q.timeLimit - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleAnswer(-1);
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, qIndex, memoryPhase]);

  const finish = () => {
    const lvl = mode === 'measure' ? startLevel : null;
    saveOnboarding(mode, lvl);
    onFinish(lvl, mode);
  };

  const afterMode = (m: OnboardingMode) => {
    setMode(m);
    if (m === 'measure') {
      setQIndex(0);
      setAnswers([]);
      setPicked(null);
      setStep('test');
    } else {
      setStep('tourAsk');
    }
  };

  const handleAnswer = (i: number) => {
    if (picked !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setPicked(i);
    const q = QUESTIONS[qIndex];
    const timeUsed = (Date.now() - questionStartTime.current) / 1000;
    const correct = i === q.answer;
    
    const record: AnswerRecord = {
      correct,
      timeUsed: Math.min(timeUsed, q.timeLimit),
      timeLimit: q.timeLimit,
    };
    
    setTimeout(() => {
      setAnswers(prev => [...prev, record]);
      setPicked(null);
      if (qIndex + 1 >= QUESTIONS.length) {
        setStep('result');
      } else {
        setQIndex(qIndex + 1);
      }
    }, 700);
  };

  const dots = (count: number, active: number) => (
    <div className="flex justify-center gap-2 mt-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-primary-600' : 'w-2 bg-gray-300'}`} />
      ))}
    </div>
  );

  const btn = 'w-full py-3 rounded-xl font-semibold transition';
  const primary = `${btn} bg-primary-600 text-white hover:bg-primary-700 shadow-md`;
  const secondary = `${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`;

  const flowSteps: Step[] = mode === 'measure'
    ? ['welcome', 'mode', 'test', 'result', 'tourAsk', 'done']
    : ['welcome', 'mode', 'tourAsk', 'done'];
  const flowActive = Math.max(0, flowSteps.indexOf(step === 'tour' ? 'tourAsk' : step));

  let content;
  switch (step) {
    case 'welcome':
      content = (
        <div className="text-center">
          <div className="text-7xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Willkommen bei Brainmaster!</h1>
          <p className="text-gray-600 mb-8">Trainiere dein Gehirn mit täglichen Übungen.</p>
          <button className={primary} onClick={() => setStep('mode')}>Los geht's</button>
        </div>
      );
      break;
    case 'mode':
      content = (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">Wie möchtest du starten?</h2>
          <p className="text-gray-500 text-center mb-5 text-sm">Dein Fortschritt wird in jedem Fall gespeichert.</p>
          <button onClick={() => afterMode('measure')} className="w-full text-left p-4 rounded-2xl border-2 border-primary-500 bg-primary-50 mb-3 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800">📊 Fortschritt messen</span>
              <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">Empfohlen</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Kurzer Einstufungstest (8 Fragen, ca. 3–5 Minuten) misst dein Start-Level für spätere Vergleiche.</p>
          </button>
          <button onClick={() => afterMode('practice')} className="w-full text-left p-4 rounded-2xl border-2 border-gray-200 bg-white hover:shadow-md transition">
            <span className="font-bold text-gray-800">🚀 Direkt üben</span>
            <p className="text-sm text-gray-600 mt-1">Ohne Einstufungstest direkt zu den Übungen. Tracking bleibt aktiv.</p>
          </button>
          <button className="mt-4 text-sm text-gray-500 underline w-full" onClick={() => setStep('welcome')}>Zurück</button>
        </div>
      );
      break;
    case 'test': {
      const q = QUESTIONS[qIndex];
      const showMemorize = q.type === 'memory' && q.memorizeItems && memoryPhase === 'memorize';
      const memorizeMs = Math.max(3500, (q.memorizeItems?.length ?? 0) * 900);
      const timeProgress = timeLeft / q.timeLimit;
      const isLow = timeLeft <= 5;
      content = (
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{q.label}</span>
            <span>Frage {qIndex + 1} von {QUESTIONS.length}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${(qIndex / QUESTIONS.length) * 100}%` }} />
          </div>

          {showMemorize ? (
            <div className="text-center py-4">
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm font-medium">
                {q.memorize}
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {q.memorizeItems!.map((item, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-xl bg-primary-50 border-2 border-primary-200 flex items-center justify-center text-xl font-bold text-primary-800 relative"
                  >
                    {item}
                    <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4 overflow-hidden">
                <div
                  key={`mem-${qIndex}`}
                  className="h-1.5 bg-amber-400 rounded-full origin-left"
                  style={{ animation: `onbMemShrink ${memorizeMs}ms linear forwards` }}
                />
              </div>
              <button
                type="button"
                onClick={() => setMemoryPhase('answer')}
                className="text-sm text-primary-600 font-semibold underline"
              >
                Ich bin bereit →
              </button>
              <MemorizeAutoAdvance ms={memorizeMs} onDone={() => setMemoryPhase('answer')} />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className={`text-lg font-mono font-bold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                  {Math.ceil(timeLeft)}s
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${timeProgress * 100}%` }}
                  />
                </div>
              </div>

              <h2 className="text-lg font-bold text-gray-800 mb-4">{q.q}</h2>
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((o, i) => {
                  let cls = 'bg-white border-gray-200 hover:border-primary-400';
                  if (picked !== null) {
                    if (i === picked) cls = i === q.answer ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
                    else if (i === q.answer) cls = 'bg-green-100 border-green-500';
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={picked !== null}
                      className={`p-3 rounded-xl border-2 font-semibold text-gray-800 transition ${cls}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      );
      break;
    }
    case 'result': {
      const avgTime = answers.length > 0 
        ? answers.reduce((sum, a) => sum + a.timeUsed, 0) / answers.length 
        : 0;
      content = (
        <div className="text-center">
          <div className="text-6xl mb-3">🎯</div>
          <p className="text-gray-500">{correctCount} von {QUESTIONS.length} richtig</p>
          <p className="text-gray-400 text-sm">Ø {avgTime.toFixed(1)}s pro Frage</p>
          <h2 className="text-3xl font-bold text-primary-600 my-3">Du startest in Stufe {startLevel} von {MAX_LEVEL}</h2>
          <p className="text-gray-600 mb-6">Dein Level passt sich beim Üben automatisch an.</p>
          
          <div className="space-y-3">
            <button 
              className={primary} 
              onClick={() => {
                const lvl = startLevel;
                saveOnboarding(mode, lvl);
                onFinish(lvl, mode);
              }}
            >
              🚀 Direkt zu den Übungen
            </button>
            
            {onStartIQTest && (
              <button 
                className={`${btn} bg-blue-600 text-white hover:bg-blue-700 shadow-md`}
                onClick={() => {
                  const lvl = startLevel;
                  saveOnboarding(mode, lvl);
                  onStartIQTest(lvl);
                }}
              >
                🧠 IQ-Test als Baseline
              </button>
            )}
          </div>
          
          {onStartIQTest && (
            <p className="text-xs text-gray-500 mt-4 px-2">
              Der IQ-Test hilft dir, deinen kognitiven Fortschritt über Zeit zu vergleichen.
            </p>
          )}
        </div>
      );
      break;
    }
    case 'tourAsk':
      content = (
        <div className="text-center">
          <div className="text-6xl mb-3">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Möchtest du eine kurze Einführung?</h2>
          <div className="flex flex-col gap-3">
            <button className={primary} onClick={() => { setTourIndex(0); setStep('tour'); }}>Ja, gerne</button>
            <button className={secondary} onClick={() => setStep('done')}>Nein, direkt zum Dashboard</button>
          </div>
        </div>
      );
      break;
    case 'tour': {
      const t = TOUR[tourIndex];
      content = (
        <div className="text-center">
          <div className="text-7xl mb-4">{t.emoji}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.title}</h2>
          <p className="text-gray-600 mb-8 min-h-12">{t.text}</p>
          <div className="flex gap-3">
            <button className={secondary} onClick={() => tourIndex === 0 ? setStep('tourAsk') : setTourIndex(tourIndex - 1)}>Zurück</button>
            <button className={primary} onClick={() => tourIndex === TOUR.length - 1 ? setStep('done') : setTourIndex(tourIndex + 1)}>
              {tourIndex === TOUR.length - 1 ? 'Fertig' : 'Weiter'}
            </button>
          </div>
          {dots(TOUR.length, tourIndex)}
        </div>
      );
      break;
    }
    case 'done':
      content = (
        <div className="text-center">
          <div className="text-7xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Bereit! Viel Erfolg beim Training.</h2>
          <button className={primary} onClick={finish}>Zum Dashboard</button>
        </div>
      );
      break;
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <style>{`@keyframes onbMemShrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          {content}
          {step !== 'tour' && dots(flowSteps.length, flowActive)}
          {step !== 'done' && step !== 'test' && (
            <button className="block mx-auto mt-4 text-sm text-gray-400 hover:text-gray-600" onClick={() => { saveOnboarding(mode === 'measure' && step !== 'welcome' && step !== 'mode' ? mode : 'practice', null); onFinish(null, 'practice'); }}>
              Überspringen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

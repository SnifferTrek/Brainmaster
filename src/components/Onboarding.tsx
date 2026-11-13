import { useState } from 'react';
import { saveOnboarding } from '../utils/onboarding';
import type { OnboardingMode } from '../utils/onboarding';

interface Question {
  type: 'logic' | 'memory' | 'math' | 'words';
  label: string;
  q: string;
  options: string[];
  answer: number;
}

const QUESTIONS: Question[] = [
  { type: 'logic', label: '🧩 Logik', q: 'Welche Zahl kommt als nächstes? 2, 4, 8, 16, ?', options: ['24', '32', '30', '20'], answer: 1 },
  { type: 'logic', label: '🧩 Logik', q: 'Welche Zahl kommt als nächstes? 3, 6, 11, 18, ?', options: ['25', '27', '26', '29'], answer: 2 },
  { type: 'memory', label: '🧠 Gedächtnis', q: 'Merke dir: 7 – 3 – 9 – 1. Welche Zahl stand an dritter Stelle? (Reihenfolge: 7, 3, 9, 1)', options: ['3', '9', '1', '7'], answer: 1 },
  { type: 'memory', label: '🧠 Gedächtnis', q: 'Merke dir: Apfel, Hund, Tisch, Mond, Auto. Welches Wort stand an vierter Stelle?', options: ['Tisch', 'Hund', 'Mond', 'Auto'], answer: 2 },
  { type: 'math', label: '🔢 Mathe', q: '17 + 26 = ?', options: ['41', '43', '42', '33'], answer: 1 },
  { type: 'math', label: '🔢 Mathe', q: '12 × 7 − 15 = ?', options: ['69', '79', '84', '67'], answer: 0 },
  { type: 'words', label: '📝 Wörter', q: 'Welches Wort ist das Gegenteil von „mutig“?', options: ['stark', 'ängstlich', 'klug', 'laut'], answer: 1 },
  { type: 'words', label: '📝 Wörter', q: 'Welches Wort passt nicht: Rose, Tulpe, Eiche, Nelke?', options: ['Rose', 'Tulpe', 'Eiche', 'Nelke'], answer: 2 },
];

const TOUR = [
  { emoji: '📅', title: 'Tägliche Übungen', text: 'Tägliche Übungen verbessern dein Gehirn.' },
  { emoji: '📈', title: 'Automatische Anpassung', text: 'Dein Level passt sich automatisch an.' },
  { emoji: '🏆', title: 'Achievements', text: 'Sammle Achievements und verfolge deinen Fortschritt.' },
  { emoji: '🎯', title: 'IQ-Test', text: 'Mache den IQ-Test, um dich zu messen.' },
];

type Step = 'welcome' | 'mode' | 'test' | 'result' | 'tourAsk' | 'tour' | 'done';

function levelFromScore(score: number) {
  if (score >= 7) return 4;
  if (score >= 5) return 3;
  if (score >= 3) return 2;
  return 1;
}

export default function Onboarding({ onFinish }: { onFinish: (startLevel: number | null, mode: OnboardingMode) => void }) {
  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<OnboardingMode>('practice');
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [tourIndex, setTourIndex] = useState(0);

  const startLevel = levelFromScore(score);

  const finish = () => {
    const lvl = mode === 'measure' ? startLevel : null;
    saveOnboarding(mode, lvl);
    onFinish(lvl, mode);
  };

  const afterMode = (m: OnboardingMode) => {
    setMode(m);
    if (m === 'measure') {
      setQIndex(0); setScore(0); setPicked(null);
      setStep('test');
    } else {
      setStep('tourAsk');
    }
  };

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const correct = i === QUESTIONS[qIndex].answer;
    setTimeout(() => {
      if (correct) setScore(s => s + 1);
      setPicked(null);
      if (qIndex + 1 >= QUESTIONS.length) setStep('result');
      else setQIndex(qIndex + 1);
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
      content = (
        <div>
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{q.label}</span>
            <span>Frage {qIndex + 1} von {QUESTIONS.length}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full mb-5 overflow-hidden">
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${(qIndex / QUESTIONS.length) * 100}%` }} />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">{q.q}</h2>
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((o, i) => {
              let cls = 'bg-white border-gray-200 hover:border-primary-400';
              if (picked !== null) {
                if (i === picked) cls = 'bg-primary-100 border-primary-500';
              }
              return (
                <button key={i} onClick={() => answer(i)} className={`p-3 rounded-xl border-2 font-semibold text-gray-800 transition ${cls}`}>{o}</button>
              );
            })}
          </div>
        </div>
      );
      break;
    }
    case 'result':
      content = (
        <div className="text-center">
          <div className="text-6xl mb-3">🎯</div>
          <p className="text-gray-500">{score} von {QUESTIONS.length} richtig</p>
          <h2 className="text-3xl font-bold text-primary-600 my-3">Dein Start-Level: {startLevel}</h2>
          <p className="text-gray-600 mb-8">Dein Level passt sich beim Üben automatisch an.</p>
          <button className={primary} onClick={() => setStep('tourAsk')}>Weiter</button>
        </div>
      );
      break;
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

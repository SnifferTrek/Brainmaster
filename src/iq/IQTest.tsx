import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORY_INFO, CATEGORY_ORDER, baselineIdFromHistory, calcIQWithBand, categoryScores, percentileFor,
  iqLabel, IQ_QUESTION_COUNT, GLOBAL_IQ_TIME_LIMIT_SEC, loadHistory, saveResult, generateQuestions,
  questionTimeLimit,
} from './questions';
import type { AnswerRecord, Category, IQResult, Option, Question, Transform } from './questions';
import { ShapeRenderer } from '../shapes/ShapeRenderer';
import {
  ageInterpretationHint, getAgeYears, isProfileEmpty, loadBrainmasterProfile,
} from './demographics';
import IQDemographicsCard from '../components/IQDemographicsCard';
import { saveTrainingPlan, type TrainingPlanInput, type TrainingPlanSettings } from '../utils/iqTrainingPlan';
import { applyIQTrainingLevel } from '../utils/trainingLevel';
import { getReminderPrefs, setReminderEnabled as persistReminderEnabled } from '../utils/reminder';
import type { ExerciseType } from '../types';

type Stage = 'intro' | 'profile' | 'test' | 'result' | 'planTime' | 'planDone' | 'postNoPlan';
type MemoryPhase = 'reveal' | 'recall';

export type { TrainingPlanSettings, TrainingPlanInput };

const TRAINING_TIMES = [
  { value: 5, label: '5 Min' },
  { value: 10, label: '10 Min' },
  { value: 15, label: '15 Min' },
  { value: 30, label: '30 Min' },
];

const GLYPH_INK = '#1e3a8a';

function GlyphSvg({ t, box = 96 }: { t: Transform; box?: number }) {
  return (
    <svg width={box} height={box} viewBox="0 0 100 100">
      <g transform={`rotate(${t.rot} 50 50) ${t.flip ? 'translate(100 0) scale(-1 1)' : ''}`}>
        <polygon points="25,10 75,10 75,28 45,28 45,42 65,42 65,58 45,58 45,90 25,90" fill={GLYPH_INK} />
        <circle cx="31" cy="16" r="3" fill="#fbbf24" />
      </g>
    </svg>
  );
}

function isShape(o: Option): o is import('./questions').ShapeSpec {
  return typeof o === 'object' && o !== null && 'kind' in o;
}

function OptionView({ o }: { o: Option }) {
  if (typeof o === 'string') return <span className="text-lg font-medium">{o}</span>;
  if (isShape(o)) return <ShapeRenderer s={o} />;
  return <GlyphSvg t={o} box={80} />;
}

function fmtGlobalTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.ceil(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function shuffleQ(qs: Question[]) {
  return qs.map(qq => {
    const idx = qq.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return { q: qq, order: idx };
  });
}

function createQuestions() {
  return shuffleQ(generateQuestions());
}

function Radar({ scores, size = 320 }: { scores: Record<Category, number>; size?: number }) {
  const c = size / 2, R = size / 2 - 52, n = CATEGORY_ORDER.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + R * v * Math.cos(a), c + R * v * Math.sin(a)];
  };
  const poly = CATEGORY_ORDER.map((k, i) => pt(i, Math.max(0.04, scores[k] / 100)).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-sm mx-auto">
      {[0.25, 0.5, 0.75, 1].map(l => (
        <polygon key={l} points={CATEGORY_ORDER.map((_, i) => pt(i, l).join(',')).join(' ')} fill="none" stroke="#cbd5e1" strokeWidth="1" />
      ))}
      {CATEGORY_ORDER.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} stroke="#e2e8f0" />)}
      <polygon points={poly} fill="rgba(37,99,235,0.25)" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      {CATEGORY_ORDER.map((k, i) => {
        const [x, y] = pt(i, Math.max(0.04, scores[k] / 100)), [lx, ly] = pt(i, 1.2);
        return (
          <g key={k}>
            <circle cx={x} cy={y} r="4" fill="#2563eb" />
            <text x={lx} y={ly} textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">{CATEGORY_INFO[k].short}</text>
            <text x={lx} y={ly + 14} textAnchor="middle" fontSize="11" fill="#64748b">{scores[k]}%</text>
          </g>
        );
      })}
    </svg>
  );
}

function Gauge({ iq }: { iq: number }) {
  const pct = ((iq - 70) / 75) * 100;
  return (
    <div className="w-full mt-4">
      <div className="relative h-3 rounded-full bg-gradient-to-r from-slate-300 via-blue-400 to-indigo-700">
        <div className="absolute -top-1.5 w-6 h-6 rounded-full bg-white border-4 border-indigo-700 shadow" style={{ left: `calc(${pct}% - 12px)` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2"><span>70</span><span>100</span><span>145</span></div>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function shareResult(r: IQResult) {
  const text = `Mein geschätzter IQ im Brainmaster IQ-Test: ${r.iq} (besser als ${r.percentile}% der Bevölkerung) 🧠`;
  const W = 1000, H = 640;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1e3a8a'); bg.addColorStop(1, '#4338ca');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = '600 34px sans-serif'; g.fillText('🧠 Brainmaster IQ-Test', W / 2, 80);
  g.font = '800 190px sans-serif'; g.fillText(String(r.iq), W / 2, 280);
  g.font = '500 32px sans-serif'; g.fillText(`Geschätzter IQ · ${iqLabel(r.iq)}`, W / 2, 335);
  g.fillText(`Besser als ${r.percentile}% der Bevölkerung`, W / 2, 385);
  const barW = 102;
  CATEGORY_ORDER.forEach((k, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 48 + col * barW;
    const y = 430 + row * 72;
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(x, y, barW - 8, 10);
    g.fillStyle = '#fbbf24'; g.fillRect(x, y, ((barW - 8) * r.categoryScores[k]) / 100, 10);
    g.fillStyle = '#fff'; g.font = '600 18px sans-serif'; g.textAlign = 'left';
    g.fillText(CATEGORY_INFO[k].short, x, y + 32);
    g.font = '16px sans-serif'; g.fillText(`${r.categoryScores[k]}%`, x, y + 52);
  });
  g.textAlign = 'center'; g.font = '20px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillText(`${fmtDate(r.date)} · Schätzwert, kein klinischer IQ-Test`, W / 2, 600);
  const blob: Blob | null = await new Promise(res => cv.toBlob(res, 'image/png'));
  if (!blob) return 'Bild konnte nicht erstellt werden.';
  const file = new File([blob], 'iq-ergebnis.png', { type: 'image/png' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: 'Mein IQ-Ergebnis' });
      return 'Geteilt!';
    }
  } catch { return ''; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'iq-ergebnis.png'; a.click();
  try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  return 'Bild heruntergeladen, Text kopiert.';
}

interface IQTestProps {
  onBack: () => void;
  onStartTraining?: (plan: TrainingPlanInput) => void;
  onSelectExercise?: (type: ExerciseType) => void;
  onOpenStatistics?: () => void;
}

const EXERCISES: { type: ExerciseType; title: string; emoji: string; desc: string }[] = [
  { type: 'logic', title: 'Logik-Rätsel', emoji: '🧩', desc: 'Zahlenfolgen & Muster' },
  { type: 'memory', title: 'Gedächtnis', emoji: '🃏', desc: 'Memory & Sequenzen' },
  { type: 'math', title: 'Kopfrechnen', emoji: '🧮', desc: 'Schnelle Mathe' },
  { type: 'words', title: 'Wortspiele', emoji: '📝', desc: 'Anagramme & mehr' },
];

export default function IQTest({ onBack, onStartTraining, onSelectExercise, onOpenStatistics }: IQTestProps) {
  const [stage, setStage] = useState<Stage>('intro');
  const [history, setHistory] = useState<IQResult[]>(() => loadHistory());
  const [items, setItems] = useState(() => createQuestions());
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<IQResult | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const [selectedTime, setSelectedTime] = useState(10);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [extraModules, setExtraModules] = useState<ExerciseType[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const [memoryPhase, setMemoryPhase] = useState<MemoryPhase | null>(null);
  const [globalLeft, setGlobalLeft] = useState(GLOBAL_IQ_TIME_LIMIT_SEC);
  const startedAt = useRef(0);
  const qStart = useRef(0);
  const locked = useRef(false);
  const timedOutRef = useRef(false);

  const profileAge = useMemo(() => getAgeYears(loadBrainmasterProfile()), [profileVersion, stage]);

  const cur = items[idx];
  const categoryIndex = cur ? CATEGORY_ORDER.indexOf(cur.q.category) : 0;
  const limit = cur
    ? questionTimeLimit(cur.q.category, cur.q.difficulty, categoryIndex)
    : 0;

  const weakAreas = useMemo(() => {
    if (!result) return [] as Category[];
    const sorted = [...CATEGORY_ORDER].sort((a, b) => result.categoryScores[a] - result.categoryScores[b]);
    return sorted.slice(0, 2);
  }, [result]);

  const completeTest = useCallback(
    (all: AnswerRecord[], opts: { timedOutTest?: boolean } = {}) => {
      const { iq, iqLow, iqHigh } = calcIQWithBand(all);
      const r: IQResult = {
        id: String(Date.now()),
        date: new Date().toISOString(),
        iq,
        iqLow,
        iqHigh,
        percentile: percentileFor(iq),
        correct: all.filter(a => a.correct).length,
        total: items.length,
        questionsAnswered: all.length,
        globalTimeLimitSec: GLOBAL_IQ_TIME_LIMIT_SEC,
        timedOutTest: opts.timedOutTest ?? false,
        categoryScores: categoryScores(all),
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      };
      saveResult(r);
      applyIQTrainingLevel(r.iq);
      setHistory(loadHistory());
      setAnswers(all);
      setResult(r);
      setStage('result');
    },
    [items.length],
  );

  const answer = useCallback(
    (choice: number | null, forceGlobalTimeout = false) => {
      if (!cur) return;
      if (locked.current && !forceGlobalTimeout) return;
      locked.current = true;
      const seconds = Math.min(limit, (Date.now() - qStart.current) / 1000);
      const correct = choice !== null && cur.order[choice] === 0;
      const rec: AnswerRecord = {
        id: cur.q.id,
        category: cur.q.category,
        difficulty: cur.q.difficulty,
        correct,
        timedOut: choice === null,
        seconds,
        limit,
      };
      const all = [...answers, rec];
      if (forceGlobalTimeout || timedOutRef.current) {
        completeTest(all, { timedOutTest: true });
        return;
      }
      if (idx + 1 < items.length) {
        setAnswers(all);
        setIdx(idx + 1);
      } else {
        completeTest(all, { timedOutTest: false });
      }
    },
    [answers, completeTest, cur, idx, items.length, limit],
  );

  const answerRef = useRef(answer);
  answerRef.current = answer;

  useEffect(() => {
    if (stage !== 'test' || !cur) return;
    locked.current = false;
    if (cur.q.memoryRecall) {
      setMemoryPhase('reveal');
      const showMs = cur.q.memoryRecall.showMs;
      const revealTimer = setTimeout(() => {
        setMemoryPhase('recall');
        qStart.current = Date.now();
        setLeft(limit);
      }, showMs);
      return () => clearTimeout(revealTimer);
    }
    setMemoryPhase(null);
    qStart.current = Date.now();
    setLeft(limit);
  }, [stage, idx, cur?.q.id]);

  useEffect(() => {
    if (stage !== 'test' || !cur) return;
    if (cur.q.memoryRecall && memoryPhase === 'reveal') return;
    const t = setInterval(() => {
      const rem = limit - (Date.now() - qStart.current) / 1000;
      if (rem <= 0) { clearInterval(t); setLeft(0); answerRef.current(null); } else setLeft(rem);
    }, 100);
    return () => clearInterval(t);
  }, [stage, idx, limit, memoryPhase, cur?.q.id]);

  useEffect(() => {
    if (stage !== 'test') return;
    const started = startedAt.current;
    const tick = () => {
      const rem = GLOBAL_IQ_TIME_LIMIT_SEC - (Date.now() - started) / 1000;
      if (rem <= 0) {
        setGlobalLeft(0);
        if (!locked.current && !timedOutRef.current) {
          timedOutRef.current = true;
          answerRef.current(null, true);
        }
      } else setGlobalLeft(rem);
    };
    tick();
    const t = setInterval(tick, 200);
    return () => clearInterval(t);
  }, [stage, idx]);

  const beginTest = () => {
    setItems(createQuestions());
    setIdx(0); setAnswers([]); setResult(null); setShareMsg('');
    timedOutRef.current = false;
  setGlobalLeft(GLOBAL_IQ_TIME_LIMIT_SEC);
    startedAt.current = Date.now();
    setStage('test');
  };

  const start = () => {
    if (history.length === 0 && isProfileEmpty(loadBrainmasterProfile())) {
      setStage('profile');
      return;
    }
    beginTest();
  };

  const abort = () => {
    if (confirm('Test wirklich abbrechen? Der Fortschritt geht verloren.')) { setStage('intro'); }
  };

  const strengths = useMemo(() => {
    if (!result) return { best: [] as Category[], worst: [] as Category[] };
    const sorted = [...CATEGORY_ORDER].sort((a, b) => result.categoryScores[b] - result.categoryScores[a]);
    return { best: sorted.slice(0, 2), worst: sorted.slice(-2).reverse() };
  }, [result]);

  const finishPlanSetup = () => {
    const prefs = getReminderPrefs();
    const plan: TrainingPlanInput = {
      dailyMinutes: selectedTime,
      focusAreas: weakAreas,
      extraModules: extraModules.length > 0 ? extraModules : undefined,
      reminderEnabled,
      reminderHour: prefs.hour,
    };
    saveTrainingPlan(plan);
    persistReminderEnabled(reminderEnabled);
    setStage('planDone');
  };

  const toggleExtraModule = (t: ExerciseType) => {
    setExtraModules(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  };

  if (stage === 'profile') {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <button onClick={() => setStage('intro')} className="text-slate-500 hover:text-slate-800 text-sm mb-3">← Zurück</button>
        <MotionProfileIntro onSkip={beginTest} onSaved={() => setProfileVersion(v => v + 1)} />
      </div>
    );
  }

  if (stage === 'intro') {
    const hasHistory = history.length > 0;
    const repeatHint = history.length >= 1;
    return (
      <div className="max-w-xl mx-auto px-4 min-h-[calc(100vh-6rem)] flex flex-col">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm mb-3 shrink-0">← Zurück</button>

        <div className="card text-center flex-1 flex flex-col justify-center">
          <button onClick={start} className="w-full py-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xl mb-4 shadow-lg">
            🧠 Test starten
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-600 mb-3">
            <span>⏱️ {GLOBAL_IQ_TIME_LIMIT_SEC / 60} Min Gesamt</span>
            <span>📋 ca. {IQ_QUESTION_COUNT} Fragen</span>
            <span>🎯 8 Bereiche</span>
          </div>

          <p className="text-xs text-slate-500">
            Ein großer Gesamt-Timer läuft mit — danach endet der Test mit Teilergebnis. Schnelle richtige Antworten bringen mehr Punkte. Schätzwert, kein klinischer Test.
          </p>

          {repeatHint && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
              Hinweis: Wiederholungstests können durch Übung und Bekanntheit mit den Aufgabentypen leicht höher ausfallen.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowProfileForm(v => !v)}
            className="mt-4 text-xs text-blue-700 underline"
          >
            {showProfileForm ? 'Profil ausblenden' : 'Alter & Geschlecht (optional)'}
          </button>
          {showProfileForm && (
            <div className="mt-3 text-left">
              <IQDemographicsCard compact onSaved={() => setProfileVersion(v => v + 1)} />
            </div>
          )}

          {hasHistory && (
            <button
              type="button"
              onClick={() => setShowHistory(v => !v)}
              className="mt-4 text-sm text-blue-700 font-medium underline"
            >
              {showHistory ? 'Verlauf ausblenden' : `Frühere Ergebnisse anzeigen (${history.length})`}
            </button>
          )}
        </div>

        {hasHistory && showHistory && (
          <div className="mt-4 shrink-0">
            <HistoryCard history={history} baselineId={baselineIdFromHistory(history)} />
          </div>
        )}
      </div>
    );
  }

  if (stage === 'test' && cur) {
    const frac = memoryPhase === 'reveal' ? 1 : left / limit;
    const warn = memoryPhase !== 'reveal' && left <= 10;
    const visual = cur.q.visual;
    const isVisualOpts = cur.q.options.some(o => typeof o !== 'string');
    const recall = cur.q.memoryRecall;
    const showAnswers = !recall || memoryPhase === 'recall';
    const globalWarn = globalLeft <= 120;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-blue-800 text-white shadow-lg">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">Gesamtzeit</div>
              <div className={`text-4xl font-mono font-extrabold tabular-nums ${globalWarn ? 'text-amber-300' : ''}`}>
                {fmtGlobalTime(globalLeft)}
              </div>
            </div>
            <div className="text-right text-sm opacity-90">
              <div>Frage {idx + 1} / {items.length}</div>
              <div className="text-xs mt-0.5">{CATEGORY_INFO[cur.q.category].label}</div>
            </div>
          </div>
          <div className="h-2 rounded-full bg-white/20 mt-3 overflow-hidden">
            <div
              className={`h-full transition-all ${globalWarn ? 'bg-amber-400' : 'bg-white'}`}
              style={{ width: `${(globalLeft / GLOBAL_IQ_TIME_LIMIT_SEC) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between mb-2 text-sm text-slate-600">
          <span className="font-semibold">Fortschritt</span>
          <button onClick={abort} className="text-slate-400 hover:text-red-600">Abbrechen</button>
        </div>
        <div className="h-2 rounded-full bg-slate-200 mb-4 overflow-hidden">
          <div className="h-full bg-blue-700 transition-all" style={{ width: `${(idx / items.length) * 100}%` }} />
        </div>
        <div className="card">
          {showAnswers && (
            <div className="flex items-center gap-3 mb-5">
              <div className="text-xs text-slate-500 w-16 shrink-0">Frage</div>
              <div className={`text-2xl font-mono font-bold tabular-nums w-16 ${warn ? 'text-red-600' : 'text-slate-800'}`}>
                {Math.ceil(left)}s
              </div>
              <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                <div className={`h-full ${warn ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${frac * 100}%` }} />
              </div>
            </div>
          )}
          {recall && memoryPhase === 'reveal' && (
            <div className="mb-5 p-5 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
              <p className="text-sm font-medium text-indigo-900 mb-3">Merke dir die Folge — gleich verschwindet sie.</p>
              <div className="text-3xl font-bold tracking-widest text-indigo-950 flex flex-wrap justify-center gap-2">
                {recall.sequence.map((ch, i) => (
                  <span key={i} className="min-w-[2rem]">{ch}</span>
                ))}
              </div>
            </div>
          )}
          {showAnswers && <h2 className="text-xl font-semibold text-slate-800 mb-5">{cur.q.text}</h2>}
          {visual && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {visual.type === 'shapes'
                ? visual.items.map((s, i) => <ShapeRenderer key={i} s={s} />)
                : visual.items.map((t, i) => t && <GlyphSvg key={i} t={t} />)}
            </div>
          )}
          {showAnswers && (
            <div className={`grid gap-3 ${isVisualOpts ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {cur.order.map((oi, pos) => (
                <button
                  key={`${cur.q.id}-${pos}`}
                  onClick={() => answer(pos)}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-600 hover:bg-blue-50 text-left text-slate-800"
                >
                  <span className="w-8 h-8 shrink-0 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center">
                    {String.fromCharCode(65 + pos)}
                  </span>
                  <span className="flex-1 flex justify-center sm:justify-start"><OptionView o={cur.q.options[oi]} /></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'result' && result) {
    const prev = history.length > 1 ? history[history.length - 2] : null;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card text-center bg-gradient-to-br from-blue-900 to-indigo-700 text-white">
          <div className="text-sm uppercase tracking-widest opacity-80">Dein geschätzter IQ</div>
          <div className="text-8xl font-extrabold my-2">{result.iq}</div>
          {(result.iqLow !== undefined && result.iqHigh !== undefined) && (
            <p className="text-base opacity-90">Geschätzter Bereich: {result.iqLow}–{result.iqHigh}</p>
          )}
          <div className="text-lg">{iqLabel(result.iq)}</div>
          <Gauge iq={result.iq} />
          <p className="mt-5 text-lg">Du bist besser als <b>{result.percentile}%</b> der Bevölkerung.</p>
          <p className="text-sm opacity-85 mt-2 px-2">{ageInterpretationHint(profileAge)}</p>
          <p className="text-sm opacity-80 mt-1">
            {result.correct} von {result.questionsAnswered ?? result.total} beantwortet richtig
            {result.timedOutTest && (
              <span className="block text-amber-200 mt-1">Zeit abgelaufen — Teilergebnis ({result.questionsAnswered ?? result.correct} Fragen)</span>
            )}
            · {Math.floor(result.durationSec / 60)} Min. {result.durationSec % 60} Sek.
          </p>
          {history.length >= 2 && (
            <p className="text-xs mt-2 opacity-80 bg-white/10 rounded-lg px-3 py-2">
              Übungseffekt: Wiederholungstests sind nicht 1:1 mit dem ersten Lauf vergleichbar.
            </p>
          )}
          {prev && (
            <p className="text-sm mt-2 opacity-90">
              Vorheriger Test: {prev.iq} ({result.iq - prev.iq >= 0 ? '+' : ''}{result.iq - prev.iq})
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Kognitives Profil</h2>
          <Radar scores={result.categoryScores} />
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Stärken und Schwächen</h2>
          <div className="space-y-3">
            {CATEGORY_ORDER.map(k => {
              const v = result.categoryScores[k];
              const isBest = strengths.best.includes(k), isWorst = strengths.worst.includes(k);
              return (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">
                      {CATEGORY_INFO[k].label}
                      {isBest && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Stärke</span>}
                      {isWorst && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Entwicklungspotenzial</span>}
                    </span>
                    <span className="text-slate-500">{v}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full ${v >= 70 ? 'bg-green-500' : v >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${v}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <h2 className="text-xl font-bold text-slate-800 mb-2">📅 Täglicher Trainingsplan</h2>
          <p className="text-slate-600 mb-4">
            Soll ich dir einen persönlichen Trainingsplan erstellen, der auf deine Schwächen fokussiert?
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setStage('planTime')}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              Ja, Plan erstellen
            </button>
            <button
              onClick={() => setStage('postNoPlan')}
              className="flex-1 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold"
            >
              Nein, danke
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={async () => setShareMsg(await shareResult(result))}
            className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold"
          >
            📤 Ergebnis teilen
          </button>
          <button onClick={() => setStage('intro')} className="flex-1 py-3 rounded-xl bg-white border border-slate-300 font-semibold text-slate-700">Zur Übersicht</button>
        </div>
        {shareMsg && <p className="text-center text-sm text-slate-600">{shareMsg}</p>}
      </div>
    );
  }

  if (stage === 'planTime') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Dein Trainingsplan</h2>
          <p className="text-sm text-slate-600 text-center mb-4">
            <b>{selectedTime} Min/Tag</b> · Schwerpunkt:{' '}
            <b>{weakAreas.map(k => CATEGORY_INFO[k].short).join(', ')}</b>
          </p>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {TRAINING_TIMES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedTime(t.value)}
                className={`py-2 rounded-lg border text-sm font-semibold ${
                  selectedTime === t.value ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <details className="text-sm mb-4">
            <summary className="cursor-pointer text-slate-600 font-medium">Zusatz-Module (optional)</summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {EXERCISES.map(ex => (
                <button
                  key={ex.type}
                  type="button"
                  onClick={() => toggleExtraModule(ex.type)}
                  className={`p-2 rounded-lg border text-xs font-medium ${
                    extraModules.includes(ex.type) ? 'border-green-500 bg-green-50' : 'border-slate-200'
                  }`}
                >
                  {ex.emoji} {ex.title}
                </button>
              ))}
            </div>
          </details>

          <label className="flex items-center justify-between py-2 border-t border-slate-100 text-sm">
            <span className="text-slate-700">Tägliche Erinnerung</span>
            <button
              type="button"
              onClick={() => setReminderEnabled(v => !v)}
              className={`px-3 py-1 rounded-full font-semibold ${reminderEnabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}
            >
              {reminderEnabled ? 'An' : 'Aus'}
            </button>
          </label>

          <button type="button" onClick={finishPlanSetup} className="w-full mt-4 py-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg">
            Los — Plan speichern
          </button>
          <button type="button" onClick={() => setStage('result')} className="w-full mt-2 py-2 text-slate-500">
            Zurück
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'postNoPlan') {
    return (
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div className="card text-center">
          <div className="text-5xl mb-3">💪</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Los geht&apos;s mit dem Training</h2>
          <p className="text-slate-600">
            Wähle eine Übung zum Starten oder wiederhole den IQ-Test, wenn du möchtest.
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Übungen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXERCISES.map(ex => (
              <button
                key={ex.type}
                type="button"
                onClick={() => (onSelectExercise ? onSelectExercise(ex.type) : onBack())}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-left"
              >
                <span className="text-3xl">{ex.emoji}</span>
                <span>
                  <span className="block font-semibold text-slate-800">{ex.title}</span>
                  <span className="block text-sm text-slate-500">{ex.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-700 text-white text-left shadow-lg flex items-center gap-4"
        >
          <span className="text-4xl">🧠</span>
          <span className="flex-1">
            <span className="block text-xl font-bold">IQ-Test (Übersicht)</span>
            <span className="block text-sm text-blue-100">Ergebnis & Statistik</span>
          </span>
          <span className="text-2xl">→</span>
        </button>

        <div className="flex flex-col sm:flex-row gap-3">
          {onOpenStatistics && (
            <button
              type="button"
              onClick={onOpenStatistics}
              className="flex-1 py-3 rounded-xl bg-white border border-slate-300 font-semibold text-slate-700"
            >
              📊 Statistik öffnen
            </button>
          )}
          <button
            type="button"
            onClick={() => setStage('result')}
            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold"
          >
            Zurück zum Ergebnis
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'planDone') {
    return (
      <div className="max-w-md mx-auto px-4">
        <p className="text-center text-slate-600 mb-6">
          <b>{selectedTime} Min</b> · Schwerpunkt <b>{weakAreas.map(k => CATEGORY_INFO[k].short).join(', ')}</b>
        </p>
        <button
          type="button"
          onClick={() => {
            if (onStartTraining) {
              onStartTraining({
                dailyMinutes: selectedTime,
                focusAreas: weakAreas,
                extraModules: extraModules.length > 0 ? extraModules : undefined,
                reminderEnabled,
                reminderHour: getReminderPrefs().hour,
              });
            } else {
              onBack();
            }
          }}
          className="w-full py-5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-2xl shadow-lg"
        >
          Los — Training starten
        </button>
      </div>
    );
  }

  return null;
}

function MotionProfileIntro({ onSkip, onSaved }: { onSkip: () => void; onSaved: () => void }) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Optional: Dein Profil</h2>
      <p className="text-sm text-slate-600 mb-4">
        Alter und Geschlecht helfen bei der groben Einordnung — nur lokal, kein klinischer Normtest.
      </p>
      <IQDemographicsCard compact onSaved={onSaved} />
      <button type="button" onClick={onSkip} className="w-full mt-3 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold">
        Überspringen & Test starten
      </button>
    </div>
  );
}

function HistoryCard({ history, baselineId }: { history: IQResult[]; baselineId: string | null }) {
  const first = history[0], last = history[history.length - 1];
  const diff = last.iq - first.iq;
  const W = 300, H = 90;
  const pts = history.map((r, i) => {
    const x = history.length === 1 ? W / 2 : 10 + (i / (history.length - 1)) * (W - 20);
    const y = H - 10 - ((r.iq - 70) / 75) * (H - 20);
    return [x, y];
  });
  return (
    <div className="card mt-4">
      <h2 className="text-xl font-bold text-slate-800 mb-3">📈 IQ-Trend</h2>
      {history.length > 1 ? (
        <>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Erster Test</div><div className="text-2xl font-bold text-slate-800">{first.iq}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Letzter Test</div><div className="text-2xl font-bold text-slate-800">{last.iq}</div></div>
            <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">Entwicklung</div>
              <div className={`text-2xl font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-slate-800'}`}>{diff > 0 ? '+' : ''}{diff}</div></div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full mb-4">
            <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="#2563eb" strokeWidth="2.5" />
            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#1e3a8a" />)}
          </svg>
          <div className="text-center text-sm text-slate-600">
            Dein IQ-Trend: <b>{history.map(r => r.iq).join(' → ')}</b>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500 mb-3">Mach den Test erneut, um deine Entwicklung zu vergleichen.</p>
      )}
      <ul className="divide-y divide-slate-100 text-sm max-h-40 overflow-auto mt-4">
        {[...history].reverse().map(r => (
          <li key={r.id} className="flex justify-between py-2 gap-2">
            <span className="text-slate-600 truncate">{fmtDate(r.date)}</span>
            <span className="text-slate-800 shrink-0">
              {r.id === baselineId && (
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mr-1">Baseline</span>
              )}
              <b>IQ {r.iq}</b> · {r.correct}/{r.total}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

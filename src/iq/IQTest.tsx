import { useEffect, useMemo, useRef, useState } from 'react';
import {
  QUESTIONS, CATEGORY_INFO, CATEGORY_ORDER, calcIQ, categoryScores, percentileFor, iqLabel,
  loadHistory, saveResult,
} from './questions';
import type { AnswerRecord, Category, IQResult, Option, Question, ShapeSpec, Transform } from './questions';

type Stage = 'intro' | 'test' | 'result';
const INK = '#1e3a8a';

function ShapeSvg({ s, box = 64 }: { s: ShapeSpec | null; box?: number }) {
  if (!s) {
    return (
      <svg width={box} height={box} viewBox="0 0 64 64">
        <rect x="4" y="4" width="56" height="56" rx="10" fill="#eff6ff" stroke="#93c5fd" strokeDasharray="5 4" strokeWidth="2" />
        <text x="32" y="43" textAnchor="middle" fontSize="30" fontWeight="700" fill="#2563eb">?</text>
      </svg>
    );
  }
  const fill = s.fill === false ? 'none' : INK;
  const props = { fill, stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const };
  const sz = s.size ?? 1;
  let body;
  if (s.kind === 'square' && s.n) {
    const n = s.n, cell = 56 / Math.max(n, 3);
    body = Array.from({ length: n }, (_, i) => (
      <rect key={i} x={4 + i * cell + 1} y={32 - cell / 2} width={cell - 2} height={cell - 2} {...props} />
    ));
  } else if (s.kind === 'circle') body = <circle cx="32" cy="32" r="22" {...props} />;
  else if (s.kind === 'square') body = <rect x="10" y="10" width="44" height="44" {...props} />;
  else if (s.kind === 'diamond') body = <polygon points="32,6 58,32 32,58 6,32" {...props} />;
  else if (s.kind === 'triangle') body = <polygon points="32,8 56,54 8,54" {...props} />;
  else {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 11 : 26, a = (Math.PI / 5) * i - Math.PI / 2;
      return `${32 + r * Math.cos(a)},${33 + r * Math.sin(a)}`;
    }).join(' ');
    body = <polygon points={pts} {...props} />;
  }
  return (
    <svg width={box} height={box} viewBox="0 0 64 64">
      <g transform={`rotate(${s.rot ?? 0} 32 32) translate(32 32) scale(${sz}) translate(-32 -32)`}>{body}</g>
    </svg>
  );
}

function GlyphSvg({ t, box = 96 }: { t: Transform; box?: number }) {
  return (
    <svg width={box} height={box} viewBox="0 0 100 100">
      <g transform={`rotate(${t.rot} 50 50) ${t.flip ? 'translate(100 0) scale(-1 1)' : ''}`}>
        <polygon points="25,10 75,10 75,28 45,28 45,42 65,42 65,58 45,58 45,90 25,90" fill={INK} />
        <circle cx="31" cy="16" r="3" fill="#fbbf24" />
      </g>
    </svg>
  );
}

function isShape(o: Option): o is ShapeSpec { return typeof o === 'object' && 'kind' in o; }

function OptionView({ o }: { o: Option }) {
  if (typeof o === 'string') return <span className="text-lg font-medium">{o}</span>;
  if (isShape(o)) return <ShapeSvg s={o} />;
  return <GlyphSvg t={o} box={80} />;
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
  CATEGORY_ORDER.forEach((k, i) => {
    const x = 90 + i * 164, y = 440;
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(x, y, 140, 12);
    g.fillStyle = '#fbbf24'; g.fillRect(x, y, (140 * r.categoryScores[k]) / 100, 12);
    g.fillStyle = '#fff'; g.font = '600 22px sans-serif'; g.textAlign = 'left';
    g.fillText(CATEGORY_INFO[k].short, x, y + 44);
    g.font = '20px sans-serif'; g.fillText(`${r.categoryScores[k]}%`, x, y + 72);
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

export default function IQTest({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<Stage>('intro');
  const [history, setHistory] = useState<IQResult[]>(() => loadHistory());
  const [items, setItems] = useState(() => shuffleQ(QUESTIONS));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<IQResult | null>(null);
  const [shareMsg, setShareMsg] = useState('');
  const startedAt = useRef(0);
  const qStart = useRef(0);
  const locked = useRef(false);

  const cur = items[idx];
  const limit = cur ? CATEGORY_INFO[cur.q.category].time : 0;

  const answer = (choice: number | null) => {
    if (locked.current || !cur) return;
    locked.current = true;
    const seconds = Math.min(limit, (Date.now() - qStart.current) / 1000);
    const correct = choice !== null && cur.order[choice] === 0;
    const rec: AnswerRecord = {
      id: cur.q.id, category: cur.q.category, difficulty: cur.q.difficulty,
      correct, timedOut: choice === null, seconds, limit,
    };
    const all = [...answers, rec];
    if (idx + 1 < items.length) {
      setAnswers(all);
      setIdx(idx + 1);
    } else {
      const iq = calcIQ(all);
      const r: IQResult = {
        id: String(Date.now()), date: new Date().toISOString(), iq, percentile: percentileFor(iq),
        correct: all.filter(a => a.correct).length, total: all.length,
        categoryScores: categoryScores(all), durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      };
      saveResult(r);
      setHistory(loadHistory());
      setAnswers(all);
      setResult(r);
      setStage('result');
    }
  };

  const answerRef = useRef(answer);
  answerRef.current = answer;

  useEffect(() => {
    if (stage !== 'test') return;
    locked.current = false;
    qStart.current = Date.now();
    setLeft(limit);
    const t = setInterval(() => {
      const rem = limit - (Date.now() - qStart.current) / 1000;
      if (rem <= 0) { clearInterval(t); setLeft(0); answerRef.current(null); } else setLeft(rem);
    }, 100);
    return () => clearInterval(t);
  }, [stage, idx, limit]);

  const start = () => {
    setItems(shuffleQ(QUESTIONS));
    setIdx(0); setAnswers([]); setResult(null); setShareMsg('');
    startedAt.current = Date.now();
    setStage('test');
  };

  const abort = () => {
    if (confirm('Test wirklich abbrechen? Der Fortschritt geht verloren.')) { setStage('intro'); }
  };

  const strengths = useMemo(() => {
    if (!result) return { best: [] as Category[], worst: [] as Category[] };
    const sorted = [...CATEGORY_ORDER].sort((a, b) => result.categoryScores[b] - result.categoryScores[a]);
    return { best: sorted.slice(0, 2), worst: sorted.slice(-2).reverse() };
  }, [result]);

  if (stage === 'intro') {
    const first = history[0], last = history[history.length - 1];
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-sm">← Zurück zum Dashboard</button>
        <div className="card">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">IQ-Test</h1>
          <p className="text-slate-600 mb-5">
            Ein umfassender kognitiver Test, der aus deinen Antworten einen geschätzten IQ-Wert berechnet.
          </p>
          <ul className="space-y-2 text-slate-700 mb-5">
            <li>⏱️ <b>Dauer:</b> ca. 15–20 Minuten</li>
            <li>📋 <b>{QUESTIONS.length} Fragen</b> in 6 Bereichen, je 5 Fragen, jeweils vier Antwortmöglichkeiten</li>
            <li>⏳ <b>Zeitlimit pro Frage:</b> 30–60 Sekunden, je nach Aufgabentyp</li>
            <li>🚫 <b>Kein Zurück:</b> Eine beantwortete Frage ist endgültig. Läuft die Zeit ab, zählt sie als falsch.</li>
            <li>⚡ Schnelle richtige Antworten und schwierige Fragen bringen mehr Punkte.</li>
          </ul>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {CATEGORY_ORDER.map(k => (
              <div key={k} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                <div className="font-semibold text-slate-800">{CATEGORY_INFO[k].label}</div>
                <div className="text-slate-500">{CATEGORY_INFO[k].time} Sek. pro Frage</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Hinweis: Das Ergebnis ist eine Schätzung zur Unterhaltung und Selbstreflexion, kein klinisch validierter IQ-Test.
            Such dir einen ruhigen Ort und nutze keine Hilfsmittel.
          </p>
          <button onClick={start} className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-lg">
            Test starten
          </button>
        </div>
        {history.length > 0 && last && first && <HistoryCard history={history} />}
      </div>
    );
  }

  if (stage === 'test' && cur) {
    const frac = left / limit;
    const warn = left <= 10;
    const visual = cur.q.visual;
    const isVisualOpts = cur.q.options.some(o => typeof o !== 'string');
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2 text-sm text-slate-600">
          <span className="font-semibold">Frage {idx + 1} von {items.length}</span>
          <span>{CATEGORY_INFO[cur.q.category].label}</span>
          <button onClick={abort} className="text-slate-400 hover:text-red-600">Abbrechen</button>
        </div>
        <div className="h-2 rounded-full bg-slate-200 mb-4 overflow-hidden">
          <div className="h-full bg-blue-700 transition-all" style={{ width: `${(idx / items.length) * 100}%` }} />
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className={`text-2xl font-mono font-bold tabular-nums w-16 ${warn ? 'text-red-600' : 'text-slate-800'}`}>
              {Math.ceil(left)}s
            </div>
            <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full ${warn ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${frac * 100}%` }} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-5">{cur.q.text}</h2>
          {visual && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {visual.type === 'shapes'
                ? visual.items.map((s, i) => <ShapeSvg key={i} s={s} />)
                : visual.items.map((t, i) => t && <GlyphSvg key={i} t={t} />)}
            </div>
          )}
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
          <div className="text-lg">{iqLabel(result.iq)}</div>
          <Gauge iq={result.iq} />
          <p className="mt-5 text-lg">Du bist besser als <b>{result.percentile}%</b> der Bevölkerung.</p>
          <p className="text-sm opacity-80 mt-1">{result.correct} von {result.total} richtig · {Math.floor(result.durationSec / 60)} Min. {result.durationSec % 60} Sek.</p>
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
          <p className="text-sm text-slate-600 mt-4">
            Deine stärksten Bereiche: <b>{strengths.best.map(k => CATEGORY_INFO[k].label).join(', ')}</b>.
            Mehr Training lohnt sich bei: <b>{strengths.worst.map(k => CATEGORY_INFO[k].label).join(', ')}</b>.
          </p>
        </div>

        <HistoryCard history={history} />

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={async () => setShareMsg(await shareResult(result))}
            className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold"
          >
            📤 Ergebnis teilen
          </button>
          <button onClick={() => setStage('intro')} className="flex-1 py-3 rounded-xl bg-white border border-slate-300 font-semibold text-slate-700">Zur Übersicht</button>
          <button onClick={onBack} className="flex-1 py-3 rounded-xl bg-white border border-slate-300 font-semibold text-slate-700">Dashboard</button>
        </div>
        {shareMsg && <p className="text-center text-sm text-slate-600">{shareMsg}</p>}
      </div>
    );
  }
  return null;
}

function HistoryCard({ history }: { history: IQResult[] }) {
  const first = history[0], last = history[history.length - 1];
  const diff = last.iq - first.iq;
  const W = 300, H = 90;
  const pts = history.map((r, i) => {
    const x = history.length === 1 ? W / 2 : 10 + (i / (history.length - 1)) * (W - 20);
    const y = H - 10 - ((r.iq - 70) / 75) * (H - 20);
    return [x, y];
  });
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-slate-800 mb-3">Verlauf</h2>
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
        </>
      ) : (
        <p className="text-sm text-slate-500 mb-3">Mach den Test erneut, um deine Entwicklung zu vergleichen.</p>
      )}
      <ul className="divide-y divide-slate-100 text-sm max-h-56 overflow-auto">
        {[...history].reverse().map(r => (
          <li key={r.id} className="flex justify-between py-2">
            <span className="text-slate-600">{fmtDate(r.date)}</span>
            <span className="text-slate-800"><b>IQ {r.iq}</b> · {r.correct}/{r.total} richtig</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

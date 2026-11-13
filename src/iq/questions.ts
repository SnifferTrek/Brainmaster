export type Category = 'sequence' | 'pattern' | 'logic' | 'analogy' | 'spatial' | 'math';

export const CATEGORY_INFO: Record<Category, { label: string; short: string; time: number; hint: string }> = {
  sequence: { label: 'Zahlenreihen', short: 'Zahlen', time: 45, hint: 'Numerisches Denken' },
  pattern: { label: 'Muster-Erkennung', short: 'Muster', time: 45, hint: 'Visuelle Mustererkennung' },
  logic: { label: 'Logische Schlüsse', short: 'Logik', time: 40, hint: 'Deduktives Denken' },
  analogy: { label: 'Wortanalogien', short: 'Sprache', time: 30, hint: 'Sprachliches Denken' },
  spatial: { label: 'Räumliches Denken', short: 'Raum', time: 60, hint: 'Räumliche Vorstellung' },
  math: { label: 'Schnelles Rechnen', short: 'Rechnen', time: 30, hint: 'Rechengeschwindigkeit' },
};

export const CATEGORY_ORDER: Category[] = ['sequence', 'pattern', 'logic', 'analogy', 'spatial', 'math'];

export interface ShapeSpec {
  kind: 'circle' | 'square' | 'triangle' | 'star' | 'diamond';
  fill?: boolean;
  rot?: number;
  size?: number;
  n?: number;
}
export interface Transform {
  flip: boolean;
  rot: number;
}
export type Visual =
  | { type: 'shapes'; items: (ShapeSpec | null)[] }
  | { type: 'glyph'; items: (Transform | null)[] };
export type Option = string | ShapeSpec | Transform;

export interface Question {
  id: string;
  category: Category;
  difficulty: 1 | 2 | 3;
  text: string;
  visual?: Visual;
  /** Die richtige Antwort steht immer an Index 0 und wird zur Laufzeit gemischt. */
  options: Option[];
}

const q = (
  id: string,
  category: Category,
  difficulty: 1 | 2 | 3,
  text: string,
  options: Option[],
  visual?: Visual,
): Question => ({ id, category, difficulty, text, options, visual });

const F = (flip: boolean, rot: number): Transform => ({ flip, rot });
const glyphOptions = (correct: Transform): Transform[] => {
  const all: Transform[] = [];
  for (const flip of [false, true]) for (const rot of [0, 90, 180, 270]) all.push(F(flip, rot));
  const others = all.filter(t => !(t.flip === correct.flip && t.rot === correct.rot));
  return [correct, others[0], others[3], others[5]].map(t => t);
};

export const QUESTIONS: Question[] = [
  q('s1', 'sequence', 1, 'Was kommt als Nächstes?  2, 4, 8, 16, ?', ['32', '24', '30', '34']),
  q('s2', 'sequence', 1, 'Was kommt als Nächstes?  3, 7, 11, 15, ?', ['19', '18', '20', '21']),
  q('s3', 'sequence', 2, 'Was kommt als Nächstes?  1, 4, 9, 16, 25, ?', ['36', '30', '35', '49']),
  q('s4', 'sequence', 2, 'Was kommt als Nächstes?  1, 1, 2, 3, 5, 8, ?', ['13', '11', '12', '16']),
  q('s5', 'sequence', 3, 'Was kommt als Nächstes?  2, 6, 7, 21, 22, 66, ?', ['67', '68', '132', '70']),

  q('p1', 'pattern', 1, 'Welche Form ergänzt die Reihe?', [
    { kind: 'triangle', rot: 270 }, { kind: 'triangle', rot: 0 }, { kind: 'triangle', rot: 90 }, { kind: 'triangle', rot: 180 },
  ], { type: 'shapes', items: [{ kind: 'triangle', rot: 0 }, { kind: 'triangle', rot: 90 }, { kind: 'triangle', rot: 180 }, null] }),
  q('p2', 'pattern', 1, 'Welche Form ergänzt die Reihe?', [
    { kind: 'circle', fill: true }, { kind: 'circle', fill: false }, { kind: 'square', fill: true }, { kind: 'square', fill: false },
  ], { type: 'shapes', items: [{ kind: 'circle', fill: true }, { kind: 'circle', fill: false }, { kind: 'circle', fill: true }, { kind: 'circle', fill: false }, null] }),
  q('p3', 'pattern', 2, 'Welche Form ergänzt die Reihe?', [
    { kind: 'square', n: 4 }, { kind: 'square', n: 5 }, { kind: 'square', n: 3 }, { kind: 'square', n: 2 },
  ], { type: 'shapes', items: [{ kind: 'square', n: 1 }, { kind: 'square', n: 2 }, { kind: 'square', n: 3 }, null] }),
  q('p4', 'pattern', 2, 'Welche Form setzt das Muster fort?', [
    { kind: 'triangle', fill: true }, { kind: 'circle', fill: true }, { kind: 'square', fill: true }, { kind: 'star', fill: true },
  ], { type: 'shapes', items: [{ kind: 'circle', fill: true }, { kind: 'square', fill: true }, { kind: 'triangle', fill: true }, { kind: 'circle', fill: true }, { kind: 'square', fill: true }, null] }),
  q('p5', 'pattern', 3, 'Die Formen wachsen und wechseln die Füllung. Was folgt?', [
    { kind: 'star', size: 1, fill: false }, { kind: 'star', size: 1, fill: true }, { kind: 'star', size: 0.7, fill: false }, { kind: 'diamond', size: 1, fill: false },
  ], { type: 'shapes', items: [{ kind: 'star', size: 0.4, fill: true }, { kind: 'star', size: 0.6, fill: false }, { kind: 'star', size: 0.8, fill: true }, null] }),

  q('l1', 'logic', 1, 'Alle A sind B. Alle B sind C. Sind alle A auch C?', ['Ja, zwingend', 'Nein', 'Nur manche', 'Nicht entscheidbar']),
  q('l2', 'logic', 1, 'Anna ist größer als Ben. Ben ist größer als Clara. Wer ist am kleinsten?', ['Clara', 'Ben', 'Anna', 'Nicht bestimmbar']),
  q('l3', 'logic', 2, 'Alle Katzen sind Tiere. Einige Tiere sind Hunde. Folgt daraus: „Einige Katzen sind Hunde“?', ['Nein, das folgt nicht', 'Ja, zwingend', 'Ja, aber nur bei Haustieren', 'Nur wenn alle Hunde Katzen sind']),
  q('l4', 'logic', 2, 'Wenn es regnet, ist die Straße nass. Die Straße ist nass. Hat es zwingend geregnet?', ['Nein, es kann andere Ursachen geben', 'Ja, zwingend', 'Ja, aber nur nachts', 'Nein, es hat sicher nicht geregnet']),
  q('l5', 'logic', 3, 'Kein Fisch ist ein Säugetier. Alle Wale sind Säugetiere. Welche Aussage stimmt zwingend?', ['Kein Wal ist ein Fisch', 'Einige Wale sind Fische', 'Alle Fische sind Wale', 'Manche Säugetiere sind Fische']),

  q('a1', 'analogy', 1, 'Hund : Bellen = Katze : ?', ['Miauen', 'Fressen', 'Schnurren', 'Fell']),
  q('a2', 'analogy', 1, 'Hand : Finger = Fuß : ?', ['Zeh', 'Schuh', 'Bein', 'Ferse']),
  q('a3', 'analogy', 2, 'Arzt : Patient = Lehrer : ?', ['Schüler', 'Schule', 'Tafel', 'Unterricht']),
  q('a4', 'analogy', 2, 'Maler : Gemälde = Komponist : ?', ['Sinfonie', 'Pinsel', 'Orchester', 'Konzertsaal']),
  q('a5', 'analogy', 3, 'Ei : Küken = Raupe : ?', ['Schmetterling', 'Blatt', 'Schnecke', 'Biene']),

  q('m1', 'spatial', 1, 'Die Form wird um 90° im Uhrzeigersinn gedreht. Welche Form entsteht?', glyphOptions(F(false, 90)), { type: 'glyph', items: [F(false, 0)] }),
  q('m2', 'spatial', 1, 'Die Form wird um 180° gedreht (auf den Kopf gestellt). Welche Form entsteht?', glyphOptions(F(false, 180)), { type: 'glyph', items: [F(false, 0)] }),
  q('m3', 'spatial', 2, 'Die Form wird an der senkrechten Achse gespiegelt (links ↔ rechts). Welche Form entsteht?', glyphOptions(F(true, 0)), { type: 'glyph', items: [F(false, 0)] }),
  q('m4', 'spatial', 2, 'Die Form wird an der waagerechten Achse gespiegelt (oben ↔ unten). Welche Form entsteht?', glyphOptions(F(true, 180)), { type: 'glyph', items: [F(false, 0)] }),
  q('m5', 'spatial', 3, 'Die Form wird erst um 90° im Uhrzeigersinn gedreht und danach links ↔ rechts gespiegelt. Welche Form entsteht?', glyphOptions(F(true, 270)), { type: 'glyph', items: [F(false, 0)] }),

  q('r1', 'math', 1, '17 × 6 = ?', ['102', '96', '108', '112']),
  q('r2', 'math', 1, '345 + 278 = ?', ['623', '613', '633', '523']),
  q('r3', 'math', 2, '15 % von 240 = ?', ['36', '32', '40', '24']),
  q('r4', 'math', 2, '84 ÷ 7 + 9 × 3 = ?', ['39', '63', '36', '45']),
  q('r5', 'math', 3, '13 × 14 − 47 = ?', ['135', '125', '145', '139']),
];

export const WEIGHT = { 1: 0.8, 2: 1, 3: 1.3 } as const;

export { generateQuestions } from './questionGenerators';

export interface AnswerRecord {
  id: string;
  category: Category;
  difficulty: 1 | 2 | 3;
  correct: boolean;
  timedOut: boolean;
  seconds: number;
  limit: number;
}

export interface IQResult {
  id: string;
  date: string;
  iq: number;
  percentile: number;
  correct: number;
  total: number;
  categoryScores: Record<Category, number>;
  durationSec: number;
}

/** Geschätzter IQ: Basis 70, starke Gewichtung der Trefferquote, wenige Richtige → deutlich tiefer. */
export function calcIQ(answers: AnswerRecord[]): number {
  const total = answers.length || 1;
  const correct = answers.filter(a => a.correct).length;
  const accuracy = correct / total;

  let iq = 58 + accuracy * 72;

  for (const a of answers) {
    const w = WEIGHT[a.difficulty];
    if (a.correct) {
      const rest = Math.max(0, 1 - a.seconds / a.limit);
      const speedFactor = rest >= 0.75 ? 1 : rest / 0.75;
      iq += 0.35 * w * speedFactor;
    } else {
      iq -= 2.1 * w;
    }
  }

  return Math.round(Math.min(145, Math.max(55, iq)));
}

function erf(x: number) {
  const s = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

export function percentileFor(iq: number): number {
  const p = 0.5 * (1 + erf((iq - 100) / 15 / Math.SQRT2)) * 100;
  return Math.min(99.9, Math.max(0.1, Math.round(p * 10) / 10));
}

export function categoryScores(answers: AnswerRecord[]): Record<Category, number> {
  const out = {} as Record<Category, number>;
  for (const c of CATEGORY_ORDER) {
    const list = answers.filter(a => a.category === c);
    const max = list.reduce((s, a) => s + WEIGHT[a.difficulty], 0);
    const got = list.filter(a => a.correct).reduce((s, a) => s + WEIGHT[a.difficulty], 0);
    out[c] = max ? Math.round((got / max) * 100) : 0;
  }
  return out;
}

export function iqLabel(iq: number): string {
  if (iq >= 130) return 'Weit überdurchschnittlich';
  if (iq >= 115) return 'Überdurchschnittlich';
  if (iq >= 85) return 'Durchschnittlich';
  return 'Unterdurchschnittlich';
}

const KEY = 'brainmaster_iq_history';
export function loadHistory(): IQResult[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export function saveResult(r: IQResult) {
  const h = loadHistory();
  h.push(r);
  localStorage.setItem(KEY, JSON.stringify(h));
}

import type { Question, Category, ShapeSpec, Transform } from './questions';
import { difficultyForSlot } from './questions';
import { generateUnique, iqQuestionSignature } from '../utils/questionSignature';
import { shapeOptionsDistinct } from './shapeVisual';

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)];
const shuffle = <T>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Antworten: korrekt immer Index 0 — UI mischt via shuffleQ in IQTest. */
function mcOptions<T>(correct: T, wrongs: T[]): T[] {
  return [correct, ...wrongs.slice(0, 3)];
}

const genWrongNumbers = (correct: number, count: number, range: number = 10): string[] => {
  const wrongs = new Set<number>();
  const min = Math.max(1, correct - range);
  const max = correct + range;
  while (wrongs.size < count) {
    const n = rand(min, max);
    if (n !== correct) wrongs.add(n);
  }
  return Array.from(wrongs).map(String);
};

function generateSequenceQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `seq_${Date.now()}_${rand(0, 9999)}`;
  
  if (difficulty === 1) {
    const patterns = [
      () => {
        const start = rand(2, 5);
        const mult = pick([2, 3]);
        const seq = [start];
        for (let i = 0; i < 3; i++) seq.push(seq[seq.length - 1] * mult);
        const answer = seq[seq.length - 1] * mult;
        return { seq, answer, desc: `×${mult}` };
      },
      () => {
        const start = rand(1, 10);
        const step = rand(2, 5);
        const seq = [start];
        for (let i = 0; i < 3; i++) seq.push(seq[seq.length - 1] + step);
        const answer = seq[seq.length - 1] + step;
        return { seq, answer, desc: `+${step}` };
      },
    ];
    const { seq, answer } = pick(patterns)();
    return {
      id, category: 'sequence', difficulty,
      text: `Was kommt als Nächstes?  ${seq.join(', ')}, ?`,
      options: mcOptions(String(answer), genWrongNumbers(answer, 3)),
    };
  }
  
  if (difficulty === 2) {
    const patterns = [
      () => {
        const start = rand(1, 4);
        const seq = [];
        for (let i = start; seq.length < 5; i++) seq.push(i * i);
        const answer = (start + 5) * (start + 5);
        return { seq, answer };
      },
      () => {
        const a = rand(1, 3), b = rand(1, 3);
        const seq = [a, b];
        for (let i = 0; i < 4; i++) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
        const answer = seq[seq.length - 1] + seq[seq.length - 2];
        seq.pop();
        return { seq, answer };
      },
    ];
    const { seq, answer } = pick(patterns)();
    return {
      id, category: 'sequence', difficulty,
      text: `Was kommt als Nächstes?  ${seq.join(', ')}, ?`,
      options: mcOptions(String(answer), genWrongNumbers(answer, 3)),
    };
  }
  
  const start = rand(2, 4);
  const mult = rand(2, 4);
  const add = 1;
  const seq = [start];
  for (let i = 0; i < 5; i++) {
    if (i % 2 === 0) seq.push(seq[seq.length - 1] * mult);
    else seq.push(seq[seq.length - 1] + add);
  }
  const nextIterIndex = seq.length - 1;
  const answer = nextIterIndex % 2 === 0 
    ? seq[seq.length - 1] * mult 
    : seq[seq.length - 1] + add;
  
  return {
    id, category: 'sequence', difficulty,
    text: `Was kommt als Nächstes?  ${seq.join(', ')}, ?`,
    options: mcOptions(String(answer), genWrongNumbers(answer, 3, 20)),
  };
}

const SHAPES: ShapeSpec['kind'][] = ['circle', 'square', 'triangle', 'star', 'diamond'];
/** Formen, bei denen 90°-Drehung im UI sichtbar bleibt (kein Kreis/Quadrat/Raute). */
const ROTATION_ASYMMETRIC_SHAPES: ShapeSpec['kind'][] = ['triangle'];
const ROTATIONS = [0, 90, 180, 270];

function generateRotationPatternQuestion(
  id: string,
  difficulty: 1 | 2 | 3,
  shape: ShapeSpec['kind'] = 'triangle',
): Question {
  const step = 90;
  const startRot = pick(ROTATIONS);
  const items: (ShapeSpec | null)[] = [];
  for (let i = 0; i < 3; i++) {
    items.push({ kind: shape, rot: (startRot + i * step) % 360 });
  }
  items.push(null);
  const correctRot = (startRot + 3 * step) % 360;
  const correct: ShapeSpec = { kind: shape, rot: correctRot };
  const wrongRots = ROTATIONS.filter(r => r !== correctRot);
  const wrongs: ShapeSpec[] = wrongRots.map(r => ({ kind: shape, rot: r }));
  const options = mcOptions(correct, wrongs);

  if (!shapeOptionsDistinct(options)) {
    throw new Error('pattern rotation options not visually distinct');
  }

  return {
    id, category: 'pattern', difficulty,
    text: 'Welche Form ergänzt die Reihe? (Die Form dreht sich jeweils um 90°.)',
    options,
    visual: { type: 'shapes', items },
  };
}

export function isPatternQuestionSolvable(q: Question): boolean {
  if (q.category !== 'pattern') return true;
  const shapeOpts = q.options.filter((o): o is ShapeSpec => typeof o === 'object' && 'kind' in o);
  if (shapeOpts.length !== 4) return true;
  if (!shapeOptionsDistinct(shapeOpts)) return false;
  if (q.text.includes('Raster')) {
    return shapeOpts.every(s => s.grid != null);
  }
  if (q.text.includes('verschachtelt')) {
    return shapeOpts.every(s => s.nested != null);
  }
  if (q.text.includes('Rahmen')) {
    return shapeOpts.every(s => s.bgFill !== undefined || s.fgFill !== undefined);
  }
  if (q.text.includes('90°') || q.text.includes('dreht sich jeweils')) {
    return shapeOpts.every(s => ROTATION_ASYMMETRIC_SHAPES.includes(s.kind));
  }
  return true;
}

function generateNestedPatternQuestion(id: string, difficulty: 1 | 2 | 3): Question {
  const combos = [
    { outer: 'square' as const, inner: 'circle' as const, outerFill: true, innerFill: false },
    { outer: 'square' as const, inner: 'circle' as const, outerFill: false, innerFill: true },
    { outer: 'circle' as const, inner: 'triangle' as const, outerFill: true, innerFill: true },
    { outer: 'circle' as const, inner: 'triangle' as const, outerFill: false, innerFill: false },
  ];
  const steps = difficulty === 1 ? 3 : 4;
  const start = rand(0, combos.length - 1);
  const items: (ShapeSpec | null)[] = [];
  for (let i = 0; i < steps; i++) {
    const c = combos[(start + i) % combos.length];
    items.push({
      kind: 'square',
      nested: { outer: c.outer, inner: c.inner, outerFill: c.outerFill, innerFill: c.innerFill },
    });
  }
  items.push(null);
  const next = combos[(start + steps) % combos.length];
  const correct: ShapeSpec = {
    kind: 'square',
    nested: { outer: next.outer, inner: next.inner, outerFill: next.outerFill, innerFill: next.innerFill },
  };
  const wrongs: ShapeSpec[] = combos
    .filter(c => !(c.outer === next.outer && c.inner === next.inner && c.outerFill === next.outerFill && c.innerFill === next.innerFill))
    .slice(0, 4)
    .map(c => ({
      kind: 'square' as const,
      nested: { outer: c.outer, inner: c.inner, outerFill: c.outerFill, innerFill: c.innerFill },
    }));
  const options = mcOptions(correct, wrongs);
  if (!shapeOptionsDistinct(options)) throw new Error('nested pattern options not distinct');
  return {
    id,
    category: 'pattern',
    difficulty,
    text: 'Welche verschachtelte Form setzt die Reihe fort?',
    options,
    visual: { type: 'shapes', items },
  };
}

function generateGridPatternQuestion(id: string, difficulty: 1 | 2 | 3): Question {
  const size: 2 | 3 = difficulty === 1 ? 2 : pick([2, 3]) as 2 | 3;
  const cells = size * size;
  const pos = rand(0, cells - 1);
  const rots = [0, 90, 180, 270];
  const startRot = pick(rots);
  const stepRot = 90;
  const steps = difficulty === 1 ? 3 : 4;
  const invert = difficulty >= 3 && rand(0, 1) === 1;
  const items: (ShapeSpec | null)[] = [];
  for (let i = 0; i < steps; i++) {
    items.push({
      kind: 'square',
      grid: { size, filled: [pos], rot: (startRot + i * stepRot) % 360, invert },
    });
  }
  items.push(null);
  const targetRot = (startRot + steps * stepRot) % 360;
  const correct: ShapeSpec = {
    kind: 'square',
    grid: { size, filled: [pos], rot: targetRot, invert },
  };
  const candidates: ShapeSpec[] = [
    { kind: 'square', grid: { size, filled: [(pos + 1) % cells], rot: targetRot, invert } },
    { kind: 'square', grid: { size, filled: [pos], rot: (targetRot + 90) % 360, invert } },
    { kind: 'square', grid: { size, filled: [pos], rot: (targetRot + 180) % 360, invert } },
    { kind: 'square', grid: { size, filled: [(pos + 2) % cells], rot: targetRot, invert } },
    { kind: 'square', grid: { size, filled: [pos], rot: targetRot, invert: !invert } },
    { kind: 'square', grid: { size: size === 2 ? 3 : 2, filled: [0], rot: targetRot, invert } },
  ];
  const wrongs: ShapeSpec[] = [];
  for (const c of candidates) {
    const trial = [correct, ...wrongs, c];
    if (shapeOptionsDistinct(trial) && wrongs.length < 3) wrongs.push(c);
    if (wrongs.length >= 3) break;
  }
  if (wrongs.length < 3) throw new Error('grid pattern options not distinct');
  const options = mcOptions(correct, wrongs);
  return {
    id,
    category: 'pattern',
    difficulty,
    text: invert
      ? 'Das Raster dreht sich — welches Feld bleibt leer (Invert-Muster)?'
      : 'Das Raster dreht sich — welche Zelle ist gefüllt?',
    options,
    visual: { type: 'shapes', items },
  };
}

function generateFrameFillPatternQuestion(id: string, difficulty: 1 | 2 | 3): Question {
  const kind = pick(['triangle', 'circle', 'star'] as ShapeSpec['kind'][]);
  const pairs: { bg: boolean; fg: boolean }[] = [
    { bg: true, fg: false },
    { bg: false, fg: true },
    { bg: true, fg: true },
    { bg: false, fg: false },
  ];
  const steps = 3;
  const start = rand(0, pairs.length - 1);
  const items: (ShapeSpec | null)[] = [];
  for (let i = 0; i < steps; i++) {
    const p = pairs[(start + i) % pairs.length];
    items.push({ kind, bgFill: p.bg, fgFill: p.fg });
  }
  items.push(null);
  const next = pairs[(start + steps) % pairs.length];
  const correct: ShapeSpec = { kind, bgFill: next.bg, fgFill: next.fg };
  const wrongs: ShapeSpec[] = pairs
    .filter(p => !(p.bg === next.bg && p.fg === next.fg))
    .map(p => ({ kind, bgFill: p.bg, fgFill: p.fg }));
  const options = mcOptions(correct, wrongs);
  if (!shapeOptionsDistinct(options)) throw new Error('frame fill pattern not distinct');
  return {
    id,
    category: 'pattern',
    difficulty,
    text: 'Rahmen und Form wechseln Füllung. Was folgt?',
    options,
    visual: { type: 'shapes', items },
  };
}

function generatePatternQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `pat_${Date.now()}_${rand(0, 9999)}`;
  const variant = rand(0, 5);
  
  if (difficulty === 1) {
    if (variant === 0) return generateNestedPatternQuestion(id, difficulty);
    if (variant === 1) return generateGridPatternQuestion(id, difficulty);
    const shape = pick(ROTATION_ASYMMETRIC_SHAPES);
    return generateRotationPatternQuestion(id, difficulty, shape);
  }
  
  if (difficulty === 2) {
    if (variant <= 1) return generateNestedPatternQuestion(id, difficulty);
    if (variant === 2) return generateGridPatternQuestion(id, difficulty);
    if (variant === 3) return generateFrameFillPatternQuestion(id, difficulty);
    const n = rand(1, 3);
    const items: (ShapeSpec | null)[] = [];
    for (let i = 1; i <= 3; i++) {
      items.push({ kind: 'square', n: n + i - 1 });
    }
    items.push(null);
    const correct: ShapeSpec = { kind: 'square', n: n + 3 };
    const wrongs: ShapeSpec[] = [n + 4, n + 2, n + 1].map(x => ({ kind: 'square', n: x }));
    
    return {
      id, category: 'pattern', difficulty,
      text: 'Welche Form ergänzt die Reihe?',
      options: mcOptions(correct, wrongs),
      visual: { type: 'shapes', items },
    };
  }
  
  const rotNeutralShapes = SHAPES.filter(s => s !== 'circle') as ShapeSpec['kind'][];
  const shape: ShapeSpec['kind'] = pick(
    rotNeutralShapes.length ? rotNeutralShapes : (['triangle'] as ShapeSpec['kind'][]),
  );
  const sizes = [0.4, 0.6, 0.8];
  const fills = [true, false, true];
  const items: (ShapeSpec | null)[] = sizes.map((size, i) => ({ 
    kind: shape, size, fill: fills[i] 
  }));
  items.push(null);
  const correct: ShapeSpec = { kind: shape, size: 1, fill: false };
  const wrongs: ShapeSpec[] = [
    { kind: shape, size: 1, fill: true },
    { kind: shape, size: 0.7, fill: false },
    { kind: pick(SHAPES.filter(s => s !== shape)), size: 1, fill: false },
  ];
  const options = mcOptions(correct, wrongs);
  if (shapeOptionsDistinct(options)) {
    return {
      id, category: 'pattern', difficulty,
      text: 'Die Formen wachsen und wechseln die Füllung. Was folgt?',
      options,
      visual: { type: 'shapes', items },
    };
  }
  return generateRotationPatternQuestion(id, difficulty, 'triangle');
}

interface LogicTemplate {
  text: string;
  correct: string;
  wrongs: string[];
}

type LogicTemplateOrGen = LogicTemplate | (() => LogicTemplate);

const LOGIC_TEMPLATES_D1: LogicTemplateOrGen[] = [
  {
    text: 'Alle A sind B. Alle B sind C. Sind alle A auch C?',
    correct: 'Ja, zwingend',
    wrongs: ['Nein', 'Nur manche', 'Nicht entscheidbar'],
  },
  () => {
    const names = shuffle(['Anna', 'Ben', 'Clara', 'David', 'Eva', 'Felix']);
    const [a, b, c] = names.slice(0, 3);
    return {
      text: `${a} ist größer als ${b}. ${b} ist größer als ${c}. Wer ist am kleinsten?`,
      correct: c,
      wrongs: [b, a, 'Nicht bestimmbar'],
    };
  },
];

const LOGIC_TEMPLATES_D2: LogicTemplate[] = [
  {
    text: 'Alle Katzen sind Tiere. Einige Tiere sind Hunde. Folgt daraus: „Einige Katzen sind Hunde"?',
    correct: 'Nein, das folgt nicht',
    wrongs: ['Ja, zwingend', 'Ja, aber nur bei Haustieren', 'Nur wenn alle Hunde Katzen sind'],
  },
  {
    text: 'Wenn es regnet, ist die Straße nass. Die Straße ist nass. Hat es zwingend geregnet?',
    correct: 'Nein, es kann andere Ursachen geben',
    wrongs: ['Ja, zwingend', 'Ja, aber nur nachts', 'Nein, es hat sicher nicht geregnet'],
  },
];

const VERBAL_LOGIC_TEMPLATES: LogicTemplate[] = [
  {
    text: '«Alle Teilnehmer müssen pünktlich sein» und «Anna ist Teilnehmerin, aber zu spät» — was folgt?',
    correct: 'Die Regel wurde verletzt',
    wrongs: ['Anna ist keine Teilnehmerin', 'Pünktlichkeit ist egal', 'Die Aussage widerspricht sich selbst'],
  },
  {
    text: '«Nur wer eine Einladung hat, darf eintreten.» Tom steht drinnen und sagt: «Ich habe eine Einladung.» — Was ist zwingend?',
    correct: 'Nichts — er könnte trotzdem Regeln brechen',
    wrongs: ['Er hat garantiert eine Einladung', 'Er darf nie eintreten', 'Die Einladung ist ungültig'],
  },
];

function generateVerbalLogicQuestion(): Question {
  const id = `ver_${Date.now()}_${rand(0, 9999)}`;
  const data = pick(VERBAL_LOGIC_TEMPLATES);
  return {
    id,
    category: 'logic',
    difficulty: 2,
    text: data.text,
    options: mcOptions(data.correct, data.wrongs),
  };
}

const LOGIC_TEMPLATES_D3: LogicTemplate[] = [
  {
    text: 'Kein Fisch ist ein Säugetier. Alle Wale sind Säugetiere. Welche Aussage stimmt zwingend?',
    correct: 'Kein Wal ist ein Fisch',
    wrongs: ['Einige Wale sind Fische', 'Alle Fische sind Wale', 'Manche Säugetiere sind Fische'],
  },
  {
    text: 'Alle Vögel können fliegen ist falsch. Pinguine sind Vögel. Was folgt daraus?',
    correct: 'Manche Vögel können nicht fliegen',
    wrongs: ['Pinguine können fliegen', 'Keine Vögel können fliegen', 'Alle Pinguine fliegen'],
  },
];

function generateLogicQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `log_${Date.now()}_${rand(0, 9999)}`;
  const templates: LogicTemplateOrGen[] = difficulty === 1 ? LOGIC_TEMPLATES_D1 
    : difficulty === 2 ? LOGIC_TEMPLATES_D2 
    : LOGIC_TEMPLATES_D3;
  
  const template = pick(templates);
  const data: LogicTemplate = typeof template === 'function' ? template() : template;
  
  return {
    id, category: 'logic', difficulty,
    text: data.text,
    options: mcOptions(data.correct, data.wrongs),
  };
}

const ANALOGIES_D1 = [
  { pairs: [['Hund', 'Bellen'], ['Katze', 'Miauen']], wrongs: ['Fressen', 'Schnurren', 'Fell'] },
  { pairs: [['Hand', 'Finger'], ['Fuß', 'Zeh']], wrongs: ['Schuh', 'Bein', 'Ferse'] },
  { pairs: [['Tag', 'Nacht'], ['Sommer', 'Winter']], wrongs: ['Frühling', 'Herbst', 'Jahr'] },
  { pairs: [['Ohr', 'Hören'], ['Auge', 'Sehen']], wrongs: ['Riechen', 'Sprechen', 'Denken'] },
];

const ANALOGIES_D2 = [
  { pairs: [['Arzt', 'Patient'], ['Lehrer', 'Schüler']], wrongs: ['Schule', 'Tafel', 'Unterricht'] },
  { pairs: [['Maler', 'Gemälde'], ['Komponist', 'Sinfonie']], wrongs: ['Pinsel', 'Orchester', 'Konzertsaal'] },
  { pairs: [['Buch', 'Lesen'], ['Film', 'Schauen']], wrongs: ['Schreiben', 'Kino', 'Spielen'] },
  { pairs: [['Wasser', 'Flüssig'], ['Eis', 'Fest']], wrongs: ['Kalt', 'Gefroren', 'Nass'] },
];

const ANALOGIES_D3 = [
  { pairs: [['Ei', 'Küken'], ['Raupe', 'Schmetterling']], wrongs: ['Blatt', 'Schnecke', 'Biene'] },
  { pairs: [['Ursache', 'Wirkung'], ['Frage', 'Antwort']], wrongs: ['Problem', 'Lösung', 'Rätsel'] },
  { pairs: [['Vergangenheit', 'Zukunft'], ['Geburt', 'Tod']], wrongs: ['Leben', 'Zeit', 'Geschichte'] },
];

function generateAnalogyQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `ana_${Date.now()}_${rand(0, 9999)}`;
  const pool = difficulty === 1 ? ANALOGIES_D1 
    : difficulty === 2 ? ANALOGIES_D2 
    : ANALOGIES_D3;
  
  const data = pick(pool);
  const [[a, b], [c, d]] = data.pairs;
  
  return {
    id, category: 'analogy', difficulty,
    text: `${a} : ${b} = ${c} : ?`,
    options: mcOptions(d, data.wrongs),
  };
}

const F = (flip: boolean, rot: number): Transform => ({ flip, rot });

function generateSpatialQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `spa_${Date.now()}_${rand(0, 9999)}`;
  
  const allTransforms: Transform[] = [];
  for (const flip of [false, true]) {
    for (const rot of [0, 90, 180, 270]) {
      allTransforms.push(F(flip, rot));
    }
  }
  
  const genOptions = (correct: Transform): Transform[] => {
    const others = allTransforms.filter(t => !(t.flip === correct.flip && t.rot === correct.rot));
    const shuffled = shuffle(others);
    return [correct, shuffled[0], shuffled[1], shuffled[2]];
  };
  
  if (difficulty === 1) {
    const rotation = pick([90, 180, 270]);
    const correct = F(false, rotation);
    const direction = rotation === 90 ? 'im Uhrzeigersinn' : rotation === 270 ? 'gegen den Uhrzeigersinn' : '';
    const text = rotation === 180 
      ? 'Die Form wird um 180° gedreht (auf den Kopf gestellt). Welche Form entsteht?'
      : `Die Form wird um ${rotation}° ${direction} gedreht. Welche Form entsteht?`;
    
    return {
      id, category: 'spatial', difficulty, text,
      options: genOptions(correct),
      visual: { type: 'glyph', items: [F(false, 0)] },
    };
  }
  
  if (difficulty === 2) {
    const vertical = rand(0, 1) === 0;
    const correct = vertical ? F(true, 0) : F(true, 180);
    const axis = vertical ? 'senkrechten' : 'waagerechten';
    const desc = vertical ? '(links ↔ rechts)' : '(oben ↔ unten)';
    
    return {
      id, category: 'spatial', difficulty,
      text: `Die Form wird an der ${axis} Achse gespiegelt ${desc}. Welche Form entsteht?`,
      options: genOptions(correct),
      visual: { type: 'glyph', items: [F(false, 0)] },
    };
  }
  
  const rotation = pick([90, 270]);
  const flipFirst = rand(0, 1) === 0;
  let correct: Transform;
  let text: string;
  
  if (flipFirst) {
    correct = F(true, rotation);
    text = `Die Form wird erst links ↔ rechts gespiegelt und danach um ${rotation}° im Uhrzeigersinn gedreht. Welche Form entsteht?`;
  } else {
    correct = F(true, (360 - rotation) % 360);
    text = `Die Form wird erst um ${rotation}° im Uhrzeigersinn gedreht und danach links ↔ rechts gespiegelt. Welche Form entsteht?`;
  }
  
  return {
    id, category: 'spatial', difficulty, text,
    options: genOptions(correct),
    visual: { type: 'glyph', items: [F(false, 0)] },
  };
}

function generateMathQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `mat_${Date.now()}_${rand(0, 9999)}`;
  
  if (difficulty === 1) {
    const ops = [
      () => {
        const a = rand(10, 30), b = rand(3, 9);
        return { text: `${a} × ${b} = ?`, answer: a * b };
      },
      () => {
        const a = rand(100, 500), b = rand(100, 500);
        return { text: `${a} + ${b} = ?`, answer: a + b };
      },
    ];
    const { text, answer } = pick(ops)();
    return {
      id, category: 'math', difficulty, text,
      options: mcOptions(String(answer), genWrongNumbers(answer, 3, 15)),
    };
  }
  
  if (difficulty === 2) {
    const ops = [
      () => {
        const pct = pick([10, 15, 20, 25]);
        const base = rand(4, 12) * (100 / pct);
        const answer = (pct / 100) * base;
        return { text: `${pct} % von ${base} = ?`, answer };
      },
      () => {
        const d = rand(2, 6);
        const a = rand(6, 12) * d;
        const c = rand(2, 5);
        const result = a / d + c;
        return { text: `${a} ÷ ${d} + ${c} = ?`, answer: result };
      },
    ];
    const { text, answer } = pick(ops)();
    return {
      id, category: 'math', difficulty, text,
      options: mcOptions(String(answer), genWrongNumbers(answer, 3, 8)),
    };
  }
  
  const a = rand(11, 19), b = rand(11, 19), c = rand(20, 60);
  const answer = a * b - c;
  return {
    id, category: 'math', difficulty,
    text: `${a} × ${b} − ${c} = ?`,
    options: mcOptions(String(answer), genWrongNumbers(answer, 3, 15)),
  };
}

const WM_SYMBOLS = ['◆', '●', '▲', '■', '★', '⬟'];

function generateWorkingMemoryQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `wm_${Date.now()}_${rand(0, 9999)}`;
  const useDigits = difficulty !== 3 && rand(0, 1) === 0;
  const len = difficulty === 1 ? rand(4, 5) : difficulty === 2 ? rand(5, 6) : rand(6, 7);
  let sequence: string[];
  let correct: string;
  if (useDigits) {
    const digits = new Set<number>();
    while (digits.size < len) digits.add(rand(1, 9));
    sequence = [...digits].map(String);
    correct = sequence.join('');
  } else {
    const pool = shuffle(WM_SYMBOLS);
    sequence = pool.slice(0, len);
    correct = sequence.join(' ');
  }
  const wrongs = new Set<string>();
  const mutators = [
    () => correct.slice(0, -1) + (useDigits ? String(rand(1, 9)) : WM_SYMBOLS[rand(0, WM_SYMBOLS.length - 1)]),
    () => (useDigits ? correct.split('').reverse().join('') : shuffle([...sequence]).join(' ')),
    () => {
      if (useDigits) {
        const arr = correct.split('');
        const i = rand(0, arr.length - 1);
        arr[i] = String(((Number(arr[i]) + rand(1, 3)) % 9) + 1);
        return arr.join('');
      }
      const arr = [...sequence];
      arr[rand(0, arr.length - 1)] = WM_SYMBOLS[rand(0, WM_SYMBOLS.length - 1)];
      return arr.join(' ');
    },
  ];
  let guard = 0;
  while (wrongs.size < 3 && guard < 40) {
    const w = mutators[rand(0, mutators.length - 1)]();
    if (w !== correct) wrongs.add(w);
    guard++;
  }
  const showMs = difficulty === 1 ? 4500 : difficulty === 2 ? 3800 : 3200;
  return {
    id,
    category: 'working_memory',
    difficulty,
    text: useDigits
      ? 'Gib die Ziffernfolge in der gleichen Reihenfolge ein.'
      : 'Gib die Symbolfolge in der gleichen Reihenfolge ein.',
    memoryRecall: { sequence, showMs, variant: useDigits ? 'digits' : 'symbols' },
    options: mcOptions(correct, [...wrongs]),
  };
}

const SPEED_SETS: { base: string; odd: string; wrongs: string[] }[] = [
  { base: '▲', odd: '●', wrongs: ['▲', '▲', '▲'] },
  { base: '7', odd: '4', wrongs: ['7', '7', '7'] },
  { base: '■', odd: '□', wrongs: ['■', '■', '■'] },
  { base: 'M', odd: 'W', wrongs: ['M', 'M', 'M'] },
  { base: '🔵', odd: '🔴', wrongs: ['🔵', '🔵', '🔵'] },
];

function generateProcessingSpeedQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `spd_${Date.now()}_${rand(0, 9999)}`;
  const n = difficulty === 1 ? 4 : difficulty === 2 ? 5 : 6;
  const template = pick(SPEED_SETS);
  const pos = rand(0, n - 1);
  const displayed = Array.from({ length: n }, (_, i) => (i === pos ? template.odd : template.base));
  const correct = template.odd;
  const wrongs: string[] = [];
  const pool = [template.base, ...SPEED_SETS.map(s => s.odd).filter(s => s !== correct)];
  for (const s of pool) {
    if (s !== correct && !wrongs.includes(s)) wrongs.push(s);
    if (wrongs.length >= 3) break;
  }
  while (wrongs.length < 3) {
    const alt = SPEED_SETS[rand(0, SPEED_SETS.length - 1)].base;
    if (alt !== correct && !wrongs.includes(alt)) wrongs.push(alt);
  }
  return {
    id,
    category: 'processing_speed',
    difficulty,
    text: `Welches Zeichen passt NICHT zur Reihe?  ${displayed.join('  ')}`,
    options: mcOptions(correct, wrongs),
  };
}

/** Prüft: genau eine korrekte Antwort (Index 0), vier unterscheidbare Optionen. */
export function isQuestionStructurallyValid(q: Question): boolean {
  if (q.options.length !== 4) return false;
  const sig = (o: Question['options'][number]) =>
    typeof o === 'string'
      ? o
      : 'kind' in o
        ? JSON.stringify(o)
        : `${o.flip}:${o.rot}`;
  const keys = q.options.map(sig);
  if (new Set(keys).size !== 4) return false;
  if (!isPatternQuestionSolvable(q)) return false;
  return true;
}

/** Stabile Musterfrage für Frage 6/42 (erstes Muster, leicht) — eindeutig lösbar. */
function generateStableFirstPatternQuestion(): Question {
  return generateRotationPatternQuestion(`pat_stable_${Date.now()}`, 1, 'triangle');
}

function generateUniquePattern(
  signature: (item: Question) => string,
  gen: () => Question,
  previousSig: string | null,
): Question {
  for (let attempts = 0; attempts < 40; attempts++) {
    const q = generateUnique(signature, gen, previousSig);
    if (isPatternQuestionSolvable(q)) return q;
  }
  return generateStableFirstPatternQuestion();
}

function pushGenerated(
  questions: Question[],
  gen: () => Question,
  patternSafe = false,
): void {
  const prevSig = questions.length ? iqQuestionSignature(questions[questions.length - 1]) : null;
  const q = patternSafe
    ? generateUniquePattern(iqQuestionSignature, gen, prevSig)
    : generateUnique(iqQuestionSignature, gen, prevSig);
  questions.push(q);
}

const CORE_SLOTS = 10;
const WM_SLOTS = 12;
const SPD_SLOTS = 10;

function genForCategory(category: Category, difficulty: 1 | 2 | 3, slotIndex: number): Question {
  if (category === 'pattern' && difficulty === 1 && slotIndex === 5) {
    return generateStableFirstPatternQuestion();
  }
  switch (category) {
    case 'sequence':
      return generateSequenceQuestion(difficulty);
    case 'pattern':
      return generatePatternQuestion(difficulty);
    case 'logic':
      return generateLogicQuestion(difficulty);
    case 'analogy':
      return generateAnalogyQuestion(difficulty);
    case 'spatial':
      return generateSpatialQuestion(difficulty);
    case 'math':
      return generateMathQuestion(difficulty);
    default:
      return generateSequenceQuestion(difficulty);
  }
}

export function generateQuestions(): Question[] {
  const questions: Question[] = [];
  const core: Category[] = ['sequence', 'pattern', 'logic', 'analogy', 'spatial', 'math'];

  core.forEach((category, categoryIndex) => {
    for (let slot = 0; slot < CORE_SLOTS; slot++) {
      const difficulty = difficultyForSlot(categoryIndex, slot, CORE_SLOTS);
      const slotIndex = questions.length;
      pushGenerated(
        questions,
        () => genForCategory(category, difficulty, slotIndex),
        category === 'pattern',
      );
    }
  });

  for (let i = 0; i < 2; i++) {
    pushGenerated(questions, () => generateVerbalLogicQuestion());
  }

  for (let slot = 0; slot < WM_SLOTS; slot++) {
    const categoryIndex = 6;
    const d = difficultyForSlot(categoryIndex, slot, WM_SLOTS);
    pushGenerated(questions, () => generateWorkingMemoryQuestion(d));
  }

  for (let slot = 0; slot < SPD_SLOTS; slot++) {
    const categoryIndex = 7;
    const d = difficultyForSlot(categoryIndex, slot, SPD_SLOTS);
    pushGenerated(questions, () => generateProcessingSpeedQuestion(d));
  }

  return questions;
}

import type { Question, Category, ShapeSpec, Transform } from './questions';
import { generateUnique, iqQuestionSignature } from '../utils/questionSignature';

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
      options: shuffle([String(answer), ...genWrongNumbers(answer, 3)]),
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
      options: shuffle([String(answer), ...genWrongNumbers(answer, 3)]),
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
    options: shuffle([String(answer), ...genWrongNumbers(answer, 3, 20)]),
  };
}

const SHAPES: ShapeSpec['kind'][] = ['circle', 'square', 'triangle', 'star', 'diamond'];
const ROTATIONS = [0, 90, 180, 270];

function generatePatternQuestion(difficulty: 1 | 2 | 3): Question {
  const id = `pat_${Date.now()}_${rand(0, 9999)}`;
  
  if (difficulty === 1) {
    // Kreis, Quadrat & Stern: Rotation nicht unterscheidbar — nur Dreieck & Raute
    const shape = pick(SHAPES.filter(s => s === 'triangle' || s === 'diamond'));
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
    const wrongs: ShapeSpec[] = shuffle(wrongRots)
      .slice(0, 3)
      .map(r => ({ kind: shape, rot: r }));

    return {
      id, category: 'pattern', difficulty,
      text: 'Welche Form ergänzt die Reihe? (Die Form dreht sich jeweils um 90°.)',
      options: shuffle([correct, ...wrongs]),
      visual: { type: 'shapes', items },
    };
  }
  
  if (difficulty === 2) {
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
      options: shuffle([correct, ...wrongs]),
      visual: { type: 'shapes', items },
    };
  }
  
  const shape = pick(SHAPES);
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
  
  return {
    id, category: 'pattern', difficulty,
    text: 'Die Formen wachsen und wechseln die Füllung. Was folgt?',
    options: shuffle([correct, ...wrongs]),
    visual: { type: 'shapes', items },
  };
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
    options: shuffle([data.correct, ...data.wrongs]),
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
    options: shuffle([d, ...data.wrongs]),
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
      options: shuffle(genOptions(correct)),
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
      options: shuffle(genOptions(correct)),
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
    options: shuffle(genOptions(correct)),
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
      options: shuffle([String(answer), ...genWrongNumbers(answer, 3, 15)]),
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
      options: shuffle([String(answer), ...genWrongNumbers(answer, 3, 8)]),
    };
  }
  
  const a = rand(11, 19), b = rand(11, 19), c = rand(20, 60);
  const answer = a * b - c;
  return {
    id, category: 'math', difficulty,
    text: `${a} × ${b} − ${c} = ?`,
    options: shuffle([String(answer), ...genWrongNumbers(answer, 3, 15)]),
  };
}

/** Stabile Musterfrage für Frage 6/30 (erstes Muster, leicht) — eindeutig lösbar. */
function generateStableFirstPatternQuestion(): Question {
  const shape: ShapeSpec['kind'] = 'triangle';
  const startRot = 0;
  const step = 90;
  const items: (ShapeSpec | null)[] = [];
  for (let i = 0; i < 3; i++) {
    items.push({ kind: shape, rot: (startRot + i * step) % 360 });
  }
  items.push(null);
  const correctRot = (startRot + 3 * step) % 360;
  const correct: ShapeSpec = { kind: shape, rot: correctRot };
  const wrongRots = ROTATIONS.filter(r => r !== correctRot);
  const wrongs: ShapeSpec[] = shuffle(wrongRots)
    .slice(0, 3)
    .map(r => ({ kind: shape, rot: r }));

  return {
    id: `pat_stable_${Date.now()}`,
    category: 'pattern',
    difficulty: 1,
    text: 'Welche Form ergänzt die Reihe? (Die Form dreht sich jeweils um 90°.)',
    options: shuffle([correct, ...wrongs]),
    visual: { type: 'shapes', items },
  };
}

export function generateQuestions(): Question[] {
  const questions: Question[] = [];
  const categories: Category[] = ['sequence', 'pattern', 'logic', 'analogy', 'spatial', 'math'];
  const difficulties: (1 | 2 | 3)[] = [1, 1, 2, 2, 3];
  
  for (const category of categories) {
    for (const difficulty of difficulties) {
      const prevSig = questions.length ? iqQuestionSignature(questions[questions.length - 1]) : null;
      const slotIndex = questions.length;
      const gen = (): Question => {
        if (category === 'pattern' && difficulty === 1 && slotIndex === 5) {
          return generateStableFirstPatternQuestion();
        }
        switch (category) {
          case 'sequence': return generateSequenceQuestion(difficulty);
          case 'pattern': return generatePatternQuestion(difficulty);
          case 'logic': return generateLogicQuestion(difficulty);
          case 'analogy': return generateAnalogyQuestion(difficulty);
          case 'spatial': return generateSpatialQuestion(difficulty);
          case 'math': return generateMathQuestion(difficulty);
        }
      };
      const q = generateUnique(iqQuestionSignature, gen, prevSig);
      questions.push(q);
    }
  }
  
  return questions;
}

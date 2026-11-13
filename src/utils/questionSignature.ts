import type { Question, Option } from '../iq/questions';

function normalizeOptions(opts: Option[]): string {
  return opts
    .map(o => {
      if (typeof o === 'string') return o;
      if ('kind' in o) return `${o.kind}:${o.rot ?? 0}:${o.n ?? ''}:${o.size ?? ''}:${o.fill ?? ''}`;
      return `t:${o.flip}:${o.rot}`;
    })
    .sort()
    .join('|');
}

/** Signatur einer IQ-Frage (unabhängig von Antwort-Reihenfolge in der UI). */
export function iqQuestionSignature(q: Question): string {
  return `${q.category}|${q.difficulty}|${q.text.trim()}|${normalizeOptions(q.options)}`;
}

export function isSameTaskSignature(a: string, b: string): boolean {
  return a === b;
}

export function dedupeConsecutive<T>(
  items: T[],
  signature: (item: T) => string,
  generate: () => T,
  maxAttempts = 25,
): T[] {
  const out: T[] = [];
  for (const item of items) {
    let candidate = item;
    let attempts = 0;
    const prevSig = out.length > 0 ? signature(out[out.length - 1]) : null;
  while (prevSig && isSameTaskSignature(signature(candidate), prevSig) && attempts < maxAttempts) {
      candidate = generate();
      attempts++;
    }
    out.push(candidate);
  }
  return out;
}

export function generateUnique<T>(
  signature: (item: T) => string,
  generate: () => T,
  previousSig: string | null,
  maxAttempts = 30,
): T {
  let attempts = 0;
  let item = generate();
  while (previousSig && isSameTaskSignature(signature(item), previousSig) && attempts < maxAttempts) {
    item = generate();
    attempts++;
  }
  return item;
}

/** Math-/Logik-Übung: gleicher Inhalt, auch bei anderer Antwort-Reihenfolge. */
export function drillSignature(text: string, answer: string | number): string {
  return `${text.trim()}=>${answer}`;
}

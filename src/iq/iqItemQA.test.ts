import { describe, expect, it } from 'vitest';
import { generateQuestions, isPatternQuestionSolvable, isQuestionStructurallyValid } from './questionGenerators';
import { IQ_QUESTION_COUNT } from './questions';
import { shapeVisualKey } from './shapeVisual';
import type { ShapeSpec } from './questions';

describe('IQ item generators', () => {
  it(`produces ${IQ_QUESTION_COUNT} questions with valid structure`, () => {
    const RUNS = 8;
    for (let run = 0; run < RUNS; run++) {
      const qs = generateQuestions();
      expect(qs.length).toBe(IQ_QUESTION_COUNT);
      for (const q of qs) {
        expect(isQuestionStructurallyValid(q)).toBe(true);
        if (q.category === 'pattern') {
          expect(isPatternQuestionSolvable(q)).toBe(true);
        }
        const opts = q.options;
        expect(opts.length).toBe(4);
        const sigs = opts.map(o =>
          typeof o === 'string'
            ? o
            : 'kind' in o
              ? shapeVisualKey(o as ShapeSpec)
              : `${o.flip}:${o.rot}`,
        );
        expect(new Set(sigs).size).toBe(4);
      }
    }
  });
});
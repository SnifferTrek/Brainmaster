import type { ShapeSpec } from './questions';

/** Visueller Schlüssel — Rotation bei symmetrischen Formen zählt nicht. */
export function shapeVisualKey(s: ShapeSpec): string {
  const symRotationInvisible =
    s.kind === 'circle' || s.kind === 'square' || s.kind === 'diamond';
  const rot = symRotationInvisible ? 0 : (s.rot ?? 0);
  return `${s.kind}:${rot}:${s.n ?? ''}:${s.size ?? ''}:${s.fill ?? ''}`;
}

export function shapeOptionsDistinct(options: ShapeSpec[]): boolean {
  const keys = options.map(shapeVisualKey);
  return new Set(keys).size === options.length;
}
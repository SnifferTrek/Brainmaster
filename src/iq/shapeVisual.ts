import type { ShapeSpec } from './questions';

/** Visueller Schlüssel — Rotation bei symmetrischen Formen zählt nicht. */
export function shapeVisualKey(s: ShapeSpec): string {
  if (s.nested) {
    const n = s.nested;
    const rot = s.rot ?? 0;
    return `nested:${n.outer}:${n.inner}:${n.outerFill ?? ''}:${n.innerFill ?? ''}:${rot}`;
  }
  if (s.grid) {
    const g = s.grid;
    const filled = [...g.filled].sort((a, b) => a - b).join('-');
    return `grid:${g.size}:${filled}:${g.rot ?? ''}:${g.cellFill ?? ''}:${g.invert ?? ''}`;
  }
  const symRotationInvisible =
    s.kind === 'circle' || s.kind === 'square' || s.kind === 'diamond';
  const rot = symRotationInvisible && !s.grid ? 0 : (s.rot ?? 0);
  return `${s.kind}:${rot}:${s.n ?? ''}:${s.size ?? ''}:${s.fill ?? ''}:${s.bgFill ?? ''}:${s.fgFill ?? ''}`;
}

export function shapeOptionsDistinct(options: ShapeSpec[]): boolean {
  const keys = options.map(shapeVisualKey);
  return new Set(keys).size === options.length;
}
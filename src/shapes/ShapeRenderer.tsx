import type { ReactNode } from 'react';
import type { ShapeSpec } from '../iq/questions';

export const SHAPE_INK = '#1e3a8a';

type ShapeRendererProps = { s: ShapeSpec | null; box?: number; ink?: string };

function basicPath(kind: ShapeSpec['kind']): { body: ReactNode | null; symRot: boolean } {
  const symRot = kind === 'circle' || kind === 'square' || kind === 'diamond';
  return { body: null, symRot };
}

function renderPrimitive(
  kind: ShapeSpec['kind'],
  props: { fill: string; stroke: string; strokeWidth: number },
  inset = 0,
) {
  const m = 10 + inset;
  const w = 44 - inset * 2;
  if (kind === 'circle') return <circle cx="32" cy="32" r={22 - inset} {...props} fill={props.fill} />;
  if (kind === 'square') return <rect x={m} y={m} width={w} height={w} {...props} />;
  if (kind === 'diamond') return <polygon points="32,6 58,32 32,58 6,32" {...props} />;
  if (kind === 'triangle') return <polygon points="32,8 56,54 8,54" {...props} />;
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 11 : 26;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${32 + r * Math.cos(a)},${33 + r * Math.sin(a)}`;
  }).join(' ');
  return <polygon points={pts} {...props} />;
}

function renderNested(nested: NonNullable<ShapeSpec['nested']>, ink: string) {
  const stroke = ink;
  const outerFill = nested.outerFill === false ? 'none' : ink;
  const innerFill = nested.innerFill === false ? 'none' : ink;
  const outerProps = { fill: outerFill, stroke, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  const innerProps = { fill: innerFill, stroke, strokeWidth: 2, strokeLinejoin: 'round' as const };
  const outer =
    nested.outer === 'circle' ? (
      <circle cx="32" cy="32" r="24" {...outerProps} />
    ) : (
      <rect x="8" y="8" width="48" height="48" {...outerProps} />
    );
  const innerKind = nested.inner;
  const innerScale = nested.outer === 'circle' ? 0.55 : 0.5;
  const innerBody = renderPrimitive(innerKind, innerProps, 8);
  return (
    <g>
      {outer}
      <g transform={`translate(32 32) scale(${innerScale}) translate(-32 -32)`}>{innerBody}</g>
    </g>
  );
}

function renderGrid(grid: NonNullable<ShapeSpec['grid']>, ink: string) {
  const n = grid.size;
  const pad = 6;
  const inner = 52;
  const cell = inner / n;
  const filled = new Set(grid.filled);
  const invert = grid.invert ?? false;
  const cells = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const idx = row * n + col;
      const isMarked = filled.has(idx);
      const fillCell = invert ? !isMarked : isMarked;
      const fill = fillCell ? (grid.cellFill === false ? 'none' : ink) : 'none';
      cells.push(
        <rect
          key={idx}
          x={pad + col * cell + 1}
          y={pad + row * cell + 1}
          width={cell - 2}
          height={cell - 2}
          fill={fill}
          stroke={ink}
          strokeWidth={1.5}
        />,
      );
    }
  }
  return (
    <g transform={`rotate(${grid.rot ?? 0} 32 32)`}>
      <rect x={pad - 2} y={pad - 2} width={inner + 4} height={inner + 4} fill="none" stroke={ink} strokeWidth={2.5} />
      {cells}
    </g>
  );
}

export function ShapeRenderer({ s, box = 64, ink = SHAPE_INK }: ShapeRendererProps) {
  if (!s) {
    return (
      <svg width={box} height={box} viewBox="0 0 64 64">
        <rect x="4" y="4" width="56" height="56" rx="10" fill="#eff6ff" stroke="#93c5fd" strokeDasharray="5 4" strokeWidth="2" />
        <text x="32" y="43" textAnchor="middle" fontSize="30" fontWeight="700" fill="#2563eb">
          ?
        </text>
      </svg>
    );
  }

  if (s.nested) {
    return (
      <svg width={box} height={box} viewBox="0 0 64 64">
        <g transform={`rotate(${s.rot ?? 0} 32 32)`}>{renderNested(s.nested, ink)}</g>
      </svg>
    );
  }

  if (s.grid) {
    return (
      <svg width={box} height={box} viewBox="0 0 64 64">
        {renderGrid(s.grid, ink)}
      </svg>
    );
  }

  const fgFill =
    s.fgFill !== undefined
      ? s.fgFill === false
        ? 'none'
        : ink
      : s.fill === false
        ? 'none'
        : ink;
  const props = { fill: fgFill, stroke: ink, strokeWidth: 3, strokeLinejoin: 'round' as const };
  const sz = s.size ?? 1;
  const { symRot } = basicPath(s.kind);
  const rot = symRot ? 0 : (s.rot ?? 0);

  let body: ReactNode;
  if (s.kind === 'square' && s.n) {
    const nn = s.n;
    const cell = 56 / Math.max(nn, 3);
    body = Array.from({ length: nn }, (_, i) => (
      <rect key={i} x={4 + i * cell + 1} y={32 - cell / 2} width={cell - 2} height={cell - 2} {...props} />
    ));
  } else if (s.bgFill !== undefined) {
    const bgFill = s.bgFill === false ? 'none' : ink;
    const bgProps = { fill: bgFill, stroke: ink, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
    body = (
      <g>
        <rect x="6" y="6" width="52" height="52" {...bgProps} />
        <g transform="translate(32 32) scale(0.62) translate(-32 -32)">{renderPrimitive(s.kind, props, 4)}</g>
      </g>
    );
  } else {
    body = renderPrimitive(s.kind, props);
  }

  return (
    <svg width={box} height={box} viewBox="0 0 64 64">
      <g transform={`rotate(${rot} 32 32) translate(32 32) scale(${sz}) translate(-32 -32)`}>{body}</g>
    </svg>
  );
}
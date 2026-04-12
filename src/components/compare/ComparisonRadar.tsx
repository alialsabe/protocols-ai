'use client';

import type { ProtocolReport } from '@/lib/protocol-types';
import { computeComparisonMetrics } from './metrics';

type ComparisonResult = {
  query: string;
  report: ProtocolReport | null;
  status: 'ok' | 'generating' | 'not_found';
};

const AXES = [
  { key: 'evidenceQuality', label: 'Evidence' },
  { key: 'safetyProfile', label: 'Safety' },
  { key: 'researchDepth', label: 'Research' },
  { key: 'bioavailability', label: 'Absorption' },
  { key: 'affordability', label: 'Cost' },
] as const;

// Keep explicit hex for the radar shapes — CSS vars don't paint SVG fills reliably.
// These match the token palette: accent (low), mid, high, violet, sky.
const COLORS = ['#06d6a0', '#38bdf8', '#fbbf24', '#fb7185', '#a78bfa'];

const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 40;

function axisPoint(index: number, value: number): [number, number] {
  // Start at top (-90°), rotate clockwise
  const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / AXES.length;
  const r = value * RADIUS;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

function labelPoint(index: number): [number, number] {
  const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / AXES.length;
  const r = RADIUS + 22;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

export function ComparisonRadar({ results }: { results: ComparisonResult[] }) {
  const withReports = results.filter((r) => r.report !== null) as Array<ComparisonResult & { report: ProtocolReport }>;

  if (withReports.length === 0) return null;

  // Grid rings at 0.25, 0.5, 0.75, 1.0
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div
      className="rounded-[16px] p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
    >
      <span
        className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--fg-dim)' }}
      >
        PROFILE
      </span>
      <h3
        className="mt-2 text-[22px] font-extrabold tracking-[-0.4px]"
        style={{ color: 'var(--fg)' }}
      >
        Profile comparison
      </h3>
      <p className="mt-2 text-[13px]" style={{ color: 'var(--fg-muted)' }}>
        Each axis is normalized 0–1. Higher is better on all dimensions.
      </p>
      <div className="h-4" />
      {/* spacer for layout parity with original */}

      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="flex-shrink-0"
          aria-label="Radar chart comparing supplement profiles"
        >
          {/* Grid rings */}
          {rings.map((r) => (
            <polygon
              key={r}
              points={AXES.map((_, i) => {
                const [x, y] = axisPoint(i, r);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
          ))}

          {/* Axis spokes */}
          {AXES.map((_, i) => {
            const [x, y] = axisPoint(i, 1);
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            );
          })}

          {/* Supplement polygons */}
          {withReports.map((r, idx) => {
            const metrics = computeComparisonMetrics(r.report);
            const color = COLORS[idx % COLORS.length];
            const points = AXES.map((axis, i) => {
              const [x, y] = axisPoint(i, metrics[axis.key]);
              return `${x},${y}`;
            }).join(' ');

            return (
              <g key={idx}>
                <polygon
                  points={points}
                  fill={color}
                  fillOpacity={0.12}
                  stroke={color}
                  strokeWidth={2}
                />
                {AXES.map((axis, i) => {
                  const [x, y] = axisPoint(i, metrics[axis.key]);
                  return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
                })}
              </g>
            );
          })}

          {/* Axis labels */}
          {AXES.map((axis, i) => {
            const [x, y] = labelPoint(i);
            return (
              <text
                key={axis.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#a1a1aa"
                fontFamily="var(--font-geist-mono), monospace"
                fontSize={11}
                fontWeight={700}
                letterSpacing={1.4}
                style={{ textTransform: 'uppercase' }}
              >
                {axis.label}
              </text>
            );
          })}
        </svg>

        <div className="min-w-0 flex-1 space-y-2">
          {withReports.map((r, idx) => {
            const color = COLORS[idx % COLORS.length];
            return (
              <div key={idx} className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span
                  className="truncate font-mono text-[13px]"
                  style={{ color: 'var(--fg)' }}
                >
                  {r.report.name}
                </span>
                {r.status === 'generating' ? (
                  <span
                    className="rounded-full px-1.5 py-0.5 font-mono text-[10px]"
                    style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}
                  >
                    generating
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

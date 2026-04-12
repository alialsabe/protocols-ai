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
    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-1">Profile comparison</h3>
      <p className="text-xs text-[#71717a] mb-4">
        Each axis is normalized 0-1. Higher is better on all dimensions.
      </p>

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
                className="fill-[#a1a1aa] text-[11px] font-semibold uppercase tracking-wider"
              >
                {axis.label}
              </text>
            );
          })}
        </svg>

        <div className="flex-1 space-y-2 min-w-0">
          {withReports.map((r, idx) => {
            const color = COLORS[idx % COLORS.length];
            return (
              <div key={idx} className="flex items-center gap-3">
                <span
                  className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-white truncate">{r.report.name}</span>
                {r.status === 'generating' ? (
                  <span className="text-[10px] font-medium text-[#fbbf24] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded-full">
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

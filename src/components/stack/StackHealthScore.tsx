'use client';

import type { ProtocolReport } from '@/lib/protocol-types';
import { computeStackHealthScore } from '@/lib/stack-utils';

/**
 * Visual stack health score: animated 0-100 ring + improvement tip.
 */
export function StackHealthScore({
  reports,
  goals = [],
}: {
  reports: ProtocolReport[];
  goals?: string[];
}) {
  const { score, tip } = computeStackHealthScore(reports, goals);

  const bucket =
    score >= 80 ? 'high' :
    score >= 60 ? 'good' :
    score >= 40 ? 'fair' : 'low';
  const color =
    bucket === 'high' ? '#06d6a0' :
    bucket === 'good' ? '#38bdf8' :
    bucket === 'fair' ? '#fbbf24' : '#fb7185';
  const label =
    bucket === 'high' ? 'Strong stack' :
    bucket === 'good' ? 'Solid stack' :
    bucket === 'fair' ? 'Room to grow' : 'Needs work';

  // Donut ring math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-1">Stack Health Score</h3>
      <p className="text-xs text-[#71717a] mb-5">Based on evidence quality, goal alignment, and dosing completeness.</p>

      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width={130} height={130} viewBox="0 0 130 130" className="-rotate-90">
            <circle
              cx={65}
              cy={65}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={8}
            />
            <circle
              cx={65}
              cy={65}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white leading-none">{score}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#71717a] mt-1">
              / 100
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            {label}
          </div>
          <p className="text-sm text-[#d4d4d8] leading-relaxed">{tip}</p>
        </div>
      </div>
    </div>
  );
}

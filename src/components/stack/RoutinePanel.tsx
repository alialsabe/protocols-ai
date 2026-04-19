'use client';

import { useEffect, useState } from 'react';
import type { ScheduleBlock, SchedulerWarning } from '@/lib/protocol-types';

interface Props {
  /** Supplement display names or slugs — scheduler resolves both via alias lookup. */
  names: string[];
}

interface SchedulerResponse {
  schedule: {
    blocks: ScheduleBlock[];
    warnings: SchedulerWarning[];
    generatedAt: string;
  };
}

/**
 * "Your Routine Today" — the killer feature.
 *
 * Takes the user's stack (names), calls the deterministic scheduler engine,
 * and renders a conflict-resolved daily timeline + a synergy/spacing banner.
 *
 * This is the wedge Examine.com and Strong-by-Zero can't replicate: they list
 * supplements, we compose them.
 */
export function RoutinePanel({ names }: Props) {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [warnings, setWarnings] = useState<SchedulerWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (names.length === 0) {
      setBlocks([]);
      setWarnings([]);
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/scheduler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplements: names }),
        });
        if (!res.ok) {
          if (!cancelled) setError('Schedule temporarily unavailable.');
          return;
        }
        const data: SchedulerResponse = await res.json();
        if (cancelled) return;
        setBlocks(data.schedule.blocks ?? []);
        setWarnings(data.schedule.warnings ?? []);
      } catch {
        if (!cancelled) setError('Schedule temporarily unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [names]);

  if (names.length === 0) return null;

  const synergies = warnings.filter((w) => w.type === 'conflict' && w.severity === 'info');
  const spacingWarnings = warnings.filter(
    (w) => w.type === 'spacing' || (w.type === 'conflict' && w.severity !== 'info'),
  );

  return (
    <section className="pt-8 pb-6">
      <div className="flex items-baseline justify-between pb-4">
        <div>
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--accent)' }}
          >
            Your Routine Today
          </span>
          <h2
            className="mt-1 text-[22px] font-extrabold tracking-[-0.4px]"
            style={{ color: 'var(--fg)' }}
          >
            {loading ? 'Resolving schedule…' : `${blocks.length} timed blocks, auto-spaced`}
          </h2>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 rounded-[12px] p-4 text-[13px]"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {/* Conflict banner — the magic moment */}
      {(spacingWarnings.length > 0 || synergies.length > 0) && (
        <div
          className="mb-5 rounded-[12px] p-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hair)',
          }}
        >
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            Stack Analysis
          </span>
          <ul className="mt-3 flex flex-col gap-2">
            {spacingWarnings.map((w, i) => (
              <li key={`spacing-${i}`} className="flex items-start gap-3 text-[13px]">
                <span
                  className="mt-[6px] h-[8px] w-[8px] flex-shrink-0 rounded-full"
                  style={{
                    background: w.severity === 'critical' ? '#ef4444' : '#fbbf24',
                  }}
                  aria-hidden
                />
                <span style={{ color: 'var(--fg)' }}>{w.message}</span>
              </li>
            ))}
            {synergies.map((w, i) => (
              <li key={`syn-${i}`} className="flex items-start gap-3 text-[13px]">
                <span
                  className="mt-[6px] h-[8px] w-[8px] flex-shrink-0 rounded-full"
                  style={{ background: 'var(--accent)' }}
                  aria-hidden
                />
                <span style={{ color: 'var(--fg-muted)' }}>{w.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline */}
      <ol
        className="flex flex-col overflow-hidden rounded-[16px]"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
        }}
      >
        {blocks.map((block, idx) => (
          <li
            key={idx}
            className="flex items-start gap-5 px-6 py-5"
            style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--hair)' }}
          >
            <div className="flex w-[78px] flex-shrink-0 flex-col">
              <span
                className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                style={{ color: 'var(--accent)' }}
              >
                {block.time}
              </span>
              <span
                className="mt-1 font-mono text-[10px] uppercase tracking-[1.2px]"
                style={{ color: 'var(--fg-dim)' }}
              >
                {block.title.split(' — ')[0]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                {block.supplements.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--hair-strong)',
                      color: 'var(--fg)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p
                className="mt-2 text-[12px] leading-[18px]"
                style={{ color: 'var(--fg-muted)' }}
              >
                {block.context}
              </p>
              {block.caution && (
                <p
                  className="mt-2 text-[12px] leading-[18px]"
                  style={{ color: '#fbbf24' }}
                >
                  {block.caution}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

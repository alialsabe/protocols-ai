'use client';

import type { ScheduleBlock, SchedulerWarning } from '@/lib/protocol-types';

interface Props {
  blocks: ScheduleBlock[];
  warnings: SchedulerWarning[];
  loading: boolean;
  error: string | null;
}

/**
 * "Your Routine Today" — vertical block list with conflict resolver.
 *
 * Takes the scheduler output (lifted to a parent so it can be shared with
 * the TimelineView ribbon above), and renders each timed block with its
 * supplements, context, and any cautions. Synergy + spacing warnings
 * surface in a banner above the list.
 */
export function RoutinePanel({ blocks, warnings, loading, error }: Props) {
  if (blocks.length === 0 && !loading && !error) return null;

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

      {/* Block list */}
      <ol
        id="routine-blocks"
        className="flex flex-col overflow-hidden rounded-[16px]"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
        }}
      >
        {blocks.map((block, idx) => (
          <li
            key={idx}
            id={`routine-block-${idx}`}
            className="flex items-start gap-5 px-6 py-5 transition-colors target:bg-[var(--accent-tint)]"
            style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--hair)', scrollMarginTop: '120px' }}
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

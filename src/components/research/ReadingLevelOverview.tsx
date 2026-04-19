'use client';

import { useState } from 'react';
import type { ProtocolReport } from '@/lib/protocol-types';
import { SectionHeader } from './OverviewSection';

type Level = 'plain' | 'balanced' | 'scientific';

const LEVELS: { id: Level; label: string }[] = [
  { id: 'plain', label: 'Plain English' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'scientific', label: 'Scientific' },
];

/**
 * Reading-level toggle for the overview summary.
 *
 * We don't carry three hand-written summaries per supplement in the DB (yet),
 * so we derive:
 *   - plain: first sentence of the summary + plain-language "what it does" framing
 *   - balanced: the full summary as stored (default)
 *   - scientific: full summary + every indexed finding with its detail text
 * This gives real differentiation at three levels without a second data pass.
 */
export function ReadingLevelOverview({ report }: { report: ProtocolReport }) {
  const [level, setLevel] = useState<Level>('balanced');

  const rawSummary =
    report.science?.summary?.trim() ||
    `${report.name ?? 'This compound'} is indexed in the Protocols.ai catalog. Peer-reviewed mechanism and citation data is pending for this entry.`;

  const findings = (report.science?.findings ?? [])
    .map((f) => ({
      title: (f.title ?? f.claim ?? '').trim(),
      detail: (f.detail ?? f.context ?? '').trim(),
      quality: f.quality,
    }))
    .filter((u) => u.title || u.detail);

  const chips = findings.slice(0, 6).map((u) => u.title).filter(Boolean);

  // Plain: first two sentences only, stripped of complex citations.
  const sentences = rawSummary
    .replace(/\([^)]*\)/g, '')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  const plain = sentences.slice(0, 2).join(' ');

  // Who should take it — derived from top finding titles (no LLM call).
  const goals = chips.slice(0, 3).join(', ').toLowerCase();

  return (
    <section>
      <SectionHeader label="01 / OVERVIEW" title="What this compound does" />

      <div
        className="mt-6 rounded-[16px] p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
      >
        {/* Level switcher */}
        <div
          className="-mx-8 mb-6 flex items-center gap-1 border-b px-8 pb-5"
          style={{ borderColor: 'var(--hair)' }}
          role="tablist"
          aria-label="Reading level"
        >
          {LEVELS.map((l) => {
            const active = l.id === level;
            return (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLevel(l.id)}
                className="inline-flex min-h-[36px] items-center rounded-full px-4 font-mono text-[10px] font-bold uppercase tracking-[1.4px] transition-colors"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#000' : 'var(--fg-dim)',
                  border: active ? '1px solid var(--accent)' : '1px solid var(--hair-strong)',
                }}
              >
                {l.label}
              </button>
            );
          })}
        </div>

        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          {level === 'plain' ? 'THE SHORT VERSION' : level === 'scientific' ? 'MECHANISM (FULL)' : 'MECHANISM'}
        </span>
        <p
          className="mt-3 max-w-[760px] text-[15px] leading-[26px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          {level === 'plain' ? plain : rawSummary}
        </p>

        {level === 'plain' && goals && (
          <div
            className="mt-6 rounded-[12px] px-4 py-3 text-[13px] leading-[20px]"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--hair)',
              color: 'var(--fg)',
            }}
          >
            <span
              className="mr-2 font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--accent)' }}
            >
              WHO IT'S FOR
            </span>
            People looking to support {goals}.
          </div>
        )}

        {chips.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[1.2px]"
                style={{
                  color: 'var(--accent)',
                  border: '1px solid var(--hair-strong)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {findings.length > 0 && (
          <div className="mt-8">
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              EFFECTS &amp; USES
            </span>
            <ul className="mt-4 flex flex-col gap-5">
              {findings.map((u, i) => (
                <li key={i} className="grid grid-cols-[8px_1fr] gap-4 pl-1">
                  <span
                    className="mt-[7px] h-[8px] w-[8px] flex-shrink-0 rounded-full"
                    style={{
                      background:
                        u.quality === 'high'
                          ? 'var(--accent)'
                          : u.quality === 'medium'
                            ? '#fbbf24'
                            : 'var(--fg-faint)',
                    }}
                    aria-hidden
                  />
                  <div>
                    {u.title && (
                      <div
                        className="text-[14px] font-semibold tracking-[-0.1px]"
                        style={{ color: 'var(--fg)' }}
                      >
                        {u.title}
                      </div>
                    )}
                    {(level === 'scientific' || level === 'balanced') && u.detail && (
                      <p
                        className="mt-1 text-[13px] leading-[20px]"
                        style={{ color: 'var(--fg-muted)' }}
                      >
                        {u.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

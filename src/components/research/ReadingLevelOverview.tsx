'use client';

import { useState } from 'react';
import type { ProtocolReport } from '@/lib/protocol-types';
import { SectionHeader } from './OverviewSection';

type Level = 'plain' | 'scientific';

const LEVELS: { id: Level; label: string }[] = [
  { id: 'plain', label: 'Plain English' },
  { id: 'scientific', label: 'Scientific' },
];

/**
 * Two-tone reading-level toggle:
 *   - plain      → uses extras.plainSummary + structured plain-language sections
 *   - scientific → uses science.summary + extras.mechanism + full findings
 */
export function ReadingLevelOverview({ report }: { report: ProtocolReport }) {
  const [level, setLevel] = useState<Level>('plain');

  const extras = report.extras;
  const sciSummary = report.science?.summary?.trim() ?? '';
  const findings = (report.science?.findings ?? [])
    .map((f) => ({
      title: (f.title ?? f.claim ?? '').trim(),
      detail: (f.detail ?? f.context ?? '').trim(),
      quality: f.quality,
    }))
    .filter((u) => u.title || u.detail);

  // Plain content: prefer extras.plainSummary; fallback to first sentences of summary
  const plainSummary = extras?.plainSummary?.trim()
    || sciSummary.replace(/\([^)]*\)/g, '').split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2).join(' ')
    || `${report.name ?? 'This compound'} is indexed in the Protocols.ai catalog. Detailed plain-English coverage is being prepared.`;

  const keyBenefits   = extras?.keyBenefits ?? [];
  const bestFor       = extras?.bestFor ?? [];
  const whoShouldAvoid = extras?.whoShouldAvoid ?? [];
  const whatToExpect  = extras?.whatToExpect ?? '';
  const mechanism     = extras?.mechanism?.trim() ?? '';
  const myths         = extras?.commonMyths ?? [];
  const sources       = extras?.sources ?? [];

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

        {level === 'plain' ? (
          <PlainView
            summary={plainSummary}
            keyBenefits={keyBenefits}
            bestFor={bestFor}
            whoShouldAvoid={whoShouldAvoid}
            whatToExpect={whatToExpect}
            myths={myths}
          />
        ) : (
          <ScientificView
            summary={sciSummary}
            mechanism={mechanism}
            findings={findings}
            sources={sources}
          />
        )}
      </div>
    </section>
  );
}

// ─── Plain English View ──────────────────────────────────────────────────────

function PlainView({
  summary, keyBenefits, bestFor, whoShouldAvoid, whatToExpect, myths,
}: {
  summary: string;
  keyBenefits: string[];
  bestFor: string[];
  whoShouldAvoid: string[];
  whatToExpect: string;
  myths: { myth: string; reality: string }[];
}) {
  return (
    <div>
      <span className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
        WHAT IT DOES
      </span>
      <p className="mt-3 max-w-[760px] whitespace-pre-line text-[15px] leading-[26px]" style={{ color: 'var(--fg-muted)' }}>
        {summary}
      </p>

      {keyBenefits.length > 0 && (
        <div className="mt-7">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            KEY BENEFITS
          </span>
          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {keyBenefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <span aria-hidden className="mt-[9px] h-[6px] w-[6px] flex-shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-[14px] leading-[22px]" style={{ color: 'var(--fg)' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bestFor.length > 0 && (
        <InfoBlock label="BEST FOR" tone="accent">
          <ul className="flex flex-col gap-2">
            {bestFor.map((b, i) => (
              <li key={i} className="text-[14px] leading-[22px]" style={{ color: 'var(--fg)' }}>
                • {b}
              </li>
            ))}
          </ul>
        </InfoBlock>
      )}

      {whatToExpect && (
        <InfoBlock label="WHAT TO EXPECT" tone="neutral">
          <p className="text-[14px] leading-[22px]" style={{ color: 'var(--fg)' }}>{whatToExpect}</p>
        </InfoBlock>
      )}

      {whoShouldAvoid.length > 0 && (
        <InfoBlock label="WHO SHOULD AVOID THIS" tone="warning">
          <ul className="flex flex-col gap-2">
            {whoShouldAvoid.map((w, i) => (
              <li key={i} className="text-[14px] leading-[22px]" style={{ color: 'var(--fg)' }}>• {w}</li>
            ))}
          </ul>
        </InfoBlock>
      )}

      {myths.length > 0 && (
        <div className="mt-7">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            MYTHS &amp; FACTS
          </span>
          <div className="mt-3 flex flex-col gap-3">
            {myths.map((m, i) => (
              <div key={i} className="rounded-[12px] p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--hair)' }}>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>
                  Myth: <span style={{ color: 'var(--fg-muted)', fontWeight: 400 }}>{m.myth}</span>
                </div>
                <div className="mt-1 text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Fact:</span> {m.reality}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scientific View ─────────────────────────────────────────────────────────

function ScientificView({
  summary, mechanism, findings, sources,
}: {
  summary: string;
  mechanism: string;
  findings: { title: string; detail: string; quality?: 'high' | 'medium' | 'low' }[];
  sources: string[];
}) {
  return (
    <div>
      {summary && (
        <>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            MECHANISM SUMMARY
          </span>
          <p className="mt-3 max-w-[760px] text-[15px] leading-[26px]" style={{ color: 'var(--fg-muted)' }}>
            {summary}
          </p>
        </>
      )}

      {mechanism && (
        <div className="mt-7">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            DETAILED MECHANISM
          </span>
          <p className="mt-3 max-w-[760px] text-[14px] leading-[24px]" style={{ color: 'var(--fg-muted)' }}>
            {mechanism}
          </p>
        </div>
      )}

      {findings.length > 0 && (
        <div className="mt-8">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            EFFECTS &amp; USES
          </span>
          <ul className="mt-4 flex flex-col gap-5">
            {findings.map((u, i) => (
              <li key={i} className="grid grid-cols-[8px_1fr] gap-4 pl-1">
                <span
                  className="mt-[7px] h-[8px] w-[8px] flex-shrink-0 rounded-full"
                  style={{
                    background:
                      u.quality === 'high' ? 'var(--accent)' :
                      u.quality === 'medium' ? '#fbbf24' :
                      'var(--fg-faint)',
                  }}
                  aria-hidden
                />
                <div>
                  {u.title && (
                    <div className="text-[14px] font-semibold tracking-[-0.1px]" style={{ color: 'var(--fg)' }}>
                      {u.title}
                    </div>
                  )}
                  {u.detail && (
                    <p className="mt-1 text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
                      {u.detail}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--hair)' }}>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            SOURCES DRAWN ON
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {sources.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[1.2px]"
                style={{
                  color: 'var(--fg-dim)',
                  border: '1px solid var(--hair-strong)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Info Block ─────────────────────────────────────────────────────

function InfoBlock({
  label, tone, children,
}: {
  label: string;
  tone: 'accent' | 'neutral' | 'warning';
  children: React.ReactNode;
}) {
  const accent = tone === 'accent' ? 'var(--accent)' : tone === 'warning' ? '#fb7185' : 'var(--fg-dim)';
  const bg     = tone === 'accent' ? 'rgba(6,214,160,0.04)' : tone === 'warning' ? 'rgba(251,113,133,0.04)' : 'rgba(255,255,255,0.02)';
  const border = tone === 'accent' ? 'rgba(6,214,160,0.2)' : tone === 'warning' ? 'rgba(251,113,133,0.18)' : 'var(--hair)';
  return (
    <div
      className="mt-5 rounded-[12px] p-4"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
        style={{ color: accent }}
      >
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

import type { ProtocolReport } from '@/lib/protocol-types';
import { SectionHeader } from './OverviewSection';

function qualityGrade(quality?: 'high' | 'medium' | 'low' | null): string {
  if (quality === 'high') return 'A';
  if (quality === 'medium') return 'B';
  if (quality === 'low') return 'C';
  return '—';
}

function qualityColor(quality?: 'high' | 'medium' | 'low' | null): string {
  if (quality === 'high') return 'var(--accent)';
  if (quality === 'medium') return '#fbbf24';
  if (quality === 'low') return '#fb7185';
  return 'var(--fg-dim)';
}

function studyTypeChipColor(studyType?: string | null): { bg: string; fg: string; border: string } {
  const t = (studyType ?? '').toLowerCase();
  if (t.includes('meta')) return { bg: 'rgba(6,214,160,0.12)', fg: 'var(--accent)', border: 'rgba(6,214,160,0.4)' };
  if (t.includes('rct') || t.includes('randomized')) return { bg: 'rgba(59,130,246,0.12)', fg: '#60a5fa', border: 'rgba(59,130,246,0.4)' };
  if (t.includes('observational') || t.includes('cohort') || t.includes('cross'))
    return { bg: 'rgba(148,163,184,0.12)', fg: 'var(--fg-dim)', border: 'var(--hair-strong)' };
  return { bg: 'rgba(148,163,184,0.1)', fg: 'var(--fg-dim)', border: 'var(--hair-strong)' };
}

export function EvidenceSection({ report }: { report: ProtocolReport }) {
  const findings = report.science?.findings ?? [];
  const studies = report.clinicalStudies ?? [];

  if (findings.length === 0 && studies.length === 0) {
    return (
      <section>
        <SectionHeader label="02 / EVIDENCE" title="Peer-reviewed studies" />
        <EmptyBlock text="Evidence data is pending for this compound. Generate via LLM fallback or browse seeded supplements." />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader label="02 / EVIDENCE" title="Peer-reviewed studies" />

      <style>{`
        .proto-finding-row {
          transition: background-color 140ms ease;
        }
        .proto-finding-row:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>

      <ul
        className="mt-6 divide-y"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
          borderRadius: 16,
          // @ts-expect-error CSS variable in divide-y emulation
          '--tw-divide-opacity': 1,
        }}
      >
        {findings.map((f, i) => {
          const q = f.quality as 'high' | 'medium' | 'low' | undefined;
          return (
            <li
              key={i}
              className="proto-finding-row flex items-start gap-4 px-6 py-4"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair)', position: 'relative' }}
            >
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: 3,
                  background: qualityColor(q),
                  borderRadius: '0 2px 2px 0',
                }}
              />
              <div className="flex-1 min-w-0">
                {f.citation ? (
                  <span
                    className="font-mono text-[10px] uppercase tracking-[1.4px]"
                    style={{ color: 'var(--fg-dim)' }}
                  >
                    {f.citation}
                  </span>
                ) : null}
                <h3
                  className="mt-1 text-[16px] font-semibold tracking-[-0.2px]"
                  style={{ color: 'var(--fg)' }}
                >
                  {f.title ?? f.claim ?? 'Finding'}
                </h3>
                {f.detail ? (
                  <p
                    className="mt-1 text-[13px] leading-[20px]"
                    style={{ color: 'var(--fg-muted)' }}
                  >
                    {f.detail}
                  </p>
                ) : null}
              </div>
              <span
                className="mt-1 inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 font-mono text-[11px] font-bold"
                style={{
                  color: qualityColor(q),
                  border: `1px solid ${qualityColor(q)}`,
                  background: 'transparent',
                }}
              >
                {qualityGrade(q)}
              </span>
            </li>
          );
        })}

        {studies.slice(0, 5).map((s) => {
          const q = s.quality as 'high' | 'medium' | 'low' | undefined;
          const chip = studyTypeChipColor(s.studyType);
          return (
            <li
              key={s.id}
              className="proto-finding-row flex items-start gap-4 px-6 py-4"
              style={{ borderTop: '1px solid var(--hair)', position: 'relative' }}
            >
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: 3,
                  background: qualityColor(q),
                  borderRadius: '0 2px 2px 0',
                }}
              />
              <div className="flex-1 min-w-0">
                <span
                  className="font-mono text-[10px] uppercase tracking-[1.4px]"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  {s.pmid ? `PMID ${s.pmid}` : s.category.toUpperCase()}
                  {s.year ? ` · ${s.year}` : ''}
                  {s.sampleSize ? ` · n=${s.sampleSize}` : ''}
                </span>
                {s.studyType ? (
                  <span
                    className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[1px]"
                    style={{
                      background: chip.bg,
                      color: chip.fg,
                      border: `1px solid ${chip.border}`,
                    }}
                  >
                    {s.studyType}
                  </span>
                ) : null}
                <h3
                  className="mt-1 text-[15px] font-semibold tracking-[-0.2px]"
                  style={{ color: 'var(--fg)' }}
                >
                  {s.title}
                </h3>
                {s.outcome ? (
                  <p className="mt-1 text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
                    {s.outcome}
                  </p>
                ) : null}
              </div>
              <span
                className="mt-1 inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 font-mono text-[11px] font-bold"
                style={{
                  color: qualityColor(q),
                  border: `1px solid ${qualityColor(q)}`,
                }}
              >
                {qualityGrade(q)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div
      className="mt-6 rounded-[16px] p-8 text-center"
      style={{
        background: 'var(--surface)',
        border: '1px dashed var(--hair-strong)',
      }}
    >
      <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
        {text}
      </p>
    </div>
  );
}

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
        {findings.map((f, i) => (
          <li key={i} className="flex items-start gap-4 px-6 py-4" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair)' }}>
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
                color: qualityColor(f.quality as 'high' | 'medium' | 'low' | undefined),
                border: `1px solid ${qualityColor(f.quality as 'high' | 'medium' | 'low' | undefined)}`,
                background: 'transparent',
              }}
            >
              {qualityGrade(f.quality as 'high' | 'medium' | 'low' | undefined)}
            </span>
          </li>
        ))}

        {studies.slice(0, 5).map((s) => (
          <li key={s.id} className="flex items-start gap-4 px-6 py-4" style={{ borderTop: '1px solid var(--hair)' }}>
            <div className="flex-1 min-w-0">
              <span
                className="font-mono text-[10px] uppercase tracking-[1.4px]"
                style={{ color: 'var(--fg-dim)' }}
              >
                {s.pmid ? `PMID ${s.pmid}` : s.category.toUpperCase()}
                {s.year ? ` · ${s.year}` : ''}
                {s.sampleSize ? ` · n=${s.sampleSize}` : ''}
                {s.studyType ? ` · ${s.studyType}` : ''}
              </span>
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
                color: qualityColor(s.quality as 'high' | 'medium' | 'low' | undefined),
                border: `1px solid ${qualityColor(s.quality as 'high' | 'medium' | 'low' | undefined)}`,
              }}
            >
              {qualityGrade(s.quality as 'high' | 'medium' | 'low' | undefined)}
            </span>
          </li>
        ))}
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

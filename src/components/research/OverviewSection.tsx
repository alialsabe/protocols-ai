import type { ProtocolReport } from '@/lib/protocol-types';

export function OverviewSection({ report }: { report: ProtocolReport }) {
  const summary =
    report.science?.summary ||
    report.social?.transcriptSummary ||
    `${report.name ?? 'This compound'} is indexed in the Protocols.ai catalog. Detailed mechanism and citation data is pending.`;

  // Pull 3-5 "what it does" claims from findings titles when available
  const bullets = (report.science?.findings ?? [])
    .slice(0, 5)
    .map((f) => f.title ?? f.claim ?? f.detail ?? '')
    .filter(Boolean);

  return (
    <section>
      <SectionHeader label="01 / OVERVIEW" title="What this compound does" />

      <div
        className="mt-6 rounded-[16px] p-8"
        style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
      >
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          MECHANISM
        </span>
        <p
          className="mt-3 max-w-[760px] text-[15px] leading-[26px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          {summary}
        </p>

        {bullets.length > 0 ? (
          <div className="mt-8">
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              WHAT IT DOES
            </span>
            <ul className="mt-4 flex flex-col gap-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px]" style={{ color: 'var(--fg)' }}>
                  <span className="mt-[9px] h-px w-3 flex-shrink-0" style={{ background: 'var(--accent)' }} aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <header className="flex items-baseline justify-between">
      <div>
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          {label}
        </span>
        <h2
          className="mt-2 text-[22px] font-extrabold tracking-[-0.4px]"
          style={{ color: 'var(--fg)' }}
        >
          {title}
        </h2>
      </div>
    </header>
  );
}

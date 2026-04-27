import type { ProtocolReport } from '@/lib/protocol-types';

export function OverviewSection({ report }: { report: ProtocolReport }) {
  const summary =
    report.science?.summary ||
    `${report.name ?? 'This compound'} is indexed in the Materia catalog. Peer-reviewed mechanism and citation data is pending for this entry.`;

  // Full "effects & uses" list — pull titles + detail from findings.
  const uses = (report.science?.findings ?? [])
    .map((f) => ({
      title: (f.title ?? f.claim ?? '').trim(),
      detail: (f.detail ?? f.context ?? '').trim(),
      quality: f.quality,
    }))
    .filter((u) => u.title || u.detail);

  // Short "at a glance" chips derived from finding titles.
  const chips = uses.slice(0, 6).map((u) => u.title).filter(Boolean);

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

        {uses.length > 0 && (
          <div className="mt-8">
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              EFFECTS &amp; USES
            </span>
            <ul className="mt-4 flex flex-col gap-5">
              {uses.map((u, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[8px_1fr] gap-4 pl-1"
                >
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
                    {u.detail && (
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

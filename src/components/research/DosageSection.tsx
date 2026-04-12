import type { ProtocolReport } from '@/lib/protocol-types';
import { SectionHeader } from './OverviewSection';

export function DosageSection({ report }: { report: ProtocolReport }) {
  const dosage = report.dosage;
  const schedule = report.schedule?.[0];

  return (
    <section>
      <SectionHeader label="03 / DOSAGE" title="How much, when" />

      <div
        className="mt-6 grid gap-px"
        style={{
          background: 'var(--hair)',
          border: '1px solid var(--hair)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div className="grid md:grid-cols-2">
          <div className="p-8" style={{ background: 'var(--surface)' }}>
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              MAINTENANCE
            </span>
            <p className="mt-3 font-mono text-[24px] font-bold" style={{ color: 'var(--fg)' }}>
              {dosage?.maintenance ?? '—'}
            </p>
            {dosage?.loading ? (
              <>
                <span
                  className="mt-6 inline-block font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  LOADING PROTOCOL
                </span>
                <p className="mt-2 font-mono text-[15px]" style={{ color: 'var(--fg-muted)' }}>
                  {dosage.loading}
                </p>
              </>
            ) : null}
            {dosage?.formula ? (
              <p className="mt-6 text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
                {dosage.formula}
              </p>
            ) : null}
          </div>

          <div className="p-8" style={{ background: 'var(--surface)' }}>
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              TIMING
            </span>
            <p className="mt-3 font-mono text-[15px]" style={{ color: 'var(--fg)' }}>
              {schedule?.title ?? '—'}
            </p>
            {schedule?.context ? (
              <p className="mt-3 text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
                {schedule.context}
              </p>
            ) : null}
            {schedule?.caution ? (
              <div
                className="mt-5 flex items-start gap-3 rounded-md px-3 py-2.5"
                style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.2)',
                }}
              >
                <span className="font-mono text-[11px]" style={{ color: '#fbbf24' }}>
                  ⚠ {schedule.caution}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {report.commerce?.affiliateLink ? (
          <div className="p-5" style={{ background: 'var(--surface-raise)' }}>
            <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
              <div>
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                  style={{ color: 'var(--accent)' }}
                >
                  ★ RECOMMENDED
                </span>
                <p className="mt-1 text-[14px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {report.commerce.product}
                </p>
                <p className="font-mono text-[11px]" style={{ color: 'var(--fg-dim)' }}>
                  {report.commerce.retailer} · {report.commerce.price}
                </p>
              </div>
              <a
                href={report.commerce.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                style={{ background: 'var(--accent)', color: '#09090b' }}
              >
                Buy →
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

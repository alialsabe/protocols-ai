import Link from 'next/link';
import { lookupSupplement } from '@/lib/supplement-lookup';
import { getTrendingPayload } from '@/components/v2/trending/types';

/**
 * Quick-glance hero — replaces the molecule animation.
 *
 * Shows a real supplement profile (top-trending, or fallback to creatine) so
 * a first-time visitor immediately understands what this site does: each
 * supplement has a dense, sourced report. No Three.js, no speculation.
 */
export async function QuickGlanceHero() {
  const trending = await getTrendingPayload().catch(() => null);
  const primarySlug =
    trending?.mostPopular?.[0]?.slug ?? 'creatine-monohydrate';

  // Lookup handles slug aliases and falls back through tokens; returns a full
  // ProtocolReport that already normalizes science/dosage/etc.
  const report =
    (await lookupSupplement(primarySlug).catch(() => null)) ??
    (await lookupSupplement('creatine').catch(() => null));

  if (!report) return <QuickGlanceFallback />;

  const name = report.name ?? 'Supplement';
  const slug = primarySlug;
  const category = report.supplementTypes?.[0] ?? '';
  const summary =
    report.science?.summary?.trim() ||
    'Indexed compound in the Materia catalog with peer-reviewed citations.';

  const topFindings = (report.science?.findings ?? [])
    .map((f) => (f.title ?? f.claim ?? '').trim())
    .filter(Boolean)
    .slice(0, 3);

  const dose = report.dosage?.maintenance ?? '—';
  const evidenceCount = report.science?.findings?.length ?? 0;

  return (
    <section
      className="mx-auto max-w-[1200px] px-5 pt-6 pb-6 md:px-10 md:pt-10 md:pb-8 lg:px-16"
      aria-labelledby="quickglance-heading"
    >
      <div
        className="overflow-hidden rounded-[20px]"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
        }}
      >
        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          {/* Left: the profile card */}
          <div
            className="flex flex-col gap-5 p-7 md:p-10"
            style={{ borderRight: '1px solid var(--hair)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                style={{ color: 'var(--accent)' }}
              >
                TODAY'S TOP COMPOUND
              </span>
              {category && (
                <span
                  className="font-mono text-[10px] uppercase tracking-[1.2px]"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  · {category.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <h1
              id="quickglance-heading"
              className="text-[34px] font-extrabold leading-[1.05] tracking-[-0.8px] md:text-[44px]"
              style={{ color: 'var(--fg)' }}
            >
              {name}
            </h1>

            <p
              className="text-[15px] leading-[24px] md:text-[16px] md:leading-[26px]"
              style={{ color: 'var(--fg-muted)' }}
            >
              {summary}
            </p>

            <div className="flex gap-3 pt-1">
              <Link
                href={`/research/${slug}`}
                className="inline-flex min-h-[44px] items-center px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
                style={{ background: 'var(--accent)', color: '#000' }}
              >
                View full report →
              </Link>
              <Link
                href="/routine"
                className="inline-flex min-h-[44px] items-center px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--hair)',
                  color: 'var(--fg)',
                }}
              >
                Add to routine
              </Link>
            </div>
          </div>

          {/* Right: at-a-glance facts grid */}
          <div className="flex flex-col">
            <div
              className="grid grid-cols-2"
              style={{ borderBottom: '1px solid var(--hair)' }}
            >
              <FactCell label="Maintenance dose" value={dose} />
              <FactCell
                label="Findings indexed"
                value={String(evidenceCount)}
                withBorderLeft
              />
            </div>

            <div className="flex flex-col gap-3 p-7 md:p-10">
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                style={{ color: 'var(--fg-dim)' }}
              >
                EFFECTS AT A GLANCE
              </span>
              {topFindings.length === 0 ? (
                <span
                  className="text-[13px]"
                  style={{ color: 'var(--fg-muted)' }}
                >
                  Evidence still being indexed.
                </span>
              ) : (
                <ul className="flex flex-col gap-2">
                  {topFindings.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-[14px] leading-[22px]"
                      style={{ color: 'var(--fg)' }}
                    >
                      <span
                        className="mt-[8px] h-[6px] w-[6px] flex-shrink-0 rounded-full"
                        style={{ background: 'var(--accent)' }}
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FactCell({
  label,
  value,
  withBorderLeft,
}: {
  label: string;
  value: string;
  withBorderLeft?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 px-7 py-5 md:px-10"
      style={{
        borderLeft: withBorderLeft ? '1px solid var(--hair)' : undefined,
      }}
    >
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--fg-dim)' }}
      >
        {label}
      </span>
      <span
        className="text-[18px] font-extrabold tracking-[-0.3px]"
        style={{ color: 'var(--fg)' }}
      >
        {value}
      </span>
    </div>
  );
}

export function QuickGlanceFallback() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pt-6 pb-6 md:px-10 md:pt-10 md:pb-8 lg:px-16">
      <div
        className="rounded-[20px] p-10"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
          color: 'var(--fg-dim)',
        }}
      >
        <span className="font-mono text-[11px] uppercase tracking-[1.4px]">
          Loading today's compound…
        </span>
      </div>
    </section>
  );
}

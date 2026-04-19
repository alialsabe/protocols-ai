import Link from 'next/link';
import type { ProtocolReport } from '@/lib/protocol-types';
import { SectionHeader } from './OverviewSection';

/** Convert a supplement display name to a URL slug (best-effort). */
function nameToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const STRENGTH_LABEL: Record<string, string> = {
  strong: 'STRONG SYNERGY',
  common: 'COMMONLY STACKED',
};

const CONFLICT_COLOR: Record<string, string> = {
  high: '#fb7185',
  moderate: '#fbbf24',
  low: '#38bdf8',
};

export function StackSection({
  report,
  currentSlug,
}: {
  report: ProtocolReport;
  currentSlug: string;
}) {
  const companions = report.companionSuggestions ?? [];
  const conflicts = (report.conflicts ?? []).filter(
    (c) => c.conflictType !== 'synergistic',
  );

  if (companions.length === 0 && conflicts.length === 0) return null;

  return (
    <section>
      <SectionHeader label="05 / STACK GUIDE" title="How to stack this compound" />

      {companions.length > 0 && (
        <div
          className="mt-6 overflow-hidden rounded-[16px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
        >
          <div
            className="px-6 py-3"
            style={{ borderBottom: '1px solid var(--hair)' }}
          >
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              Pairs well with
            </span>
          </div>
          <ul>
            {companions.map((c, i) => {
              const slug = nameToSlug(c.supplement);
              return (
                <li
                  key={i}
                  className="flex items-start gap-4 px-6 py-4"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair)' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/research/${slug}`}
                        className="text-[15px] font-semibold tracking-[-0.2px] transition-colors hover:text-white"
                        style={{ color: 'var(--fg)', textDecoration: 'none' }}
                      >
                        {c.supplement}
                      </Link>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[1.2px]"
                        style={{
                          color: c.strength === 'strong' ? 'var(--accent)' : 'var(--fg-dim)',
                          border: `1px solid ${c.strength === 'strong' ? 'var(--accent)' : 'var(--hair-strong)'}`,
                        }}
                      >
                        {STRENGTH_LABEL[c.strength] ?? c.strength}
                      </span>
                    </div>
                    <p
                      className="mt-1 text-[13px] leading-[20px]"
                      style={{ color: 'var(--fg-muted)' }}
                    >
                      {c.why}
                    </p>
                  </div>
                  <Link
                    href={`/research/${slug}`}
                    className="mt-1 flex-shrink-0 font-mono text-[13px] transition-colors hover:text-white"
                    style={{ color: 'var(--fg-faint)', textDecoration: 'none' }}
                    aria-label={`Research ${c.supplement}`}
                  >
                    →
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {conflicts.length > 0 && (
        <div
          className="mt-4 overflow-hidden rounded-[16px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
        >
          <div
            className="px-6 py-3"
            style={{ borderBottom: '1px solid var(--hair)' }}
          >
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              Spacing &amp; caution
            </span>
          </div>
          <ul>
            {conflicts.map((c, i) => {
              const other = c.supplementA === currentSlug ? c.supplementB : c.supplementA;
              const otherSlug = nameToSlug(other);
              const color = CONFLICT_COLOR[c.severity] ?? 'var(--fg-dim)';
              return (
                <li
                  key={i}
                  className="grid grid-cols-[4px_1fr] gap-5 px-6 py-4"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair)' }}
                >
                  <span className="block" style={{ background: color }} aria-hidden />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/research/${otherSlug}`}
                        className="text-[14px] font-semibold tracking-[-0.1px] transition-colors hover:text-white"
                        style={{ color: 'var(--fg)', textDecoration: 'none' }}
                      >
                        {other}
                      </Link>
                      {c.minSpacingHours ? (
                        <span
                          className="font-mono text-[10px] font-bold uppercase tracking-[1.2px]"
                          style={{ color }}
                        >
                          {c.minSpacingHours}h spacing
                        </span>
                      ) : null}
                    </div>
                    <p
                      className="mt-1 text-[13px] leading-[20px]"
                      style={{ color: 'var(--fg-muted)' }}
                    >
                      {c.mechanism}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

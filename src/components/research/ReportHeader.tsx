import Link from 'next/link';
import type { ProtocolReport } from '@/lib/protocol-types';
import { getTimeToFeelIt } from '@/lib/stack-utils';

export function ReportHeader({ report }: { report: ProtocolReport }) {
  const name = report.name ?? 'Unknown supplement';
  const family = report.supplementTypes?.[0] ?? report.baseCompound ?? 'compound';
  const timeToFeel = getTimeToFeelIt(report) ?? '—';
  const popRank =
    typeof report.popularityScore === 'number' ? `#${Math.max(1, Math.round(100 - report.popularityScore))}` : '—';

  return (
    <header className="mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 flex-1">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          REPORT · {popRank} / 279
        </span>
        <h1
          className="mt-3 text-[40px] font-extrabold leading-[1.05] tracking-[-1.2px]"
          style={{ color: 'var(--fg)' }}
        >
          {name}
        </h1>
        <p
          className="mt-3 font-mono text-[12px] uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          FAMILY {family}
          <span className="mx-2" style={{ color: 'var(--fg-faint)' }}>·</span>
          TIME-TO-EFFECT {timeToFeel.replace(/most users notice effects in |typically |long-term.*?;\s*/i, '')}
        </p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-start gap-3 md:items-end">
        <div className="flex gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#09090b' }}
          >
            + Add to stack
          </button>
          <Link
            href={`/compare?add=${encodeURIComponent(report.name ?? '')}`}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors hover:text-white"
            style={{
              border: '1px solid var(--hair-strong)',
              color: 'var(--fg-muted)',
            }}
          >
            Compare
          </Link>
        </div>
        <button
          type="button"
          className="font-mono text-[11px] uppercase tracking-[1.4px] transition-colors hover:text-white"
          style={{ color: 'var(--fg-dim)' }}
        >
          Share report ⌘S
        </button>
      </div>
    </header>
  );
}

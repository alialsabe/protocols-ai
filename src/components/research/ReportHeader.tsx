import Image from 'next/image';
import type { ProtocolReport } from '@/lib/protocol-types';
import { getTimeToFeelIt } from '@/lib/stack-utils';
import { getSupplementImage } from '@/lib/supplement-image';
import { ReportActions } from './ReportActions';

export function ReportHeader({ report, slug }: { report: ProtocolReport; slug?: string }) {
  const name = report.name ?? 'Unknown supplement';
  const family = report.supplementTypes?.[0] ?? report.baseCompound ?? 'compound';
  const timeToFeel = getTimeToFeelIt(report) ?? '—';
  const popRank =
    typeof report.popularityScore === 'number' ? `#${Math.max(1, Math.round(100 - report.popularityScore))}` : '—';

  const imgSrc = slug ? getSupplementImage(slug) : null;
  const familyBadge = family.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'CMPD';

  const contentBody = (
    <>
      <div className="min-w-0 flex-1">
        <span
          className="inline-flex items-baseline gap-2 font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          REPORT
          <span style={{ color: 'var(--fg-faint)' }}>·</span>
          <span
            className="text-[18px] font-extrabold tracking-[-0.4px]"
            style={{ color: 'var(--accent)' }}
          >
            {popRank}
          </span>
          <span style={{ color: 'var(--fg-faint)' }}>/ 279</span>
        </span>
        <div className="mt-3 flex items-center gap-4">
          <span
            aria-hidden
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold tracking-[0.5px]"
            style={{
              border: '1px solid var(--hair-strong)',
              background: 'var(--surface)',
              color: 'var(--accent)',
              boxShadow: '0 0 20px rgba(6,214,160,0.15)',
            }}
          >
            {familyBadge}
          </span>
          <h1
            className="text-[40px] font-extrabold leading-[1.05] tracking-[-1.2px]"
            style={{
              color: 'var(--fg)',
              ...(slug ? { viewTransitionName: `supp-name-${slug}` } : {}),
            }}
          >
            {name}
          </h1>
        </div>
        <p
          className="mt-3 font-mono text-[12px] uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          FAMILY {family}
          <span className="mx-2" style={{ color: 'var(--fg-faint)' }}>·</span>
          TIME-TO-EFFECT {timeToFeel.replace(/most users notice effects in |typically |long-term.*?;\s*/i, '')}
        </p>
      </div>

      <ReportActions name={name} />
    </>
  );

  if (!imgSrc) {
    return (
      <header className="mt-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        {contentBody}
      </header>
    );
  }

  return (
    <header
      className="mt-10"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        minHeight: 200,
        border: '1px solid var(--hair)',
      }}
    >
      <Image
        src={imgSrc}
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 1200px"
        style={{ objectFit: 'cover', opacity: 0.25 }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, var(--bg) 40%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      <div
        className="flex flex-col gap-6 p-8 md:flex-row md:items-start md:justify-between md:p-10"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {contentBody}
      </div>
    </header>
  );
}

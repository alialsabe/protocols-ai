import {
  formatUpdatedTime,
  getTrendingPayload,
  isStale,
} from './types';
import { TrendingRowsClient } from './TrendingRowsClient';

function HeaderBar({
  updatedAt,
  stale,
}: {
  updatedAt: string;
  stale: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 md:px-6"
      style={{ borderBottom: '1px solid var(--hair-strong)' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="block h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent-glow)' }}
          aria-hidden
        />
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg)' }}
        >
          Trending / 7D
        </span>
      </div>
      <div className="flex items-center gap-3">
        {stale && (
          <span
            className="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
            style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--severity-mid)' }}
          >
            Stale
          </span>
        )}
        <span
          className="font-mono text-[10px] uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          Updated {updatedAt}
        </span>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div
      className="flex h-32 items-center justify-center"
      style={{ borderTop: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}
    >
      <span className="font-mono text-[12px]" style={{ color: 'var(--fg-dim)' }}>
        // trending offline · refresh in 6h
      </span>
    </div>
  );
}

export async function TrendingSection() {
  const data = await getTrendingPayload();
  if (!data || data.trending.length === 0) {
    return (
      <div className="proto-scan-ambient">
        <HeaderBar updatedAt="--:--" stale={false} />
        <ErrorState />
      </div>
    );
  }

  const stale = isStale(data.generatedAt);
  const updatedAt = formatUpdatedTime(data.generatedAt);
  const items = data.trending.slice(0, 8);

  return (
    <div className="proto-scan-ambient" style={{ borderBottom: '1px solid var(--hair)' }}>
      <HeaderBar updatedAt={updatedAt} stale={stale} />
      <TrendingRowsClient items={items} generatedAt={data.generatedAt} />
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="proto-scan-ambient" style={{ borderBottom: '1px solid var(--hair)' }}>
      <HeaderBar updatedAt="--:--" stale={false} />
      <ol className="flex flex-col" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[56px_1fr_88px_92px_180px] items-center gap-4 px-6 py-3.5"
            style={{ borderTop: '1px solid var(--hair)' }}
          >
            <span className="font-mono text-[12px]" style={{ color: 'var(--fg-faint)' }}>
              {(i + 1).toString().padStart(2, '0')}
            </span>
            <span className="font-mono text-[13px]" style={{ color: 'var(--fg-faint)' }}>
              ————————
            </span>
            <span className="font-mono text-[13px]" style={{ color: 'var(--fg-faint)' }}>——</span>
            <span className="font-mono text-[13px]" style={{ color: 'var(--fg-faint)' }}>——</span>
            <span className="font-mono text-[10px]" style={{ color: 'var(--fg-faint)' }}>—————</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

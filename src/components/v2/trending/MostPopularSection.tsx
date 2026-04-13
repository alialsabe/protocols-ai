import Link from 'next/link';
import {
  formatCompact,
  formatUpdatedTime,
  getTrendingPayload,
  isStale,
  type MostPopularItem,
} from './types';

function Cell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="font-mono text-[9px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--fg-dim)' }}
      >
        {label}
      </span>
      <span
        className="font-mono text-[12px] tabular-nums"
        style={{ color: 'var(--fg-muted)' }}
      >
        {value}
      </span>
    </div>
  );
}

function Tile({ item, rank }: { item: MostPopularItem; rank: number }) {
  return (
    <Link
      href={`/research/${item.slug}`}
      className="group flex flex-col gap-4 px-5 py-5 transition-colors md:px-6 md:py-6"
      style={{ borderTop: '1px solid var(--hair)', borderLeft: '1px solid var(--hair)' }}
      aria-label={`Rank ${rank}: ${item.name}, score ${item.score} of 100`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
            aria-hidden
          >
            #{rank.toString().padStart(2, '0')}
          </span>
          <span
            className="truncate text-[15px] font-extrabold uppercase tracking-[-0.2px] transition-colors group-hover:text-white md:text-[16px]"
            style={{ color: 'var(--fg)' }}
          >
            {item.name}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            Score
          </span>
          <span
            className="font-mono text-[32px] leading-none tabular-nums md:text-[36px]"
            style={{ color: 'var(--accent)' }}
            aria-label={`composite score ${item.score} out of 100`}
          >
            {item.score}
          </span>
        </div>
      </div>

      <div
        className="h-px w-full"
        style={{ background: 'var(--hair)' }}
        aria-hidden
      />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
        <Cell label="YT Views" value={formatCompact(item.ytViews)} />
        <Cell label="YT Vids" value={formatCompact(item.ytVideoCount)} />
        <Cell label="Reddit" value={formatCompact(item.redditPosts)} />
        <Cell
          label="Reviews"
          value={item.amazonReviews == null ? '—' : formatCompact(item.amazonReviews)}
        />
      </div>
    </Link>
  );
}

function HeaderBar({ updatedAt, stale }: { updatedAt: string; stale: boolean }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 md:px-6"
      style={{ borderBottom: '1px solid var(--hair-strong)' }}
    >
      <div className="flex items-center gap-3">
        <span
          className="block h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--accent)' }}
          aria-hidden
        />
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg)' }}
        >
          Most Popular / All Time
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
          Sync {updatedAt}
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
        // popularity offline · refresh in 6h
      </span>
    </div>
  );
}

export async function MostPopularSection() {
  const data = await getTrendingPayload();
  if (!data || data.mostPopular.length === 0) {
    return (
      <div>
        <HeaderBar updatedAt="--:--" stale={false} />
        <ErrorState />
      </div>
    );
  }

  const stale = isStale(data.generatedAt);
  const updatedAt = formatUpdatedTime(data.generatedAt);
  const items = data.mostPopular.slice(0, 6);

  return (
    <div>
      <HeaderBar updatedAt={updatedAt} stale={stale} />
      <ol
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{ borderRight: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}
        aria-label="Most popular supplements, all time"
      >
        {items.map((item, i) => (
          <li key={item.slug} className="contents">
            <Tile item={item} rank={i + 1} />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function MostPopularSkeleton() {
  return (
    <div>
      <HeaderBar updatedAt="--:--" stale={false} />
      <ol
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{ borderRight: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}
        aria-hidden
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex flex-col gap-4 px-6 py-6"
            style={{ borderTop: '1px solid var(--hair)', borderLeft: '1px solid var(--hair)' }}
          >
            <div className="flex items-start justify-between">
              <span className="font-mono text-[15px]" style={{ color: 'var(--fg-faint)' }}>
                ————————
              </span>
              <span className="font-mono text-[32px]" style={{ color: 'var(--fg-faint)' }}>
                ——
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((__, j) => (
                <span key={j} className="font-mono text-[12px]" style={{ color: 'var(--fg-faint)' }}>
                  ——
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

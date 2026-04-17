'use client';

import Link from 'next/link';
import { type TrendingItem } from './types';
import { useTrendingDiff } from './TrendingDiff';

function formatSources(sources: string[]): string {
  return sources
    .slice(0, 2)
    .map((s) => s.replace(/^r\//, 'R/').toUpperCase())
    .join(' · ');
}

function DeltaCell({ delta, pulse }: { delta: number; pulse: boolean }) {
  const positive = delta >= 0;
  const glyph = positive ? '▲' : '▼';
  const sign = positive ? '+' : '';
  return (
    <span
      className={`font-mono text-[12px] tabular-nums ${pulse ? 'proto-pulse' : ''}`}
      style={{ color: positive ? 'var(--severity-low)' : 'var(--severity-high)' }}
      aria-label={`${positive ? 'up' : 'down'} ${Math.abs(delta)} percent week over week`}
    >
      {glyph} {sign}{delta}%
    </span>
  );
}

function Row({ item, rank, pulse }: { item: TrendingItem; rank: number; pulse: boolean }) {
  return (
    <Link
      href={`/research/${item.slug}`}
      className="group grid grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-3 transition-colors md:grid-cols-[56px_1fr_88px_92px_180px] md:gap-4 md:px-6 md:py-3.5"
      style={{ borderTop: '1px solid var(--hair)' }}
      aria-label={`Rank ${rank}: ${item.name}, ${item.mentionCount} mentions`}
    >
      <span
        className="font-mono text-[12px] tabular-nums"
        style={{ color: 'var(--fg-faint)' }}
        aria-hidden
      >
        {rank.toString().padStart(2, '0')}
      </span>
      <span
        className="truncate text-[13px] font-semibold uppercase tracking-[-0.1px] transition-colors group-hover:text-white md:text-[14px]"
        style={{ color: 'var(--fg)' }}
      >
        {item.name}
      </span>
      <span
        className="hidden font-mono text-[13px] tabular-nums md:inline"
        style={{ color: 'var(--fg-muted)' }}
        aria-label={`${item.mentionCount} mentions`}
      >
        {item.mentionCount}
      </span>
      <span className="hidden md:inline">
        <DeltaCell delta={item.deltaWeek} pulse={pulse} />
      </span>
      <span
        className="col-span-1 truncate text-right font-mono text-[10px] uppercase tracking-[1.2px] md:text-left"
        style={{ color: 'var(--fg-dim)' }}
        title={item.sources.join(', ')}
      >
        {formatSources(item.sources)}
      </span>
      <span className="col-span-3 -mt-1 flex items-center gap-3 font-mono text-[11px] tabular-nums md:hidden">
        <span style={{ color: 'var(--fg-muted)' }}>{item.mentionCount} mentions</span>
        <span style={{ color: 'var(--fg-dim)' }}>·</span>
        <DeltaCell delta={item.deltaWeek} pulse={pulse} />
      </span>
    </Link>
  );
}

export function TrendingRowsClient({
  items,
  generatedAt,
}: {
  items: TrendingItem[];
  generatedAt: string;
}) {
  const changed = useTrendingDiff(
    items.map((it) => ({ slug: it.slug, deltaWeek: it.deltaWeek })),
    generatedAt,
  );

  return (
    <ol className="flex flex-col" aria-label="Trending supplements, last 7 days">
      {items.map((item, i) => (
        <li key={item.slug} className="proto-row">
          <Row item={item} rank={i + 1} pulse={changed.has(item.slug)} />
        </li>
      ))}
    </ol>
  );
}

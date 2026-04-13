'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CategoryFilter } from '@/components/v2/CategoryFilter';

interface Supplement {
  slug: string;
  name: string;
  category: string | null;
  popularityScore: number;
}

function HeaderBar({ count }: { count: number }) {
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
      <span
        className="font-mono text-[10px] uppercase tracking-[1.4px]"
        style={{ color: 'var(--fg-dim)' }}
      >
        {count} shown
      </span>
    </div>
  );
}

function Tile({ item, rank }: { item: Supplement; rank: number }) {
  return (
    <Link
      href={`/research/${encodeURIComponent(item.slug)}`}
      className="group flex flex-col gap-4 px-5 py-5 transition-colors md:px-6 md:py-6"
      style={{ borderTop: '1px solid var(--hair)', borderLeft: '1px solid var(--hair)' }}
      aria-label={`Rank ${rank}: ${item.name}, popularity ${item.popularityScore}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
            aria-hidden
          >
            #{rank.toString().padStart(2, '0')}
            {item.category ? ` · ${item.category}` : ''}
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
          >
            {item.popularityScore}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function MostPopularFilterable() {
  const [all, setAll] = useState<Supplement[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/supplements')
      .then((r) => r.json())
      .then((data: { supplements: Supplement[] }) => {
        setAll(data.supplements ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of all) if (s.category) set.add(s.category);
    return Array.from(set).sort();
  }, [all]);

  const visible = useMemo(() => {
    const filtered =
      selected === null ? all : all.filter((s) => s.category === selected);
    return [...filtered]
      .sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0))
      .slice(0, 12);
  }, [all, selected]);

  return (
    <div>
      <HeaderBar count={visible.length} />
      <ol
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        style={{ borderRight: '1px solid var(--hair)', borderBottom: '1px solid var(--hair)' }}
        aria-label="Most popular supplements, all time"
      >
        {visible.map((item, i) => (
          <li key={item.slug} className="contents">
            <Tile item={item} rank={i + 1} />
          </li>
        ))}
        {loaded && visible.length === 0 && (
          <li
            className="col-span-full flex h-32 items-center justify-center"
            style={{ borderTop: '1px solid var(--hair)' }}
          >
            <span className="font-mono text-[12px]" style={{ color: 'var(--fg-dim)' }}>
              // no supplements in this category
            </span>
          </li>
        )}
      </ol>

      {categories.length > 0 && (
        <div className="mt-4 px-4 md:px-6">
          <CategoryFilter
            categories={categories}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      )}
    </div>
  );
}

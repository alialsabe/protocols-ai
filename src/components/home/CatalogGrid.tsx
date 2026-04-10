"use client";
import React from 'react';
import Link from 'next/link';
import { T, tagColors, getSupplementImage, getCategoryIcon } from '@/lib/design-tokens';

type CatalogItem = {
  slug: string;
  name: string;
  baseCompound?: string;
  specificForm?: string;
  tags: { tag: string; tagType: string }[];
  supplementTypes: string[];
  studyCount: number;
};

function CatalogCard({ item, index }: { item: CatalogItem; index: number }) {
  const imgSrc = getSupplementImage(item.name);
  const topTags = item.tags.slice(0, 2);
  const evidenceWidth = Math.min(Math.round((item.studyCount / 50) * 100), 100);
  const delay = `${80 + index * 40}ms`;

  return (
    <Link
      href={`/supplement/${encodeURIComponent(item.name)}`}
      className="group relative cursor-pointer block"
      style={{ opacity: 0, animation: `proto-fade-up 480ms var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)) ${delay} forwards` }}
    >
      {/* Spotlight border */}
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${T.accentGlow}, transparent 60%)` }}
      />
      <div
        className="relative rounded-2xl p-5 transition-transform duration-300 group-hover:-translate-y-1 h-full flex flex-col"
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Icon / Image */}
        <div
          className="mb-4 flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
          style={{
            width: 48, height: 48,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${T.border}`,
            overflow: 'hidden',
          }}
        >
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(0.85) brightness(0.9)' }}
              loading="lazy"
            />
          ) : (
            <span className="text-xl" role="img" aria-hidden>
              {getCategoryIcon(item.supplementTypes)}
            </span>
          )}
        </div>

        {/* Name */}
        <p className="text-sm font-bold leading-snug mb-2" style={{ color: T.text, letterSpacing: '-0.2px' }}>
          {item.name}
        </p>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap mb-3">
          {topTags.map((t, i) => {
            const s = tagColors(t.tag, t.tagType);
            return (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-[3px] rounded-md"
                style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
              >
                {t.tag}
              </span>
            );
          })}
        </div>

        {/* Evidence bar */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono" style={{ color: T.textDim }}>Evidence</span>
            <span className="text-[10px] font-mono font-semibold" style={{ color: T.accent }}>
              {item.studyCount > 0 ? `${item.studyCount} studies` : 'Pending'}
            </span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {item.studyCount > 0 && (
              <div
                className="h-full rounded-full relative overflow-hidden"
                style={{ width: `${evidenceWidth}%`, background: `linear-gradient(90deg, ${T.accent}, ${T.sky})` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                    animation: 'proto-shimmer 2.5s ease-in-out infinite',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CatalogGrid() {
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [filter, setFilter] = React.useState('All');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/supplements')
      .then((r) => r.json())
      .then((data) => {
        const list: CatalogItem[] = (data.supplements ?? []).map((s: CatalogItem) => ({
          slug: s.slug,
          name: s.name,
          baseCompound: s.baseCompound,
          specificForm: s.specificForm,
          tags: s.tags ?? [],
          supplementTypes: s.supplementTypes ?? [],
          studyCount: s.studyCount ?? 0,
        }));
        setItems(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tags = React.useMemo(() => {
    const seen = new Set<string>();
    for (const item of items) {
      for (const t of item.tags) seen.add(t.tag);
    }
    return ['All', ...Array.from(seen).sort()];
  }, [items]);

  const filtered = React.useMemo(() => {
    if (filter === 'All') return items;
    return items.filter((item) => item.tags.some((t) => t.tag === filter));
  }, [items, filter]);

  return (
    <section id="catalog" className="px-4 md:px-8 pb-24 md:pb-16 max-w-7xl mx-auto">
      {/* Section header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: T.text }}>
            Supplement Catalog
          </h2>
          <p className="text-sm mt-1" style={{ color: T.textDim }}>
            {items.length > 0 ? `${items.length} supplements` : 'Loading...'} — click any to get the full report
          </p>
        </div>
        <div className="text-[11px] font-medium" style={{ color: T.textFaint }}>
          {filter !== 'All' && `${filtered.length} matches`}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-8 overflow-x-auto pb-1 -mx-1 px-1">
        {tags.slice(0, 16).map((tag) => {
          const active = filter === tag;
          return (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 active:scale-95 shrink-0"
              style={{
                background: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? 'rgba(6,214,160,0.28)' : T.border}`,
                color: active ? T.accent : T.textDim,
                boxShadow: active ? '0 0 14px rgba(6,214,160,0.08)' : 'none',
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-44"
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                animation: 'proto-shimmer 1.5s ease-in-out infinite',
                backgroundImage: `linear-gradient(90deg, ${T.card}, ${T.elevated}, ${T.card})`,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filtered.slice(0, 48).map((item, i) => (
            <CatalogCard key={item.slug} item={item} index={i} />
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && items.length > 0 && (
        <p className="text-sm mt-8" style={{ color: T.textDim }}>
          No supplements found for "{filter}".
        </p>
      )}
    </section>
  );
}

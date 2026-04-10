"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { T, categoryAccentColor } from '@/lib/design-tokens';

type CatalogItem = {
  slug: string;
  name: string;
  baseCompound?: string;
  specificForm?: string;
  tags: { tag: string; tagType: string }[];
  supplementTypes: string[];
  studyCount: number;
  popularityScore?: number;
};

/** Derive a trust score from study count + popularity */
function trustScore(item: CatalogItem): number {
  const studies = Math.min(item.studyCount, 50);
  const pop = item.popularityScore ?? 50;
  return Math.round(((studies / 50) * 60 + (pop / 100) * 40)) / 10;
}

/** Pick a category label from types/tags */
function categoryLabel(item: CatalogItem): string {
  const types = item.supplementTypes.join(' ').toLowerCase();
  if (types.includes('nootropic')) return 'Cognitive / Nootropic';
  if (types.includes('amino')) return 'Amino Acid / Recovery';
  if (types.includes('herb') || types.includes('botanical') || types.includes('adaptogen')) return 'Hormonal / Adaptogen';
  if (types.includes('longevity')) return 'Longevity / Bioavailability';
  if (types.includes('vitamin')) return 'Micronutrients';
  if (types.includes('mineral')) return 'Essential Minerals';
  if (types.includes('mushroom')) return 'Mycological';
  const firstTag = item.tags[0];
  if (firstTag) return firstTag.tag;
  return 'Supplement';
}

function CatalogCard({ item, index, featured }: { item: CatalogItem; index: number; featured?: boolean }) {
  const score = trustScore(item);
  const accent = categoryAccentColor(item.supplementTypes);
  const topTags = item.tags.slice(0, 2);
  const delay = `${60 + index * 30}ms`;

  // Evidence bar width (capped at 50 studies = 100%)
  const evidencePercent = Math.min(Math.round((item.studyCount / 50) * 100), 100);

  if (featured) {
    return (
      <Link
        href={`/supplement/${encodeURIComponent(item.name)}`}
        className="lg:col-span-2 group flex flex-col md:flex-row gap-12 p-8 transition-all duration-200 relative overflow-hidden"
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          opacity: 0,
          animation: `vc-fade-up 420ms var(--ease-out-expo) ${delay} forwards`,
        }}
      >
        <div className="flex-1">
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: accent }}
          >
            {categoryLabel(item)}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 mb-4" style={{ color: '#fff' }}>
            {item.name}
          </h3>
          {item.baseCompound && (
            <p className="text-sm mb-6 max-w-md" style={{ color: T.textDim }}>
              Base compound: {item.baseCompound}.
              {item.specificForm ? ` Form: ${item.specificForm}.` : ''}
            </p>
          )}
          <div className="flex gap-4">
            <div className="p-4 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}` }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.outline }}>Studies</div>
              <div className="text-xl font-bold" style={{ color: '#fff' }}>{item.studyCount}+</div>
            </div>
            <div className="p-4 rounded-sm" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}` }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: T.outline }}>Score</div>
              <div className="text-xl font-bold" style={{ color: '#fff' }}>{score.toFixed(1)}</div>
            </div>
          </div>
        </div>
        <div
          className="w-full md:w-64 p-8 flex flex-col items-center justify-center text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}
        >
          <div className="text-5xl font-black tracking-tighter mb-2" style={{ color: T.primary }}>
            {score.toFixed(1)}
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest mb-6" style={{ color: T.outline }}>
            Trust Index
          </div>
          <span
            className="vanguard-gradient w-full py-3 text-[10px] font-black uppercase tracking-widest text-center block"
            style={{ color: T.textOnPrimary }}
          >
            View Data
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/supplement/${encodeURIComponent(item.name)}`}
      className="group flex flex-col h-full p-6 md:p-8 transition-all duration-200 relative overflow-hidden"
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        opacity: 0,
        animation: `vc-fade-up 420ms var(--ease-out-expo) ${delay} forwards`,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="min-w-0 flex-1">
          <span
            className="text-[10px] font-bold tracking-widest uppercase block mb-1"
            style={{ color: accent }}
          >
            {categoryLabel(item)}
          </span>
          <h3
            className="text-lg md:text-xl font-bold tracking-tight"
            style={{ color: '#fff' }}
          >
            {item.name}
          </h3>
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="text-2xl font-black tracking-tighter" style={{ color: accent }}>
            {score.toFixed(1)}
          </div>
          <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: T.outline }}>
            Trust Score
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {topTags.map((t, i) => (
          <span
            key={i}
            className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              borderRadius: 2,
            }}
          >
            {t.tag}
          </span>
        ))}
      </div>

      {/* Evidence bar */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: T.outline }}>
            Evidence Base
          </span>
          <div className="h-1 w-32 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full"
              style={{
                width: `${evidencePercent}%`,
                background: accent,
                boxShadow: `0 0 8px ${accent}40`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-auto pt-5 flex justify-between items-center"
        style={{ borderTop: `1px solid ${T.border}` }}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.outline }}>
          {item.studyCount > 0 ? `${item.studyCount} studies` : 'Data pending'}
        </span>
        <span
          className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all"
          style={{ color: accent }}
        >
          Clinical Report <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

export function CatalogGrid() {
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [filter, setFilter] = React.useState('Most Popular');
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
          popularityScore: s.popularityScore ?? 50,
        }));
        setItems(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = React.useMemo(() => {
    const arr = [...items];
    if (filter === 'Trending Now') {
      return arr.sort((a, b) => b.studyCount - a.studyCount);
    }
    // Most Popular — by popularity score desc
    return arr.sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));
  }, [items, filter]);

  const displayed = sorted.slice(0, 24);
  const featured = displayed[0];
  const rest = displayed.slice(1);

  return (
    <section id="catalog" className="px-6 md:px-8 pb-24 md:pb-16 max-w-7xl mx-auto">
      {/* Filter toggles + count */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4 pb-6" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex gap-8 md:gap-12">
          {['Most Popular', 'Trending Now'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="relative pb-2 text-xs font-bold tracking-widest uppercase transition-colors"
              style={{ color: filter === f ? T.primary : T.outline }}
            >
              {f}
              {filter === f && (
                <div
                  className="absolute bottom-0 left-0 w-full h-[2px]"
                  style={{ background: T.primary }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-medium tracking-widest uppercase" style={{ color: T.outline }}>
          {items.length > 0 ? `Showing 1-${Math.min(displayed.length, items.length)} of ${items.length} Assets` : 'Loading...'}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-56"
              style={{
                background: T.card,
                border: `1px solid ${T.border}`,
                animation: 'vc-pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
          {featured && <CatalogCard item={featured} index={0} featured />}
          {rest.slice(0, 4).map((item, i) => (
            <CatalogCard key={item.slug} item={item} index={i + 1} />
          ))}
          {/* Show more cards */}
          {rest.slice(4).map((item, i) => (
            <CatalogCard key={item.slug} item={item} index={i + 5} />
          ))}
        </div>
      )}
    </section>
  );
}

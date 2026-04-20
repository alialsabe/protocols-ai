'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export interface CompoundRow {
  slug: string;
  name: string;
  category: string;
  aliases: string;
  maintenance: string | null;
  studyCount: number;
}

const CATEGORIES = [
  'Stress & Sleep',
  'Minerals',
  'Performance',
  'Cardiovascular',
  'Vitamins',
  'Focus',
  'Metabolic',
  'Longevity',
] as const;

const CAT_COLOR: Record<string, string> = {
  'Stress & Sleep': '#8c8d60',
  Minerals: '#9a7e4e',
  Performance: '#b4612f',
  Cardiovascular: '#9a413d',
  Vitamins: '#a68130',
  Focus: '#446573',
  Metabolic: '#714274',
  Longevity: '#4a754f',
};

/** Derive a letter grade from study count */
function gradeFromCount(n: number): { tier: 'a' | 'b' | 'c'; label: string } {
  if (n >= 5) return { tier: 'a', label: 'A' };
  if (n >= 2) return { tier: 'b', label: 'B' };
  return { tier: 'c', label: 'C' };
}

// ── Search box ──────────────────────────────────────────────

interface SearchProps {
  compounds: CompoundRow[];
}

function SearchBox({ compounds }: SearchProps) {
  const router = useRouter();
  const [v, setV] = useState('');
  const [focused, setFocused] = useState(false);
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = v.trim().toLowerCase();
    if (!q) return [];
    return compounds
      .filter((s) => {
        const aliases = (() => {
          try { return JSON.parse(s.aliases) as string[]; } catch { return []; }
        })();
        return (
          s.name.toLowerCase().includes(q) ||
          aliases.some((a) => a.toLowerCase().includes(q)) ||
          s.category.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [v, compounds]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  const go = (slug?: string) => {
    const target = slug ?? suggestions[idx]?.slug ?? suggestions[0]?.slug;
    if (target) router.push(`/research/${target}`);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="search-bar">
        <span className="search-prompt">Look up</span>
        <input
          ref={ref}
          value={v}
          onChange={(e) => { setV(e.target.value); setIdx(0); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); go(); }
            if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          }}
          placeholder="ashwagandha, vitamin D, creatine…"
          aria-label="Search supplements"
        />
        <kbd className="search-kbd">⌘ K</kbd>
      </div>

      {focused && suggestions.length > 0 && (
        <div className="suggest fade-up">
          {suggestions.map((s, i) => {
            const aliases = (() => {
              try { return JSON.parse(s.aliases) as string[]; } catch { return []; }
            })();
            const g = gradeFromCount(s.studyCount);
            return (
              <Link
                key={s.slug}
                href={`/research/${s.slug}`}
                className="suggest-row"
                data-active={i === idx ? 'true' : undefined}
                onMouseEnter={() => setIdx(i)}
              >
                <div>
                  <span className="name">{s.name}</span>
                  {aliases[0] && <span className="alias">· {aliases[0]}</span>}
                </div>
                <span className="tag tag--sm" data-cat={s.category}>{s.category}</span>
                <span className="ev">{g.label} · {s.studyCount} studies</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Category filters ────────────────────────────────────────

interface FiltersProps {
  active: string | null;
  setActive: (c: string | null) => void;
  counts: Record<string, number>;
  total: number;
}

function CategoryFilters({ active, setActive, counts, total }: FiltersProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button
        className="pill"
        data-active={active === null ? 'true' : undefined}
        onClick={() => setActive(null)}
      >
        All
        <span className="count">{total}</span>
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c}
          className="pill"
          data-active={active === c ? 'true' : undefined}
          onClick={() => setActive(active === c ? null : c)}
        >
          <span className="pill-swatch" style={{ background: CAT_COLOR[c] }} />
          {c}
          <span className="count">{counts[c] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

// ── Compound row ────────────────────────────────────────────

function CompoundRowItem({ s, index }: { s: CompoundRow; index: number }) {
  const g = gradeFromCount(s.studyCount);
  const aliases = (() => {
    try { return JSON.parse(s.aliases) as string[]; } catch { return []; }
  })();

  return (
    <Link href={`/research/${s.slug}`} className="compound-row">
      <span className="rank">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <h3 className="compound-name">{s.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="tag tag--sm" data-cat={s.category}>{s.category}</span>
          {aliases[0] && <span className="compound-sub">{aliases[0]}</span>}
        </div>
      </div>
      {s.maintenance && (
        <div className="compound-stat">
          <span className="k">Dose</span>
          <span>{s.maintenance}</span>
        </div>
      )}
      <div className="compound-stat">
        <span className="k">Evidence</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="grade" data-tier={g.tier}>{g.label}</span>
          <span style={{ color: 'var(--ink-4)' }}>·</span>
          <span>{s.studyCount} studies</span>
        </span>
      </div>
      <div className="compound-stat" style={{ color: 'var(--ink-4)' }}>→</div>
    </Link>
  );
}

// ── Main page ───────────────────────────────────────────────

interface Props {
  compounds: CompoundRow[];
  totalCompounds: number;
  totalStudies: number;
}

export function HomepageClient({ compounds, totalCompounds, totalStudies }: Props) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [sort, setSort] = useState<'popular' | 'az' | 'evidence'>('popular');

  const nf = new Intl.NumberFormat('en-US');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of compounds) c[s.category] = (c[s.category] ?? 0) + 1;
    return c;
  }, [compounds]);

  const filtered = useMemo(() => {
    let list = [...compounds];
    if (activeCat) list = list.filter((s) => s.category === activeCat);
    if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'evidence') list.sort((a, b) => b.studyCount - a.studyCount);
    // 'popular' is already default order from DB
    return list;
  }, [compounds, activeCat, sort]);

  return (
    <div className="page">
      {/* Masthead */}
      <div
        style={{
          padding: '48px 0 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span className="footnote" style={{ letterSpacing: '1.4px', textTransform: 'uppercase' }}>
            A reference work, updated continuously
          </span>
          <h1
            style={{
              margin: '8px 0 0',
              fontSize: 22,
              lineHeight: 1.35,
              letterSpacing: '-0.3px',
              fontWeight: 500,
              color: 'var(--ink)',
              maxWidth: '56ch',
            }}
          >
            Plain-language research on the supplements people actually take —
            graded, sourced, and scheduled.
          </h1>
        </div>
        <span className="footnote" style={{ whiteSpace: 'nowrap' }}>
          {nf.format(totalCompounds)} compounds · {nf.format(totalStudies)} studies indexed
        </span>
      </div>

      {/* Search — the real hero */}
      <SearchBox compounds={compounds} />

      {/* Category explorer */}
      <div
        className="section-rule"
        style={{ paddingTop: 40 }}
      >
        <div className="label">
          <span className="num">01</span>
          <span>Explore by category</span>
        </div>
        <span />
        <span className="right">
          {filtered.length} of {compounds.length}
        </span>
      </div>
      <CategoryFilters
        active={activeCat}
        setActive={setActiveCat}
        counts={counts}
        total={compounds.length}
      />

      {/* Sort + count bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: 32,
          marginBottom: 4,
        }}
      >
        <span className="footnote">
          {activeCat ? (
            <>
              Showing <strong style={{ color: 'var(--ink-2)' }}>{activeCat}</strong>
            </>
          ) : (
            'All compounds'
          )}
        </span>
        <div className="toggle">
          {(['popular', 'az', 'evidence'] as const).map((k) => (
            <button key={k} data-active={sort === k ? 'true' : undefined} onClick={() => setSort(k)}>
              {k === 'popular' ? 'Popular' : k === 'az' ? 'A–Z' : 'Evidence'}
            </button>
          ))}
        </div>
      </div>

      {/* Compound list */}
      <div style={{ marginTop: 8 }}>
        {filtered.map((s, i) => (
          <CompoundRowItem key={s.slug} s={s} index={i} />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: '60px 0',
              textAlign: 'center',
              color: 'var(--ink-4)',
              borderTop: '1px solid var(--rule)',
            }}
          >
            No compounds in this category yet.
          </div>
        )}
      </div>

      <div style={{ height: 60 }} />
    </div>
  );
}

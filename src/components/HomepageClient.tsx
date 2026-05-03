'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
export interface CompoundRow {
  slug: string;
  name: string;
  category: string;
  aliases: string;
  maintenance: string | null;
  studyCount: number;
}

const CATEGORIES = [
  'herb_botanical',
  'essential_vitamin',
  'essential_mineral',
  'amino_acid',
  'specialty_dietary_substance',
  'trace_mineral',
  'nootropics',
  'longevity',
  'protein',
] as const;

const CAT_LABEL: Record<string, string> = {
  herb_botanical: 'Botanicals',
  essential_vitamin: 'Vitamins',
  essential_mineral: 'Minerals',
  amino_acid: 'Amino Acids',
  specialty_dietary_substance: 'Specialty',
  trace_mineral: 'Trace Minerals',
  nootropics: 'Nootropics',
  longevity: 'Longevity',
  protein: 'Protein',
};

// Earthy editorial palette (was: greens). These are subtle category dots
// in the style of newspaper section flags.
const CAT_COLOR: Record<string, string> = {
  herb_botanical: '#6B7F5C',
  essential_vitamin: '#C9A84C',
  essential_mineral: '#9A7E4E',
  amino_acid: '#B4612F',
  specialty_dietary_substance: '#714274',
  trace_mineral: '#8C8D60',
  nootropics: '#446573',
  longevity: '#4A754F',
  protein: '#A02B2B',
};

/** Derive a letter grade from study count */
function gradeFromCount(n: number): { tier: 'a' | 'b' | 'c'; label: string } {
  if (n >= 5) return { tier: 'a', label: 'A' };
  if (n >= 2) return { tier: 'b', label: 'B' };
  return { tier: 'c', label: 'C' };
}

// ── G Briefing — the daily editorial read ───────────────────

function GBriefing({ totalCompounds, totalStudies }: { totalCompounds: number; totalStudies: number }) {
  const nf = new Intl.NumberFormat('en-US');

  return (
    <>
      <div className="g-briefing-h">
        <span className="label">The Briefing</span>
        <span className="meta">2 min read</span>
      </div>
      <div className="g-briefing">
        <h1 className="head">
          Most supplement stacks contain <em>three pills doing the same job.</em>
        </h1>
        <p className="deck">
          Stack Lab reads your stack and tells you what is duplicative, what conflicts with your medications, and what to drop. A daily briefing about your body, written like content you actually want to read, not a tracker you have to maintain.
        </p>
        <Link href="/routine" className="pull" style={{ textDecoration: 'none' }}>
          <span className="save">
            Audit yours: <b>find $20-$60/mo in waste</b>
          </span>
          <span className="cta">Build my stack →</span>
        </Link>
      </div>

      {/* Stats row — the trust footer for the briefing */}
      <div className="g-stats">
        <div className="g-stat">
          <div className="l">Compounds</div>
          <div className="v">{nf.format(totalCompounds)}</div>
        </div>
        <div className="g-stat">
          <div className="l">Studies indexed</div>
          <div className="v">{nf.format(totalStudies)}</div>
        </div>
        <div className="g-stat">
          <div className="l">Updated</div>
          <div className="v" style={{ fontSize: 18 }}>Daily</div>
        </div>
      </div>
    </>
  );
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
          {CAT_LABEL[c] ?? c}
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
        <span className="compound-name-wrap">
          <span className="compound-name-glass" aria-hidden="true" />
          <h3 className="compound-name">{s.name}</h3>
        </span>
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
  const params = useSearchParams();
  // ?view=library scrolls past the briefing on load (used by mobile tab bar)
  const libraryView = params.get('view') === 'library';
  const libraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (libraryView && libraryRef.current) {
      libraryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [libraryView]);

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
      {/* G Briefing — the hero */}
      <GBriefing totalCompounds={totalCompounds} totalStudies={totalStudies} />

      {/* Library section */}
      <div ref={libraryRef}>
        <div className="section-rule" style={{ paddingTop: 36 }}>
          <div className="label">
            <span className="num">01</span>
            <span>The Library</span>
          </div>
          <span />
          <span className="right">
            {filtered.length} of {compounds.length}
          </span>
        </div>

        {/* Search */}
        <SearchBox compounds={compounds} />

        {/* Category filters */}
        <div style={{ marginTop: 28 }}>
          <CategoryFilters
            active={activeCat}
            setActive={setActiveCat}
            counts={counts}
            total={compounds.length}
          />
        </div>

        {/* Sort + count bar */}
        <div
          className="sort-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: 28,
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
      </div>

      <div style={{ height: 60 }} />
    </div>
  );
}

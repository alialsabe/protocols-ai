'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/use-auth';

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

const CAT_COLOR: Record<string, string> = {
  herb_botanical: '#88FFAA',
  essential_vitamin: '#FFD960',
  essential_mineral: '#9D6FE8',
  amino_acid: '#FF8B6B',
  specialty_dietary_substance: '#B898FF',
  trace_mineral: '#C5C896',
  nootropics: '#88BBDD',
  longevity: '#88FFAA',
  protein: '#FF6B6B',
};

/** Derive a letter grade + rarity tier from study count */
function gradeFromCount(n: number): { tier: 'a' | 'b' | 'c'; label: string; rarity: 'common' | 'rare' | 'legendary' } {
  if (n >= 8) return { tier: 'a', label: 'A', rarity: 'legendary' };
  if (n >= 5) return { tier: 'a', label: 'A', rarity: 'rare' };
  if (n >= 2) return { tier: 'b', label: 'B', rarity: 'common' };
  return { tier: 'c', label: 'C', rarity: 'common' };
}

const RARITY_LABEL: Record<string, string> = {
  common: '★',
  rare: '★★★',
  legendary: '★★★★',
};

// ── L+ Today welcome card (anonymous users) ─────────────────

function TodayWelcome({ totalCompounds, totalStudies }: { totalCompounds: number; totalStudies: number }) {
  const nf = new Intl.NumberFormat('en-US');

  return (
    <div
      style={{
        margin: '24px 0 16px',
        padding: 24,
        background: 'linear-gradient(160deg, #1A2030 0%, #141923 100%)',
        border: '1.5px solid var(--gold)',
        borderRadius: 8,
        position: 'relative',
        boxShadow: '0 12px 40px rgba(212, 175, 55, 0.10)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 20,
          background: 'var(--bg)',
          color: 'var(--gold)',
          fontFamily: 'var(--font-cinzel), serif',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '2px',
          padding: '3px 12px',
          borderRadius: 3,
          textTransform: 'uppercase',
        }}
      >
        ✦ Welcome, traveler
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-cinzel), serif',
          fontSize: 'clamp(24px, 4.4vw, 36px)',
          fontWeight: 600,
          letterSpacing: '-0.4px',
          lineHeight: 1.15,
          color: 'var(--text)',
          margin: '8px 0 12px',
          textWrap: 'balance',
        }}
      >
        Build your supplement stack like a <span style={{ color: 'var(--gold)' }}>character.</span>
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-inter), sans-serif',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--text-2)',
          margin: '0 0 20px',
          maxWidth: '60ch',
        }}
      >
        Each supplement has a rarity, evidence grade, and synergy score. The audit (Scout) reads your stack and flags redundancies — so you stop paying for pills that do the same job.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/routine" className="btn">
          Build my stack ▸
        </Link>
        <Link href="/?view=library" className="btn btn--ghost">
          Browse the library
        </Link>
        <span
          className="footnote"
          style={{
            marginLeft: 12,
            color: 'var(--text-3)',
            fontSize: 11,
            letterSpacing: '0.5px',
          }}
        >
          {nf.format(totalCompounds)} compounds · {nf.format(totalStudies)} studies indexed
        </span>
      </div>
    </div>
  );
}

// ── Sub-product CTAs (Save + Optimize) ──────────────────────

function SubProductCtas() {
  return (
    <div className="sub-cta-grid">
      <Link href="/save" className="sub-cta-card">
        <div className="sub-cta-eyebrow">Save</div>
        <div className="sub-cta-title">Save money on your stack</div>
        <div className="sub-cta-sub">Find duplicates, swap forms, drop noise. Keep what works.</div>
        <span className="sub-cta-btn">Analyze for savings →</span>
      </Link>
      <Link href="/optimize" className="sub-cta-card">
        <div className="sub-cta-eyebrow">Optimize</div>
        <div className="sub-cta-title">Optimize for your goal</div>
        <div className="sub-cta-sub">Sleep, energy, longevity, cognition, or muscle. We tune the stack.</div>
        <span className="sub-cta-btn">Pick a goal →</span>
      </Link>
    </div>
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
        <span className="search-prompt">⌕ Look up</span>
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

// ── Compound row (L+ aesthetic) ─────────────────────────────

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
          <span
            className="footnote"
            style={{
              color:
                g.rarity === 'legendary' ? 'var(--gold)' :
                g.rarity === 'rare' ? 'var(--rar-rare)' :
                'var(--text-4)',
              fontFamily: 'var(--font-cinzel), serif',
              letterSpacing: '1px',
              fontSize: 10,
            }}
          >
            {RARITY_LABEL[g.rarity]} {g.rarity.toUpperCase()}
          </span>
          {aliases[0] && <span className="compound-sub">· {aliases[0]}</span>}
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
          <span style={{ color: 'var(--text-4)' }}>·</span>
          <span>{s.studyCount}</span>
        </span>
      </div>
      <div className="compound-stat" style={{ color: 'var(--gold)' }}>▸</div>
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
  const libraryView = params.get('view') === 'library';
  const libraryRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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
    return list;
  }, [compounds, activeCat, sort]);

  return (
    <div className="page">
      {/* L+ Today welcome — only for anon users on / (not when scrolling to library) */}
      {!user && !libraryView && (
        <TodayWelcome totalCompounds={totalCompounds} totalStudies={totalStudies} />
      )}

      {/* Sub-product CTAs — Save / Optimize. Placed between brand briefing and Library. */}
      {!libraryView && <SubProductCtas />}

      {/* For auth users, show a small "back to your stack" affordance */}
      {user && !libraryView && (
        <div
          style={{
            margin: '24px 0 16px',
            padding: '16px 20px',
            background: 'linear-gradient(160deg, #1A2030 0%, #141923 100%)',
            border: '1px solid var(--rule)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-cinzel), serif',
                fontSize: 11,
                color: 'var(--gold)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              ⚜ Your stack
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.4 }}>
              Continue building your character.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/routine" className="btn">Open Stack ▸</Link>
            <Link href="/routine/audit" className="btn btn--ghost">Run Audit</Link>
          </div>
        </div>
      )}

      {/* Library section */}
      <div ref={libraryRef}>
        <div className="section-rule" style={{ paddingTop: 28 }}>
          <div className="label">
            <span className="num">01</span>
            <span>The Library · all compounds</span>
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
                Showing <strong style={{ color: 'var(--gold)' }}>{activeCat}</strong>
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
                color: 'var(--text-3)',
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

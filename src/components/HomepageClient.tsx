'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Flask,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  StackSimple,
} from '@phosphor-icons/react';
import { useSchedule } from '@/components/stack/use-schedule';

export interface CompoundRow {
  slug: string;
  name: string;
  category: string;
  aliases: string;
  maintenance: string | null;
  studyCount: number;
}

const ROUTINE_KEY = 'protocolsai.routine.v2';
const ADHERENCE_KEY = 'stacklab.adherence.v1';

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
  'peptide',
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
  peptide: 'Peptides',
};

function parseAliases(value: string) {
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}

function gradeFromCount(n: number): { tier: 'a' | 'b' | 'c'; label: string } {
  if (n >= 5) return { tier: 'a', label: 'A' };
  if (n >= 2) return { tier: 'b', label: 'B' };
  return { tier: 'c', label: 'C' };
}

function SearchBox({ compounds }: { compounds: CompoundRow[] }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];

    return compounds
      .filter((compound) => {
        const aliases = parseAliases(compound.aliases);
        return (
          compound.name.toLowerCase().includes(query) ||
          aliases.some((alias) => alias.toLowerCase().includes(query)) ||
          compound.category.toLowerCase().includes(query)
        );
      })
      .slice(0, 6);
  }, [compounds, value]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const go = (slug?: string) => {
    const target = slug ?? suggestions[activeIndex]?.slug ?? suggestions[0]?.slug;
    if (target) router.push(`/research/${target}`);
  };

  return (
    <div className="library-search-wrap">
      <div className="library-search">
        <MagnifyingGlass size={22} weight="regular" aria-hidden="true" />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setActiveIndex(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 150)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              go();
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
          }}
          placeholder="Search supplements, peptides, or goals"
          aria-label="Search supplements and peptides"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="library-suggestions"
          aria-expanded={focused && suggestions.length > 0}
        />
        <kbd>Ctrl K</kbd>
      </div>

      {focused && suggestions.length > 0 && (
        <div id="library-suggestions" className="library-suggestions" role="listbox">
          {suggestions.map((compound, index) => {
            const grade = gradeFromCount(compound.studyCount);
            return (
              <Link
                key={compound.slug}
                href={`/research/${compound.slug}`}
                className="library-suggestion"
                data-active={index === activeIndex ? 'true' : undefined}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                aria-selected={index === activeIndex}
              >
                <span>
                  <strong>{compound.name}</strong>
                  <small>{CAT_LABEL[compound.category] ?? compound.category}</small>
                </span>
                <span className="library-suggestion__evidence">
                  Evidence {grade.label} · {compound.studyCount} studies
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TodayPanel({ names }: { names: string[] }) {
  const { blocks, loading, error } = useSchedule(names);
  const [completed, setCompleted] = useState<string[]>([]);
  const [dateKey] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(localStorage.getItem(ADHERENCE_KEY) || '{}') as Record<string, string[]>;
        setCompleted(saved[dateKey] ?? []);
      } catch {
        setCompleted([]);
      }
    });
    return () => { cancelled = true; };
  }, [dateKey]);

  const doseKeys = useMemo(
    () => blocks.flatMap((block) => block.supplements.map((name) => `${block.time}|${name}`)),
    [blocks],
  );
  const completedCount = doseKeys.filter((key) => completed.includes(key)).length;
  const progress = doseKeys.length ? Math.round((completedCount / doseKeys.length) * 100) : 0;

  const toggleDose = (key: string) => {
    setCompleted((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      try {
        const saved = JSON.parse(localStorage.getItem(ADHERENCE_KEY) || '{}') as Record<string, string[]>;
        saved[dateKey] = next;
        localStorage.setItem(ADHERENCE_KEY, JSON.stringify(saved));
      } catch {
        // The interaction still works for the session if storage is unavailable.
      }
      return next;
    });
  };

  if (names.length === 0) {
    return (
      <section className="today-panel today-panel--empty" aria-label="Your stack is empty">
        <div className="today-panel__topline">
          <span>Today</span>
          <span>0 compounds</span>
        </div>
        <div className="today-empty__mark" aria-hidden="true">
          <StackSimple size={28} weight="regular" />
        </div>
        <h2>Start with the stack you already take.</h2>
        <p>Add supplements and peptides, then Stack Lab will space them into a practical day.</p>
        <Link href="/routine" className="button button--primary">
          Build my stack <ArrowRight size={17} weight="regular" />
        </Link>
      </section>
    );
  }

  return (
    <section className="today-panel" aria-label="Today's stack schedule">
      <div className="today-panel__topline">
        <span>Today’s protocol</span>
        <span>Saved on this device</span>
      </div>

      <div className="today-panel__progress">
        <div>
          <strong>{completedCount}</strong>
          <span>of {doseKeys.length || names.length} doses logged</span>
        </div>
        <div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}>
          <span>{progress}%</span>
        </div>
      </div>

      {loading && (
        <div className="today-skeleton" aria-label="Loading today's schedule">
          <span />
          <span />
          <span />
        </div>
      )}

      {error && (
        <div className="today-error" role="alert">
          <strong>Schedule unavailable.</strong>
          <span>Your stack is safe. Open My Stack to try the scheduler again.</span>
        </div>
      )}

      {!loading && !error && (
        <div className="today-blocks">
          {blocks.slice(0, 3).map((block) => (
            <div key={`${block.time}-${block.title}`} className="today-block">
              <time>{block.time}</time>
              <div>
                <strong>{block.title.split(' — ')[0]}</strong>
                <div className="today-doses">
                  {block.supplements.map((name) => {
                    const key = `${block.time}|${name}`;
                    const isComplete = completed.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDose(key)}
                        data-complete={isComplete ? 'true' : undefined}
                        aria-label={`${isComplete ? 'Mark not taken' : 'Mark taken'}: ${name} at ${block.time}`}
                      >
                        <span><Check size={12} weight="bold" /></span>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href="/routine" className="today-panel__footer">
        Open full schedule <ArrowRight size={16} weight="regular" />
      </Link>
    </section>
  );
}

function CategoryFilters({
  active,
  setActive,
  counts,
  total,
}: {
  active: string | null;
  setActive: (category: string | null) => void;
  counts: Record<string, number>;
  total: number;
}) {
  return (
    <div className="category-filters" aria-label="Filter the compound library">
      <button data-active={active === null ? 'true' : undefined} onClick={() => setActive(null)}>
        All <span>{total}</span>
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category}
          data-active={active === category ? 'true' : undefined}
          onClick={() => setActive(active === category ? null : category)}
        >
          {CAT_LABEL[category] ?? category} <span>{counts[category] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

function CompoundRowItem({ compound, index }: { compound: CompoundRow; index: number }) {
  const grade = gradeFromCount(compound.studyCount);
  return (
    <Link href={`/research/${compound.slug}`} className="library-row">
      <span className="library-row__rank">{String(index + 1).padStart(2, '0')}</span>
      <span className="library-row__name">
        <strong>{compound.name}</strong>
        <small>{CAT_LABEL[compound.category] ?? compound.category}</small>
      </span>
      <span className="library-row__dose">
        <small>Typical use</small>
        <span>{compound.maintenance ?? 'Review dosing'}</span>
      </span>
      <span className="library-row__evidence">
        <small>Evidence</small>
        <span><b data-tier={grade.tier}>{grade.label}</b>{compound.studyCount} studies</span>
      </span>
      <ArrowRight size={18} weight="regular" aria-hidden="true" />
    </Link>
  );
}

export function HomepageClient({
  compounds,
  totalCompounds,
  totalStudies,
}: {
  compounds: CompoundRow[];
  totalCompounds: number;
  totalStudies: number;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<'popular' | 'az' | 'evidence'>('popular');
  const [routineSlugs, setRoutineSlugs] = useState<string[]>([]);
  const numberFormat = new Intl.NumberFormat('en-US');

  useEffect(() => {
    const readRoutine = () => {
      try {
        setRoutineSlugs(JSON.parse(localStorage.getItem(ROUTINE_KEY) || '[]'));
      } catch {
        setRoutineSlugs([]);
      }
    };
    readRoutine();
    window.addEventListener('routine:update', readRoutine);
    return () => window.removeEventListener('routine:update', readRoutine);
  }, []);

  const compoundBySlug = useMemo(
    () => new Map(compounds.map((compound) => [compound.slug, compound])),
    [compounds],
  );
  const routineCompounds = useMemo(
    () => routineSlugs.map((slug) => compoundBySlug.get(slug)).filter((item): item is CompoundRow => Boolean(item)),
    [compoundBySlug, routineSlugs],
  );
  const routineNames = useMemo(() => routineCompounds.map((compound) => compound.name), [routineCompounds]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const compound of compounds) result[compound.category] = (result[compound.category] ?? 0) + 1;
    return result;
  }, [compounds]);

  const filtered = useMemo(() => {
    const list = activeCategory
      ? compounds.filter((compound) => compound.category === activeCategory)
      : [...compounds];
    if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'evidence') list.sort((a, b) => b.studyCount - a.studyCount);
    return list;
  }, [activeCategory, compounds, sort]);

  return (
    <div className="home-shell">
      <section className="home-hero">
        <div className="home-hero__copy">
          <span className="eyebrow">Supplement and peptide management</span>
          <h1>Run your stack around real life.</h1>
          <p>
            Plan supplements and peptides, resolve timing and conflicts, and keep the evidence close when your protocol changes.
          </p>
          <div className="home-hero__actions">
            <Link href="/routine" className="button button--primary">
              Manage my stack <ArrowRight size={17} weight="regular" />
            </Link>
            <Link href="#library" className="button button--ghost">
              <Plus size={17} weight="regular" /> Add a compound
            </Link>
          </div>
          <dl className="home-ledger">
            <div><dt>Active stack</dt><dd>{routineCompounds.length}</dd></div>
            <div><dt>Compounds</dt><dd>{numberFormat.format(totalCompounds)}</dd></div>
            <div><dt>Studies</dt><dd>{numberFormat.format(totalStudies)}</dd></div>
          </dl>
        </div>
        <TodayPanel names={routineNames} />
      </section>

      <section className="management-strip" aria-label="Stack management tools">
        <div className="management-strip__stack">
          <div className="management-strip__heading">
            <span className="eyebrow">Active stack</span>
            <Link href="/routine">Edit stack <ArrowRight size={14} weight="regular" /></Link>
          </div>
          {routineCompounds.length > 0 ? (
            <div className="active-stack-list">
              {routineCompounds.slice(0, 5).map((compound) => (
                <Link key={compound.slug} href={`/research/${compound.slug}`}>
                  <span>{compound.name}</span>
                  <small>{compound.maintenance ?? 'Dose guide available'}</small>
                </Link>
              ))}
              {routineCompounds.length > 5 && <span>+{routineCompounds.length - 5} more in My Stack</span>}
            </div>
          ) : (
            <div className="stack-empty-inline">
              <span>No active compounds yet.</span>
              <Link href="/routine">Build your first stack</Link>
            </div>
          )}
        </div>

        <div className="management-actions">
          <Link href="/routine/audit">
            <ShieldCheck size={22} weight="regular" />
            <span><strong>Audit interactions</strong><small>Conflicts, timing, and overlap</small></span>
            <ArrowRight size={16} weight="regular" />
          </Link>
          <Link href="#library">
            <Flask size={22} weight="regular" />
            <span><strong>Research a change</strong><small>Evidence before you add it</small></span>
            <ArrowRight size={16} weight="regular" />
          </Link>
        </div>
      </section>

      <section className="revive-benefit">
        <span>Revive One member benefit</span>
        <p>Stack Lab is designed to be included with your Revive One subscription, with no separate app fee.</p>
        <Link href="/about">How Stack Lab supports your care <ArrowRight size={15} weight="regular" /></Link>
      </section>

      <section id="library" className="library-section">
        <div className="library-heading">
          <div>
            <h2>Add to your stack with better context.</h2>
          </div>
          <p>{numberFormat.format(totalCompounds)} supplements and peptides, indexed against {numberFormat.format(totalStudies)} studies.</p>
        </div>

        <SearchBox compounds={compounds} />
        <CategoryFilters active={activeCategory} setActive={setActiveCategory} counts={counts} total={compounds.length} />

        <div className="library-toolbar">
          <span>{filtered.length} compounds</span>
          <div role="group" aria-label="Sort the compound library">
            {(['popular', 'az', 'evidence'] as const).map((key) => (
              <button key={key} data-active={sort === key ? 'true' : undefined} onClick={() => setSort(key)}>
                {key === 'popular' ? 'Popular' : key === 'az' ? 'A–Z' : 'Evidence'}
              </button>
            ))}
          </div>
        </div>

        <div className="library-list">
          {filtered.map((compound, index) => (
            <CompoundRowItem key={compound.slug} compound={compound} index={index} />
          ))}
          {filtered.length === 0 && (
            <div className="library-empty">
              <span>Empty state · 01</span>
              <h3>No compounds in this category yet.</h3>
              <p>Choose another category or search the full library.</p>
              <button type="button" onClick={() => setActiveCategory(null)}>View all compounds</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

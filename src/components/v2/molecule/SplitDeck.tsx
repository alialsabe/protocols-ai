'use client';

/**
 * SplitDeck — the homepage hero.
 *
 * Left 60%: the featured MoleculeCard (holographic 3D render).
 * Right 40%: a compact, clickable trending list. Clicking a row
 *            swaps the molecule on the left (camera dolly + bloom pulse).
 *
 * Mobile (< 768px): we render a list-only view with a "Show molecule"
 *                   toggle button in the top-right that expands a
 *                   full-screen takeover — see `MobileMoleculeToggle`.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MoleculeCard } from './MoleculeCard';
import { getRender } from './data';
import { MobileMoleculeToggle } from './MobileMoleculeToggle';
import type { TrendingItem } from '@/components/v2/trending/types';

type Props = {
  items: TrendingItem[];
  generatedAt: string;
  stale: boolean;
};

function formatDelta(deltaWeek: number): { label: string; positive: boolean } {
  const pct = Math.round(deltaWeek * 100);
  if (pct >= 0) return { label: `+${pct}%`, positive: true };
  return { label: `${pct}%`, positive: false };
}

function formatMentions(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function SplitDeck({ items, generatedAt, stale }: Props) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.slug ?? 'creatine');

  // Keep activeSlug in sync if the server data changes on revalidation.
  useEffect(() => {
    if (!items.some((i) => i.slug === activeSlug) && items[0]) {
      setActiveSlug(items[0].slug);
    }
  }, [items, activeSlug]);

  const active = useMemo(() => items.find((i) => i.slug === activeSlug) ?? items[0], [items, activeSlug]);
  const activeRender = useMemo(() => getRender(activeSlug), [activeSlug]);
  const activeDelta = active?.deltaWeek;

  const updatedAt = useMemo(() => {
    try {
      return new Date(generatedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--:--';
    }
  }, [generatedAt]);

  return (
    <section aria-labelledby="split-deck-heading" className="proto-split-deck">
      <h2 id="split-deck-heading" className="sr-only">
        Trending supplements hero
      </h2>

      {/* Desktop: 60/40 split. Mobile: list-only + floating toggle. */}
      <div className="proto-split-deck-grid">
        {/* Left — molecule card (hidden on mobile) */}
        <div className="proto-split-deck-card">
          <MoleculeCard render={activeRender} deltaWeek={activeDelta} />
        </div>

        {/* Right — trending list */}
        <div className="proto-split-deck-list">
          <div className="proto-split-deck-list-head">
            <div className="proto-split-deck-list-head-left">
              <span className="proto-dot" aria-hidden />
              <span>Trending / 7D</span>
            </div>
            <div className="proto-split-deck-list-head-right">
              {stale && <span className="proto-stale">Stale</span>}
              <span>Updated {updatedAt}</span>
            </div>
          </div>

          <ol className="proto-split-deck-rows">
            {items.slice(0, 8).map((item, idx) => {
              const delta = formatDelta(item.deltaWeek);
              const isActive = item.slug === activeSlug;
              return (
                <li key={item.slug} className={`proto-split-deck-row ${isActive ? 'active' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setActiveSlug(item.slug)}
                    onMouseEnter={() => setActiveSlug(item.slug)}
                    onFocus={() => setActiveSlug(item.slug)}
                    className="proto-split-deck-row-btn"
                    aria-pressed={isActive}
                    aria-label={`Show ${item.name} molecule`}
                  >
                    <span className="proto-split-deck-row-rank">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="proto-split-deck-row-name">{item.name}</span>
                    <span className="proto-split-deck-row-mentions">
                      {formatMentions(item.mentionCount)}
                    </span>
                    <span className={`proto-split-deck-row-delta ${delta.positive ? 'pos' : 'neg'}`}>
                      {delta.label}
                    </span>
                  </button>
                  <Link
                    href={`/research/${item.slug}`}
                    className="proto-split-deck-row-open"
                    aria-label={`Open ${item.name} research`}
                  >
                    →
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Mobile: full-screen molecule toggle */}
      <MobileMoleculeToggle render={activeRender} deltaWeek={activeDelta} name={active?.name ?? ''} />
    </section>
  );
}

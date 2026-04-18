import {
  getTrendingPayload,
  isStale,
} from '@/components/v2/trending/types';
import { SplitDeck } from './SplitDeck';

/**
 * Server-side wrapper — fetches the trending snapshot and hands the items
 * to the client SplitDeck. Mirrors the pattern used by TrendingSection.
 */
export async function SplitDeckSection() {
  const data = await getTrendingPayload();
  if (!data || data.trending.length === 0) {
    return <SplitDeckFallback />;
  }
  const stale = isStale(data.generatedAt);
  const items = data.trending.slice(0, 8);
  return <SplitDeck items={items} generatedAt={data.generatedAt} stale={stale} />;
}

function SplitDeckFallback() {
  return (
    <section className="proto-split-deck">
      <div className="proto-split-deck-grid">
        <div className="proto-split-deck-card" aria-hidden>
          <div className="proto-mol-card">
            <div className="proto-mol-glow" aria-hidden />
          </div>
        </div>
        <div className="proto-split-deck-list">
          <div className="proto-split-deck-list-head">
            <div className="proto-split-deck-list-head-left">
              <span className="proto-dot" aria-hidden />
              <span>Trending / 7D</span>
            </div>
          </div>
          <div style={{ padding: '2rem 1.5rem', fontFamily: 'monospace', fontSize: 12, color: 'var(--fg-dim)' }}>
            // trending offline · refresh in 6h
          </div>
        </div>
      </div>
    </section>
  );
}

export function SplitDeckSkeleton() {
  return (
    <section className="proto-split-deck">
      <div className="proto-split-deck-grid">
        <div className="proto-split-deck-card" aria-hidden>
          <div className="proto-mol-card" />
        </div>
        <div className="proto-split-deck-list">
          <div className="proto-split-deck-list-head">
            <div className="proto-split-deck-list-head-left">
              <span className="proto-dot" aria-hidden />
              <span>Trending / 7D</span>
            </div>
          </div>
          <ol className="proto-split-deck-rows">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="proto-split-deck-row">
                <div className="proto-split-deck-row-btn" style={{ opacity: 0.3 }}>
                  <span className="proto-split-deck-row-rank">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="proto-split-deck-row-name">————</span>
                  <span className="proto-split-deck-row-mentions">——</span>
                  <span className="proto-split-deck-row-delta pos">——</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';

type TrendingRow = {
  slug: string;
  name: string;
  mentionCount: number;
  deltaWeek: number;
};

type SeenState = {
  generatedAt: string;
  ranks: Record<string, number>;
  deltas: Record<string, number>;
};

const STORAGE_KEY = 'protoai_trending_seen';

/**
 * Given the current trending rows + generatedAt, returns a set of slugs
 * whose delta or rank changed since the user's last visit. Also rewrites
 * localStorage with the current snapshot after detecting changes so the next
 * visit compares against THIS state.
 */
export function useTrendingDiff(rows: TrendingRow[], generatedAt: string) {
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const firstRun = useRef(true);

  useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;

    let seen: SeenState | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) seen = JSON.parse(raw) as SeenState;
    } catch { /* ignore corrupt blob */ }

    if (seen && seen.generatedAt !== generatedAt) {
      const diffs = new Set<string>();
      rows.forEach((r, i) => {
        const prevRank = seen!.ranks[r.slug];
        const prevDelta = seen!.deltas[r.slug];
        if (prevRank === undefined || prevRank !== i) diffs.add(r.slug);
        if (prevDelta !== undefined && prevDelta !== r.deltaWeek) diffs.add(r.slug);
      });
      setChanged(diffs);
    }

    const next: SeenState = {
      generatedAt,
      ranks: Object.fromEntries(rows.map((r, i) => [r.slug, i])),
      deltas: Object.fromEntries(rows.map(r => [r.slug, r.deltaWeek])),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
  }, [rows, generatedAt]);

  return changed;
}

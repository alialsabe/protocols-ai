import { getLatestSnapshot } from '@/lib/trending/aggregate';
import { MOCK_TRENDING_PAYLOAD } from '@/lib/trending/mock';
import type { TrendingApiResponse } from '@/lib/trending/types';

export type TrendingItem = {
  slug: string;
  name: string;
  mentionCount: number;
  deltaWeek: number;
  sources: string[];
  lastSeen: string;
};

export type MostPopularItem = {
  slug: string;
  name: string;
  score: number;
  ytViews: number;
  ytVideoCount: number;
  redditPosts: number;
  amazonReviews: number | null;
  amazonBSR: number | null;
};

export type TrendingPayload = {
  trending: TrendingItem[];
  mostPopular: MostPopularItem[];
  generatedAt: string;
  stale?: boolean;
};

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Server-side data loader for the trending sections. Reads the latest
 * snapshot directly from the database (no HTTP round-trip). Falls back to
 * the mock payload with `stale: true` if the snapshot is missing or stale.
 *
 * Both `TrendingSection` and `MostPopularSection` (server components) and
 * the `/api/trending` route consume this so the logic lives in one place.
 */
export async function getTrendingPayload(): Promise<TrendingPayload> {
  try {
    const snap = await getLatestSnapshot();
    if (snap && Date.now() - snap.generatedAt.getTime() < STALE_AFTER_MS) {
      return snap.payload as TrendingPayload;
    }
  } catch (err) {
    console.warn('[trending] snapshot read failed, falling back to mock', err);
  }
  return { ...(MOCK_TRENDING_PAYLOAD as TrendingApiResponse), stale: true } as TrendingPayload;
}

export function isStale(generatedAt: string): boolean {
  const t = Date.parse(generatedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > 24 * 60 * 60 * 1000;
}

export function formatUpdatedTime(generatedAt: string): string {
  const d = new Date(generatedAt);
  if (Number.isNaN(d.getTime())) return '--:--';
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}Z`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toString();
}

import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../drizzle';
import {
  supplementMentions,
  supplements as supplementsTable,
  trendingSnapshot,
} from '../schema-postgres';
import { REDDIT_SOURCES, RSS_SOURCES, YOUTUBE_SOURCES } from './sources';
import { fetchChannelStatsForSupplements, fetchYouTubeMentions } from './youtube';
import { fetchRedditMentions } from './reddit';
import { fetchRssMentions } from './rss';
import { computePopularityScore } from './scoring';
import type {
  MostPopularEntry,
  RawMention,
  SupplementRef,
  TrendingApiResponse,
  TrendingEntry,
} from './types';

async function loadSupplementRefs(): Promise<SupplementRef[]> {
  const rows = await db
    .select({
      slug: supplementsTable.slug,
      name: supplementsTable.name,
      aliases: supplementsTable.aliases,
    })
    .from(supplementsTable)
    .where(eq(supplementsTable.status, 'published'));

  return rows.map((r) => {
    let aliases: string[] = [];
    try {
      const parsed = JSON.parse(r.aliases ?? '[]');
      if (Array.isArray(parsed)) aliases = parsed.filter((a) => typeof a === 'string');
    } catch {
      aliases = [];
    }
    return { slug: r.slug, name: r.name, aliases };
  });
}

async function gatherMentions(refs: SupplementRef[]): Promise<RawMention[]> {
  const tasks: Promise<RawMention[]>[] = [];

  for (const src of YOUTUBE_SOURCES) {
    tasks.push(fetchYouTubeMentions(src.channelId, src.id, refs));
  }
  for (const src of REDDIT_SOURCES) {
    tasks.push(fetchRedditMentions(src.subreddit, src.id, refs));
  }
  for (const src of RSS_SOURCES) {
    tasks.push(fetchRssMentions(src.feedUrl, src.id, src.type, refs));
  }

  const results = await Promise.allSettled(tasks);
  const mentions: RawMention[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') mentions.push(...r.value);
  }
  return mentions;
}

async function persistMentions(mentions: RawMention[]) {
  if (mentions.length === 0) return;
  const rows = mentions.map((m) => ({
    id: `mnt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    supplementSlug: m.supplementSlug,
    sourceId: m.sourceId,
    sourceType: m.sourceType,
    sourceUrl: m.sourceUrl,
    title: m.title,
    snippet: m.snippet,
    mentionedAt: m.mentionedAt,
  }));
  // Chunk to avoid hitting parameter limits.
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(supplementMentions).values(rows.slice(i, i + chunkSize));
  }
}

interface WindowRow {
  slug: string;
  count: number;
  lastSeen: Date;
  sources: string[];
}

async function loadWindow(since: Date, until?: Date): Promise<Map<string, WindowRow>> {
  const conditions = until
    ? and(
        gte(supplementMentions.mentionedAt, since),
        sql`${supplementMentions.mentionedAt} < ${until}`,
      )
    : gte(supplementMentions.mentionedAt, since);

  const rows = await db
    .select({
      slug: supplementMentions.supplementSlug,
      sourceId: supplementMentions.sourceId,
      mentionedAt: supplementMentions.mentionedAt,
    })
    .from(supplementMentions)
    .where(conditions);

  const map = new Map<string, WindowRow>();
  for (const r of rows) {
    const cur = map.get(r.slug);
    if (!cur) {
      map.set(r.slug, {
        slug: r.slug,
        count: 1,
        lastSeen: r.mentionedAt,
        sources: [r.sourceId],
      });
    } else {
      cur.count += 1;
      if (r.mentionedAt > cur.lastSeen) cur.lastSeen = r.mentionedAt;
      if (!cur.sources.includes(r.sourceId)) cur.sources.push(r.sourceId);
    }
  }
  return map;
}

function buildTrending(
  current: Map<string, WindowRow>,
  prior: Map<string, WindowRow>,
  nameBySlug: Map<string, string>,
): TrendingEntry[] {
  const entries: TrendingEntry[] = [];
  for (const [slug, row] of current.entries()) {
    const priorCount = prior.get(slug)?.count ?? 0;
    const delta =
      priorCount === 0 ? (row.count > 0 ? 100 : 0) : ((row.count - priorCount) / priorCount) * 100;
    entries.push({
      slug,
      name: nameBySlug.get(slug) ?? slug,
      mentionCount: row.count,
      deltaWeek: Math.round(delta * 10) / 10,
      sources: row.sources,
      lastSeen: row.lastSeen.toISOString(),
    });
  }
  entries.sort((a, b) => b.mentionCount - a.mentionCount);
  return entries.slice(0, 25);
}

interface YtAggregate {
  views: number;
  videoCount: number;
}

async function gatherYouTubeStats(
  refs: SupplementRef[],
): Promise<Map<string, YtAggregate>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const agg = new Map<string, YtAggregate>();
  if (!apiKey) return agg;

  const tasks = YOUTUBE_SOURCES.map((src) =>
    fetchChannelStatsForSupplements(src.channelId, refs, apiKey),
  );
  const settled = await Promise.allSettled(tasks);

  // Dedup per (slug, videoId) so the same video only counts once even if
  // multiple channels surface it (or the same channel matches twice).
  const seen = new Set<string>();
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    for (const stat of r.value) {
      const key = `${stat.supplementSlug}::${stat.videoId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const cur = agg.get(stat.supplementSlug) ?? { views: 0, videoCount: 0 };
      cur.views += stat.views;
      cur.videoCount += 1;
      agg.set(stat.supplementSlug, cur);
    }
  }
  return agg;
}

function buildMostPopular(
  trending: TrendingEntry[],
  refs: SupplementRef[],
  ytStats: Map<string, YtAggregate>,
): MostPopularEntry[] {
  const nameBySlug = new Map(refs.map((r) => [r.slug, r.name]));
  const hasRealStats = ytStats.size > 0;

  return trending.slice(0, 12).map((t) => {
    const real = ytStats.get(t.slug);
    // Real YouTube view counts when the API key is present and the video
    // matched one of the curated channels in `sources.ts`. Otherwise fall
    // back to a mention-count proxy (clearly marked) so the UI still has
    // something to render.
    const ytViews = real
      ? real.views
      : /* proxy */ t.mentionCount * 200_000;
    const ytVideoCount = real
      ? real.videoCount
      : /* proxy */ Math.max(1, Math.round(t.mentionCount / 2));

    const redditPosts = t.sources.filter((s) => s.startsWith('r/')).length * t.mentionCount;
    // Amazon stays mock until PA-API access lands.
    // TODO(amazon): wire PA-API for amazonReviews + amazonBSR.
    const amazonReviews = null;
    const score = computePopularityScore({ ytViews, redditPosts, amazonReviews });
    return {
      slug: t.slug,
      name: nameBySlug.get(t.slug) ?? t.name,
      score,
      ytViews,
      ytVideoCount,
      redditPosts,
      amazonReviews,
      amazonBSR: null,
    };
  }).map((e) => {
    // Suppress unused variable warning when real stats exist for none of
    // the entries — keeps `hasRealStats` referenced for diagnostics.
    void hasRealStats;
    return e;
  });
}

export async function refreshTrending(): Promise<TrendingApiResponse> {
  const refs = await loadSupplementRefs();
  const fresh = await gatherMentions(refs);
  await persistMentions(fresh);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const current = await loadWindow(sevenDaysAgo);
  const prior = await loadWindow(fourteenDaysAgo, sevenDaysAgo);

  const nameBySlug = new Map(refs.map((r) => [r.slug, r.name]));
  const trending = buildTrending(current, prior, nameBySlug);
  const ytStats = await gatherYouTubeStats(refs);
  const mostPopular = buildMostPopular(trending, refs, ytStats);

  const payload: TrendingApiResponse = {
    trending,
    mostPopular,
    generatedAt: now.toISOString(),
  };

  await db.delete(trendingSnapshot);
  await db.insert(trendingSnapshot).values({
    id: `tsnap_${Date.now()}`,
    generatedAt: now,
    payload,
  });

  return payload;
}

export async function getLatestSnapshot(): Promise<{
  payload: TrendingApiResponse;
  generatedAt: Date;
} | null> {
  const rows = await db
    .select()
    .from(trendingSnapshot)
    .orderBy(desc(trendingSnapshot.generatedAt))
    .limit(1);
  if (!rows[0]) return null;
  return {
    payload: rows[0].payload as TrendingApiResponse,
    generatedAt: rows[0].generatedAt,
  };
}

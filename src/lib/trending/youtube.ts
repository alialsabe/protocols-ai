import { buildMatcher, makeMention, matchSupplements } from './match';
import type { RawMention, SupplementRef } from './types';

const YT_API = 'https://www.googleapis.com/youtube/v3';

interface YtSearchItem {
  id: { videoId?: string };
  snippet: {
    publishedAt: string;
    title: string;
    description: string;
  };
}

interface YtVideoStatsItem {
  id: string;
  statistics?: {
    viewCount?: string;
  };
}

export interface YouTubeChannelStat {
  supplementSlug: string;
  videoId: string;
  views: number;
  publishedAt: string;
}

/**
 * Fetch real view counts for recent videos from a YouTube channel that
 * mention any of the given supplements. Returns one entry per
 * (video, matching supplement) pair so the caller can aggregate by slug.
 *
 * Gracefully returns [] if no API key, on rate limit, or on any error.
 */
export async function fetchChannelStatsForSupplements(
  channelId: string,
  supplementsList: SupplementRef[],
  apiKey: string | undefined,
): Promise<YouTubeChannelStat[]> {
  if (!apiKey) return [];

  const publishedAfter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const searchUrl =
    `${YT_API}/search?key=${apiKey}&channelId=${channelId}` +
    `&part=snippet&order=date&maxResults=50&type=video&publishedAfter=${publishedAfter}`;

  let items: YtSearchItem[] = [];
  try {
    const res = await fetch(searchUrl);
    if (!res.ok) {
      console.warn(`[trending/youtube/stats] search ${channelId} ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { items?: YtSearchItem[] };
    items = data.items ?? [];
  } catch (err) {
    console.warn(`[trending/youtube/stats] search ${channelId} failed`, err);
    return [];
  }

  const matcher = buildMatcher(supplementsList);

  // Map videoId -> { matched slugs, publishedAt }
  const matched: Array<{
    videoId: string;
    publishedAt: string;
    slugs: string[];
  }> = [];
  for (const item of items) {
    if (!item.id.videoId) continue;
    const text = `${item.snippet.title}\n${item.snippet.description}`;
    const slugs = matchSupplements(text, matcher);
    if (slugs.length === 0) continue;
    matched.push({
      videoId: item.id.videoId,
      publishedAt: item.snippet.publishedAt,
      slugs,
    });
  }

  if (matched.length === 0) return [];

  // Fetch view counts for matched video IDs (max 50 per /videos call).
  const ids = matched.map((m) => m.videoId);
  const stats = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const videosUrl =
      `${YT_API}/videos?key=${apiKey}` +
      `&part=statistics&id=${chunk.join(',')}`;
    try {
      const res = await fetch(videosUrl);
      if (!res.ok) {
        console.warn(`[trending/youtube/stats] videos ${res.status}`);
        continue;
      }
      const data = (await res.json()) as { items?: YtVideoStatsItem[] };
      for (const v of data.items ?? []) {
        const views = Number(v.statistics?.viewCount ?? '0');
        stats.set(v.id, Number.isFinite(views) ? views : 0);
      }
    } catch (err) {
      console.warn('[trending/youtube/stats] videos fetch failed', err);
    }
  }

  const out: YouTubeChannelStat[] = [];
  for (const m of matched) {
    const views = stats.get(m.videoId) ?? 0;
    for (const slug of m.slugs) {
      out.push({
        supplementSlug: slug,
        videoId: m.videoId,
        views,
        publishedAt: m.publishedAt,
      });
    }
  }
  return out;
}

export async function fetchYouTubeMentions(
  channelId: string,
  sourceId: string,
  supplementsList: SupplementRef[],
): Promise<RawMention[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn(`[trending/youtube] YOUTUBE_API_KEY missing, skipping ${sourceId}`);
    return [];
  }

  const publishedAfter = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const url =
    `${YT_API}/search?key=${apiKey}&channelId=${channelId}` +
    `&part=snippet&order=date&maxResults=50&type=video&publishedAfter=${publishedAfter}`;

  let items: YtSearchItem[] = [];
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[trending/youtube] ${sourceId} ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { items?: YtSearchItem[] };
    items = data.items ?? [];
  } catch (err) {
    console.warn(`[trending/youtube] ${sourceId} fetch failed`, err);
    return [];
  }

  const matcher = buildMatcher(supplementsList);
  const mentions: RawMention[] = [];
  for (const item of items) {
    if (!item.id.videoId) continue;
    const text = `${item.snippet.title}\n${item.snippet.description}`;
    const slugs = matchSupplements(text, matcher);
    if (slugs.length === 0) continue;
    mentions.push(
      ...makeMention({
        slugs,
        sourceId,
        sourceType: 'youtube',
        sourceUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        title: item.snippet.title,
        snippet: item.snippet.description.slice(0, 280),
        mentionedAt: new Date(item.snippet.publishedAt),
      }),
    );
  }
  return mentions;
}

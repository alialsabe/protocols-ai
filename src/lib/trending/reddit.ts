import { buildMatcher, makeMention, matchSupplements } from './match';
import type { RawMention, SupplementRef } from './types';

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    permalink: string;
    created_utc: number;
  };
}

export async function fetchRedditMentions(
  subreddit: string,
  sourceId: string,
  supplementsList: SupplementRef[],
): Promise<RawMention[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=100`;
  let posts: RedditPost[] = [];
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'stacklab-trending/1.0' },
    });
    if (!res.ok) {
      console.warn(`[trending/reddit] ${sourceId} ${res.status}`);
      return [];
    }
    const data = (await res.json()) as { data?: { children?: RedditPost[] } };
    posts = data.data?.children ?? [];
  } catch (err) {
    console.warn(`[trending/reddit] ${sourceId} fetch failed`, err);
    return [];
  }

  const matcher = buildMatcher(supplementsList);
  const mentions: RawMention[] = [];
  for (const p of posts) {
    const text = `${p.data.title}\n${p.data.selftext}`;
    const slugs = matchSupplements(text, matcher);
    if (slugs.length === 0) continue;
    mentions.push(
      ...makeMention({
        slugs,
        sourceId,
        sourceType: 'reddit',
        sourceUrl: `https://www.reddit.com${p.data.permalink}`,
        title: p.data.title,
        snippet: p.data.selftext.slice(0, 280),
        mentionedAt: new Date(p.data.created_utc * 1000),
      }),
    );
  }
  return mentions;
}

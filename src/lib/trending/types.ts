export interface TrendingEntry {
  slug: string;
  name: string;
  mentionCount: number;
  deltaWeek: number;
  sources: string[];
  lastSeen: string;
}

export interface MostPopularEntry {
  slug: string;
  name: string;
  score: number;
  ytViews: number;
  ytVideoCount: number;
  redditPosts: number;
  amazonReviews: number | null;
  amazonBSR: number | null;
}

export interface TrendingApiResponse {
  trending: TrendingEntry[];
  mostPopular: MostPopularEntry[];
  generatedAt: string;
  stale?: boolean;
}

export interface RawMention {
  supplementSlug: string;
  sourceId: string;
  sourceType: 'youtube' | 'reddit' | 'podcast' | 'blog' | 'newsletter';
  sourceUrl: string;
  title: string;
  snippet: string;
  mentionedAt: Date;
}

export interface SupplementRef {
  slug: string;
  name: string;
  aliases: string[];
}

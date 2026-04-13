export type SourceType = 'youtube' | 'reddit' | 'podcast' | 'blog' | 'newsletter';

export interface YouTubeSource {
  id: string;
  displayName: string;
  type: 'youtube';
  channelId: string;
}

export interface RedditSource {
  id: string;
  displayName: string;
  type: 'reddit';
  subreddit: string;
}

export interface RssSource {
  id: string;
  displayName: string;
  type: Exclude<SourceType, 'youtube' | 'reddit'>;
  feedUrl: string;
}

export type TrendingSource = YouTubeSource | RedditSource | RssSource;

export const YOUTUBE_SOURCES: YouTubeSource[] = [
  { id: 'huberman', displayName: 'Huberman Lab', type: 'youtube', channelId: 'UC2D2CMWXMOVWx7giW1n3LIg' },
  { id: 'rhonda-patrick', displayName: 'FoundMyFitness', type: 'youtube', channelId: 'UC3-JxOTOg-uxQS9tHHnnzAA' },
  { id: 'peter-attia', displayName: 'Peter Attia Drive', type: 'youtube', channelId: 'UC8kQS-1zSeWh66XAjbBb_Mg' },
  { id: 'bryan-johnson', displayName: 'Bryan Johnson Blueprint', type: 'youtube', channelId: 'UCEzDdKoP6vakuhRYliV2lOg' },
];

export const REDDIT_SOURCES: RedditSource[] = [
  { id: 'r/Supplements', displayName: 'r/Supplements', type: 'reddit', subreddit: 'Supplements' },
  { id: 'r/Nootropics', displayName: 'r/Nootropics', type: 'reddit', subreddit: 'Nootropics' },
];

export const RSS_SOURCES: RssSource[] = [
  { id: 'examine', displayName: 'Examine.com', type: 'newsletter', feedUrl: 'https://examine.com/feed/' },
  { id: 'bryan-johnson-blog', displayName: 'Bryan Johnson Protocol', type: 'blog', feedUrl: 'https://protocol.bryanjohnson.com/feed' },
];

export const ALL_SOURCES: TrendingSource[] = [
  ...YOUTUBE_SOURCES,
  ...REDDIT_SOURCES,
  ...RSS_SOURCES,
];

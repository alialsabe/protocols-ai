import { listTopVideoMentionsBySlug } from '@/lib/db';
import { YOUTUBE_SOURCES } from '@/lib/trending/sources';
import { SectionHeader } from './OverviewSection';

const CHANNEL_NAMES: Record<string, string> = Object.fromEntries(
  YOUTUBE_SOURCES.map((s) => [s.id, s.displayName]),
);

function channelLabel(sourceId: string): string {
  return CHANNEL_NAMES[sourceId] ?? sourceId;
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K views`;
  if (views > 0) return `${views} views`;
  return '';
}

/**
 * Top 3 most-watched YouTube videos for this supplement, from our curated
 * channel allow-list. Rendered at the very bottom of the supplement profile.
 */
export async function TopVideosSection({ slug }: { slug: string }) {
  let videos: Awaited<ReturnType<typeof listTopVideoMentionsBySlug>> = [];
  try {
    videos = await listTopVideoMentionsBySlug(slug, 3);
  } catch {
    // DB unavailable — section renders empty
  }

  // Only show if we actually have view-count data for at least one video.
  const withViews = videos.filter((v) => (v.viewCount ?? 0) > 0);
  if (withViews.length === 0) return null;

  return (
    <section style={{ marginTop: 64 }}>
      <SectionHeader label="07 / WATCH" title="Top videos by influencers" />

      <ul
        className="mt-6 grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          listStyle: 'none',
          padding: 0,
          margin: '24px 0 0',
        }}
      >
        {withViews.map((v) => (
          <li
            key={v.sourceUrl}
            style={{
              background: 'var(--paper-2)',
              border: '1px solid var(--rule)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <a
              href={v.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: 18,
                textDecoration: 'none',
                color: 'var(--ink)',
                height: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                <span
                  className="footnote"
                  style={{
                    fontSize: 10,
                    letterSpacing: '1.4px',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    fontWeight: 600,
                  }}
                >
                  {channelLabel(v.sourceId)}
                </span>
                <span className="footnote" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                  {formatViews(v.viewCount ?? 0)}
                </span>
              </div>
              <h3
                style={{
                  fontSize: 14,
                  lineHeight: 1.4,
                  fontWeight: 600,
                  margin: 0,
                  color: 'var(--ink)',
                }}
              >
                {v.title}
              </h3>
              {v.snippet ? (
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    lineHeight: 1.5,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {v.snippet}
                </p>
              ) : null}
              <span style={{ marginTop: 'auto', fontSize: 11, color: 'var(--ink-4)' }}>
                Watch on YouTube ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

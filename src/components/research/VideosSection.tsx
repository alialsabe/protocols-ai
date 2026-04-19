import { listVideoMentionsBySlug } from '@/lib/db';
import { YOUTUBE_SOURCES } from '@/lib/trending/sources';
import { SectionHeader } from './OverviewSection';

const CHANNEL_NAMES: Record<string, string> = Object.fromEntries(
  YOUTUBE_SOURCES.map((s) => [s.id, s.displayName]),
);

function channelLabel(sourceId: string): string {
  return CHANNEL_NAMES[sourceId] ?? sourceId;
}

function timeAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export async function VideosSection({ slug }: { slug: string }) {
  let videos: Awaited<ReturnType<typeof listVideoMentionsBySlug>> = [];
  try {
    videos = await listVideoMentionsBySlug(slug);
  } catch {
    // DB unavailable — section renders empty
  }

  if (videos.length === 0) return null;

  return (
    <section>
      <SectionHeader label="05 / RESEARCH MEDIA" title="Related scientific videos" />

      <ul
        className="mt-6 divide-y overflow-hidden rounded-[16px]"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
        }}
      >
        {videos.map((v, i) => (
          <li
            key={i}
            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hair)' }}
          >
            <a
              href={v.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 px-6 py-4 transition-colors"
              style={{ textDecoration: 'none' }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              {/* YouTube icon */}
              <span
                className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded"
                style={{
                  background: 'rgba(255,0,0,0.12)',
                  border: '1px solid rgba(255,0,0,0.25)',
                }}
                aria-hidden
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff4040">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.75 12.06 12.06 0 00-8.07 2.91A11.93 11.93 0 004 14.25c0 1.5.27 2.94.77 4.26a4.83 4.83 0 003.77 2.75 12.06 12.06 0 008.07-2.91A11.93 11.93 0 0020 10.25c0-1.5-.27-2.94-.77-4.26zM9.75 15.02v-6l6 3-6 3z" />
                </svg>
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                    style={{ color: 'var(--accent)' }}
                  >
                    {channelLabel(v.sourceId)}
                  </span>
                  <span
                    className="font-mono text-[10px] uppercase tracking-[1.4px]"
                    style={{ color: 'var(--fg-faint)' }}
                  >
                    · {timeAgo(v.mentionedAt)}
                  </span>
                </div>
                <h3
                  className="mt-1 text-[14px] font-semibold leading-[20px] tracking-[-0.1px] transition-colors group-hover:text-white"
                  style={{ color: 'var(--fg)' }}
                >
                  {v.title}
                </h3>
                {v.snippet ? (
                  <p
                    className="mt-1 line-clamp-2 text-[12px] leading-[18px]"
                    style={{ color: 'var(--fg-dim)' }}
                  >
                    {v.snippet}
                  </p>
                ) : null}
              </div>

              <span
                className="mt-1 flex-shrink-0 font-mono text-[13px] transition-transform group-hover:translate-x-0.5"
                style={{ color: 'var(--fg-faint)' }}
                aria-hidden
              >
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

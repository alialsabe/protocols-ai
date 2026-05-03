import { buildMatcher, makeMention, matchSupplements } from './match';
import type { RawMention, SupplementRef } from './types';

interface RssItem {
  title: string;
  link: string;
  content: string;
  pubDate: Date;
}

// Tiny fault-tolerant RSS/Atom parser to avoid pulling a runtime dep.
function parseFeed(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemBlocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) ?? [];
  for (const block of itemBlocks) {
    const title = pick(block, 'title');
    const link =
      pick(block, 'link') ||
      (block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ?? '');
    const content =
      pick(block, 'content:encoded') ||
      pick(block, 'description') ||
      pick(block, 'summary') ||
      pick(block, 'content') ||
      '';
    const pub = pick(block, 'pubDate') || pick(block, 'published') || pick(block, 'updated');
    items.push({
      title: stripTags(title),
      link: link.trim(),
      content: stripTags(content),
      pubDate: pub ? new Date(pub) : new Date(),
    });
  }
  return items;
}

function pick(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim();
}

export async function fetchRssMentions(
  feedUrl: string,
  sourceId: string,
  sourceType: 'podcast' | 'blog' | 'newsletter',
  supplementsList: SupplementRef[],
): Promise<RawMention[]> {
  let xml = '';
  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'stacklab-trending/1.0' },
    });
    if (!res.ok) {
      console.warn(`[trending/rss] ${sourceId} ${res.status}`);
      return [];
    }
    xml = await res.text();
  } catch (err) {
    console.warn(`[trending/rss] ${sourceId} fetch failed`, err);
    return [];
  }

  const items = parseFeed(xml);
  const matcher = buildMatcher(supplementsList);
  const mentions: RawMention[] = [];
  for (const item of items) {
    const text = `${item.title}\n${item.content}`;
    const slugs = matchSupplements(text, matcher);
    if (slugs.length === 0) continue;
    mentions.push(
      ...makeMention({
        slugs,
        sourceId,
        sourceType,
        sourceUrl: item.link,
        title: item.title,
        snippet: item.content.slice(0, 280),
        mentionedAt: item.pubDate,
      }),
    );
  }
  return mentions;
}

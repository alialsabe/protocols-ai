import type { RawMention, SupplementRef } from './types';

export function buildMatcher(supplements: SupplementRef[]) {
  const entries = supplements.map((s) => {
    const terms = [s.name, ...s.aliases].filter(Boolean).map(escapeRegExp);
    const pattern = new RegExp(`\\b(?:${terms.join('|')})\\b`, 'i');
    return { slug: s.slug, name: s.name, pattern };
  });
  return entries;
}

export function matchSupplements(
  text: string,
  matcher: ReturnType<typeof buildMatcher>,
): string[] {
  const hits: string[] = [];
  for (const entry of matcher) {
    if (entry.pattern.test(text)) hits.push(entry.slug);
  }
  return hits;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function makeMention(args: {
  slugs: string[];
  sourceId: string;
  sourceType: RawMention['sourceType'];
  sourceUrl: string;
  title: string;
  snippet: string;
  mentionedAt: Date;
}): RawMention[] {
  return args.slugs.map((slug) => ({
    supplementSlug: slug,
    sourceId: args.sourceId,
    sourceType: args.sourceType,
    sourceUrl: args.sourceUrl,
    title: args.title,
    snippet: args.snippet,
    mentionedAt: args.mentionedAt,
  }));
}

import type { RawMention, SupplementRef } from './types';

/**
 * Matcher entry — one term (name or alias) paired with the slug that owns it.
 * A single supplement produces multiple entries (one per term). Terms that
 * are shared across multiple slugs (e.g. the bare word "magnesium", which
 * appears as an alias on magnesium-oxide, magnesium-citrate, magnesium-malate,
 * ...) are dropped at build time: attributing an ambiguous mention to every
 * form would triple-count and drown out specific mentions, and we have no
 * signal to pick a canonical form. Dropping is conservative — a specific form
 * in the same text still matches via its own longer term.
 */
interface Term {
  slug: string;
  term: string; // lowercased
  length: number;
}

export interface Matcher {
  terms: Term[];
}

export function buildMatcher(supplements: SupplementRef[]): Matcher {
  // Count how many distinct slugs claim each term so we can drop ambiguous
  // ones (e.g. the bare "magnesium" alias shared by 12 forms).
  const slugsByTerm = new Map<string, Set<string>>();
  for (const s of supplements) {
    const raw = [s.name, ...s.aliases].filter(Boolean);
    for (const t of raw) {
      const norm = t.trim().toLowerCase();
      if (!norm) continue;
      let set = slugsByTerm.get(norm);
      if (!set) {
        set = new Set();
        slugsByTerm.set(norm, set);
      }
      set.add(s.slug);
    }
  }

  const terms: Term[] = [];
  for (const s of supplements) {
    const seen = new Set<string>();
    const raw = [s.name, ...s.aliases].filter(Boolean);
    for (const t of raw) {
      const norm = t.trim().toLowerCase();
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      // Skip ambiguous terms owned by more than one slug.
      if ((slugsByTerm.get(norm)?.size ?? 0) > 1) continue;
      terms.push({ slug: s.slug, term: norm, length: norm.length });
    }
  }

  // Longest terms first so "magnesium glycinate" wins over "glycinate" /
  // "magnesium" when scanning the same region of text.
  terms.sort((a, b) => b.length - a.length);
  return { terms };
}

export function matchSupplements(text: string, matcher: Matcher): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  // Per-character claim map so longer terms consume the span and shorter
  // overlapping terms can't double-count the same occurrence.
  const claimed = new Uint8Array(lower.length);
  const hits = new Set<string>();

  for (const { slug, term } of matcher.terms) {
    let from = 0;
    while (from <= lower.length - term.length) {
      const idx = lower.indexOf(term, from);
      if (idx === -1) break;
      const end = idx + term.length;

      // Word boundary check — term must be flanked by non-word characters
      // (or string boundaries). Prevents "magnesiumglycinate" matching.
      const before = idx === 0 ? '' : lower[idx - 1];
      const after = end >= lower.length ? '' : lower[end];
      if (isWordChar(before) || isWordChar(after)) {
        from = idx + 1;
        continue;
      }

      // Overlap check — skip if any char in the span is already claimed by
      // a longer term matched earlier.
      let overlap = false;
      for (let i = idx; i < end; i++) {
        if (claimed[i]) {
          overlap = true;
          break;
        }
      }
      if (overlap) {
        from = idx + 1;
        continue;
      }

      for (let i = idx; i < end; i++) claimed[i] = 1;
      hits.add(slug);
      from = end;
    }
  }

  return [...hits];
}

function isWordChar(ch: string): boolean {
  if (!ch) return false;
  return /[A-Za-z0-9_]/.test(ch);
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

'use client';

import { Fragment, useMemo } from 'react';
import { SupplementChip } from './SupplementChip';

interface SupplementIndex {
  slug: string;
  name: string;
  aliases?: string[];
}

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^the\s+/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '') // strip trailing "(powder)" etc
    .replace(/[.,;:!?]+$/, '')
    .trim();
}

export function MessageRenderer({
  content,
  supplements,
}: {
  content: string;
  supplements: SupplementIndex[];
}) {
  const lookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of supplements) {
      map.set(normalize(s.name), s.slug);
      if (s.aliases) {
        for (const a of s.aliases) {
          if (a) map.set(normalize(a), s.slug);
        }
      }
    }
    return map;
  }, [supplements]);

  // Regex split with a capture group returns alternating plain/token chunks.
  // Incomplete tokens like "[[Foo" stay in plain text (no close bracket, no match).
  const chunks = content.split(/\[\[([^\]]+)\]\]/);

  return (
    <Fragment>
      {chunks.map((chunk, i) => {
        if (i % 2 === 0) {
          if (!chunk) return null;
          return (
            <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
              {chunk}
            </span>
          );
        }
        const key = normalize(chunk);
        const slug = lookup.get(key);
        if (slug) {
          return <SupplementChip key={i} slug={slug} name={chunk} />;
        }
        return <span key={i}>{chunk}</span>;
      })}
    </Fragment>
  );
}

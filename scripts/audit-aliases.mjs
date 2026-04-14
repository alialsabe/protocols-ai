/**
 * audit-aliases.mjs
 *
 * Read-only audit of the `aliases` column in the `supplements` table.
 * Detects:
 *   1. Shared aliases — same term (case-insensitive) on >1 published slug.
 *   2. Cross-category aliases — alias that matches another supplement's own name/slug.
 *   3. Generic / category-term aliases — single-word or well-known catch-all terms.
 *
 * Run from repo root:
 *   node scripts/audit-aliases.mjs
 */

import { readFileSync } from 'node:fs';
import postgres from 'postgres';

// ── env ──────────────────────────────────────────────────────────────────────
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const url = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Missing SUPABASE_POOLER_URL / DATABASE_URL in .env.local');
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

// ── helpers ──────────────────────────────────────────────────────────────────
function norm(s) {
  return s.trim().toLowerCase();
}

function parseAliases(raw) {
  if (!raw || raw === '') return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((a) => typeof a === 'string' && a.trim());
    return [];
  } catch {
    return [];
  }
}

// Generic category terms that are almost never correctly an alias for a
// specific supplement. Extend this list as needed.
const GENERIC_TERMS = new Set([
  'vitamin', 'vitamin a', 'vitamin b', 'vitamin c', 'vitamin d', 'vitamin e', 'vitamin k',
  'mineral', 'minerals', 'amino', 'amino acid', 'amino acids',
  'protein', 'proteins', 'creatine', 'magnesium', 'calcium', 'zinc', 'iron',
  'omega', 'omega 3', 'omega-3', 'fish oil', 'probiotic', 'probiotics',
  'antioxidant', 'antioxidants', 'collagen', 'electrolyte', 'electrolytes',
  'adaptogen', 'adaptogens', 'nootropic', 'nootropics',
]);

// ── main ─────────────────────────────────────────────────────────────────────
try {
  const rows = await sql`
    SELECT slug, name, aliases
    FROM supplements
    WHERE status = 'published'
    ORDER BY slug
  `;

  console.log(`\nLoaded ${rows.length} published supplements.\n`);

  // Build a map of all supplement names/slugs for cross-ref detection
  const allSlugs = new Set(rows.map((r) => r.slug));
  const allNames = new Map(rows.map((r) => [norm(r.name), r.slug])); // name → slug

  // Parse aliases for each row
  const supplements = rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    nameNorm: norm(r.name),
    aliases: parseAliases(r.aliases),
  }));

  // ── 1. Shared aliases ──────────────────────────────────────────────────────
  const termToSlugs = new Map(); // normTerm → Set<slug>
  for (const s of supplements) {
    for (const alias of s.aliases) {
      const key = norm(alias);
      if (!termToSlugs.has(key)) termToSlugs.set(key, new Set());
      termToSlugs.get(key).add(s.slug);
    }
  }

  const sharedAliases = []; // { term, slugs[] }
  for (const [term, slugSet] of termToSlugs.entries()) {
    if (slugSet.size > 1) {
      sharedAliases.push({ term, slugs: [...slugSet].sort() });
    }
  }
  sharedAliases.sort((a, b) => b.slugs.length - a.slugs.length || a.term.localeCompare(b.term));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CATEGORY 1: SHARED ALIASES (same term on >1 slug)');
  console.log('═══════════════════════════════════════════════════════════════');
  if (sharedAliases.length === 0) {
    console.log('  (none)\n');
  } else {
    for (const { term, slugs } of sharedAliases) {
      console.log(`  "${term}" → [${slugs.join(', ')}]`);
    }
    console.log(`\n  Total: ${sharedAliases.length} shared terms across ${new Set(sharedAliases.flatMap((x) => x.slugs)).size} slugs\n`);
  }

  // ── 2. Cross-category aliases ──────────────────────────────────────────────
  // An alias on supplement A that is (case-insensitively) the name of another supplement B.
  const crossRef = []; // { slug, alias, matchedSlug }
  for (const s of supplements) {
    for (const alias of s.aliases) {
      const key = norm(alias);
      const matchedSlug = allNames.get(key);
      // Only flag if it matches a DIFFERENT supplement's name
      if (matchedSlug && matchedSlug !== s.slug) {
        crossRef.push({ slug: s.slug, alias, matchedSlug });
      }
      // Also flag if the alias is another supplement's slug exactly
      if (allSlugs.has(key) && key !== s.slug) {
        // Avoid duplicates already caught above
        if (!crossRef.some((x) => x.slug === s.slug && norm(x.alias) === key)) {
          crossRef.push({ slug: s.slug, alias, matchedSlug: key });
        }
      }
    }
  }
  crossRef.sort((a, b) => a.slug.localeCompare(b.slug));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CATEGORY 2: CROSS-CATEGORY ALIASES (alias = another supplement\'s name)');
  console.log('═══════════════════════════════════════════════════════════════');
  if (crossRef.length === 0) {
    console.log('  (none)\n');
  } else {
    for (const { slug, alias, matchedSlug } of crossRef) {
      console.log(`  ${slug}  →  alias "${alias}"  matches supplement "${matchedSlug}"`);
    }
    console.log(`\n  Total: ${crossRef.length} cross-ref pairs\n`);
  }

  // ── 3. Generic/category-term aliases ──────────────────────────────────────
  const genericFlags = []; // { slug, alias }
  for (const s of supplements) {
    for (const alias of s.aliases) {
      if (GENERIC_TERMS.has(norm(alias))) {
        genericFlags.push({ slug: s.slug, alias });
      }
    }
  }
  genericFlags.sort((a, b) => a.slug.localeCompare(b.slug) || a.alias.localeCompare(b.alias));

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CATEGORY 3: GENERIC / CATCH-ALL ALIASES');
  console.log('═══════════════════════════════════════════════════════════════');
  if (genericFlags.length === 0) {
    console.log('  (none)\n');
  } else {
    for (const { slug, alias } of genericFlags) {
      console.log(`  ${slug}  →  "${alias}"`);
    }
    console.log(`\n  Total: ${genericFlags.length} generic alias pairs\n`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Published supplements:    ${rows.length}`);
  console.log(`  Shared alias terms:       ${sharedAliases.length}  (affecting ${new Set(sharedAliases.flatMap((x) => x.slugs)).size} slugs)`);
  console.log(`  Cross-category pairs:     ${crossRef.length}`);
  console.log(`  Generic alias flags:      ${genericFlags.length}`);

  // Top 5 worst offenders by shared aliases
  console.log('\nTop 5 most-shared terms:');
  for (const { term, slugs } of sharedAliases.slice(0, 5)) {
    console.log(`  "${term}" shared by ${slugs.length} slugs`);
  }

  // Raw alias dump for any supplement with null/empty/malformed aliases
  const malformed = rows.filter((r) => {
    if (!r.aliases || r.aliases === '') return false; // null/empty is fine
    try { JSON.parse(r.aliases); return false; }
    catch { return true; }
  });
  if (malformed.length > 0) {
    console.log(`\nMALFORMED aliases JSON on ${malformed.length} rows:`);
    for (const r of malformed) {
      console.log(`  ${r.slug}: ${r.aliases}`);
    }
  }

} finally {
  await sql.end();
}

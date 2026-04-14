/**
 * fix-aliases.mjs
 *
 * Conservative one-shot fix for bad supplement aliases found by audit-aliases.mjs.
 * Removes clearly-wrong aliases: shared bare-category terms and cross-category entries.
 *
 * Rules applied:
 *  - NEVER deletes supplement rows. Only updates the `aliases` column.
 *  - NEVER removes a supplement's own distinctive acronym / trade-name alias.
 *  - Removes bare category words shared across many slugs (magnesium, zinc, creatine, etc.)
 *    because the trending matcher already drops shared terms — removing them from the DB
 *    keeps the data clean.
 *  - Removes specific known-wrong cross-category aliases flagged in code review:
 *      "vitamin c" from magnesium-ascorbate
 *      "creatine"  from creatine-magnesium-chelate
 *      "vitamin d" from ergocalciferol-d2 (d2 is not the canonical vitamin D)
 *  - All UPDATEs are wrapped in a single transaction (atomic).
 *
 * Run from repo root:
 *   node scripts/fix-aliases.mjs
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

function norm(s) {
  return s.trim().toLowerCase();
}

// ── Removal rules ─────────────────────────────────────────────────────────────
// Each rule: { slug, remove: string[] }  — case-insensitive match.
//
// Strategy:
//   • All aliases shared by ≥ 3 slugs are removed from every slug that carries them.
//     (These are clearly category terms, not identifiers. The matcher already
//     discards shared terms at runtime, so removing from DB is housekeeping.)
//   • "vitamin c" is removed from non-vitamin-c slugs (magnesium-ascorbate).
//   • "vitamin d" is removed from ergocalciferol-d2 (d3 is the canonical D).
//   • "creatine" is removed from creatine-magnesium-chelate (specific compound,
//     not generic creatine).
//   • "boron" is removed from boron-glycinate and calcium-fructoborate because
//     there is a standalone `boron` supplement — those aliases shadow it.
//
// Terms shared by exactly 2 slugs that are plausibly legitimate group labels
// (e.g. "alpha-lipoic acid", "coq10", "berberine", "glutathione", "omega-3")
// are LEFT ALONE to be conservative — one of the two slugs may own the term.
// ─────────────────────────────────────────────────────────────────────────────

// Terms shared by ≥3 slugs — remove from ALL slugs that carry them.
const SHARED_REMOVE = new Set([
  'magnesium',      // 11 slugs
  'enzymes',        // 9  slugs
  'zinc',           // 8  slugs
  'calcium',        // 5  slugs
  'iron',           // 5  slugs
  'joint support',  // 5  slugs
  'probiotics',     // 5  slugs
  'racetams',       // 5  slugs
  'turmeric',       // 5  slugs
  'vitamin b3',     // 5  slugs
  'vitamin c',      // 5  slugs  (also catches magnesium-ascorbate specifically)
  'ashwagandha',    // 4  slugs
  'carnitine',      // 4  slugs
  'copper',         // 4  slugs
  'creatine',       // 4  slugs
  'plant protein',  // 4  slugs
  'potassium',      // 4  slugs
  'selenium',       // 4  slugs
  'vitamin a',      // 4  slugs
  'vitamin b1',     // 4  slugs
  'vitamin b12',    // 4  slugs
  'vitamin e',      // 4  slugs
  'antioxidant',    // 3  slugs
  'arginine',       // 3  slugs
  'boron',          // 3  slugs  (also a standalone supplement)
  'choline',        // 3  slugs
  'collagen',       // 3  slugs
  'ginseng',        // 3  slugs
  'iodine',         // 3  slugs
  'manganese',      // 3  slugs
  'omega-3',        // 3  slugs
  'omega-6',        // 3  slugs
  'prebiotics',     // 3  slugs
  'vitamin b9',     // 3  slugs
  'whey',           // 3  slugs
]);

// Targeted removals for specific (slug, alias) pairs not already covered above.
// These are cases where the alias is shared by exactly 2 slugs but one slug
// should not carry it (cross-category or clearly wrong).
const TARGETED_REMOVE = [
  // "vitamin d" on ergocalciferol-d2: vitamin-d3 is the canonical owner.
  { slug: 'ergocalciferol-d2', remove: ['vitamin d'] },
];

// ── main ─────────────────────────────────────────────────────────────────────
try {
  const rows = await sql`
    SELECT slug, aliases
    FROM supplements
    WHERE status = 'published'
    ORDER BY slug
  `;

  console.log(`Loaded ${rows.length} published supplements.\n`);

  // Build list of changes.
  const changes = []; // { slug, before, after }

  for (const row of rows) {
    const before = parseAliases(row.aliases);
    const beforeSet = before.map(norm);

    // Determine which aliases to drop.
    const drop = new Set();

    // 1. Drop anything in SHARED_REMOVE
    for (let i = 0; i < before.length; i++) {
      if (SHARED_REMOVE.has(beforeSet[i])) drop.add(i);
    }

    // 2. Drop targeted
    for (const rule of TARGETED_REMOVE) {
      if (rule.slug !== row.slug) continue;
      for (let i = 0; i < before.length; i++) {
        if (rule.remove.some((t) => norm(t) === beforeSet[i])) drop.add(i);
      }
    }

    if (drop.size === 0) continue;

    const after = before.filter((_, i) => !drop.has(i));
    changes.push({ slug: row.slug, before, after, dropped: [...drop].map((i) => before[i]) });
  }

  if (changes.length === 0) {
    console.log('Nothing to fix.');
    process.exit(0);
  }

  // Log the plan.
  console.log('Changes to apply:\n');
  for (const c of changes) {
    console.log(`  ${c.slug}`);
    console.log(`    REMOVE: ${JSON.stringify(c.dropped)}`);
    console.log(`    BEFORE: ${JSON.stringify(c.before)}`);
    console.log(`    AFTER:  ${JSON.stringify(c.after)}`);
    console.log('');
  }
  console.log(`Total: ${changes.length} rows to update, ${changes.reduce((n, c) => n + c.dropped.length, 0)} aliases removed.\n`);

  // Apply atomically.
  console.log('Applying in a transaction...');
  await sql.begin(async (tx) => {
    for (const c of changes) {
      await tx`
        UPDATE supplements
        SET aliases = ${JSON.stringify(c.after)}
        WHERE slug = ${c.slug}
          AND status = 'published'
      `;
    }
  });

  console.log('Done. All updates committed.\n');

} finally {
  await sql.end();
}

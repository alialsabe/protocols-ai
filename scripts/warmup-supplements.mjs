/**
 * Warmup script — triggers LLM fallback for supplements missing science/dosage data.
 * Run with: node_modules/.bin/tsx scripts/warmup-supplements.mjs
 *
 * Finds supplements missing science or dosage using a single efficient JOIN,
 * then calls lookupSupplement() for the top 30 by popularity score.
 */

// loadLocalEnv() is called inside drizzle.ts when the DB is first accessed,
// so no manual env loading needed here.

import { isNull, eq } from 'drizzle-orm';
import { db } from '../src/lib/drizzle';
import {
  supplements,
  supplementScience,
  supplementDosage,
} from '../src/lib/schema-postgres';
import { lookupSupplement } from '../src/lib/supplement-lookup';

const TOP_N = Number(process.env.WARMUP_LIMIT ?? process.argv[2] ?? 30);
const DELAY_MS = Number(process.env.WARMUP_DELAY_MS ?? 1500);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Querying DB for supplements missing science or dosage data...');

  // Single efficient query: LEFT JOIN to find supplements with no science row
  // Then separately check dosage. Using raw SQL via drizzle for efficiency.
  const missingScience = await db
    .select({
      id: supplements.id,
      name: supplements.name,
      slug: supplements.slug,
      popularityScore: supplements.popularityScore,
    })
    .from(supplements)
    .leftJoin(supplementScience, eq(supplements.id, supplementScience.supplementId))
    .where(isNull(supplementScience.supplementId))
    .orderBy(supplements.popularityScore);

  const missingDosage = await db
    .select({
      id: supplements.id,
      name: supplements.name,
      slug: supplements.slug,
      popularityScore: supplements.popularityScore,
    })
    .from(supplements)
    .leftJoin(supplementDosage, eq(supplements.id, supplementDosage.supplementId))
    .where(isNull(supplementDosage.supplementId))
    .orderBy(supplements.popularityScore);

  // Merge: union of missing science + missing dosage, deduplicated
  const seenIds = new Set();
  const candidates = [];
  for (const row of [...missingScience, ...missingDosage]) {
    if (!seenIds.has(row.id)) {
      seenIds.add(row.id);
      candidates.push(row);
    }
  }

  // Sort by popularity descending
  candidates.sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0));

  const targets = candidates.slice(0, TOP_N);
  console.log(`Found ${candidates.length} supplements missing data. Processing top ${targets.length} by popularity.\n`);

  if (targets.length === 0) {
    console.log('All supplements already have science and dosage data. Nothing to do.');
    return;
  }

  const results = { ok: [], partial: [], error: [] };

  for (let i = 0; i < targets.length; i++) {
    const supp = targets[i];
    const label = `[${i + 1}/${targets.length}] ${supp.name} (score=${supp.popularityScore})`;
    process.stdout.write(`${label} ... `);

    try {
      const report = await lookupSupplement(supp.name);
      if (!report) {
        console.log('NOT FOUND in lookup');
        results.error.push({ name: supp.name, reason: 'lookup returned null' });
      } else {
        const hasScience = Boolean(report.science);
        const hasDosage = Boolean(report.dosage);
        if (hasScience && hasDosage) {
          console.log('ok (science + dosage)');
          results.ok.push(supp.name);
        } else {
          const missing = [!hasScience && 'science', !hasDosage && 'dosage'].filter(Boolean).join(', ');
          console.log(`partial — still missing: ${missing}`);
          results.partial.push({ name: supp.name, missing });
        }
      }
    } catch (err) {
      console.log(`ERROR: ${err?.message ?? err}`);
      results.error.push({ name: supp.name, reason: String(err?.message ?? err) });
    }

    if (i < targets.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n=== WARMUP SUMMARY ===');
  console.log(`OK (science + dosage generated): ${results.ok.length}`);
  results.ok.forEach((name) => console.log(`  + ${name}`));

  if (results.partial.length > 0) {
    console.log(`\nPartial (generated but still missing something): ${results.partial.length}`);
    results.partial.forEach(({ name, missing }) => console.log(`  ~ ${name}: missing ${missing}`));
  }

  if (results.error.length > 0) {
    console.log(`\nErrors: ${results.error.length}`);
    results.error.forEach(({ name, reason }) => console.log(`  - ${name}: ${reason}`));
  }

  console.log(`\nTotal candidates found: ${candidates.length} | Processed: ${targets.length}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

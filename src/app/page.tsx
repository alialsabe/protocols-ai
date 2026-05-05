import { sql } from 'drizzle-orm';
import {
  clinicalStudies,
  supplements as supplementsTable,
  supplementDosage,
} from '@/lib/schema-postgres';
import { db } from '@/lib/drizzle';
import { unstable_cache } from 'next/cache';
import { HomepageClient, type CompoundRow } from '@/components/HomepageClient';

export const dynamic = 'force-dynamic';

const loadCompounds = unstable_cache(
  async (): Promise<CompoundRow[]> => {
    try {
      // Fetch supplements and dosage rows separately, then join in memory.
      // The previous LEFT JOIN duplicated supplements that have multiple
      // supplement_dosage rows (e.g. spermidine-synthetic, kelp-extract have
      // 4 each), inflating compounds.length and every category count.
      const rows = await db
        .select({
          id: supplementsTable.id,
          slug: supplementsTable.slug,
          name: supplementsTable.name,
          category: supplementsTable.category,
          aliases: supplementsTable.aliases,
          popularityScore: supplementsTable.popularityScore,
        })
        .from(supplementsTable)
        .where(sql`${supplementsTable.status} = 'published'`)
        .orderBy(sql`${supplementsTable.popularityScore} desc`);

      const dosageRows = await db
        .select({
          supplementId: supplementDosage.supplementId,
          maintenance: supplementDosage.maintenance,
        })
        .from(supplementDosage);

      const dosageMap = new Map<string, string>();
      for (const d of dosageRows) {
        if (!dosageMap.has(d.supplementId)) dosageMap.set(d.supplementId, d.maintenance);
      }

      // Study count per supplement — keyed by supplement.id
      const studyCounts = await db
        .select({
          supplementId: clinicalStudies.supplementId,
          cnt: sql<number>`count(*)::int`,
        })
        .from(clinicalStudies)
        .groupBy(clinicalStudies.supplementId);

      const countMap = new Map(studyCounts.map((r) => [r.supplementId, r.cnt]));

      return rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        category: r.category,
        aliases: r.aliases,
        maintenance: dosageMap.get(r.id) ?? null,
        studyCount: countMap.get(r.id) ?? 0,
      }));
    } catch (err) {
      console.error('[home/compounds] query failed', err);
      return [];
    }
  },
  ['homepage-compounds'],
  { revalidate: 3600 },
);

const loadCounts = unstable_cache(
  async () => {
    try {
      const [r1, r2] = await Promise.all([
        db.select({ c: sql<number>`count(*)::int` }).from(supplementsTable).where(sql`status = 'published'`),
        db.select({ c: sql<number>`count(*)::int` }).from(clinicalStudies),
      ]);
      return { compounds: Number(r1[0]?.c ?? 0), studies: Number(r2[0]?.c ?? 0) };
    } catch {
      return { compounds: 0, studies: 0 };
    }
  },
  ['ledger-counts-v3'],
  { revalidate: 3600 },
);

export default async function HomePage() {
  const [compounds, counts] = await Promise.all([loadCompounds(), loadCounts()]);

  return (
    <HomepageClient
      compounds={compounds}
      totalCompounds={counts.compounds}
      totalStudies={counts.studies}
    />
  );
}

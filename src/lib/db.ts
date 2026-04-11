import { eq, or, sql } from 'drizzle-orm';
import { db } from './drizzle';
import {
  supplements,
  supplementScience,
  supplementSocial,
  supplementSentiment,
  supplementDosage,
  supplementScheduleRules,
  supplementConflicts,
  medicineInteractions,
  affiliateOptions,
  fallbackQueue,
  companionStacks,
  supplementTags,
  supplementTypes,
  clinicalStudies,
} from './schema-postgres';
import { isProductionPostgresRuntime } from './database-env';

export { isProductionPostgresRuntime };

// ── lifecycle ──────────────────────────────────────────────────────────

export async function getDatabaseMode() {
  return {
    dialect: 'postgres' as const,
    databaseUrlConfigured: true,
    databasePath: null,
  };
}

export async function seedDatabaseIfEmpty() {
  // No-op — seeding handled by db:seed script
}

export async function resetAndSeedDatabase() {
  return seedDatabaseIfEmpty();
}

export async function closeDatabaseConnections() {
  // Connection pool handles cleanup automatically
}

// ── supplement lookups ─────────────────────────────────────────────────

export async function getSupplementBySlug(slug: string) {
  const row = await db
    .select({
      id: supplements.id,
      slug: supplements.slug,
      name: supplements.name,
      popularityScore: supplements.popularityScore,
      baseCompound: supplements.baseCompound,
      specificForm: supplements.specificForm,
    })
    .from(supplements)
    .where(eq(supplements.slug, slug))
    .limit(1);
  return row[0] ?? null;
}

export async function getSupplementNameById(id: string) {
  const row = await db
    .select({ name: supplements.name })
    .from(supplements)
    .where(eq(supplements.id, id))
    .limit(1);
  return row[0] ?? null;
}

export async function listSupplementsBasic() {
  return db
    .select({
      id: supplements.id,
      slug: supplements.slug,
      name: supplements.name,
      aliases: supplements.aliases,
      category: supplements.category,
      baseCompound: supplements.baseCompound,
      specificForm: supplements.specificForm,
      popularityScore: supplements.popularityScore,
    })
    .from(supplements)
    .where(eq(supplements.status, 'published'));
}

export async function listProtocolsSupplements() {
  return db
    .select({
      id: supplements.id,
      slug: supplements.slug,
      name: supplements.name,
      category: supplements.category,
      baseCompound: supplements.baseCompound,
      specificForm: supplements.specificForm,
      popularityScore: supplements.popularityScore,
    })
    .from(supplements)
    .where(eq(supplements.status, 'published'));
}

// ── supplement types ──────────────────────────────────────────────────

export async function listTypesBySupplementId(supplementId: string) {
  return db
    .select({
      typeName: supplementTypes.typeName,
    })
    .from(supplementTypes)
    .where(eq(supplementTypes.supplementId, supplementId));
}

export async function listAllTypes() {
  return db
    .select({
      typeName: supplementTypes.typeName,
      supplementId: supplementTypes.supplementId,
    })
    .from(supplementTypes);
}

// ── clinical studies ──────────────────────────────────────────────────

export async function listClinicalStudiesBySupplementId(supplementId: string) {
  return db
    .select()
    .from(clinicalStudies)
    .where(eq(clinicalStudies.supplementId, supplementId));
}

export async function getClinicalStudyCategoryCounts(supplementId: string) {
  const rows = await db
    .select({
      category: clinicalStudies.category,
      count: sql<number>`count(*)::int`,
    })
    .from(clinicalStudies)
    .where(eq(clinicalStudies.supplementId, supplementId))
    .groupBy(clinicalStudies.category);
  return rows;
}

export async function listTagsBySupplementId(supplementId: string) {
  return db
    .select({
      tag: supplementTags.tag,
      tagType: supplementTags.tagType,
    })
    .from(supplementTags)
    .where(eq(supplementTags.supplementId, supplementId));
}

export async function listAllTags() {
  return db
    .select({
      tag: supplementTags.tag,
      tagType: supplementTags.tagType,
      supplementId: supplementTags.supplementId,
    })
    .from(supplementTags);
}

export async function listAllStudyCounts() {
  return db
    .select({
      supplementId: clinicalStudies.supplementId,
      count: sql<number>`count(*)::int`,
    })
    .from(clinicalStudies)
    .groupBy(clinicalStudies.supplementId);
}

// ── supplement bundle (science + social + sentiment + dosage + schedule + affiliate) ──

export async function getSupplementBundleById(supplementId: string) {
  // Sequential queries — Supabase free tier cancels statements when too many run in parallel
  const scienceRow   = await db.select().from(supplementScience).where(eq(supplementScience.supplementId, supplementId)).limit(1);
  const socialRow    = await db.select().from(supplementSocial).where(eq(supplementSocial.supplementId, supplementId)).limit(1);
  const sentimentRow = await db.select().from(supplementSentiment).where(eq(supplementSentiment.supplementId, supplementId)).limit(1);
  const dosageRow    = await db.select().from(supplementDosage).where(eq(supplementDosage.supplementId, supplementId)).limit(1);
  const scheduleRow  = await db.select().from(supplementScheduleRules).where(eq(supplementScheduleRules.supplementId, supplementId)).limit(1);
  const affiliateRow = await db.select().from(affiliateOptions).where(eq(affiliateOptions.supplementId, supplementId)).limit(1);

  if (!scienceRow[0] && !socialRow[0] && !sentimentRow[0] && !dosageRow[0]) {
    return null;
  }

  return {
    science: scienceRow[0] ?? null,
    social: socialRow[0] ?? null,
    sentiment: sentimentRow[0] ?? null,
    dosage: dosageRow[0] ?? null,
    schedule: scheduleRow[0] ?? null,
    affiliate: affiliateRow[0]
      ? { ...affiliateRow[0], isActive: affiliateRow[0].isActive === 1 }
      : null,
  };
}

// ── schedule rules ─────────────────────────────────────────────────────

export async function getScheduleRuleBySupplementId(supplementId?: string) {
  if (!supplementId) return null;
  const row = await db
    .select()
    .from(supplementScheduleRules)
    .where(eq(supplementScheduleRules.supplementId, supplementId))
    .limit(1);
  return row[0] ?? null;
}

// ── conflicts ──────────────────────────────────────────────────────────

export async function listConflicts() {
  return db.select().from(supplementConflicts);
}

// ── medicine interactions ──────────────────────────────────────────────

export async function listMedicineInteractionsBySupplementId(supplementId: string) {
  return db
    .select()
    .from(medicineInteractions)
    .where(eq(medicineInteractions.supplementId, supplementId));
}

// ── companion stacks ───────────────────────────────────────────────────

export async function listCompanionStacksBySupplementId(supplementId: string) {
  return db
    .select()
    .from(companionStacks)
    .where(eq(companionStacks.supplementId, supplementId));
}

// ── fallback queue ─────────────────────────────────────────────────────

export async function logFallbackMissRecord(query: string, normalizedQuery: string): Promise<string> {
  const now = new Date().toISOString();
  const id = `fbq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Upsert: increment hit count if exists, otherwise insert
  const existing = await db
    .select({ id: fallbackQueue.id, hitCount: fallbackQueue.hitCount })
    .from(fallbackQueue)
    .where(eq(fallbackQueue.normalizedQuery, normalizedQuery))
    .limit(1);

  if (existing[0]) {
    await db
      .update(fallbackQueue)
      .set({
        lastSeenAt: now,
        hitCount: existing[0].hitCount + 1,
      })
      .where(eq(fallbackQueue.id, existing[0].id));
    return existing[0].id;
  }

  await db.insert(fallbackQueue).values({
    id,
    query,
    normalizedQuery,
    firstSeenAt: now,
    lastSeenAt: now,
    hitCount: 1,
    status: 'pending',
  });

  return id;
}

export async function logFallbackMiss(query: string, normalizedQuery: string): Promise<string> {
  return logFallbackMissRecord(query, normalizedQuery);
}

export async function listFallbackQueueByStatus(status?: string) {
  if (!status) {
    return db.select().from(fallbackQueue);
  }
  return db
    .select()
    .from(fallbackQueue)
    .where(eq(fallbackQueue.status, status));
}

export async function updateFallbackQueueItem(
  id: string | undefined,
  changes: { status?: string; reviewerNotes?: string } | undefined,
): Promise<number> {
  if (!id || !changes) return 0;

  const setClauses: Record<string, string> = {};
  if (changes.status !== undefined) setClauses.status = changes.status;
  if (changes.reviewerNotes !== undefined) setClauses.reviewerNotes = changes.reviewerNotes;

  if (Object.keys(setClauses).length === 0) return 0;

  const result = await db
    .update(fallbackQueue)
    .set(setClauses)
    .where(eq(fallbackQueue.id, id));

  return result.length ?? 1;
}

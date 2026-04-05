import fs from 'node:fs';
import path from 'node:path';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import type { Sql } from 'postgres';
import { desc, eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as sqliteSchema from './schema';
import * as postgresSchema from './schema-postgres';
import {
  affiliateData,
  companionData,
  conflictsData,
  dosageData,
  medicineInteractionsData,
  scheduleRulesData,
  scienceData,
  sentimentData,
  socialData,
  supplementsData,
} from './seed-data';

export type DatabaseDialect = 'sqlite' | 'postgres';

type SqliteDb = BetterSQLite3Database<typeof sqliteSchema>;
type PostgresDb = PostgresJsDatabase<typeof postgresSchema>;
type AppDb = SqliteDb | PostgresDb;
type AppSchema = typeof sqliteSchema | typeof postgresSchema;
type RawDb = BetterSqliteDatabase | unknown;

type SqliteQueryAll<T> = { all: () => T[] };
type SqliteQueryGet<T> = { get: () => T | undefined };
type PostgresLimitedQuery<T> = Promise<T[]> & { limit: (count: number) => Promise<T[]> };

type DatabaseContext = {
  dialect: DatabaseDialect;
  db: AppDb;
  schema: AppSchema;
  raw: RawDb;
};

declare global {
  var __protocolsDbContext: Promise<DatabaseContext> | undefined;
  var __protocolsDbReady: Promise<void> | undefined;
}

function getDatabaseDialect(): DatabaseDialect {
  const explicit = process.env.DATABASE_DIALECT?.trim().toLowerCase();

  if (explicit === 'postgres' || explicit === 'postgresql') {
    return 'postgres';
  }

  if (explicit === 'sqlite') {
    return 'sqlite';
  }

  if (process.env.DATABASE_URL) {
    return 'postgres';
  }

  return 'sqlite';
}

function getSqlitePath(): string {
  return process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'protocols.db');
}

function shouldAutoBootstrap(dialect: DatabaseDialect): boolean {
  if (process.env.DB_AUTO_BOOTSTRAP != null) {
    return process.env.DB_AUTO_BOOTSTRAP === 'true';
  }

  return dialect === 'sqlite' || process.env.NODE_ENV !== 'production';
}

function getPostgresSslMode(): 'require' | undefined {
  if (process.env.POSTGRES_SSL === 'disable') {
    return undefined;
  }

  return 'require';
}

async function createDatabaseContext(): Promise<DatabaseContext> {
  const dialect = getDatabaseDialect();

  if (dialect === 'sqlite') {
    const sqlitePath = getSqlitePath();
    const dataDir = path.dirname(sqlitePath);

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const Database = (await import('better-sqlite3')).default;
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const raw = new Database(sqlitePath);

    raw.pragma('journal_mode = WAL');
    raw.pragma('foreign_keys = ON');

    return {
      dialect,
      db: drizzle(raw, { schema: sqliteSchema }),
      schema: sqliteSchema,
      raw,
    };
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required when DATABASE_DIALECT=postgres.');
  }

  const postgres = (await import('postgres')).default;
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const raw = postgres(databaseUrl, {
    ssl: getPostgresSslMode(),
    prepare: false,
    max: Number(process.env.POSTGRES_MAX_CONNECTIONS || 1),
    idle_timeout: 20,
    connect_timeout: 15,
  });

  return {
    dialect,
    db: drizzle(raw, { schema: postgresSchema }),
    schema: postgresSchema,
    raw,
  };
}

async function getContext(): Promise<DatabaseContext> {
  if (!globalThis.__protocolsDbContext) {
    globalThis.__protocolsDbContext = createDatabaseContext();
  }

  return globalThis.__protocolsDbContext;
}

const SQLITE_BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS supplements (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS supplement_science (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  summary TEXT NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  findings TEXT NOT NULL DEFAULT '[]',
  interactions TEXT NOT NULL DEFAULT '[]',
  side_effects TEXT NOT NULL DEFAULT '[]',
  medicine_interactions TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS supplement_social (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  transcript_summary TEXT NOT NULL DEFAULT '',
  anecdotes TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS supplement_sentiment (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  positive REAL NOT NULL DEFAULT 0,
  neutral REAL NOT NULL DEFAULT 0,
  negative REAL NOT NULL DEFAULT 0,
  top_positive TEXT NOT NULL DEFAULT '',
  top_negative TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS supplement_dosage (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  loading TEXT,
  maintenance TEXT NOT NULL,
  formula TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'mg',
  per_kg_factor REAL
);
CREATE TABLE IF NOT EXISTS schedule_rules (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  preferred_time TEXT NOT NULL DEFAULT 'any',
  with_food INTEGER NOT NULL DEFAULT 0,
  food_type TEXT,
  empty_stomach INTEGER NOT NULL DEFAULT 0,
  fat_soluble INTEGER NOT NULL DEFAULT 0,
  stimulant INTEGER NOT NULL DEFAULT 0,
  sedating INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS conflicts (
  id TEXT PRIMARY KEY,
  supplement_a_id TEXT NOT NULL REFERENCES supplements(id),
  supplement_b_id TEXT NOT NULL REFERENCES supplements(id),
  conflict_type TEXT NOT NULL,
  min_spacing_hours REAL,
  mechanism TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'low'
);
CREATE TABLE IF NOT EXISTS medicine_interactions (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  medicine_name TEXT NOT NULL,
  medicine_class TEXT,
  severity TEXT NOT NULL DEFAULT 'low',
  mechanism TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL DEFAULT '',
  source TEXT
);
CREATE TABLE IF NOT EXISTS affiliate_options (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  partner_name TEXT NOT NULL,
  partner_type TEXT NOT NULL DEFAULT 'retailer',
  product_name TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  price_display TEXT,
  product_form TEXT NOT NULL DEFAULT 'capsule',
  trust_score INTEGER NOT NULL DEFAULT 5,
  priority_score INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  compliance_status TEXT NOT NULL DEFAULT 'pending',
  country_code TEXT NOT NULL DEFAULT 'US',
  last_verified_at TEXT
);
CREATE TABLE IF NOT EXISTS companion_stacks (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  companion_supplement_id TEXT NOT NULL REFERENCES supplements(id),
  why TEXT NOT NULL DEFAULT 'Commonly paired in user protocols.',
  strength TEXT NOT NULL DEFAULT 'common',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS fallback_queue (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL UNIQUE,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT
);
`;

const POSTGRES_BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS supplements (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS supplement_science (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  summary TEXT NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  findings TEXT NOT NULL DEFAULT '[]',
  interactions TEXT NOT NULL DEFAULT '[]',
  side_effects TEXT NOT NULL DEFAULT '[]',
  medicine_interactions TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS supplement_social (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  transcript_summary TEXT NOT NULL DEFAULT '',
  anecdotes TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS supplement_sentiment (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  positive DOUBLE PRECISION NOT NULL DEFAULT 0,
  neutral DOUBLE PRECISION NOT NULL DEFAULT 0,
  negative DOUBLE PRECISION NOT NULL DEFAULT 0,
  top_positive TEXT NOT NULL DEFAULT '',
  top_negative TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS supplement_dosage (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  loading TEXT,
  maintenance TEXT NOT NULL,
  formula TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'mg',
  per_kg_factor DOUBLE PRECISION
);
CREATE TABLE IF NOT EXISTS schedule_rules (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  preferred_time TEXT NOT NULL DEFAULT 'any',
  with_food BOOLEAN NOT NULL DEFAULT FALSE,
  food_type TEXT,
  empty_stomach BOOLEAN NOT NULL DEFAULT FALSE,
  fat_soluble BOOLEAN NOT NULL DEFAULT FALSE,
  stimulant BOOLEAN NOT NULL DEFAULT FALSE,
  sedating BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE IF NOT EXISTS conflicts (
  id TEXT PRIMARY KEY,
  supplement_a_id TEXT NOT NULL REFERENCES supplements(id),
  supplement_b_id TEXT NOT NULL REFERENCES supplements(id),
  conflict_type TEXT NOT NULL,
  min_spacing_hours DOUBLE PRECISION,
  mechanism TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'low'
);
CREATE TABLE IF NOT EXISTS medicine_interactions (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  medicine_name TEXT NOT NULL,
  medicine_class TEXT,
  severity TEXT NOT NULL DEFAULT 'low',
  mechanism TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL DEFAULT '',
  source TEXT
);
CREATE TABLE IF NOT EXISTS affiliate_options (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  partner_name TEXT NOT NULL,
  partner_type TEXT NOT NULL DEFAULT 'retailer',
  product_name TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  price_display TEXT,
  product_form TEXT NOT NULL DEFAULT 'capsule',
  trust_score INTEGER NOT NULL DEFAULT 5,
  priority_score INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  compliance_status TEXT NOT NULL DEFAULT 'pending',
  country_code TEXT NOT NULL DEFAULT 'US',
  last_verified_at TEXT
);
CREATE TABLE IF NOT EXISTS companion_stacks (
  id TEXT PRIMARY KEY,
  supplement_id TEXT NOT NULL REFERENCES supplements(id),
  companion_supplement_id TEXT NOT NULL REFERENCES supplements(id),
  why TEXT NOT NULL DEFAULT 'Commonly paired in user protocols.',
  strength TEXT NOT NULL DEFAULT 'common',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS fallback_queue (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL UNIQUE,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT
);
`;

async function executeBootstrapSql(ctx: DatabaseContext) {
  if (ctx.dialect === 'sqlite') {
    (ctx.raw as BetterSqliteDatabase).exec(SQLITE_BOOTSTRAP_SQL);
    return;
  }

  await ((ctx.raw as unknown as { unsafe: (sql: string) => Promise<void> })).unsafe(POSTGRES_BOOTSTRAP_SQL);
}

async function getSupplementCount(ctx: DatabaseContext): Promise<number> {
  if (ctx.dialect === 'sqlite') {
    const row = (ctx.raw as BetterSqliteDatabase).prepare('SELECT COUNT(*) AS count FROM supplements').get() as { count?: number } | undefined;
    return row?.count ?? 0;
  }

  const rows = await ((ctx.raw as unknown as { unsafe: (sql: string) => Promise<Array<{ count: number }>> })).unsafe(
    'SELECT COUNT(*) AS count FROM supplements',
  );
  return Number(rows[0]?.count ?? 0);
}

async function seedDatabase(ctx: DatabaseContext) {
  if (ctx.dialect === 'sqlite') {
    (ctx.db as SqliteDb).transaction((tx) => {
      tx.insert(ctx.schema.supplements).values(supplementsData).run();
      tx.insert(ctx.schema.supplementScience).values(scienceData).run();
      tx.insert(ctx.schema.supplementSocial).values(socialData).run();
      tx.insert(ctx.schema.supplementSentiment).values(sentimentData).run();
      tx.insert(ctx.schema.supplementDosage).values(dosageData).run();
      tx.insert(ctx.schema.supplementScheduleRules).values(scheduleRulesData).run();
      tx.insert(ctx.schema.supplementConflicts).values(conflictsData).run();
      tx.insert(ctx.schema.medicineInteractions).values(medicineInteractionsData).run();
      tx.insert(ctx.schema.affiliateOptions).values(affiliateData).run();
      tx.insert(ctx.schema.companionStacks).values(companionData).run();
    });

    return;
  }

  const pgTx = ctx.db as unknown as PostgresDb;
  await pgTx.transaction(async (tx) => {
    await (tx as any).insert(ctx.schema.supplements).values(supplementsData);
    await (tx as any).insert(ctx.schema.supplementScience).values(scienceData);
    await (tx as any).insert(ctx.schema.supplementSocial).values(socialData);
    await (tx as any).insert(ctx.schema.supplementSentiment).values(sentimentData);
    await (tx as any).insert(ctx.schema.supplementDosage).values(dosageData);
    await (tx as any).insert(ctx.schema.supplementScheduleRules).values(scheduleRulesData);
    await (tx as any).insert(ctx.schema.supplementConflicts).values(conflictsData);
    await (tx as any).insert(ctx.schema.medicineInteractions).values(medicineInteractionsData);
    await (tx as any).insert(ctx.schema.affiliateOptions).values(affiliateData);
    await (tx as any).insert(ctx.schema.companionStacks).values(companionData);
  });
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!globalThis.__protocolsDbReady) {
    globalThis.__protocolsDbReady = (async () => {
      const ctx = await getContext();

      if (!shouldAutoBootstrap(ctx.dialect)) {
        return;
      }

      await executeBootstrapSql(ctx);

      if ((await getSupplementCount(ctx)) === 0) {
        await seedDatabase(ctx);
      }
    })();
  }

  return globalThis.__protocolsDbReady;
}

async function selectAll<T>(ctx: DatabaseContext, builder: SqliteQueryAll<T> | Promise<T[]>) {
  return ctx.dialect === 'sqlite'
    ? (builder as SqliteQueryAll<T>).all()
    : await (builder as Promise<T[]>);
}

async function selectFirst<T>(ctx: DatabaseContext, builder: SqliteQueryGet<T> | PostgresLimitedQuery<T>) {
  if (ctx.dialect === 'sqlite') {
    return (builder as SqliteQueryGet<T>).get() ?? null;
  }

  const rows = await (builder as PostgresLimitedQuery<T>).limit(1);
  return rows[0] ?? null;
}

function listAllSupplements(ctx: DatabaseContext) {
  if (ctx.dialect === 'sqlite') {
    return (ctx.db as SqliteDb).select().from(ctx.schema.supplements);
  }

  return Promise.resolve(
    (ctx.db as PostgresDb).select().from(ctx.schema.supplements as never) as unknown as Array<Record<string, unknown>>,
  );
}

export async function listSupplementsBasic(): Promise<Array<{ id: string; slug: string; name: string; aliases: string; category: string }>> {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return (await listAllSupplements(ctx)) as Array<{ id: string; slug: string; name: string; aliases: string; category: string }>;
}

export async function getSupplementBySlug(slug: string): Promise<{ id: string; slug: string; name: string } | null> {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return selectFirst(
    ctx,
    (ctx.db as any)
      .select({
        id: ctx.schema.supplements.id,
        slug: ctx.schema.supplements.slug,
        name: ctx.schema.supplements.name,
      })
      .from(ctx.schema.supplements)
      .where(eq(ctx.schema.supplements.slug, slug)),
  );
}

export async function getSupplementNameById(id: string) {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return selectFirst(
    ctx,
    (ctx.db as any)
      .select({ name: ctx.schema.supplements.name })
      .from(ctx.schema.supplements)
      .where(eq(ctx.schema.supplements.id, id)),
  );
}

export async function getScheduleRuleBySupplementId(supplementId: string) {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return selectFirst(
    ctx,
    (ctx.db as any)
      .select()
      .from(ctx.schema.supplementScheduleRules)
      .where(eq(ctx.schema.supplementScheduleRules.supplementId, supplementId)),
  );
}

export async function listMedicineInteractionsBySupplementId(supplementId: string) {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return selectAll(
    ctx,
    (ctx.db as any)
      .select()
      .from(ctx.schema.medicineInteractions)
      .where(eq(ctx.schema.medicineInteractions.supplementId, supplementId)),
  );
}

export async function listConflicts() {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return selectAll(ctx, (ctx.db as any).select().from(ctx.schema.supplementConflicts));
}

export async function listCompanionStacksBySupplementId(supplementId: string) {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return selectAll(
    ctx,
    (ctx.db as any)
      .select()
      .from(ctx.schema.companionStacks)
      .where(eq(ctx.schema.companionStacks.supplementId, supplementId))
      .orderBy(ctx.schema.companionStacks.sortOrder),
  );
}

export async function getSupplementBundleById(supplementId: string) {
  await ensureDatabaseReady();
  const ctx = await getContext();

  const [science, social, sentiment, dosage, scheduleRule, affiliate] = await Promise.all([
    selectFirst(
      ctx,
      (ctx.db as any)
        .select()
        .from(ctx.schema.supplementScience)
        .where(eq(ctx.schema.supplementScience.supplementId, supplementId)),
    ),
    selectFirst(
      ctx,
      (ctx.db as any)
        .select()
        .from(ctx.schema.supplementSocial)
        .where(eq(ctx.schema.supplementSocial.supplementId, supplementId)),
    ),
    selectFirst(
      ctx,
      (ctx.db as any)
        .select()
        .from(ctx.schema.supplementSentiment)
        .where(eq(ctx.schema.supplementSentiment.supplementId, supplementId)),
    ),
    selectFirst(
      ctx,
      ((ctx.db as any))
        .select()
        .from(ctx.schema.supplementDosage)
        .where(eq(ctx.schema.supplementDosage.supplementId, supplementId)),
    ),
    selectFirst(
      ctx,
      ((ctx.db as any))
        .select()
        .from(ctx.schema.supplementScheduleRules)
        .where(eq(ctx.schema.supplementScheduleRules.supplementId, supplementId)),
    ),
    selectFirst(
      ctx,
      (ctx.db as any)
        .select()
        .from(ctx.schema.affiliateOptions)
        .where(eq(ctx.schema.affiliateOptions.supplementId, supplementId))
        .orderBy(desc(ctx.schema.affiliateOptions.priorityScore)),
    ),
  ]);

  return {
    science,
    social,
    sentiment,
    dosage,
    scheduleRule,
    affiliate,
  };
}

export async function listProtocolsSupplements() {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return selectAll(
    ctx,
    (ctx.db as any)
      .select({
        slug: ctx.schema.supplements.slug,
        name: ctx.schema.supplements.name,
        category: ctx.schema.supplements.category,
      })
      .from(ctx.schema.supplements),
  );
}

export async function logFallbackMissRecord(query: string, normalizedQuery: string): Promise<string> {
  await ensureDatabaseReady();
  const ctx = await getContext();
  const now = new Date().toISOString();

  const existing = (await selectFirst(
    ctx,
    (ctx.db as any)
      .select({
        id: ctx.schema.fallbackQueue.id,
        hitCount: ctx.schema.fallbackQueue.hitCount,
      })
      .from(ctx.schema.fallbackQueue)
      .where(eq(ctx.schema.fallbackQueue.normalizedQuery, normalizedQuery)),
  )) as { id: string; hitCount: number } | null;

  if (existing) {
    if (ctx.dialect === 'sqlite') {
      (ctx.db as any)
        .update(ctx.schema.fallbackQueue)
        .set({
          hitCount: Number(existing.hitCount) + 1,
          lastSeenAt: now,
        })
        .where(eq(ctx.schema.fallbackQueue.id, existing.id))
        .run();
    } else {
      await (ctx.db as any)
        .update(ctx.schema.fallbackQueue)
        .set({
          hitCount: Number(existing.hitCount) + 1,
          lastSeenAt: now,
        })
        .where(eq(ctx.schema.fallbackQueue.id, existing.id));
    }

    return existing.id;
  }

  const id = `fq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (ctx.dialect === 'sqlite') {
    (ctx.db as any)
      .insert(ctx.schema.fallbackQueue)
      .values({
        id,
        query,
        normalizedQuery,
        firstSeenAt: now,
        lastSeenAt: now,
        hitCount: 1,
        status: 'pending',
      })
      .run();
  } else {
    await (ctx.db as any).insert(ctx.schema.fallbackQueue).values({
      id,
      query,
      normalizedQuery,
      firstSeenAt: now,
      lastSeenAt: now,
      hitCount: 1,
      status: 'pending',
    });
  }

  return id;
}

export async function listFallbackQueueByStatus(status: string) {
  await ensureDatabaseReady();
  const ctx = await getContext();

  return selectAll(
    ctx,
    (ctx.db as any)
      .select()
      .from(ctx.schema.fallbackQueue)
      .where(eq(ctx.schema.fallbackQueue.status, status))
      .orderBy(desc(ctx.schema.fallbackQueue.hitCount), desc(ctx.schema.fallbackQueue.lastSeenAt))
      .limit(100),
  );
}

export async function updateFallbackQueueItem(id: string, updates: { status?: string; reviewerNotes?: string }) {
  await ensureDatabaseReady();
  const ctx = await getContext();

  const nextValues: Record<string, unknown> = {
    lastSeenAt: new Date().toISOString(),
  };

  if (updates.status !== undefined) {
    nextValues.status = updates.status;
  }

  if (updates.reviewerNotes !== undefined) {
    nextValues.reviewerNotes = updates.reviewerNotes;
  }

  if (ctx.dialect === 'sqlite') {
    const result = (ctx.db as SqliteDb)
      .update(ctx.schema.fallbackQueue)
      .set(nextValues)
      .where(eq(ctx.schema.fallbackQueue.id, id))
      .run();

    return Number(result?.changes ?? 0);
  }

  const rows = await (ctx.db as any)
    .update(ctx.schema.fallbackQueue)
    .set(nextValues)
    .where(eq(ctx.schema.fallbackQueue.id, id))
    .returning({ id: ctx.schema.fallbackQueue.id });

  return rows.length;
}

export async function seedDatabaseIfEmpty() {
  const ctx = await getContext();
  await executeBootstrapSql(ctx);

  if ((await getSupplementCount(ctx)) === 0) {
    await seedDatabase(ctx);
  }
}

export async function resetAndSeedDatabase() {
  await ensureDatabaseReady();
  const ctx = await getContext();

  const orderedTables = [
    'fallback_queue',
    'affiliate_options',
    'medicine_interactions',
    'conflicts',
    'schedule_rules',
    'supplement_dosage',
    'supplement_sentiment',
    'supplement_social',
    'supplement_science',
    'companion_stacks',
    'supplements',
  ];

  if (ctx.dialect === 'sqlite') {
    const sqliteRaw = ctx.raw as BetterSqliteDatabase;
    sqliteRaw.pragma('foreign_keys = OFF');
    for (const tableName of orderedTables) {
      sqliteRaw.prepare(`DELETE FROM ${tableName}`).run();
    }
    sqliteRaw.pragma('foreign_keys = ON');
  } else {
    await (ctx.raw as Sql<Record<string, unknown>>).unsafe(`TRUNCATE TABLE ${orderedTables.join(', ')} RESTART IDENTITY CASCADE`);
  }

  await seedDatabase(ctx);
}

export async function closeDatabaseConnections() {
  if (!globalThis.__protocolsDbContext) {
    return;
  }

  const ctx = await globalThis.__protocolsDbContext;

  if (ctx.dialect === 'postgres') {
    await (ctx.raw as Sql<Record<string, unknown>>).end({ timeout: 5 });
  }

  globalThis.__protocolsDbContext = undefined;
  globalThis.__protocolsDbReady = undefined;
}

export async function getDatabaseMode() {
  const ctx = await getContext();
  return {
    dialect: ctx.dialect,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    databasePath: ctx.dialect === 'sqlite' ? getSqlitePath() : undefined,
  };
}

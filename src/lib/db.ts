import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import {
supplementsData,
scienceData,
socialData,
sentimentData,
dosageData,
scheduleRulesData,
conflictsData,
medicineInteractionsData,
affiliateData,
companionData,
} from './seed-data';
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'protocols.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
const createTablesSql = `
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
sqlite.exec(createTablesSql);
export const db = drizzle(sqlite, { schema });
function ensureSeedData() {
const row = db.select({ count: sql<number>`count(*)` }).from(schema.supplements).get();
if ((row?.count ?? 0) > 0) return;
db.transaction((tx) => {
tx.insert(schema.supplements).values(supplementsData).run();
tx.insert(schema.supplementScience).values(scienceData).run();
tx.insert(schema.supplementSocial).values(socialData).run();
tx.insert(schema.supplementSentiment).values(sentimentData).run();
tx.insert(schema.supplementDosage).values(dosageData).run();
tx.insert(schema.supplementScheduleRules).values(scheduleRulesData).run();
tx.insert(schema.supplementConflicts).values(conflictsData).run();
tx.insert(schema.medicineInteractions).values(medicineInteractionsData).run();
tx.insert(schema.affiliateOptions).values(affiliateData).run();
    tx.insert(schema.companionStacks).values(companionData).run();
});
}
ensureSeedData();
export { schema };
export function getRawDb() {
return sqlite;
}

/**
* Drizzle ORM schema for Protocols.ai
* Local dev: SQLite via better-sqlite3
* Production: Supabase Postgres (same logical schema, different driver)
*/
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
// ── helpers ─────────────────────────────────────────────────────────
function id() {
return text('id').primaryKey();
}
function timestamps() {
return {
createdAt: text('created_at').notNull().default(''),
updatedAt: text('updated_at').notNull().default(''),
} as const;
}
// ── supplements ─────────────────────────────────────────────────────
export const supplements = sqliteTable('supplements', {
id: id(),
slug: text('slug').notNull().unique(),
name: text('name').notNull(),
aliases: text('aliases').notNull().default('[]'), // JSON array of strings
category: text('category').notNull(), // mineral, adaptogen, vitamin, amino_acid, fatty_acid, enzyme, etc.
status: text('status').notNull().default('published'), // draft | validated | approved | published
...timestamps(),
});
// ── supplement_science ──────────────────────────────────────────────
export const supplementScience = sqliteTable('supplement_science', {
id: id(),
supplementId: text('supplement_id').notNull().references(() => supplements.id),
summary: text('summary').notNull(),
sourceCount: integer('source_count').notNull().default(0),
findings: text('findings').notNull().default('[]'), // JSON: ScienceFinding[]
interactions: text('interactions').notNull().default('[]'), // JSON: InteractionFlag[]
sideEffects: text('side_effects').notNull().default('[]'), // JSON: SideEffectMetric[]
medicineInteractions: text('medicine_interactions').notNull().default('[]'), // JSON: MedicineInteraction[]
});
// ── supplement_social ───────────────────────────────────────────────
export const supplementSocial = sqliteTable('supplement_social', {
id: id(),
supplementId: text('supplement_id').notNull().references(() => supplements.id),
transcriptSummary: text('transcript_summary').notNull().default(''),
anecdotes: text('anecdotes').notNull().default('[]'), // JSON: Anecdote[]
});
// ── supplement_sentiment ────────────────────────────────────────────
export const supplementSentiment = sqliteTable('supplement_sentiment', {
id: id(),
supplementId: text('supplement_id').notNull().references(() => supplements.id),
positive: real('positive').notNull().default(0),
neutral: real('neutral').notNull().default(0),
negative: real('negative').notNull().default(0),
topPositive: text('top_positive').notNull().default(''),
topNegative: text('top_negative').notNull().default(''),
});
// ── supplement_dosage ───────────────────────────────────────────────
export const supplementDosage = sqliteTable('supplement_dosage', {
id: id(),
supplementId: text('supplement_id').notNull().references(() => supplements.id),
loading: text('loading'), // nullable
maintenance: text('maintenance').notNull(),
formula: text('formula').notNull().default(''),
unit: text('unit').notNull().default('mg'),
perKgFactor: real('per_kg_factor'), // nullable
});
// ── supplement_schedule_rules ───────────────────────────────────────
export const supplementScheduleRules = sqliteTable('schedule_rules', {
id: id(),
supplementId: text('supplement_id').notNull().references(() => supplements.id),
preferredTime: text('preferred_time').notNull().default('any'), // morning | afternoon | evening | bedtime | any
withFood: integer('with_food', { mode: 'boolean' }).notNull().default(false),
foodType: text('food_type'), // nullable e.g. "high-fat meal"
emptyStomach: integer('empty_stomach', { mode: 'boolean' }).notNull().default(false),
fatSoluble: integer('fat_soluble', { mode: 'boolean' }).notNull().default(false),
stimulant: integer('stimulant', { mode: 'boolean' }).notNull().default(false),
sedating: integer('sedating', { mode: 'boolean' }).notNull().default(false),
});
// ── supplement_conflicts ────────────────────────────────────────────
export const supplementConflicts = sqliteTable('conflicts', {
id: id(),
supplementAId: text('supplement_a_id').notNull().references(() => supplements.id),
supplementBId: text('supplement_b_id').notNull().references(() => supplements.id),
conflictType: text('conflict_type').notNull(), // antagonistic | synergistic | spacing_required
minSpacingHours: real('min_spacing_hours'), // nullable
mechanism: text('mechanism').notNull().default(''),
severity: text('severity').notNull().default('low'), // low | moderate | high
});
// ── medicine_interactions ───────────────────────────────────────────
export const medicineInteractions = sqliteTable('medicine_interactions', {
id: id(),
supplementId: text('supplement_id').notNull().references(() => supplements.id),
medicineName: text('medicine_name').notNull(),
medicineClass: text('medicine_class'), // SSRI, blood_thinner, statin, thyroid_med, etc.
severity: text('severity').notNull().default('low'), // low | moderate | high | contraindicated
mechanism: text('mechanism').notNull().default(''),
recommendation: text('recommendation').notNull().default(''),
source: text('source'), // nullable
});
// ── affiliate_options ───────────────────────────────────────────────
export const affiliateOptions = sqliteTable('affiliate_options', {
id: id(),
supplementId: text('supplement_id').notNull().references(() => supplements.id),
partnerName: text('partner_name').notNull(),
partnerType: text('partner_type').notNull().default('retailer'), // brand_direct | network | retailer
productName: text('product_name').notNull(),
destinationUrl: text('destination_url').notNull(),
affiliateUrl: text('affiliate_url').notNull(),
priceDisplay: text('price_display'),
productForm: text('product_form').notNull().default('capsule'), // capsule | powder | liquid
trustScore: integer('trust_score').notNull().default(5),
priorityScore: integer('priority_score').notNull().default(0),
isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
complianceStatus: text('compliance_status').notNull().default('pending'), // approved | pending | rejected
countryCode: text('country_code').notNull().default('US'),
lastVerifiedAt: text('last_verified_at'),
});
// ── fallback_queue (review-gated misses) ────────────────────────────
export const fallbackQueue = sqliteTable('fallback_queue', {
id: id(),
query: text('query').notNull(),
normalizedQuery: text('normalized_query').notNull().unique(),
firstSeenAt: text('first_seen_at').notNull(),
lastSeenAt: text('last_seen_at').notNull(),
hitCount: integer('hit_count').notNull().default(1),
status: text('status').notNull().default('pending'), // pending | reviewed | approved | rejected
reviewerNotes: text('reviewer_notes'),
});
// ── companion_stacks (co-used supplements) ───────────────────────────
export const companionStacks = sqliteTable('companion_stacks', {
id: id(),
supplementId: text('supplement_id').notNull().references(() => supplements.id),
companionSupplementId: text('companion_supplement_id').notNull().references(() => supplements.id),
why: text('why').notNull().default('Commonly paired in user protocols.'),
strength: text('strength').notNull().default('common'), // common | strong
sortOrder: integer('sort_order').notNull().default(0),
});

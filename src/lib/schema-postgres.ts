import { pgTable, text, integer, real, timestamp, jsonb, numeric, index } from 'drizzle-orm/pg-core';

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
export const supplements = pgTable('supplements', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  aliases: text('aliases').notNull().default('[]'),
  category: text('category').notNull(),
  baseCompound: text('base_compound'),
  specificForm: text('specific_form'),
  popularityScore: integer('popularity_score').notNull().default(0),
  status: text('status').notNull().default('published'),
  ...timestamps(),
});

// ── supplement_types ───────────────────────────────────────────────
export const supplementTypes = pgTable('supplement_types', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  typeName: text('type_name').notNull(),
});

// ── clinical_studies ───────────────────────────────────────────────
export const clinicalStudies = pgTable('clinical_studies', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  title: text('title').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  url: text('url'),
  pmid: text('pmid'),
  year: integer('year'),
  studyType: text('study_type'),
  sampleSize: integer('sample_size'),
  outcome: text('outcome'),
  quality: text('quality').default('medium'),
});

// ── supplement_tags ─────────────────────────────────────────────────
export const supplementTags = pgTable('supplement_tags', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  tag: text('tag').notNull(),
  tagType: text('tag_type').notNull().default('category'),
});

// ── supplement_science ──────────────────────────────────────────────
export const supplementScience = pgTable('supplement_science', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  summary: text('summary').notNull(),
  sourceCount: integer('source_count').notNull().default(0),
  findings: text('findings').notNull().default('[]'),
  interactions: text('interactions').notNull().default('[]'),
  sideEffects: text('side_effects').notNull().default('[]'),
  medicineInteractions: text('medicine_interactions').notNull().default('[]'),
  // 'manual' (seeded), 'llm_generated' (AI fallback, unverified), 'validated' (QC-approved)
  dataSource: text('data_source').notNull().default('manual'),
  // JSON: { plainSummary, keyBenefits[], bestFor[], whoShouldAvoid[], whatToExpect, mechanism, commonMyths[], sources[] }
  extras: text('extras').notNull().default('{}'),
});

// ── supplement_social ───────────────────────────────────────────────
export const supplementSocial = pgTable('supplement_social', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  transcriptSummary: text('transcript_summary').notNull().default(''),
  anecdotes: text('anecdotes').notNull().default('[]'),
});

// ── supplement_sentiment ────────────────────────────────────────────
export const supplementSentiment = pgTable('supplement_sentiment', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  positive: real('positive').notNull().default(0),
  neutral: real('neutral').notNull().default(0),
  negative: real('negative').notNull().default(0),
  topPositive: text('top_positive').notNull().default(''),
  topNegative: text('top_negative').notNull().default(''),
});

// ── supplement_dosage ───────────────────────────────────────────────
export const supplementDosage = pgTable('supplement_dosage', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  loading: text('loading'),
  maintenance: text('maintenance').notNull(),
  formula: text('formula').notNull().default(''),
  unit: text('unit').notNull().default('mg'),
  perKgFactor: real('per_kg_factor'),
});

// ── supplement_schedule_rules ───────────────────────────────────────
export const supplementScheduleRules = pgTable('schedule_rules', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  preferredTime: text('preferred_time').notNull().default('any'),
  withFood: integer('with_food').notNull().default(0),
  foodType: text('food_type'),
  emptyStomach: integer('empty_stomach').notNull().default(0),
  fatSoluble: integer('fat_soluble').notNull().default(0),
  stimulant: integer('stimulant').notNull().default(0),
  sedating: integer('sedating').notNull().default(0),
});

// ── supplement_conflicts ────────────────────────────────────────────
export const supplementConflicts = pgTable('conflicts', {
  id: id(),
  supplementAId: text('supplement_a_id').notNull().references(() => supplements.id),
  supplementBId: text('supplement_b_id').notNull().references(() => supplements.id),
  conflictType: text('conflict_type').notNull(),
  minSpacingHours: real('min_spacing_hours'),
  mechanism: text('mechanism').notNull().default(''),
  severity: text('severity').notNull().default('low'),
});

// ── supplement_production ───────────────────────────────────────────
// Per-supplement "how it's made" copy. One row per supplement; falls back
// to category heuristics in the UI when missing.
export const supplementProduction = pgTable('supplement_production', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id).unique(),
  source: text('source').notNull().default(''),
  method: text('method').notNull().default(''),
  qualityMarkers: text('quality_markers').notNull().default(''),
  // 'manual' (curated), 'llm_generated' (AI), 'category_default' (heuristic)
  dataSource: text('data_source').notNull().default('manual'),
  ...timestamps(),
});

// ── medicine_interactions ───────────────────────────────────────────
export const medicineInteractions = pgTable('medicine_interactions', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  medicineName: text('medicine_name').notNull(),
  medicineClass: text('medicine_class'),
  severity: text('severity').notNull().default('low'),
  mechanism: text('mechanism').notNull().default(''),
  recommendation: text('recommendation').notNull().default(''),
  source: text('source'),
});

// ── affiliate_options ───────────────────────────────────────────────
export const affiliateOptions = pgTable('affiliate_options', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  partnerName: text('partner_name').notNull(),
  partnerType: text('partner_type').notNull().default('retailer'),
  productName: text('product_name').notNull(),
  destinationUrl: text('destination_url').notNull(),
  affiliateUrl: text('affiliate_url').notNull(),
  priceDisplay: text('price_display'),
  productForm: text('product_form').notNull().default('capsule'),
  trustScore: integer('trust_score').notNull().default(5),
  priorityScore: integer('priority_score').notNull().default(0),
  isPrimary: integer('is_primary').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  complianceStatus: text('compliance_status').notNull().default('pending'),
  countryCode: text('country_code').notNull().default('US'),
  lastVerifiedAt: text('last_verified_at'),
});

// ── fallback_queue ──────────────────────────────────────────────────
export const fallbackQueue = pgTable('fallback_queue', {
  id: id(),
  query: text('query').notNull(),
  normalizedQuery: text('normalized_query').notNull().unique(),
  firstSeenAt: text('first_seen_at').notNull(),
  lastSeenAt: text('last_seen_at').notNull(),
  hitCount: integer('hit_count').notNull().default(1),
  status: text('status').notNull().default('pending'),
  reviewerNotes: text('reviewer_notes'),
});

// ── companion_stacks ────────────────────────────────────────────────
export const companionStacks = pgTable('companion_stacks', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  companionSupplementId: text('companion_supplement_id').notNull().references(() => supplements.id),
  why: text('why').notNull().default('Commonly paired in user protocols.'),
  strength: text('strength').notNull().default('common'),
  sortOrder: integer('sort_order').notNull().default(0),
});

// ── user_profiles ───────────────────────────────────────────────────
// Linked to auth.users(id) via Supabase Auth. RLS: users can only read/write their own row.
export const userProfiles = pgTable('user_profiles', {
  id: id(),
  userId: text('user_id').notNull().unique(), // references auth.users(id)
  displayName: text('display_name'),
  goals: text('goals').notNull().default('[]'), // JSON array: ['sleep', 'cognition', 'muscle']
  medications: text('medications').notNull().default('[]'), // JSON array of medication names/classes
  biometrics: text('biometrics').notNull().default('{}'), // JSON: { weightKg, age, sex }
  ...timestamps(),
});

// ── saved_stacks ────────────────────────────────────────────────────
// A user's named supplement protocol. RLS: owner-only read/write.
export const savedStacks = pgTable('saved_stacks', {
  id: id(),
  userId: text('user_id').notNull(), // references auth.users(id)
  name: text('name').notNull().default('My Stack'),
  supplementIds: text('supplement_ids').notNull().default('[]'), // JSON array of supplement IDs
  notes: text('notes'),
  ...timestamps(),
});

// A user's current medication list for stack audit checks. Anonymous users keep
// this only in localStorage.
export const userMedications = pgTable('user_medications', {
  id: id(),
  userId: text('user_id').notNull(), // references auth.users(id)
  medName: text('med_name').notNull(),
  dosage: text('dosage'),
  frequency: text('frequency'),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
});

// Write-only audit history for reviewing what was checked at generation time.
export const auditSessions = pgTable('audit_sessions', {
  id: id(),
  userId: text('user_id'), // null for anonymous runs
  stackSnapshot: jsonb('stack_snapshot').notNull(),
  findings: jsonb('findings').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── bloodwork ───────────────────────────────────────────────────────
// Per-upload extracted markers. Privacy: raw_pdf_url is always NULL in v1.
export const userBloodwork = pgTable('user_bloodwork', {
  id: id(),
  userId: text('user_id').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  source: text('source').notNull(),
  markers: jsonb('markers').notNull(),
  rawPdfUrl: text('raw_pdf_url'),
});

// Curated marker -> supplement-action rule book. Read by the bloodwork
// pipeline to translate extracted markers into AuditFinding[].
export const deficiencyRules = pgTable('deficiency_rules', {
  id: id(),
  markerName: text('marker_name').notNull(),
  markerAliases: jsonb('marker_aliases'),
  unit: text('unit').notNull(),
  thresholdLow: numeric('threshold_low'),
  thresholdHigh: numeric('threshold_high'),
  severity: text('severity').notNull(),
  supplementSlug: text('supplement_slug'),
  recommendation: text('recommendation').notNull(),
  citation: text('citation'),
});

// ── supplement_mentions ─────────────────────────────────────────────
// One row per detected mention from a trending source (YT, reddit, RSS, etc).
export const supplementMentions = pgTable(
  'supplement_mentions',
  {
    id: id(),
    supplementSlug: text('supplement_slug')
      .notNull()
      .references(() => supplements.slug),
    sourceId: text('source_id').notNull(),
    sourceType: text('source_type').notNull(),
    sourceUrl: text('source_url').notNull(),
    title: text('title').notNull().default(''),
    snippet: text('snippet').notNull().default(''),
    viewCount: integer('view_count').notNull().default(0),
    mentionedAt: timestamp('mentioned_at', { withTimezone: true }).notNull(),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugMentionedAtIdx: index('supplement_mentions_slug_mentioned_at_idx').on(
      table.supplementSlug,
      table.mentionedAt,
    ),
  }),
);

// ── trending_snapshot ───────────────────────────────────────────────
// Single-row materialized view of the current /api/trending payload.
export const trendingSnapshot = pgTable('trending_snapshot', {
  id: id(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  payload: jsonb('payload').notNull(),
});

// ── shared_protocols ────────────────────────────────────────────────
// Public shareable snapshots of a user's stack. Anyone with the publicId can view.
export const sharedProtocols = pgTable('shared_protocols', {
  id: id(),
  publicId: text('public_id').notNull().unique(), // nanoid for public URL
  stackId: text('stack_id').notNull().references(() => savedStacks.id),
  ownerUserId: text('owner_user_id').notNull(), // references auth.users(id)
  snapshot: text('snapshot').notNull().default('{}'), // frozen JSON of stack at share time
  viewCount: integer('view_count').notNull().default(0),
  ...timestamps(),
});

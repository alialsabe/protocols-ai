import { boolean, doublePrecision, integer, pgTable, text } from 'drizzle-orm/pg-core';

function id() {
  return text('id').primaryKey();
}

function timestamps() {
  return {
    createdAt: text('created_at').notNull().default(''),
    updatedAt: text('updated_at').notNull().default(''),
  } as const;
}

export const supplements = pgTable('supplements', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  aliases: text('aliases').notNull().default('[]'),
  category: text('category').notNull(),
  status: text('status').notNull().default('published'),
  ...timestamps(),
});

export const supplementScience = pgTable('supplement_science', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  summary: text('summary').notNull(),
  sourceCount: integer('source_count').notNull().default(0),
  findings: text('findings').notNull().default('[]'),
  interactions: text('interactions').notNull().default('[]'),
  sideEffects: text('side_effects').notNull().default('[]'),
  medicineInteractions: text('medicine_interactions').notNull().default('[]'),
});

export const supplementSocial = pgTable('supplement_social', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  transcriptSummary: text('transcript_summary').notNull().default(''),
  anecdotes: text('anecdotes').notNull().default('[]'),
});

export const supplementSentiment = pgTable('supplement_sentiment', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  positive: doublePrecision('positive').notNull().default(0),
  neutral: doublePrecision('neutral').notNull().default(0),
  negative: doublePrecision('negative').notNull().default(0),
  topPositive: text('top_positive').notNull().default(''),
  topNegative: text('top_negative').notNull().default(''),
});

export const supplementDosage = pgTable('supplement_dosage', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  loading: text('loading'),
  maintenance: text('maintenance').notNull(),
  formula: text('formula').notNull().default(''),
  unit: text('unit').notNull().default('mg'),
  perKgFactor: doublePrecision('per_kg_factor'),
});

export const supplementScheduleRules = pgTable('schedule_rules', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  preferredTime: text('preferred_time').notNull().default('any'),
  withFood: boolean('with_food').notNull().default(false),
  foodType: text('food_type'),
  emptyStomach: boolean('empty_stomach').notNull().default(false),
  fatSoluble: boolean('fat_soluble').notNull().default(false),
  stimulant: boolean('stimulant').notNull().default(false),
  sedating: boolean('sedating').notNull().default(false),
});

export const supplementConflicts = pgTable('conflicts', {
  id: id(),
  supplementAId: text('supplement_a_id').notNull().references(() => supplements.id),
  supplementBId: text('supplement_b_id').notNull().references(() => supplements.id),
  conflictType: text('conflict_type').notNull(),
  minSpacingHours: doublePrecision('min_spacing_hours'),
  mechanism: text('mechanism').notNull().default(''),
  severity: text('severity').notNull().default('low'),
});

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
  isPrimary: boolean('is_primary').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  complianceStatus: text('compliance_status').notNull().default('pending'),
  countryCode: text('country_code').notNull().default('US'),
  lastVerifiedAt: text('last_verified_at'),
});

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

export const companionStacks = pgTable('companion_stacks', {
  id: id(),
  supplementId: text('supplement_id').notNull().references(() => supplements.id),
  companionSupplementId: text('companion_supplement_id').notNull().references(() => supplements.id),
  why: text('why').notNull().default('Commonly paired in user protocols.'),
  strength: text('strength').notNull().default('common'),
  sortOrder: integer('sort_order').notNull().default(0),
});

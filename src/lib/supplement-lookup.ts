/**
* Supplement lookup: normalize queries, fuzzy match, assemble ProtocolReport from DB.
*/
import { db, schema, getRawDb } from './db';
import { eq } from 'drizzle-orm';
import type {
ProtocolReport,
ScienceFinding,
InteractionFlag,
SideEffectMetric,
MedicineInteraction,
Anecdote,
DosagePlan,
ScheduleBlock,
SentimentCluster,
CommerceRecommendation,
SupplementConflict,
CompanionSuggestion,
TopBrand,
Biometrics,
} from './protocol-types';

const LABDOOR_BRANDS: Record<string, TopBrand[]> = {
  'magnesium-glycinate': [
    { name: 'Doctors Best', why: 'Commonly ranked for purity/value in magnesium category.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'NOW Foods', why: 'Consistent manufacturing profile and broad availability.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'creatine-monohydrate': [
    { name: 'Thorne', why: 'High quality controls and strong user trust.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Optimum Nutrition', why: 'Popular monohydrate option with broad market adoption.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'vitamin-d3': [
    { name: 'NOW Foods', why: 'Strong value and widespread third-party testing visibility.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Nature Made', why: 'Popular mainstream option with broad consistency.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'vitamin-c': [
    { name: 'NOW Foods', why: 'Widely available, tested form at strong value.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Thorne', why: 'Clean formula with ascorbic acid and strong quality controls.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'vitamin-b12-methylcobalamin': [
    { name: 'Jarrow Formulas', why: 'Methylcobalamin sublingual form preferred for bioavailability.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'NOW Foods', why: 'Popular tested methylcobalamin at accessible price.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'nac': [
    { name: 'NOW Foods', why: 'Consistent and widely tested NAC product.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Thorne', why: 'Quality-controlled NAC with strong user trust.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'berberine-hcl': [
    { name: 'Thorne', why: 'Standardized berberine HCl from quality-focused brand.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: "Doctor's Best", why: 'Popular formulation with consistent 500 mg dosing.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'lions-mane': [
    { name: 'Host Defense', why: 'Widely recognized for mushroom quality and research-backed sourcing.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Real Mushrooms', why: 'Certified organic; tested for beta-glucan content.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'melatonin': [
    { name: 'NOW Foods', why: 'Tested for accurate dosing — important in a category prone to mislabeling.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Life Extension', why: 'Offers low-dose (0.3 mg) options closer to physiologic amounts.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'rhodiola-rosea': [
    { name: 'NOW Foods', why: 'Standardized to 3% rosavins / 1% salidroside.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Gaia Herbs', why: 'High-quality adaptogen with transparent supply chain.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
  'collagen-peptides': [
    { name: 'Vital Proteins', why: 'Market leader in collagen peptides with broad availability.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Sports Research', why: 'Third-party tested type I/III collagen peptides.', source: 'Labdoor', link: 'https://labdoor.com' },
  ],
};

const PMID_DATES: Record<string, string> = {
  'PMID: 23853635': '2012-08-00',
  'PMID: 28445426': '2017-04-00',
  'PMID: 18091016': '2007-12-00',
  'PMID: 15531663': '2003-12-00',
  'PMID: 21646368': '2011-07-00',
  'PMID: 28202713': '2017-02-00',
  'PMID: 31567003': '2019-09-00',
  'PMID: 30415628': '2018-11-00',
  'PMID: 21328251': '2011-02-00',
  'PMID: 23439798': '2012-12-00',
  'PMID: 18681988': '2008-11-00',
  'PMID: 29067523': '2017-10-00',
  'PMID: 25694037': '2015-03-00',
  'PMID: 25084991': '2014-07-00',
  'PMID: 23440782': '2013-01-00',
  'PMID: 2507689':  '1989-09-00',
  'PMID: 17884994': '2007-10-00',
  'PMID: 23356638': '2013-03-00',
  'PMID: 18838531': '2008-10-00',
  'PMID: 25117882': '2014-08-00',
  'PMID: 10594905': '1999-11-00',
  'PMID: 18397984': '2008-07-00',
  'PMID: 20350504': '2010-04-00',
  'PMID: 19001767': '2008-08-00',
  'PMID: 18844328': '2008-11-00',
  'PMID: 22552138': '2013-01-00',
  'PMID: 12174486': '2002-07-00',
  'PMID: 19016404': '2009-01-00',
  'PMID: 14983953': '2004-06-00',
  'PMID: 24401291': '2014-01-00',
  'PMID: 18416885': '2008-05-00',
  'PMID: 21244186': '2011-02-00',
};

function enrichFindings(findings: ScienceFinding[]): ScienceFinding[] {
  return findings.map((f) => {
    const citation = f.citation || '';
    const pmidMatch = citation.match(/PMID:\s*(\d+)/i);
    const link = pmidMatch ? `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}/` : f.link;
    const publishedDate = PMID_DATES[citation] || f.publishedDate;
    return { ...f, link, publishedDate };
  });
}
// ── Normalize query to slug ─────────────────────────────────────────
export function normalizeQuery(query: string): string {
return query
.toLowerCase()
.trim()
.replace(/[^a-z0-9\s-]/g, '')
.replace(/\s+/g, '-')
.replace(/-+/g, '-');
}

// ── Abbreviation expansion ───────────────────────────────────────────
const QUERY_EXPANSIONS: Record<string, string> = {
  'b12': 'vitamin b12',
  'b6': 'vitamin b6',
  'b9': 'vitamin b9',
  'vit c': 'vitamin c',
  'vitc': 'vitamin c',
  'vit d': 'vitamin d3',
  'vitd': 'vitamin d3',
  'vit d3': 'vitamin d3',
  'vit k2': 'vitamin k2',
  'vitk2': 'vitamin k2',
  'nac': 'n-acetyl cysteine',
  'fish oil': 'omega-3 fish oil',
  'mag': 'magnesium',
  'mag glycinate': 'magnesium glycinate',
  'epa': 'omega-3 fish oil',
  'dha': 'omega-3 fish oil',
  'epa dha': 'omega-3 fish oil',
  'lions mane': "lion's mane",
  'lion mane': "lion's mane",
  'coq10': 'coq10',
  'ubiquinol': 'coq10',
};

function expandAbbreviation(query: string): string {
  const lower = query.toLowerCase().trim();
  return QUERY_EXPANSIONS[lower] ?? query;
}

// ── Fuzzy match against supplements ─────────────────────────────────
export function findSupplementByQuery(query: string): {
id: string;
slug: string;
name: string;
} | null {
const expanded = expandAbbreviation(query);
const normalized = expanded.toLowerCase().trim();
const slug = normalizeQuery(expanded);

// 1. Exact slug match
const exactSlug = db
.select({ id: schema.supplements.id, slug: schema.supplements.slug, name: schema.supplements.name })
.from(schema.supplements)
.where(eq(schema.supplements.slug, slug))
.get();
if (exactSlug) return exactSlug;

// 2. Exact alias match
const allSupps = db
.select({
id: schema.supplements.id,
slug: schema.supplements.slug,
name: schema.supplements.name,
aliases: schema.supplements.aliases,
})
.from(schema.supplements)
.all();

for (const supp of allSupps) {
const aliases: string[] = JSON.parse(supp.aliases);
for (const alias of aliases) {
if (alias.toLowerCase() === normalized) {
return { id: supp.id, slug: supp.slug, name: supp.name };
}
}
}

// 3. Token-based match — all query tokens must appear somewhere in name/aliases
const queryTokens = normalized.split(/[\s-]+/).filter(t => t.length >= 2);
if (queryTokens.length >= 2) {
const tokenCandidates: Array<{ supp: typeof allSupps[0]; matchRatio: number }> = [];
for (const supp of allSupps) {
const aliases: string[] = JSON.parse(supp.aliases);
const haystack = [supp.name.toLowerCase(), supp.slug, ...aliases.map(a => a.toLowerCase())].join(' ');
const matchCount = queryTokens.filter(t => haystack.includes(t)).length;
if (matchCount === queryTokens.length) {
tokenCandidates.push({ supp, matchRatio: matchCount / queryTokens.length });
}
}
if (tokenCandidates.length > 0) {
// Prefer shortest name (most specific match)
tokenCandidates.sort((a, b) => a.supp.name.length - b.supp.name.length);
const best = tokenCandidates[0].supp;
return { id: best.id, slug: best.slug, name: best.name };
}
}

// 4. Scored partial match — return best overlap ratio instead of first hit
const scored: Array<{ supp: typeof allSupps[0]; score: number }> = [];
for (const supp of allSupps) {
const aliases: string[] = JSON.parse(supp.aliases);
const nameL = supp.name.toLowerCase();
const overlapScore = (hay: string, needle: string): number => {
if (hay.includes(needle)) return needle.length / hay.length;
if (needle.includes(hay)) return hay.length / needle.length;
return 0;
};
let best = 0;
best = Math.max(best, overlapScore(nameL, normalized), overlapScore(supp.slug, slug));
for (const alias of aliases) {
best = Math.max(best, overlapScore(alias.toLowerCase(), normalized));
}
if (best > 0) scored.push({ supp, score: best });
}
if (scored.length > 0) {
scored.sort((a, b) => b.score - a.score);
const top = scored[0].supp;
return { id: top.id, slug: top.slug, name: top.name };
}

return null;
}
// ── Get suggestions when not found ──────────────────────────────────
export function getSuggestions(query: string, limit: number = 5): string[] {
const normalized = query.toLowerCase().trim();
const allSupps = db
.select({ name: schema.supplements.name, slug: schema.supplements.slug, aliases: schema.supplements.aliases })
.from(schema.supplements)
.all();
// Simple Levenshtein distance for fuzzy matching
const scored = allSupps.map(supp => {
const aliases: string[] = JSON.parse(supp.aliases);
const allNames = [supp.name.toLowerCase(), supp.slug, ...aliases.map(a => a.toLowerCase())];
const minDist = Math.min(...allNames.map(n => levenshteinDistance(normalized, n)));
return { name: supp.name, slug: supp.slug, distance: minDist };
});
scored.sort((a, b) => a.distance - b.distance);
return scored.slice(0, limit).map(s => s.name);
}
function levenshteinDistance(a: string, b: string): number {
const m = a.length, n = b.length;
const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
for (let i = 0; i <= m; i++) dp[i][0] = i;
for (let j = 0; j <= n; j++) dp[0][j] = j;
for (let i = 1; i <= m; i++) {
for (let j = 1; j <= n; j++) {
dp[i][j] = a[i - 1] === b[j - 1]
? dp[i - 1][j - 1]
: 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
}
}
return dp[m][n];
}
// ── Log fallback miss to review queue ───────────────────────────────
export function logFallbackMiss(query: string): string {
const normalizedQuery = normalizeQuery(expandAbbreviation(query));
const now = new Date().toISOString();
const raw = getRawDb();
const existing = raw.prepare(
'SELECT id, hit_count FROM fallback_queue WHERE normalized_query = ?'
).get(normalizedQuery) as { id: string; hit_count: number } | undefined;
if (existing) {
raw.prepare(
'UPDATE fallback_queue SET hit_count = ?, last_seen_at = ? WHERE id = ?'
).run(existing.hit_count + 1, now, existing.id);
return existing.id;
}
const id = `fq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
raw.prepare(
'INSERT INTO fallback_queue (id, query, normalized_query, first_seen_at, last_seen_at, hit_count, status) VALUES (?, ?, ?, ?, ?, 1, ?)'
).run(id, query, normalizedQuery, now, now, 'pending');
return id;
}
// ── Full supplement lookup → ProtocolReport ──────────────────────────
export function lookupSupplement(query: string, biometrics?: Biometrics): ProtocolReport | null {
const match = findSupplementByQuery(query);
if (!match) return null;
const suppId = match.id;
const weight = biometrics?.weightKg ?? 80;
// Fetch all related data
const science = db.select().from(schema.supplementScience).where(eq(schema.supplementScience.supplementId, suppId)).get();
const social = db.select().from(schema.supplementSocial).where(eq(schema.supplementSocial.supplementId, suppId)).get();
const sentiment = db.select().from(schema.supplementSentiment).where(eq(schema.supplementSentiment.supplementId, suppId)).get();
const dosage = db.select().from(schema.supplementDosage).where(eq(schema.supplementDosage.supplementId, suppId)).get();
const scheduleRule = db.select().from(schema.supplementScheduleRules).where(eq(schema.supplementScheduleRules.supplementId, suppId)).get();
const affiliate = db.select().from(schema.affiliateOptions)
.where(eq(schema.affiliateOptions.supplementId, suppId))
.orderBy(schema.affiliateOptions.priorityScore)
.get();
// Fetch medicine interactions
const medInteractions = db.select().from(schema.medicineInteractions)
.where(eq(schema.medicineInteractions.supplementId, suppId))
.all();
// Fetch conflicts involving this supplement
const conflictsA = db.select().from(schema.supplementConflicts)
.where(eq(schema.supplementConflicts.supplementAId, suppId))
.all();
const conflictsB = db.select().from(schema.supplementConflicts)
.where(eq(schema.supplementConflicts.supplementBId, suppId))
.all();
// Parse JSON fields
const findings: ScienceFinding[] = science ? enrichFindings(JSON.parse(science.findings)) : [];
const interactions: InteractionFlag[] = science ? JSON.parse(science.interactions) : [];
const sideEffects: SideEffectMetric[] = science ? JSON.parse(science.sideEffects) : [];
const anecdotes: Anecdote[] = social ? JSON.parse(social.anecdotes) : [];
// Build dosage with weight-based calculation
let dosagePlan: DosagePlan | undefined;
if (dosage) {
let maintenance = dosage.maintenance;
if (dosage.perKgFactor && weight) {
const calculated = weight * dosage.perKgFactor;
const unit = dosage.unit;
maintenance = `${calculated.toFixed(1)} ${unit}/day (${dosage.maintenance})`;
}
dosagePlan = {
loading: dosage.loading ?? undefined,
maintenance,
formula: dosage.formula,
};
}
// Build schedule blocks from rules
const schedule: ScheduleBlock[] = [];
if (scheduleRule) {
const timeMap: Record<string, string> = {
morning: '08:00 AM',
afternoon: '02:00 PM',
evening: '06:00 PM',
bedtime: '09:30 PM',
any: '08:00 AM',
};
const time = timeMap[scheduleRule.preferredTime] || '08:00 AM';
const contextParts: string[] = [];
if (scheduleRule.withFood) contextParts.push('Take with food');
if (scheduleRule.foodType) contextParts.push(`(${scheduleRule.foodType})`);
if (scheduleRule.emptyStomach) contextParts.push('Take on empty stomach');
if (scheduleRule.fatSoluble) contextParts.push('for fat-soluble absorption');
schedule.push({
time,
title: `${match.name} — ${scheduleRule.preferredTime.charAt(0).toUpperCase() + scheduleRule.preferredTime.slice(1)} dose`,
context: contextParts.join(' ') || 'Standard dosing.',
supplements: [match.name],
caution: scheduleRule.sedating ? 'May cause drowsiness — ideal for bedtime.' : undefined,
severity: scheduleRule.sedating ? 'info' : undefined,
});
}
// Build sentiment
const sentimentCluster: SentimentCluster | undefined = sentiment ? {
positive: sentiment.positive,
neutral: sentiment.neutral,
negative: sentiment.negative,
topPositive: sentiment.topPositive,
topNegative: sentiment.topNegative,
} : undefined;
// Build commerce
const commerce: CommerceRecommendation | undefined = affiliate ? {
retailer: affiliate.partnerName,
product: affiliate.productName,
price: affiliate.priceDisplay ?? '',
affiliateLink: affiliate.affiliateUrl,
inStock: affiliate.isActive,
} : undefined;
// Build medicine interactions
const medicineInteractionsList: MedicineInteraction[] = medInteractions.map(mi => ({
medicineName: mi.medicineName,
medicineClass: mi.medicineClass ?? undefined,
severity: mi.severity as MedicineInteraction['severity'],
mechanism: mi.mechanism,
recommendation: mi.recommendation,
source: mi.source ?? undefined,
}));
// Build conflicts
const allConflictRows = [...conflictsA, ...conflictsB];
const companionRows = db.select().from(schema.companionStacks)
.where(eq(schema.companionStacks.supplementId, suppId))
.orderBy(schema.companionStacks.sortOrder)
.all();
const topBrands: TopBrand[] = LABDOOR_BRANDS[match.slug] || [
    { name: 'NOW Foods', why: 'Popular baseline brand in this category.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Thorne', why: 'Frequently selected for quality-focused protocols.', source: 'Labdoor', link: 'https://labdoor.com' },
  ];

  const companionSuggestions: CompanionSuggestion[] = companionRows.map((row) => {
const companion = db.select({ name: schema.supplements.name })
.from(schema.supplements)
.where(eq(schema.supplements.id, row.companionSupplementId))
.get();
return {
supplement: companion?.name ?? 'Unknown',
why: row.why,
strength: (row.strength as CompanionSuggestion['strength']) ?? 'common',
};
});
const conflictsList: SupplementConflict[] = allConflictRows.map(c => {
// Look up the "other" supplement name
const otherId = c.supplementAId === suppId ? c.supplementBId : c.supplementAId;
const other = db.select({ name: schema.supplements.name }).from(schema.supplements).where(eq(schema.supplements.id, otherId)).get();
return {
supplementA: match.name,
supplementB: other?.name ?? 'Unknown',
conflictType: c.conflictType as SupplementConflict['conflictType'],
minSpacingHours: c.minSpacingHours ?? undefined,
mechanism: c.mechanism,
severity: c.severity as SupplementConflict['severity'],
};
});
return {
id: match.id,
query,
name: match.name,
subject: match.name,
summary: science?.summary ?? '',
science: science ? {
summary: science.summary,
sourceCount: science.sourceCount,
findings,
interactions,
sideEffects,
} : undefined,
social: social ? {
transcriptSummary: social.transcriptSummary,
anecdotes,
} : undefined,
sentiment: sentimentCluster,
commerce,
schedule,
dosage: dosagePlan,
medicineInteractions: medicineInteractionsList.length > 0 ? medicineInteractionsList : undefined,
conflicts: conflictsList.length > 0 ? conflictsList : undefined,
companionSuggestions: companionSuggestions.length > 0 ? companionSuggestions : undefined,
topBrands,
finance: {
tokensUsed: 0,
usdCost: 0,
roiNote: 'DB lookup — zero inference cost.',
},
};
}
// ── List all available supplements ──────────────────────────────────
export function listAllSupplements(): { slug: string; name: string; category: string }[] {
return db
.select({ slug: schema.supplements.slug, name: schema.supplements.name, category: schema.supplements.category })
.from(schema.supplements)
.all();
}

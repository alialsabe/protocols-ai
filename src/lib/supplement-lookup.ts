import {
  getSupplementBundleById,
  getSupplementBySlug,
  getSupplementNameById,
  listCompanionStacksBySupplementId,
  listConflicts,
  listMedicineInteractionsBySupplementId,
  listProtocolsSupplements,
  listSupplementsBasic,
  listTagsBySupplementId,
  listTypesBySupplementId,
  listClinicalStudiesBySupplementId,
  getClinicalStudyCategoryCounts,
  logFallbackMissRecord,
} from './db';
import type {
  Anecdote,
  Biometrics,
  CommerceRecommendation,
  CompanionSuggestion,
  DosagePlan,
  InteractionFlag,
  MedicineInteraction,
  ProtocolReport,
  ScheduleBlock,
  ScienceFinding,
  SentimentCluster,
  SideEffectMetric,
  SupplementConflict,
  TopBrand,
} from './protocol-types';

type BasicSupplement = {
  id: string;
  slug: string;
  name: string;
  aliases: string;
  category: string;
  baseCompound: string | null;
  specificForm: string | null;
  popularityScore: number;
};

type CompanionRow = Awaited<ReturnType<typeof listCompanionStacksBySupplementId>>[number];
type ConflictRow = Awaited<ReturnType<typeof listConflicts>>[number];
type MedicineInteractionRow = Awaited<ReturnType<typeof listMedicineInteractionsBySupplementId>>[number];

type SupplementBundleRow = {
  science?: { findings: string; interactions: string; sideEffects: string } | null;
  social?: { anecdotes: string; transcriptSummary: string } | null;
  sentiment?: { positive: number; neutral: number; negative: number; topPositive: string; topNegative: string } | null;
  dosage?: { loading: string | null; maintenance: string; formula: string | null; unit: string; perKgFactor: number | null } | null;
  schedule?: { preferredTime: string; withFood: number | boolean; foodType: string | null; emptyStomach: number | boolean; fatSoluble: number | boolean; stimulant: number | boolean; sedating: number | boolean } | null;
  affiliate?: { affiliateUrl: string; productName: string; partnerName: string; priceDisplay: string | null; trustScore: number; priorityScore: number; productForm: string; countryCode: string; complianceStatus: string; isActive: boolean } | null;
};

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
  nac: [
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
  melatonin: [
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
  'PMID: 2507689': '1989-09-00',
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
  return findings.map((finding) => {
    const citation = finding.citation || '';
    const pmidMatch = citation.match(/PMID:\s*(\d+)/i);
    const link = pmidMatch ? `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}/` : finding.link;
    const publishedDate = PMID_DATES[citation] || finding.publishedDate;

    return { ...finding, link, publishedDate };
  });
}

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const QUERY_EXPANSIONS: Record<string, string> = {
  b12: 'vitamin b12',
  b6: 'vitamin b6',
  b9: 'vitamin b9',
  'vit c': 'vitamin c',
  vitc: 'vitamin c',
  'vit d': 'vitamin d3',
  vitd: 'vitamin d3',
  'vit d3': 'vitamin d3',
  'vit k2': 'vitamin k2',
  vitk2: 'vitamin k2',
  nac: 'n-acetyl cysteine',
  'fish oil': 'omega-3 fish oil',
  'omega-3': 'omega-3 fish oil',
  'omega3': 'omega-3 fish oil',
  'omega 3': 'omega-3 fish oil',
  mag: 'magnesium',
  'mag glycinate': 'magnesium glycinate',
  epa: 'omega-3 fish oil',
  dha: 'omega-3 fish oil',
  'epa dha': 'omega-3 fish oil',
  'lions mane': "lion's mane",
  'lion mane': "lion's mane",
  coq10: 'coq10',
  ubiquinol: 'coq10',
};

function expandAbbreviation(query: string): string {
  const lower = query.toLowerCase().trim();
  return QUERY_EXPANSIONS[lower] ?? query;
}

type SupplementMatch = {
  id: string;
  slug: string;
  name: string;
  category: string;
  popularityScore: number;
  baseCompound: string | null;
  specificForm: string | null;
};

export async function findSupplementByQuery(query: string): Promise<SupplementMatch | null> {
  const expanded = expandAbbreviation(query);
  const normalized = expanded.toLowerCase().trim();
  const slug = normalizeQuery(expanded);

  const exactSlug = await getSupplementBySlug(slug);
  if (exactSlug) return exactSlug as SupplementMatch;

  const allSupplements = await listSupplementsBasic();

  for (const supplement of allSupplements as BasicSupplement[]) {
    const aliases: string[] = JSON.parse(supplement.aliases);
    if (aliases.some((alias: string) => alias.toLowerCase() === normalized)) {
      return { id: supplement.id, slug: supplement.slug, name: supplement.name, category: supplement.category, popularityScore: supplement.popularityScore, baseCompound: supplement.baseCompound, specificForm: supplement.specificForm };
    }
  }

  // Also match by base compound name
  for (const supplement of allSupplements as BasicSupplement[]) {
    if (supplement.baseCompound && supplement.baseCompound.toLowerCase() === normalized) {
      return { id: supplement.id, slug: supplement.slug, name: supplement.name, category: supplement.category, popularityScore: supplement.popularityScore, baseCompound: supplement.baseCompound, specificForm: supplement.specificForm };
    }
  }

  const queryTokens = normalized.split(/[-\s]+/).filter((token: string) => token.length >= 2);
  if (queryTokens.length >= 2) {
    const tokenCandidates: Array<{ supplement: BasicSupplement; score: number }> = [];

    for (const supplement of allSupplements as BasicSupplement[]) {
      const aliases: string[] = JSON.parse(supplement.aliases);
      const haystack = [supplement.name.toLowerCase(), supplement.slug, ...(supplement.baseCompound ? [supplement.baseCompound.toLowerCase()] : []), ...aliases.map((alias: string) => alias.toLowerCase())].join(' ');
      const matchCount = queryTokens.filter((token: string) => haystack.includes(token)).length;

      if (matchCount === queryTokens.length) {
        tokenCandidates.push({ supplement, score: matchCount / queryTokens.length });
      }
    }

    if (tokenCandidates.length > 0) {
      tokenCandidates.sort(
        (a: { supplement: BasicSupplement; score: number }, b: { supplement: BasicSupplement; score: number }) =>
          a.supplement.name.length - b.supplement.name.length || b.score - a.score,
      );
      const best = tokenCandidates[0].supplement;
      return { id: best.id, slug: best.slug, name: best.name, category: best.category, popularityScore: best.popularityScore, baseCompound: best.baseCompound, specificForm: best.specificForm };
    }
  }

  const scored: Array<{ supplement: BasicSupplement; score: number }> = [];

  for (const supplement of allSupplements as BasicSupplement[]) {
    const aliases: string[] = JSON.parse(supplement.aliases);
    const nameLower = supplement.name.toLowerCase();
    const overlapScore = (haystack: string, needle: string) => {
      if (haystack.includes(needle)) return needle.length / haystack.length;
      if (needle.includes(haystack)) return haystack.length / needle.length;
      return 0;
    };

    let best = Math.max(overlapScore(nameLower, normalized), overlapScore(supplement.slug, slug));
    if (supplement.baseCompound) {
      best = Math.max(best, overlapScore(supplement.baseCompound.toLowerCase(), normalized));
    }
    for (const alias of aliases) {
      best = Math.max(best, overlapScore(alias.toLowerCase(), normalized));
    }

    if (best > 0) {
      scored.push({ supplement, score: best });
    }
  }

  if (scored.length > 0) {
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].supplement;
    return { id: best.id, slug: best.slug, name: best.name, category: best.category, popularityScore: best.popularityScore, baseCompound: best.baseCompound, specificForm: best.specificForm };
  }

  return null;
}

export async function getSuggestions(query: string, limit = 5): Promise<string[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const allSupplements = await listSupplementsBasic();

  // Multi-word: require ALL tokens to hit somewhere in the name+aliases haystack
  const tokens = q.split(/[\s-]+/).filter((t: string) => t.length >= 2);
  const isMultiWord = tokens.length >= 2;

  // Tiers (lower = better):
  //   0 — exact match on name
  //   1 — name starts with query
  //   2 — alias exact or alias starts with query
  //   3 — name contains query as substring
  //   4 — alias contains query as substring
  //   5+ — Levenshtein-based fuzzy (only if ≥4 chars and no tier 0-4 candidate exists)
  type ScoredEntry = { name: string; tier: number; nameLen: number };
  const scored: ScoredEntry[] = [];

  for (const supplement of allSupplements as BasicSupplement[]) {
    const aliases: string[] = JSON.parse(supplement.aliases);
    const nameLower = supplement.name.toLowerCase();

    if (isMultiWord) {
      // Multi-word: every token must appear somewhere in the combined haystack
      const haystack = [nameLower, supplement.slug, ...aliases.map((a: string) => a.toLowerCase())].join(' ');
      const allHit = tokens.every((t: string) => haystack.includes(t));
      if (!allHit) continue;

      // Score by how short the name is (prefers exact multi-word match over long names)
      scored.push({ name: supplement.name, tier: 3, nameLen: supplement.name.length });
      continue;
    }

    // Single-word path — tiered scoring
    let tier = Infinity;

    // Tier 0: exact name match
    if (nameLower === q) {
      tier = 0;
    }
    // Tier 1: name prefix
    else if (nameLower.startsWith(q)) {
      tier = 1;
    }
    // Tier 2: alias exact or alias prefix
    else if (aliases.some((a: string) => {
      const al = a.toLowerCase();
      return al === q || al.startsWith(q);
    })) {
      tier = 2;
    }
    // Tier 3: name substring
    else if (nameLower.includes(q)) {
      tier = 3;
    }
    // Tier 4: alias substring
    else if (aliases.some((a: string) => a.toLowerCase().includes(q))) {
      tier = 4;
    }
    // Tier 5+: fuzzy Levenshtein (only for queries ≥4 chars)
    else if (q.length >= 4) {
      const candidates = [nameLower, supplement.slug, ...aliases.map((a: string) => a.toLowerCase())];
      const dist = Math.min(...candidates.map((c: string) => levenshteinDistance(q, c)));
      // Cap fuzzy results — only include if edit distance is ≤ half the query length
      if (dist <= Math.ceil(q.length / 2)) {
        tier = 5 + dist;
      }
    }

    if (isFinite(tier)) {
      scored.push({ name: supplement.name, tier, nameLen: supplement.name.length });
    }
  }

  // If we have tier 0-4 matches, drop all fuzzy (tier 5+) candidates
  const hasTiered = scored.some((e: ScoredEntry) => e.tier < 5);
  const filtered = hasTiered ? scored.filter((e: ScoredEntry) => e.tier < 5) : scored;

  // Sort: primary = tier, secondary = shorter name first, tertiary = alphabetical
  filtered.sort((a: ScoredEntry, b: ScoredEntry) =>
    a.tier - b.tier || a.nameLen - b.nameLen || a.name.localeCompare(b.name),
  );

  return filtered.slice(0, limit).map((e: ScoredEntry) => e.name);
}

function levenshteinDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[a.length][b.length];
}

export async function logFallbackMiss(query: string): Promise<string> {
  const normalizedQuery = normalizeQuery(expandAbbreviation(query));
  return logFallbackMissRecord(query, normalizedQuery);
}

export async function lookupSupplement(query: string, biometrics?: Biometrics): Promise<ProtocolReport | null> {
  const match = await findSupplementByQuery(query);
  if (!match) return null;

  const supplementId = match.id;
  const weight = biometrics?.weightKg ?? 80;
  // Sequential queries — Supabase free tier cancels statements when too many run in parallel
  let bundle                  = await getSupplementBundleById(supplementId);

  // LLM fallback: if the catalog supplement has no science or dosage data,
  // try to generate it. Never throws — returns a status instead.
  const needsFallback =
    !(bundle as SupplementBundleRow | null)?.science ||
    !(bundle as SupplementBundleRow | null)?.dosage;
  if (needsFallback) {
    try {
      const { runFallback } = await import('./llm-fallback');
      const result = await runFallback({
        supplementId,
        name: match.name,
        category: match.category ?? 'supplement',
        baseCompound: match.baseCompound ?? null,
        hasScience: Boolean((bundle as SupplementBundleRow | null)?.science),
        hasDosage: Boolean((bundle as SupplementBundleRow | null)?.dosage),
      });
      if (result.status === 'ok') {
        // Data was just generated — re-fetch the bundle so the response
        // includes the new rows.
        bundle = await getSupplementBundleById(supplementId);
      }
    } catch {
      // Never let fallback errors break the base lookup. Empty tabs beat 500s.
    }
  }
  const medicineInteractionRows = await listMedicineInteractionsBySupplementId(supplementId);
  const conflictRows          = await listConflicts();
  const companionRows         = await listCompanionStacksBySupplementId(supplementId);
  const tagRows               = await listTagsBySupplementId(supplementId);
  const typeRows              = await listTypesBySupplementId(supplementId);
  const clinicalStudyRows     = await listClinicalStudiesBySupplementId(supplementId);
  const studyCategoryCounts   = await getClinicalStudyCategoryCounts(supplementId);

  const bundleTyped = bundle as SupplementBundleRow | null;
  const science = bundleTyped?.science ? enrichFindings(JSON.parse(bundleTyped.science.findings)) : [];
  const interactions = bundleTyped?.science ? JSON.parse(bundleTyped.science.interactions) : [];
  const sideEffects = bundleTyped?.science ? JSON.parse(bundleTyped.science.sideEffects) : [];


  let dosagePlan: DosagePlan | undefined;
  if (bundleTyped?.dosage) {
    let maintenance = bundleTyped.dosage.maintenance;
    if (bundleTyped.dosage.perKgFactor && weight) {
      const calculated = weight * bundleTyped.dosage.perKgFactor;
      maintenance = `${calculated.toFixed(1)} ${bundleTyped.dosage.unit}/day (${bundleTyped.dosage.maintenance})`;
    }

    dosagePlan = {
      loading: bundleTyped.dosage.loading ?? undefined,
      maintenance,
      formula: bundleTyped.dosage.formula ?? undefined,
    };
  }

  const schedule: ScheduleBlock[] = [];
  if (bundleTyped?.schedule) {
    const timeMap: Record<string, string> = {
      morning: '08:00 AM',
      afternoon: '02:00 PM',
      evening: '06:00 PM',
      bedtime: '09:30 PM',
      any: '08:00 AM',
    };
    const contextParts: string[] = [];
    if (bundleTyped.schedule.withFood) contextParts.push('Take with food');
    if (bundleTyped.schedule.foodType) contextParts.push(`(${bundleTyped.schedule.foodType})`);
    if (bundleTyped.schedule.emptyStomach) contextParts.push('Take on empty stomach');
    if (bundleTyped.schedule.fatSoluble) contextParts.push('for fat-soluble absorption');

    schedule.push({
      time: timeMap[bundleTyped.schedule.preferredTime] || '08:00 AM',
      title: `${match.name} — ${bundleTyped.schedule.preferredTime.charAt(0).toUpperCase() + bundleTyped.schedule.preferredTime.slice(1)} dose`,
      context: contextParts.join(' ') || 'Standard dosing.',
      supplements: [match.name],
      caution: bundleTyped.schedule.sedating ? 'May cause drowsiness — ideal for bedtime.' : undefined,
      severity: bundleTyped.schedule.sedating ? 'info' : undefined,
    });
  }

  const sentiment: SentimentCluster | undefined = bundleTyped?.sentiment ? {
    positive: bundleTyped.sentiment.positive,
    neutral: bundleTyped.sentiment.neutral,
    negative: bundleTyped.sentiment.negative,
    topPositive: bundleTyped.sentiment.topPositive,
    topNegative: bundleTyped.sentiment.topNegative,
  } : undefined;

  const commerce: CommerceRecommendation | undefined = bundleTyped?.affiliate ? {
    retailer: bundleTyped.affiliate.partnerName,
    product: bundleTyped.affiliate.productName,
    price: bundleTyped.affiliate.priceDisplay ?? '',
    affiliateLink: bundleTyped.affiliate.affiliateUrl,
    inStock: bundleTyped.affiliate.isActive,
  } : undefined;

  const medicineInteractions: MedicineInteraction[] = (medicineInteractionRows as Array<{ medicineName: string; medicineClass: string | null; severity: string; mechanism: string; recommendation: string; source: string | null }>).map((interaction) => ({
    medicineName: interaction.medicineName,
    medicineClass: interaction.medicineClass ?? undefined,
    severity: interaction.severity as MedicineInteraction['severity'],
    mechanism: interaction.mechanism,
    recommendation: interaction.recommendation,
    source: interaction.source ?? undefined,
  }));

  const conflicts: SupplementConflict[] = await Promise.all(
    (conflictRows as Array<{
      supplementAId: string;
      supplementBId: string;
      conflictType: string;
      minSpacingHours: number | null;
      mechanism: string;
      severity: string;
    }>)
      .filter((conflict) => conflict.supplementAId === supplementId || conflict.supplementBId === supplementId)
      .map(async (conflict) => {
        const otherId = conflict.supplementAId === supplementId ? conflict.supplementBId : conflict.supplementAId;
        const other = (await getSupplementNameById(otherId)) as { name: string } | null;

        return {
          supplementA: match.name,
          supplementB: other?.name ?? 'Unknown',
          conflictType: conflict.conflictType as SupplementConflict['conflictType'],
          minSpacingHours: conflict.minSpacingHours ?? undefined,
          mechanism: conflict.mechanism,
          severity: conflict.severity as SupplementConflict['severity'],
        };
      }),
  );

  const companionSuggestions: CompanionSuggestion[] = await Promise.all(
    (companionRows as Array<{ companionSupplementId: string; why: string; strength: string; sortOrder: number }>).map(async (row) => {
      const companion = (await getSupplementNameById(row.companionSupplementId)) as { name: string } | null;

      return {
        supplement: companion?.name ?? 'Unknown',
        why: row.why,
        strength: (row.strength as CompanionSuggestion['strength']) ?? 'common',
      };
    }),
  );

  const topBrands = LABDOOR_BRANDS[match.slug] || [
    { name: 'NOW Foods', why: 'Popular baseline brand in this category.', source: 'Labdoor', link: 'https://labdoor.com' },
    { name: 'Thorne', why: 'Frequently selected for quality-focused protocols.', source: 'Labdoor', link: 'https://labdoor.com' },
  ];

  return {
    id: match.id,
    query,
    name: match.name,
    subject: match.name,
    baseCompound: match.baseCompound ?? undefined,
    specificForm: match.specificForm ?? undefined,
    supplementTypes: typeRows.map(t => t.typeName),
    summary: bundleTyped?.social?.transcriptSummary || '',
    science: bundleTyped?.science ? {
      summary: bundleTyped.social?.transcriptSummary || '',
      sourceCount: science.length,
      findings: science,
      interactions,
      sideEffects,
    } : undefined,
    clinicalStudies: clinicalStudyRows.length > 0 ? clinicalStudyRows : undefined,
    clinicalStudyCategoryCounts: studyCategoryCounts.length > 0 ? studyCategoryCounts : undefined,
    social: bundleTyped?.social ? {
      transcriptSummary: bundleTyped.social.transcriptSummary,
      anecdotes: JSON.parse(bundleTyped.social.anecdotes) as Anecdote[],
    } : undefined,
    sentiment,
    commerce,
    schedule,
    dosage: dosagePlan,
    medicineInteractions: medicineInteractions.length > 0 ? medicineInteractions : undefined,
    conflicts: conflicts.length > 0 ? conflicts : undefined,
    companionSuggestions: companionSuggestions.length > 0 ? companionSuggestions : undefined,
    topBrands,
    tags: tagRows,
    popularityScore: match.popularityScore,
    finance: {
      tokensUsed: 0,
      usdCost: 0,
      roiNote: 'DB lookup — zero inference cost.',
    },
  };
}

export async function listAllSupplements(): Promise<Array<{ slug: string; name: string; category: string }>> {
  return (await listProtocolsSupplements()) as Array<{ slug: string; name: string; category: string }>;
}

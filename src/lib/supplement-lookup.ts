import {
  getSupplementBundleById,
  getSupplementBySlug,
  getSupplementNameById,
  listCompanionStacksBySupplementId,
  listConflicts,
  listMedicineInteractionsBySupplementId,
  listProtocolsSupplements,
  listSupplementsBasic,
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

export async function findSupplementByQuery(query: string): Promise<{ id: string; slug: string; name: string } | null> {
  const expanded = expandAbbreviation(query);
  const normalized = expanded.toLowerCase().trim();
  const slug = normalizeQuery(expanded);

  const exactSlug = await getSupplementBySlug(slug);
  if (exactSlug) return exactSlug;

  const allSupplements = await listSupplementsBasic();

  for (const supplement of allSupplements as BasicSupplement[]) {
    const aliases: string[] = JSON.parse(supplement.aliases);
    if (aliases.some((alias: string) => alias.toLowerCase() === normalized)) {
      return { id: supplement.id, slug: supplement.slug, name: supplement.name };
    }
  }

  const queryTokens = normalized.split(/[-\s]+/).filter((token: string) => token.length >= 2);
  if (queryTokens.length >= 2) {
    const tokenCandidates: Array<{ supplement: BasicSupplement; score: number }> = [];

    for (const supplement of allSupplements as BasicSupplement[]) {
      const aliases: string[] = JSON.parse(supplement.aliases);
      const haystack = [supplement.name.toLowerCase(), supplement.slug, ...aliases.map((alias: string) => alias.toLowerCase())].join(' ');
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
      return { id: best.id, slug: best.slug, name: best.name };
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
    return { id: best.id, slug: best.slug, name: best.name };
  }

  return null;
}

export async function getSuggestions(query: string, limit = 5): Promise<string[]> {
  const normalized = query.toLowerCase().trim();
  const allSupplements = await listSupplementsBasic();

  const scored: Array<{ name: string; distance: number }> = allSupplements.map((supplement: BasicSupplement) => {
    const aliases: string[] = JSON.parse(supplement.aliases);
    const names = [supplement.name.toLowerCase(), supplement.slug, ...aliases.map((alias: string) => alias.toLowerCase())];
    const distance = Math.min(...names.map((name: string) => levenshteinDistance(normalized, name)));

    return { name: supplement.name, distance };
  });

  scored.sort((a: { name: string; distance: number }, b: { name: string; distance: number }) => a.distance - b.distance);
  return scored.slice(0, limit).map((entry: { name: string; distance: number }) => entry.name);
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
  const [bundle, medicineInteractionRows, conflictRows, companionRows] = await Promise.all([
    getSupplementBundleById(supplementId),
    listMedicineInteractionsBySupplementId(supplementId),
    listConflicts(),
    listCompanionStacksBySupplementId(supplementId),
  ]);

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
    summary: bundleTyped?.science ? '' : '',
    science: bundleTyped?.science ? {
      summary: '',
      sourceCount: 0,
      findings: [],
      interactions: [],
      sideEffects: [],
    } : undefined,
    social: bundleTyped?.social ? {
      transcriptSummary: bundleTyped.social.transcriptSummary,
      anecdotes: [],
    } : undefined,
    sentiment,
    commerce,
    schedule,
    dosage: dosagePlan,
    medicineInteractions: medicineInteractions.length > 0 ? medicineInteractions : undefined,
    conflicts: conflicts.length > 0 ? conflicts : undefined,
    companionSuggestions: companionSuggestions.length > 0 ? companionSuggestions : undefined,
    topBrands,
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

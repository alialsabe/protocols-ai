/**
 * Seed clinical studies from PubMed for all supplements that currently have none.
 *
 * Uses NCBI E-utilities (free, no key required, 3 req/sec limit).
 * For each supplement, performs 1-2 PubMed searches and classifies results
 * into the 6 standard categories. Inserts 3-5 diverse studies per supplement.
 *
 * Run: pnpm tsx scripts/seed-clinical-studies-pubmed.ts
 */

import postgres from 'postgres';
import { loadLocalEnv, getPoolerUrl } from '../src/lib/database-env';

loadLocalEnv();

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const RATE_MS = 400; // 2.5 req/sec — safely under 3/sec limit without API key

// ── Category classification ────────────────────────────────────────────────
const CATEGORIES = {
  META: 'Meta-Analysis & Systematic Review',
  EFFICACY: 'Efficacy & Outcomes',
  PK: 'Pharmacokinetics & Bioavailability',
  SAFETY: 'Safety & Toxicology',
  POPULATION: 'Population Studies',
  MECHANISM: 'Mechanisms of Action',
} as const;
type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES];

interface ClassifiedStudy {
  pmid: string;
  title: string;
  year: number | null;
  category: Category;
  studyType: string;
  url: string;
}

function classifyStudy(title: string, pubTypes: string[]): { category: Category; studyType: string } {
  const t = title.toLowerCase();
  const pt = pubTypes.map((p) => p.toLowerCase()).join(' ');

  if (pt.includes('meta-analysis') || pt.includes('systematic review') || t.includes('meta-analysis') || t.includes('systematic review')) {
    return {
      category: CATEGORIES.META,
      studyType: pt.includes('meta-analysis') || t.includes('meta-analysis') ? 'Meta-Analysis' : 'Systematic Review',
    };
  }
  if (t.includes('pharmacokinetic') || t.includes('bioavailability') || t.includes('absorption') || t.includes('pharmacology') || t.includes('biokinetic')) {
    return { category: CATEGORIES.PK, studyType: 'Pharmacokinetic Study' };
  }
  if (t.includes('safety') || t.includes('toxicolog') || t.includes('adverse effect') || t.includes('tolerab') || t.includes('hepatotox')) {
    return { category: CATEGORIES.SAFETY, studyType: 'Safety Study' };
  }
  if (t.includes('cohort') || t.includes('epidemiol') || t.includes('prevalence') || t.includes('population-based') || t.includes('cross-sectional') || pt.includes('observational study')) {
    return { category: CATEGORIES.POPULATION, studyType: 'Observational Study' };
  }
  if (t.includes('mechanism') || t.includes('pathway') || t.includes('in vitro') || t.includes('molecular') || t.includes('signaling') || t.includes('receptor')) {
    return { category: CATEGORIES.MECHANISM, studyType: 'Mechanistic Study' };
  }
  if (pt.includes('randomized controlled trial') || pt.includes('clinical trial')) {
    return { category: CATEGORIES.EFFICACY, studyType: 'RCT' };
  }
  if (pt.includes('review')) {
    return { category: CATEGORIES.META, studyType: 'Narrative Review' };
  }
  return { category: CATEGORIES.EFFICACY, studyType: 'Clinical Study' };
}

function parseYear(pubdate: string): number | null {
  const m = pubdate.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

// ── Search term overrides for generic base compounds ──────────────────────
// When base_compound alone is too generic or misleading for PubMed, use these.
const SEARCH_TERM_OVERRIDES: Record<string, string[]> = {
  Antioxidant: [], // handled per-form
  Enzymes: [], // handled per-form
  Racetams: [], // handled per-form
  'Joint Support': [], // handled per-form
  'Plant Protein': [], // handled per-form
  'Hormone Modulator': ['diindolylmethane DIM clinical trial', 'DIM estrogen metabolism'],
  'Hormone/Sleep': [], // handled per-form (DHEA, pregnenolone — melatonin already has studies)
  'Modafinil Analogues': ['adrafinil clinical pharmacology', 'adrafinil cognitive'],
  Noopept: ['noopept cognitive clinical', 'omberacetam neuroprotection'],
  Phenibut: ['phenibut clinical pharmacology', 'phenibut anxiety'],
  Phenethylamine: ['phenylethylamine PEA clinical', 'beta-phenylethylamine monoamine'],
  'Mineral Pitch': ['shilajit clinical trial', 'shilajit fulvic acid health'],
  Senolytic: ['piperlongumine senolytic cancer', 'senolytic aging clinical'],
  Polyphenols: ['theaflavins clinical trial', 'theaflavins cardiovascular'],
  Phospholipids: ['phosphatidylcholine clinical trial', 'lecithin cognitive'],
  Ketones: ['beta-hydroxybutyrate clinical trial', 'exogenous ketones performance'],
  MCTs: ['MCT oil clinical trial', 'medium chain triglycerides metabolism'],
  NADH: ['NADH supplement clinical', 'nicotinamide adenine dinucleotide fatigue'],
  'L-DOPA': ['levodopa clinical trial Parkinson', 'L-DOPA supplement clinical'],
  'L-Ergothioneine': ['ergothioneine clinical trial', 'ergothioneine antioxidant aging'],
  Beef: ['beef protein isolate clinical', 'animal protein supplement RCT'],
};

// These base compounds should search by specific_form instead of base_compound
const SEARCH_BY_SPECIFIC_FORM = new Set([
  'Antioxidant', 'Enzymes', 'Racetams', 'Joint Support', 'Plant Protein', 'Hormone/Sleep',
]);

// ── Build PubMed search term ──────────────────────────────────────────────
function buildSearchTerm(baseCompound: string, specificForm: string): string {
  // Clean parenthetical suffixes from specific_form: "Alpha-GPC" stays, but
  // "Bacopa Monnieri Extract (Bacosides)" → "Bacopa Monnieri"
  const cleanSpecific = specificForm
    .replace(/\s*\([\w\s/-]+\)\s*/g, ' ')
    .replace(/\b(Extract|Powder|Oil|Salt|Base|Complex|Isolate|Hydrolysate|Concentrate)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (SEARCH_BY_SPECIFIC_FORM.has(baseCompound)) {
    return cleanSpecific.length >= 4 ? cleanSpecific : specificForm;
  }

  // For most compounds, use the base compound name — it's more reliable on PubMed
  // and studies about the base compound are applicable to all its forms.
  return baseCompound;
}

// ── PubMed API helpers ────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function searchPubMed(term: string, maxResults = 10): Promise<string[]> {
  const q = `${term}[Title/Abstract] AND humans[MeSH Terms]`;
  const url = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(q)}&retmax=${maxResults}&sort=relevance&retmode=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { esearchresult?: { idlist?: string[] } };
    return data?.esearchresult?.idlist ?? [];
  } catch {
    return [];
  }
}

async function fetchSummaries(pmids: string[]): Promise<Record<string, unknown>[]> {
  if (!pmids.length) return [];
  const url = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { result?: Record<string, unknown> };
    const result = data?.result ?? {};
    return pmids.map((id) => result[id] as Record<string, unknown>).filter(Boolean);
  } catch {
    return [];
  }
}

function pickDiverseStudies(summaries: Record<string, unknown>[], target = 5): ClassifiedStudy[] {
  const chosen: ClassifiedStudy[] = [];
  const categoriesUsed = new Map<Category, number>();

  for (const s of summaries) {
    if (chosen.length >= target) break;
    const pmid = s.uid as string;
    const rawTitle = s.title as string;
    if (!pmid || !rawTitle) continue;

    const title = rawTitle.replace(/\.$/, '');
    const year = parseYear((s.pubdate as string) ?? '');
    const pubTypes = (s.pubtype as string[]) ?? [];
    const { category, studyType } = classifyStudy(title, pubTypes);

    // Prefer category diversity; allow at most 2 per category
    const catCount = categoriesUsed.get(category) ?? 0;
    if (catCount >= 2) continue;

    chosen.push({ pmid, title, year, category, studyType, url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` });
    categoriesUsed.set(category, catCount + 1);
  }

  // If we're short, allow any remaining summaries (ignore category diversity)
  if (chosen.length < 3) {
    const usedPmids = new Set(chosen.map((c) => c.pmid));
    for (const s of summaries) {
      if (chosen.length >= target) break;
      const pmid = s.uid as string;
      if (!pmid || usedPmids.has(pmid)) continue;
      const rawTitle = s.title as string;
      if (!rawTitle) continue;
      const title = rawTitle.replace(/\.$/, '');
      const year = parseYear((s.pubdate as string) ?? '');
      const pubTypes = (s.pubtype as string[]) ?? [];
      const { category, studyType } = classifyStudy(title, pubTypes);
      chosen.push({ pmid, title, year, category, studyType, url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` });
      usedPmids.add(pmid);
    }
  }

  return chosen;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const poolerUrl = getPoolerUrl();
  if (!poolerUrl) throw new Error('Missing SUPABASE_POOLER_URL');
  const parsed = new URL(poolerUrl);
  const sql = postgres({
    host: parsed.hostname,
    port: Number(parsed.port) || 5432,
    database: parsed.pathname.slice(1) || 'postgres',
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: { rejectUnauthorized: false },
    prepare: false,
    max: 1,
  });

  try {
    // Get all supplements that currently have zero clinical studies
    const rows = await sql<{ id: string; name: string; base_compound: string; specific_form: string }[]>`
      SELECT s.id, s.name, s.base_compound, s.specific_form
      FROM supplements s
      LEFT JOIN clinical_studies cs ON cs.supplement_id = s.id
      WHERE cs.id IS NULL
      ORDER BY s.base_compound, s.specific_form
    `;

    console.log(`\nFound ${rows.length} supplements without clinical studies.\n`);

    let totalInserted = 0;
    let processed = 0;
    let skipped = 0;

    for (const supp of rows) {
      processed++;
      const baseCompound = supp.base_compound ?? supp.specific_form ?? supp.name;
      const specificForm = supp.specific_form ?? supp.name;
      console.log(`[${processed}/${rows.length}] ${specificForm} (${baseCompound})`);

      // Determine search terms
      let searchTerms: string[];
      if (SEARCH_TERM_OVERRIDES[baseCompound] !== undefined && SEARCH_TERM_OVERRIDES[baseCompound].length > 0) {
        searchTerms = SEARCH_TERM_OVERRIDES[baseCompound];
      } else {
        const primary = buildSearchTerm(baseCompound, specificForm);
        searchTerms = [
          `${primary} supplement clinical trial`,
          `${primary} supplementation randomized`,
        ];
      }

      // Search PubMed
      const allPmids: string[] = [];
      const seenPmids = new Set<string>();

      for (const term of searchTerms.slice(0, 2)) {
        await delay(RATE_MS);
        const pmids = await searchPubMed(term, 10);
        for (const id of pmids) {
          if (!seenPmids.has(id)) {
            seenPmids.add(id);
            allPmids.push(id);
          }
        }
        if (allPmids.length >= 10) break;
      }

      if (!allPmids.length) {
        console.log(`  → No PubMed results, skipping.`);
        skipped++;
        continue;
      }

      // Fetch summaries
      await delay(RATE_MS);
      const summaries = await fetchSummaries(allPmids.slice(0, 10));

      if (!summaries.length) {
        console.log(`  → Could not fetch summaries, skipping.`);
        skipped++;
        continue;
      }

      const studies = pickDiverseStudies(summaries, 5);

      if (!studies.length) {
        console.log(`  → No classifiable studies, skipping.`);
        skipped++;
        continue;
      }

      // Insert into DB
      let insertedForThis = 0;
      for (const study of studies) {
        // Deterministic ID: supplement prefix + pmid so re-runs are idempotent
        const idBase = supp.id.replace('supp-', '').slice(0, 40);
        const studyId = `cs-${idBase}-${study.pmid}`;

        await sql`
          INSERT INTO clinical_studies
            (id, supplement_id, title, category, url, pmid, year, study_type, quality)
          VALUES (
            ${studyId}, ${supp.id}, ${study.title}, ${study.category},
            ${study.url}, ${study.pmid}, ${study.year}, ${study.studyType}, 'medium'
          )
          ON CONFLICT (id) DO NOTHING
        `;
        insertedForThis++;
        totalInserted++;
      }

      console.log(`  → Inserted ${insertedForThis} studies (${[...new Set(studies.map((s) => s.category))].join(', ')})`);
    }

    // Final stats
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Processed: ${processed}, Skipped: ${skipped}, Rows inserted: ${totalInserted}`);

    const [{ count: total }] = await sql<[{ count: string }]>`SELECT count(*)::text AS count FROM clinical_studies`;
    console.log(`Total clinical studies in DB: ${total}`);

    const cats = await sql<{ category: string; count: number }[]>`
      SELECT category, count(*)::int AS count FROM clinical_studies GROUP BY category ORDER BY count DESC
    `;
    console.log('\nCategory distribution:');
    for (const cat of cats) {
      console.log(`  ${cat.category}: ${cat.count}`);
    }
  } finally {
    await sql.end();
    console.log('\nDone.');
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

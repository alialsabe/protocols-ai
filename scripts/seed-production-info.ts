/**
 * Seed per-supplement "how it's made" copy for the top N supplements
 * (by popularity score). Writes to the supplement_production table.
 *
 * We start from a category-aware template and fold in the supplement's
 * specific form / base compound so each row is meaningfully customized.
 * Later, an LLM pass can replace these `manual` rows with curated copy.
 *
 * Run:   npx tsx scripts/seed-production-info.ts
 * Limit: LIMIT=100 npx tsx scripts/seed-production-info.ts   (default: 100)
 * Force: FORCE=1 npx tsx scripts/seed-production-info.ts     (overwrite existing rows)
 */
import postgres from 'postgres';
import { loadLocalEnv, getPoolerUrl } from '../src/lib/database-env';

loadLocalEnv();
const poolerUrl = getPoolerUrl();
if (!poolerUrl) throw new Error('Missing DATABASE_URL / SUPABASE_POOLER_URL');

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

const LIMIT = Number(process.env.LIMIT ?? '100');
const FORCE = process.env.FORCE === '1';

type SupplementRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  base_compound: string | null;
  specific_form: string | null;
};

type ProductionTriple = { source: string; method: string; qualityMarkers: string };

function templateFor(row: SupplementRow): ProductionTriple {
  const cat = (row.category || '').toLowerCase();
  const subject = row.name;
  const form = row.specific_form ?? row.base_compound ?? subject;

  switch (cat) {
    case 'mineral':
      return {
        source: `${subject} is produced by reacting elemental ${row.base_compound ?? 'mineral salt'} with an organic carrier (glycinate, citrate, malate, or picolinate) selected for absorption.`,
        method: `Chelation in aqueous solution: the elemental mineral and the carrier are combined under controlled pH and temperature, then the resulting complex is crystallized, filtered, dried, and milled to a uniform powder.`,
        qualityMarkers: `USP / Ph.Eur. grade ${form}. Reputable suppliers publish ICP-MS heavy-metal panels (lead, cadmium, mercury, arsenic) and microbial counts on every lot, plus elemental-mineral % so you can verify the compound and the dose match the label.`,
      };

    case 'vitamin':
      return {
        source: `${subject} is sourced from chemical synthesis or microbial fermentation; the resulting molecule is identical to the food-derived form.`,
        method: `Multi-step organic synthesis (or precursor fermentation) followed by recrystallization and chromatography to isolate the active isomer at >98% purity.`,
        qualityMarkers: `Assay by HPLC, residual-solvent and heavy-metal panels, and oxidation tests where relevant. ${subject} is typically packaged under inert atmosphere or coated to prevent degradation in storage.`,
      };

    case 'botanical':
      return {
        source: `Dried plant material — typically the part with the highest marker-compound concentration — is selected for ${subject}.`,
        method: `Solvent extraction (water, ethanol, or hydroethanolic) followed by concentration, spray-drying, and standardization to a fixed percentage of the active constituent.`,
        qualityMarkers: `Identity by HPLC/TLC, marker-compound %, residual-solvent panel, pesticide residues, heavy metals, and total microbial counts. Look for the standardization spec on the label, not just "${subject} extract".`,
      };

    case 'adaptogen':
      return {
        source: `${subject} is grown for its phytochemical profile (withanolides, rosavins, bacosides, ginsenosides, or eleutherosides depending on species) and harvested at the stage where actives peak.`,
        method: `Hydroethanolic extraction then spray-drying. Many premium ${subject} extracts (e.g. KSM-66, Sensoril) use proprietary solvent ratios and extraction times to favor specific actives.`,
        qualityMarkers: `Standardized to a named active percentage (not "5:1 extract"). Reputable suppliers publish HPLC identity, contaminant panels (pesticides, heavy metals), and lot-level Certificate of Analysis.`,
      };

    case 'mushroom':
      return {
        source: `${subject} is grown as fruiting body or mycelium on grain or liquid substrate. Fruiting-body extracts generally carry higher beta-glucan content than mycelium-on-grain.`,
        method: `Hot-water extraction pulls polysaccharides and beta-glucans; some products are dual-extracted with ethanol to recover triterpenes. Solids are then filtered and spray-dried.`,
        qualityMarkers: `Reputable ${subject} suppliers disclose beta-glucan % (not just "polysaccharide %"), substrate residue, alpha-glucan starch fill-in, and lot-level identity testing.`,
      };

    case 'amino_acid':
    case 'amino-acid':
      return {
        source: `Modern ${subject} is produced by microbial fermentation of glucose with engineered bacteria; some forms still come from synthetic precursors.`,
        method: `The fermentation broth is filtered, the target amino acid is crystallized, then dried and milled. Pharma-grade lots add recrystallization and tighter spec limits.`,
        qualityMarkers: `Typically ≥99% assay by HPLC. COA covers residual solvents, heavy metals, microbial counts, and (for L-form amino acids) optical purity to confirm the L- vs D- ratio.`,
      };

    case 'fatty_acid':
    case 'fatty-acid':
      return {
        source: `${subject} is sourced from cold-water fish, krill, algal oil, or concentrated triglyceride / ethyl-ester fractions.`,
        method: `Molecular distillation under vacuum removes heavy metals and concentrates EPA/DHA; ethyl-ester and re-esterified-triglyceride forms use transesterification to raise omega-3 density.`,
        qualityMarkers: `IFOS / GOED freshness tests — peroxide value, anisidine value, and TOTOX — separate fresh oil from rancid stock. Look for these numbers on the COA, plus heavy-metal and PCB panels.`,
      };

    case 'enzyme':
      return {
        source: `${subject} is produced by microbial fermentation (commonly Aspergillus or Bacillus species) or extracted from animal/plant tissue.`,
        method: `The fermentation broth is filtered, the active protein is precipitated and stabilized with excipients, and pH-sensitive enzymes are enteric-coated to survive stomach acid.`,
        qualityMarkers: `Activity is reported in defined units (FCC, HUT, DU, SAPU) — not milligrams. Compare units across products before comparing dose, and verify the COA includes activity decay over shelf life.`,
      };

    case 'hormone':
      return {
        source: `${subject} is synthesized chemically; the molecule is structurally identical to the endogenous hormone.`,
        method: `Multi-step organic synthesis followed by recrystallization and optical-purity testing. Pharma-grade ${subject} is then milled to a defined particle size for consistent absorption.`,
        qualityMarkers: `COA discloses enantiomeric excess, residual solvents, and heavy metals. ${subject} is a category prone to dose mislabeling — favor brands that publish independent third-party assay results.`,
      };

    case 'protein':
      return {
        source: `${subject} is sourced from hydrolyzed animal (bovine, marine, porcine) or plant (pea, rice, hemp) protein fractions.`,
        method: `Enzymatic hydrolysis cleaves the protein into smaller peptides for easier absorption, followed by filtration, neutralization, and spray-drying into the finished powder.`,
        qualityMarkers: `Average molecular weight, full amino-acid profile, and an allergen panel are the key COA items. Check for the specific peptide range advertised — that's where the bioavailability claims come from.`,
      };

    default:
      return {
        source: `${subject} sourcing varies between manufacturers; reputable producers disclose the origin material on the lot-level Certificate of Analysis.`,
        method: `${subject} is typically produced by standardized extraction, chemical synthesis, or microbial fermentation depending on the compound family, then purified, dried, and milled to a uniform finished powder.`,
        qualityMarkers: `Look for a Certificate of Analysis covering identity, potency / assay, and contaminant panels (heavy metals, residual solvents, microbial counts) before comparing brands on price.`,
      };
  }
}

async function run() {
  const rows = (await sql`
    SELECT id, slug, name, category, base_compound, specific_form
    FROM supplements
    WHERE status = 'published'
    ORDER BY popularity_score DESC NULLS LAST, name ASC
    LIMIT ${LIMIT}
  `) as unknown as SupplementRow[];

  if (rows.length === 0) {
    console.log('No supplements found to seed.');
    await sql.end();
    return;
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    const existing = await sql`
      SELECT id, data_source FROM supplement_production WHERE supplement_id = ${row.id} LIMIT 1
    `;

    if (existing.length > 0 && !FORCE) {
      skipped += 1;
      continue;
    }

    const t = templateFor(row);
    const id = `prod_${row.id}`;

    if (existing.length === 0) {
      await sql`
        INSERT INTO supplement_production
          (id, supplement_id, source, method, quality_markers, data_source, created_at, updated_at)
        VALUES
          (${id}, ${row.id}, ${t.source}, ${t.method}, ${t.qualityMarkers}, 'manual', ${now}, ${now})
      `;
      inserted += 1;
    } else {
      await sql`
        UPDATE supplement_production
        SET source = ${t.source},
            method = ${t.method},
            quality_markers = ${t.qualityMarkers},
            data_source = 'manual',
            updated_at = ${now}
        WHERE supplement_id = ${row.id}
      `;
      updated += 1;
    }
  }

  console.log(
    `✅ supplement_production seeded — inserted: ${inserted}, updated: ${updated}, skipped (already filled): ${skipped} (limit=${LIMIT}${FORCE ? ', force=1' : ''})`,
  );
  await sql.end();
}

run().catch(async (err) => {
  console.error('❌ seed-production-info failed:', err);
  await sql.end();
  process.exit(1);
});

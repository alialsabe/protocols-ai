/**
 * seed-peptides.ts — adds a curated peptide catalog with full detail, matching
 * the depth of the existing supplement entries (science, dosage, schedule,
 * medicine interactions, production, clinical studies, companions).
 *
 * Category is 'peptide' so the UI treats peptides as a first-class group.
 * Idempotent: every insert is ON CONFLICT DO UPDATE / DO NOTHING, so re-running
 * is safe.
 *
 * Runs against PRODUCTION Postgres (reads DATABASE_URL from .env.production.local).
 *   npx tsx scripts/seed-peptides.ts
 */
import fs from 'node:fs';
import postgres from 'postgres';

// ── env: prefer production, fall back to .env.local ────────────────
function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const k = t.slice(0, i).trim();
    if (!(k in process.env)) process.env[k] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
}
loadEnv('.env.production.local');
loadEnv('.env.local');

const url = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL || process.env.POSTGRES_URL;
if (!url) throw new Error('No DATABASE_URL / SUPABASE_POOLER_URL found');
const p = new URL(url);
const sql = postgres({
  host: p.hostname, port: Number(p.port) || 5432,
  database: p.pathname.slice(1) || 'postgres',
  username: decodeURIComponent(p.username), password: decodeURIComponent(p.password),
  ssl: process.env.POSTGRES_SSL === 'disable' ? false : { rejectUnauthorized: false },
  prepare: false, max: 1,
});

const now = new Date().toISOString();

// ── Peptide definitions ─────────────────────────────────────────────
type Finding = { title: string; detail: string; citation?: string; quality: 'high' | 'medium' | 'low' };
type MedInt = { medicineName: string; medicineClass?: string | null; severity: string; mechanism: string; recommendation: string; source?: string | null };
type SideEffect = { label: string; incidence: string; mitigation: string };
type Study = { title: string; category: string; pmid?: string; year?: number; studyType?: string; outcome?: string; quality?: string };

interface Peptide {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  types: string[];         // supplement_types.type_name
  tags: string[];          // supplement_tags.tag
  popularity: number;
  summary: string;         // scientific summary
  findings: Finding[];
  sideEffects: SideEffect[];
  medInteractions: MedInt[];
  extras: {
    plainSummary: string;
    keyBenefits: string[];
    bestFor: string[];
    whoShouldAvoid: string[];
    whatToExpect: string;
    mechanism: string;
    commonMyths: string[];
    sources: string[];
  };
  dose: { loading?: string | null; maintenance: string; formula: string; unit: string; perKgFactor?: number | null };
  schedule: { preferredTime: string; withFood: boolean; foodType?: string | null; emptyStomach: boolean; fatSoluble: boolean; stimulant: boolean; sedating: boolean };
  production: { source: string; method: string; qualityMarkers: string };
  studies: Study[];
}

// Note on evidence: most non-GLP-1 peptides have primarily preclinical (animal/
// in-vitro) evidence in humans; quality flags reflect that honestly.
const PEPTIDES: Peptide[] = [
  {
    id: 'pep-bpc-157', slug: 'bpc-157', name: 'BPC-157',
    aliases: ['bpc-157', 'bpc157', 'body protection compound 157', 'pentadecapeptide bpc 157'],
    types: ['Peptide'], tags: ['recovery', 'gut health', 'tendon repair'], popularity: 60,
    summary: 'A synthetic pentadecapeptide derived from a gastric protective protein, studied primarily in animal models for tendon, ligament, gut, and soft-tissue healing. Human clinical evidence is currently very limited.',
    findings: [
      { title: 'Tendon and ligament healing (preclinical)', detail: 'Rat studies show accelerated tendon-to-bone and ligament healing with BPC-157, likely via upregulated growth-factor signalling and angiogenesis.', citation: 'PMID: 21030672', quality: 'low' },
      { title: 'Gut / GI protection (preclinical)', detail: 'Animal models show protection against NSAID-induced GI lesions and improved intestinal anastomosis healing.', citation: 'PMID: 27847469', quality: 'low' },
      { title: 'Angiogenesis via VEGFR2', detail: 'Mechanistic work implicates the VEGFR2-Akt-eNOS pathway in BPC-157 vascular and healing effects.', citation: 'PMID: 29338332', quality: 'medium' },
    ],
    sideEffects: [
      { label: 'Injection-site reaction', incidence: 'low', mitigation: 'Rotate subcutaneous injection sites; use sterile technique.' },
      { label: 'Unknown long-term safety', incidence: 'unknown', mitigation: 'No long-term human safety data exists; use only under medical supervision.' },
    ],
    medInteractions: [
      { medicineName: 'No documented drug interactions', medicineClass: null, severity: 'low', mechanism: 'No human interaction studies exist; interaction profile is unknown.', recommendation: 'Disclose use to your clinician, especially if on anticoagulants or wound-affecting drugs.' },
    ],
    extras: {
      plainSummary: 'BPC-157 is a lab-made peptide people use hoping to speed up healing of muscles, tendons, and the gut. Almost all the evidence is from animal studies, not humans.',
      keyBenefits: ['May support soft-tissue and tendon recovery (animal data)', 'Studied for gut lining protection', 'Generally well tolerated in short animal studies'],
      bestFor: ['Athletes exploring recovery aids', 'People researching gut-healing peptides'],
      whoShouldAvoid: ['Pregnant or breastfeeding people', 'Anyone with active cancer (angiogenic effects unstudied in this context)', 'People wanting FDA-approved, proven treatments'],
      whatToExpect: 'Effects, if any, are anecdotal in humans. It is not FDA-approved and is sold as a research chemical.',
      mechanism: 'Thought to promote angiogenesis and growth-factor expression (VEGFR2-Akt-eNOS), stabilising healing tissue.',
      commonMyths: ['"Clinically proven in humans" — it is not; human trials are essentially absent.', '"Completely safe" — long-term human safety is unknown.'],
      sources: ['PMID: 21030672', 'PMID: 27847469', 'PMID: 29338332'],
    },
    dose: { loading: null, maintenance: '250-500 mcg 1-2x/day (research protocols)', formula: 'subcutaneous near injury site in some protocols', unit: 'mcg', perKgFactor: null },
    schedule: { preferredTime: 'morning', withFood: false, foodType: null, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic solid-phase peptide synthesis (SPPS)', method: 'Assembled as a 15-amino-acid chain, purified by HPLC, lyophilised to powder for reconstitution.', qualityMarkers: 'Look for >98% HPLC purity and third-party mass-spec verification.' },
    studies: [
      { title: 'Stable gastric pentadecapeptide BPC 157 in tendon healing', category: 'tendon', pmid: '21030672', year: 2010, studyType: 'animal', outcome: 'Accelerated healing', quality: 'low' },
      { title: 'BPC 157 and gastrointestinal tract cytoprotection', category: 'gut', pmid: '27847469', year: 2016, studyType: 'review', outcome: 'Protective', quality: 'low' },
    ],
  },
  {
    id: 'pep-tb-500', slug: 'tb-500', name: 'TB-500 (Thymosin Beta-4)',
    aliases: ['tb-500', 'tb500', 'thymosin beta 4', 'thymosin beta-4', 'tβ4'],
    types: ['Peptide'], tags: ['recovery', 'tissue repair', 'flexibility'], popularity: 52,
    summary: 'A synthetic fragment related to thymosin beta-4, a naturally occurring actin-regulating peptide. Investigated in preclinical models for wound healing, cardiac repair, and tissue regeneration; human evidence is limited.',
    findings: [
      { title: 'Actin regulation and cell migration', detail: 'Thymosin beta-4 sequesters G-actin and promotes cell migration central to wound repair.', citation: 'PMID: 22101380', quality: 'medium' },
      { title: 'Cardiac repair (preclinical)', detail: 'Animal models show improved cardiomyocyte survival and vascular growth after injury.', citation: 'PMID: 15229603', quality: 'low' },
    ],
    sideEffects: [
      { label: 'Injection-site reaction', incidence: 'low', mitigation: 'Sterile technique, rotate sites.' },
      { label: 'Fatigue / head-rush after dosing', incidence: 'low', mitigation: 'Anecdotal; reduce dose and consult a clinician.' },
    ],
    medInteractions: [
      { medicineName: 'No documented drug interactions', medicineClass: null, severity: 'low', mechanism: 'No human interaction data.', recommendation: 'Disclose to your clinician; avoid if you have active malignancy pending oncologist input.' },
    ],
    extras: {
      plainSummary: 'TB-500 is a lab version of a natural peptide that helps cells move and repair. Athletes use it for recovery, but human proof is thin.',
      keyBenefits: ['May aid soft-tissue recovery and flexibility (animal data)', 'Studied for wound and cardiac repair'],
      bestFor: ['Athletes exploring recovery peptides'],
      whoShouldAvoid: ['People with active cancer', 'Pregnant or breastfeeding people', 'Those wanting proven, approved therapies'],
      whatToExpect: 'Not FDA-approved; sold as a research chemical. Human benefits are anecdotal.',
      mechanism: 'Regulates actin polymerisation, promoting cell migration, angiogenesis, and tissue remodelling.',
      commonMyths: ['"Same as BPC-157" — different peptide, different mechanism.', '"Proven in athletes" — no controlled human trials.'],
      sources: ['PMID: 22101380', 'PMID: 15229603'],
    },
    dose: { loading: '2-2.5 mg 2x/week for 4-6 weeks (research protocols)', maintenance: '2 mg/week maintenance (research protocols)', formula: 'subcutaneous', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'morning', withFood: false, foodType: null, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic SPPS', method: 'Chemically synthesised peptide, HPLC-purified, lyophilised.', qualityMarkers: '>98% HPLC purity, mass-spec confirmed.' },
    studies: [
      { title: 'Thymosin beta-4: actin sequestration and tissue repair', category: 'tissue repair', pmid: '22101380', year: 2011, studyType: 'review', outcome: 'Mechanistic support', quality: 'medium' },
    ],
  },
  {
    id: 'pep-ipamorelin', slug: 'ipamorelin', name: 'Ipamorelin',
    aliases: ['ipamorelin'],
    types: ['Peptide'], tags: ['growth hormone', 'recovery', 'sleep'], popularity: 58,
    summary: 'A selective growth-hormone secretagogue (ghrelin-receptor agonist) that stimulates pulsatile GH release with minimal effect on cortisol or prolactin. Studied mostly in early/preclinical work.',
    findings: [
      { title: 'Selective GH release', detail: 'Ipamorelin raises GH without meaningfully increasing cortisol or prolactin, unlike older secretagogues.', citation: 'PMID: 9849822', quality: 'medium' },
      { title: 'Preserved GI motility signal', detail: 'Ghrelin-receptor agonism also influences gastric motility in studies.', citation: 'PMID: 18048423', quality: 'low' },
    ],
    sideEffects: [
      { label: 'Water retention / tingling', incidence: 'low', mitigation: 'Common GH-axis effect; lower dose if bothersome.' },
      { label: 'Head-rush / flushing', incidence: 'low', mitigation: 'Transient; inject slowly.' },
    ],
    medInteractions: [
      { medicineName: 'Insulin / antidiabetics', medicineClass: 'antidiabetic', severity: 'moderate', mechanism: 'GH can raise blood glucose and reduce insulin sensitivity.', recommendation: 'Monitor blood glucose; coordinate with your clinician.' },
      { medicineName: 'Corticosteroids', medicineClass: 'steroid', severity: 'low', mechanism: 'May blunt GH response.', recommendation: 'Be aware GH stimulation may be reduced.' },
    ],
    extras: {
      plainSummary: 'Ipamorelin nudges your body to release its own growth hormone in natural pulses, without the side effects of older drugs. Used for recovery and sleep.',
      keyBenefits: ['Stimulates natural GH pulses', 'Minimal cortisol/prolactin bump', 'May support recovery and deep sleep'],
      bestFor: ['Adults exploring GH-axis support for recovery', 'People who want a gentler secretagogue'],
      whoShouldAvoid: ['People with active cancer', 'Diabetics without medical supervision', 'Pregnant or breastfeeding people'],
      whatToExpect: 'Often stacked with a GHRH like CJC-1295. Not FDA-approved for anti-aging or performance use.',
      mechanism: 'Agonises the ghrelin/GH-secretagogue receptor on the pituitary, triggering GH release.',
      commonMyths: ['"Injecting growth hormone" — no, it stimulates your own GH.', '"No effect on blood sugar" — GH can still affect glucose.'],
      sources: ['PMID: 9849822', 'PMID: 18048423'],
    },
    dose: { loading: null, maintenance: '200-300 mcg 1-3x/day (research protocols)', formula: 'subcutaneous, often pre-bed on empty stomach', unit: 'mcg', perKgFactor: null },
    schedule: { preferredTime: 'bedtime', withFood: false, foodType: null, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic SPPS', method: 'Pentapeptide synthesised and HPLC-purified, lyophilised for reconstitution.', qualityMarkers: '>98% HPLC purity, mass-spec confirmed.' },
    studies: [
      { title: 'Ipamorelin, the first selective growth hormone secretagogue', category: 'growth hormone', pmid: '9849822', year: 1998, studyType: 'animal', outcome: 'Selective GH release', quality: 'medium' },
    ],
  },
  {
    id: 'pep-cjc-1295', slug: 'cjc-1295', name: 'CJC-1295',
    aliases: ['cjc-1295', 'cjc1295', 'cjc-1295 dac', 'mod grf 1-29', 'modified grf'],
    types: ['Peptide'], tags: ['growth hormone', 'recovery'], popularity: 50,
    summary: 'A synthetic growth-hormone-releasing hormone (GHRH) analog that increases GH and IGF-1. The DAC ("drug affinity complex") variant extends half-life substantially. Human data are limited.',
    findings: [
      { title: 'Sustained GH/IGF-1 elevation', detail: 'A single-dose human study showed CJC-1295 increased GH and IGF-1 for up to ~1-2 weeks with the DAC form.', citation: 'PMID: 16352683', quality: 'medium' },
    ],
    sideEffects: [
      { label: 'Water retention', incidence: 'low', mitigation: 'Common GH-axis effect.' },
      { label: 'Injection-site reaction', incidence: 'low', mitigation: 'Rotate sites, sterile technique.' },
    ],
    medInteractions: [
      { medicineName: 'Insulin / antidiabetics', medicineClass: 'antidiabetic', severity: 'moderate', mechanism: 'GH/IGF-1 elevation can alter glucose control.', recommendation: 'Monitor glucose under clinician care.' },
    ],
    extras: {
      plainSummary: 'CJC-1295 tells the pituitary to release more growth hormone, and the DAC version keeps working for days. Often paired with ipamorelin.',
      keyBenefits: ['Raises GH and IGF-1', 'Long-acting (DAC form)', 'Synergistic with ghrelin-receptor peptides'],
      bestFor: ['Adults exploring GH-axis recovery support'],
      whoShouldAvoid: ['People with active cancer', 'Diabetics without supervision', 'Pregnant or breastfeeding people'],
      whatToExpect: 'Commonly stacked with ipamorelin. Not FDA-approved for these uses.',
      mechanism: 'Binds pituitary GHRH receptors to amplify natural GH pulses; DAC binds albumin to extend half-life.',
      commonMyths: ['"Instant results" — IGF-1 changes build over weeks.', '"Interchangeable with ipamorelin" — different receptor, complementary not identical.'],
      sources: ['PMID: 16352683'],
    },
    dose: { loading: null, maintenance: '1-2 mg/week (DAC) or 100 mcg 1-3x/day (no-DAC) research protocols', formula: 'subcutaneous', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'bedtime', withFood: false, foodType: null, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic SPPS', method: 'GHRH-analog peptide synthesised, HPLC-purified, lyophilised.', qualityMarkers: '>98% HPLC purity, mass-spec confirmed.' },
    studies: [
      { title: 'Prolonged stimulation of GH and IGF-1 by CJC-1295', category: 'growth hormone', pmid: '16352683', year: 2006, studyType: 'human', outcome: 'Sustained GH/IGF-1 rise', quality: 'medium' },
    ],
  },
  {
    id: 'pep-sermorelin', slug: 'sermorelin', name: 'Sermorelin',
    aliases: ['sermorelin', 'grf 1-29', 'sermorelin acetate'],
    types: ['Peptide'], tags: ['growth hormone', 'longevity'], popularity: 48,
    summary: 'A GHRH analog (first 29 amino acids of GHRH) historically FDA-approved as a diagnostic and for pediatric GH deficiency. Stimulates endogenous GH release.',
    findings: [
      { title: 'Stimulates endogenous GH', detail: 'Sermorelin reliably provokes pituitary GH release and was used diagnostically for GH deficiency.', citation: 'PMID: 2137137', quality: 'medium' },
    ],
    sideEffects: [
      { label: 'Injection-site redness', incidence: 'low', mitigation: 'Rotate sites.' },
      { label: 'Flushing / headache', incidence: 'low', mitigation: 'Usually transient.' },
    ],
    medInteractions: [
      { medicineName: 'Glucocorticoids', medicineClass: 'steroid', severity: 'moderate', mechanism: 'Suppress the GH response to GHRH.', recommendation: 'Expect reduced efficacy; discuss with clinician.' },
      { medicineName: 'Thyroid hormone', medicineClass: 'thyroid', severity: 'low', mechanism: 'Can modulate GH response.', recommendation: 'Monitor if titrating thyroid therapy.' },
    ],
    extras: {
      plainSummary: 'Sermorelin is an older, well-characterised peptide that prompts your pituitary to make its own growth hormone. It was once an approved medicine.',
      keyBenefits: ['Stimulates natural GH release', 'Long track record as a diagnostic agent', 'Shorter-acting, more physiologic pulses'],
      bestFor: ['Adults exploring GH-axis support', 'People preferring a more studied GHRH'],
      whoShouldAvoid: ['People with active cancer', 'Pregnant or breastfeeding people'],
      whatToExpect: 'Prescribed by some anti-aging clinics; the original branded product was discontinued in the US.',
      mechanism: 'Binds pituitary GHRH receptors, stimulating synthesis and pulsatile release of GH.',
      commonMyths: ['"It is growth hormone" — it stimulates your own GH instead.'],
      sources: ['PMID: 2137137'],
    },
    dose: { loading: null, maintenance: '200-500 mcg at bedtime (clinical protocols)', formula: 'subcutaneous before sleep', unit: 'mcg', perKgFactor: null },
    schedule: { preferredTime: 'bedtime', withFood: false, foodType: null, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic SPPS', method: 'GRF(1-29) peptide synthesised, HPLC-purified, lyophilised.', qualityMarkers: '>98% HPLC purity; pharmaceutical-grade preferred.' },
    studies: [
      { title: 'Sermorelin in the diagnosis of growth hormone deficiency', category: 'growth hormone', pmid: '2137137', year: 1990, studyType: 'human', outcome: 'Reliable GH provocation', quality: 'medium' },
    ],
  },
  {
    id: 'pep-tesamorelin', slug: 'tesamorelin', name: 'Tesamorelin',
    aliases: ['tesamorelin', 'egrifta', 'th9507'],
    types: ['Peptide'], tags: ['growth hormone', 'fat loss', 'fda-approved'], popularity: 54,
    summary: 'A stabilised GHRH analog, FDA-approved (Egrifta) to reduce excess visceral abdominal fat in HIV-associated lipodystrophy. One of the best-evidenced peptides here.',
    findings: [
      { title: 'Reduces visceral adipose tissue', detail: 'Phase 3 trials showed tesamorelin significantly reduced visceral fat vs placebo in HIV lipodystrophy.', citation: 'PMID: 17986662', quality: 'high' },
      { title: 'Raises IGF-1', detail: 'Increases IGF-1 in a dose-dependent, reversible manner.', citation: 'PMID: 20554975', quality: 'high' },
    ],
    sideEffects: [
      { label: 'Injection-site reaction', incidence: 'medium', mitigation: 'Rotate sites; usually mild.' },
      { label: 'Arthralgia / fluid retention', incidence: 'low', mitigation: 'GH-axis effect; report if persistent.' },
      { label: 'Raised blood glucose', incidence: 'low', mitigation: 'Monitor glucose, especially if diabetic.' },
    ],
    medInteractions: [
      { medicineName: 'Insulin / antidiabetics', medicineClass: 'antidiabetic', severity: 'moderate', mechanism: 'GH-mediated insulin resistance may raise glucose.', recommendation: 'Monitor glucose; dose adjustments may be needed.' },
      { medicineName: 'Corticosteroids', medicineClass: 'steroid', severity: 'moderate', mechanism: 'Blunt GH response.', recommendation: 'Efficacy may be reduced.' },
    ],
    extras: {
      plainSummary: 'Tesamorelin is an FDA-approved peptide that lowers deep belly fat by boosting your own growth hormone. It has real human trial evidence.',
      keyBenefits: ['Proven visceral-fat reduction', 'FDA-approved (for HIV lipodystrophy)', 'Reversible IGF-1 elevation'],
      bestFor: ['Patients with HIV-associated visceral fat (approved use)', 'Researchers studying GHRH analogs'],
      whoShouldAvoid: ['People with active cancer', 'Pregnant people (contraindicated)', 'Uncontrolled diabetics without supervision'],
      whatToExpect: 'Daily subcutaneous injection; visceral-fat changes appear over weeks to months.',
      mechanism: 'Stabilised GHRH analog that stimulates pituitary GH release, increasing lipolysis of visceral fat.',
      commonMyths: ['"General weight-loss drug" — approved specifically for visceral fat in lipodystrophy.'],
      sources: ['PMID: 17986662', 'PMID: 20554975'],
    },
    dose: { loading: null, maintenance: '2 mg subcutaneously once daily (approved dose)', formula: 'fixed 2 mg daily', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'bedtime', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Pharmaceutical synthetic peptide', method: 'Manufactured to pharmacopeial standards, lyophilised for reconstitution.', qualityMarkers: 'Pharmaceutical-grade (Egrifta); avoid unregulated sources.' },
    studies: [
      { title: 'Tesamorelin for visceral fat in HIV lipodystrophy (Phase 3)', category: 'fat loss', pmid: '17986662', year: 2007, studyType: 'rct', outcome: 'Reduced visceral fat', quality: 'high' },
      { title: 'Effects of tesamorelin on IGF-1 and safety', category: 'growth hormone', pmid: '20554975', year: 2010, studyType: 'rct', outcome: 'Dose-dependent IGF-1 rise', quality: 'high' },
    ],
  },
  {
    id: 'pep-ghk-cu', slug: 'ghk-cu', name: 'GHK-Cu (Copper Peptide)',
    aliases: ['ghk-cu', 'ghk cu', 'copper peptide', 'copper tripeptide-1', 'ghk copper'],
    types: ['Peptide'], tags: ['skin', 'hair', 'anti-aging'], popularity: 56,
    summary: 'A naturally occurring copper-binding tripeptide used topically for skin remodelling, wound healing, and hair support. Among the better-studied cosmetic peptides.',
    findings: [
      { title: 'Skin remodelling and collagen', detail: 'GHK-Cu stimulates collagen, elastin, and glycosaminoglycan synthesis and improves skin appearance in controlled cosmetic studies.', citation: 'PMID: 25382603', quality: 'medium' },
      { title: 'Wound healing', detail: 'Promotes angiogenesis and tissue repair in wound-healing models.', citation: 'PMID: 25664619', quality: 'medium' },
    ],
    sideEffects: [
      { label: 'Skin irritation / redness (topical)', incidence: 'low', mitigation: 'Patch-test; reduce frequency.' },
      { label: 'Copper sensitivity', incidence: 'low', mitigation: 'Avoid if copper-allergic.' },
    ],
    medInteractions: [
      { medicineName: 'Topical retinoids / acids', medicineClass: 'dermatologic', severity: 'low', mechanism: 'Combined actives can increase irritation.', recommendation: 'Alternate application or space usage.' },
    ],
    extras: {
      plainSummary: 'GHK-Cu is a copper-carrying peptide used in skincare to firm skin, smooth wrinkles, and help wounds heal. It is one of the more proven cosmetic peptides.',
      keyBenefits: ['Boosts collagen and elastin', 'Improves skin firmness and texture', 'Supports wound healing and hair follicles'],
      bestFor: ['People wanting evidence-based anti-aging skincare', 'Topical hair-support routines'],
      whoShouldAvoid: ['People with copper allergy', 'Those layering many strong actives (irritation risk)'],
      whatToExpect: 'Used topically (serums) or in cosmetic injectables; visible skin changes over weeks.',
      mechanism: 'Delivers copper and signals fibroblasts to remodel the extracellular matrix, boosting collagen/elastin.',
      commonMyths: ['"Only works injected" — topical formulations show benefit.', '"Copper is toxic here" — the bound tripeptide form is well tolerated topically.'],
      sources: ['PMID: 25382603', 'PMID: 25664619'],
    },
    dose: { loading: null, maintenance: 'Topical 0.05-2% serum daily; cosmetic use', formula: 'apply to clean skin', unit: '%', perKgFactor: null },
    schedule: { preferredTime: 'evening', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic tripeptide + copper', method: 'Glycyl-L-histidyl-L-lysine synthesised and complexed with copper(II); formulated into serums.', qualityMarkers: 'Stable copper complex, >98% peptide purity.' },
    studies: [
      { title: 'GHK-Cu peptide in skin remodelling and anti-aging', category: 'skin', pmid: '25382603', year: 2015, studyType: 'review', outcome: 'Improved skin metrics', quality: 'medium' },
    ],
  },
  {
    id: 'pep-semaglutide', slug: 'semaglutide', name: 'Semaglutide',
    aliases: ['semaglutide', 'ozempic', 'wegovy', 'rybelsus'],
    types: ['Peptide'], tags: ['glp-1', 'weight loss', 'diabetes', 'fda-approved'], popularity: 95,
    summary: 'A GLP-1 receptor agonist, FDA-approved for type 2 diabetes (Ozempic/Rybelsus) and chronic weight management (Wegovy). Extensive high-quality human trial evidence.',
    findings: [
      { title: 'Significant weight loss', detail: 'STEP trials showed ~15% mean body-weight reduction with weekly semaglutide 2.4 mg vs placebo.', citation: 'PMID: 33567185', quality: 'high' },
      { title: 'Glycemic control', detail: 'SUSTAIN trials demonstrated robust HbA1c reduction in type 2 diabetes.', citation: 'PMID: 27633186', quality: 'high' },
      { title: 'Cardiovascular benefit', detail: 'SELECT trial showed reduced major cardiovascular events in overweight/obese patients without diabetes.', citation: 'PMID: 37952131', quality: 'high' },
    ],
    sideEffects: [
      { label: 'Nausea / GI upset', incidence: 'high', mitigation: 'Titrate dose slowly; usually improves over weeks.' },
      { label: 'Constipation / diarrhea', incidence: 'medium', mitigation: 'Hydration, fiber, slow titration.' },
      { label: 'Gallbladder issues', incidence: 'low', mitigation: 'Report severe abdominal pain promptly.' },
    ],
    medInteractions: [
      { medicineName: 'Insulin / sulfonylureas', medicineClass: 'antidiabetic', severity: 'high', mechanism: 'Additive glucose lowering raises hypoglycemia risk.', recommendation: 'Dose reductions often needed; monitor glucose.' },
      { medicineName: 'Oral medications (delayed gastric emptying)', medicineClass: 'various', severity: 'low', mechanism: 'Slowed gastric emptying can alter absorption timing.', recommendation: 'Monitor drugs with narrow therapeutic windows.' },
    ],
    extras: {
      plainSummary: 'Semaglutide (Ozempic/Wegovy) is a proven, FDA-approved injection that lowers blood sugar and causes significant weight loss by curbing appetite.',
      keyBenefits: ['~15% average weight loss (Wegovy)', 'Strong blood-sugar control', 'Proven cardiovascular risk reduction'],
      bestFor: ['People with type 2 diabetes', 'Adults with obesity/overweight meeting criteria'],
      whoShouldAvoid: ['Personal/family history of medullary thyroid carcinoma or MEN2', 'Pregnant people', 'History of pancreatitis (caution)'],
      whatToExpect: 'Weekly injection (or daily oral Rybelsus); appetite drops and weight falls over months. Requires a prescription.',
      mechanism: 'Activates GLP-1 receptors to increase insulin, slow gastric emptying, and reduce appetite via the brain.',
      commonMyths: ['"Just a diabetes drug" — also approved for weight management.', '"Effortless" — works best with diet and activity, and weight can return if stopped.'],
      sources: ['PMID: 33567185', 'PMID: 27633186', 'PMID: 37952131'],
    },
    dose: { loading: 'Titrate 0.25 mg/week upward monthly', maintenance: '1.0-2.4 mg subcutaneously once weekly (approved)', formula: 'weekly injection, titrated', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'any', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Pharmaceutical recombinant/synthetic peptide', method: 'Manufactured to pharmacopeial standards as a stable acylated GLP-1 analog.', qualityMarkers: 'Pharmaceutical-grade only; avoid compounded/gray-market versions.' },
    studies: [
      { title: 'Once-weekly semaglutide in adults with overweight or obesity (STEP 1)', category: 'weight loss', pmid: '33567185', year: 2021, studyType: 'rct', outcome: '~15% weight loss', quality: 'high' },
      { title: 'Semaglutide and cardiovascular outcomes (SELECT)', category: 'cardiovascular', pmid: '37952131', year: 2023, studyType: 'rct', outcome: 'Reduced MACE', quality: 'high' },
    ],
  },
  {
    id: 'pep-tirzepatide', slug: 'tirzepatide', name: 'Tirzepatide',
    aliases: ['tirzepatide', 'mounjaro', 'zepbound'],
    types: ['Peptide'], tags: ['glp-1', 'gip', 'weight loss', 'diabetes', 'fda-approved'], popularity: 92,
    summary: 'A dual GIP/GLP-1 receptor agonist, FDA-approved for type 2 diabetes (Mounjaro) and obesity (Zepbound). Produces some of the largest weight-loss effects seen in trials.',
    findings: [
      { title: 'Large weight loss', detail: 'SURMOUNT-1 showed up to ~21% body-weight reduction at the highest dose vs placebo.', citation: 'PMID: 35658024', quality: 'high' },
      { title: 'Superior glycemic control', detail: 'SURPASS trials showed strong HbA1c reductions, often exceeding GLP-1-only agents.', citation: 'PMID: 34170647', quality: 'high' },
    ],
    sideEffects: [
      { label: 'Nausea / GI upset', incidence: 'high', mitigation: 'Slow titration; usually eases over time.' },
      { label: 'Decreased appetite / diarrhea', incidence: 'medium', mitigation: 'Hydrate; adjust diet.' },
    ],
    medInteractions: [
      { medicineName: 'Insulin / sulfonylureas', medicineClass: 'antidiabetic', severity: 'high', mechanism: 'Additive glucose lowering, hypoglycemia risk.', recommendation: 'Reduce doses; monitor glucose.' },
      { medicineName: 'Oral contraceptives', medicineClass: 'hormonal', severity: 'moderate', mechanism: 'Delayed gastric emptying may reduce absorption after dose escalation.', recommendation: 'Consider backup contraception per labeling.' },
    ],
    extras: {
      plainSummary: 'Tirzepatide (Mounjaro/Zepbound) is a newer FDA-approved injection that hits two gut hormones at once, giving some of the biggest weight-loss results in trials.',
      keyBenefits: ['Up to ~21% weight loss', 'Excellent blood-sugar control', 'Dual GIP + GLP-1 action'],
      bestFor: ['People with type 2 diabetes', 'Adults with obesity meeting criteria'],
      whoShouldAvoid: ['Personal/family history of medullary thyroid carcinoma or MEN2', 'Pregnant people', 'History of pancreatitis (caution)'],
      whatToExpect: 'Weekly injection with slow dose escalation; appetite and weight fall over months. Prescription required.',
      mechanism: 'Activates both GIP and GLP-1 receptors, enhancing insulin response, satiety, and slowed gastric emptying.',
      commonMyths: ['"Same as semaglutide" — tirzepatide adds GIP activity and often larger effect.'],
      sources: ['PMID: 35658024', 'PMID: 34170647'],
    },
    dose: { loading: 'Titrate from 2.5 mg/week monthly', maintenance: '5-15 mg subcutaneously once weekly (approved)', formula: 'weekly injection, titrated', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'any', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Pharmaceutical synthetic peptide', method: 'Manufactured to pharmacopeial standards as a dual-agonist acylated peptide.', qualityMarkers: 'Pharmaceutical-grade only; avoid gray-market vials.' },
    studies: [
      { title: 'Tirzepatide once weekly for obesity (SURMOUNT-1)', category: 'weight loss', pmid: '35658024', year: 2022, studyType: 'rct', outcome: 'Up to ~21% weight loss', quality: 'high' },
    ],
  },
  {
    id: 'pep-pt-141', slug: 'pt-141', name: 'PT-141 (Bremelanotide)',
    aliases: ['pt-141', 'pt141', 'bremelanotide', 'vyleesi'],
    types: ['Peptide'], tags: ['libido', 'sexual health', 'fda-approved'], popularity: 62,
    summary: 'A melanocortin-receptor agonist, FDA-approved (Vyleesi) for hypoactive sexual desire disorder in premenopausal women. Acts centrally on desire rather than on blood flow.',
    findings: [
      { title: 'Improved sexual desire', detail: 'Phase 3 RECONNECT trials showed improved desire and reduced distress in premenopausal women with HSDD.', citation: 'PMID: 31356516', quality: 'high' },
    ],
    sideEffects: [
      { label: 'Nausea', incidence: 'high', mitigation: 'Common; take as directed, often improves.' },
      { label: 'Flushing / headache', incidence: 'medium', mitigation: 'Transient.' },
      { label: 'Transient blood-pressure rise', incidence: 'low', mitigation: 'Avoid in uncontrolled hypertension/cardiovascular disease.' },
    ],
    medInteractions: [
      { medicineName: 'Antihypertensives', medicineClass: 'blood_pressure', severity: 'moderate', mechanism: 'Transient BP/HR changes with dosing.', recommendation: 'Use cautiously; avoid in uncontrolled hypertension.' },
      { medicineName: 'Naltrexone (oral)', medicineClass: 'various', severity: 'moderate', mechanism: 'Bremelanotide can slow gastric emptying and reduce naltrexone absorption.', recommendation: 'Per labeling, avoid combined use.' },
    ],
    extras: {
      plainSummary: 'PT-141 (Vyleesi) is an FDA-approved peptide that boosts sexual desire by acting on the brain, not blood flow like Viagra.',
      keyBenefits: ['Increases sexual desire centrally', 'FDA-approved for premenopausal HSDD', 'Works independent of vascular effect'],
      bestFor: ['Premenopausal women with HSDD (approved use)', 'People researching libido peptides'],
      whoShouldAvoid: ['People with uncontrolled high blood pressure or cardiovascular disease', 'Pregnant people'],
      whatToExpect: 'Used on-demand by injection before anticipated activity; nausea is common.',
      mechanism: 'Agonises melanocortin receptors (MC4R) in the brain to increase sexual desire.',
      commonMyths: ['"Like Viagra" — it acts on desire in the brain, not on erection blood flow.'],
      sources: ['PMID: 31356516'],
    },
    dose: { loading: null, maintenance: '1.75 mg subcutaneously as needed (max 1/day, 8/month)', formula: 'on-demand before activity', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'any', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Pharmaceutical synthetic peptide', method: 'Cyclic heptapeptide synthesised to pharmacopeial standards.', qualityMarkers: 'Pharmaceutical-grade (Vyleesi); avoid gray-market.' },
    studies: [
      { title: 'Bremelanotide for HSDD in premenopausal women (RECONNECT)', category: 'libido', pmid: '31356516', year: 2019, studyType: 'rct', outcome: 'Improved desire', quality: 'high' },
    ],
  },
  {
    id: 'pep-melanotan-2', slug: 'melanotan-2', name: 'Melanotan II',
    aliases: ['melanotan ii', 'melanotan 2', 'melanotan-2', 'mt-2', 'mt2'],
    types: ['Peptide'], tags: ['tanning', 'libido'], popularity: 40,
    summary: 'A synthetic melanocortin agonist that stimulates melanin production (tanning) and libido. Not approved; sold illicitly and carries notable safety concerns.',
    findings: [
      { title: 'Stimulates melanogenesis', detail: 'Melanocortin agonism increases eumelanin, darkening skin even with limited UV.', citation: 'PMID: 8637551', quality: 'low' },
    ],
    sideEffects: [
      { label: 'Nausea / facial flushing', incidence: 'high', mitigation: 'Common after dosing.' },
      { label: 'Darkening of moles / new nevi', incidence: 'medium', mitigation: 'Dermatology monitoring; discontinue if changes occur.' },
      { label: 'Spontaneous erections', incidence: 'medium', mitigation: 'Dose-related melanocortin effect.' },
    ],
    medInteractions: [
      { medicineName: 'No formal interaction studies', medicineClass: null, severity: 'moderate', mechanism: 'Unregulated; interaction profile unknown and safety concerns exist.', recommendation: 'Not recommended; discuss safer alternatives with a clinician.' },
    ],
    extras: {
      plainSummary: 'Melanotan II is an unapproved peptide people use to tan with less sun. It works but carries real safety concerns like changing moles.',
      keyBenefits: ['Darkens skin with less UV exposure', 'May increase libido'],
      bestFor: ['(No recommended use — not approved)'],
      whoShouldAvoid: ['People with many moles or melanoma risk', 'Pregnant people', 'Anyone wanting an approved, safe product'],
      whatToExpect: 'Sold illegally as a research chemical; flagged by regulators for safety. Not advised.',
      mechanism: 'Non-selective melanocortin-receptor agonist increasing melanin and central sexual signalling.',
      commonMyths: ['"Safe tanning shortcut" — regulators warn of serious risks including mole changes.'],
      sources: ['PMID: 8637551'],
    },
    dose: { loading: null, maintenance: 'No recommended dose — unapproved research chemical', formula: 'n/a', unit: 'mcg', perKgFactor: null },
    schedule: { preferredTime: 'any', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic SPPS (gray-market)', method: 'Synthesised peptide; product purity and sterility are frequently unverified.', qualityMarkers: 'No reliable quality assurance in gray-market supply.' },
    studies: [
      { title: 'Melanotan and melanogenesis', category: 'tanning', pmid: '8637551', year: 1996, studyType: 'human', outcome: 'Increased pigmentation', quality: 'low' },
    ],
  },
  {
    id: 'pep-mots-c', slug: 'mots-c', name: 'MOTS-c',
    aliases: ['mots-c', 'motsc', 'mitochondrial orf of the 12s rrna type-c'],
    types: ['Peptide'], tags: ['mitochondria', 'metabolism', 'longevity'], popularity: 44,
    summary: 'A mitochondrial-derived peptide studied for metabolic regulation, insulin sensitivity, and exercise capacity. Evidence is largely preclinical.',
    findings: [
      { title: 'Metabolic regulation (preclinical)', detail: 'MOTS-c improves insulin sensitivity and metabolic flexibility in mouse models via AMPK signalling.', citation: 'PMID: 25738459', quality: 'low' },
      { title: 'Exercise capacity (preclinical)', detail: 'Enhanced physical capacity and metabolic homeostasis in aged mice.', citation: 'PMID: 34593699', quality: 'low' },
    ],
    sideEffects: [
      { label: 'Injection-site reaction', incidence: 'low', mitigation: 'Sterile technique.' },
      { label: 'Unknown long-term safety', incidence: 'unknown', mitigation: 'No human long-term data.' },
    ],
    medInteractions: [
      { medicineName: 'Antidiabetics', medicineClass: 'antidiabetic', severity: 'low', mechanism: 'Possible additive effects on insulin sensitivity (theoretical).', recommendation: 'Monitor glucose if diabetic.' },
    ],
    extras: {
      plainSummary: 'MOTS-c is a peptide made by your mitochondria that seems to improve metabolism and exercise capacity in animals. Human data is early.',
      keyBenefits: ['May improve insulin sensitivity (animal data)', 'Studied for exercise and metabolic health'],
      bestFor: ['People researching metabolic/longevity peptides'],
      whoShouldAvoid: ['Pregnant or breastfeeding people', 'Those wanting proven human therapies'],
      whatToExpect: 'Not FDA-approved; sold as a research chemical. Human benefits unproven.',
      mechanism: 'Activates AMPK and translocates to the nucleus to regulate metabolic and stress-response genes.',
      commonMyths: ['"Proven anti-aging" — evidence is preclinical.'],
      sources: ['PMID: 25738459', 'PMID: 34593699'],
    },
    dose: { loading: null, maintenance: '5-10 mg/week (research protocols)', formula: 'subcutaneous', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'morning', withFood: false, foodType: null, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic SPPS', method: '16-amino-acid peptide synthesised and HPLC-purified.', qualityMarkers: '>98% HPLC purity, mass-spec confirmed.' },
    studies: [
      { title: 'MOTS-c regulates metabolic homeostasis and insulin sensitivity', category: 'metabolism', pmid: '25738459', year: 2015, studyType: 'animal', outcome: 'Improved metabolism', quality: 'low' },
    ],
  },
  {
    id: 'pep-epithalon', slug: 'epithalon', name: 'Epithalon',
    aliases: ['epithalon', 'epitalon', 'epithalone', 'aedg'],
    types: ['Peptide'], tags: ['longevity', 'sleep', 'telomere'], popularity: 42,
    summary: 'A synthetic tetrapeptide (Ala-Glu-Asp-Gly) studied mainly by Russian researchers for telomerase activation, circadian/melatonin regulation, and longevity. Independent replication is limited.',
    findings: [
      { title: 'Telomerase activation (in vitro)', detail: 'Reported to induce telomerase activity and telomere elongation in cell cultures.', citation: 'PMID: 12937682', quality: 'low' },
      { title: 'Melatonin / circadian effects', detail: 'Pineal-peptide research suggests effects on melatonin rhythms in aged models.', citation: 'PMID: 14523363', quality: 'low' },
    ],
    sideEffects: [
      { label: 'Injection-site reaction', incidence: 'low', mitigation: 'Sterile technique.' },
      { label: 'Unknown long-term safety', incidence: 'unknown', mitigation: 'Limited independent human data.' },
    ],
    medInteractions: [
      { medicineName: 'No documented drug interactions', medicineClass: null, severity: 'low', mechanism: 'No human interaction data.', recommendation: 'Disclose use to your clinician.' },
    ],
    extras: {
      plainSummary: 'Epithalon is a peptide claimed to slow aging by activating telomerase and steadying sleep hormones. The evidence comes mostly from one research group.',
      keyBenefits: ['Claimed telomerase activation (lab data)', 'May support sleep/circadian rhythm'],
      bestFor: ['People researching longevity peptides'],
      whoShouldAvoid: ['Pregnant or breastfeeding people', 'Those wanting independently replicated evidence'],
      whatToExpect: 'Not FDA-approved; most data from limited Russian studies. Human benefits unproven.',
      mechanism: 'Proposed to activate telomerase and modulate pineal melatonin secretion.',
      commonMyths: ['"Reverses aging" — no rigorous independent human trials support this.'],
      sources: ['PMID: 12937682', 'PMID: 14523363'],
    },
    dose: { loading: null, maintenance: '5-10 mg/day in short cycles (research protocols)', formula: 'subcutaneous, cycled', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'bedtime', withFood: false, foodType: null, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: true },
    production: { source: 'Synthetic SPPS', method: 'Tetrapeptide synthesised and HPLC-purified, lyophilised.', qualityMarkers: '>98% HPLC purity, mass-spec confirmed.' },
    studies: [
      { title: 'Epithalon peptide and telomerase activity', category: 'longevity', pmid: '12937682', year: 2003, studyType: 'in vitro', outcome: 'Telomerase induction', quality: 'low' },
    ],
  },
  {
    id: 'pep-thymosin-alpha-1', slug: 'thymosin-alpha-1', name: 'Thymosin Alpha-1',
    aliases: ['thymosin alpha 1', 'thymosin alpha-1', 'tα1', 'thymalfasin', 'zadaxin'],
    types: ['Peptide'], tags: ['immune', 'antiviral'], popularity: 46,
    summary: 'An immune-modulating peptide (thymalfasin, Zadaxin) approved in several countries as an adjunct for hepatitis B/C and immune support. Better human evidence than most research peptides.',
    findings: [
      { title: 'Immune modulation', detail: 'Enhances T-cell function and has been used as an immunomodulator in chronic viral hepatitis and as a vaccine adjuvant.', citation: 'PMID: 18582170', quality: 'medium' },
      { title: 'Adjunct in sepsis (trials)', detail: 'Studied as an adjunct in sepsis and severe infection with mixed but promising immune outcomes.', citation: 'PMID: 23730875', quality: 'medium' },
    ],
    sideEffects: [
      { label: 'Injection-site reaction', incidence: 'low', mitigation: 'Rotate sites.' },
      { label: 'Transient flu-like symptoms', incidence: 'low', mitigation: 'Usually mild and self-limited.' },
    ],
    medInteractions: [
      { medicineName: 'Immunosuppressants', medicineClass: 'immunosuppressant', severity: 'moderate', mechanism: 'Immune stimulation may oppose immunosuppressive therapy.', recommendation: 'Avoid or use only under specialist guidance.' },
    ],
    extras: {
      plainSummary: 'Thymosin Alpha-1 is an immune-boosting peptide used in some countries as a medicine for hepatitis and to support the immune system.',
      keyBenefits: ['Enhances T-cell immune function', 'Approved abroad for viral hepatitis', 'Studied as a vaccine adjuvant'],
      bestFor: ['People researching immune-support peptides', 'Adjunct use where approved'],
      whoShouldAvoid: ['Transplant recipients / those on immunosuppressants', 'Pregnant people without specialist advice'],
      whatToExpect: 'Approved as Zadaxin in some countries; not FDA-approved in the US.',
      mechanism: 'Modulates T-cell maturation and innate immunity via Toll-like receptor signalling.',
      commonMyths: ['"Cures infections" — it is an adjunct immunomodulator, not a standalone cure.'],
      sources: ['PMID: 18582170', 'PMID: 23730875'],
    },
    dose: { loading: null, maintenance: '1.6 mg subcutaneously 2x/week (clinical protocols)', formula: 'subcutaneous', unit: 'mg', perKgFactor: null },
    schedule: { preferredTime: 'morning', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic / pharmaceutical peptide', method: '28-amino-acid acetylated peptide synthesised to pharmacopeial standards.', qualityMarkers: 'Pharmaceutical-grade (Zadaxin) preferred.' },
    studies: [
      { title: 'Thymosin alpha-1 as an immunomodulator', category: 'immune', pmid: '18582170', year: 2008, studyType: 'review', outcome: 'Immune enhancement', quality: 'medium' },
    ],
  },
  {
    id: 'pep-aod-9604', slug: 'aod-9604', name: 'AOD-9604',
    aliases: ['aod-9604', 'aod9604', 'aod 9604', 'hgh fragment 176-191'],
    types: ['Peptide'], tags: ['fat loss', 'metabolism'], popularity: 38,
    summary: 'A modified fragment of growth hormone (176-191) studied for fat metabolism without the growth-promoting effects of full GH. Human weight-loss trials were largely disappointing.',
    findings: [
      { title: 'Lipolytic activity (preclinical)', detail: 'Stimulates lipolysis and inhibits lipogenesis in fat cells without affecting IGF-1.', citation: 'PMID: 11916384', quality: 'low' },
      { title: 'Human weight-loss trials underwhelming', detail: 'Clinical obesity trials did not show significant weight loss vs placebo at tested doses.', citation: 'PMID: 21105096', quality: 'medium' },
    ],
    sideEffects: [
      { label: 'Injection-site reaction', incidence: 'low', mitigation: 'Sterile technique.' },
      { label: 'Generally well tolerated', incidence: 'low', mitigation: 'No major signals in short trials.' },
    ],
    medInteractions: [
      { medicineName: 'No documented drug interactions', medicineClass: null, severity: 'low', mechanism: 'No significant human interactions reported.', recommendation: 'Disclose use to your clinician.' },
    ],
    extras: {
      plainSummary: 'AOD-9604 is a piece of growth hormone marketed for fat loss without GH side effects. In human trials it did not actually cause meaningful weight loss.',
      keyBenefits: ['Targets fat metabolism in lab models', 'Does not raise IGF-1'],
      bestFor: ['People researching fat-loss peptides (with realistic expectations)'],
      whoShouldAvoid: ['Anyone expecting proven weight loss', 'Pregnant or breastfeeding people'],
      whatToExpect: 'Not FDA-approved for weight loss; human results were poor. Manage expectations.',
      mechanism: 'GH fragment that stimulates lipolysis and inhibits lipogenesis without the growth-signalling of full GH.',
      commonMyths: ['"Proven fat burner" — the pivotal human trials failed to show benefit.'],
      sources: ['PMID: 11916384', 'PMID: 21105096'],
    },
    dose: { loading: null, maintenance: '300 mcg/day (research protocols)', formula: 'subcutaneous', unit: 'mcg', perKgFactor: null },
    schedule: { preferredTime: 'morning', withFood: false, foodType: null, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic SPPS', method: 'GH(176-191) fragment synthesised and HPLC-purified.', qualityMarkers: '>98% HPLC purity, mass-spec confirmed.' },
    studies: [
      { title: 'AOD-9604 and lipid metabolism', category: 'fat loss', pmid: '11916384', year: 2001, studyType: 'animal', outcome: 'Increased lipolysis', quality: 'low' },
    ],
  },
  {
    id: 'pep-selank', slug: 'selank', name: 'Selank',
    aliases: ['selank', 'tp-7'],
    types: ['Peptide'], tags: ['anxiety', 'nootropic', 'focus'], popularity: 40,
    summary: 'A synthetic analog of the immunomodulatory peptide tuftsin, studied in Russia as an anxiolytic and nootropic nasal spray. Independent human evidence is limited.',
    findings: [
      { title: 'Anxiolytic effects', detail: 'Russian clinical work reports anxiolytic effects comparable to benzodiazepines without sedation or dependence.', citation: 'PMID: 18365988', quality: 'low' },
      { title: 'BDNF / neurochemistry', detail: 'Modulates BDNF expression and monoamine metabolism in animal models.', citation: 'PMID: 24380018', quality: 'low' },
    ],
    sideEffects: [
      { label: 'Nasal irritation (spray)', incidence: 'low', mitigation: 'Reduce frequency; alternate nostrils.' },
      { label: 'Unknown long-term safety', incidence: 'unknown', mitigation: 'Limited independent data.' },
    ],
    medInteractions: [
      { medicineName: 'Sedatives / anxiolytics', medicineClass: 'sedative', severity: 'low', mechanism: 'Possible additive calming effects (theoretical).', recommendation: 'Monitor for excess sedation.' },
    ],
    extras: {
      plainSummary: 'Selank is a peptide nasal spray studied in Russia for calming anxiety and sharpening focus without the grogginess or dependence of anti-anxiety drugs.',
      keyBenefits: ['May reduce anxiety without sedation', 'Studied as a nootropic', 'No dependence signal reported'],
      bestFor: ['People researching anxiolytic/nootropic peptides'],
      whoShouldAvoid: ['Pregnant or breastfeeding people', 'Those wanting FDA-approved anxiety treatment'],
      whatToExpect: 'Usually a nasal spray; not FDA-approved. Human evidence mostly from Russian studies.',
      mechanism: 'Tuftsin analog that modulates BDNF, GABA/monoamine systems, and enkephalin degradation.',
      commonMyths: ['"Proven benzodiazepine replacement" — evidence is limited and not independently replicated.'],
      sources: ['PMID: 18365988', 'PMID: 24380018'],
    },
    dose: { loading: null, maintenance: '250-500 mcg/day intranasal (research protocols)', formula: 'intranasal, divided', unit: 'mcg', perKgFactor: null },
    schedule: { preferredTime: 'morning', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
    production: { source: 'Synthetic SPPS', method: 'Heptapeptide synthesised and HPLC-purified; formulated as nasal solution.', qualityMarkers: '>98% HPLC purity, mass-spec confirmed.' },
    studies: [
      { title: 'Selank anxiolytic activity in clinical study', category: 'anxiety', pmid: '18365988', year: 2008, studyType: 'human', outcome: 'Reduced anxiety', quality: 'low' },
    ],
  },
  {
    id: 'pep-semax', slug: 'semax', name: 'Semax',
    aliases: ['semax'],
    types: ['Peptide'], tags: ['nootropic', 'focus', 'neuroprotection'], popularity: 41,
    summary: 'A synthetic ACTH(4-10) analog developed in Russia as a nootropic and neuroprotective nasal peptide, used there for stroke and cognitive indications. Independent evidence is limited.',
    findings: [
      { title: 'Neuroprotection (clinical, Russia)', detail: 'Used in Russian stroke protocols with reported neuroprotective and recovery benefits.', citation: 'PMID: 9612756', quality: 'low' },
      { title: 'BDNF upregulation', detail: 'Increases BDNF/NGF expression in animal models, supporting nootropic claims.', citation: 'PMID: 19240462', quality: 'low' },
    ],
    sideEffects: [
      { label: 'Nasal irritation (spray)', incidence: 'low', mitigation: 'Reduce frequency.' },
      { label: 'Unknown long-term safety', incidence: 'unknown', mitigation: 'Limited independent data.' },
    ],
    medInteractions: [
      { medicineName: 'Stimulants', medicineClass: 'stimulant', severity: 'low', mechanism: 'Possible additive activating effects (theoretical).', recommendation: 'Monitor for overstimulation.' },
    ],
    extras: {
      plainSummary: 'Semax is a Russian nootropic peptide nasal spray used for focus, memory, and brain protection, including after strokes. Western evidence is thin.',
      keyBenefits: ['May improve focus and cognition', 'Neuroprotective in stroke models', 'Raises brain growth factors (BDNF/NGF)'],
      bestFor: ['People researching nootropic/neuroprotective peptides'],
      whoShouldAvoid: ['Pregnant or breastfeeding people', 'Those wanting FDA-approved cognitive treatment'],
      whatToExpect: 'Nasal spray; not FDA-approved. Evidence mostly from Russian clinical use.',
      mechanism: 'ACTH(4-10) analog that boosts BDNF/NGF and modulates monoamine and neuroprotective pathways.',
      commonMyths: ['"Proven smart drug" — controlled independent trials are lacking.'],
      sources: ['PMID: 9612756', 'PMID: 19240462'],
    },
    dose: { loading: null, maintenance: '300-600 mcg/day intranasal (research protocols)', formula: 'intranasal, divided', unit: 'mcg', perKgFactor: null },
    schedule: { preferredTime: 'morning', withFood: false, foodType: null, emptyStomach: false, fatSoluble: false, stimulant: true, sedating: false },
    production: { source: 'Synthetic SPPS', method: 'Heptapeptide synthesised and HPLC-purified; nasal formulation.', qualityMarkers: '>98% HPLC purity, mass-spec confirmed.' },
    studies: [
      { title: 'Semax neuroprotection in ischemic stroke', category: 'neuroprotection', pmid: '9612756', year: 1997, studyType: 'human', outcome: 'Improved recovery', quality: 'low' },
    ],
  },
];

// Peptide-to-peptide companion pairings (both directions where meaningful)
const COMPANIONS: { a: string; b: string; why: string; strength: string; sort: number }[] = [
  { a: 'pep-cjc-1295', b: 'pep-ipamorelin', why: 'GHRH + ghrelin-receptor secretagogue: the classic synergistic GH-boosting pair.', strength: 'strong', sort: 1 },
  { a: 'pep-ipamorelin', b: 'pep-cjc-1295', why: 'Pairs with a GHRH analog to amplify natural GH pulses.', strength: 'strong', sort: 1 },
  { a: 'pep-bpc-157', b: 'pep-tb-500', why: 'Commonly stacked in recovery protocols for complementary tissue-repair pathways.', strength: 'common', sort: 1 },
  { a: 'pep-tb-500', b: 'pep-bpc-157', why: 'Frequently paired with BPC-157 for soft-tissue recovery.', strength: 'common', sort: 1 },
  { a: 'pep-sermorelin', b: 'pep-ipamorelin', why: 'GHRH + secretagogue pairing to enhance GH release.', strength: 'common', sort: 1 },
];

// ── Writer ──────────────────────────────────────────────────────────
async function main() {
  console.log(`Seeding ${PEPTIDES.length} peptides into production...`);
  let n = 0;
  for (const pep of PEPTIDES) {
    await sql`
      INSERT INTO supplements (id, slug, name, aliases, category, base_compound, specific_form, popularity_score, status, created_at, updated_at)
      VALUES (${pep.id}, ${pep.slug}, ${pep.name}, ${JSON.stringify(pep.aliases)}, 'peptide', 'Peptide', ${pep.name}, ${pep.popularity}, 'published', ${now}, ${now})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name, aliases = EXCLUDED.aliases, category = 'peptide',
        base_compound = 'Peptide', specific_form = EXCLUDED.specific_form,
        popularity_score = EXCLUDED.popularity_score, status = 'published', updated_at = EXCLUDED.updated_at
    `;

    for (const t of pep.types) {
      await sql`INSERT INTO supplement_types (id, supplement_id, type_name) VALUES (${`stype-${pep.id}-${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.slice(0, 60)}, ${pep.id}, ${t}) ON CONFLICT (id) DO NOTHING`;
    }
    for (const tag of pep.tags) {
      await sql`INSERT INTO supplement_tags (id, supplement_id, tag, tag_type) VALUES (${`stag-${pep.id}-${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.slice(0, 60)}, ${pep.id}, ${tag}, 'use_case') ON CONFLICT (id) DO NOTHING`;
    }

    await sql`
      INSERT INTO supplement_science (id, supplement_id, summary, source_count, findings, interactions, side_effects, medicine_interactions, data_source, extras)
      VALUES (${`sci-${pep.id}`}, ${pep.id}, ${pep.summary}, ${pep.studies.length || pep.findings.length},
        ${JSON.stringify(pep.findings)}, ${JSON.stringify([])}, ${JSON.stringify(pep.sideEffects)},
        ${JSON.stringify(pep.medInteractions)}, 'manual', ${JSON.stringify(pep.extras)})
      ON CONFLICT (id) DO UPDATE SET
        summary = EXCLUDED.summary, source_count = EXCLUDED.source_count, findings = EXCLUDED.findings,
        side_effects = EXCLUDED.side_effects, medicine_interactions = EXCLUDED.medicine_interactions,
        data_source = 'manual', extras = EXCLUDED.extras
    `;

    await sql`
      INSERT INTO supplement_dosage (id, supplement_id, loading, maintenance, formula, unit, per_kg_factor)
      VALUES (${`dose-${pep.id}`}, ${pep.id}, ${pep.dose.loading ?? null}, ${pep.dose.maintenance}, ${pep.dose.formula}, ${pep.dose.unit}, ${pep.dose.perKgFactor ?? null})
      ON CONFLICT (id) DO UPDATE SET loading = EXCLUDED.loading, maintenance = EXCLUDED.maintenance, formula = EXCLUDED.formula, unit = EXCLUDED.unit, per_kg_factor = EXCLUDED.per_kg_factor
    `;

    const s = pep.schedule;
    await sql`
      INSERT INTO schedule_rules (id, supplement_id, preferred_time, with_food, food_type, empty_stomach, fat_soluble, stimulant, sedating)
      VALUES (${`rule-${pep.id}`}, ${pep.id}, ${s.preferredTime}, ${s.withFood ? 1 : 0}, ${s.foodType ?? null}, ${s.emptyStomach ? 1 : 0}, ${s.fatSoluble ? 1 : 0}, ${s.stimulant ? 1 : 0}, ${s.sedating ? 1 : 0})
      ON CONFLICT (id) DO UPDATE SET preferred_time = EXCLUDED.preferred_time, with_food = EXCLUDED.with_food, food_type = EXCLUDED.food_type, empty_stomach = EXCLUDED.empty_stomach, fat_soluble = EXCLUDED.fat_soluble, stimulant = EXCLUDED.stimulant, sedating = EXCLUDED.sedating
    `;

    await sql`
      INSERT INTO supplement_production (id, supplement_id, source, method, quality_markers, data_source, created_at, updated_at)
      VALUES (${`prod-${pep.id}`}, ${pep.id}, ${pep.production.source}, ${pep.production.method}, ${pep.production.qualityMarkers}, 'manual', ${now}, ${now})
      ON CONFLICT (supplement_id) DO UPDATE SET source = EXCLUDED.source, method = EXCLUDED.method, quality_markers = EXCLUDED.quality_markers, data_source = 'manual', updated_at = EXCLUDED.updated_at
    `;

    let mi = 0;
    for (const m of pep.medInteractions) {
      await sql`
        INSERT INTO medicine_interactions (id, supplement_id, medicine_name, medicine_class, severity, mechanism, recommendation, source)
        VALUES (${`mi-${pep.id}-${mi}`}, ${pep.id}, ${m.medicineName}, ${m.medicineClass ?? null}, ${m.severity}, ${m.mechanism}, ${m.recommendation}, ${m.source ?? null})
        ON CONFLICT (id) DO UPDATE SET medicine_name = EXCLUDED.medicine_name, severity = EXCLUDED.severity, mechanism = EXCLUDED.mechanism, recommendation = EXCLUDED.recommendation
      `;
      mi++;
    }

    let st = 0;
    for (const study of pep.studies) {
      await sql`
        INSERT INTO clinical_studies (id, supplement_id, title, category, pmid, url, year, study_type, sample_size, outcome, quality)
        VALUES (${`study-${pep.id}-${st}`}, ${pep.id}, ${study.title}, ${study.category}, ${study.pmid ?? null},
          ${study.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/` : null}, ${study.year ?? null}, ${study.studyType ?? null}, ${null}, ${study.outcome ?? null}, ${study.quality ?? 'medium'})
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, outcome = EXCLUDED.outcome, quality = EXCLUDED.quality
      `;
      st++;
    }
    n++;
    console.log(`  [${n}/${PEPTIDES.length}] ${pep.name}`);
  }

  console.log('Linking companion peptides...');
  for (const c of COMPANIONS) {
    await sql`
      INSERT INTO companion_stacks (id, supplement_id, companion_supplement_id, why, strength, sort_order)
      VALUES (${`cmp-${c.a}-${c.b}`}, ${c.a}, ${c.b}, ${c.why}, ${c.strength}, ${c.sort})
      ON CONFLICT (id) DO UPDATE SET why = EXCLUDED.why, strength = EXCLUDED.strength
    `;
  }

  const [{ count }] = await sql`SELECT count(*)::int as count FROM supplements WHERE category = 'peptide'`;
  console.log(`Done. Peptides in catalog: ${count}`);
  await sql.end();
}

main().catch((e) => { console.error('Seed failed:', e); process.exit(1); });

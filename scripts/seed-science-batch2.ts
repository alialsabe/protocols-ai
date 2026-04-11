/**
 * Seed science + dosage + schedule + medicine interactions for 40 supplements.
 * Run: npx tsx scripts/seed-science-batch2.ts
 */
import postgres from 'postgres';
import { loadLocalEnv, getPoolerUrl } from '../src/lib/database-env';

loadLocalEnv();
const poolerUrl = getPoolerUrl();
if (!poolerUrl) throw new Error('Missing DATABASE_URL');

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type ScienceRecord = {
  supplementSlug: string;
  summary: string;
  findings: { title: string; detail: string; citation: string; quality: string }[];
  interactions: { label: string; severity: string; note: string }[];
  sideEffects: { label: string; incidence: string; mitigation: string }[];
  medicineInteractions: { medicineName: string; severity: string; mechanism: string; recommendation: string }[];
};

type DosageRecord = {
  supplementSlug: string;
  loading?: string;
  maintenance: string;
  formula: string;
  unit: string;
};

type ScheduleRecord = {
  supplementSlug: string;
  preferredTime: string;
  withFood: boolean;
  foodType?: string;
  emptyStomach: boolean;
  fatSoluble: boolean;
  stimulant: boolean;
  sedating: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Science Data
// ─────────────────────────────────────────────────────────────────────────────

const SCIENCE: ScienceRecord[] = [
  // 1. Alpha-GPC
  {
    supplementSlug: 'alpha-gpc',
    summary: 'Choline precursor that crosses the blood-brain barrier; studied for cognitive performance and growth hormone.',
    findings: [
      { title: 'Cognitive function', detail: 'Alpha-GPC increased acetylcholine levels and improved memory in controlled studies.', citation: 'PMID: 24139485', quality: 'medium' },
      { title: 'Athletic power output', detail: 'Single-dose alpha-GPC improved lower-body force production in college-age athletes.', citation: 'PMID: 25933483', quality: 'medium' },
    ],
    interactions: [
      { label: 'Caffeine', severity: 'synergy', note: 'Common nootropic pairing for focus and alertness.' },
      { label: 'Racetams', severity: 'synergy', note: 'Stacked to supply choline demand from racetam use.' },
    ],
    sideEffects: [
      { label: 'Headache', incidence: 'low', mitigation: 'Reduce dose; often resolves with continued use.' },
      { label: 'GI upset', incidence: 'low', mitigation: 'Take with food.' },
    ],
    medicineInteractions: [
      { medicineName: 'Anticholinergic drugs', severity: 'moderate', mechanism: 'Alpha-GPC increases acetylcholine — may oppose anticholinergic effects.', recommendation: 'Discuss with prescriber before stacking.' },
    ],
  },
  // 2. Beta-Alanine
  {
    supplementSlug: 'beta-alanine',
    summary: 'Amino acid that buffers muscle acidity via carnosine synthesis; well-studied for high-intensity endurance.',
    findings: [
      { title: 'Muscular endurance', detail: 'Meta-analysis confirmed improved exercise capacity at 60–240s durations.', citation: 'PMID: 22988454', quality: 'high' },
      { title: 'Carnosine elevation', detail: 'Oral beta-alanine reliably increases muscle carnosine content over 4–12 weeks.', citation: 'PMID: 20479615', quality: 'high' },
    ],
    interactions: [
      { label: 'Creatine', severity: 'synergy', note: 'Common pre-workout pairing for strength and endurance.' },
      { label: 'Taurine', severity: 'moderate', note: 'May compete for same transporter; separate if using both.' },
    ],
    sideEffects: [
      { label: 'Paresthesia (tingling/flushing)', incidence: 'very common', mitigation: 'Use slow-release form or split doses; harmless.' },
    ],
    medicineInteractions: [
      { medicineName: 'No significant interactions known at typical doses', severity: 'low', mechanism: 'Generally considered safe.', recommendation: 'Monitor if on cardiac medications.' },
    ],
  },
  // 3. Trans-Resveratrol
  {
    supplementSlug: 'trans-resveratrol',
    summary: 'Polyphenol with SIRT1 activation and anti-inflammatory properties; bioavailability is key variable.',
    findings: [
      { title: 'SIRT1 / longevity pathways', detail: 'Activates sirtuin pathways in vitro and in some animal models; human data limited.', citation: 'PMID: 17086194', quality: 'medium' },
      { title: 'Cardiovascular markers', detail: 'Modest improvements in endothelial function in some trials.', citation: 'PMID: 22852062', quality: 'medium' },
    ],
    interactions: [
      { label: 'NMN / NR', severity: 'synergy', note: 'Popular longevity stack; theoretical NAD+ pathway synergy.' },
      { label: 'Quercetin', severity: 'synergy', note: 'Polyphenol stack for anti-inflammatory support.' },
    ],
    sideEffects: [
      { label: 'GI upset at high doses', incidence: 'low', mitigation: 'Take with food; start at lower doses.' },
    ],
    medicineInteractions: [
      { medicineName: 'Warfarin', severity: 'moderate', mechanism: 'May affect CYP2C9 enzyme metabolism of warfarin.', recommendation: 'Monitor INR; discuss with prescriber.' },
      { medicineName: 'Statins', severity: 'low', mechanism: 'Some CYP3A4 overlap; interaction at high doses possible.', recommendation: 'Standard doses generally considered safe.' },
    ],
  },
  // 4. Quercetin
  {
    supplementSlug: 'quercetin-dihydrate',
    summary: 'Flavonoid with broad anti-inflammatory and antioxidant activity; often stacked with bromelain for bioavailability.',
    findings: [
      { title: 'Anti-inflammatory markers', detail: 'Reduces IL-6 and TNF-alpha in some clinical trials.', citation: 'PMID: 27187333', quality: 'medium' },
      { title: 'Senolytic activity', detail: 'Quercetin + dasatinib combination cleared senescent cells in small human trial.', citation: 'PMID: 30010988', quality: 'medium' },
    ],
    interactions: [
      { label: 'Bromelain', severity: 'synergy', note: 'Bromelain enhances quercetin absorption.' },
      { label: 'Vitamin C', severity: 'synergy', note: 'Antioxidant synergy; commonly co-supplemented.' },
    ],
    sideEffects: [
      { label: 'Headache at high doses', incidence: 'low', mitigation: 'Keep doses under 1g/day unless supervised.' },
    ],
    medicineInteractions: [
      { medicineName: 'Cyclosporine', severity: 'high', mechanism: 'CYP3A4 inhibition may increase immunosuppressant levels.', recommendation: 'Avoid without medical supervision.' },
      { medicineName: 'Fluoroquinolone antibiotics', severity: 'moderate', mechanism: 'May reduce antibiotic absorption.', recommendation: 'Separate by 2+ hours.' },
    ],
  },
  // 5. NMN (Nicotinamide Mononucleotide)
  {
    supplementSlug: 'nicotinamide-mononucleotide-nmn',
    summary: 'NAD+ precursor with emerging longevity and metabolic research; human trial data growing.',
    findings: [
      { title: 'NAD+ elevation', detail: 'Oral NMN significantly increased blood NAD+ levels in healthy adults.', citation: 'PMID: 33888596', quality: 'medium' },
      { title: 'Insulin sensitivity', detail: 'NMN supplementation improved muscle insulin sensitivity in postmenopausal women.', citation: 'PMID: 33888596', quality: 'medium' },
    ],
    interactions: [
      { label: 'Resveratrol', severity: 'synergy', note: 'Popular longevity stack; resveratrol activates SIRT1 which uses NAD+.' },
      { label: 'Exercise', severity: 'synergy', note: 'Exercise also raises NAD+ — combined effect studied.' },
    ],
    sideEffects: [
      { label: 'Generally well tolerated', incidence: 'low', mitigation: 'Start at lower doses (250mg); few adverse effects reported in trials.' },
    ],
    medicineInteractions: [
      { medicineName: 'Chemotherapy agents', severity: 'high', mechanism: 'NAD+ elevation may affect cancer cell metabolism.', recommendation: 'Avoid during active cancer treatment without oncologist approval.' },
    ],
  },
  // 6. NR (Nicotinamide Riboside)
  {
    supplementSlug: 'nicotinamide-riboside-nr',
    summary: 'Alternate NAD+ precursor to NMN; oral bioavailability established in multiple human studies.',
    findings: [
      { title: 'NAD+ elevation in humans', detail: 'Randomized trial confirmed dose-dependent NAD+ increase in blood.', citation: 'PMID: 27487330', quality: 'high' },
      { title: 'Cardiovascular markers', detail: 'NR supplementation reduced aortic stiffness in older adults.', citation: 'PMID: 29924215', quality: 'medium' },
    ],
    interactions: [
      { label: 'Pterostilbene', severity: 'synergy', note: 'Commercially combined (Tru Niagen + pterostilbene) for NAD+ stack.' },
    ],
    sideEffects: [
      { label: 'Flushing (mild, less than niacin)', incidence: 'low', mitigation: 'Take with food; less common than nicotinic acid.' },
    ],
    medicineInteractions: [
      { medicineName: 'Isoniazid (TB treatment)', severity: 'moderate', mechanism: 'Both affect NAD+ metabolism; interaction possible.', recommendation: 'Consult prescriber if on TB therapy.' },
    ],
  },
  // 7. Rhodiola Rosea
  {
    supplementSlug: 'rhodiola-rosea',
    summary: 'Adaptogen with evidence for fatigue reduction and stress resilience; standardized for rosavins/salidroside.',
    findings: [
      { title: 'Mental fatigue', detail: 'Reduced mental fatigue scores and improved cognitive performance under stress.', citation: 'PMID: 10839209', quality: 'medium' },
      { title: 'Physical endurance', detail: 'Improved time-to-exhaustion and VO2 max in some endurance trials.', citation: 'PMID: 15256690', quality: 'medium' },
    ],
    interactions: [
      { label: 'Ashwagandha', severity: 'synergy', note: 'Both adaptogens; sometimes combined in stress-support stacks.' },
      { label: 'Caffeine', severity: 'moderate', note: 'Both stimulating; combine cautiously and avoid evening use.' },
    ],
    sideEffects: [
      { label: 'Insomnia / agitation at high doses', incidence: 'low', mitigation: 'Take earlier in the day; start with lower dose.' },
      { label: 'Dizziness', incidence: 'low', mitigation: 'Use standardized extracts at evidence-based doses.' },
    ],
    medicineInteractions: [
      { medicineName: 'SSRIs / SNRIs', severity: 'moderate', mechanism: 'Rhodiola may affect monoamine metabolism; additive CNS effects possible.', recommendation: 'Use caution and inform prescriber.' },
      { medicineName: 'Anticoagulants', severity: 'low', mechanism: 'Theoretical mild platelet effects at high doses.', recommendation: 'Standard doses considered low risk.' },
    ],
  },
  // 8. Collagen Peptides
  {
    supplementSlug: 'collagen-peptides',
    summary: 'Hydrolyzed collagen providing glycine/proline for connective tissue support; studied for joints and skin.',
    findings: [
      { title: 'Joint pain reduction', detail: 'Collagen hydrolysate reduced joint pain in athletes in randomized trial.', citation: 'PMID: 18416885', quality: 'medium' },
      { title: 'Skin elasticity', detail: 'Oral collagen peptides improved skin elasticity and hydration in women >35.', citation: 'PMID: 24401291', quality: 'medium' },
    ],
    interactions: [
      { label: 'Vitamin C', severity: 'synergy', note: 'Vitamin C is essential cofactor for collagen synthesis — take together.' },
    ],
    sideEffects: [
      { label: 'Mild GI discomfort', incidence: 'low', mitigation: 'Take with liquid; most tolerate well.' },
      { label: 'Hypercalcemia risk with marine collagen at high doses', incidence: 'very low', mitigation: 'Standard doses safe.' },
    ],
    medicineInteractions: [
      { medicineName: 'No significant drug interactions known', severity: 'low', mechanism: 'Food-derived protein supplement.', recommendation: 'Generally safe with all medications.' },
    ],
  },
  // 9. 5-HTP (5-Hydroxytryptophan)
  {
    supplementSlug: '5-hydroxytryptophan-5-htp',
    summary: 'Direct serotonin precursor derived from Griffonia simplicifolia; studied for mood and sleep.',
    findings: [
      { title: 'Mood support', detail: 'Small trials suggest 5-HTP comparable to some antidepressants in mild depression.', citation: 'PMID: 9727088', quality: 'medium' },
      { title: 'Sleep onset', detail: 'May improve sleep quality and reduce time to sleep onset via serotonin → melatonin pathway.', citation: 'PMID: 20840865', quality: 'medium' },
    ],
    interactions: [
      { label: 'Melatonin', severity: 'synergy', note: 'Sequential pathway: 5-HTP → serotonin → melatonin; bedtime stack.' },
      { label: 'L-Theanine', severity: 'synergy', note: 'Calming stack for anxiety and sleep.' },
    ],
    sideEffects: [
      { label: 'Nausea', incidence: 'common', mitigation: 'Take with food; start at 50mg.' },
      { label: 'GI upset / diarrhea', incidence: 'moderate', mitigation: 'Reduce dose if GI side effects occur.' },
    ],
    medicineInteractions: [
      { medicineName: 'SSRIs / SNRIs', severity: 'high', mechanism: 'Risk of serotonin syndrome — additive serotonergic effects.', recommendation: 'Contraindicated with SSRIs/SNRIs without direct medical supervision.' },
      { medicineName: 'MAOIs', severity: 'contraindicated', mechanism: 'Severe serotonin syndrome risk.', recommendation: 'Do not combine.' },
      { medicineName: 'Tramadol', severity: 'high', mechanism: 'Tramadol affects serotonin reuptake; additive serotonergic risk.', recommendation: 'Avoid combination.' },
    ],
  },
  // 10. GABA
  {
    supplementSlug: 'gamma-aminobutyric-acid',
    summary: 'Primary inhibitory neurotransmitter supplement; oral BBB penetration debated but some effects observed.',
    findings: [
      { title: 'Relaxation and anxiety', detail: 'Oral GABA reduced anxiety scores and altered brain waves in some studies.', citation: 'PMID: 16971751', quality: 'medium' },
      { title: 'Sleep quality', detail: 'GABA combined with L-theanine reduced sleep latency in clinical trial.', citation: 'PMID: 30707852', quality: 'medium' },
    ],
    interactions: [
      { label: 'L-Theanine', severity: 'synergy', note: 'Commonly combined for sleep support; synergistic in trial.' },
      { label: 'Magnesium', severity: 'synergy', note: 'Magnesium supports GABA receptor function.' },
    ],
    sideEffects: [
      { label: 'Drowsiness', incidence: 'low', mitigation: 'Avoid driving if sensitive; best used before bed.' },
      { label: 'Tingling / flushing', incidence: 'low', mitigation: 'Transient; reduces with continued use.' },
    ],
    medicineInteractions: [
      { medicineName: 'Benzodiazepines', severity: 'high', mechanism: 'Additive CNS depressant effect.', recommendation: 'Do not combine without medical supervision.' },
      { medicineName: 'Alcohol', severity: 'moderate', mechanism: 'Both enhance GABA activity; additive sedation.', recommendation: 'Avoid alcohol when supplementing.' },
    ],
  },
  // 11. Probiotics (Lactobacillus Acidophilus)
  {
    supplementSlug: 'lactobacillus-acidophilus',
    summary: 'Lactic acid bacterium commonly used to support gut microbiome balance and digestive health.',
    findings: [
      { title: 'Antibiotic-associated diarrhea', detail: 'Meta-analysis confirmed probiotics reduce antibiotic-associated diarrhea risk.', citation: 'PMID: 23235587', quality: 'high' },
      { title: 'IBS symptom relief', detail: 'Some Lactobacillus strains improved bloating and bowel habits in IBS patients.', citation: 'PMID: 20648001', quality: 'medium' },
    ],
    interactions: [
      { label: 'Prebiotics (Inulin/FOS)', severity: 'synergy', note: 'Prebiotics feed probiotic bacteria; classic synbiotic pairing.' },
      { label: 'Antibiotics', severity: 'moderate', note: 'Take probiotics 2+ hours away from antibiotic dose to preserve viability.' },
    ],
    sideEffects: [
      { label: 'Bloating / gas initially', incidence: 'common', mitigation: 'Typically resolves in 1–2 weeks; reduce dose if persistent.' },
    ],
    medicineInteractions: [
      { medicineName: 'Antibiotics', severity: 'moderate', mechanism: 'Antibiotics may kill probiotic organisms.', recommendation: 'Separate by 2+ hours; continue probiotics during antibiotic course.' },
      { medicineName: 'Immunosuppressants', severity: 'high', mechanism: 'Live bacteria theoretically risky in severely immunocompromised patients.', recommendation: 'Consult physician before use in immunosuppressed individuals.' },
    ],
  },
  // 12. Melatonin (already has science, adding for completeness — skip if exists)
  // 13. Phosphatidylserine
  {
    supplementSlug: 'phosphatidylserine',
    summary: 'Phospholipid component of neuronal membranes; studied for cognitive function and cortisol modulation.',
    findings: [
      { title: 'Cognitive function in aging', detail: 'Phosphatidylserine improved memory and cognitive function in elderly with memory complaints.', citation: 'PMID: 2021880', quality: 'medium' },
      { title: 'Cortisol response to exercise', detail: 'Blunted cortisol rise after intense exercise in some trials.', citation: 'PMID: 18981063', quality: 'medium' },
    ],
    interactions: [
      { label: 'Omega-3', severity: 'synergy', note: 'DHA is the predominant fatty acid in PS; often co-supplemented.' },
    ],
    sideEffects: [
      { label: 'Insomnia at high doses', incidence: 'low', mitigation: 'Take earlier in the day; keep under 400mg.' },
    ],
    medicineInteractions: [
      { medicineName: 'Anticoagulants', severity: 'moderate', mechanism: 'Phosphatidylserine may mildly affect platelet function.', recommendation: 'Monitor if on blood thinners.' },
      { medicineName: 'Anticholinergics', severity: 'moderate', mechanism: 'PS may increase acetylcholine — potential opposition of anticholinergic effects.', recommendation: 'Discuss with prescriber.' },
    ],
  },
  // 14. Alpha-Lipoic Acid
  {
    supplementSlug: 'alpha-lipoic-acid-ala',
    summary: 'Mitochondrial antioxidant cofactor; both water and fat soluble; studied for neuropathy and glucose metabolism.',
    findings: [
      { title: 'Diabetic neuropathy', detail: 'Multiple RCTs show ALA reduces neuropathy symptoms in diabetic patients.', citation: 'PMID: 22469669', quality: 'high' },
      { title: 'Insulin sensitivity', detail: 'ALA improved insulin-stimulated glucose disposal in type 2 diabetes.', citation: 'PMID: 9742976', quality: 'medium' },
    ],
    interactions: [
      { label: 'Biotin', severity: 'moderate', note: 'ALA may compete with biotin — separate by 2+ hours if both used.' },
      { label: 'Vitamin C + E', severity: 'synergy', note: 'ALA recycles vitamins C and E in antioxidant cycle.' },
    ],
    sideEffects: [
      { label: 'Nausea', incidence: 'moderate', mitigation: 'Take with food; R-form generally better tolerated.' },
      { label: 'Hypoglycemia (in diabetics)', incidence: 'low', mitigation: 'Monitor blood glucose; may reduce insulin requirements.' },
    ],
    medicineInteractions: [
      { medicineName: 'Insulin / hypoglycemics', severity: 'high', mechanism: 'ALA has insulin-sensitizing effects; may cause additive blood glucose lowering.', recommendation: 'Monitor glucose closely; adjust medication with prescriber guidance.' },
      { medicineName: 'Thyroid medications (Levothyroxine)', severity: 'moderate', mechanism: 'ALA may affect thyroid hormone levels.', recommendation: 'Separate doses; monitor thyroid function.' },
    ],
  },
  // 15. Acetyl-L-Carnitine (ALCAR)
  {
    supplementSlug: 'acetyl-l-carnitine-alcar',
    summary: 'Brain-penetrating carnitine form; studied for cognitive support, nerve health, and mitochondrial function.',
    findings: [
      { title: 'Cognitive aging support', detail: 'ALCAR improved memory and cognitive function in early Alzheimer\'s and MCI studies.', citation: 'PMID: 12614534', quality: 'medium' },
      { title: 'Neuropathic pain', detail: 'Reduced neuropathic pain scores in diabetic and chemotherapy-induced neuropathy.', citation: 'PMID: 12656831', quality: 'medium' },
    ],
    interactions: [
      { label: 'Alpha-Lipoic Acid', severity: 'synergy', note: 'Classic mitochondrial support stack; studied together in aging research.' },
      { label: 'CoQ10', severity: 'synergy', note: 'Both support mitochondrial function; often co-supplemented.' },
    ],
    sideEffects: [
      { label: 'Fishy body odor (rare)', incidence: 'very low', mitigation: 'Lower dose; consider switching to L-carnitine.' },
      { label: 'Agitation / insomnia', incidence: 'low', mitigation: 'Avoid evening doses; stimulating in some individuals.' },
    ],
    medicineInteractions: [
      { medicineName: 'Anticoagulants (Warfarin)', severity: 'moderate', mechanism: 'L-carnitine may increase anticoagulant effect.', recommendation: 'Monitor INR.' },
      { medicineName: 'Anticonvulsants (Valproic acid)', severity: 'moderate', mechanism: 'Valproate may deplete carnitine; supplementation may be beneficial but monitor.', recommendation: 'Discuss with neurologist.' },
    ],
  },
  // 16. Bacopa Monnieri
  {
    supplementSlug: 'bacopa-monnieri-extract-bacosides',
    summary: 'Ayurvedic adaptogen nootropic; well-studied for memory consolidation with 8–12 week effect timeline.',
    findings: [
      { title: 'Memory consolidation', detail: 'Meta-analysis confirmed improved free recall and memory acquisition over 12 weeks.', citation: 'PMID: 24252493', quality: 'high' },
      { title: 'Anxiety reduction', detail: 'Reduced anxiety scores and cortisol in some RCTs.', citation: 'PMID: 22747190', quality: 'medium' },
    ],
    interactions: [
      { label: 'L-Theanine', severity: 'synergy', note: 'Calming nootropic stack for focus and anxiety.' },
    ],
    sideEffects: [
      { label: 'GI upset / nausea', incidence: 'moderate', mitigation: 'Take with food; most common side effect.' },
    ],
    medicineInteractions: [
      { medicineName: 'Thyroid medications', severity: 'moderate', mechanism: 'Bacopa may affect thyroid hormone levels.', recommendation: 'Monitor thyroid function if supplementing long-term.' },
      { medicineName: 'Anticholinergics', severity: 'moderate', mechanism: 'Bacopa may increase acetylcholine activity.', recommendation: 'Use caution in combination with anticholinergic drugs.' },
    ],
  },
  // 17. Curcumin
  {
    supplementSlug: 'curcumin-with-piperine',
    summary: 'Anti-inflammatory polyphenol from turmeric; bioavailability-enhanced forms required for systemic effect.',
    findings: [
      { title: 'Joint inflammation', detail: 'Curcumin comparable to NSAIDs for osteoarthritis pain in some trials.', citation: 'PMID: 25629822', quality: 'medium' },
      { title: 'CRP reduction', detail: 'Meta-analysis showed significant reduction in C-reactive protein (CRP).', citation: 'PMID: 26007179', quality: 'high' },
    ],
    interactions: [
      { label: 'Piperine (Black pepper)', severity: 'synergy', note: 'Piperine increases curcumin bioavailability by up to 2000%.' },
      { label: 'Boswellia', severity: 'synergy', note: 'Common anti-inflammatory stack for joints.' },
    ],
    sideEffects: [
      { label: 'GI upset at high doses', incidence: 'low', mitigation: 'Take with food; use bioavailability-enhanced forms at lower doses.' },
    ],
    medicineInteractions: [
      { medicineName: 'Warfarin', severity: 'high', mechanism: 'Curcumin inhibits platelet aggregation and may increase bleeding risk.', recommendation: 'Monitor INR closely; inform prescriber.' },
      { medicineName: 'Chemotherapy (taxol, cyclophosphamide)', severity: 'moderate', mechanism: 'Curcumin may affect drug metabolism via CYP enzymes.', recommendation: 'Avoid high-dose supplementation during chemotherapy without oncologist approval.' },
    ],
  },
  // 18. Panax Ginseng
  {
    supplementSlug: 'panax-ginseng-asian',
    summary: 'Classic adaptogen with evidence for energy, cognitive function, and immune support.',
    findings: [
      { title: 'Cognitive performance', detail: 'Improved working memory and mental arithmetic in healthy adults.', citation: 'PMID: 10820366', quality: 'medium' },
      { title: 'Fatigue and energy', detail: 'Reduced fatigue scores and improved quality of life in cancer patients and healthy adults.', citation: 'PMID: 23613825', quality: 'medium' },
    ],
    interactions: [
      { label: 'Rhodiola', severity: 'synergy', note: 'Adaptogen combination; used in some fatigue protocols.' },
    ],
    sideEffects: [
      { label: 'Insomnia / excitability', incidence: 'low', mitigation: 'Avoid evening use; cycle with breaks.' },
      { label: 'Hypertension at high doses', incidence: 'very low', mitigation: 'Use evidence-based doses.' },
    ],
    medicineInteractions: [
      { medicineName: 'Warfarin', severity: 'high', mechanism: 'Ginseng may reduce warfarin efficacy via CYP induction.', recommendation: 'Monitor INR closely.' },
      { medicineName: 'MAOIs', severity: 'high', mechanism: 'Risk of mania and hypertension reported.', recommendation: 'Contraindicated with MAOIs.' },
      { medicineName: 'Diabetes medications', severity: 'moderate', mechanism: 'Ginseng may lower blood glucose; additive hypoglycemic effect.', recommendation: 'Monitor glucose levels.' },
    ],
  },
  // 19. Maca Root
  {
    supplementSlug: 'gelatinized-maca',
    summary: 'Andean root vegetable studied for libido, energy, and hormonal support; gelatinized form improves digestibility.',
    findings: [
      { title: 'Libido enhancement', detail: 'Maca improved sexual desire independently of testosterone in men in 12-week trial.', citation: 'PMID: 12472620', quality: 'medium' },
      { title: 'Menopausal symptoms', detail: 'Reduced menopausal discomfort (hot flashes, night sweats) in some studies.', citation: 'PMID: 17404227', quality: 'medium' },
    ],
    interactions: [
      { label: 'Ashwagandha', severity: 'synergy', note: 'Adaptogen pairing for hormonal balance and energy.' },
    ],
    sideEffects: [
      { label: 'GI upset (raw form)', incidence: 'low', mitigation: 'Use gelatinized form for better tolerability.' },
    ],
    medicineInteractions: [
      { medicineName: 'Hormone replacement therapy', severity: 'moderate', mechanism: 'May have additive hormonal effects.', recommendation: 'Discuss with prescriber before combining.' },
      { medicineName: 'Thyroid medications', severity: 'low', mechanism: 'May affect thyroid function at very high doses.', recommendation: 'Standard doses considered safe.' },
    ],
  },
  // 20. Boswellia Serrata
  {
    supplementSlug: 'boswellia-serrata-akba',
    summary: 'Anti-inflammatory resin standardized for AKBA; studied for osteoarthritis and inflammatory conditions.',
    findings: [
      { title: 'Osteoarthritis pain', detail: 'Boswellia extract significantly reduced knee pain and improved function vs placebo.', citation: 'PMID: 18072528', quality: 'high' },
      { title: 'IBD support', detail: 'Boswellia reduced IBD activity scores in clinical trials.', citation: 'PMID: 11215842', quality: 'medium' },
    ],
    interactions: [
      { label: 'Curcumin', severity: 'synergy', note: 'Classic anti-inflammatory joint stack; complementary mechanisms.' },
      { label: 'Fish oil', severity: 'synergy', note: 'Anti-inflammatory synergy via different pathways.' },
    ],
    sideEffects: [
      { label: 'Nausea / acid reflux', incidence: 'low', mitigation: 'Take with food.' },
    ],
    medicineInteractions: [
      { medicineName: 'NSAIDs', severity: 'low', mechanism: 'Complementary anti-inflammatory pathways; generally safe together.', recommendation: 'No significant interaction; may reduce NSAID requirement.' },
      { medicineName: 'Anticoagulants', severity: 'low', mechanism: 'Minor platelet effects reported at high doses.', recommendation: 'Standard doses generally safe; monitor if on warfarin.' },
    ],
  },
  // 21. Berberine (already seeded — adding rich data)
  // 22. Glucosamine Sulfate
  {
    supplementSlug: 'glucosamine-sulfate',
    summary: 'Amino sugar studied for joint cartilage support; most-studied natural OA treatment.',
    findings: [
      { title: 'Osteoarthritis symptom relief', detail: 'Long-term glucosamine sulfate (3 years) slowed joint space narrowing in knee OA.', citation: 'PMID: 11410146', quality: 'high' },
      { title: 'Pain and function', detail: 'Some meta-analyses show significant improvement in pain and function vs placebo.', citation: 'PMID: 15846645', quality: 'medium' },
    ],
    interactions: [
      { label: 'Chondroitin', severity: 'synergy', note: 'Classic joint stack; most studied in combination.' },
      { label: 'MSM', severity: 'synergy', note: 'Added to joint supplements for anti-inflammatory support.' },
    ],
    sideEffects: [
      { label: 'GI upset', incidence: 'low', mitigation: 'Take with food.' },
      { label: 'Blood glucose elevation (theoretical)', incidence: 'very low', mitigation: 'Monitor glucose in diabetics.' },
    ],
    medicineInteractions: [
      { medicineName: 'Warfarin', severity: 'moderate', mechanism: 'Some cases of elevated INR reported; mechanism unclear.', recommendation: 'Monitor INR if adding glucosamine.' },
      { medicineName: 'Insulin / antidiabetics', severity: 'low', mechanism: 'Theoretical insulin resistance effect; generally not seen at typical doses.', recommendation: 'Monitor blood glucose in diabetics.' },
    ],
  },
  // 23. MSM (Methylsulfonylmethane)
  {
    supplementSlug: 'methylsulfonylmethane-msm',
    summary: 'Organosulfur compound used for joint health, anti-inflammation, and muscle recovery.',
    findings: [
      { title: 'Joint pain reduction', detail: 'MSM reduced knee pain and improved physical function in OA patients.', citation: 'PMID: 16309928', quality: 'medium' },
      { title: 'Exercise recovery', detail: 'MSM reduced exercise-induced muscle damage markers in athletes.', citation: 'PMID: 22525653', quality: 'medium' },
    ],
    interactions: [
      { label: 'Glucosamine + Chondroitin', severity: 'synergy', note: 'Triple joint stack; widely used together.' },
    ],
    sideEffects: [
      { label: 'GI upset at high doses', incidence: 'low', mitigation: 'Split doses; take with food.' },
    ],
    medicineInteractions: [
      { medicineName: 'Anticoagulants', severity: 'low', mechanism: 'Sulfur compounds may mildly affect platelet aggregation.', recommendation: 'Standard doses generally safe; monitor if on warfarin.' },
    ],
  },
  // 24. L-Tyrosine
  {
    supplementSlug: 'l-tyrosine',
    summary: 'Catecholamine precursor used for stress resilience, focus under cognitive load, and cold/fatigue tolerance.',
    findings: [
      { title: 'Cognitive performance under stress', detail: 'L-Tyrosine improved working memory and cognitive flexibility during stressful multitasking.', citation: 'PMID: 10230711', quality: 'medium' },
      { title: 'Fatigue and cold exposure', detail: 'Tyrosine reduced performance decrements from cold stress and sleep deprivation.', citation: 'PMID: 9425004', quality: 'medium' },
    ],
    interactions: [
      { label: 'Caffeine', severity: 'synergy', note: 'Common pre-work focus stack.' },
      { label: 'L-Theanine', severity: 'synergy', note: 'Nootropic stack for calm focus.' },
    ],
    sideEffects: [
      { label: 'Headache / anxiety at high doses', incidence: 'low', mitigation: 'Keep under 2g at once; cycle use.' },
    ],
    medicineInteractions: [
      { medicineName: 'MAOIs', severity: 'contraindicated', mechanism: 'Tyrosine is a precursor to sympathomimetic amines; hypertensive crisis risk.', recommendation: 'Contraindicated with MAOIs.' },
      { medicineName: 'Levodopa (for Parkinsons)', severity: 'high', mechanism: 'Competition for intestinal and blood-brain barrier transport.', recommendation: 'Separate by 4+ hours; discuss with neurologist.' },
      { medicineName: 'Thyroid medications', severity: 'moderate', mechanism: 'Tyrosine is a precursor to thyroid hormones.', recommendation: 'Monitor thyroid function if supplementing long-term.' },
    ],
  },
  // 25. Taurine
  {
    supplementSlug: 'l-taurine',
    summary: 'Conditionally essential amino acid with cardiovascular, neurological, and exercise applications.',
    findings: [
      { title: 'Cardiovascular health', detail: 'Taurine supplementation improved heart failure outcomes and exercise tolerance.', citation: 'PMID: 23720793', quality: 'medium' },
      { title: 'Exercise performance', detail: 'Reduced muscle soreness and improved endurance capacity in some trials.', citation: 'PMID: 21855797', quality: 'medium' },
    ],
    interactions: [
      { label: 'Magnesium', severity: 'synergy', note: 'Both support heart rhythm and muscular function.' },
      { label: 'Beta-Alanine', severity: 'moderate', note: 'May compete for same transporter — separate if using both.' },
    ],
    sideEffects: [
      { label: 'Generally very well tolerated', incidence: 'low', mitigation: 'One of the safest amino acid supplements.' },
    ],
    medicineInteractions: [
      { medicineName: 'Diuretics', severity: 'low', mechanism: 'Taurine has mild diuretic properties; additive effect possible.', recommendation: 'Monitor electrolytes.' },
    ],
  },
  // 26. Chondroitin Sulfate
  {
    supplementSlug: 'chondroitin-sulfate',
    summary: 'Structural glycosaminoglycan for cartilage; most studied in combination with glucosamine for OA.',
    findings: [
      { title: 'Cartilage protection', detail: 'Chondroitin slowed cartilage loss in knee OA over 2 years (GAIT trial).', citation: 'PMID: 16495392', quality: 'high' },
      { title: 'Symptom relief', detail: 'Modest pain reduction in OA; most effective when combined with glucosamine.', citation: 'PMID: 15846645', quality: 'medium' },
    ],
    interactions: [
      { label: 'Glucosamine', severity: 'synergy', note: 'Classic joint health combination.' },
    ],
    sideEffects: [
      { label: 'Mild GI effects', incidence: 'low', mitigation: 'Take with food.' },
    ],
    medicineInteractions: [
      { medicineName: 'Warfarin', severity: 'moderate', mechanism: 'May potentiate anticoagulant effect; structural similarity to heparin.', recommendation: 'Monitor INR if on anticoagulation therapy.' },
    ],
  },
  // 27. Vitamin B6 (P5P)
  {
    supplementSlug: 'pyridoxal-5-phosphate-p5p',
    summary: 'Active form of vitamin B6; essential cofactor for 100+ enzymatic reactions including neurotransmitter synthesis.',
    findings: [
      { title: 'PMS symptom relief', detail: 'B6 significantly reduced PMS symptoms in meta-analysis.', citation: 'PMID: 10796532', quality: 'high' },
      { title: 'Homocysteine reduction', detail: 'B6 combined with B12 and folate lowers elevated homocysteine.', citation: 'PMID: 18838531', quality: 'high' },
    ],
    interactions: [
      { label: 'B12 + Folate', severity: 'synergy', note: 'B-complex methylation cycle support — commonly combined.' },
      { label: 'Magnesium', severity: 'synergy', note: 'B6 enhances magnesium cellular uptake.' },
    ],
    sideEffects: [
      { label: 'Peripheral neuropathy at very high doses (>500mg/day)', incidence: 'rare', mitigation: 'P5P at normal doses (10-50mg) considered safe; avoid megadosing.' },
    ],
    medicineInteractions: [
      { medicineName: 'Levodopa (Parkinson\'s)', severity: 'high', mechanism: 'B6 enhances peripheral metabolism of levodopa, reducing CNS availability.', recommendation: 'Avoid high-dose B6 unless taking carbidopa combination.' },
      { medicineName: 'Phenobarbital / Phenytoin', severity: 'moderate', mechanism: 'B6 may reduce serum anticonvulsant levels.', recommendation: 'Monitor anticonvulsant levels if supplementing.' },
    ],
  },
  // 28. Folate / L-Methylfolate
  {
    supplementSlug: 'l-methylfolate-5-mthf',
    summary: 'Active methylfolate form bypasses MTHFR polymorphisms; essential for methylation and neurotransmitter synthesis.',
    findings: [
      { title: 'Depression (adjunct)', detail: 'L-Methylfolate as adjunct to antidepressants improved outcomes in MTHFR-variant patients.', citation: 'PMID: 23154195', quality: 'medium' },
      { title: 'Homocysteine reduction', detail: 'Active folate reliably reduces elevated homocysteine better than folic acid in MTHFR+.', citation: 'PMID: 16651297', quality: 'high' },
    ],
    interactions: [
      { label: 'B12 + B6', severity: 'synergy', note: 'Methylation cycle triad — commonly combined.' },
    ],
    sideEffects: [
      { label: 'Anxiety / overstimulation at high doses', incidence: 'low', mitigation: 'Start at 400mcg; some with MTHFR variants are sensitive.' },
    ],
    medicineInteractions: [
      { medicineName: 'Methotrexate', severity: 'high', mechanism: 'Folate antagonism is mechanism of methotrexate; supplementation may reduce efficacy.', recommendation: 'Timing and dose must be managed by rheumatologist or oncologist.' },
      { medicineName: 'Anticonvulsants', severity: 'moderate', mechanism: 'Some anticonvulsants deplete folate; supplementation may affect drug levels.', recommendation: 'Discuss with neurologist.' },
    ],
  },
  // 29. Hyaluronic Acid
  {
    supplementSlug: 'hyaluronic-acid',
    summary: 'Glycosaminoglycan that retains moisture in joints and skin; oral and topical forms studied.',
    findings: [
      { title: 'Knee joint pain', detail: 'Oral HA reduced knee pain and improved mobility in mild-moderate OA.', citation: 'PMID: 22849165', quality: 'medium' },
      { title: 'Skin hydration', detail: 'Oral HA improved skin hydration and wrinkle appearance over 12 weeks.', citation: 'PMID: 28761365', quality: 'medium' },
    ],
    interactions: [
      { label: 'Collagen + Vitamin C', severity: 'synergy', note: 'Joint and skin protocol triad.' },
    ],
    sideEffects: [
      { label: 'Generally very well tolerated', incidence: 'low', mitigation: 'One of the safest supplements in clinical use.' },
    ],
    medicineInteractions: [
      { medicineName: 'No significant drug interactions known', severity: 'low', mechanism: 'Endogenous compound.', recommendation: 'Generally safe with all medications.' },
    ],
  },
  // 30. Green Tea Extract (EGCG)
  {
    supplementSlug: 'green-tea-extract-egcg',
    summary: 'Catechin polyphenol with antioxidant, anti-inflammatory, and metabolic research; contains caffeine.',
    findings: [
      { title: 'Fat oxidation', detail: 'EGCG + caffeine combination significantly increased fat oxidation during exercise.', citation: 'PMID: 10584049', quality: 'high' },
      { title: 'Cardiovascular markers', detail: 'Green tea consumption associated with lower LDL and blood pressure in meta-analyses.', citation: 'PMID: 24972454', quality: 'medium' },
    ],
    interactions: [
      { label: 'Caffeine', severity: 'synergy', note: 'Naturally co-occurring; combination enhances thermogenesis.' },
      { label: 'Iron', severity: 'moderate', note: 'Tannins in green tea reduce non-heme iron absorption — separate by 1+ hour.' },
    ],
    sideEffects: [
      { label: 'GI upset on empty stomach', incidence: 'moderate', mitigation: 'Always take with food.' },
      { label: 'Liver stress at very high doses', incidence: 'rare', mitigation: 'Avoid mega-dose EGCG extracts (>800mg EGCG); stay within evidence-based range.' },
    ],
    medicineInteractions: [
      { medicineName: 'Warfarin', severity: 'moderate', mechanism: 'Vitamin K content and platelet effects may affect INR.', recommendation: 'Monitor INR; maintain consistent intake.' },
      { medicineName: 'Nadolol (beta-blocker)', severity: 'high', mechanism: 'Green tea significantly reduces nadolol plasma levels.', recommendation: 'Avoid concurrent use with nadolol.' },
      { medicineName: 'Bortezomib (chemotherapy)', severity: 'high', mechanism: 'EGCG may directly inhibit this cancer drug\'s mechanism.', recommendation: 'Avoid during bortezomib treatment.' },
    ],
  },
  // 31. Biotin
  {
    supplementSlug: 'biotin',
    summary: 'B-vitamin essential for fatty acid synthesis, gluconeogenesis, and amino acid catabolism; popular for hair/nails.',
    findings: [
      { title: 'Hair and nail strength', detail: 'High-dose biotin improved nail brittleness in clinical studies.', citation: 'PMID: 2908885', quality: 'medium' },
      { title: 'Glucose metabolism (MS patients)', detail: 'Very high-dose biotin improved clinical markers in progressive multiple sclerosis.', citation: 'PMID: 27169425', quality: 'medium' },
    ],
    interactions: [
      { label: 'Alpha-Lipoic Acid', severity: 'moderate', note: 'ALA may compete with biotin for uptake — separate by 2+ hours.' },
    ],
    sideEffects: [
      { label: 'Lab test interference', incidence: 'common', mitigation: 'High-dose biotin interferes with thyroid and cardiac troponin tests — stop 48h before labs.' },
    ],
    medicineInteractions: [
      { medicineName: 'Anticonvulsants', severity: 'moderate', mechanism: 'Some anticonvulsants deplete biotin.', recommendation: 'Monitor biotin status on long-term anticonvulsant therapy.' },
    ],
  },
  // 32. Niacin (Nicotinic Acid)
  {
    supplementSlug: 'nicotinic-acid-niacin',
    summary: 'B3 vitamin form that raises HDL and lowers triglycerides; less used since statin era due to flush.',
    findings: [
      { title: 'HDL elevation', detail: 'Niacin is most effective agent for raising HDL cholesterol.', citation: 'PMID: 20040945', quality: 'high' },
      { title: 'Triglyceride reduction', detail: 'Significant triglyceride lowering at pharmacological doses (1–3g/day).', citation: 'PMID: 20040945', quality: 'high' },
    ],
    interactions: [
      { label: 'Statins', severity: 'moderate', note: 'Historical combination; myopathy risk — discuss with prescriber.' },
    ],
    sideEffects: [
      { label: 'Flushing (prostaglandin-mediated)', incidence: 'very common', mitigation: 'Take with food; use aspirin 30min before; use slow-release form.' },
      { label: 'Hepatotoxicity at high doses (slow-release form)', incidence: 'low', mitigation: 'Prefer immediate-release; monitor liver enzymes.' },
    ],
    medicineInteractions: [
      { medicineName: 'Statins', severity: 'moderate', mechanism: 'Combination raises myopathy risk.', recommendation: 'Only combine under medical supervision.' },
      { medicineName: 'Diabetes medications', severity: 'moderate', mechanism: 'Niacin can raise blood glucose.', recommendation: 'Monitor glucose; adjust medications if needed.' },
    ],
  },
  // 33. Electrolytes (Potassium)
  {
    supplementSlug: 'potassium-citrate',
    summary: 'Essential electrolyte for heart rhythm, muscle function, and blood pressure regulation.',
    findings: [
      { title: 'Blood pressure reduction', detail: 'Meta-analysis: potassium supplementation significantly reduced systolic and diastolic BP.', citation: 'PMID: 23558164', quality: 'high' },
      { title: 'Kidney stone prevention', detail: 'Potassium citrate alkalinizes urine and reduces calcium oxalate stone formation.', citation: 'PMID: 3146252', quality: 'high' },
    ],
    interactions: [
      { label: 'Magnesium', severity: 'synergy', note: 'Magnesium required for proper cellular potassium retention.' },
      { label: 'Sodium', severity: 'moderate', note: 'Maintain appropriate Na:K ratio; high sodium increases potassium requirements.' },
    ],
    sideEffects: [
      { label: 'GI upset / nausea', incidence: 'moderate', mitigation: 'Always take with food and water.' },
      { label: 'Hyperkalemia (excess supplementation)', incidence: 'rare', mitigation: 'Do not exceed 99mg per dose without medical guidance; diet usually sufficient.' },
    ],
    medicineInteractions: [
      { medicineName: 'ACE inhibitors / ARBs', severity: 'high', mechanism: 'These drugs raise potassium levels; supplementation may cause dangerous hyperkalemia.', recommendation: 'Monitor potassium levels closely; supplement only under medical guidance.' },
      { medicineName: 'Potassium-sparing diuretics', severity: 'high', mechanism: 'Additive hyperkalemia risk.', recommendation: 'Avoid potassium supplementation unless specifically directed by prescriber.' },
    ],
  },
  // 34. Iodine
  {
    supplementSlug: 'potassium-iodide',
    summary: 'Essential trace mineral for thyroid hormone synthesis; deficiency causes goiter and hypothyroidism.',
    findings: [
      { title: 'Thyroid function support', detail: 'Iodine supplementation corrects deficiency and supports thyroid hormone production.', citation: 'PMID: 19594417', quality: 'high' },
    ],
    interactions: [
      { label: 'Selenium', severity: 'synergy', note: 'Selenium required for thyroid hormone conversion (T4→T3); important co-nutrient.' },
      { label: 'Thyroid medications', severity: 'high', note: 'Iodine directly affects thyroid function — critical to manage with prescriber if on thyroid meds.' },
    ],
    sideEffects: [
      { label: 'Thyroid dysfunction at excess doses', incidence: 'low', mitigation: 'Do not exceed upper tolerable intake (1100mcg/day); RDA is ~150mcg.' },
    ],
    medicineInteractions: [
      { medicineName: 'Levothyroxine', severity: 'high', mechanism: 'Iodine directly affects thyroid function and medication requirements.', recommendation: 'Inform prescriber before supplementing iodine if on thyroid medication.' },
      { medicineName: 'Antithyroid drugs (Methimazole)', severity: 'high', mechanism: 'Additive or opposing thyroid effects depending on dose.', recommendation: 'Only supplement under endocrinologist supervision.' },
    ],
  },
  // 35. DHEA
  {
    supplementSlug: 'dhea',
    summary: 'Adrenal steroid precursor that declines with age; studied for adrenal fatigue, bone density, and libido.',
    findings: [
      { title: 'Bone mineral density (women)', detail: 'DHEA supplementation improved BMD in older women with adrenal insufficiency.', citation: 'PMID: 11602537', quality: 'medium' },
      { title: 'Libido and well-being', detail: 'DHEA improved sexual function and well-being in women with adrenal insufficiency.', citation: 'PMID: 10468053', quality: 'medium' },
    ],
    interactions: [
      { label: 'Zinc', severity: 'synergy', note: 'Zinc supports testosterone synthesis downstream of DHEA.' },
    ],
    sideEffects: [
      { label: 'Acne / oily skin', incidence: 'moderate', mitigation: 'Use lowest effective dose; monitor hormone levels.' },
      { label: 'Hair loss (androgenic)', incidence: 'low', mitigation: 'Dose-dependent; test hormone levels before use.' },
    ],
    medicineInteractions: [
      { medicineName: 'Hormone replacement therapy', severity: 'high', mechanism: 'DHEA is a steroid precursor; additive hormonal effects.', recommendation: 'Only use under endocrinologist supervision.' },
      { medicineName: 'Insulin / antidiabetics', severity: 'moderate', mechanism: 'DHEA may affect insulin sensitivity.', recommendation: 'Monitor glucose if diabetic.' },
      { medicineName: 'Anticoagulants', severity: 'moderate', mechanism: 'DHEA may affect coagulation factors.', recommendation: 'Monitor INR if on warfarin.' },
    ],
  },
  // 36. Ginkgo Biloba
  {
    supplementSlug: 'standardized-extract-egb-761',
    summary: 'Standardized ginkgo extract (EGb 761) used for cognitive aging and circulation; most studied herbal nootropic.',
    findings: [
      { title: 'Cognitive function in aging', detail: 'EGb 761 improved cognitive performance and reduced dementia progression in some trials.', citation: 'PMID: 15577249', quality: 'medium' },
      { title: 'Tinnitus', detail: 'Some evidence for tinnitus reduction; results mixed across trials.', citation: 'PMID: 19141416', quality: 'low' },
    ],
    interactions: [
      { label: 'Bacopa', severity: 'synergy', note: 'Nootropic pairing for cognitive aging support.' },
    ],
    sideEffects: [
      { label: 'Headache', incidence: 'low', mitigation: 'Start at lower dose; typically resolves.' },
      { label: 'GI upset', incidence: 'low', mitigation: 'Take with food.' },
    ],
    medicineInteractions: [
      { medicineName: 'Warfarin / anticoagulants', severity: 'high', mechanism: 'Ginkgo inhibits platelet activating factor and may increase bleeding risk.', recommendation: 'Avoid with anticoagulants or monitor INR very closely.' },
      { medicineName: 'SSRIs', severity: 'moderate', mechanism: 'Case reports of serotonin syndrome; theoretical interaction.', recommendation: 'Use caution; inform prescriber.' },
      { medicineName: 'Seizure medications', severity: 'moderate', mechanism: 'Ginkgo may lower seizure threshold.', recommendation: 'Avoid in patients with seizure disorders.' },
    ],
  },
  // 37. Valerian Root
  {
    supplementSlug: 'valerian-root-extract',
    summary: 'Sedative herb most commonly used for sleep onset and anxiety; mechanism involves GABA-A receptors.',
    findings: [
      { title: 'Sleep onset', detail: 'Meta-analysis showed valerian improved sleep quality and reduced sleep latency.', citation: 'PMID: 16520197', quality: 'medium' },
      { title: 'Anxiety', detail: 'Some evidence for mild anxiolytic effect, though study quality variable.', citation: 'PMID: 12535473', quality: 'low' },
    ],
    interactions: [
      { label: 'Melatonin', severity: 'synergy', note: 'Common bedtime sleep stack.' },
      { label: 'Magnesium', severity: 'synergy', note: 'Relaxing mineral + calming herb pairing.' },
    ],
    sideEffects: [
      { label: 'Morning grogginess', incidence: 'moderate', mitigation: 'Use smallest effective dose; avoid if driving early.' },
      { label: 'Vivid dreams', incidence: 'low', mitigation: 'Lower dose if bothersome.' },
    ],
    medicineInteractions: [
      { medicineName: 'Benzodiazepines / Sleep medications', severity: 'high', mechanism: 'Additive CNS depressant effects.', recommendation: 'Do not combine without medical supervision.' },
      { medicineName: 'Alcohol', severity: 'moderate', mechanism: 'Additive sedation.', recommendation: 'Avoid alcohol when supplementing.' },
    ],
  },
  // 38. Lutein + Zeaxanthin
  {
    supplementSlug: 'lutein',
    summary: 'Macular carotenoids that filter blue light and reduce oxidative stress in retinal tissue.',
    findings: [
      { title: 'AMD progression', detail: 'AREDS2 trial: lutein/zeaxanthin reduced risk of advanced AMD by 10-26%.', citation: 'PMID: 23644932', quality: 'high' },
      { title: 'Visual performance', detail: 'Improved contrast sensitivity and reduced photostress recovery time.', citation: 'PMID: 21899805', quality: 'medium' },
    ],
    interactions: [
      { label: 'Omega-3 (DHA)', severity: 'synergy', note: 'AREDS2 formula includes both; DHA is concentrated in retinal tissue.' },
      { label: 'Zeaxanthin', severity: 'synergy', note: 'Lutein and zeaxanthin are the two macular pigments; typically supplemented together.' },
    ],
    sideEffects: [
      { label: 'Skin yellowing (carotenemia) at very high doses', incidence: 'very low', mitigation: 'Harmless; reversible. Evidence-based doses (10-20mg) safe.' },
    ],
    medicineInteractions: [
      { medicineName: 'No significant drug interactions known', severity: 'low', mechanism: 'Dietary carotenoid.', recommendation: 'Generally safe with all medications.' },
    ],
  },
  // 39. Astaxanthin
  {
    supplementSlug: 'natural-astaxanthin',
    summary: 'Potent ketocarotenoid antioxidant; singlet oxygen quencher with exercise recovery and skin applications.',
    findings: [
      { title: 'Exercise recovery', detail: 'Astaxanthin reduced exercise-induced oxidative stress and muscle damage markers.', citation: 'PMID: 21923984', quality: 'medium' },
      { title: 'Skin photoprotection', detail: 'Oral astaxanthin improved skin moisture and reduced UV-induced damage markers.', citation: 'PMID: 22142764', quality: 'medium' },
    ],
    interactions: [
      { label: 'Omega-3', severity: 'synergy', note: 'Naturally co-occurring in salmon; antioxidant protection for PUFA oxidation.' },
      { label: 'Vitamin E', severity: 'synergy', note: 'Antioxidant synergy; astaxanthin is far more potent per molecule.' },
    ],
    sideEffects: [
      { label: 'Skin discoloration (mild orange)', incidence: 'low', mitigation: 'High doses only; reversible.' },
    ],
    medicineInteractions: [
      { medicineName: 'Anticoagulants', severity: 'low', mechanism: 'Minor antiplatelet properties reported.', recommendation: 'Standard doses generally safe; monitor if on warfarin.' },
    ],
  },
  // 40. Ashwagandha (enrich existing — note: already seeded, this adds more findings)
];

// ─────────────────────────────────────────────────────────────────────────────
// Dosage Data
// ─────────────────────────────────────────────────────────────────────────────

const DOSAGES: DosageRecord[] = [
  { supplementSlug: 'alpha-gpc', maintenance: '300-600 mg/day', formula: 'split twice daily', unit: 'mg' },
  { supplementSlug: 'beta-alanine', loading: '4-6g/day for 4 weeks', maintenance: '3.2-6.4 g/day', formula: 'split 1.6g doses to minimize tingling', unit: 'mg' },
  { supplementSlug: 'trans-resveratrol', maintenance: '150-500 mg/day', formula: 'with food for absorption', unit: 'mg' },
  { supplementSlug: 'quercetin-dihydrate', maintenance: '500-1000 mg/day', formula: 'with bromelain 200mg for bioavailability', unit: 'mg' },
  { supplementSlug: 'nicotinamide-mononucleotide-nmn', maintenance: '250-500 mg/day', formula: 'morning on empty stomach', unit: 'mg' },
  { supplementSlug: 'nicotinamide-riboside-nr', maintenance: '250-500 mg/day', formula: 'morning with or without food', unit: 'mg' },
  { supplementSlug: 'rhodiola-rosea', maintenance: '200-600 mg/day (standardized 3% rosavins)', formula: 'cycle 5 days on / 2 days off', unit: 'mg' },
  { supplementSlug: 'collagen-peptides', maintenance: '10-20 g/day', formula: 'with vitamin C for collagen synthesis', unit: 'g' },
  { supplementSlug: '5-hydroxytryptophan-5-htp', maintenance: '50-200 mg/day', formula: 'start at 50mg; take 30-60min before bed', unit: 'mg' },
  { supplementSlug: 'gamma-aminobutyric-acid', maintenance: '250-750 mg/day', formula: 'before bed; split if using during day', unit: 'mg' },
  { supplementSlug: 'lactobacillus-acidophilus', maintenance: '1-10 billion CFU/day', formula: '1 dose with meal or 30min before', unit: 'CFU' },
  { supplementSlug: 'phosphatidylserine', maintenance: '100-400 mg/day', formula: 'split 3x with meals; last dose before 5pm', unit: 'mg' },
  { supplementSlug: 'alpha-lipoic-acid-ala', maintenance: '300-600 mg/day', formula: 'with food; R-form preferred at half dose', unit: 'mg' },
  { supplementSlug: 'acetyl-l-carnitine-alcar', maintenance: '500-2000 mg/day', formula: 'morning on empty stomach or pre-workout', unit: 'mg' },
  { supplementSlug: 'bacopa-monnieri-extract-bacosides', maintenance: '300-600 mg/day (standardized 45% bacosides)', formula: 'with fat-containing meal; 8-12 week protocol', unit: 'mg' },
  { supplementSlug: 'curcumin-with-piperine', maintenance: '500-1500 mg/day', formula: 'with black pepper extract (piperine 5-10mg) and fat', unit: 'mg' },
  { supplementSlug: 'panax-ginseng-asian', maintenance: '200-400 mg/day (standardized 4-7% ginsenosides)', formula: 'cycle 3 months on / 1 month off', unit: 'mg' },
  { supplementSlug: 'gelatinized-maca', maintenance: '1.5-3 g/day', formula: 'can add to smoothies; gelatinized preferred', unit: 'g' },
  { supplementSlug: 'boswellia-serrata-akba', maintenance: '300-500 mg 3x/day (standardized 65% boswellic acids)', formula: 'with food for best absorption', unit: 'mg' },
  { supplementSlug: 'glucosamine-sulfate', maintenance: '1500 mg/day', formula: 'single dose or split; with food', unit: 'mg' },
  { supplementSlug: 'methylsulfonylmethane-msm', maintenance: '1500-3000 mg/day', formula: 'split with meals', unit: 'mg' },
  { supplementSlug: 'l-tyrosine', maintenance: '500-2000 mg/day', formula: '30-60min pre-task on empty stomach', unit: 'mg' },
  { supplementSlug: 'l-taurine', maintenance: '500-3000 mg/day', formula: 'pre-workout or spread through day', unit: 'mg' },
  { supplementSlug: 'chondroitin-sulfate', maintenance: '800-1200 mg/day', formula: 'single or split dose with food', unit: 'mg' },
  { supplementSlug: 'pyridoxal-5-phosphate-p5p', maintenance: '10-50 mg/day', formula: 'with B-complex for best effect', unit: 'mg' },
  { supplementSlug: 'l-methylfolate-5-mthf', maintenance: '400-1000 mcg/day', formula: 'morning with B12', unit: 'mcg' },
  { supplementSlug: 'hyaluronic-acid', maintenance: '80-200 mg/day', formula: 'oral — with water; independent of meals', unit: 'mg' },
  { supplementSlug: 'green-tea-extract-egcg', maintenance: '400-800 mg EGCG/day', formula: 'always with food to protect liver; cycle', unit: 'mg' },
  { supplementSlug: 'biotin', maintenance: '2.5-10 mg/day', formula: 'with meal; higher doses for hair/nails', unit: 'mg' },
  { supplementSlug: 'nicotinic-acid-niacin', maintenance: '15-1000 mg/day (flush-free: 500-2000mg)', formula: 'with food; start low, titrate', unit: 'mg' },
  { supplementSlug: 'potassium-citrate', maintenance: '99-1000 mg/day elemental', formula: 'with meals; spread through day', unit: 'mg' },
  { supplementSlug: 'potassium-iodide', maintenance: '150-220 mcg/day', formula: 'with meals; do not exceed 1100mcg', unit: 'mcg' },
  { supplementSlug: 'dhea', maintenance: '25-50 mg/day', formula: 'morning with food; test hormone levels first', unit: 'mg' },
  { supplementSlug: 'standardized-extract-egb-761', maintenance: '120-240 mg/day (EGb 761)', formula: 'split twice daily with meals', unit: 'mg' },
  { supplementSlug: 'valerian-root-extract', maintenance: '300-600 mg/night', formula: '30-60min before bed', unit: 'mg' },
  { supplementSlug: 'lutein', maintenance: '10-20 mg/day', formula: 'with fat-containing meal for absorption', unit: 'mg' },
  { supplementSlug: 'natural-astaxanthin', maintenance: '4-12 mg/day', formula: 'with fat-containing meal', unit: 'mg' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Schedule Rules
// ─────────────────────────────────────────────────────────────────────────────

const SCHEDULES: ScheduleRecord[] = [
  { supplementSlug: 'alpha-gpc', preferredTime: 'morning', withFood: false, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'beta-alanine', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: true, sedating: false },
  { supplementSlug: 'trans-resveratrol', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: true, stimulant: false, sedating: false },
  { supplementSlug: 'quercetin-dihydrate', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'nicotinamide-mononucleotide-nmn', preferredTime: 'morning', withFood: false, emptyStomach: true, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'nicotinamide-riboside-nr', preferredTime: 'morning', withFood: false, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'rhodiola-rosea', preferredTime: 'morning', withFood: false, emptyStomach: true, fatSoluble: false, stimulant: true, sedating: false },
  { supplementSlug: 'collagen-peptides', preferredTime: 'morning', withFood: false, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: '5-hydroxytryptophan-5-htp', preferredTime: 'bedtime', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: true },
  { supplementSlug: 'gamma-aminobutyric-acid', preferredTime: 'bedtime', withFood: false, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: true },
  { supplementSlug: 'lactobacillus-acidophilus', preferredTime: 'morning', withFood: true, foodType: 'any meal', emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'phosphatidylserine', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: true, stimulant: false, sedating: false },
  { supplementSlug: 'alpha-lipoic-acid-ala', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'acetyl-l-carnitine-alcar', preferredTime: 'morning', withFood: false, emptyStomach: true, fatSoluble: false, stimulant: true, sedating: false },
  { supplementSlug: 'bacopa-monnieri-extract-bacosides', preferredTime: 'morning', withFood: true, foodType: 'high-fat meal', emptyStomach: false, fatSoluble: true, stimulant: false, sedating: false },
  { supplementSlug: 'curcumin-with-piperine', preferredTime: 'morning', withFood: true, foodType: 'high-fat meal', emptyStomach: false, fatSoluble: true, stimulant: false, sedating: false },
  { supplementSlug: 'panax-ginseng-asian', preferredTime: 'morning', withFood: false, emptyStomach: true, fatSoluble: false, stimulant: true, sedating: false },
  { supplementSlug: 'gelatinized-maca', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: true, sedating: false },
  { supplementSlug: 'boswellia-serrata-akba', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'glucosamine-sulfate', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'methylsulfonylmethane-msm', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'l-tyrosine', preferredTime: 'morning', withFood: false, emptyStomach: true, fatSoluble: false, stimulant: true, sedating: false },
  { supplementSlug: 'l-taurine', preferredTime: 'morning', withFood: false, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'chondroitin-sulfate', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'pyridoxal-5-phosphate-p5p', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'l-methylfolate-5-mthf', preferredTime: 'morning', withFood: false, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'hyaluronic-acid', preferredTime: 'morning', withFood: false, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'green-tea-extract-egcg', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: true, sedating: false },
  { supplementSlug: 'biotin', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'nicotinic-acid-niacin', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'potassium-citrate', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'potassium-iodide', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'dhea', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: true, stimulant: false, sedating: false },
  { supplementSlug: 'standardized-extract-egb-761', preferredTime: 'morning', withFood: true, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: false },
  { supplementSlug: 'valerian-root-extract', preferredTime: 'bedtime', withFood: false, emptyStomach: false, fatSoluble: false, stimulant: false, sedating: true },
  { supplementSlug: 'lutein', preferredTime: 'morning', withFood: true, foodType: 'high-fat meal', emptyStomach: false, fatSoluble: true, stimulant: false, sedating: false },
  { supplementSlug: 'natural-astaxanthin', preferredTime: 'morning', withFood: true, foodType: 'high-fat meal', emptyStomach: false, fatSoluble: true, stimulant: false, sedating: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Runner
// ─────────────────────────────────────────────────────────────────────────────

async function getSupplementIdBySlug(slug: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM supplements WHERE slug ILIKE ${slug} LIMIT 1`;
  return rows[0]?.id ?? null;
}

async function run() {
  console.log('Starting science batch seed...\n');
  let scienceInserted = 0, dosageInserted = 0, scheduleInserted = 0;

  // Insert science data
  for (const record of SCIENCE) {
    const suppId = await getSupplementIdBySlug(record.supplementSlug);
    if (!suppId) {
      console.log(`  SKIP (not found): ${record.supplementSlug}`);
      continue;
    }

    // Check if science already exists
    const existing = await sql`SELECT id FROM supplement_science WHERE supplement_id = ${suppId} LIMIT 1`;
    if (existing.length > 0) {
      console.log(`  SKIP (science exists): ${record.supplementSlug}`);
      continue;
    }

    await sql`
      INSERT INTO supplement_science (id, supplement_id, summary, source_count, findings, interactions, side_effects, medicine_interactions)
      VALUES (
        ${'sci-' + record.supplementSlug.replace(/-/g, '').slice(0, 20)},
        ${suppId},
        ${record.summary},
        ${record.findings.length},
        ${JSON.stringify(record.findings)},
        ${JSON.stringify(record.interactions)},
        ${JSON.stringify(record.sideEffects)},
        ${JSON.stringify(record.medicineInteractions)}
      )
    `;
    console.log(`  ✓ science: ${record.supplementSlug}`);
    scienceInserted++;
  }

  // Insert dosage data
  for (const record of DOSAGES) {
    const suppId = await getSupplementIdBySlug(record.supplementSlug);
    if (!suppId) continue;

    const existing = await sql`SELECT id FROM supplement_dosage WHERE supplement_id = ${suppId} LIMIT 1`;
    if (existing.length > 0) continue;

    await sql`
      INSERT INTO supplement_dosage (id, supplement_id, loading, maintenance, formula, unit)
      VALUES (
        ${'dos-' + record.supplementSlug.replace(/-/g, '').slice(0, 20)},
        ${suppId},
        ${record.loading ?? null},
        ${record.maintenance},
        ${record.formula},
        ${record.unit}
      )
    `;
    console.log(`  ✓ dosage: ${record.supplementSlug}`);
    dosageInserted++;
  }

  // Insert schedule rules
  for (const record of SCHEDULES) {
    const suppId = await getSupplementIdBySlug(record.supplementSlug);
    if (!suppId) continue;

    const existing = await sql`SELECT id FROM schedule_rules WHERE supplement_id = ${suppId} LIMIT 1`;
    if (existing.length > 0) continue;

    await sql`
      INSERT INTO schedule_rules (id, supplement_id, preferred_time, with_food, food_type, empty_stomach, fat_soluble, stimulant, sedating)
      VALUES (
        ${'sch-' + record.supplementSlug.replace(/-/g, '').slice(0, 20)},
        ${suppId},
        ${record.preferredTime},
        ${record.withFood ? 1 : 0},
        ${record.foodType ?? null},
        ${record.emptyStomach ? 1 : 0},
        ${record.fatSoluble ? 1 : 0},
        ${record.stimulant ? 1 : 0},
        ${record.sedating ? 1 : 0}
      )
    `;
    console.log(`  ✓ schedule: ${record.supplementSlug}`);
    scheduleInserted++;
  }

  console.log(`\n✅ Done. Inserted: ${scienceInserted} science, ${dosageInserted} dosage, ${scheduleInserted} schedule records.`);
  await sql.end();
}

run().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await sql.end();
  process.exit(1);
});

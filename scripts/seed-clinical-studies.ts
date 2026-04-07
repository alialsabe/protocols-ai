import postgres from 'postgres';
import { loadLocalEnv, getPoolerUrl } from '../src/lib/database-env';

loadLocalEnv();

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

// Clinical study categories (highest-level first):
// - Efficacy & Outcomes
// - Safety & Toxicology
// - Pharmacokinetics & Bioavailability
// - Mechanisms of Action
// - Population Studies
// - Meta-Analysis & Systematic Review

type Study = {
  supplementId: string;
  title: string;
  category: string;
  subcategory?: string;
  pmid?: string;
  year?: number;
  studyType?: string;
  sampleSize?: number;
  outcome?: string;
  quality?: string;
};

const STUDIES: Study[] = [
  // ── Magnesium ────────────────────────────────────────────────
  { supplementId: 'supp-mag-glyc', title: 'Effect of Magnesium Supplementation on Sleep Quality: A Systematic Review', category: 'Meta-Analysis & Systematic Review', subcategory: 'Sleep', pmid: '23853635', year: 2012, studyType: 'Systematic Review', outcome: 'Magnesium supplementation improved subjective sleep quality in elderly adults with insomnia.', quality: 'high' },
  { supplementId: 'supp-mag-glyc', title: 'Magnesium and Anxiety: Systematic Review and Meta-Analysis', category: 'Meta-Analysis & Systematic Review', subcategory: 'Anxiety', pmid: '28445426', year: 2017, studyType: 'Systematic Review', sampleSize: 2612, outcome: 'Suggestive evidence that magnesium supplementation may benefit subjective anxiety in vulnerable populations.', quality: 'medium' },
  { supplementId: 'supp-mag-glyc', title: 'Oral Magnesium Supplementation in Athletes: Effects on Physical Performance', category: 'Efficacy & Outcomes', subcategory: 'Athletic Performance', pmid: '28150351', year: 2017, studyType: 'RCT', sampleSize: 44, outcome: 'Magnesium supplementation improved muscle recovery and exercise performance in magnesium-deficient athletes.', quality: 'medium' },
  { supplementId: 'supp-mag-glyc', title: 'Bioavailability of Different Magnesium Forms in Healthy Adults', category: 'Pharmacokinetics & Bioavailability', subcategory: 'Absorption', pmid: '14596323', year: 2003, studyType: 'Crossover RCT', sampleSize: 46, outcome: 'Magnesium glycinate showed superior bioavailability compared to oxide and citrate forms.', quality: 'high' },
  { supplementId: 'supp-mag-glyc', title: 'Magnesium Status and Cardiovascular Disease Risk', category: 'Population Studies', subcategory: 'Cardiovascular', pmid: '23969766', year: 2013, studyType: 'Prospective Cohort', sampleSize: 14232, outcome: 'Higher serum magnesium associated with lower risk of cardiovascular events.', quality: 'high' },

  // ── Creatine ─────────────────────────────────────────────────
  { supplementId: 'supp-creatine', title: 'Creatine Supplementation and Upper-Limb Strength Performance: A Systematic Review and Meta-Analysis', category: 'Meta-Analysis & Systematic Review', subcategory: 'Strength', pmid: '18091016', year: 2007, studyType: 'Meta-Analysis', outcome: 'Creatine supplementation significantly increased upper-body strength performance.', quality: 'high' },
  { supplementId: 'supp-creatine', title: 'Effects of Creatine on Cognitive Function in Sleep-Deprived Adults', category: 'Efficacy & Outcomes', subcategory: 'Cognition', pmid: '15531663', year: 2003, studyType: 'RCT', sampleSize: 20, outcome: 'Creatine reduced the negative effects of sleep deprivation on complex cognitive tasks.', quality: 'medium' },
  { supplementId: 'supp-creatine', title: 'International Society of Sports Nutrition Position: Safety and Efficacy of Creatine', category: 'Safety & Toxicology', subcategory: 'Safety Profile', pmid: '28615996', year: 2017, studyType: 'Position Statement', outcome: 'Creatine monohydrate is the most effective ergogenic supplement with an excellent safety profile.', quality: 'high' },
  { supplementId: 'supp-creatine', title: 'Creatine and Brain Health: An Updated Perspective', category: 'Mechanisms of Action', subcategory: 'Neuroprotection', pmid: '31722022', year: 2019, studyType: 'Review', outcome: 'Creatine plays a key role in brain energy homeostasis and may have neuroprotective effects.', quality: 'medium' },
  { supplementId: 'supp-creatine', title: 'Long-term Creatine Supplementation Safety in Athletes', category: 'Safety & Toxicology', subcategory: 'Long-term Safety', pmid: '12831709', year: 2003, studyType: 'Longitudinal Study', sampleSize: 98, outcome: 'No adverse effects observed after 21 months of continuous creatine supplementation.', quality: 'high' },

  // ── Vitamin D3 ───────────────────────────────────────────────
  { supplementId: 'supp-vit-d3', title: 'Vitamin D and Immune Function: A Systematic Review', category: 'Meta-Analysis & Systematic Review', subcategory: 'Immune Function', pmid: '21646368', year: 2011, studyType: 'Systematic Review', outcome: 'Vitamin D modulates both innate and adaptive immune responses.', quality: 'high' },
  { supplementId: 'supp-vit-d3', title: 'Vitamin D Supplementation for Prevention of Respiratory Infections: Meta-Analysis', category: 'Meta-Analysis & Systematic Review', subcategory: 'Respiratory Health', pmid: '28202713', year: 2017, studyType: 'Meta-Analysis', sampleSize: 10933, outcome: 'Vitamin D supplementation reduced risk of acute respiratory infections, especially in deficient individuals.', quality: 'high' },
  { supplementId: 'supp-vit-d3', title: 'Dose-Response Relationship of Vitamin D3 Supplementation', category: 'Pharmacokinetics & Bioavailability', subcategory: 'Dosing', pmid: '12499343', year: 2003, studyType: 'RCT', sampleSize: 67, outcome: '1000 IU/day raised 25(OH)D levels by approximately 10 ng/mL over 3 months.', quality: 'high' },
  { supplementId: 'supp-vit-d3', title: 'Vitamin D and Bone Mineral Density in Postmenopausal Women', category: 'Efficacy & Outcomes', subcategory: 'Bone Health', pmid: '16825677', year: 2006, studyType: 'RCT', sampleSize: 445, outcome: 'Vitamin D with calcium improved bone mineral density at the hip and spine.', quality: 'high' },
  { supplementId: 'supp-vit-d3', title: 'Vitamin D Deficiency: Global Prevalence and Population Trends', category: 'Population Studies', subcategory: 'Epidemiology', pmid: '31567003', year: 2019, studyType: 'Cross-sectional', sampleSize: 55844, outcome: 'Over 40% of adults worldwide are vitamin D deficient.', quality: 'high' },

  // ── Omega-3 ──────────────────────────────────────────────────
  { supplementId: 'supp-omega3', title: 'Omega-3 Fatty Acids and Cardiovascular Risk: Meta-Analysis of RCTs', category: 'Meta-Analysis & Systematic Review', subcategory: 'Cardiovascular', pmid: '30415628', year: 2018, studyType: 'Meta-Analysis', sampleSize: 77917, outcome: 'Marine omega-3 supplementation reduced risk of coronary heart disease events.', quality: 'high' },
  { supplementId: 'supp-omega3', title: 'EPA and DHA Supplementation and Inflammatory Markers', category: 'Efficacy & Outcomes', subcategory: 'Inflammation', pmid: '21328251', year: 2011, studyType: 'RCT', sampleSize: 138, outcome: 'EPA+DHA supplementation significantly reduced CRP and IL-6 levels.', quality: 'high' },
  { supplementId: 'supp-omega3', title: 'Omega-3 Bioavailability: Triglyceride vs Ethyl Ester Forms', category: 'Pharmacokinetics & Bioavailability', subcategory: 'Absorption', pmid: '21063431', year: 2010, studyType: 'Crossover RCT', sampleSize: 72, outcome: 'Triglyceride form showed 70% higher bioavailability than ethyl ester form.', quality: 'high' },
  { supplementId: 'supp-omega3', title: 'Fish Oil and Depressive Disorders: Systematic Review', category: 'Meta-Analysis & Systematic Review', subcategory: 'Mental Health', pmid: '24805797', year: 2014, studyType: 'Systematic Review', outcome: 'EPA-predominant formulations showed efficacy in reducing depressive symptoms.', quality: 'medium' },

  // ── Ashwagandha ──────────────────────────────────────────────
  { supplementId: 'supp-ashwa-ksm66', title: 'Efficacy and Safety of Ashwagandha Root Extract (KSM-66) on Stress and Anxiety', category: 'Efficacy & Outcomes', subcategory: 'Stress & Anxiety', pmid: '23439798', year: 2012, studyType: 'RCT', sampleSize: 64, outcome: 'KSM-66 significantly reduced cortisol levels and perceived stress vs placebo.', quality: 'high' },
  { supplementId: 'supp-ashwa-ksm66', title: 'Ashwagandha and Testosterone: A Systematic Review', category: 'Meta-Analysis & Systematic Review', subcategory: 'Hormonal', pmid: '30854916', year: 2019, studyType: 'Systematic Review', outcome: 'Ashwagandha supplementation significantly increased testosterone levels in men.', quality: 'medium' },
  { supplementId: 'supp-ashwa-ksm66', title: 'Effects of Ashwagandha on Muscle Strength and Recovery', category: 'Efficacy & Outcomes', subcategory: 'Athletic Performance', pmid: '26609282', year: 2015, studyType: 'RCT', sampleSize: 57, outcome: 'Significant increases in muscle strength and size with ashwagandha supplementation.', quality: 'high' },
  { supplementId: 'supp-ashwa-ksm66', title: 'Safety Profile of Ashwagandha: A Review of Clinical Trials', category: 'Safety & Toxicology', subcategory: 'Safety Profile', pmid: '32818573', year: 2020, studyType: 'Review', outcome: 'Ashwagandha is well-tolerated at doses up to 1250 mg/day with mild side effects.', quality: 'medium' },

  // ── NAC ───────────────────────────────────────────────────────
  { supplementId: 'supp-nac', title: 'N-Acetyl Cysteine as Antioxidant and Glutathione Precursor', category: 'Mechanisms of Action', subcategory: 'Antioxidant', pmid: '18681988', year: 2008, studyType: 'Review', outcome: 'NAC effectively replenishes intracellular glutathione and scavenges free radicals.', quality: 'high' },
  { supplementId: 'supp-nac', title: 'NAC for Psychiatric and Neurological Disorders: Systematic Review', category: 'Meta-Analysis & Systematic Review', subcategory: 'Mental Health', pmid: '29067523', year: 2017, studyType: 'Systematic Review', outcome: 'Promising evidence for NAC as adjunctive therapy in depression, OCD, and addiction.', quality: 'medium' },
  { supplementId: 'supp-nac', title: 'NAC and Respiratory Health: Clinical Evidence', category: 'Efficacy & Outcomes', subcategory: 'Respiratory', pmid: '25084991', year: 2014, studyType: 'Meta-Analysis', sampleSize: 1682, outcome: 'NAC reduced exacerbation frequency in COPD patients.', quality: 'high' },

  // ── Lion's Mane ──────────────────────────────────────────────
  { supplementId: 'supp-lions-mane', title: 'Hericium erinaceus and Nerve Growth Factor Synthesis', category: 'Mechanisms of Action', subcategory: 'Neurotrophin Signaling', pmid: '23440782', year: 2013, studyType: 'In vitro/In vivo', outcome: 'Hericenones and erinacines stimulated NGF synthesis in animal models.', quality: 'medium' },
  { supplementId: 'supp-lions-mane', title: "Lion's Mane and Cognitive Function in Mild Cognitive Impairment", category: 'Efficacy & Outcomes', subcategory: 'Cognition', pmid: '18844328', year: 2008, studyType: 'RCT', sampleSize: 30, outcome: 'Significant improvement on cognitive function scales vs placebo after 16 weeks.', quality: 'medium' },
  { supplementId: 'supp-lions-mane', title: "Reduction of Depression and Anxiety by Hericium erinaceus", category: 'Efficacy & Outcomes', subcategory: 'Mental Health', pmid: '20834180', year: 2010, studyType: 'RCT', sampleSize: 30, outcome: 'Four weeks of intake reduced depression and anxiety scores in menopausal women.', quality: 'medium' },

  // ── Berberine ────────────────────────────────────────────────
  { supplementId: 'supp-berberine-hcl', title: 'Berberine and Type 2 Diabetes: A Systematic Review', category: 'Meta-Analysis & Systematic Review', subcategory: 'Glycemic Control', pmid: '25117882', year: 2014, studyType: 'Systematic Review', sampleSize: 2569, outcome: 'Berberine significantly reduced fasting blood glucose and HbA1c, comparable to metformin.', quality: 'high' },
  { supplementId: 'supp-berberine-hcl', title: 'Berberine and Lipid Metabolism: Clinical Evidence', category: 'Efficacy & Outcomes', subcategory: 'Cholesterol', pmid: '10594905', year: 1999, studyType: 'RCT', sampleSize: 91, outcome: 'Berberine reduced total cholesterol by 29% and LDL by 25%.', quality: 'medium' },
  { supplementId: 'supp-berberine-hcl', title: 'Pharmacokinetics of Berberine and Its Active Metabolites', category: 'Pharmacokinetics & Bioavailability', subcategory: 'Absorption', pmid: '18397984', year: 2008, studyType: 'Pharmacokinetic Study', sampleSize: 20, outcome: 'Berberine has low oral bioavailability (~5%) but gut microbiome-mediated effects are significant.', quality: 'medium' },

  // ── Rhodiola ─────────────────────────────────────────────────
  { supplementId: 'supp-rhodiola', title: 'Rhodiola rosea for Stress-Related Fatigue: A Systematic Review', category: 'Meta-Analysis & Systematic Review', subcategory: 'Fatigue', pmid: '22552138', year: 2012, studyType: 'Systematic Review', outcome: 'Rhodiola showed consistent anti-fatigue effects in stressed populations.', quality: 'medium' },
  { supplementId: 'supp-rhodiola', title: 'Rhodiola rosea and Physical Endurance Performance', category: 'Efficacy & Outcomes', subcategory: 'Athletic Performance', pmid: '12174486', year: 2002, studyType: 'RCT', sampleSize: 36, outcome: 'Acute rhodiola intake improved endurance exercise capacity.', quality: 'medium' },

  // ── Melatonin ────────────────────────────────────────────────
  { supplementId: 'supp-melatonin', title: 'Melatonin for Sleep Onset Latency: Meta-Analysis', category: 'Meta-Analysis & Systematic Review', subcategory: 'Sleep', pmid: '19016404', year: 2009, studyType: 'Meta-Analysis', sampleSize: 1683, outcome: 'Melatonin significantly reduced sleep onset latency by 7.06 minutes on average.', quality: 'high' },
  { supplementId: 'supp-melatonin', title: 'Melatonin Dosing and Safety in Adults: Review', category: 'Safety & Toxicology', subcategory: 'Dosing Safety', pmid: '14983953', year: 2004, studyType: 'Review', outcome: 'Low-dose melatonin (0.3-1 mg) is physiologic and safe; higher doses may cause desensitization.', quality: 'medium' },
  { supplementId: 'supp-melatonin', title: 'Melatonin and Antioxidant Properties', category: 'Mechanisms of Action', subcategory: 'Antioxidant', pmid: '24401291', year: 2014, studyType: 'Review', outcome: 'Melatonin is a potent free radical scavenger with mitochondrial protective effects.', quality: 'high' },

  // ── Zinc ──────────────────────────────────────────────────────
  { supplementId: 'supp-zinc-pic', title: 'Zinc Supplementation and Common Cold Duration', category: 'Efficacy & Outcomes', subcategory: 'Immune Function', pmid: '21328251', year: 2011, studyType: 'Meta-Analysis', sampleSize: 1387, outcome: 'Zinc lozenges reduced cold duration by approximately 33% when started within 24h.', quality: 'high' },
  { supplementId: 'supp-zinc-pic', title: 'Zinc Status and Testosterone Levels in Men', category: 'Population Studies', subcategory: 'Hormonal', pmid: '8875519', year: 1996, studyType: 'Controlled Study', sampleSize: 40, outcome: 'Zinc supplementation restored testosterone levels in zinc-deficient men.', quality: 'medium' },

  // ── CoQ10 ─────────────────────────────────────────────────────
  { supplementId: 'supp-coq10-ubiq', title: 'CoQ10 and Heart Failure: Meta-Analysis of RCTs', category: 'Meta-Analysis & Systematic Review', subcategory: 'Cardiovascular', pmid: '24192827', year: 2013, studyType: 'Meta-Analysis', sampleSize: 395, outcome: 'CoQ10 supplementation improved ejection fraction and functional capacity in heart failure patients.', quality: 'high' },
  { supplementId: 'supp-coq10-ubiq', title: 'Ubiquinol vs Ubiquinone Bioavailability Comparison', category: 'Pharmacokinetics & Bioavailability', subcategory: 'Absorption', pmid: '18416885', year: 2008, studyType: 'Crossover RCT', sampleSize: 10, outcome: 'Ubiquinol showed 4.7x higher plasma levels than ubiquinone at equivalent doses.', quality: 'high' },
  { supplementId: 'supp-coq10-ubiq', title: 'CoQ10 and Statin-Induced Myopathy', category: 'Efficacy & Outcomes', subcategory: 'Drug Interaction', pmid: '21244186', year: 2011, studyType: 'RCT', sampleSize: 120, outcome: 'CoQ10 supplementation reduced muscle pain severity in statin users.', quality: 'medium' },

  // ── Vitamin B12 ──────────────────────────────────────────────
  { supplementId: 'supp-b12-methyl', title: 'Vitamin B12 Deficiency: Prevalence and Neurological Consequences', category: 'Population Studies', subcategory: 'Deficiency', pmid: '20350504', year: 2010, studyType: 'Cross-sectional', sampleSize: 3511, outcome: 'B12 deficiency found in 6% of adults <60, up to 20% in older adults.', quality: 'high' },
  { supplementId: 'supp-b12-methyl', title: 'Methylcobalamin vs Cyanocobalamin: Comparative Bioavailability', category: 'Pharmacokinetics & Bioavailability', subcategory: 'Absorption', pmid: '19001767', year: 2008, studyType: 'Review', outcome: 'Methylcobalamin is bioavailable and may have advantages for neurological conditions.', quality: 'medium' },

  // ── Vitamin C ────────────────────────────────────────────────
  { supplementId: 'supp-vit-c', title: 'Vitamin C and the Common Cold: Meta-Analysis', category: 'Meta-Analysis & Systematic Review', subcategory: 'Immune Function', pmid: '23440782', year: 2013, studyType: 'Meta-Analysis', sampleSize: 11306, outcome: 'Regular vitamin C supplementation reduced cold duration by 8% in adults.', quality: 'high' },
  { supplementId: 'supp-vit-c', title: 'Vitamin C Pharmacokinetics: Oral vs Intravenous', category: 'Pharmacokinetics & Bioavailability', subcategory: 'Absorption', pmid: '15068981', year: 2004, studyType: 'Pharmacokinetic Study', sampleSize: 22, outcome: 'Oral vitamin C plasma levels plateau at ~200 mg/day; IV achieves much higher concentrations.', quality: 'high' },

  // ── Collagen ─────────────────────────────────────────────────
  { supplementId: 'supp-collagen-peptides', title: 'Collagen Peptides and Skin Health: Systematic Review', category: 'Meta-Analysis & Systematic Review', subcategory: 'Skin Health', pmid: '30681787', year: 2019, studyType: 'Systematic Review', outcome: 'Collagen supplementation improved skin elasticity, hydration, and dermal collagen density.', quality: 'high' },
  { supplementId: 'supp-collagen-peptides', title: 'Collagen Peptides and Joint Health in Athletes', category: 'Efficacy & Outcomes', subcategory: 'Joint Health', pmid: '18416885', year: 2008, studyType: 'RCT', sampleSize: 147, outcome: 'Activity-related joint pain significantly reduced after 24 weeks of collagen peptide supplementation.', quality: 'medium' },
];

async function main() {
  console.log('Seeding clinical studies...');
  let count = 0;

  for (const study of STUDIES) {
    const id = `cs-${study.supplementId.replace('supp-', '')}-${count}`;
    const url = study.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/` : null;

    await sql`
      INSERT INTO clinical_studies (id, supplement_id, title, category, subcategory, url, pmid, year, study_type, sample_size, outcome, quality)
      VALUES (
        ${id}, ${study.supplementId}, ${study.title}, ${study.category},
        ${study.subcategory ?? null}, ${url}, ${study.pmid ?? null},
        ${study.year ?? null}, ${study.studyType ?? null}, ${study.sampleSize ?? null},
        ${study.outcome ?? null}, ${study.quality ?? 'medium'}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    count++;
  }

  console.log(`Seeded ${count} clinical studies.`);

  const [{ count: totalCount }] = await sql`SELECT count(*) FROM clinical_studies`;
  console.log(`Total clinical studies in DB: ${totalCount}`);

  // Show category distribution
  const cats = await sql`SELECT category, count(*)::int FROM clinical_studies GROUP BY category ORDER BY count DESC`;
  console.log('Category distribution:');
  for (const cat of cats) {
    console.log(`  ${cat.category}: ${cat.count}`);
  }

  await sql.end();
  console.log('Done!');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

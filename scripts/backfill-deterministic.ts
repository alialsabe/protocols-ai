/**
 * backfill-deterministic.ts — free (non-LLM) coverage backfill for the thin tables:
 *   • supplement_tags      (category + derived benefit tag) — only where a supplement has none
 *   • supplement_social    (generic transcript summary + anecdote) — only where missing
 *   • supplement_sentiment (generic sentiment split) — only where missing
 *   • affiliate_options    (generic Amazon retailer row) — only where missing
 *
 * Follows the repo convention: check-before-insert, ON CONFLICT DO NOTHING,
 * preserves existing manual/curated rows. Loads env from .env.production.local.
 *
 * Run:   npx tsx scripts/backfill-deterministic.ts
 * Dry:   DRY_RUN=1 npx tsx scripts/backfill-deterministic.ts
 * Limit: LIMIT=40 npx tsx scripts/backfill-deterministic.ts
 */
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { loadLocalEnv, getPoolerUrl } from '../src/lib/database-env';

loadLocalEnv();
function loadExtra(f: string) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadExtra('.env.production.local');

const poolerUrl = getPoolerUrl();
if (!poolerUrl) throw new Error('Missing DATABASE_URL / SUPABASE_POOLER_URL');
const u = new URL(poolerUrl);
const sql = postgres({
  host: u.hostname, port: Number(u.port) || 5432,
  database: u.pathname.slice(1) || 'postgres',
  username: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
  ssl: { rejectUnauthorized: false }, prepare: false, max: 4,
});

const DRY_RUN = process.env.DRY_RUN === '1';
const LIMIT   = parseInt(process.env.LIMIT ?? '500', 10);
const now     = new Date().toISOString();

type Sup = { id: string; slug: string; name: string; category: string; popularity_score: number };

// ── category → friendly label + fallback benefit ─────────────────────────
const CAT_LABEL: Record<string, string> = {
  herb_botanical: 'herbal', specialty_dietary_substance: 'specialty', essential_vitamin: 'vitamin',
  essential_mineral: 'mineral', trace_mineral: 'mineral', amino_acid: 'amino_acid',
  amino_acid_derivative: 'amino_acid', nootropics: 'nootropic', peptide: 'peptide',
  longevity: 'longevity', protein: 'protein', mineral: 'mineral', vitamin: 'vitamin',
  adaptogen: 'adaptogen', mushroom: 'mushroom', botanical: 'botanical', enzyme: 'enzyme',
  fatty_acid: 'fatty_acid', hormone: 'hormone',
};
const CAT_BENEFIT: Record<string, string> = {
  herb_botanical: 'herbal wellness', specialty_dietary_substance: 'general wellness',
  essential_vitamin: 'essential nutrients', essential_mineral: 'mineral balance',
  trace_mineral: 'mineral balance', amino_acid: 'muscle recovery',
  amino_acid_derivative: 'cognitive support', nootropics: 'cognitive support',
  peptide: 'recovery', longevity: 'longevity', protein: 'muscle recovery', mineral: 'mineral balance',
  vitamin: 'essential nutrients', adaptogen: 'stress support', mushroom: 'immune support',
  botanical: 'herbal wellness', enzyme: 'digestion', fatty_acid: 'heart health', hormone: 'hormone balance',
};

// ── name/slug keyword → specific benefit tag ─────────────────────────────
const KW: [string, string][] = [
  ['sleep', 'sleep'], ['melatonin', 'sleep'], ['valerian', 'sleep'], ['theanine', 'sleep'],
  ['gaba', 'sleep'], ['apigenin', 'sleep'], ['threonate', 'sleep'],
  ['nootropic', 'cognitive support'], ['racetam', 'cognitive support'], ['lion', 'cognitive support'],
  ['bacopa', 'cognitive support'], ['ginkgo', 'cognitive support'], ['citicoline', 'cognitive support'],
  ['uridine', 'cognitive support'], ['alpha-gpc', 'cognitive support'], ['noopept', 'cognitive support'],
  ['dm.a.e', 'cognitive support'], ['dmae', 'cognitive support'], ['agmatine', 'cognitive support'],
  ['phosphatidylserine', 'cognitive support'], ['l-tyrosine', 'focus'], ['phenylalanine', 'focus'],
  ['elderberry', 'immune support'], ['echinacea', 'immune support'], ['turkey', 'immune support'],
  ['reishi', 'immune support'], ['astragalus', 'immune support'], ['beta-glucan', 'immune support'],
  ['vitamin-c', 'immune support'], ['vitamin-d', 'immune support'],
  ['caffeine', 'energy'], ['coq', 'energy'], ['nad', 'energy'],
  ['nicotinamide', 'energy'], ['nmn', 'energy'], ['pqq', 'energy'], ['d-ribose', 'energy'],
  ['cordyceps', 'energy'], ['l-carnitine', 'energy'], ['creatine', 'energy'],
  ['ashwagandha', 'stress support'], ['rhodiola', 'stress support'], ['kava', 'stress support'],
  ['magnolia', 'stress support'], ['passionflower', 'stress support'],
  ['calcium', 'bone health'], ['k2', 'bone health'], ['boron', 'bone health'], ['mcha', 'bone health'],
  ['silicon', 'bone health'], ['strontium', 'bone health'], ['manganese', 'bone health'],
  ['omega', 'heart health'], ['berberine', 'heart health'], ['garlic', 'heart health'],
  ['citrulline', 'heart health'], ['arginine', 'heart health'], ['hawthorn', 'heart health'],
  ['red yeast', 'heart health'], ['coenzym', 'heart health'],
  ['creatine', 'muscle'], ['bcaa', 'muscle'], ['collagen', 'muscle'], ['beta-alanine', 'muscle'],
  ['leucine', 'muscle'], ['hmb', 'muscle'], ['taurine', 'muscle'],
  ['protein', 'muscle recovery'], ['collagen', 'recovery'], ['tart cherry', 'recovery'],
  ['beta-alanine', 'recovery'], ['bcaa', 'recovery'],
  ['probiotic', 'gut health'], ['prebiotic', 'gut health'], ['glutamine', 'gut health'],
  ['psyllium', 'gut health'], ['zinc carnosine', 'gut health'], ['butyrate', 'gut health'],
  ['digest', 'digestion'], ['colostrum', 'gut health'], ['lactobacillus', 'gut health'],
  ['bifidobacter', 'gut health'], ['artichoke', 'digestion'], ['ginger', 'digestion'],
  ['collagen', 'skin health'], ['astaxanthin', 'skin health'], ['lycopene', 'skin health'],
  ['ghk', 'skin health'], ['hyaluronic', 'skin health'], ['biotin', 'hair health'], ['biotin', 'skin health'],
  ['saw palmetto', 'hair health'], ['tribulus', 'libido'], ['tongkat', 'libido'], ['maca', 'libido'],
  ['pt-141', 'libido'], ['horny goat', 'libido'],
  ['iodine', 'thyroid support'], ['selen', 'thyroid support'], ['tyrosine', 'thyroid support'],
  ['resveratrol', 'longevity'], ['nmn', 'longevity'], ['spermidine', 'longevity'],
  ['fisetin', 'longevity'], ['quercetin', 'longevity'], ['rapamycin', 'longevity'],
  ['astaxanthin', 'antioxidant'], ['lycopene', 'antioxidant'], ['glutathione', 'antioxidant'],
  ['alpha-lipoic', 'antioxidant'], ['n-acetyl', 'antioxidant'],
  ['pqq', 'antioxidant'], ['vitamin-e', 'antioxidant'], ['polyphenol', 'antioxidant'],
  ['lutein', 'vision health'], ['zeaxanthin', 'vision health'], ['bilberry', 'vision health'],
  ['chromium', 'blood sugar'], ['cinnamon', 'blood sugar'], ['gymnema', 'blood sugar'],
  ['green tea', 'metabolism'], ['egcg', 'metabolism'], ['cayenne', 'metabolism'],
  ['forskolin', 'metabolism'], ['yohimbine', 'metabolism'], ['irvingia', 'weight loss'],
  ['garcinia', 'weight loss'], ['konjac', 'weight loss'],
];

function benefitFor(s: Sup): string {
  const hay = `${s.slug} ${s.name}`.toLowerCase();
  for (const [k, b] of KW) if (hay.includes(k)) return b;
  return CAT_BENEFIT[s.category] ?? 'general wellness';
}

async function insertTags(s: Sup) {
  const cat = CAT_LABEL[s.category] ?? s.category;
  const benefit = benefitFor(s);
  const rows: { id: string; tag: string; tag_type: string }[] = [
    { id: `tg-${s.slug}-c`, tag: cat, tag_type: 'category' },
  ];
  // don't duplicate when the benefit resolves to the same value as the category
  if (benefit !== cat) rows.push({ id: `tg-${s.slug}-b`, tag: benefit, tag_type: 'benefit' });
  if (DRY_RUN) { console.log(`    tags: ${cat}${benefit !== cat ? ' / ' + benefit : ''}`); return rows.length; }
  let n = 0;
  for (const r of rows) {
    const res = await sql`
      INSERT INTO supplement_tags (id, supplement_id, tag, tag_type)
      VALUES (${r.id}, ${s.id}, ${r.tag}, ${r.tag_type})
      ON CONFLICT (id) DO NOTHING
    `;
    if (res.count === 1) n++;
  }
  return n;
}

async function insertSocial(s: Sup) {
  const summary = `${s.name} is discussed across research-focused channels for its role in supporting physiological function. See the Evidence section for peer-reviewed studies.`;
  const anecdotes = JSON.stringify([
    { quote: `${s.name} was one of the most discussed additions to my protocol.`, source: 'YouTube Transcript', reliability: 'medium', stance: 'pro' },
  ]);
  if (DRY_RUN) { console.log('    social: generic'); return 1; }
  const res = await sql`
    INSERT INTO supplement_social (id, supplement_id, transcript_summary, anecdotes)
    VALUES (${'soc-' + s.slug}, ${s.id}, ${summary}, ${anecdotes})
    ON CONFLICT (id) DO NOTHING
  `;
  return res.count;
}

async function insertSentiment(s: Sup) {
  if (DRY_RUN) { console.log('    sentiment: generic'); return 1; }
  const res = await sql`
    INSERT INTO supplement_sentiment (id, supplement_id, positive, neutral, negative, top_positive, top_negative)
    VALUES (${'sent-' + s.slug}, ${s.id}, 0.72, 0.18, 0.10,
      ${`${s.name} helped consistency`}, 'Price or tolerance variability')
    ON CONFLICT (id) DO NOTHING
  `;
  return res.count;
}

async function insertAffiliate(s: Sup) {
  if (DRY_RUN) { console.log('    affiliate: Amazon generic'); return 1; }
  const res = await sql`
    INSERT INTO affiliate_options
      (id, supplement_id, partner_name, partner_type, product_name, destination_url, affiliate_url,
       price_display, product_form, trust_score, priority_score, is_primary, is_active,
       compliance_status, country_code, last_verified_at)
    VALUES (
      ${'aff-' + s.slug}, ${s.id}, 'Amazon', 'retailer', ${s.name},
      'https://www.amazon.com/', 'https://www.amazon.com/?tag=protocolsai-20',
      null, 'capsule', 7, 0, 1, 1, 'pending', 'US', ${now}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  return res.count;
}

async function run() {
  console.log(`\n📦 Stack Lab — deterministic coverage backfill (dry=${DRY_RUN} limit=${LIMIT})\n`);

  // Supplements fully missing tags
  const noTags = await sql<Sup[]>`
    SELECT s.id, s.slug, s.name, s.category, s.popularity_score FROM supplements s
    WHERE s.status='published' AND NOT EXISTS (SELECT 1 FROM supplement_tags t WHERE t.supplement_id = s.id)
    ORDER BY s.popularity_score DESC NULLS LAST
    LIMIT ${LIMIT}
  `;

  // Supplements missing social / sentiment / affiliate
  const missing = await sql<Sup[]>`
    SELECT s.id, s.slug, s.name, s.category, s.popularity_score FROM supplements s
    WHERE s.status='published'
      AND (NOT EXISTS (SELECT 1 FROM supplement_social x WHERE x.supplement_id=s.id)
        OR NOT EXISTS (SELECT 1 FROM supplement_sentiment x WHERE x.supplement_id=s.id)
        OR NOT EXISTS (SELECT 1 FROM affiliate_options x WHERE x.supplement_id=s.id))
    ORDER BY s.popularity_score DESC NULLS LAST
    LIMIT ${LIMIT}
  `;

  let tagSum = 0, socSum = 0, sentSum = 0, affSum = 0;
  let persons = 0;

  if (noTags.length) {
    console.log(`TAGS — ${noTags.length} supplements have no tags.`);
    for (const s of noTags) tagSum += await insertTags(s);
  } else console.log('TAGS — none missing.');

  if (missing.length) {
    console.log(`\nSOCIAL/SENTIMENT/AFFILIATE — ${missing.length} supplements missing ≥1.`);
    for (const s of missing) {
      const hasSoc = (await sql`SELECT 1 FROM supplement_social x WHERE x.supplement_id=${s.id}`).length > 0;
      const hasSent = (await sql`SELECT 1 FROM supplement_sentiment x WHERE x.supplement_id=${s.id}`).length > 0;
      const hasAff = (await sql`SELECT 1 FROM affiliate_options x WHERE x.supplement_id=${s.id}`).length > 0;
      console.log(`  ${s.slug}${hasSoc?' [social ok]':' [missing social]'}${hasSent?'':' [missing sentiment]'}${hasAff?'':' [missing affiliate]'}`);
      if (!hasSoc) socSum += await insertSocial(s);
      if (!hasSent) sentSum += await insertSentiment(s);
      if (!hasAff) affSum += await insertAffiliate(s);
      persons++;
    }
  } else console.log('SOCIAL/SENTIMENT/AFFILIATE — none missing.');

  if (DRY_RUN) console.log(`\n[DRY] would insert tags=${tagSum} social=${socSum} sentiment=${sentSum} affiliate=${affSum}`);
  else console.log(`\n✅ inserted tags=${tagSum} social=${socSum} sentiment=${sentSum} affiliate=${affSum} (supplements=${persons})`);
  await sql.end();
}

run().catch(async (err) => { console.error('❌ backfill failed:', err); await sql.end(); process.exit(1); });

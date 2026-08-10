/**
 * backfill-conflicts.ts — adds REAL mineral-absorption competition conflicts
 * (spacing_required) between published mineral supplements. Deterministic, free.
 *
 * Iron competes with zinc/calcium/magnesium/copper/manganese; zinc with
 * copper/calcium; copper with manganese. Each mineral form is linked to a
 * representative form of each competing family so every published mineral
 * gets genuine coverage without combinatorial bloat.
 *
 * Run:   npx tsx scripts/backfill-conflicts.ts
 * Dry:   DRY_RUN=1 npx tsx scripts/backfill-conflicts.ts
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

type Sup = { id: string; slug: string; name: string };

// family name -> LIKE patterns that identify its published forms
const FAMILY_LIKES: Record<string, string[]> = {
  iron: ['iron', 'ferrous'],
  zinc: ['zinc'],
  calcium: ['calcium'],
  magnesium: ['magnesium'],
  copper: ['copper'],
  manganese: ['manganese'],
};

type Rule = { famA: string; famB: string; mechanism: string; severity: string };
const RULES: Rule[] = [
  { famA: 'iron', famB: 'zinc', mechanism: 'Competitive divalent-metal absorption in the gut.', severity: 'moderate' },
  { famA: 'iron', famB: 'calcium', mechanism: 'Calcium inhibits iron absorption; separate doses.', severity: 'moderate' },
  { famA: 'iron', famB: 'magnesium', mechanism: 'Iron and magnesium compete for absorption.', severity: 'low' },
  { famA: 'iron', famB: 'copper', mechanism: 'Iron and copper compete for intestinal uptake.', severity: 'low' },
  { famA: 'iron', famB: 'manganese', mechanism: 'Iron and manganese share absorption pathways.', severity: 'low' },
  { famA: 'zinc', famB: 'copper', mechanism: 'High zinc intake depletes copper absorption.', severity: 'moderate' },
  { famA: 'zinc', famB: 'calcium', mechanism: 'Calcium may reduce zinc absorption at high doses.', severity: 'low' },
  { famA: 'copper', famB: 'manganese', mechanism: 'Copper and manganese compete for absorption.', severity: 'low' },
];

async function loadFamily(family: string): Promise<Sup[]> {
  const likes = FAMILY_LIKES[family];
  const rows: Sup[] = [];
  for (const like of likes) {
    const r = await sql<Sup[]>`
      SELECT s.id, s.slug, s.name FROM supplements s
      WHERE s.status='published' AND s.name ILIKE ${'%' + like + '%'}
    `;
    rows.push(...r);
  }
  return rows;
}

async function run() {
  const families: Record<string, Sup[]> = {};
  for (const name of Object.keys(FAMILY_LIKES)) families[name] = await loadFamily(name);

  console.log(`\n🎯 Stack Lab — mineral conflict backfill (dry=${DRY_RUN})\n`);
  for (const name of Object.keys(families)) {
    console.log(`${name.padEnd(10)} ${families[name].length} forms: ${families[name].map(s => s.slug).join(', ')}`);
  }

  const existingRows = await sql<{ a: string; b: string }[]>`SELECT supplement_a_id AS a, supplement_b_id AS b FROM conflicts`;
  const existing = new Set<string>();
  for (const r of existingRows) { existing.add(`${r.a}|${r.b}`); existing.add(`${r.b}|${r.a}`); }

  const seen = new Set<string>();
  let inserted = 0, skipped = 0;

  const link = async (a: Sup, b: Sup, mechanism: string, severity: string) => {
    const key = `${a.id}|${b.id}`, rev = `${b.id}|${a.id}`;
    if (existing.has(key) || existing.has(rev) || seen.has(key) || seen.has(rev)) { skipped++; return; }
    seen.add(key); seen.add(rev);
    if (DRY_RUN) { console.log(`  [DRY] ${a.slug} <-> ${b.slug} (${severity})`); inserted++; return; }
    const res = await sql`
      INSERT INTO conflicts (id, supplement_a_id, supplement_b_id, conflict_type, min_spacing_hours, mechanism, severity)
      VALUES (${'conf-' + a.slug + '-' + b.slug}, ${a.id}, ${b.id}, 'spacing_required', 2, ${mechanism}, ${severity})
      ON CONFLICT (id) DO NOTHING
    `;
    if (res.count === 1) inserted++; else skipped++;
  };

  for (const rule of RULES) {
    const famA = families[rule.famA], famB = families[rule.famB];
    const repA = famA[0], repB = famB[0];
    if (!repA || !repB) continue;
    // every form of famA links to a representative of famB, and vice versa
    for (const a of famA) if (a.slug !== repB.slug) await link(a, repB, rule.mechanism, rule.severity);
    for (const b of famB) if (b.slug !== repA.slug) await link(repA, b, rule.mechanism, rule.severity);
  }

  console.log(`\n✅ conflicts inserted=${inserted} skipped(existing)>=${skipped}`);
  await sql.end();
}

run().catch(async (err) => { console.error('❌ conflicts backfill failed:', err); await sql.end(); process.exit(1); });

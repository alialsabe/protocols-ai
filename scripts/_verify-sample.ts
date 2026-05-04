import { loadLocalEnv, getPoolerUrl } from '../src/lib/database-env';
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

function loadExtra(f: string) {
  const p = path.join(process.cwd(), f);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const idx = t.indexOf('=');
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadLocalEnv();
loadExtra('.env.production.local');

const u = new URL(getPoolerUrl());
const sql = postgres({
  host: u.hostname, port: Number(u.port) || 5432,
  database: u.pathname.slice(1) || 'postgres',
  username: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  ssl: { rejectUnauthorized: false }, prepare: false, max: 1,
});

async function main() {
  const slug = process.argv[2] || 'ashwagandha-ksm66';
  const [s] = await sql<{id: string, name: string, slug: string}[]>`SELECT id, name, slug FROM supplements WHERE slug=${slug}`;
  if (!s) { console.log('not found'); await sql.end(); return; }

  const [sci] = await sql<{summary: string, extras: string, findings: string, data_source: string}[]>`
    SELECT summary, extras, findings, data_source FROM supplement_science WHERE supplement_id=${s.id} LIMIT 1
  `;
  const stacks = await sql<{why: string, strength: string, companion_supplement_id: string}[]>`
    SELECT why, strength, companion_supplement_id FROM companion_stacks WHERE supplement_id=${s.id} ORDER BY sort_order
  `;
  const meds = await sql<{medicine_name: string, severity: string, mechanism: string}[]>`
    SELECT medicine_name, severity, mechanism FROM medicine_interactions WHERE supplement_id=${s.id}
  `;

  console.log(`\n=== ${s.name} (${s.slug}) ===`);
  console.log(`data_source: ${sci?.data_source}`);
  console.log(`\nsummary: ${sci?.summary?.slice(0, 200)}`);
  if (sci?.extras) {
    const e = JSON.parse(sci.extras);
    console.log(`\nplainSummary: ${e.plainSummary?.slice(0, 240)}…`);
    console.log(`keyBenefits: ${e.keyBenefits?.join(' • ')}`);
    console.log(`bestFor: ${e.bestFor?.join(' • ')}`);
    console.log(`whoShouldAvoid: ${e.whoShouldAvoid?.join(' • ')}`);
    console.log(`whatToExpect: ${e.whatToExpect}`);
    console.log(`mechanism: ${e.mechanism?.slice(0, 200)}…`);
    console.log(`commonMyths: ${e.commonMyths?.length ?? 0} entries`);
    console.log(`sources: ${e.sources?.join(', ')}`);
  }
  console.log(`\nstacks (${stacks.length}):`);
  for (const st of stacks) console.log(`  - [${st.strength}] ${st.companion_supplement_id}: ${st.why.slice(0, 80)}`);
  console.log(`\nmedicineInteractions (${meds.length}):`);
  for (const m of meds) console.log(`  - [${m.severity}] ${m.medicine_name}: ${m.mechanism.slice(0, 60)}`);

  await sql.end();
}
main().catch(e => { console.error(e); process.exit(1); });

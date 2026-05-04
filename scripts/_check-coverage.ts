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
  const [{ n: total }]    = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplements WHERE status='published'`;
  const [{ n: noStacks }] = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplements s LEFT JOIN companion_stacks cs ON cs.supplement_id=s.id WHERE cs.id IS NULL AND s.status='published'`;
  const [{ n: avgStacks }] = await sql<{n:number}[]>`SELECT avg(c)::int n FROM (SELECT count(cs.id) c FROM supplements s LEFT JOIN companion_stacks cs ON cs.supplement_id=s.id WHERE s.status='published' GROUP BY s.id) sub`;
  const [{ n: noMed }]    = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplements s LEFT JOIN medicine_interactions mi ON mi.supplement_id=s.id WHERE mi.id IS NULL AND s.status='published'`;
  const [{ n: noSci }]    = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplements s LEFT JOIN supplement_science ss ON ss.supplement_id=s.id WHERE ss.id IS NULL AND s.status='published'`;
  const [{ n: noDose }]   = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplements s LEFT JOIN supplement_dosage sd ON sd.supplement_id=s.id WHERE sd.id IS NULL AND s.status='published'`;
  const [{ n: noSched }]  = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplements s LEFT JOIN schedule_rules sr ON sr.supplement_id=s.id WHERE sr.id IS NULL AND s.status='published'`;
  const [{ n: noStudy }]  = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplements s LEFT JOIN clinical_studies cs ON cs.supplement_id=s.id WHERE cs.id IS NULL AND s.status='published'`;
  const [{ n: llmGen }]   = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplement_science WHERE data_source='llm_generated'`;
  const [{ n: manual }]   = await sql<{n:number}[]>`SELECT count(*)::int n FROM supplement_science WHERE data_source='manual'`;

  console.log(`\nDB coverage report`);
  console.log(`  Total supplements : ${total}`);
  console.log(`  Has science       : ${total - noSci} (${llmGen} llm_generated, ${manual} manual)`);
  console.log(`  Missing science   : ${noSci}`);
  console.log(`  Missing dosage    : ${noDose}`);
  console.log(`  Missing schedule  : ${noSched}`);
  console.log(`  Missing studies   : ${noStudy}`);
  console.log(`  Missing stacks    : ${noStacks}`);
  console.log(`  Avg stacks/supp   : ${avgStacks}`);
  console.log(`  Missing med int.  : ${noMed}`);
  await sql.end();
}
main().catch(e => { console.error(e); process.exit(1); });

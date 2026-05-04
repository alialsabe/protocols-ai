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
loadLocalEnv(); loadExtra('.env.production.local');

const u = new URL(getPoolerUrl());
const sql = postgres({
  host: u.hostname, port: Number(u.port) || 5432,
  database: u.pathname.slice(1) || 'postgres',
  username: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  ssl: { rejectUnauthorized: false }, prepare: false, max: 1,
});

async function main() {
  const [{ n: hasExtras }] = await sql<{n:number}[]>`
    SELECT count(*)::int n FROM supplement_science
    WHERE coalesce(extras, '{}') != '{}' AND extras != ''
  `;
  const [{ n: stacks }] = await sql<{n:number}[]>`SELECT count(*)::int n FROM companion_stacks`;
  const [{ n: meds }] = await sql<{n:number}[]>`SELECT count(*)::int n FROM medicine_interactions`;
  const [{ n: supplWithStacks }] = await sql<{n:number}[]>`
    SELECT count(distinct supplement_id)::int n FROM companion_stacks
  `;
  console.log(`Has extras filled : ${hasExtras}/279`);
  console.log(`Stack rows total  : ${stacks}`);
  console.log(`Supps with stacks : ${supplWithStacks}/279`);
  console.log(`Med interaction   : ${meds} rows`);
  await sql.end();
}
main().catch(e => { console.error(e); process.exit(1); });

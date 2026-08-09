/**
 * One-shot data migration: Supabase Postgres -> Neon.
 *
 * Prerequisites:
 *   1. Schema already pushed to Neon:  npm run db:push  (with Neon URL in env)
 *   2. Env vars:
 *        SOURCE_DATABASE_URL  - current Supabase pooler URL
 *        TARGET_DATABASE_URL  - Neon connection string
 *      (falls back to .env.production.local DATABASE_URL for SOURCE,
 *       and NEON_DATABASE_URL for TARGET)
 *
 * Run:  npx tsx scripts/migrate-to-neon.ts          (dry run, counts only)
 *       npx tsx scripts/migrate-to-neon.ts --write  (actually copy)
 */
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

function readEnvValue(file: string, key: string): string {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return '';
  const line = fs.readFileSync(p, 'utf8').split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : '';
}

const sourceUrl = process.env.SOURCE_DATABASE_URL?.trim()
  || readEnvValue('.env.production.local', 'DATABASE_URL');
const targetUrl = process.env.TARGET_DATABASE_URL?.trim()
  || readEnvValue('.env.local', 'NEON_DATABASE_URL')
  || process.env.NEON_DATABASE_URL?.trim()
  || '';

if (!sourceUrl) throw new Error('Missing SOURCE_DATABASE_URL (Supabase pooler URL).');
if (!targetUrl) throw new Error('Missing TARGET_DATABASE_URL / NEON_DATABASE_URL (Neon connection string).');
if (sourceUrl === targetUrl) throw new Error('Source and target are the same database. Refusing to run.');

const write = process.argv.includes('--write');

const opts = { max: 1, prepare: false, ssl: 'require' as const };
const source = postgres(sourceUrl, opts);
const target = postgres(targetUrl, opts);

// FK-safe order: parents first, everything else after.
const PARENTS = ['supplements', 'saved_stacks'];

async function main() {
  const tables = await source<{ tablename: string }[]>`
    select tablename from pg_tables
    where schemaname = 'public'
    order by tablename
  `;
  const names = tables.map((t) => t.tablename);
  const ordered = [
    ...PARENTS.filter((t) => names.includes(t)),
    ...names.filter((t) => !PARENTS.includes(t)),
  ];

  console.log(`${write ? 'COPYING' : 'DRY RUN'} — ${ordered.length} tables\n`);

  let totalRows = 0;
  for (const table of ordered) {
    const rows = await source`select * from ${source(table)}`;
    totalRows += rows.length;

    if (write && rows.length > 0) {
      for (let i = 0; i < rows.length; i += 500) {
        await target`insert into ${target(table)} ${target(rows.slice(i, i + 500))} on conflict do nothing`;
      }
    }

    let destCount = '';
    if (write) {
      const [{ count }] = await target<{ count: string }[]>`select count(*)::text as count from ${target(table)}`;
      destCount = ` -> target now has ${count}`;
    }
    console.log(`${table.padEnd(30)} ${rows.length} rows${destCount}`);
  }

  console.log(`\nTotal: ${totalRows} rows ${write ? 'copied' : 'would be copied'}.`);
  if (!write) console.log('Re-run with --write to perform the copy.');
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.end();
    await target.end();
  });

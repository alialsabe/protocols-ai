import { readFileSync } from 'node:fs';
import postgres from 'postgres';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const url = process.env.SUPABASE_POOLER_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('Missing SUPABASE_POOLER_URL / DATABASE_URL in .env.local');
  process.exit(1);
}

const sql = postgres(url, { prepare: false });
const migration = readFileSync('drizzle/0000_trending.sql', 'utf8');
const statements = migration
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`Applying ${statements.length} statements to ${new URL(url).host}...`);

try {
  for (const [i, stmt] of statements.entries()) {
    const preview = stmt.split('\n')[0].slice(0, 70);
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);
    await sql.unsafe(stmt);
    console.log('ok');
  }

  const tables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('supplement_mentions', 'trending_snapshot')
    ORDER BY tablename
  `;
  console.log('\nVerified tables:', tables.map((t) => t.tablename).join(', '));

  const indexes = await sql`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'supplement_mentions_slug_mentioned_at_idx'
  `;
  console.log('Verified indexes:', indexes.map((i) => i.indexname).join(', ') || '(none)');
} catch (err) {
  console.error('\nFAILED:', err.message);
  process.exit(1);
} finally {
  await sql.end();
}

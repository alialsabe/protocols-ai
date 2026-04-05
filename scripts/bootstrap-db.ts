import fs from 'node:fs';
import path from 'node:path';
import { closeDatabaseConnections, seedDatabaseIfEmpty, getDatabaseMode } from '../src/lib/db';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const env = fs.readFileSync(filePath, 'utf8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['\"]|['\"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function run() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));
  loadEnvFile(path.join(process.cwd(), '.env'));

  const mode = await getDatabaseMode();
  console.log(`[bootstrap] active dialect=${mode.dialect} databaseUrlConfigured=${mode.databaseUrlConfigured} databasePath=${mode.databasePath ?? 'n/a'}`);
  if (mode.dialect !== 'postgres') {
    throw new Error('Refusing to bootstrap because the active database is not Postgres/Supabase. Set DATABASE_DIALECT=postgres and DATABASE_URL or SUPABASE_POOLER_URL to the Supabase Postgres connection string.');
  }

  await seedDatabaseIfEmpty();
  console.log('✅ Bootstrapped database with Protocols.ai dataset if needed.');
  await closeDatabaseConnections();
}

run().catch(async (error) => {
  console.error('❌ Failed to bootstrap database.');
  console.error(error);
  await closeDatabaseConnections();
  process.exit(1);
});

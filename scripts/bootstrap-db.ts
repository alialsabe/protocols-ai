import { closeDatabaseConnections, seedDatabaseIfEmpty, getDatabaseMode } from '../src/lib/db';

async function run() {
  const mode = await getDatabaseMode();
  console.log(`[bootstrap] active dialect=${mode.dialect} databaseUrlConfigured=${mode.databaseUrlConfigured} databasePath=${mode.databasePath ?? 'n/a'}`);
  if (mode.dialect !== 'postgres') {
    throw new Error('Refusing to bootstrap because DATABASE_DIALECT is not postgres. Production bootstrap now requires a Supabase pooler connection. Set DATABASE_DIALECT=postgres and SUPABASE_POOLER_URL.');
  }
  if (!mode.databaseUrlConfigured) {
    throw new Error('Refusing to bootstrap because no pooler connection is configured. Set SUPABASE_POOLER_URL and ensure production uses DATABASE_DIALECT=postgres.');
  }

  await seedDatabaseIfEmpty();
  console.log('✅ Bootstrapped database with Materia dataset if needed.');
  await closeDatabaseConnections();
}

run().catch(async (error) => {
  console.error('❌ Failed to bootstrap database.');
  console.error(error);
  await closeDatabaseConnections();
  process.exit(1);
});

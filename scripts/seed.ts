import { closeDatabaseConnections, resetAndSeedDatabase, seedDatabaseIfEmpty } from '../src/lib/db';

const shouldReset = process.argv.includes('--reset');

async function run() {
  if (shouldReset) {
    await resetAndSeedDatabase();
    console.log('✅ Reset and reseeded database with Protocols.ai dataset.');
  } else {
    await seedDatabaseIfEmpty();
    console.log('✅ Bootstrapped database with Protocols.ai dataset if needed.');
  }

  await closeDatabaseConnections();
}

run().catch(async (error) => {
  console.error(shouldReset ? '❌ Failed to reset and reseed database.' : '❌ Failed to bootstrap database.');
  console.error(error);
  await closeDatabaseConnections();
  process.exit(1);
});

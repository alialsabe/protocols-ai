import { closeDatabaseConnections, seedDatabaseIfEmpty } from '../src/lib/db';

async function run() {
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

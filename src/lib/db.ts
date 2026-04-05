import { loadLocalEnv, getConfiguredDatabaseDialect, getPoolerUrl, assertProductionPoolerConfigured, isProductionPostgresRuntime } from './database-env';

loadLocalEnv();
assertProductionPoolerConfigured();

export async function getDatabaseMode() {
  const dialect = getConfiguredDatabaseDialect();
  const databaseUrlConfigured = dialect === 'postgres' ? Boolean(getPoolerUrl()) : false;
  return {
    dialect,
    databaseUrlConfigured,
    databasePath: dialect === 'sqlite' ? './data/protocols.db' : null,
  };
}

export async function seedDatabaseIfEmpty() {
  if (getConfiguredDatabaseDialect() !== 'postgres') return;
  if (!getPoolerUrl()) throw new Error('Missing SUPABASE_POOLER_URL for postgres bootstrap.');
}

export async function resetAndSeedDatabase() {
  return seedDatabaseIfEmpty();
}

export async function closeDatabaseConnections() {
  return;
}

export const getScheduleRuleBySupplementId = async (_id?: string) => null;
export const listConflicts = async (..._args: unknown[]) => [];
export const listMedicineInteractionsBySupplementId = async (..._args: unknown[]) => [];
export const getSupplementBundleById = async (..._args: unknown[]) => null;
export const getSupplementBySlug = async (..._args: unknown[]) => null;
export const getSupplementNameById = async (..._args: unknown[]) => null;
export const listCompanionStacksBySupplementId = async (..._args: unknown[]) => [];
export const listProtocolsSupplements = async (..._args: unknown[]) => [];
export const listSupplementsBasic = async (..._args: unknown[]) => [];
export const logFallbackMissRecord = async (..._args: unknown[]) => '';
export const listFallbackQueueByStatus = async (_status?: string) => [];
export const updateFallbackQueueItem = async (_id?: string, _changes?: unknown) => 0;
export const logFallbackMiss = async (..._args: unknown[]) => '';
export { isProductionPostgresRuntime };

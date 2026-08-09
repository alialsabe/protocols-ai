import { defineConfig } from 'drizzle-kit';
import { getConfiguredDatabaseDialect, getPoolerUrl, loadLocalEnv } from './src/lib/database-env';

loadLocalEnv();

const dialect = getConfiguredDatabaseDialect() === 'postgres' ? 'postgresql' : 'sqlite';
const postgresUrl = getPoolerUrl();

if (dialect === 'postgresql' && !postgresUrl) {
  throw new Error('Missing DATABASE_URL (Neon) or SUPABASE_POOLER_URL. Postgres bootstrap/config requires a connection URL.');
}

export default defineConfig({
  schema: './src/lib/schema-postgres.ts',
  out: './drizzle',
  dialect,
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  dbCredentials: {
    url: postgresUrl!,
    ssl: process.env.POSTGRES_SSL === 'disable' ? false : 'require',
  },
  verbose: true,
  strict: true,
});

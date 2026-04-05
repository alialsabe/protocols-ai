import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema-postgres';
import { getPoolerUrl, loadLocalEnv } from './database-env';

loadLocalEnv();

const poolerUrl = getPoolerUrl();

if (!poolerUrl) {
  throw new Error(
    'Missing SUPABASE_POOLER_URL. Set it in .env.local or your Vercel environment.',
  );
}

// Connection pool tuned for serverless: low max, short idle timeout.
const client = postgres(poolerUrl, {
  max: 6,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.POSTGRES_SSL === 'disable' ? false : 'require',
  prepare: false, // required for Supabase transaction-mode pooler
});

export const db = drizzle(client, { schema });

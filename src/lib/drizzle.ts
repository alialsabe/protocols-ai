import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema-postgres';
import { getPoolerUrl, loadLocalEnv } from './database-env';

let _db: PostgresJsDatabase<typeof schema> | undefined;

function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;

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
    ssl: process.env.POSTGRES_SSL === 'disable' ? false : { rejectUnauthorized: false },
    prepare: false,
  });

  _db = drizzle(client, { schema });
  return _db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});

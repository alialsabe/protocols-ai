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
      'Missing database URL. Set DATABASE_URL (Neon) or SUPABASE_POOLER_URL in .env.local or your Vercel environment.',
    );
  }

  // Parse the URL to avoid URL-encoding issues with special chars in password
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(poolerUrl);
  } catch {
    throw new Error('Invalid database URL: ' + poolerUrl.slice(0, 30) + '...');
  }

  const client = postgres({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port) || 5432,
    database: parsedUrl.pathname.slice(1) || 'postgres',
    username: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    max: 2,
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

import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

const explicitDialect = process.env.DATABASE_DIALECT?.trim().toLowerCase();
const dialect = explicitDialect === 'sqlite'
  ? 'sqlite'
  : explicitDialect === 'postgres' || explicitDialect === 'postgresql'
    ? 'postgresql'
    : process.env.DATABASE_URL
      ? 'postgresql'
      : 'sqlite';

export default defineConfig({
  schema: dialect === 'sqlite' ? './src/lib/schema.ts' : './src/lib/schema-postgres.ts',
  out: './drizzle',
  dialect,
  dbCredentials: dialect === 'sqlite'
    ? {
        url: process.env.DATABASE_PATH || './data/protocols.db',
      }
    : {
        url: process.env.DATABASE_URL || '',
        ssl: process.env.POSTGRES_SSL === 'disable' ? false : 'require',
      },
  verbose: true,
  strict: true,
});

import fs from 'node:fs';
import path from 'node:path';

export type DatabaseDialect = 'sqlite' | 'postgres';

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

export function loadLocalEnv() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));
  loadEnvFile(path.join(process.cwd(), '.env'));
}

export function getConfiguredDatabaseDialect(): DatabaseDialect {
  const explicit = process.env.DATABASE_DIALECT?.trim().toLowerCase();
  if (explicit === 'postgres' || explicit === 'postgresql') return 'postgres';
  return 'sqlite';
}

export function getPoolerUrl() {
  return process.env.SUPABASE_POOLER_URL?.trim() || '';
}

export function assertProductionPoolerConfigured() {
  if (process.env.NODE_ENV === 'production' && getConfiguredDatabaseDialect() === 'postgres' && !getPoolerUrl()) {
    throw new Error('Missing SUPABASE_POOLER_URL for production postgres runtime.');
  }
}

export function isProductionPostgresRuntime() {
  return process.env.NODE_ENV === 'production' && getConfiguredDatabaseDialect() === 'postgres';
}

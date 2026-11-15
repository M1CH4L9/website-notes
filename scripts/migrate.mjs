#!/usr/bin/env node
/**
 * Stosuje migracje SQL z db/migrations/.
 * Na Vercelu odpala się przy `npm run build`, gdy jest DATABASE_URL / POSTGRES_URL.
 * Lokalnie: DATABASE_URL=... npm run db:migrate
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isVercel = process.env.VERCEL === '1';
const isProdBuild = process.env.VERCEL_ENV === 'production' || (!isVercel && Boolean(url));

if (!url) {
  const required = process.argv.includes('--require');
  if (required) {
    console.error('[migrate] Ustaw DATABASE_URL (albo POSTGRES_URL).');
    process.exit(1);
  }
  console.log('[migrate] Brak DATABASE_URL / POSTGRES_URL - pomijam migracje.');
  process.exit(0);
}

// Na preview bez osobnej bazy nie ruszamy produkcji.
if (isVercel && process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
  console.log(`[migrate] VERCEL_ENV=${process.env.VERCEL_ENV} - pomijam migracje (tylko production).`);
  process.exit(0);
}

if (!isProdBuild && isVercel) {
  process.exit(0);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(root, 'db', 'migrations');

const client = new pg.Client({ connectionString: url, ssl: sslOption(url) });
await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await client.query('SELECT 1 FROM schema_migrations WHERE id = $1', [file]);
    if (rows.length > 0) {
      console.log(`[migrate] już jest: ${file}`);
      continue;
    }
    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`[migrate] zastosowano: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.end();
}

function sslOption(connectionString) {
  // Neon i większość hostowanych Postgresów wymaga SSL; lokalny cluster zwykle nie.
  if (/localhost|127\.0\.0\.1/i.test(connectionString)) return false;
  return { rejectUnauthorized: false };
}

import pg from 'pg';
import { databaseUrl } from './env';

const globalForDb = globalThis as typeof globalThis & {
  __notesPgPool?: pg.Pool;
};

function sslOption(connectionString: string): false | { rejectUnauthorized: boolean } {
  if (/localhost|127\.0\.0\.1/i.test(connectionString)) return false;
  return { rejectUnauthorized: false };
}

export function getPool(): pg.Pool {
  if (!globalForDb.__notesPgPool) {
    const connectionString = databaseUrl();
    globalForDb.__notesPgPool = new pg.Pool({
      connectionString,
      ssl: sslOption(connectionString),
      max: 5,
    });
  }
  return globalForDb.__notesPgPool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function transaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

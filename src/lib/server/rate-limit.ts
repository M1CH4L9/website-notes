import { query } from './db';

export async function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const resetAt = new Date(Date.now() + windowMs);
  const { rows } = await query<{ hits: number; reset_at: Date }>(
    `INSERT INTO rate_limits (key, hits, reset_at)
     VALUES ($1, 1, $2)
     ON CONFLICT (key) DO UPDATE
       SET hits = CASE
             WHEN rate_limits.reset_at <= now() THEN 1
             ELSE rate_limits.hits + 1
           END,
           reset_at = CASE
             WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at
             ELSE rate_limits.reset_at
           END
     RETURNING hits, reset_at`,
    [key, resetAt],
  );
  const row = rows[0];
  if (!row) return { ok: true, retryAfterSec: 0 };
  if (row.hits > limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((new Date(row.reset_at).getTime() - Date.now()) / 1000),
    );
    return { ok: false, retryAfterSec };
  }
  return { ok: true, retryAfterSec: 0 };
}

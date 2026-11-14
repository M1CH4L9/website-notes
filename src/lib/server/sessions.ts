import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { query } from './db';
import { isProd, sessionCookieName, sessionTtlMs } from './env';
import { findUserById, type User } from './users';

export type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  csrf_secret: string;
  expires_at: Date;
  created_at: Date;
};

export type AuthContext = {
  user: User;
  session: SessionRow;
  token: string;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSessionToken(): { token: string; tokenHash: string; csrfSecret: string } {
  const token = randomBytes(32).toString('base64url');
  const csrfSecret = randomBytes(24).toString('base64url');
  return { token, tokenHash: hashToken(token), csrfSecret };
}

export async function createSession(userId: string): Promise<{ token: string; session: SessionRow }> {
  const { token, tokenHash, csrfSecret } = createSessionToken();
  const expires = new Date(Date.now() + sessionTtlMs());
  const { rows } = await query<SessionRow>(
    `INSERT INTO sessions (user_id, token_hash, csrf_secret, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, tokenHash, csrfSecret, expires],
  );
  return { token, session: rows[0] };
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set(sessionCookieName(), token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd(),
    expires: new Date(Date.now() + sessionTtlMs()),
  });
  // Podpowiedź dla UI (nie sekret) — zostaje, gdyby kiedyś wróciły strony prerenderowane.
  cookies.set('konto', '1', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: isProd(),
    expires: new Date(Date.now() + sessionTtlMs()),
  });
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(sessionCookieName(), { path: '/' });
  cookies.delete('konto', { path: '/' });
}

export async function destroySession(token: string | undefined) {
  if (!token) return;
  await query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
}

export async function getAuthFromCookies(cookies: AstroCookies): Promise<AuthContext | null> {
  const token = cookies.get(sessionCookieName())?.value;
  if (!token) return null;

  const { rows } = await query<SessionRow>(
    `SELECT * FROM sessions WHERE token_hash = $1 LIMIT 1`,
    [hashToken(token)],
  );
  const session = rows[0];
  if (!session) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await query('DELETE FROM sessions WHERE id = $1', [session.id]);
    return null;
  }

  const user = await findUserById(session.user_id);
  if (!user) {
    await query('DELETE FROM sessions WHERE id = $1', [session.id]);
    return null;
  }

  const remaining = new Date(session.expires_at).getTime() - Date.now();
  if (remaining < sessionTtlMs() / 2) {
    const expires = new Date(Date.now() + sessionTtlMs());
    await query('UPDATE sessions SET expires_at = $2 WHERE id = $1', [session.id, expires]);
    session.expires_at = expires;
  }

  return { user, session, token };
}

export function csrfTokenFor(session: SessionRow): string {
  return createHash('sha256').update(`csrf:${session.csrf_secret}`).digest('base64url');
}

export function verifyCsrf(session: SessionRow, provided: string | null | undefined): boolean {
  if (!provided) return false;
  const expected = Buffer.from(csrfTokenFor(session));
  const got = Buffer.from(provided);
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}

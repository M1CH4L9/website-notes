import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { query } from './db';
import { isProd, sessionCookieName, sessionTtlMs } from './env';
import type { User } from './users';

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
  // Podpowiedź dla UI (nie sekret) - zostaje, gdyby kiedyś wróciły strony prerenderowane.
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

type SessionUserRow = SessionRow & {
  user_id: string;
  username: string;
  password_hash: string | null;
  github_id: string | null;
  github_login: string | null;
  is_admin: boolean;
  pref_theme: 'dark' | 'light' | null;
  pref_cute: boolean | null;
  created_at_user: Date;
};

export async function getAuthFromCookies(cookies: AstroCookies): Promise<AuthContext | null> {
  const token = cookies.get(sessionCookieName())?.value;
  if (!token) return null;

  // Jedno zapytanie zamiast sesji + użytkownika osobno (mniej round-tripów do Neonu).
  const { rows } = await query<SessionUserRow>(
    `SELECT s.id, s.user_id, s.token_hash, s.csrf_secret, s.expires_at, s.created_at,
            u.username, u.password_hash, u.github_id, u.github_login, u.is_admin,
            u.pref_theme, u.pref_cute,
            u.created_at AS created_at_user
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
     LIMIT 1`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await query('DELETE FROM sessions WHERE id = $1', [row.id]);
    return null;
  }

  const session: SessionRow = {
    id: row.id,
    user_id: row.user_id,
    token_hash: row.token_hash,
    csrf_secret: row.csrf_secret,
    expires_at: row.expires_at,
    created_at: row.created_at,
  };

  const user: User = {
    id: row.user_id,
    username: row.username,
    password_hash: row.password_hash,
    github_id: row.github_id,
    github_login: row.github_login,
    is_admin: row.is_admin,
    pref_theme: row.pref_theme === 'light' || row.pref_theme === 'dark' ? row.pref_theme : null,
    pref_cute: typeof row.pref_cute === 'boolean' ? row.pref_cute : null,
    created_at: row.created_at_user,
  };

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

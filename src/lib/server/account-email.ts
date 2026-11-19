import { createHash, randomBytes } from 'node:crypto';
import { query, transaction } from './db';
import { isProd } from './env';
import type { User } from './users';

export type EmailPurpose = 'register' | 'reset' | 'profile';
type EmailLink = { email: string; user_id: string | null };
const expiresIn = { register: 60, reset: 30, profile: 60 };
const paths = { register: '/rejestracja/dokoncz/', reset: '/haslo/ustaw/', profile: '/profil/potwierdz-email/' };
const subjects = { register: 'Dokończ rejestrację', reset: 'Ustaw nowe hasło', profile: 'Potwierdź adres e-mail' };

export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email) ? email : null;
}

function mailConfig() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  const site = process.env.PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if (!key || !from || !site) return null;
  try {
    const url = new URL(site);
    const localHttp = !isProd() && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localHttp) return null;
    return { key, from, origin: url.origin };
  } catch { return null; }
}

export function emailConfigured() { return Boolean(mailConfig()); }
export const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');
export const validEmailToken = (value: string) => /^[\w-]{43}$/.test(value);

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] ?? null;
}

export async function sendAccountEmail(purpose: EmailPurpose, email: string, userId: string | null = null) {
  const config = mailConfig();
  if (!config) throw new Error('Poczta nie jest skonfigurowana.');
  const token = randomBytes(32).toString('base64url');
  const hash = tokenHash(token);
  const link = new URL(paths[purpose], config.origin);
  link.searchParams.set('token', token);
  await query('DELETE FROM account_email_links WHERE expires_at <= now()');
  await query(`INSERT INTO account_email_links (purpose, email, token_hash, user_id, expires_at)
    VALUES ($1, $2, $3, $4, now() + $5 * interval '1 minute')
    ON CONFLICT (purpose, email, user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash,
      user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at`,
    [purpose, email, hash, userId, expiresIn[purpose]]);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${config.key}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from: config.from, to: [email], subject: `${subjects[purpose]} · Notatnik`,
        text: `${subjects[purpose]} w Notatniku:\n\n${link.href}\n\nLink jest ważny przez ${expiresIn[purpose]} min. Jeśli to nie Twoja prośba, zignoruj tę wiadomość.`,
      }),
    });
    if (!response.ok) throw new Error(`Resend HTTP ${response.status}`);
  } catch (error) {
    await query('DELETE FROM account_email_links WHERE token_hash = $1', [hash]);
    throw error;
  }
}

export async function readEmailLink(purpose: EmailPurpose, token: string): Promise<EmailLink | null> {
  if (!validEmailToken(token)) return null;
  const { rows } = await query<EmailLink>(`SELECT email, user_id FROM account_email_links
    WHERE purpose = $1 AND token_hash = $2 AND expires_at > now()`, [purpose, tokenHash(token)]);
  return rows[0] ?? null;
}

export async function finishEmailLink(input: {
  purpose: EmailPurpose;
  token: string;
  userId?: string;
  passwordHash?: string;
  username?: string;
}): Promise<boolean> {
  const preview = await readEmailLink(input.purpose, input.token);
  if (!preview || (input.purpose === 'profile' && preview.user_id !== input.userId)) return false;
  return transaction(async client => {
    // Spójna kolejność blokad z resetem i logowaniem hasłem.
    const owner = preview.user_id && (await client.query<User>(
      'SELECT * FROM users WHERE id = $1 FOR UPDATE', [preview.user_id],
    )).rows[0];
    const { rows: [link] } = await client.query<EmailLink>(`DELETE FROM account_email_links
      WHERE purpose = $1 AND token_hash = $2 AND expires_at > now() RETURNING email, user_id`,
      [input.purpose, tokenHash(input.token)]);
    if (!link) return false;
    if (input.purpose === 'register') {
      await client.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        [input.username, link.email, input.passwordHash]);
      return true;
    }
    if (!owner) return false;
    if (input.purpose === 'reset') {
      if (owner.email !== link.email) return false;
      await client.query('UPDATE users SET password_hash = $2 WHERE id = $1', [owner.id, input.passwordHash]);
      await client.query('DELETE FROM sessions WHERE user_id = $1', [owner.id]);
    } else {
      await client.query('UPDATE users SET email = $2 WHERE id = $1', [owner.id, link.email]);
    }
    await client.query('DELETE FROM account_email_links WHERE user_id = $1', [owner.id]);
    return true;
  });
}

import type { APIRoute } from 'astro';
import { normalizeEmail, findUserByEmail } from '../../../lib/server/account-email';
import { verifyPassword } from '../../../lib/server/password';
import { hitRateLimit } from '../../../lib/server/rate-limit';
import { createSession, setSessionCookie } from '../../../lib/server/sessions';
import {
  findUserByUsername,
  normalizeThemePreference,
  normalizeUsername,
  updateUserPreferences,
} from '../../../lib/server/users';
import { isDatabaseConfigured } from '../../../lib/server/env';
import { parseForm, readFormString, redirect, safeNext } from '../../../lib/server/http';

export const prerender = false;

// Use the same scrypt work for an unknown account or one without a password.
const DUMMY_HASH = `scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$${Buffer.alloc(64).toString('base64url')}`;

export const POST: APIRoute = async (context) => {
  if (!isDatabaseConfigured()) {
    return redirect('/logowanie?error=' + encodeURIComponent('Baza nie jest podłączona.'));
  }

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  if (readFormString(form, 'website')) {
    return redirect('/moje/');
  }

  const origin = context.request.headers.get('origin');
  if (origin && origin !== context.url.origin) {
    return redirect('/logowanie?error=' + encodeURIComponent('Nieprawidłowy Origin.'));
  }

  const ip = context.clientAddress || 'unknown';
  const limited = await hitRateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    return redirect(
      '/logowanie?error=' + encodeURIComponent(`Zbyt wiele prób. Spróbuj za ${limited.retryAfterSec} s.`),
    );
  }

  const identifier = readFormString(form, 'username').trim();
  const password = readFormString(form, 'password');
  const next = safeNext(readFormString(form, 'next'));
  const localTheme = normalizeThemePreference(readFormString(form, 'theme'));
  const localCuteRaw = readFormString(form, 'cute');
  const hasLocalCute = localCuteRaw === '0' || localCuteRaw === '1';

  const email = normalizeEmail(identifier);
  const username = normalizeUsername(identifier);
  const user = identifier.includes('@')
    ? (email ? await findUserByEmail(email) : null)
    : (/^[a-z0-9_]{3,32}$/.test(username) ? await findUserByUsername(username) : null);
  const ok = password.length <= 200 && await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !user.password_hash || !ok) {
    return redirect('/logowanie?error=' + encodeURIComponent('Nieprawidłowe dane logowania.'));
  }

  // Lokalne → serwer przy logowaniu, gdy konto jeszcze nie ma zapisanych preferencji.
  if (user.pref_theme == null && localTheme) {
    await updateUserPreferences(user.id, localTheme, hasLocalCute ? localCuteRaw === '1' : false);
  }

  const session = await createSession(user.id, user.password_hash).catch(() => null);
  if (!session) return redirect('/logowanie?error=' + encodeURIComponent('Zaloguj się ponownie.'));
  const { token } = session;
  setSessionCookie(context.cookies, token);
  return redirect(next);
};

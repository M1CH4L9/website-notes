import type { APIRoute } from 'astro';
import { verifyPassword } from '../../../lib/server/password';
import { hitRateLimit } from '../../../lib/server/rate-limit';
import { createSession, setSessionCookie } from '../../../lib/server/sessions';
import { findUserByUsername, normalizeUsername } from '../../../lib/server/users';
import { isDatabaseConfigured } from '../../../lib/server/env';
import { parseForm, readFormString, redirect } from '../../../lib/server/http';

export const prerender = false;

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

  const username = normalizeUsername(readFormString(form, 'username'));
  const password = readFormString(form, 'password');
  const next = safeNext(readFormString(form, 'next'));

  const user = await findUserByUsername(username);
  const ok =
    user?.password_hash != null ? await verifyPassword(password, user.password_hash) : false;

  if (!user || !ok) {
    return redirect('/logowanie?error=' + encodeURIComponent('Nieprawidłowa nazwa lub hasło.'));
  }

  const { token } = await createSession(user.id);
  setSessionCookie(context.cookies, token);
  return redirect(next);
};

function safeNext(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return '/moje/';
  return value;
}

import type { APIRoute } from 'astro';
import { assertPasswordPolicy, hashPassword } from '../../../lib/server/password';
import { hitRateLimit } from '../../../lib/server/rate-limit';
import { createSession, setSessionCookie } from '../../../lib/server/sessions';
import {
  assertUsername,
  createUserWithPassword,
  findUserByUsername,
  normalizeUsername,
} from '../../../lib/server/users';
import { isDatabaseConfigured } from '../../../lib/server/env';
import { parseForm, readFormString, redirect } from '../../../lib/server/http';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  if (!isDatabaseConfigured()) {
    return redirect('/rejestracja?error=' + encodeURIComponent('Baza nie jest podłączona.'));
  }

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  if (readFormString(form, 'website')) {
    return redirect('/moje/');
  }

  const origin = context.request.headers.get('origin');
  if (origin && origin !== context.url.origin) {
    return redirect('/rejestracja?error=' + encodeURIComponent('Nieprawidłowy Origin.'));
  }

  const ip = context.clientAddress || 'unknown';
  const limited = await hitRateLimit(`register:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return redirect(
      '/rejestracja?error=' + encodeURIComponent(`Zbyt wiele prób. Spróbuj za ${limited.retryAfterSec} s.`),
    );
  }

  const username = normalizeUsername(readFormString(form, 'username'));
  const password = readFormString(form, 'password');
  const next = safeNext(readFormString(form, 'next'));

  const usernameError = assertUsername(username);
  if (usernameError) {
    return redirect('/rejestracja?error=' + encodeURIComponent(usernameError));
  }
  const passwordError = assertPasswordPolicy(password);
  if (passwordError) {
    return redirect('/rejestracja?error=' + encodeURIComponent(passwordError));
  }

  const existing = await findUserByUsername(username);
  if (existing) {
    return redirect('/rejestracja?error=' + encodeURIComponent('Ta nazwa jest zajęta.'));
  }

  const passwordHash = await hashPassword(password);
  const user = await createUserWithPassword(username, passwordHash);
  const { token } = await createSession(user.id);
  setSessionCookie(context.cookies, token);
  return redirect(next);
};

function safeNext(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return '/moje/';
  return value;
}

import type { APIRoute } from 'astro';
import {
  assertPasswordPolicy,
  hashPassword,
  verifyPassword,
} from '../../../lib/server/password';
import { assertSafeMutation, parseForm, readFormString, redirect } from '../../../lib/server/http';
import { getAuthFromCookies } from '../../../lib/server/sessions';
import { isDatabaseConfigured } from '../../../lib/server/env';
import { updateUserPassword } from '../../../lib/server/users';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const fail = (message: string) =>
    redirect('/profil/?error=' + encodeURIComponent(message));

  if (!isDatabaseConfigured()) {
    return fail('Baza nie jest podłączona.');
  }

  const auth = await getAuthFromCookies(context.cookies);
  if (!auth) {
    return redirect('/logowanie?next=' + encodeURIComponent('/profil/'));
  }

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) return fail(unsafe);

  const current = readFormString(form, 'current_password');
  const next = readFormString(form, 'password');
  const confirm = readFormString(form, 'password_confirm');

  if (auth.user.password_hash) {
    const ok = current.length <= 200 && await verifyPassword(current, auth.user.password_hash);
    if (!ok) return fail('Obecne hasło jest nieprawidłowe.');
  }

  const policy = assertPasswordPolicy(next);
  if (policy) return fail(policy);
  if (next !== confirm) return fail('Hasła nie są takie same.');

  const passwordHash = await hashPassword(next);
  const changed = await updateUserPassword(auth.user.id, passwordHash, auth.user.password_hash, auth.session.id);
  if (!changed) return fail('Hasło zostało już zmienione. Zaloguj się ponownie.');
  return redirect('/profil/?ok=' + encodeURIComponent('Hasło zapisane.'));
};

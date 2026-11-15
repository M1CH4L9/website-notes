import type { APIRoute } from 'astro';
import { assertSafeMutation, json, parseForm, readFormString } from '../../../lib/server/http';
import { getAuthFromCookies } from '../../../lib/server/sessions';
import { isDatabaseConfigured } from '../../../lib/server/env';
import { normalizeThemePreference, updateUserPreferences } from '../../../lib/server/users';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  if (!isDatabaseConfigured()) {
    return json({ error: 'Baza nie jest podłączona.' }, 503);
  }

  const auth = await getAuthFromCookies(context.cookies);
  if (!auth) return json({ error: 'Wymagane logowanie.' }, 401);

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) return json({ error: unsafe }, 403);

  const theme = normalizeThemePreference(readFormString(form, 'theme'));
  if (!theme) return json({ error: 'Nieprawidłowy motyw.' }, 400);
  const cute = readFormString(form, 'cute') === '1';

  await updateUserPreferences(auth.user.id, theme, cute);
  return json({ ok: true, theme, cute });
};

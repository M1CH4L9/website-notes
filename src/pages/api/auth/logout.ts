import type { APIRoute } from 'astro';
import {
  clearSessionCookie,
  destroySession,
  getAuthFromCookies,
  verifyCsrf,
} from '../../../lib/server/sessions';
import { sessionCookieName } from '../../../lib/server/env';
import { parseForm, readFormString, redirect } from '../../../lib/server/http';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await getAuthFromCookies(context.cookies);
  if (auth) {
    const formOrErr = await parseForm(context.request);
    if (!(formOrErr instanceof Response)) {
      const csrf = readFormString(formOrErr, 'csrf');
      if (verifyCsrf(auth.session, csrf)) {
        await destroySession(auth.token);
      }
    } else {
      // Brak formularza — i tak wyloguj przy poprawnej sesji (np. fetch).
      await destroySession(context.cookies.get(sessionCookieName())?.value);
    }
  } else {
    await destroySession(context.cookies.get(sessionCookieName())?.value);
  }
  clearSessionCookie(context.cookies);
  return redirect('/');
};

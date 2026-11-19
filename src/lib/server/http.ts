import type { APIContext } from 'astro';
import { getAuthFromCookies, verifyCsrf, type AuthContext } from './sessions';
import { isDatabaseConfigured } from './env';

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function redirect(location: string, status = 303): Response {
  return new Response(null, {
    status,
    headers: { Location: location },
  });
}

export function safeNext(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) return '/moje/';
  return value;
}

export function formMessage(path: string, kind: 'ok' | 'error', message: string) {
  const url = new URL(path, 'https://local.invalid');
  url.searchParams.set(kind, message);
  const response = redirect(url.pathname + url.search);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export function readFormString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

export async function requireDb(): Promise<Response | null> {
  if (isDatabaseConfigured()) return null;
  return json(
    {
      error:
        'Baza nie jest podłączona. Ustaw DATABASE_URL (Neon) i zrób Redeploy.',
    },
    503,
  );
}

export async function requireUser(context: APIContext): Promise<AuthContext | Response> {
  const missing = await requireDb();
  if (missing) return missing;
  const auth = await getAuthFromCookies(context.cookies);
  if (!auth) return redirect(`/logowanie?next=${encodeURIComponent(context.url.pathname)}`);
  return auth;
}

export async function requireAdmin(context: APIContext): Promise<AuthContext | Response> {
  const auth = await requireUser(context);
  if (auth instanceof Response) return auth;
  if (!auth.user.is_admin) return json({ error: 'Brak uprawnień.' }, 403);
  return auth;
}

/** Origin + CSRF dla formularzy POST. */
export function assertSafeMutation(
  context: APIContext,
  auth: AuthContext,
  form: FormData,
): string | null {
  const origin = context.request.headers.get('origin');
  if (origin) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      return 'Nieprawidłowy Origin.';
    }
    if (parsed.origin !== context.url.origin) return 'Nieprawidłowy Origin.';
  } else {
    const referer = context.request.headers.get('referer');
    if (referer) {
      try {
        if (new URL(referer).origin !== context.url.origin) return 'Nieprawidłowy Referer.';
      } catch {
        return 'Nieprawidłowy Referer.';
      }
    }
  }

  const csrf = readFormString(form, 'csrf');
  if (!verifyCsrf(auth.session, csrf)) return 'Nieprawidłowy token CSRF. Odśwież stronę.';
  return null;
}

export async function parseForm(request: Request): Promise<FormData | Response> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/x-www-form-urlencoded') && !contentType.includes('multipart/form-data')) {
    return json({ error: 'Oczekiwany formularz.' }, 415);
  }
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 1_000_000) return json({ error: 'Za duże żądanie.' }, 413);
  return request.formData();
}

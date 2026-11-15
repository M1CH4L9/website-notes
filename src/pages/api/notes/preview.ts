import type { APIRoute } from 'astro';
import { json, requireUser } from '../../../lib/server/http';
import { renderUserMarkdown } from '../../../markdown/user.mjs';

export const prerender = false;

const MAX_BODY = 200_000;

export const POST: APIRoute = async (context) => {
  const auth = await requireUser(context);
  if (auth instanceof Response) {
    if (auth.headers.get('content-type')?.includes('application/json')) return auth;
    return json({ error: 'Zaloguj się, żeby zobaczyć podgląd.' }, 401);
  }

  const contentType = context.request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return json({ error: 'Oczekiwany JSON.' }, 415);
  }

  let payload: { body?: unknown };
  try {
    payload = await context.request.json();
  } catch {
    return json({ error: 'Nieprawidłowy JSON.' }, 400);
  }

  const body = typeof payload.body === 'string' ? payload.body : '';
  if (body.length > MAX_BODY) {
    return json({ error: 'Treść jest za długa do podglądu.' }, 413);
  }

  try {
    const { html } = await renderUserMarkdown(body);
    return json({ html });
  } catch (error) {
    console.error('[preview]', error);
    return json({ error: 'Nie udało się wyrenderować podglądu.' }, 500);
  }
};

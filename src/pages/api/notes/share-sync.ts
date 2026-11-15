import type { APIRoute } from 'astro';
import { json } from '../../../lib/server/http';
import { isDatabaseConfigured } from '../../../lib/server/env';
import {
  getActiveShareByToken,
  getNoteRevision,
  listPresence,
  saveSharedNote,
  touchPresence,
} from '../../../lib/server/shares';
import { getAuthFromCookies, verifyCsrf } from '../../../lib/server/sessions';

export const prerender = false;

function readToken(url: URL, body?: Record<string, unknown>): string {
  return (
    (typeof body?.token === 'string' && body.token) ||
    url.searchParams.get('token') ||
    ''
  ).trim();
}

export const GET: APIRoute = async (context) => {
  if (!isDatabaseConfigured()) return json({ error: 'Brak bazy.' }, 503);

  const token = readToken(context.url);
  const share = await getActiveShareByToken(token);
  if (!share) return json({ error: 'Link nieważny.' }, 404);

  const clientId = context.url.searchParams.get('client_id') || '';
  const displayName =
    context.url.searchParams.get('display_name') ||
    context.locals.user?.username ||
    'Gość';

  if (clientId) {
    await touchPresence({
      noteId: share.note.id,
      clientId,
      displayName,
      canEdit: share.permission === 'edit',
    });
  }

  const state = await getNoteRevision(share.note.id);
  if (!state) return json({ error: 'Notatka zniknęła.' }, 404);
  const presence = await listPresence(share.note.id);

  return json({
    permission: share.permission,
    revision: state.revision,
    title: state.title,
    description: state.description,
    body: state.body,
    updated_at: state.updated_at,
    presence: presence.map((p) => ({
      client_id: p.client_id,
      display_name: p.display_name,
      can_edit: p.can_edit,
    })),
  });
};

export const POST: APIRoute = async (context) => {
  if (!isDatabaseConfigured()) return json({ error: 'Brak bazy.' }, 503);

  let body: Record<string, unknown>;
  try {
    body = (await context.request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Oczekiwany JSON.' }, 415);
  }

  const token = readToken(context.url, body);
  const share = await getActiveShareByToken(token);
  if (!share) return json({ error: 'Link nieważny.' }, 404);
  if (share.permission !== 'edit') return json({ error: 'Ten link jest tylko do odczytu.' }, 403);

  // Edycja: token edit wystarcza. Jeśli jest sesja, wymagamy CSRF.
  const auth = await getAuthFromCookies(context.cookies);
  if (auth) {
    const csrf = typeof body.csrf === 'string' ? body.csrf : '';
    if (!verifyCsrf(auth.session, csrf)) {
      return json({ error: 'Nieprawidłowy CSRF.' }, 403);
    }
  }

  const expectedRevision = Number(body.revision);
  if (!Number.isFinite(expectedRevision)) {
    return json({ error: 'Brak revision.' }, 400);
  }

  const clientId = typeof body.client_id === 'string' ? body.client_id : '';
  const displayName =
    (typeof body.display_name === 'string' && body.display_name) ||
    auth?.user.username ||
    'Gość';

  if (clientId) {
    await touchPresence({
      noteId: share.note.id,
      clientId,
      displayName,
      canEdit: true,
    });
  }

  try {
    const result = await saveSharedNote({
      noteId: share.note.id,
      expectedRevision,
      title: typeof body.title === 'string' ? body.title : '',
      description: typeof body.description === 'string' ? body.description : '',
      body: typeof body.body === 'string' ? body.body : '',
    });

    if (!result.ok) {
      return json(
        {
          conflict: true,
          revision: result.revision,
          title: result.title,
          description: result.description,
          body: result.body,
          updated_at: result.updated_at,
          presence: (await listPresence(share.note.id)).map((p) => ({
            client_id: p.client_id,
            display_name: p.display_name,
            can_edit: p.can_edit,
          })),
        },
        409,
      );
    }

    return json({
      ok: true,
      revision: result.revision,
      updated_at: result.updated_at,
      presence: (await listPresence(share.note.id)).map((p) => ({
        client_id: p.client_id,
        display_name: p.display_name,
        can_edit: p.can_edit,
      })),
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Nie udało się zapisać.' },
      400,
    );
  }
};

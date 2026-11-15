import type { APIRoute } from 'astro';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireAdmin,
} from '../../../lib/server/http';
import { resolveRequest } from '../../../lib/server/publications';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireAdmin(context);
  if (auth instanceof Response) return auth;

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  const tab = readFormString(form, 'tab') || 'nowe';
  const back = `/admin/prosby/?tab=${encodeURIComponent(tab)}`;

  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) {
    return redirect(`${back}&error=` + encodeURIComponent(unsafe));
  }

  const requestId = readFormString(form, 'request_id');
  const decision = readFormString(form, 'decision');
  const accept = decision === 'accept';

  try {
    const result = await resolveRequest({
      requestId,
      accept,
      adminNote: readFormString(form, 'admin_note'),
    });
    const pub = result.publication;
    const okMsg = accept
      ? pub
        ? `Zaakceptowano — /przedmioty/${pub.subject_slug}/${pub.slug}/`
        : 'Zaakceptowano.'
      : 'Odrzucono prośbę.';
    return redirect(`${back}&ok=` + encodeURIComponent(okMsg));
  } catch (error) {
    return redirect(
      `${back}&error=` +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się rozpatrzyć.'),
    );
  }
};

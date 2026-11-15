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

  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) {
    return redirect('/admin/prosby/?error=' + encodeURIComponent(unsafe));
  }

  const requestId = readFormString(form, 'request_id');
  const decision = readFormString(form, 'decision');
  const accept = decision === 'accept';

  try {
    await resolveRequest({
      requestId,
      accept,
      adminNote: readFormString(form, 'admin_note'),
    });
    return redirect(
      '/admin/prosby/?ok=' +
        encodeURIComponent(accept ? 'Zaakceptowano — notatka jest publiczna.' : 'Odrzucono prośbę.'),
    );
  } catch (error) {
    return redirect(
      '/admin/prosby/?error=' +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się rozpatrzyć.'),
    );
  }
};

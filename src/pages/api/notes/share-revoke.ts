import type { APIRoute } from 'astro';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireUser,
} from '../../../lib/server/http';
import { getNoteByUserAndSlug } from '../../../lib/server/user-notes';
import { revokeShare } from '../../../lib/server/shares';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireUser(context);
  if (auth instanceof Response) return auth;

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  const slug = readFormString(form, 'slug');
  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) {
    return redirect(`/moje/${slug}/?error=` + encodeURIComponent(unsafe));
  }

  const note = await getNoteByUserAndSlug(auth.user.id, slug);
  if (!note) {
    return redirect('/moje/?error=' + encodeURIComponent('Nie ma takiej notatki.'));
  }

  const shareId = readFormString(form, 'share_id');
  const ok = await revokeShare({ shareId, userId: auth.user.id });
  return redirect(
    `/moje/${slug}/?ok=` +
      encodeURIComponent(ok ? 'Unieważniono link.' : 'Nie znaleziono aktywnego linku.'),
  );
};

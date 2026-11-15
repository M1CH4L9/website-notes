import type { APIRoute } from 'astro';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireUser,
} from '../../../lib/server/http';
import { getNoteByUserAndSlug } from '../../../lib/server/user-notes';
import { createShare, type SharePermission } from '../../../lib/server/shares';

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

  const permissionRaw = readFormString(form, 'permission');
  const permission: SharePermission = permissionRaw === 'edit' ? 'edit' : 'read';

  try {
    const share = await createShare({
      noteId: note.id,
      userId: auth.user.id,
      permission,
      label: readFormString(form, 'label'),
    });
    return redirect(
      `/moje/${slug}/?ok=` +
        encodeURIComponent(
          `Utworzono link ${permission === 'edit' ? 'do edycji' : 'do odczytu'}: /w/${share.token}/`,
        ) +
        `&share=${encodeURIComponent(share.token)}`,
    );
  } catch (error) {
    return redirect(
      `/moje/${slug}/?error=` +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się utworzyć linku.'),
    );
  }
};

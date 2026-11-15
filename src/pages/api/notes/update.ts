import type { APIRoute } from 'astro';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireUser,
} from '../../../lib/server/http';
import { updateNote } from '../../../lib/server/user-notes';

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
    return redirect(`/moje/${slug}/edytuj/?error=` + encodeURIComponent(unsafe));
  }

  try {
    const note = await updateNote(auth.user.id, slug, {
      title: readFormString(form, 'title'),
      description: readFormString(form, 'description'),
      body: readFormString(form, 'body'),
    });
    if (!note) {
      return redirect('/moje/?error=' + encodeURIComponent('Nie ma takiej notatki.'));
    }
    return redirect(`/moje/${note.slug}/?ok=` + encodeURIComponent('Zapisano.'));
  } catch (error) {
    return redirect(
      `/moje/${slug}/edytuj/?error=` +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się zapisać.'),
    );
  }
};

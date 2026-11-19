import type { APIRoute } from 'astro';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireUser,
} from '../../../lib/server/http';
import { listNoteFolders, validFolderId } from '../../../lib/server/note-folders';
import { createNote } from '../../../lib/server/user-notes';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireUser(context);
  if (auth instanceof Response) return auth;

  const formOrErr = await parseForm(context.request);
  if (formOrErr instanceof Response) return formOrErr;
  const form = formOrErr;

  const unsafe = assertSafeMutation(context, auth, form);
  if (unsafe) {
    return redirect('/moje/nowa/?error=' + encodeURIComponent(unsafe));
  }

  const folderId = readFormString(form, 'folder');
  if (folderId && (!validFolderId(folderId) || !(await listNoteFolders(auth.user.id)).some(folder => folder.id === folderId))) {
    return redirect('/moje/nowa/?error=' + encodeURIComponent('Nie znaleziono folderu.'));
  }
  try {
    const note = await createNote({
      userId: auth.user.id,
      folderId: folderId || undefined,
      title: readFormString(form, 'title'),
      description: readFormString(form, 'description'),
      body: readFormString(form, 'body'),
      slug: readFormString(form, 'slug') || undefined,
    });
    return redirect(`/moje/${note.slug}/`);
  } catch (error) {
    return redirect(
      '/moje/nowa/?error=' +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się zapisać.'),
    );
  }
};

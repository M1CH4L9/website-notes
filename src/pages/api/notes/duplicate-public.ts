import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  assertSafeMutation,
  parseForm,
  readFormString,
  redirect,
  requireUser,
} from '../../../lib/server/http';
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
    return redirect('/moje/?error=' + encodeURIComponent(unsafe));
  }

  const subject = readFormString(form, 'subject');
  const noteSlug = readFormString(form, 'note');
  if (!subject || !noteSlug) {
    return redirect('/moje/?error=' + encodeURIComponent('Brak adresu notatki publicznej.'));
  }

  const notes = await getCollection('notes');
  const entry = notes.find((n) => n.id === `${subject}/${noteSlug}`);
  if (!entry) {
    return redirect('/moje/?error=' + encodeURIComponent('Nie znaleziono notatki publicznej.'));
  }

  const body = typeof entry.body === 'string' ? entry.body : '';
  const sourcePath = `/przedmioty/${subject}/${noteSlug}/`;

  try {
    const note = await createNote({
      userId: auth.user.id,
      title: entry.data.title,
      description: entry.data.description,
      body,
      sourcePublicPath: sourcePath,
    });
    return redirect(`/moje/${note.slug}/edytuj/?ok=` + encodeURIComponent('Skopiowano z notatek publicznych.'));
  } catch (error) {
    return redirect(
      '/moje/?error=' +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się skopiować.'),
    );
  }
};

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
import { getPublicationById } from '../../../lib/server/publication-notes';

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
  const publicationId = readFormString(form, 'publication_id');
  if (!subject || !noteSlug) {
    return redirect('/moje/?error=' + encodeURIComponent('Brak adresu notatki publicznej.'));
  }

  const sourcePath = `/przedmioty/${subject}/${noteSlug}/`;

  try {
    if (publicationId) {
      const pub = await getPublicationById(publicationId);
      if (!pub || !pub.is_active || pub.subject_slug !== subject || pub.slug !== noteSlug) {
        return redirect('/moje/?error=' + encodeURIComponent('Nie znaleziono publikacji.'));
      }
      const note = await createNote({
        userId: auth.user.id,
        title: pub.title,
        description: pub.description ?? undefined,
        body: pub.body,
        sourcePublicPath: sourcePath,
      });
      return redirect(
        `/moje/${note.slug}/edytuj/?ok=` + encodeURIComponent('Skopiowano z notatek publicznych.'),
      );
    }

    const notes = await getCollection('notes');
    const entry = notes.find((n) => n.id === `${subject}/${noteSlug}`);
    if (!entry) {
      return redirect('/moje/?error=' + encodeURIComponent('Nie znaleziono notatki publicznej.'));
    }

    const body = typeof entry.body === 'string' ? entry.body : '';
    const note = await createNote({
      userId: auth.user.id,
      title: entry.data.title,
      description: entry.data.description,
      body,
      sourcePublicPath: sourcePath,
    });
    return redirect(
      `/moje/${note.slug}/edytuj/?ok=` + encodeURIComponent('Skopiowano z notatek publicznych.'),
    );
  } catch (error) {
    return redirect(
      '/moje/?error=' +
        encodeURIComponent(error instanceof Error ? error.message : 'Nie udało się skopiować.'),
    );
  }
};

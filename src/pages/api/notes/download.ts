import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildNoteMarkdown, markdownDownloadResponse, noteFilename } from '../../../lib/note-export';
import { getAuthFromCookies } from '../../../lib/server/sessions';
import { getPublication, getPublicationById } from '../../../lib/server/publication-notes';
import { getActiveShareByToken } from '../../../lib/server/shares';
import { getNoteByUserAndSlug } from '../../../lib/server/user-notes';
import { isDatabaseConfigured } from '../../../lib/server/env';
import { json } from '../../../lib/server/http';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const kind = context.url.searchParams.get('kind') || '';
  const format = context.url.searchParams.get('format') || 'md';
  if (!['md', 'pdf'].includes(format)) return json({ error: 'Nieznany format.' }, 400);
  const respond = async (markdown: string, filename: string) => {
    if (format === 'md') return markdownDownloadResponse(markdown, filename);
    const { createNotePdf } = await import('../../../lib/server/note-pdf');
    const bytes = await createNotePdf(markdown, context.url.searchParams.get('subject') || '');
    return new Response(Buffer.from(bytes), { headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}.pdf"`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    } });
  };

  try {
    if (kind === 'public') {
      const subject = context.url.searchParams.get('subject') || '';
      const noteSlug = context.url.searchParams.get('note') || '';
      if (!subject || !noteSlug) return json({ error: 'Brak adresu notatki.' }, 400);

      const notes = await getCollection('notes', ({ data }) => import.meta.env.DEV || !data.draft);
      const entry = notes.find((n) => n.id === `${subject}/${noteSlug}`);
      if (entry) {
        const body = typeof entry.body === 'string' ? entry.body : '';
        const markdown = buildNoteMarkdown({
          title: entry.data.title,
          description: entry.data.description,
          updated: entry.data.updated,
          body,
        });
        return await respond(markdown, noteFilename(noteSlug, entry.data.title));
      }

      if (!isDatabaseConfigured()) return json({ error: 'Nie znaleziono notatki.' }, 404);
      const pub = await getPublication(subject, noteSlug);
      if (!pub) return json({ error: 'Nie znaleziono notatki.' }, 404);
      const markdown = buildNoteMarkdown({
        title: pub.title,
        description: pub.description,
        updated: pub.updated_at,
        body: pub.body,
      });
      return await respond(markdown, noteFilename(noteSlug, pub.title));
    }

    if (kind === 'publication') {
      if (!isDatabaseConfigured()) return json({ error: 'Baza nie jest podłączona.' }, 503);
      const id = context.url.searchParams.get('id') || '';
      if (!id) return json({ error: 'Brak identyfikatora publikacji.' }, 400);
      const pub = await getPublicationById(id);
      if (!pub || !pub.is_active) return json({ error: 'Nie znaleziono publikacji.' }, 404);
      const markdown = buildNoteMarkdown({
        title: pub.title,
        description: pub.description,
        updated: pub.updated_at,
        body: pub.body,
      });
      return await respond(markdown, noteFilename(pub.slug, pub.title));
    }

    if (kind === 'mine') {
      if (!isDatabaseConfigured()) return json({ error: 'Baza nie jest podłączona.' }, 503);
      const auth = await getAuthFromCookies(context.cookies);
      if (!auth) return json({ error: 'Zaloguj się, żeby pobrać notatkę.' }, 401);
      const slug = context.url.searchParams.get('slug') || '';
      if (!slug) return json({ error: 'Brak adresu notatki.' }, 400);
      const note = await getNoteByUserAndSlug(auth.user.id, slug);
      if (!note) return json({ error: 'Nie znaleziono notatki.' }, 404);
      const markdown = buildNoteMarkdown({
        title: note.title,
        description: note.description,
        updated: note.updated_at,
        body: note.body,
      });
      return await respond(markdown, noteFilename(note.slug, note.title));
    }

    if (kind === 'share') {
      if (!isDatabaseConfigured()) return json({ error: 'Baza nie jest podłączona.' }, 503);
      const token = context.url.searchParams.get('token') || '';
      if (!token) return json({ error: 'Brak tokenu.' }, 400);
      const share = await getActiveShareByToken(token);
      if (!share) return json({ error: 'Link jest nieważny.' }, 404);
      const note = share.note;
      const markdown = buildNoteMarkdown({
        title: note.title,
        description: note.description,
        updated: note.updated_at,
        body: note.body,
      });
      return await respond(markdown, noteFilename(note.slug, note.title));
    }

    return json({ error: 'Nieznany rodzaj pobierania.' }, 400);
  } catch (error) {
    console.error('[notes/download]', error);
    const busy = error instanceof Error && error.message === 'PDF_BUSY';
    return json({ error: busy ? 'Trwa generowanie innego PDF. Spróbuj za chwilę.' : format === 'pdf' ? 'Nie udało się przygotować pliku PDF lub wczytać jego obrazków. Spróbuj ponownie albo pobierz Markdown.' : 'Nie udało się przygotować pliku.' }, busy ? 503 : 500);
  }
};

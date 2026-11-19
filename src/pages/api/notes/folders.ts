import type { APIRoute } from 'astro';
import { query } from '../../../lib/server/db';
import { formMessage, assertSafeMutation, parseForm, readFormString, requireUser } from '../../../lib/server/http';
import { validFolderId } from '../../../lib/server/note-folders';

export const POST: APIRoute = async context => {
  const auth = await requireUser(context);
  if (auth instanceof Response) return auth;
  const form = await parseForm(context.request);
  if (form instanceof Response) return form;
  const invalid = assertSafeMutation(context, auth, form);
  const id = readFormString(form, 'id');
  const action = readFormString(form, 'action');
  const path = action === 'rename' && validFolderId(id) ? `/moje/?folder=${id}` : '/moje/';
  const fail = (message: string) => formMessage(path, 'error', message);
  if (invalid) return fail(invalid);
  if (id && !validFolderId(id)) return fail('Nieprawidłowy folder.');
  const owner = auth.user.id;
  try {
    if (action === 'move') {
      const slug = readFormString(form, 'slug');
      const result = await query(`UPDATE user_notes SET folder_id = $3
        WHERE user_id = $1 AND slug = $2 AND ($3::uuid IS NULL OR EXISTS (
          SELECT 1 FROM user_note_folders WHERE user_id = $1 AND id = $3
        ))`, [owner, slug, id || null]);
      return result.rowCount
        ? formMessage(id ? `/moje/?folder=${id}` : '/moje/?folder=none', 'ok', 'Notatka przeniesiona.')
        : fail('Nie znaleziono notatki lub folderu.');
    }
    if (action === 'delete' && id) {
      const result = await query('DELETE FROM user_note_folders WHERE user_id = $1 AND id = $2', [owner, id]);
      return result.rowCount ? formMessage(path, 'ok', 'Folder usunięty. Jego notatki znajdziesz w „Bez folderu”.') : fail('Nie znaleziono folderu.');
    }
    if (action !== 'create' && action !== 'rename') return fail('Nieprawidłowa operacja.');
    const name = readFormString(form, 'name').trim();
    if (!name || name.length > 80) return fail('Podaj nazwę folderu o długości do 80 znaków.');
    if (action === 'rename' && !id) return fail('Nie znaleziono folderu.');
    const { rows: [folder] } = action === 'create'
      ? await query<{ id: string }>('INSERT INTO user_note_folders (user_id, name) VALUES ($1, $2) RETURNING id', [owner, name])
      : await query<{ id: string }>('UPDATE user_note_folders SET name = $2 WHERE user_id = $1 AND id = $3 RETURNING id', [owner, name, id]);
    return folder ? formMessage(`/moje/?folder=${folder.id}`, 'ok', 'Folder zapisany.') : fail('Nie znaleziono folderu.');
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === '23505') return fail('Masz już folder o tej nazwie.');
    if (code === '23503') return fail('Wybrany folder już nie istnieje.');
    throw error;
  }
};

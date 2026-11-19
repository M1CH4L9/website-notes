import { query } from './db';

export type NoteFolder = { id: string; name: string };
export const validFolderId = (value: string) => /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);

export async function listNoteFolders(userId: string): Promise<NoteFolder[]> {
  const { rows } = await query<NoteFolder>('SELECT id, name FROM user_note_folders WHERE user_id = $1 ORDER BY lower(name), id', [userId]);
  return rows;
}

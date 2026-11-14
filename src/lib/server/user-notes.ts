import { query } from './db';
import { assertSlug, slugifyTitle } from './slugs';

export type UserNote = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  is_public: boolean;
  source_public_path: string | null;
  created_at: Date;
  updated_at: Date;
};

export type UserNoteWithAuthor = UserNote & {
  username: string;
};

export async function listNotesForUser(userId: string): Promise<UserNote[]> {
  const { rows } = await query<UserNote>(
    `SELECT * FROM user_notes WHERE user_id = $1 ORDER BY updated_at DESC`,
    [userId],
  );
  return rows;
}

export async function getNoteByUserAndSlug(
  userId: string,
  slug: string,
): Promise<UserNote | null> {
  const { rows } = await query<UserNote>(
    `SELECT * FROM user_notes WHERE user_id = $1 AND slug = $2 LIMIT 1`,
    [userId, slug],
  );
  return rows[0] ?? null;
}

export async function getPublicNote(
  username: string,
  slug: string,
): Promise<UserNoteWithAuthor | null> {
  const { rows } = await query<UserNoteWithAuthor>(
    `SELECT n.*, u.username
     FROM user_notes n
     JOIN users u ON u.id = n.user_id
     WHERE lower(u.username) = lower($1) AND n.slug = $2 AND n.is_public = TRUE
     LIMIT 1`,
    [username, slug],
  );
  return rows[0] ?? null;
}

export async function uniqueSlugForUser(userId: string, title: string, preferred?: string): Promise<string> {
  let base = preferred?.trim() || slugifyTitle(title);
  const err = assertSlug(base);
  if (err) base = slugifyTitle(title);

  let candidate = base;
  for (let i = 2; i < 100; i++) {
    const existing = await getNoteByUserAndSlug(userId, candidate);
    if (!existing) return candidate;
    const suffix = `-${i}`;
    candidate = `${base.slice(0, 80 - suffix.length)}${suffix}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createNote(input: {
  userId: string;
  title: string;
  description?: string;
  body?: string;
  slug?: string;
  sourcePublicPath?: string;
}): Promise<UserNote> {
  const title = input.title.trim();
  if (!title) throw new Error('Tytuł jest wymagany.');
  if (title.length > 200) throw new Error('Tytuł jest za długi.');
  const description = input.description?.trim() || null;
  if (description && description.length > 500) throw new Error('Opis jest za długi.');
  const body = input.body ?? '';
  if (body.length > 200_000) throw new Error('Treść jest za długa.');

  const slug = await uniqueSlugForUser(input.userId, title, input.slug);
  const { rows } = await query<UserNote>(
    `INSERT INTO user_notes (user_id, slug, title, description, body, source_public_path)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [input.userId, slug, title, description, body, input.sourcePublicPath ?? null],
  );
  return rows[0];
}

export async function updateNote(
  userId: string,
  slug: string,
  input: { title: string; description?: string; body: string },
): Promise<UserNote | null> {
  const title = input.title.trim();
  if (!title) throw new Error('Tytuł jest wymagany.');
  if (title.length > 200) throw new Error('Tytuł jest za długi.');
  const description = input.description?.trim() || null;
  if (description && description.length > 500) throw new Error('Opis jest za długi.');
  if (input.body.length > 200_000) throw new Error('Treść jest za długa.');

  const { rows } = await query<UserNote>(
    `UPDATE user_notes
     SET title = $3,
         description = $4,
         body = $5,
         updated_at = now()
     WHERE user_id = $1 AND slug = $2
     RETURNING *`,
    [userId, slug, title, description, input.body],
  );
  return rows[0] ?? null;
}

export async function deleteNote(userId: string, slug: string): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM user_notes WHERE user_id = $1 AND slug = $2`,
    [userId, slug],
  );
  return (rowCount ?? 0) > 0;
}

export async function setNotePublic(noteId: string, isPublic: boolean): Promise<void> {
  await query(`UPDATE user_notes SET is_public = $2, updated_at = now() WHERE id = $1`, [
    noteId,
    isPublic,
  ]);
}

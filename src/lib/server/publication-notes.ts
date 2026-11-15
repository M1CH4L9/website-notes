import { query } from './db';
import { assertSlug, slugifyTitle } from './slugs';

export type Publication = {
  id: string;
  subject_slug: string;
  slug: string;
  title: string;
  description: string | null;
  body: string;
  author_user_id: string | null;
  author_username: string;
  source_note_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function listActivePublications(): Promise<Publication[]> {
  const { rows } = await query<Publication>(
    `SELECT * FROM publications WHERE is_active = TRUE ORDER BY updated_at DESC`,
  );
  return rows;
}

export async function listPublicationsBySubject(subjectSlug: string): Promise<Publication[]> {
  const { rows } = await query<Publication>(
    `SELECT * FROM publications
     WHERE subject_slug = $1 AND is_active = TRUE
     ORDER BY updated_at DESC`,
    [subjectSlug],
  );
  return rows;
}

export async function listAllPublicationsAdmin(): Promise<Publication[]> {
  const { rows } = await query<Publication>(
    `SELECT * FROM publications ORDER BY updated_at DESC LIMIT 200`,
  );
  return rows;
}

export async function getPublication(
  subjectSlug: string,
  slug: string,
): Promise<Publication | null> {
  const { rows } = await query<Publication>(
    `SELECT * FROM publications
     WHERE subject_slug = $1 AND slug = $2 AND is_active = TRUE
     LIMIT 1`,
    [subjectSlug, slug],
  );
  return rows[0] ?? null;
}

export async function getPublicationById(id: string): Promise<Publication | null> {
  const { rows } = await query<Publication>(
    `SELECT * FROM publications WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getPublicationForSourceNote(
  noteId: string,
): Promise<Publication | null> {
  const { rows } = await query<Publication>(
    `SELECT * FROM publications
     WHERE source_note_id = $1 AND is_active = TRUE
     ORDER BY updated_at DESC
     LIMIT 1`,
    [noteId],
  );
  return rows[0] ?? null;
}

export async function mapPublicationsForSourceNotes(
  noteIds: string[],
): Promise<Map<string, Publication>> {
  const map = new Map<string, Publication>();
  if (noteIds.length === 0) return map;
  const { rows } = await query<Publication>(
    `SELECT DISTINCT ON (source_note_id) *
     FROM publications
     WHERE source_note_id = ANY($1::uuid[]) AND is_active = TRUE
     ORDER BY source_note_id, updated_at DESC`,
    [noteIds],
  );
  for (const row of rows) {
    if (row.source_note_id) map.set(row.source_note_id, row);
  }
  return map;
}

async function uniquePublicationSlug(subjectSlug: string, preferred: string): Promise<string> {
  let base = preferred;
  const err = assertSlug(base);
  if (err) base = slugifyTitle(preferred);

  let candidate = base.slice(0, 80);
  for (let i = 2; i < 100; i++) {
    const { rows } = await query<{ id: string }>(
      `SELECT id FROM publications WHERE subject_slug = $1 AND slug = $2 LIMIT 1`,
      [subjectSlug, candidate],
    );
    if (!rows[0]) return candidate;
    const suffix = `-${i}`;
    candidate = `${base.slice(0, 80 - suffix.length)}${suffix}`;
  }
  return `${base.slice(0, 60)}-${Date.now().toString(36)}`;
}

export async function createPublication(input: {
  subjectSlug: string;
  slugPreferred: string;
  title: string;
  description?: string | null;
  body: string;
  authorUserId: string | null;
  authorUsername: string;
  sourceNoteId: string | null;
}): Promise<Publication> {
  const title = input.title.trim();
  if (!title) throw new Error('Tytuł publikacji jest wymagany.');
  const slug = await uniquePublicationSlug(input.subjectSlug, input.slugPreferred);
  const description = input.description?.trim() || null;

  const { rows } = await query<Publication>(
    `INSERT INTO publications
      (subject_slug, slug, title, description, body, author_user_id, author_username, source_note_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.subjectSlug,
      slug,
      title,
      description,
      input.body,
      input.authorUserId,
      input.authorUsername,
      input.sourceNoteId,
    ],
  );
  return rows[0];
}

export async function updatePublication(
  id: string,
  patch: {
    subjectSlug?: string;
    title?: string;
    description?: string | null;
    body?: string;
  },
): Promise<Publication> {
  const current = await getPublicationById(id);
  if (!current) throw new Error('Nie ma takiej publikacji.');

  const subjectSlug = patch.subjectSlug ?? current.subject_slug;
  const title = patch.title?.trim() ?? current.title;
  const description =
    patch.description !== undefined ? patch.description?.trim() || null : current.description;
  const body = patch.body ?? current.body;

  let slug = current.slug;
  if (subjectSlug !== current.subject_slug) {
    slug = await uniquePublicationSlug(subjectSlug, current.slug);
  }

  const { rows } = await query<Publication>(
    `UPDATE publications
     SET subject_slug = $2,
         slug = $3,
         title = $4,
         description = $5,
         body = $6,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, subjectSlug, slug, title, description, body],
  );
  return rows[0];
}

export async function setPublicationActive(id: string, isActive: boolean): Promise<Publication> {
  const { rows } = await query<Publication>(
    `UPDATE publications SET is_active = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, isActive],
  );
  if (!rows[0]) throw new Error('Nie ma takiej publikacji.');
  return rows[0];
}

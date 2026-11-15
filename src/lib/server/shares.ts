import { randomBytes } from 'node:crypto';
import { query } from './db';
import type { UserNote } from './user-notes';

export type SharePermission = 'read' | 'edit';

export type NoteShare = {
  id: string;
  note_id: string;
  token: string;
  permission: SharePermission;
  label: string | null;
  created_by: string;
  created_at: Date;
  revoked_at: Date | null;
  last_used_at: Date | null;
};

export type NoteShareWithNote = NoteShare & {
  note: UserNote;
  owner_username: string;
};

export type PresenceRow = {
  note_id: string;
  client_id: string;
  display_name: string;
  can_edit: boolean;
  last_seen: Date;
};

function newToken(): string {
  return randomBytes(18).toString('base64url');
}

export async function listSharesForNote(noteId: string): Promise<NoteShare[]> {
  const { rows } = await query<NoteShare>(
    `SELECT * FROM note_shares
     WHERE note_id = $1 AND revoked_at IS NULL
     ORDER BY created_at DESC`,
    [noteId],
  );
  return rows;
}

export async function createShare(input: {
  noteId: string;
  userId: string;
  permission: SharePermission;
  label?: string;
}): Promise<NoteShare> {
  if (input.permission !== 'read' && input.permission !== 'edit') {
    throw new Error('Nieprawidłowe uprawnienie.');
  }
  const label = input.label?.trim() || null;
  if (label && label.length > 80) throw new Error('Etykieta jest za długa.');

  for (let attempt = 0; attempt < 5; attempt++) {
    const token = newToken();
    try {
      const { rows } = await query<NoteShare>(
        `INSERT INTO note_shares (note_id, token, permission, label, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [input.noteId, token, input.permission, label, input.userId],
      );
      return rows[0];
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === '23505') continue;
      throw error;
    }
  }
  throw new Error('Nie udało się wygenerować unikalnego linku.');
}

export async function revokeShare(input: {
  shareId: string;
  userId: string;
}): Promise<boolean> {
  const { rowCount } = await query(
    `UPDATE note_shares s
     SET revoked_at = now()
     FROM user_notes n
     WHERE s.id = $1
       AND s.note_id = n.id
       AND n.user_id = $2
       AND s.revoked_at IS NULL`,
    [input.shareId, input.userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function getActiveShareByToken(
  token: string,
): Promise<NoteShareWithNote | null> {
  const { rows } = await query<{
    share_id: string;
    note_id: string;
    token: string;
    permission: SharePermission;
    label: string | null;
    created_by: string;
    share_created_at: Date;
    revoked_at: Date | null;
    last_used_at: Date | null;
    owner_username: string;
    id: string;
    user_id: string;
    slug: string;
    title: string;
    description: string | null;
    body: string;
    is_public: boolean;
    source_public_path: string | null;
    revision: number;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT
        s.id AS share_id,
        s.note_id,
        s.token,
        s.permission,
        s.label,
        s.created_by,
        s.created_at AS share_created_at,
        s.revoked_at,
        s.last_used_at,
        u.username AS owner_username,
        n.id,
        n.user_id,
        n.slug,
        n.title,
        n.description,
        n.body,
        n.is_public,
        n.source_public_path,
        n.revision,
        n.created_at,
        n.updated_at
     FROM note_shares s
     JOIN user_notes n ON n.id = s.note_id
     JOIN users u ON u.id = n.user_id
     WHERE s.token = $1 AND s.revoked_at IS NULL
     LIMIT 1`,
    [token],
  );
  const row = rows[0];
  if (!row) return null;

  await query(`UPDATE note_shares SET last_used_at = now() WHERE id = $1`, [row.share_id]);

  return {
    id: row.share_id,
    note_id: row.note_id,
    token: row.token,
    permission: row.permission,
    label: row.label,
    created_by: row.created_by,
    created_at: row.share_created_at,
    revoked_at: row.revoked_at,
    last_used_at: row.last_used_at,
    owner_username: row.owner_username,
    note: {
      id: row.id,
      user_id: row.user_id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      body: row.body,
      is_public: row.is_public,
      source_public_path: row.source_public_path,
      revision: row.revision,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  };
}

export async function touchPresence(input: {
  noteId: string;
  clientId: string;
  displayName: string;
  canEdit: boolean;
}): Promise<void> {
  const name = input.displayName.trim().slice(0, 64) || 'Gość';
  const clientId = input.clientId.trim().slice(0, 80);
  if (clientId.length < 8) return;

  await query(
    `INSERT INTO note_presence (note_id, client_id, display_name, can_edit, last_seen)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (note_id, client_id)
     DO UPDATE SET display_name = EXCLUDED.display_name,
                   can_edit = EXCLUDED.can_edit,
                   last_seen = now()`,
    [input.noteId, clientId, name, input.canEdit],
  );

  await query(
    `DELETE FROM note_presence
     WHERE note_id = $1 AND last_seen < now() - interval '45 seconds'`,
    [input.noteId],
  );
}

export async function listPresence(noteId: string): Promise<PresenceRow[]> {
  const { rows } = await query<PresenceRow>(
    `SELECT * FROM note_presence
     WHERE note_id = $1 AND last_seen > now() - interval '30 seconds'
     ORDER BY last_seen DESC`,
    [noteId],
  );
  return rows;
}

export async function getNoteRevision(noteId: string): Promise<{
  revision: number;
  title: string;
  description: string | null;
  body: string;
  updated_at: Date;
} | null> {
  const { rows } = await query<{
    revision: number;
    title: string;
    description: string | null;
    body: string;
    updated_at: Date;
  }>(
    `SELECT revision, title, description, body, updated_at FROM user_notes WHERE id = $1 LIMIT 1`,
    [noteId],
  );
  return rows[0] ?? null;
}

export async function saveSharedNote(input: {
  noteId: string;
  expectedRevision: number;
  title: string;
  description?: string;
  body: string;
}): Promise<
  | { ok: true; revision: number; updated_at: Date }
  | {
      ok: false;
      conflict: true;
      revision: number;
      title: string;
      description: string | null;
      body: string;
      updated_at: Date;
    }
> {
  const title = input.title.trim();
  if (!title) throw new Error('Tytuł jest wymagany.');
  if (title.length > 200) throw new Error('Tytuł jest za długi.');
  const description = input.description?.trim() || null;
  if (description && description.length > 500) throw new Error('Opis jest za długi.');
  if (input.body.length > 200_000) throw new Error('Treść jest za długa.');

  const { rows } = await query<{
    revision: number;
    updated_at: Date;
  }>(
    `UPDATE user_notes
     SET title = $3,
         description = $4,
         body = $5,
         revision = revision + 1,
         updated_at = now()
     WHERE id = $1 AND revision = $2
     RETURNING revision, updated_at`,
    [input.noteId, input.expectedRevision, title, description, input.body],
  );

  if (rows[0]) {
    return { ok: true, revision: rows[0].revision, updated_at: rows[0].updated_at };
  }

  const current = await getNoteRevision(input.noteId);
  if (!current) throw new Error('Nie ma takiej notatki.');
  return {
    ok: false,
    conflict: true,
    revision: current.revision,
    title: current.title,
    description: current.description,
    body: current.body,
    updated_at: current.updated_at,
  };
}

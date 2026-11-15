import { query } from './db';
import { setNotePublic, type UserNote } from './user-notes';

export type PublishRequest = {
  id: string;
  note_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  admin_note: string | null;
  created_at: Date;
  resolved_at: Date | null;
};

export type PublishRequestView = PublishRequest & {
  username: string;
  note_title: string;
  note_slug: string;
  note_body: string;
  note_description: string | null;
  note_is_public: boolean;
};

export async function requestPublish(input: {
  userId: string;
  note: UserNote;
  message?: string;
}): Promise<PublishRequest> {
  if (input.note.user_id !== input.userId) throw new Error('To nie jest Twoja notatka.');
  if (input.note.is_public) throw new Error('Notatka jest już publiczna.');

  const { rows: existing } = await query<PublishRequest>(
    `SELECT * FROM publish_requests WHERE note_id = $1 AND status = 'pending' LIMIT 1`,
    [input.note.id],
  );
  if (existing[0]) throw new Error('Prośba dla tej notatki już czeka.');

  const message = input.message?.trim() || null;
  if (message && message.length > 500) throw new Error('Wiadomość jest za długa.');

  const { rows } = await query<PublishRequest>(
    `INSERT INTO publish_requests (note_id, user_id, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.note.id, input.userId, message],
  );
  return rows[0];
}

export async function listPendingRequests(): Promise<PublishRequestView[]> {
  const { rows } = await query<PublishRequestView>(
    `SELECT r.*, u.username,
            n.title AS note_title, n.slug AS note_slug, n.body AS note_body,
            n.description AS note_description, n.is_public AS note_is_public
     FROM publish_requests r
     JOIN users u ON u.id = r.user_id
     JOIN user_notes n ON n.id = r.note_id
     WHERE r.status = 'pending'
     ORDER BY r.created_at ASC`,
  );
  return rows;
}

export async function listRequestsForUser(userId: string): Promise<PublishRequestView[]> {
  const { rows } = await query<PublishRequestView>(
    `SELECT r.*, u.username,
            n.title AS note_title, n.slug AS note_slug, n.body AS note_body,
            n.description AS note_description, n.is_public AS note_is_public
     FROM publish_requests r
     JOIN users u ON u.id = r.user_id
     JOIN user_notes n ON n.id = r.note_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT 50`,
    [userId],
  );
  return rows;
}

export async function resolveRequest(input: {
  requestId: string;
  accept: boolean;
  adminNote?: string;
}): Promise<PublishRequest> {
  const { rows } = await query<PublishRequest>(
    `SELECT * FROM publish_requests WHERE id = $1 LIMIT 1`,
    [input.requestId],
  );
  const req = rows[0];
  if (!req) throw new Error('Nie ma takiej prośby.');
  if (req.status !== 'pending') throw new Error('Prośba jest już rozpatrzona.');

  const status = input.accept ? 'accepted' : 'rejected';
  const adminNote = input.adminNote?.trim() || null;

  const { rows: updated } = await query<PublishRequest>(
    `UPDATE publish_requests
     SET status = $2, admin_note = $3, resolved_at = now()
     WHERE id = $1
     RETURNING *`,
    [input.requestId, status, adminNote],
  );

  if (input.accept) {
    await setNotePublic(req.note_id, true);
  }

  return updated[0];
}

export async function latestRequestForNote(noteId: string): Promise<PublishRequest | null> {
  const { rows } = await query<PublishRequest>(
    `SELECT * FROM publish_requests WHERE note_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [noteId],
  );
  return rows[0] ?? null;
}
